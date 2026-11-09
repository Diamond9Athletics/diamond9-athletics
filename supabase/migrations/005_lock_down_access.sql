-- 005_lock_down_access.sql
-- Run once in the Supabase SQL editor. Safe to run more than once.
--
-- Closes three holes found Nov 9, 2026, each confirmed on the live database
-- with a throwaway account (deleted afterwards):
--   1. A signed-in customer could edit every field of their own profile,
--      is_admin included, and so give themselves the Control Room and
--      every athlete's bookings, purchases and contact details.
--   2. A signed-in customer could create or change bookings directly,
--      skipping credits, open hours and every other booking rule.
--   3. Anyone, signed in or not, could read the coaches' email and phone.
--
-- The website relies on none of these: bookings are written by its server,
-- and the server reads emails and phones with its own key.

-- 1. Customers can change their own name and phone, nothing else.
revoke update on public.profiles from anon, authenticated;
grant update (first_name, last_name, phone) on public.profiles to authenticated;

-- 2. Only the website's server creates or changes bookings.
drop policy if exists "booking self insert" on public.bookings;
drop policy if exists "booking self update" on public.bookings;

-- 3. Emails and phone numbers aren't readable from the browser, for anyone.
--    Names, roles and coach bios stay readable (the booking page and menu
--    use them); the database still limits which rows each person sees.
revoke select on public.profiles from anon, authenticated;
grant select (id, first_name, last_name, is_admin, is_trainer, trainer_slug, trainer_bio, trainer_categories, created_at)
  on public.profiles to anon, authenticated;
