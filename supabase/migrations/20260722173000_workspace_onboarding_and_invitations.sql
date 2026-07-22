-- Self-service workspace onboarding and secure, single-use organization invitations.

alter table public.customers
  add column if not exists onboarding_status text not null default 'ready'
    check (onboarding_status in ('organization', 'channels', 'ready')),
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.customers(id) on delete cascade,
  email text not null,
  role text not null default 'operator'
    check (role in ('admin', 'operator', 'viewer')),
  token_hash text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email = lower(trim(email)))
);

create unique index if not exists organization_invitations_pending_email_idx
  on public.organization_invitations(organization_id, email)
  where status = 'pending';
create index if not exists organization_invitations_email_status_idx
  on public.organization_invitations(email, status, expires_at);

drop trigger if exists organization_invitations_set_updated_at on public.organization_invitations;
create trigger organization_invitations_set_updated_at
before update on public.organization_invitations
for each row execute function public.set_updated_at();

alter table public.organization_invitations enable row level security;

create policy "organization admins read invitations" on public.organization_invitations
for select to authenticated
using (public.has_ramrod_organization_access(organization_id, array['owner', 'admin']::text[]));

create policy "organization admins create invitations" on public.organization_invitations
for insert to authenticated
with check (public.has_ramrod_organization_access(organization_id, array['owner', 'admin']::text[]));

create policy "organization admins update invitations" on public.organization_invitations
for update to authenticated
using (public.has_ramrod_organization_access(organization_id, array['owner', 'admin']::text[]))
with check (public.has_ramrod_organization_access(organization_id, array['owner', 'admin']::text[]));

-- Channel credentials and account linking are organization settings. Operators
-- may use configured channels, but only owners/admins may change the connection.
drop policy if exists "tenant manage channel accounts" on public.organization_channel_accounts;
create policy "tenant manage channel accounts" on public.organization_channel_accounts for all to authenticated
  using (public.has_ramrod_organization_access(organization_id, array['owner', 'admin']::text[]))
  with check (public.has_ramrod_organization_access(organization_id, array['owner', 'admin']::text[]));

comment on table public.organization_invitations is
  'Single-use organization invitations. Only SHA-256 token hashes are persisted.';

notify pgrst, 'reload schema';
