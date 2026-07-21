-- RAMROD agent control layer.
-- Secrets never belong in these tables. `secret_ref` may only contain a vault reference.

create table if not exists public.organization_channel_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.customers(id) on delete cascade,
  channel_id text not null references public.channels(id),
  display_name text not null,
  auth_mode text not null default 'oauth'
    check (auth_mode in ('oauth', 'browser', 'manual', 'api_key')),
  status text not null default 'planned'
    check (status in ('planned', 'onboarding', 'connected', 'action_required', 'suspended', 'disconnected', 'error')),
  external_account_ref text,
  secret_ref text,
  browser_profile_key text,
  capabilities text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, channel_id, display_name)
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.customers(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  channel_account_id uuid references public.organization_channel_accounts(id) on delete set null,
  agent_type text not null,
  objective text not null,
  status text not null default 'queued'
    check (status in ('queued', 'planning', 'waiting_approval', 'ready', 'running', 'succeeded', 'failed', 'cancelled')),
  risk_level text not null default 'low'
    check (risk_level in ('low', 'medium', 'high', 'critical')),
  requested_by uuid references auth.users(id) on delete set null,
  plan jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  result jsonb,
  error jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_steps (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid not null references public.agent_runs(id) on delete cascade,
  ordinal integer not null check (ordinal > 0),
  step_key text not null,
  title text not null,
  action_type text not null,
  execution_mode text not null,
  tool_name text,
  status text not null default 'planned'
    check (status in ('planned', 'waiting_approval', 'approved', 'running', 'succeeded', 'failed', 'skipped', 'cancelled')),
  risk_level text not null default 'low'
    check (risk_level in ('low', 'medium', 'high', 'critical')),
  approval_required boolean not null default false,
  summary text,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_run_id, ordinal)
);

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.customers(id) on delete cascade,
  agent_run_id uuid not null references public.agent_runs(id) on delete cascade,
  agent_step_id uuid not null references public.agent_steps(id) on delete cascade,
  approval_type text not null default 'external_action',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  requested_by uuid references auth.users(id) on delete set null,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  decision_note text,
  telegram_chat_id bigint,
  telegram_message_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.publication_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.customers(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  channel_account_id uuid references public.organization_channel_accounts(id) on delete set null,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  mode text not null check (mode in ('api', 'browser', 'manual')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  external_ref text,
  request jsonb not null default '{}'::jsonb,
  response jsonb,
  evidence jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connector_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.customers(id) on delete cascade,
  channel_account_id uuid references public.organization_channel_accounts(id) on delete set null,
  channel_id text not null references public.channels(id),
  event_type text not null,
  external_event_id text not null,
  status text not null default 'received'
    check (status in ('received', 'processing', 'processed', 'failed', 'ignored')),
  payload jsonb not null default '{}'::jsonb,
  error jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (channel_id, external_event_id)
);

alter table public.jobs
  add column if not exists agent_run_id uuid references public.agent_runs(id) on delete set null,
  add column if not exists agent_step_id uuid references public.agent_steps(id) on delete set null;

create index if not exists organization_channel_accounts_org_idx
  on public.organization_channel_accounts(organization_id, status);
create index if not exists agent_runs_org_status_idx
  on public.agent_runs(organization_id, status, created_at desc);
create index if not exists agent_steps_run_idx
  on public.agent_steps(agent_run_id, ordinal);
create index if not exists approval_requests_org_status_idx
  on public.approval_requests(organization_id, status, created_at desc);
create unique index if not exists approval_requests_pending_step_idx
  on public.approval_requests(agent_step_id) where status = 'pending';
create index if not exists publication_runs_org_status_idx
  on public.publication_runs(organization_id, status, created_at desc);
create index if not exists connector_events_org_status_idx
  on public.connector_events(organization_id, status, received_at desc);
create index if not exists jobs_agent_run_idx on public.jobs(agent_run_id);
create index if not exists jobs_agent_step_idx on public.jobs(agent_step_id);

drop trigger if exists organization_channel_accounts_set_updated_at on public.organization_channel_accounts;
create trigger organization_channel_accounts_set_updated_at
before update on public.organization_channel_accounts
for each row execute function public.set_updated_at();
drop trigger if exists agent_runs_set_updated_at on public.agent_runs;
create trigger agent_runs_set_updated_at
before update on public.agent_runs
for each row execute function public.set_updated_at();
drop trigger if exists agent_steps_set_updated_at on public.agent_steps;
create trigger agent_steps_set_updated_at
before update on public.agent_steps
for each row execute function public.set_updated_at();
drop trigger if exists approval_requests_set_updated_at on public.approval_requests;
create trigger approval_requests_set_updated_at
before update on public.approval_requests
for each row execute function public.set_updated_at();
drop trigger if exists publication_runs_set_updated_at on public.publication_runs;
create trigger publication_runs_set_updated_at
before update on public.publication_runs
for each row execute function public.set_updated_at();

alter table public.organization_channel_accounts enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_steps enable row level security;
alter table public.approval_requests enable row level security;
alter table public.publication_runs enable row level security;
alter table public.connector_events enable row level security;

create policy "tenant read channel accounts" on public.organization_channel_accounts for select to authenticated
  using (public.has_ramrod_organization_access(organization_id));
create policy "tenant manage channel accounts" on public.organization_channel_accounts for all to authenticated
  using (public.has_ramrod_organization_access(organization_id, array['owner', 'admin', 'operator']::text[]))
  with check (public.has_ramrod_organization_access(organization_id, array['owner', 'admin', 'operator']::text[]));

create policy "tenant read agent runs" on public.agent_runs for select to authenticated
  using (public.has_ramrod_organization_access(organization_id));
create policy "tenant manage agent runs" on public.agent_runs for all to authenticated
  using (public.has_ramrod_organization_access(organization_id, array['owner', 'admin', 'operator']::text[]))
  with check (public.has_ramrod_organization_access(organization_id, array['owner', 'admin', 'operator']::text[]));

create policy "tenant read agent steps" on public.agent_steps for select to authenticated
  using (exists (
    select 1 from public.agent_runs
    where agent_runs.id = agent_steps.agent_run_id
      and public.has_ramrod_organization_access(agent_runs.organization_id)
  ));
create policy "tenant manage agent steps" on public.agent_steps for all to authenticated
  using (exists (
    select 1 from public.agent_runs
    where agent_runs.id = agent_steps.agent_run_id
      and public.has_ramrod_organization_access(agent_runs.organization_id, array['owner', 'admin', 'operator']::text[])
  ))
  with check (exists (
    select 1 from public.agent_runs
    where agent_runs.id = agent_steps.agent_run_id
      and public.has_ramrod_organization_access(agent_runs.organization_id, array['owner', 'admin', 'operator']::text[])
  ));

create policy "tenant read approvals" on public.approval_requests for select to authenticated
  using (public.has_ramrod_organization_access(organization_id));
create policy "tenant manage approvals" on public.approval_requests for all to authenticated
  using (public.has_ramrod_organization_access(organization_id, array['owner', 'admin', 'operator']::text[]))
  with check (public.has_ramrod_organization_access(organization_id, array['owner', 'admin', 'operator']::text[]));

create policy "tenant read publication runs" on public.publication_runs for select to authenticated
  using (public.has_ramrod_organization_access(organization_id));
create policy "tenant manage publication runs" on public.publication_runs for all to authenticated
  using (public.has_ramrod_organization_access(organization_id, array['owner', 'admin', 'operator']::text[]))
  with check (public.has_ramrod_organization_access(organization_id, array['owner', 'admin', 'operator']::text[]));

create policy "tenant read connector events" on public.connector_events for select to authenticated
  using (public.has_ramrod_organization_access(organization_id));
create policy "tenant manage connector events" on public.connector_events for all to authenticated
  using (public.has_ramrod_organization_access(organization_id, array['owner', 'admin', 'operator']::text[]))
  with check (public.has_ramrod_organization_access(organization_id, array['owner', 'admin', 'operator']::text[]));

comment on column public.organization_channel_accounts.secret_ref is
  'Reference to an external secret vault only. Never store credentials, tokens, cookies or passwords here.';

notify pgrst, 'reload schema';
