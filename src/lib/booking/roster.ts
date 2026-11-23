/**
 * The week's roster for building the schedule: every active athlete and
 * whether they've booked a session that week.
 *
 * "Active" is anyone the coaches would expect to see:
 *  - a Diamond member (read live from Stripe),
 *  - an account with sessions left on a plan (not expired) — the account
 *    holder, plus any brother or sister on it who has trained,
 *  - anyone who trained in the last RECENT_DAYS days,
 *  - and of course anyone booked that week.
 * Coaches' and admins' own accounts are left out.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { activeMemberships, DIAMOND_PITCHING_PRICE_ID } from "@/lib/stripe/subscription";
import { PRIMARY } from "@/lib/booking/athletes";
import { addDays, todayInStudio, weekBounds } from "@/lib/booking/coach-calendar";

export type RosterCategory = "pitching" | "hitting";

export type RosterSession = { startsAt: string; category: RosterCategory; coach: string };

export type RosterAthlete = {
  /** `${accountId}:${athleteKey}` */
  id: string;
  name: string;
  firstName: string;
  /** The account's phone: a parent's when the athlete is under 18. */
  phone: string | null;
  email: string | null;
  /** What they train, from their plan, membership and bookings. */
  categories: RosterCategory[];
  diamond: boolean;
  /** Sessions left on the account's plans, by kind. */
  sessionsLeft: Partial<Record<RosterCategory, number>>;
  /** Their most recent session before now (within HISTORY_DAYS). */
  lastSession: string | null;
  /** Booked this week. */
  thisWeek: RosterSession[];
  /** Their next booking after this week, if any. */
  nextAfter: string | null;
};

export type WeekRoster = {
  weekStart: string;
  athletes: RosterAthlete[];
  /** Stripe couldn't be reached, so Diamond members aren't marked. */
  membershipsUnavailable: boolean;
};

const RECENT_DAYS = 30;
const HISTORY_DAYS = 120;
const AHEAD_DAYS = 35;
const PAGE = 1000;
const PAST_STATUSES = ["confirmed", "late_cancelled", "completed", "no_show"];

type Category = RosterCategory;
type BookingRow = {
  user_id: string;
  athlete_id: string | null;
  starts_at: string;
  service: { category: string } | { category: string }[] | null;
  trainer?: { first_name: string | null } | { first_name: string | null }[] | null;
};
type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  is_trainer: boolean | null;
  is_admin: boolean | null;
};
type SiblingRow = { id: string; parent_id: string; first_name: string | null; last_name: string | null };

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));
const asCategory = (c: string | null | undefined): Category | null =>
  c === "pitching" || c === "hitting" ? c : null;
const fullName = (p: { first_name: string | null; last_name: string | null }) =>
  `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();

/** Every row of a query, a page at a time (the database caps one read at 1,000 rows). */
async function readAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) return rows;
  }
}

export async function loadWeekRoster(
  admin: SupabaseClient,
  weekStart: string,
  now = new Date(),
): Promise<WeekRoster> {
  const { start, end } = weekBounds(weekStart);
  const today = todayInStudio(now);
  const recentFrom = new Date(now.getTime() - RECENT_DAYS * 86_400_000);
  const historyFrom = new Date(now.getTime() - HISTORY_DAYS * 86_400_000);
  const aheadTo = weekBounds(addDays(weekStart, AHEAD_DAYS)).start;

  const membershipsPromise = activeMemberships(DIAMOND_PITCHING_PRICE_ID).then(
    (m) => ({ map: m, failed: false }),
    (e) => {
      console.warn("Roster: Diamond memberships unavailable:", (e as Error).message);
      return { map: new Map<string, Set<string>>(), failed: true };
    },
  );

  const [weekRows, pastRows, futureRows, buckets, profiles, memberships] = await Promise.all([
    readAll<BookingRow>((from, to) =>
      admin
        .from("bookings")
        .select("user_id, athlete_id, starts_at, service:services(category), trainer:profiles!bookings_trainer_id_fkey(first_name)")
        .eq("status", "confirmed")
        .gte("starts_at", start.toISOString())
        .lt("starts_at", end.toISOString())
        .order("starts_at")
        .order("id")
        .range(from, to),
    ),
    readAll<BookingRow>((from, to) =>
      admin
        .from("bookings")
        .select("user_id, athlete_id, starts_at, service:services(category)")
        .in("status", PAST_STATUSES)
        .gte("starts_at", historyFrom.toISOString())
        .lt("starts_at", now.toISOString())
        .order("starts_at")
        .order("id")
        .range(from, to),
    ),
    readAll<BookingRow>((from, to) =>
      admin
        .from("bookings")
        .select("user_id, athlete_id, starts_at, service:services(category)")
        .eq("status", "confirmed")
        .gte("starts_at", end.toISOString())
        .lt("starts_at", aheadTo.toISOString())
        .order("starts_at")
        .order("id")
        .range(from, to),
    ),
    readAll<{ user_id: string; credits_remaining: number; service: { category: string } | { category: string }[] | null }>(
      (from, to) =>
        admin
          .from("credit_buckets")
          .select("user_id, credits_remaining, service:services(category)")
          .gt("credits_remaining", 0)
          .or(`expires_at.is.null,expires_at.gte.${today}`)
          .order("id")
          .range(from, to),
    ),
    readAll<ProfileRow>((from, to) =>
      admin
        .from("profiles")
        .select("id, first_name, last_name, email, phone, is_trainer, is_admin")
        .order("id")
        .range(from, to),
    ),
    membershipsPromise,
  ]);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const staff = new Set(profiles.filter((p) => p.is_trainer || p.is_admin).map((p) => p.id));
  const profileByEmail = new Map(
    profiles.filter((p) => p.email).map((p) => [p.email!.trim().toLowerCase(), p]),
  );

  // Sessions left per account, by kind.
  const credits = new Map<string, Partial<Record<Category, number>>>();
  for (const b of buckets) {
    const category = asCategory(one(b.service)?.category);
    if (!category || staff.has(b.user_id)) continue;
    const c = credits.get(b.user_id) ?? {};
    c[category] = (c[category] ?? 0) + b.credits_remaining;
    credits.set(b.user_id, c);
  }

  // Diamond members: account id → athlete keys covered.
  const diamond = new Map<string, Set<string>>();
  for (const [email, keys] of memberships.map) {
    const p = profileByEmail.get(email);
    if (p && !staff.has(p.id)) diamond.set(p.id, keys);
  }

  // Brothers and sisters on the accounts we might show.
  const accountIds = new Set<string>([
    ...credits.keys(),
    ...diamond.keys(),
    ...[...weekRows, ...pastRows, ...futureRows].map((r) => r.user_id),
  ]);
  const siblings = accountIds.size
    ? await readAll<SiblingRow>((from, to) =>
        admin
          .from("athletes")
          .select("id, parent_id, first_name, last_name")
          .in("parent_id", [...accountIds])
          .is("archived_at", null)
          .order("id")
          .range(from, to),
      )
    : [];
  const siblingById = new Map(siblings.map((s) => [s.id, s]));

  const roster = new Map<string, RosterAthlete & { cats: Set<Category> }>();
  const keyFor = (userId: string, athleteId: string | null) => `${userId}:${athleteId ?? PRIMARY}`;

  /** The athlete's entry, made on first sight. null for staff, unknown or archived people. */
  const ensure = (userId: string, athleteId: string | null) => {
    if (staff.has(userId)) return null;
    const id = keyFor(userId, athleteId);
    const existing = roster.get(id);
    if (existing) return existing;
    const account = profileById.get(userId);
    if (!account) return null;
    const person = athleteId ? siblingById.get(athleteId) : account;
    if (!person) return null;
    const name = fullName(person) || account.email || "Athlete";
    const entry = {
      id,
      name,
      firstName: person.first_name?.trim() || name,
      phone: account.phone,
      email: account.email,
      categories: [],
      cats: new Set<Category>(),
      diamond: false,
      sessionsLeft: credits.get(userId) ?? {},
      lastSession: null,
      thisWeek: [],
      nextAfter: null,
    };
    roster.set(id, entry);
    return entry;
  };

  const trainedEver = new Set([...weekRows, ...pastRows, ...futureRows].map((r) => keyFor(r.user_id, r.athlete_id)));

  // 1. Diamond members.
  for (const [userId, keys] of diamond) {
    for (const key of keys) {
      const entry = ensure(userId, key === PRIMARY ? null : key);
      if (entry) {
        entry.diamond = true;
        entry.cats.add("pitching");
      }
    }
  }
  // 2. Sessions left: the account holder, plus siblings who have trained.
  for (const [userId, left] of credits) {
    const people: (string | null)[] = [null, ...siblings.filter((s) => s.parent_id === userId).map((s) => s.id)];
    for (const athleteId of people) {
      if (athleteId && !trainedEver.has(keyFor(userId, athleteId))) continue;
      const entry = ensure(userId, athleteId);
      if (!entry) continue;
      for (const c of Object.keys(left) as Category[]) entry.cats.add(c);
    }
  }
  // 3. Trained recently.
  for (const r of pastRows) {
    if (new Date(r.starts_at) < recentFrom) continue;
    const entry = ensure(r.user_id, r.athlete_id);
    const c = asCategory(one(r.service)?.category);
    if (entry && c) entry.cats.add(c);
  }
  // 4. Booked this week.
  for (const r of weekRows) {
    const entry = ensure(r.user_id, r.athlete_id);
    const c = asCategory(one(r.service)?.category);
    if (!entry || !c) continue;
    entry.cats.add(c);
    entry.thisWeek.push({ startsAt: r.starts_at, category: c, coach: one(r.trainer)?.first_name?.trim() ?? "" });
  }
  // Context for everyone on the list: last session, next one after this week.
  for (const r of pastRows) {
    const entry = roster.get(keyFor(r.user_id, r.athlete_id));
    if (entry && (!entry.lastSession || r.starts_at > entry.lastSession)) entry.lastSession = r.starts_at;
  }
  for (const r of futureRows) {
    const entry = roster.get(keyFor(r.user_id, r.athlete_id));
    if (entry && (!entry.nextAfter || r.starts_at < entry.nextAfter)) entry.nextAfter = r.starts_at;
  }

  const athletes = [...roster.values()]
    .map(({ cats, ...a }) => ({ ...a, categories: (["pitching", "hitting"] as const).filter((c) => cats.has(c)) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { weekStart, athletes, membershipsUnavailable: memberships.failed };
}
