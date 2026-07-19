create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  worker_key text not null unique,
  name text not null,
  status text not null default 'offline'
    check (status in ('online', 'busy', 'draining', 'offline', 'error')),
  capabilities text[] not null default '{}'::text[],
  max_concurrency integer not null default 1 check (max_concurrency between 1 and 16),
  metadata jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  item_id uuid references public.items(id) on delete cascade,
  job_type text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  priority integer not null default 50 check (priority between 0 and 100),
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error jsonb,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 20),
  run_after timestamptz not null default now(),
  locked_by uuid references public.workers(id) on delete set null,
  locked_at timestamptz,
  lease_expires_at timestamptz,
  idempotency_key text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists workers_set_updated_at on public.workers;
create trigger workers_set_updated_at
before update on public.workers
for each row execute function public.set_updated_at();

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

create index if not exists workers_last_seen_at_idx on public.workers(last_seen_at desc);
create index if not exists jobs_queue_idx on public.jobs(status, run_after, priority desc, created_at);
create index if not exists jobs_item_id_idx on public.jobs(item_id);
create index if not exists jobs_customer_id_idx on public.jobs(customer_id);
create index if not exists jobs_locked_by_idx on public.jobs(locked_by) where locked_by is not null;
create unique index if not exists jobs_idempotency_key_idx
on public.jobs(idempotency_key);

alter table public.workers enable row level security;
alter table public.jobs enable row level security;

create or replace function public.claim_ramrod_job(
  p_worker_id uuid,
  p_capabilities text[],
  p_lease_seconds integer default 180
)
returns setof public.jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.workers
  set
    status = 'online',
    last_seen_at = now()
  where id = p_worker_id;

  return query
  with candidate as (
    select queued.id
    from public.jobs as queued
    where queued.status = 'queued'
      and queued.run_after <= now()
      and queued.attempts < queued.max_attempts
      and queued.job_type = any(p_capabilities)
    order by queued.priority desc, queued.created_at asc
    for update skip locked
    limit 1
  )
  update public.jobs as claimed
  set
    status = 'running',
    attempts = claimed.attempts + 1,
    locked_by = p_worker_id,
    locked_at = now(),
    lease_expires_at = now() + make_interval(secs => greatest(30, least(p_lease_seconds, 3600))),
    started_at = coalesce(claimed.started_at, now()),
    error = null
  from candidate
  where claimed.id = candidate.id
  returning claimed.*;
end;
$$;

create or replace function public.finish_ramrod_job(
  p_job_id uuid,
  p_worker_id uuid,
  p_succeeded boolean,
  p_result jsonb default null,
  p_error jsonb default null,
  p_retry_delay_seconds integer default 30
)
returns setof public.jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.jobs as finished
  set
    status = case
      when p_succeeded then 'succeeded'
      when coalesce((p_error ->> 'retryable')::boolean, true) = false then 'failed'
      when finished.attempts < finished.max_attempts then 'queued'
      else 'failed'
    end,
    result = case when p_succeeded then coalesce(p_result, '{}'::jsonb) else finished.result end,
    error = case when p_succeeded then null else coalesce(p_error, '{}'::jsonb) end,
    run_after = case
      when not p_succeeded
        and coalesce((p_error ->> 'retryable')::boolean, true)
        and finished.attempts < finished.max_attempts
        then now() + make_interval(secs => greatest(1, least(p_retry_delay_seconds, 86400)))
      else finished.run_after
    end,
    completed_at = case
      when p_succeeded
        or coalesce((p_error ->> 'retryable')::boolean, true) = false
        or finished.attempts >= finished.max_attempts then now()
      else null
    end,
    locked_by = null,
    locked_at = null,
    lease_expires_at = null
  where finished.id = p_job_id
    and finished.status = 'running'
    and finished.locked_by = p_worker_id
  returning finished.*;
end;
$$;

create or replace function public.renew_ramrod_job_lease(
  p_job_id uuid,
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
  update public.jobs
  set lease_expires_at = now() + make_interval(secs => greatest(30, least(p_lease_seconds, 3600)))
  where id = p_job_id
    and status = 'running'
    and locked_by = p_worker_id;

  get diagnostics renewed_count = row_count;

  if renewed_count = 1 then
    update public.workers
    set
      status = 'busy',
      last_seen_at = now()
    where id = p_worker_id;
  end if;

  return renewed_count = 1;
end;
$$;

create or replace function public.requeue_stale_ramrod_jobs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  requeued_count integer;
begin
  update public.jobs
  set
    status = case when attempts < max_attempts then 'queued' else 'failed' end,
    run_after = case when attempts < max_attempts then now() else run_after end,
    error = jsonb_build_object(
      'code', 'worker_lease_expired',
      'message', 'Worker did not finish the job before its lease expired.'
    ),
    completed_at = case when attempts >= max_attempts then now() else null end,
    locked_by = null,
    locked_at = null,
    lease_expires_at = null
  where status = 'running'
    and lease_expires_at < now();

  get diagnostics requeued_count = row_count;
  return requeued_count;
end;
$$;

revoke all on function public.claim_ramrod_job(uuid, text[], integer) from public, anon, authenticated;
revoke all on function public.finish_ramrod_job(uuid, uuid, boolean, jsonb, jsonb, integer) from public, anon, authenticated;
revoke all on function public.renew_ramrod_job_lease(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.requeue_stale_ramrod_jobs() from public, anon, authenticated;

grant execute on function public.claim_ramrod_job(uuid, text[], integer) to service_role;
grant execute on function public.finish_ramrod_job(uuid, uuid, boolean, jsonb, jsonb, integer) to service_role;
grant execute on function public.renew_ramrod_job_lease(uuid, uuid, integer) to service_role;
grant execute on function public.requeue_stale_ramrod_jobs() to service_role;

comment on table public.jobs is 'Durable job queue for RAMROD automation workers.';
comment on table public.workers is 'Registered VPS, Mac mini, and future edge workers.';
