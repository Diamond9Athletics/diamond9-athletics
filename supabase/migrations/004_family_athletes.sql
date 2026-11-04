-- Family accounts: extra athletes (siblings) under one parent login.
-- The account's own profile stays its primary athlete (bookings.athlete_id
-- is null for them); a sibling's bookings point at their row here.
-- Credits stay on the account and are shared by the family; a Diamond
-- membership names its athlete in the Stripe subscription metadata.
create table if not exists public.athletes (
  id                 uuid primary key default gen_random_uuid(),
  parent_id          uuid not null references public.profiles(id) on delete cascade,
  first_name         text not null check (char_length(first_name) between 1 and 60),
  last_name          text check (char_length(last_name) <= 60),
  waiver_version     text,
  waiver_accepted_at timestamptz,
  waiver_guardian    text,
  archived_at        timestamptz,
  created_at         timestamptz not null default now()
);
create index if not exists athletes_parent_idx on public.athletes(parent_id);

-- Parents can read their own athletes; writes go through server routes.
alter table public.athletes enable row level security;
drop policy if exists "athletes parent read" on public.athletes;
create policy "athletes parent read" on public.athletes
  for select using (auth.uid() = parent_id);

-- No ON DELETE action: an athlete with bookings is archived, not deleted.
alter table public.bookings
  add column if not exists athlete_id uuid references public.athletes(id);
create index if not exists bookings_athlete_idx
  on public.bookings(athlete_id) where athlete_id is not null;
