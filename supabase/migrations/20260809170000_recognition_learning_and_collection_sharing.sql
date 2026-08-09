-- Conservative cross-tenant recognition learning and explicit private collection sharing.
-- Product corrections are text-only learning signals. Photos and owner metadata are never shared.

create table if not exists public.recognition_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.customers(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  submitted_by uuid references auth.users(id) on delete set null,
  fingerprint text not null,
  predicted_identity jsonb not null default '{}'::jsonb,
  corrected_identity jsonb not null default '{}'::jsonb,
  comparison_context jsonb not null default '{}'::jsonb,
  correction_note text,
  status text not null default 'pending'
    check (status in ('pending', 'corroborated', 'validated', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recognition_learning_patterns (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null unique,
  canonical_identity jsonb not null,
  confirmations integer not null default 0,
  distinct_organizations integer not null default 0,
  supporting_feedback_ids uuid[] not null default '{}',
  status text not null default 'candidate'
    check (status in ('candidate', 'active', 'rejected')),
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_shares (
  id uuid primary key default gen_random_uuid(),
  owner_organization_id uuid not null references public.customers(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_email text not null,
  status text not null default 'active'
    check (status in ('invited', 'active', 'revoked')),
  scope jsonb not null default '{"mediaTypes":["film","game","other"],"hiddenAgeRatings":["FSK 18"],"hiddenItemIds":[],"allowLoans":true}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_organization_id, recipient_email)
);

create table if not exists public.collection_access_requests (
  id uuid primary key default gen_random_uuid(),
  owner_organization_id uuid not null references public.customers(id) on delete cascade,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  requester_email text not null,
  requester_name text,
  message text,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'declined', 'cancelled')),
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_organization_id, requester_user_id)
);

create table if not exists public.collection_loan_requests (
  id uuid primary key default gen_random_uuid(),
  share_id uuid references public.collection_shares(id) on delete set null,
  item_id uuid not null references public.items(id) on delete cascade,
  owner_organization_id uuid not null references public.customers(id) on delete cascade,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  requester_email text not null,
  requester_name text,
  note text,
  due_at date,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'declined', 'loaned', 'returned', 'cancelled')),
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recognition_feedback_fingerprint_idx
  on public.recognition_feedback(fingerprint, status, created_at desc);
create index if not exists collection_shares_recipient_idx
  on public.collection_shares(recipient_email, recipient_user_id, status);
create index if not exists collection_access_requests_owner_idx
  on public.collection_access_requests(owner_organization_id, status, created_at desc);
create index if not exists collection_loan_requests_owner_idx
  on public.collection_loan_requests(owner_organization_id, status, created_at desc);
create index if not exists collection_loan_requests_requester_idx
  on public.collection_loan_requests(requester_user_id, status, created_at desc);

drop trigger if exists recognition_feedback_set_updated_at on public.recognition_feedback;
create trigger recognition_feedback_set_updated_at before update on public.recognition_feedback
for each row execute function public.set_updated_at();
drop trigger if exists recognition_learning_patterns_set_updated_at on public.recognition_learning_patterns;
create trigger recognition_learning_patterns_set_updated_at before update on public.recognition_learning_patterns
for each row execute function public.set_updated_at();
drop trigger if exists collection_shares_set_updated_at on public.collection_shares;
create trigger collection_shares_set_updated_at before update on public.collection_shares
for each row execute function public.set_updated_at();
drop trigger if exists collection_access_requests_set_updated_at on public.collection_access_requests;
create trigger collection_access_requests_set_updated_at before update on public.collection_access_requests
for each row execute function public.set_updated_at();
drop trigger if exists collection_loan_requests_set_updated_at on public.collection_loan_requests;
create trigger collection_loan_requests_set_updated_at before update on public.collection_loan_requests
for each row execute function public.set_updated_at();

alter table public.recognition_feedback enable row level security;
alter table public.recognition_learning_patterns enable row level security;
alter table public.collection_shares enable row level security;
alter table public.collection_access_requests enable row level security;
alter table public.collection_loan_requests enable row level security;

create policy "tenant manages own recognition feedback" on public.recognition_feedback
for all to authenticated
using (public.has_ramrod_organization_access(organization_id, array['owner','admin','operator']::text[]))
with check (public.has_ramrod_organization_access(organization_id, array['owner','admin','operator']::text[]));

create policy "authenticated reads active learning patterns" on public.recognition_learning_patterns
for select to authenticated using (status = 'active');

create policy "participants read collection shares" on public.collection_shares
for select to authenticated
using (public.has_ramrod_organization_access(owner_organization_id, array['owner','admin']::text[]) or recipient_user_id = auth.uid());
create policy "owners create collection shares" on public.collection_shares
for insert to authenticated
with check (public.has_ramrod_organization_access(owner_organization_id, array['owner','admin']::text[]));
create policy "owners update collection shares" on public.collection_shares
for update to authenticated
using (public.has_ramrod_organization_access(owner_organization_id, array['owner','admin']::text[]))
with check (public.has_ramrod_organization_access(owner_organization_id, array['owner','admin']::text[]));

create policy "participants read collection access requests" on public.collection_access_requests
for select to authenticated
using (requester_user_id = auth.uid() or public.has_ramrod_organization_access(owner_organization_id, array['owner','admin']::text[]));
create policy "requester creates collection access requests" on public.collection_access_requests
for insert to authenticated with check (requester_user_id = auth.uid());
create policy "requester cancels collection access requests" on public.collection_access_requests
for update to authenticated
using (requester_user_id = auth.uid())
with check (requester_user_id = auth.uid() and status = 'cancelled');
create policy "owners decide collection access requests" on public.collection_access_requests
for update to authenticated
using (public.has_ramrod_organization_access(owner_organization_id, array['owner','admin']::text[]))
with check (public.has_ramrod_organization_access(owner_organization_id, array['owner','admin']::text[]));

create policy "participants read collection loan requests" on public.collection_loan_requests
for select to authenticated
using (requester_user_id = auth.uid() or public.has_ramrod_organization_access(owner_organization_id, array['owner','admin','operator']::text[]));
create policy "requester creates collection loan requests" on public.collection_loan_requests
for insert to authenticated with check (requester_user_id = auth.uid());
create policy "requester cancels collection loan requests" on public.collection_loan_requests
for update to authenticated
using (requester_user_id = auth.uid())
with check (requester_user_id = auth.uid() and status = 'cancelled');
create policy "owners decide collection loan requests" on public.collection_loan_requests
for update to authenticated
using (public.has_ramrod_organization_access(owner_organization_id, array['owner','admin','operator']::text[]))
with check (public.has_ramrod_organization_access(owner_organization_id, array['owner','admin','operator']::text[]));

comment on table public.recognition_feedback is 'De-identified product identity corrections. Never stores item photos or private owner metadata.';
comment on table public.recognition_learning_patterns is 'Validated comparison patterns. A single correction never changes recognition globally.';
comment on table public.collection_shares is 'Explicit, scoped private collection access by exact recipient account email.';

notify pgrst, 'reload schema';
