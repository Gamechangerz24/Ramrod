create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  contact_name text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.boxes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  code text not null,
  label text,
  location text,
  status text not null default 'intake',
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, code)
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  box_id uuid references public.boxes(id) on delete set null,
  sku text not null unique,
  title text not null,
  category text,
  franchise text,
  condition text,
  completeness text,
  confidence integer not null default 0 check (confidence >= 0 and confidence <= 100),
  price_low numeric(10, 2),
  price_fair numeric(10, 2),
  price_aggressive numeric(10, 2),
  weight_kg numeric(8, 3),
  primary_channel text not null default 'Pruefen',
  status text not null default 'scanned',
  source_type text,
  notes text,
  raw_analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  storage_bucket text not null default 'ramrod-item-images',
  storage_path text not null,
  public_url text,
  kind text not null default 'scan',
  width integer,
  height integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.price_checks (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  method text not null,
  query text,
  low numeric(10, 2),
  fair numeric(10, 2),
  aggressive numeric(10, 2),
  confidence integer not null default 0 check (confidence >= 0 and confidence <= 100),
  evidence jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.channels (
  id text primary key,
  name text not null,
  type text not null,
  status text not null default 'planned',
  automation_level text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  channel_id text not null references public.channels(id),
  title text not null,
  status text not null default 'draft',
  scheduled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  lot_type text not null default 'single',
  sort_order integer not null default 0,
  start_price numeric(10, 2),
  min_price numeric(10, 2),
  seller_script text,
  bundle_suggestion text,
  status text not null default 'ready',
  created_at timestamptz not null default now(),
  unique (campaign_id, item_id)
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  channel_id text not null references public.channels(id),
  external_id text,
  status text not null default 'draft',
  title text,
  price numeric(10, 2),
  url text,
  payload jsonb not null default '{}'::jsonb,
  listed_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete restrict,
  listing_id uuid references public.listings(id) on delete set null,
  channel_id text not null references public.channels(id),
  external_order_id text,
  sale_price numeric(10, 2) not null,
  currency text not null default 'EUR',
  sold_at timestamptz not null default now(),
  buyer_ref text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete set null,
  item_id uuid not null references public.items(id) on delete restrict,
  status text not null default 'pending',
  carrier text,
  tracking_number text,
  label_url text,
  weight_kg numeric(8, 3),
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists boxes_set_updated_at on public.boxes;
create trigger boxes_set_updated_at
before update on public.boxes
for each row execute function public.set_updated_at();

drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at
before update on public.items
for each row execute function public.set_updated_at();

drop trigger if exists channels_set_updated_at on public.channels;
create trigger channels_set_updated_at
before update on public.channels
for each row execute function public.set_updated_at();

drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

drop trigger if exists shipments_set_updated_at on public.shipments;
create trigger shipments_set_updated_at
before update on public.shipments
for each row execute function public.set_updated_at();

create index if not exists boxes_customer_id_idx on public.boxes(customer_id);
create index if not exists items_customer_id_idx on public.items(customer_id);
create index if not exists items_box_id_idx on public.items(box_id);
create index if not exists items_primary_channel_idx on public.items(primary_channel);
create index if not exists item_images_item_id_idx on public.item_images(item_id);
create index if not exists price_checks_item_id_idx on public.price_checks(item_id);
create index if not exists campaigns_customer_id_idx on public.campaigns(customer_id);
create index if not exists campaign_items_campaign_id_idx on public.campaign_items(campaign_id);
create index if not exists campaign_items_item_id_idx on public.campaign_items(item_id);
create index if not exists listings_item_id_idx on public.listings(item_id);
create index if not exists sales_item_id_idx on public.sales(item_id);
create index if not exists shipments_item_id_idx on public.shipments(item_id);

alter table public.customers enable row level security;
alter table public.boxes enable row level security;
alter table public.items enable row level security;
alter table public.item_images enable row level security;
alter table public.price_checks enable row level security;
alter table public.channels enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_items enable row level security;
alter table public.listings enable row level security;
alter table public.sales enable row level security;
alter table public.shipments enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "authenticated read customers" on public.customers;
drop policy if exists "authenticated write customers" on public.customers;
drop policy if exists "authenticated read boxes" on public.boxes;
drop policy if exists "authenticated write boxes" on public.boxes;
drop policy if exists "authenticated read items" on public.items;
drop policy if exists "authenticated write items" on public.items;
drop policy if exists "authenticated read item_images" on public.item_images;
drop policy if exists "authenticated write item_images" on public.item_images;
drop policy if exists "authenticated read price_checks" on public.price_checks;
drop policy if exists "authenticated write price_checks" on public.price_checks;
drop policy if exists "authenticated read channels" on public.channels;
drop policy if exists "authenticated write channels" on public.channels;
drop policy if exists "authenticated read campaigns" on public.campaigns;
drop policy if exists "authenticated write campaigns" on public.campaigns;
drop policy if exists "authenticated read campaign_items" on public.campaign_items;
drop policy if exists "authenticated write campaign_items" on public.campaign_items;
drop policy if exists "authenticated read listings" on public.listings;
drop policy if exists "authenticated write listings" on public.listings;
drop policy if exists "authenticated read sales" on public.sales;
drop policy if exists "authenticated write sales" on public.sales;
drop policy if exists "authenticated read shipments" on public.shipments;
drop policy if exists "authenticated write shipments" on public.shipments;
drop policy if exists "authenticated read audit_events" on public.audit_events;
drop policy if exists "authenticated write audit_events" on public.audit_events;

create policy "authenticated read customers" on public.customers for select to authenticated using (true);
create policy "authenticated write customers" on public.customers for all to authenticated using (true) with check (true);
create policy "authenticated read boxes" on public.boxes for select to authenticated using (true);
create policy "authenticated write boxes" on public.boxes for all to authenticated using (true) with check (true);
create policy "authenticated read items" on public.items for select to authenticated using (true);
create policy "authenticated write items" on public.items for all to authenticated using (true) with check (true);
create policy "authenticated read item_images" on public.item_images for select to authenticated using (true);
create policy "authenticated write item_images" on public.item_images for all to authenticated using (true) with check (true);
create policy "authenticated read price_checks" on public.price_checks for select to authenticated using (true);
create policy "authenticated write price_checks" on public.price_checks for all to authenticated using (true) with check (true);
create policy "authenticated read channels" on public.channels for select to authenticated using (true);
create policy "authenticated write channels" on public.channels for all to authenticated using (true) with check (true);
create policy "authenticated read campaigns" on public.campaigns for select to authenticated using (true);
create policy "authenticated write campaigns" on public.campaigns for all to authenticated using (true) with check (true);
create policy "authenticated read campaign_items" on public.campaign_items for select to authenticated using (true);
create policy "authenticated write campaign_items" on public.campaign_items for all to authenticated using (true) with check (true);
create policy "authenticated read listings" on public.listings for select to authenticated using (true);
create policy "authenticated write listings" on public.listings for all to authenticated using (true) with check (true);
create policy "authenticated read sales" on public.sales for select to authenticated using (true);
create policy "authenticated write sales" on public.sales for all to authenticated using (true) with check (true);
create policy "authenticated read shipments" on public.shipments for select to authenticated using (true);
create policy "authenticated write shipments" on public.shipments for all to authenticated using (true) with check (true);
create policy "authenticated read audit_events" on public.audit_events for select to authenticated using (true);
create policy "authenticated write audit_events" on public.audit_events for all to authenticated using (true) with check (true);

insert into public.channels (id, name, type, status, automation_level, config)
values
  ('ebay', 'eBay', 'marketplace', 'planned', 'api-first', '{}'::jsonb),
  ('whatnot', 'Whatnot', 'live-commerce', 'manual-export-first', 'semi-automatic', '{}'::jsonb),
  ('strongvision_web', 'Strongvision Webseite', 'client-system', 'planned', 'sync', '{}'::jsonb),
  ('creators_shop', 'CREATORS Shop', 'owned-commerce', 'planned', 'api-first', '{}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  status = excluded.status,
  automation_level = excluded.automation_level;

insert into public.customers (name, slug, contact_name, contact_email, notes)
values ('Strongvision', 'strongvision', null, null, 'Pilotkunde fuer RAMROD Intake')
on conflict (slug) do update set
  name = excluded.name,
  notes = excluded.notes;

with strongvision as (
  select id from public.customers where slug = 'strongvision'
)
insert into public.boxes (customer_id, code, label, location, status)
select id, 'SV-001', 'Pokemon / TCG Mischkiste', 'CREATORS A-01', 'intake' from strongvision
union all
select id, 'SV-002', 'Retro Games & Konsolen', 'CREATORS A-02', 'scanned' from strongvision
union all
select id, 'SV-003', 'Figuren / Collectibles', 'CREATORS B-04', 'intake' from strongvision
on conflict (customer_id, code) do update set
  label = excluded.label,
  location = excluded.location,
  status = excluded.status;

insert into storage.buckets (id, name, public)
values ('ramrod-item-images', 'ramrod-item-images', false)
on conflict (id) do nothing;
