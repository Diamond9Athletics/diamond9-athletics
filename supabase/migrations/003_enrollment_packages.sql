-- ============================================================
--  Migration 003 — enrollment-style packages
--  Some packages (e.g. College Summer, Summer Hitter Training) are
--  one-time payments for a full season program, not credit bundles.
--  Distinguish them with a 'kind' column. Credits-based packages
--  create credit_buckets on payment; enrollment packages don't.
-- ============================================================

alter table public.packages
  add column if not exists kind text not null default 'credits'
  check (kind in ('credits','enrollment'));

-- Add the two existing summer programs from the website.
insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days, kind)
select 'pitching-college-summer',
       'College Summer Pitching',
       id, 110000, 0, 0, 'enrollment'
from public.services where slug = 'pitching-60'
on conflict (slug) do nothing;

insert into public.packages (slug, name, service_id, price_cents, credits, expiry_days, kind)
select 'hitting-summer-training',
       'Summer Hitter Training',
       id, 110000, 0, 0, 'enrollment'
from public.services where slug = 'hitting-60'
on conflict (slug) do nothing;
