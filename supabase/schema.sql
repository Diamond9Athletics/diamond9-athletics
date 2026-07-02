-- ============================================================
--  Diamond Nine Athletics — booking system schema
--  Run this once in your Supabase project's SQL editor.
-- ============================================================

-- ── PROFILES ─────────────────────────────────────────────────
--  One row per account.  Linked 1:1 to Supabase auth.users.
--  Both athletes and trainers live here, distinguished by is_trainer.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  email       text not null,
  phone       text,
  is_admin    boolean not null default false,
  is_trainer  boolean not null default false,
  trainer_slug text unique,             -- e.g. 'wes', 'turner' (only set for trainers)
  trainer_bio  text,                    -- short bio shown on the picker
  trainer_categories text[],            -- e.g. ['pitching'] or ['pitching','hitting']
  created_at  timestamptz not null default now()
);

create index if not exists profiles_trainer_idx on public.profiles(is_trainer) where is_trainer;

alter table public.profiles enable row level security;
-- Anyone can read trainer profiles (for the trainer picker).
-- Athletes can read & update only their own row.
create policy "profile trainer public read" on public.profiles for select using (is_trainer);
create policy "profile self read"           on public.profiles for select using (auth.uid() = id);
create policy "profile self update"         on public.profiles for update using (auth.uid() = id);

-- ── TRAINER GOOGLE CALENDAR OAUTH ────────────────────────────
--  One row per trainer who has connected their Google Calendar.
--  Tokens let the server read busy times + create/delete events.
create table if not exists public.trainer_google_oauth (
  trainer_id      uuid primary key references public.profiles(id) on delete cascade,
  calendar_id     text not null,        -- Google calendar ID to read/write
  access_token    text not null,
  refresh_token   text not null,
  token_expires_at timestamptz not null,
  connected_at    timestamptz not null default now(),
  -- nothing here is public; service_role only
  check (calendar_id <> '')
);

alter table public.trainer_google_oauth enable row level security;
-- No client policies — only the server (service_role) touches this table.

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
  trainer_id        uuid not null references public.profiles(id),
  service_id        uuid not null references public.services(id),
  credit_bucket_id  uuid references public.credit_buckets(id) on delete set null,
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  status            text not null default 'confirmed', -- confirmed | cancelled | completed | no_show
  notes             text,
  google_event_id   text,               -- ID of the event on the trainer's Google Calendar
  created_at        timestamptz not null default now()
);

create index if not exists bookings_starts_idx     on public.bookings(starts_at);
create index if not exists bookings_user_idx       on public.bookings(user_id);
create index if not exists bookings_trainer_idx    on public.bookings(trainer_id, starts_at);

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
--  Recurring weekly availability windows, per trainer.
--  e.g. "Wes is available Mon 4pm-8pm for pitching"
create table if not exists public.availability_rules (
  id              uuid primary key default gen_random_uuid(),
  trainer_id      uuid not null references public.profiles(id) on delete cascade,
  category        text not null,         -- 'pitching' | 'hitting'
  day_of_week     int not null,          -- 0 = Sunday ... 6 = Saturday
  start_time      time not null,
  end_time        time not null,
  active          boolean not null default true
);

create index if not exists availability_rules_trainer_idx
  on public.availability_rules(trainer_id, day_of_week);

alter table public.availability_rules enable row level security;
create policy "availability public read" on public.availability_rules for select using (true);

-- ── BLOCKED TIMES ────────────────────────────────────────────
--  Specific date ranges where a trainer is unavailable.
--  trainer_id NULL = blocks every trainer (site-wide closure).
--  In day-to-day use we'll mostly rely on Google Calendar busy times
--  instead of this table, but it's here for manual overrides.
create table if not exists public.availability_blocks (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid references public.profiles(id) on delete cascade,
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
select 'pitching-diamond', 'Diamond Pitching Plan', id, 30000, 4, 31 from public.services where slug = 'pitching-60'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'pitching-gold',    'Gold Pitching Plan',    id, 27500, 3, 31 from public.services where slug = 'pitching-60'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'pitching-single',  'Single Pitching Session', id, 10000, 1, 31 from public.services where slug = 'pitching-60'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'pitching-half',    'Half Pitching Session',   id,  5000, 1, 31 from public.services where slug = 'pitching-30'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'hitting-diamond',  'Diamond Hitting Plan',   id, 30000, 4, 31 from public.services where slug = 'hitting-60'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'hitting-gold',     'Gold Hitting Plan',      id, 27500, 3, 31 from public.services where slug = 'hitting-60'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'hitting-single',   'Single Hitting Session', id, 10000, 1, 31 from public.services where slug = 'hitting-60'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days)
select 'hitting-half',     'Half Hitting Session',   id,  5000, 1, 31 from public.services where slug = 'hitting-30'
on conflict (slug) do nothing;
