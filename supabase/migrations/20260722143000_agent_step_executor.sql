-- Durable execution leases for individual RAMROD agent steps.

alter table public.agent_steps
  add column if not exists attempts integer not null default 0 check (attempts >= 0),
  add column if not exists max_attempts integer not null default 3 check (max_attempts between 1 and 20),
  add column if not exists run_after timestamptz not null default now(),
  add column if not exists locked_by uuid references public.workers(id) on delete set null,
  add column if not exists locked_at timestamptz,
  add column if not exists lease_expires_at timestamptz;

create index if not exists agent_steps_executor_queue_idx
  on public.agent_steps(status, run_after, execution_mode, action_type, agent_run_id, ordinal);
create index if not exists agent_steps_locked_by_idx
  on public.agent_steps(locked_by) where locked_by is not null;

create or replace function public.claim_ramrod_agent_step(
  p_worker_id uuid,
  p_organization_id uuid,
  p_execution_modes text[],
  p_action_types text[],
  p_step_keys text[],
  p_lease_seconds integer default 180
)
returns setof public.agent_steps
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.workers
  set status = 'online', last_seen_at = now()
  where id = p_worker_id;

  return query
  with candidate as (
    select candidate_step.id
    from public.agent_steps as candidate_step
    join public.agent_runs as candidate_run on candidate_run.id = candidate_step.agent_run_id
    where (p_organization_id is null or candidate_run.organization_id = p_organization_id)
      and candidate_run.status in ('queued', 'planning', 'waiting_approval', 'ready', 'running')
      and candidate_step.status in ('planned', 'approved')
      and candidate_step.run_after <= now()
      and candidate_step.attempts < candidate_step.max_attempts
      and (coalesce(array_length(p_execution_modes, 1), 0) = 0 or candidate_step.execution_mode = any(p_execution_modes))
      and (coalesce(array_length(p_action_types, 1), 0) = 0 or candidate_step.action_type = any(p_action_types))
      and (coalesce(array_length(p_step_keys, 1), 0) = 0 or candidate_step.step_key = any(p_step_keys))
      and (candidate_step.approval_required = false or candidate_step.status = 'approved')
      and not exists (
        select 1
        from public.agent_steps as prior_step
        where prior_step.agent_run_id = candidate_step.agent_run_id
          and prior_step.ordinal < candidate_step.ordinal
          and prior_step.status not in ('succeeded', 'skipped')
      )
    order by candidate_run.created_at asc, candidate_step.ordinal asc
    for update of candidate_step skip locked
    limit 1
  ), claimed as (
    update public.agent_steps as claimed_step
    set
      status = 'running',
      attempts = claimed_step.attempts + 1,
      locked_by = p_worker_id,
      locked_at = now(),
      lease_expires_at = now() + make_interval(secs => greatest(30, least(p_lease_seconds, 3600))),
      started_at = coalesce(claimed_step.started_at, now()),
      error = null
    from candidate
    where claimed_step.id = candidate.id
    returning claimed_step.*
  ), mark_run as (
    update public.agent_runs as active_run
    set status = 'running', started_at = coalesce(active_run.started_at, now())
    from claimed
    where active_run.id = claimed.agent_run_id
    returning active_run.id
  )
  select claimed.* from claimed;
end;
$$;

create or replace function public.finish_ramrod_agent_step(
  p_step_id uuid,
  p_worker_id uuid,
  p_succeeded boolean,
  p_output jsonb default null,
  p_error jsonb default null,
  p_retry_delay_seconds integer default 30
)
returns setof public.agent_steps
language plpgsql
security definer
set search_path = public
as $$
declare
  current_step public.agent_steps%rowtype;
  next_step public.agent_steps%rowtype;
  retryable boolean := coalesce((p_error ->> 'retryable')::boolean, true);
  final_failure boolean;
begin
  select * into current_step
  from public.agent_steps
  where id = p_step_id
    and status = 'running'
    and locked_by = p_worker_id
  for update;

  if not found then
    return;
  end if;

  final_failure := not p_succeeded and (not retryable or current_step.attempts >= current_step.max_attempts);

  update public.agent_steps as finished_step
  set
    status = case
      when p_succeeded then 'succeeded'
      when final_failure then 'failed'
      when finished_step.approval_required then 'approved'
      else 'planned'
    end,
    output = case when p_succeeded then coalesce(p_output, '{}'::jsonb) else finished_step.output end,
    error = case when p_succeeded then null else coalesce(p_error, '{}'::jsonb) end,
    run_after = case
      when not p_succeeded and not final_failure
        then now() + make_interval(secs => greatest(1, least(p_retry_delay_seconds, 86400)))
      else finished_step.run_after
    end,
    completed_at = case when p_succeeded or final_failure then now() else null end,
    locked_by = null,
    locked_at = null,
    lease_expires_at = null
  where finished_step.id = current_step.id;

  if final_failure then
    update public.agent_runs
    set status = 'failed', error = coalesce(p_error, '{}'::jsonb), completed_at = now()
    where id = current_step.agent_run_id;
  elsif not p_succeeded then
    update public.agent_runs set status = 'ready'
    where id = current_step.agent_run_id;
  else
    select * into next_step
    from public.agent_steps
    where agent_run_id = current_step.agent_run_id
      and ordinal > current_step.ordinal
      and status not in ('succeeded', 'skipped', 'cancelled')
    order by ordinal asc
    limit 1;

    if not found then
      update public.agent_runs
      set status = 'succeeded', result = coalesce(p_output, '{}'::jsonb), completed_at = now()
      where id = current_step.agent_run_id;
    elsif next_step.approval_required and next_step.status = 'planned' then
      update public.agent_steps set status = 'waiting_approval'
      where id = next_step.id;
      update public.agent_runs set status = 'waiting_approval'
      where id = current_step.agent_run_id;
    elsif next_step.status = 'waiting_approval' then
      update public.agent_runs set status = 'waiting_approval'
      where id = current_step.agent_run_id;
    else
      update public.agent_runs set status = 'ready'
      where id = current_step.agent_run_id;
    end if;
  end if;

  return query select * from public.agent_steps where id = current_step.id;
end;
$$;

create or replace function public.renew_ramrod_agent_step_lease(
  p_step_id uuid,
  p_worker_id uuid,
  p_lease_seconds integer default 180
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  renewed_count integer;
begin
  update public.agent_steps
  set lease_expires_at = now() + make_interval(secs => greatest(30, least(p_lease_seconds, 3600)))
  where id = p_step_id and status = 'running' and locked_by = p_worker_id;
  get diagnostics renewed_count = row_count;

  if renewed_count = 1 then
    update public.workers set status = 'busy', last_seen_at = now()
    where id = p_worker_id;
  end if;
  return renewed_count = 1;
end;
$$;

create or replace function public.requeue_stale_ramrod_agent_steps()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  requeued_count integer;
begin
  with stale as (
    select id, agent_run_id, approval_required, attempts, max_attempts
    from public.agent_steps
    where status = 'running' and lease_expires_at < now()
    for update skip locked
  ), reset_steps as (
    update public.agent_steps as stale_step
    set
      status = case
        when stale.attempts >= stale.max_attempts then 'failed'
        when stale.approval_required then 'approved'
        else 'planned'
      end,
      run_after = case when stale.attempts < stale.max_attempts then now() else stale_step.run_after end,
      error = jsonb_build_object('code', 'agent_step_lease_expired', 'message', 'Agent runner lease expired before completion.'),
      completed_at = case when stale.attempts >= stale.max_attempts then now() else null end,
      locked_by = null,
      locked_at = null,
      lease_expires_at = null
    from stale
    where stale_step.id = stale.id
    returning stale_step.agent_run_id, stale_step.status
  )
  select count(*) into requeued_count from reset_steps;

  update public.agent_runs as stale_run
  set status = case
    when exists (select 1 from public.agent_steps where agent_run_id = stale_run.id and status = 'failed') then 'failed'
    when exists (select 1 from public.agent_steps where agent_run_id = stale_run.id and status = 'waiting_approval') then 'waiting_approval'
    else 'ready'
  end
  where stale_run.status = 'running'
    and not exists (select 1 from public.agent_steps where agent_run_id = stale_run.id and status = 'running');

  return requeued_count;
end;
$$;

revoke all on function public.claim_ramrod_agent_step(uuid, uuid, text[], text[], text[], integer) from public, anon, authenticated;
revoke all on function public.finish_ramrod_agent_step(uuid, uuid, boolean, jsonb, jsonb, integer) from public, anon, authenticated;
revoke all on function public.renew_ramrod_agent_step_lease(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.requeue_stale_ramrod_agent_steps() from public, anon, authenticated;

grant execute on function public.claim_ramrod_agent_step(uuid, uuid, text[], text[], text[], integer) to service_role;
grant execute on function public.finish_ramrod_agent_step(uuid, uuid, boolean, jsonb, jsonb, integer) to service_role;
grant execute on function public.renew_ramrod_agent_step_lease(uuid, uuid, integer) to service_role;
grant execute on function public.requeue_stale_ramrod_agent_steps() to service_role;

comment on function public.claim_ramrod_agent_step(uuid, uuid, text[], text[], text[], integer) is
  'Atomically leases the next ordered, capability-compatible agent step after required approval.';

notify pgrst, 'reload schema';
