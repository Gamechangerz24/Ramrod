-- RAMROD multi-tenant foundation.
-- `customers` remains the physical tenant table for backwards compatibility.

alter table public.customers
  add column if not exists organization_type text not null default 'customer',
  add column if not exists short_code text,
  add column if not exists brand_color text not null default '#ff6a00',
  add column if not exists icon_url text,
  add column if not exists seller_mode text not null default 'business',
  add column if not exists active boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'customers_organization_type_check'
  ) then
    alter table public.customers
      add constraint customers_organization_type_check
      check (organization_type in ('internal', 'customer', 'personal', 'demo'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'customers_seller_mode_check'
  ) then
    alter table public.customers
      add constraint customers_seller_mode_check
      check (seller_mode in ('business', 'private', 'mixed'));
  end if;
end
$$;

update public.customers
set
  organization_type = 'customer',
  short_code = coalesce(short_code, 'SV'),
  brand_color = '#3478c7',
  seller_mode = 'business'
where slug = 'strongvision';

insert into public.customers (
  name, slug, notes, organization_type, short_code, brand_color, seller_mode
)
values
  ('CREATORS', 'creators', 'Eigener CREATORS-Verkaufsbereich und RAMROD Shop', 'internal', 'CR', '#ff6a00', 'business'),
  ('Privat', 'private', 'Persoenlicher, nicht oeffentlicher Verkaufsbereich', 'personal', 'PR', '#535b68', 'private'),
  ('RAMROD Demo', 'ramrod-demo', 'Vollstaendig getrennter Demo-Datenraum', 'demo', 'DM', '#8064a2', 'private')
on conflict (slug) do update set
  organization_type = excluded.organization_type,
  short_code = excluded.short_code,
  brand_color = excluded.brand_color,
  seller_mode = excluded.seller_mode;

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.customers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'operator'
    check (role in ('owner', 'admin', 'operator', 'viewer')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended')),
  support_access boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'support')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.customers(id) on delete cascade,
  code text not null,
  name text not null,
  location_type text not null default 'warehouse'
    check (location_type in ('warehouse', 'store', 'private', 'external')),
  address jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.seller_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  seller_type text not null default 'business'
    check (seller_type in ('business', 'private')),
  legal_name text,
  payout_reference text,
  return_policy text,
  active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consignment_contracts (
  id uuid primary key default gen_random_uuid(),
  owner_organization_id uuid not null references public.customers(id) on delete restrict,
  operator_organization_id uuid not null references public.customers(id) on delete restrict,
  seller_profile_id uuid references public.seller_profiles(id) on delete set null,
  title text not null,
  commission_percent numeric(5, 2) not null default 0
    check (commission_percent between 0 and 100),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'ended')),
  terms jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.items
  add column if not exists owner_organization_id uuid references public.customers(id) on delete restrict,
  add column if not exists operator_organization_id uuid references public.customers(id) on delete restrict,
  add column if not exists seller_profile_id uuid references public.seller_profiles(id) on delete set null,
  add column if not exists location_id uuid references public.locations(id) on delete set null,
  add column if not exists consignment_contract_id uuid references public.consignment_contracts(id) on delete set null;

update public.items
set
  owner_organization_id = coalesce(owner_organization_id, customer_id),
  operator_organization_id = coalesce(operator_organization_id, customer_id)
where owner_organization_id is null or operator_organization_id is null;

alter table public.items drop constraint if exists items_sku_key;
create unique index if not exists items_customer_sku_key
  on public.items(customer_id, sku);

create index if not exists organization_memberships_user_idx
  on public.organization_memberships(user_id, status);
create index if not exists locations_organization_idx
  on public.locations(organization_id);
create index if not exists seller_profiles_organization_idx
  on public.seller_profiles(organization_id);

drop trigger if exists organization_memberships_set_updated_at on public.organization_memberships;
create trigger organization_memberships_set_updated_at
before update on public.organization_memberships
for each row execute function public.set_updated_at();

drop trigger if exists locations_set_updated_at on public.locations;
create trigger locations_set_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

drop trigger if exists seller_profiles_set_updated_at on public.seller_profiles;
create trigger seller_profiles_set_updated_at
before update on public.seller_profiles
for each row execute function public.set_updated_at();

drop trigger if exists consignment_contracts_set_updated_at on public.consignment_contracts;
create trigger consignment_contracts_set_updated_at
before update on public.consignment_contracts
for each row execute function public.set_updated_at();

create or replace function public.is_ramrod_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins
    where user_id = auth.uid() and active = true
  );
$$;

create or replace function public.has_ramrod_organization_access(
  requested_organization_id uuid,
  requested_roles text[] default array['owner', 'admin', 'operator', 'viewer']::text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_ramrod_platform_admin() or exists (
    select 1
    from public.organization_memberships
    where organization_id = requested_organization_id
      and user_id = auth.uid()
      and status = 'active'
      and role = any(requested_roles)
  );
$$;

revoke all on function public.is_ramrod_platform_admin() from public, anon;
revoke all on function public.has_ramrod_organization_access(uuid, text[]) from public, anon;
grant execute on function public.is_ramrod_platform_admin() to authenticated;
grant execute on function public.has_ramrod_organization_access(uuid, text[]) to authenticated;

alter table public.organization_memberships enable row level security;
alter table public.platform_admins enable row level security;
alter table public.locations enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.consignment_contracts enable row level security;

-- Replace the initial broad authenticated policies with tenant-aware policies.
drop policy if exists "authenticated read customers" on public.customers;
drop policy if exists "authenticated write customers" on public.customers;
create policy "tenant read customers" on public.customers for select to authenticated
  using (public.has_ramrod_organization_access(id));
create policy "tenant manage customers" on public.customers for all to authenticated
  using (public.has_ramrod_organization_access(id, array['owner', 'admin']::text[]))
  with check (public.has_ramrod_organization_access(id, array['owner', 'admin']::text[]));

drop policy if exists "authenticated read boxes" on public.boxes;
drop policy if exists "authenticated write boxes" on public.boxes;
create policy "tenant read boxes" on public.boxes for select to authenticated
  using (public.has_ramrod_organization_access(customer_id));
create policy "tenant manage boxes" on public.boxes for all to authenticated
  using (public.has_ramrod_organization_access(customer_id, array['owner', 'admin', 'operator']::text[]))
  with check (public.has_ramrod_organization_access(customer_id, array['owner', 'admin', 'operator']::text[]));

drop policy if exists "authenticated read items" on public.items;
drop policy if exists "authenticated write items" on public.items;
create policy "tenant read items" on public.items for select to authenticated
  using (public.has_ramrod_organization_access(customer_id));
create policy "tenant manage items" on public.items for all to authenticated
  using (public.has_ramrod_organization_access(customer_id, array['owner', 'admin', 'operator']::text[]))
  with check (public.has_ramrod_organization_access(customer_id, array['owner', 'admin', 'operator']::text[]));

create policy "memberships visible to member or admin" on public.organization_memberships
for select to authenticated using (
  user_id = auth.uid() or public.has_ramrod_organization_access(organization_id, array['owner', 'admin']::text[])
);
create policy "memberships managed by organization admins" on public.organization_memberships
for all to authenticated
using (public.has_ramrod_organization_access(organization_id, array['owner', 'admin']::text[]))
with check (public.has_ramrod_organization_access(organization_id, array['owner', 'admin']::text[]));

create policy "platform admins visible to self" on public.platform_admins
for select to authenticated using (user_id = auth.uid() or public.is_ramrod_platform_admin());

create policy "tenant read locations" on public.locations for select to authenticated
using (public.has_ramrod_organization_access(organization_id));
create policy "tenant manage locations" on public.locations for all to authenticated
using (public.has_ramrod_organization_access(organization_id, array['owner', 'admin', 'operator']::text[]))
with check (public.has_ramrod_organization_access(organization_id, array['owner', 'admin', 'operator']::text[]));
create policy "tenant read seller profiles" on public.seller_profiles for select to authenticated
using (public.has_ramrod_organization_access(organization_id));
create policy "tenant manage seller profiles" on public.seller_profiles for all to authenticated
using (public.has_ramrod_organization_access(organization_id, array['owner', 'admin']::text[]))
with check (public.has_ramrod_organization_access(organization_id, array['owner', 'admin']::text[]));
create policy "tenant read consignment contracts" on public.consignment_contracts for select to authenticated
using (
  public.has_ramrod_organization_access(owner_organization_id)
  or public.has_ramrod_organization_access(operator_organization_id)
);
create policy "tenant manage consignment contracts" on public.consignment_contracts for all to authenticated
using (
  public.has_ramrod_organization_access(owner_organization_id, array['owner', 'admin']::text[])
  or public.has_ramrod_organization_access(operator_organization_id, array['owner', 'admin']::text[])
)
with check (
  public.has_ramrod_organization_access(owner_organization_id, array['owner', 'admin']::text[])
  or public.has_ramrod_organization_access(operator_organization_id, array['owner', 'admin']::text[])
);

drop policy if exists "authenticated read item_images" on public.item_images;
drop policy if exists "authenticated write item_images" on public.item_images;
create policy "tenant read item images" on public.item_images for select to authenticated
using (exists (
  select 1 from public.items where items.id = item_images.item_id
    and public.has_ramrod_organization_access(items.customer_id)
));
create policy "tenant manage item images" on public.item_images for all to authenticated
using (exists (
  select 1 from public.items where items.id = item_images.item_id
    and public.has_ramrod_organization_access(items.customer_id, array['owner', 'admin', 'operator']::text[])
))
with check (exists (
  select 1 from public.items where items.id = item_images.item_id
    and public.has_ramrod_organization_access(items.customer_id, array['owner', 'admin', 'operator']::text[])
));

drop policy if exists "authenticated read price_checks" on public.price_checks;
drop policy if exists "authenticated write price_checks" on public.price_checks;
create policy "tenant read price checks" on public.price_checks for select to authenticated
using (exists (
  select 1 from public.items where items.id = price_checks.item_id
    and public.has_ramrod_organization_access(items.customer_id)
));
create policy "tenant manage price checks" on public.price_checks for all to authenticated
using (exists (
  select 1 from public.items where items.id = price_checks.item_id
    and public.has_ramrod_organization_access(items.customer_id, array['owner', 'admin', 'operator']::text[])
))
with check (exists (
  select 1 from public.items where items.id = price_checks.item_id
    and public.has_ramrod_organization_access(items.customer_id, array['owner', 'admin', 'operator']::text[])
));

drop policy if exists "authenticated read campaigns" on public.campaigns;
drop policy if exists "authenticated write campaigns" on public.campaigns;
create policy "tenant read campaigns" on public.campaigns for select to authenticated
using (public.has_ramrod_organization_access(customer_id));
create policy "tenant manage campaigns" on public.campaigns for all to authenticated
using (public.has_ramrod_organization_access(customer_id, array['owner', 'admin', 'operator']::text[]))
with check (public.has_ramrod_organization_access(customer_id, array['owner', 'admin', 'operator']::text[]));

drop policy if exists "authenticated read campaign_items" on public.campaign_items;
drop policy if exists "authenticated write campaign_items" on public.campaign_items;
create policy "tenant read campaign items" on public.campaign_items for select to authenticated
using (exists (
  select 1 from public.campaigns where campaigns.id = campaign_items.campaign_id
    and public.has_ramrod_organization_access(campaigns.customer_id)
));
create policy "tenant manage campaign items" on public.campaign_items for all to authenticated
using (exists (
  select 1 from public.campaigns where campaigns.id = campaign_items.campaign_id
    and public.has_ramrod_organization_access(campaigns.customer_id, array['owner', 'admin', 'operator']::text[])
))
with check (exists (
  select 1 from public.campaigns where campaigns.id = campaign_items.campaign_id
    and public.has_ramrod_organization_access(campaigns.customer_id, array['owner', 'admin', 'operator']::text[])
));

drop policy if exists "authenticated read listings" on public.listings;
drop policy if exists "authenticated write listings" on public.listings;
create policy "tenant read listings" on public.listings for select to authenticated
using (exists (
  select 1 from public.items where items.id = listings.item_id
    and public.has_ramrod_organization_access(items.customer_id)
));
create policy "tenant manage listings" on public.listings for all to authenticated
using (exists (
  select 1 from public.items where items.id = listings.item_id
    and public.has_ramrod_organization_access(items.customer_id, array['owner', 'admin', 'operator']::text[])
))
with check (exists (
  select 1 from public.items where items.id = listings.item_id
    and public.has_ramrod_organization_access(items.customer_id, array['owner', 'admin', 'operator']::text[])
));

drop policy if exists "authenticated read sales" on public.sales;
drop policy if exists "authenticated write sales" on public.sales;
create policy "tenant read sales" on public.sales for select to authenticated
using (exists (
  select 1 from public.items where items.id = sales.item_id
    and public.has_ramrod_organization_access(items.customer_id)
));
create policy "tenant manage sales" on public.sales for all to authenticated
using (exists (
  select 1 from public.items where items.id = sales.item_id
    and public.has_ramrod_organization_access(items.customer_id, array['owner', 'admin', 'operator']::text[])
))
with check (exists (
  select 1 from public.items where items.id = sales.item_id
    and public.has_ramrod_organization_access(items.customer_id, array['owner', 'admin', 'operator']::text[])
));

drop policy if exists "authenticated read shipments" on public.shipments;
drop policy if exists "authenticated write shipments" on public.shipments;
create policy "tenant read shipments" on public.shipments for select to authenticated
using (exists (
  select 1 from public.items where items.id = shipments.item_id
    and public.has_ramrod_organization_access(items.customer_id)
));
create policy "tenant manage shipments" on public.shipments for all to authenticated
using (exists (
  select 1 from public.items where items.id = shipments.item_id
    and public.has_ramrod_organization_access(items.customer_id, array['owner', 'admin', 'operator']::text[])
))
with check (exists (
  select 1 from public.items where items.id = shipments.item_id
    and public.has_ramrod_organization_access(items.customer_id, array['owner', 'admin', 'operator']::text[])
));

drop policy if exists "authenticated read channels" on public.channels;
drop policy if exists "authenticated write channels" on public.channels;
create policy "authenticated read channels" on public.channels for select to authenticated using (true);
create policy "platform admins manage channels" on public.channels for all to authenticated
using (public.is_ramrod_platform_admin())
with check (public.is_ramrod_platform_admin());

alter table public.audit_events
  add column if not exists organization_id uuid references public.customers(id) on delete cascade;
drop policy if exists "authenticated read audit_events" on public.audit_events;
drop policy if exists "authenticated write audit_events" on public.audit_events;
create policy "tenant read audit events" on public.audit_events for select to authenticated
using (organization_id is not null and public.has_ramrod_organization_access(organization_id));
create policy "tenant insert audit events" on public.audit_events for insert to authenticated
with check (organization_id is not null and public.has_ramrod_organization_access(organization_id));

drop policy if exists "authenticated read jobs" on public.jobs;
drop policy if exists "authenticated write jobs" on public.jobs;
create policy "tenant read jobs" on public.jobs for select to authenticated
using (customer_id is not null and public.has_ramrod_organization_access(customer_id));
create policy "tenant create jobs" on public.jobs for insert to authenticated
with check (customer_id is not null and public.has_ramrod_organization_access(customer_id, array['owner', 'admin', 'operator']::text[]));

-- Existing users with an explicit admin app role become platform admins.
insert into public.platform_admins (user_id, role)
select id, 'admin'
from auth.users
where lower(coalesce(raw_app_meta_data ->> 'ramrod_role', '')) = 'admin'
on conflict (user_id) do update set active = true;

-- Give existing platform admins an explicit owner membership for the internal area.
insert into public.organization_memberships (organization_id, user_id, role, status)
select organization.id, admin.user_id, 'owner', 'active'
from public.customers organization
cross join public.platform_admins admin
where organization.slug = 'creators' and admin.active = true
on conflict (organization_id, user_id) do update set role = 'owner', status = 'active';

insert into public.locations (organization_id, code, name, location_type)
select id, 'HQ', 'CREATORS Lager', 'warehouse'
from public.customers where slug = 'creators'
on conflict (organization_id, code) do nothing;

insert into public.seller_profiles (organization_id, name, seller_type, legal_name)
select id, 'RAMROD', 'business', 'CREATORS'
from public.customers where slug = 'creators'
and not exists (
  select 1 from public.seller_profiles profile
  where profile.organization_id = customers.id and profile.name = 'RAMROD'
);
