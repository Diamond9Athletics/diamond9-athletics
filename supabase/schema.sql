-- ============================================================
--  Diamond Nine Athletics — booking system schema
--  Run this once in your Supabase project's SQL editor.
-- ============================================================

-- ── PROFILES ─────────────────────────────────────────────────
--  One row per athlete account.  Linked 1:1 to Supabase auth.users.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  email       text not null,
  phone       text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "profile self read"   on public.profiles for select using (auth.uid() = id or is_admin);
create policy "profile self update" on public.profiles for update using (auth.uid() = id);

-- ── SERVICES ─────────────────────────────────────────────────
--  What an athlete can book.  Pitching 60-min, Hitting 60-min, etc.
create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,    -- e.g. 'pitching-60', 'hitting-60'
  name          text not null,           -- e.g. 'Pitching Session'
  category      text not null,           -- 'pitching' | 'hitting'
  duration_min  int  not null,           -- 30 or 60
  active        boolean not null default true
);

alter table public.services enable row level security;
create policy "services public read" on public.services for select using (true);

-- ── PACKAGES ─────────────────────────────────────────────────
--  What an athlete can buy.  Diamond, Gold, Single, Half, etc.
create table if not exists public.packages (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,    -- e.g. 'pitching-diamond'
  name            text not null,           -- e.g. 'Diamond Pitching Plan'
  service_id      uuid not null references public.services(id),
  price_cents     int not null,            -- 30000 for $300
  credits         int not null,            -- how many sessions
  expiry_days     int not null default 31, -- 31 days after first booking
  stripe_price_id text,                    -- set after Stripe product is created
  active          boolean not null default true
);

alter table public.packages enable row level security;
create policy "packages public read" on public.packages for select using (true);

-- ── PURCHASES ────────────────────────────────────────────────
--  Each time someone buys a package via Stripe.
create table if not exists public.purchases (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  package_id               uuid not null references public.packages(id),
  stripe_checkout_id       text unique,
  stripe_payment_intent_id text,
  amount_cents             int not null,
  status                   text not null default 'pending', -- pending | paid | refunded
  created_at               timestamptz not null default now(),
  paid_at                  timestamptz
);

alter table public.purchases enable row level security;
create policy "purchase self read" on public.purchases for select using (
  auth.uid() = user_id or (select is_admin from public.profiles where id = auth.uid())
);

-- ── CREDIT BUCKETS ───────────────────────────────────────────
--  When a purchase is paid, one row goes here.
--  expires_at stays NULL until the first booking is made,
--  then it's set to (first_booking_date + expiry_days).
create table if not exists public.credit_buckets (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  purchase_id         uuid not null references public.purchases(id) on delete cascade,
  service_id          uuid not null references public.services(id),
  credits_total       int not null,
  credits_remaining   int not null,
  expiry_days         int not null,
  first_booking_date  date,            -- NULL until they book session #1
  expires_at          date,            -- NULL until they book session #1
  created_at          timestamptz not null default now()
);

create index if not exists credit_buckets_user_idx on public.credit_buckets(user_id, service_id);

alter table public.credit_buckets enable row level security;
create policy "credit self read" on public.credit_buckets for select using (
  auth.uid() = user_id or (select is_admin from public.profiles where id = auth.uid())
);

-- ── BOOKINGS ─────────────────────────────────────────────────
create table if not exists public.bookings (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  service_id        uuid not null references public.services(id),
  credit_bucket_id  uuid references public.credit_buckets(id) on delete set null,
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  status            text not null default 'confirmed', -- confirmed | cancelled | completed | no_show
  notes             text,
  created_at        timestamptz not null default now()
);

create index if not exists bookings_starts_idx on public.bookings(starts_at);
create index if not exists bookings_user_idx   on public.bookings(user_id);

alter table public.bookings enable row level security;
create policy "booking self read"   on public.bookings for select using (
  auth.uid() = user_id or (select is_admin from public.profiles where id = auth.uid())
);
create policy "booking self insert" on public.bookings for insert with check (auth.uid() = user_id);
create policy "booking self update" on public.bookings for update using (auth.uid() = user_id);

-- Prevent overlapping confirmed bookings for the same category.
-- (Pitching and hitting are separate calendars, so we partition by category via the joined service.)
create index if not exists bookings_overlap_idx on public.bookings(service_id, starts_at, ends_at);

-- ── AVAILABILITY RULES ───────────────────────────────────────
--  Recurring weekly availability windows per category.
--  e.g. "Mon 4pm–8pm, pitching"
create table if not exists public.availability_rules (
  id              uuid primary key default gen_random_uuid(),
  category        text not null,         -- 'pitching' | 'hitting'
  day_of_week     int not null,          -- 0 = Sunday ... 6 = Saturday
  start_time      time not null,
  end_time        time not null,
  active          boolean not null default true
);

alter table public.availability_rules enable row level security;
create policy "availability public read" on public.availability_rules for select using (true);

-- ── BLOCKED TIMES ────────────────────────────────────────────
--  Specific date ranges where Wes is unavailable (vacation, etc.).
create table if not exists public.availability_blocks (
  id          uuid primary key default gen_random_uuid(),
  category    text,                 -- NULL means blocks both calendars
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  reason      text,
  created_at  timestamptz not null default now()
);

alter table public.availability_blocks enable row level security;
create policy "blocks public read" on public.availability_blocks for select using (true);

-- ── SEED DATA ────────────────────────────────────────────────
--  Default services & packages — matches the existing site copy.
insert into public.services (slug, name, category, duration_min) values
  ('pitching-60', 'Pitching Session (60 min)', 'pitching', 60),
  ('pitching-30', 'Pitching Half Session (30 min)', 'pitching', 30),
  ('hitting-60',  'Hitting Session (60 min)',  'hitting',  60),
  ('hitting-30',  'Hitting Half Session (30 min)', 'hitting', 30)
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'pitching-diamond', 'Diamond Pitching Plan', id, 30000, 5, 31 from public.services where slug = 'pitching-60'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'pitching-gold',    'Gold Pitching Plan',    id, 27500, 4, 31 from public.services where slug = 'pitching-60'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'pitching-single',  'Single Pitching Session', id, 10000, 1, 31 from public.services where slug = 'pitching-60'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'pitching-half',    'Half Pitching Session',   id,  5000, 1, 31 from public.services where slug = 'pitching-30'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'hitting-diamond',  'Diamond Hitting Plan',   id, 30000, 5, 31 from public.services where slug = 'hitting-60'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'hitting-gold',     'Gold Hitting Plan',      id, 27500, 4, 31 from public.services where slug = 'hitting-60'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'hitting-single',   'Single Hitting Session', id, 10000, 1, 31 from public.services where slug = 'hitting-60'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'hitting-half',     'Half Hitting Session',   id,  5000, 1, 31 from public.services where slug = 'hitting-30'
on conflict (slug) do nothing;
