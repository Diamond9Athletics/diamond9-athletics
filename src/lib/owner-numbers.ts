/**
 * Everything on the owner dashboard (/book/admin/numbers), in one load.
 *
 * Money comes from Stripe, so it matches the Stripe dashboard: a charge is
 * membership money when it paid a subscription invoice, package money
 * otherwise. Sessions, hours and unused credits come from the database.
 * All dates are studio (Central) time; weeks run Monday to Sunday.
 */
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { DIAMOND_PITCHING_PRICE_ID } from "@/lib/stripe/subscription";
import { STUDIO_TZ, dayOfWeekInZone, zonedWallToUtc } from "@/lib/booking/tz";
import { addDays, mondayOf, todayInStudio } from "@/lib/booking/coach-calendar";

export type MonthRevenue = {
  key: string; // 2026-11
  label: string; // Nov
  memberships: number; // cents
  packages: number; // cents
  refunds: number; // cents
  partial: boolean; // the current month, so far
};

export type Revenue = {
  months: MonthRevenue[];
  /** This month so far, after refunds, and last month up to the same day. */
  thisMonthToDate: number;
  lastMonthToDate: number;
};

export type Members = {
  active: number;
  /** Paid memberships still renewing, per month. */
  monthlyIncome: number;
  startedThisMonth: number;
  endedThisMonth: number;
  cancelling: { name: string; endsOn: string | null }[];
  names: string[];
};

export type WeekSessions = {
  weekStart: string;
  label: string;
  pitching: number;
  hitting: number;
  when: "past" | "this" | "next";
};

export type CoachFill = {
  name: string;
  weeks: { label: string; openHours: number; bookedHours: number }[];
};

export type Busiest = {
  days: string[];
  hours: number[];
  /** counts[day][hour index]: sessions starting then, over `weeks` weeks. */
  counts: number[][];
  weeks: number;
};

export type Unused = {
  sessions: number;
  accounts: number;
  valueCents: number;
  notStarted: number;
  pitching: number;
  hitting: number;
  expiringSoon: { name: string; sessions: number; expiresOn: string }[];
};

export type OwnerNumbers = {
  today: string;
  revenue: Revenue | { error: string };
  members: Members | { error: string };
  sessions: WeekSessions[];
  fill: CoachFill[];
  busiest: Busiest;
  unused: Unused;
  signupsThisMonth: number;
};

const ENTITLED = new Set(["active", "trialing"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ctDate = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: STUDIO_TZ });
const monthKey = (ms: number) => ctDate(ms).slice(0, 7);
const shortDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" });

const hourParts = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDIO_TZ,
  weekday: "short",
  hour: "numeric",
  hourCycle: "h23",
});
function ctWeekdayHour(iso: string): { day: number; hour: number } {
  const parts = hourParts.formatToParts(new Date(iso));
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  // Monday first.
  return { day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday), hour };
}

/** The last `count` months, oldest first, with their UTC bounds. */
function recentMonths(today: string, count: number) {
  const [y, m] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const back = count - 1 - i;
    const d = new Date(Date.UTC(y, m - 1 - back, 1));
    const key = d.toISOString().slice(0, 7);
    const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 7);
    return {
      key,
      label: d.toLocaleDateString("en-US", { timeZone: "UTC", month: "short" }),
      start: zonedWallToUtc(`${key}-01`, "00:00"),
      end: zonedWallToUtc(`${next}-01`, "00:00"),
    };
  });
}

// ── Money ──────────────────────────────────────────────────────────────────

async function loadRevenue(today: string): Promise<Revenue> {
  const months = recentMonths(today, 6);
  const byKey = new Map<string, MonthRevenue>(
    months.map((m, i) => [
      m.key,
      { key: m.key, label: m.label, memberships: 0, packages: 0, refunds: 0, partial: i === months.length - 1 },
    ]),
  );
  const since = Math.floor(months[0].start.getTime() / 1000);
  const thisKey = months[months.length - 1].key;
  const lastKey = months[months.length - 2].key;
  const dayOfMonth = Number(today.slice(8, 10));

  // Payments that paid a membership invoice.
  const membershipPayments = new Set<string>();
  for await (const invoice of stripe.invoices.list({
    status: "paid",
    created: { gte: since - 40 * 86_400 },
    limit: 100,
    expand: ["data.payments"],
  })) {
    if (invoice.parent?.type !== "subscription_details") continue;
    for (const p of invoice.payments?.data ?? []) {
      const pi = p.payment?.payment_intent;
      if (pi) membershipPayments.add(typeof pi === "string" ? pi : pi.id);
    }
  }

  let thisMonthToDate = 0;
  let lastMonthToDate = 0;
  const lastMonthUpTo = (ms: number) => monthKey(ms) === lastKey && Number(ctDate(ms).slice(8, 10)) <= dayOfMonth;

  for await (const charge of stripe.charges.list({ created: { gte: since }, limit: 100 })) {
    if (charge.status !== "succeeded" || !charge.paid) continue;
    const ms = charge.created * 1000;
    const month = byKey.get(monthKey(ms));
    if (!month) continue;
    const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
    if (pi && membershipPayments.has(pi)) month.memberships += charge.amount;
    else month.packages += charge.amount;
    if (month.key === thisKey) thisMonthToDate += charge.amount;
    if (lastMonthUpTo(ms)) lastMonthToDate += charge.amount;
  }

  for await (const refund of stripe.refunds.list({ created: { gte: since }, limit: 100 })) {
    if (refund.status !== "succeeded") continue;
    const ms = refund.created * 1000;
    const month = byKey.get(monthKey(ms));
    if (!month) continue;
    month.refunds += refund.amount;
    if (month.key === thisKey) thisMonthToDate -= refund.amount;
    if (lastMonthUpTo(ms)) lastMonthToDate -= refund.amount;
  }

  return { months: [...byKey.values()], thisMonthToDate, lastMonthToDate };
}

async function loadMembers(admin: SupabaseClient, monthStart: Date): Promise<Members> {
  const subs: Stripe.Subscription[] = [];
  for await (const sub of stripe.subscriptions.list({
    price: DIAMOND_PITCHING_PRICE_ID,
    status: "all",
    limit: 100,
    expand: ["data.customer"],
  })) {
    subs.push(sub);
  }

  // Names: the brother or sister it covers, else the account holder by email.
  const siblingIds = new Set<string>();
  const emailOf = (sub: Stripe.Subscription) => {
    const c = sub.customer;
    return typeof c === "object" && c && !("deleted" in c && c.deleted) ? (c.email ?? "").trim().toLowerCase() : "";
  };
  for (const sub of subs) {
    const athlete = sub.metadata?.athlete_id;
    if (athlete && UUID.test(athlete)) siblingIds.add(athlete);
  }
  // Emails can differ in case between Stripe and the site, so match in code.
  const [{ data: profiles }, { data: siblings }] = await Promise.all([
    admin.from("profiles").select("email, first_name, last_name"),
    siblingIds.size
      ? admin.from("athletes").select("id, first_name, last_name").in("id", [...siblingIds])
      : Promise.resolve({ data: [] as { id: string; first_name: string | null; last_name: string | null }[] }),
  ]);
  const full = (p?: { first_name: string | null; last_name: string | null } | null) =>
    p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() : "";
  const byEmail = new Map((profiles ?? []).map((p) => [(p.email ?? "").trim().toLowerCase(), full(p)]));
  const bySibling = new Map((siblings ?? []).map((s) => [s.id, full(s)]));
  const nameOf = (sub: Stripe.Subscription) => {
    const athlete = sub.metadata?.athlete_id;
    return (
      (athlete && bySibling.get(athlete)) ||
      byEmail.get(emailOf(sub)) ||
      emailOf(sub) ||
      "Unknown customer"
    );
  };

  const since = monthStart.getTime() / 1000;
  const active = subs.filter((s) => ENTITLED.has(s.status));
  const leaving = (s: Stripe.Subscription) => s.cancel_at_period_end || Boolean(s.cancel_at);
  const endOf = (s: Stripe.Subscription) => {
    const end = s.cancel_at ?? s.items.data[0]?.current_period_end;
    return end ? ctDate(end * 1000) : null;
  };

  return {
    active: active.length,
    monthlyIncome: active
      .filter((s) => !leaving(s))
      .reduce((n, s) => n + s.items.data.reduce((m, item) => m + (item.price.unit_amount ?? 0) * (item.quantity ?? 1), 0), 0),
    startedThisMonth: subs.filter((s) => s.created >= since && !s.status.startsWith("incomplete")).length,
    endedThisMonth: subs.filter((s) => s.status === "canceled" && (s.ended_at ?? s.canceled_at ?? 0) >= since).length,
    cancelling: active
      .filter(leaving)
      .map((s) => ({ name: nameOf(s), endsOn: endOf(s) }))
      .sort((a, b) => (a.endsOn ?? "").localeCompare(b.endsOn ?? "")),
    names: active.map(nameOf).sort((a, b) => a.localeCompare(b)),
  };
}

// ── Time: merged intervals in epoch ms ─────────────────────────────────────

type Span = [number, number];

function merge(spans: Span[]): Span[] {
  const sorted = spans.filter(([s, e]) => e > s).sort((a, b) => a[0] - b[0]);
  const out: Span[] = [];
  for (const [s, e] of sorted) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

function subtract(spans: Span[], cuts: Span[]): Span[] {
  let out = spans;
  for (const [cs, ce] of cuts) {
    out = out.flatMap(([s, e]): Span[] => {
      if (ce <= s || cs >= e) return [[s, e]];
      const keep: Span[] = [];
      if (cs > s) keep.push([s, cs]);
      if (ce < e) keep.push([ce, e]);
      return keep;
    });
  }
  return out;
}

function overlap(a: Span[], b: Span[]): number {
  let total = 0;
  for (const [as, ae] of a) for (const [bs, be] of b) total += Math.max(0, Math.min(ae, be) - Math.max(as, bs));
  return total;
}

const length = (spans: Span[]) => spans.reduce((n, [s, e]) => n + (e - s), 0);

// ── The whole dashboard ────────────────────────────────────────────────────

type Rule = { trainer_id: string; day_of_week: number; start_time: string; end_time: string; active: boolean };

export async function loadOwnerNumbers(admin: SupabaseClient, now = new Date()): Promise<OwnerNumbers> {
  const today = todayInStudio(now);
  const thisMonday = mondayOf(today);
  const monthStart = zonedWallToUtc(`${today.slice(0, 7)}-01`, "00:00");
  const PAST_WEEKS = 8;
  const from = zonedWallToUtc(addDays(thisMonday, -7 * PAST_WEEKS), "00:00");
  const to = zonedWallToUtc(addDays(thisMonday, 14), "00:00");

  const [revenue, members, db] = await Promise.all([
    loadRevenue(today).catch((e: Error) => ({ error: e.message })),
    loadMembers(admin, monthStart).catch((e: Error) => ({ error: e.message })),
    Promise.all([
      admin
        .from("bookings")
        .select("trainer_id, starts_at, ends_at, service:services(category)")
        .eq("status", "confirmed")
        .gte("starts_at", from.toISOString())
        .lt("starts_at", to.toISOString()),
      admin.from("profiles").select("id, first_name, last_name").eq("is_trainer", true),
      admin.from("availability_rules").select("trainer_id, day_of_week, start_time, end_time, active").eq("active", true),
      admin
        .from("availability_blocks")
        .select("trainer_id, starts_at, ends_at")
        .lt("starts_at", to.toISOString())
        // Time off only matters from last week on.
        .gt("ends_at", zonedWallToUtc(addDays(thisMonday, -7), "00:00").toISOString()),
      admin
        .from("credit_buckets")
        .select("user_id, credits_total, credits_remaining, expires_at, service:services(category), purchase:purchases(amount_cents)")
        .gt("credits_remaining", 0)
        .or(`expires_at.is.null,expires_at.gte.${today}`),
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_trainer", false)
        .eq("is_admin", false)
        .gte("created_at", monthStart.toISOString()),
    ]),
  ]);
  const [{ data: bookings }, { data: coaches }, { data: rules }, { data: blocks }, { data: buckets }, { count: signups }] = db;

  const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));
  const confirmed = (bookings ?? []).map((b) => ({
    trainer: b.trainer_id as string,
    start: Date.parse(b.starts_at),
    end: Date.parse(b.ends_at),
    startsAt: b.starts_at as string,
    category: (one(b.service as { category: string } | { category: string }[] | null)?.category ?? "pitching") as string,
  }));

  // Sessions per week: 8 past weeks, this week, next week.
  const sessions: WeekSessions[] = Array.from({ length: PAST_WEEKS + 2 }, (_, i) => {
    const weekStart = addDays(thisMonday, 7 * (i - PAST_WEEKS));
    const start = zonedWallToUtc(weekStart, "00:00").getTime();
    const end = zonedWallToUtc(addDays(weekStart, 7), "00:00").getTime();
    const inWeek = confirmed.filter((b) => b.start >= start && b.start < end);
    return {
      weekStart,
      label: shortDate(weekStart),
      pitching: inWeek.filter((b) => b.category !== "hitting").length,
      hitting: inWeek.filter((b) => b.category === "hitting").length,
      when: i < PAST_WEEKS ? "past" : i === PAST_WEEKS ? "this" : "next",
    };
  });

  // How full each coach's open hours are: last week, this week, next week.
  const fill: CoachFill[] = (coaches ?? [])
    .map((coach) => {
      const mine = ((rules ?? []) as Rule[]).filter((r) => r.trainer_id === coach.id);
      const off: Span[] = (blocks ?? [])
        .filter((b) => b.trainer_id === coach.id)
        .map((b) => [Date.parse(b.starts_at), Date.parse(b.ends_at)]);
      const booked = merge(confirmed.filter((b) => b.trainer === coach.id).map((b): Span => [b.start, b.end]));
      const weeks = [-1, 0, 1].map((offset) => {
        const weekStart = addDays(thisMonday, 7 * offset);
        const open: Span[] = [];
        for (let d = 0; d < 7; d++) {
          const date = addDays(weekStart, d);
          const dow = dayOfWeekInZone(date);
          for (const r of mine.filter((r) => r.day_of_week === dow)) {
            open.push([
              zonedWallToUtc(date, r.start_time.slice(0, 5)).getTime(),
              zonedWallToUtc(date, r.end_time.slice(0, 5)).getTime(),
            ]);
          }
        }
        const openSpans = subtract(merge(open), merge(off));
        return {
          label: offset === -1 ? "Last week" : offset === 0 ? "This week" : "Next week",
          openHours: length(openSpans) / 3_600_000,
          bookedHours: overlap(openSpans, booked) / 3_600_000,
        };
      });
      return { name: `${coach.first_name ?? ""} ${coach.last_name ?? ""}`.trim() || "Coach", weeks, hasHours: mine.length > 0 };
    })
    .filter((c) => c.hasHours)
    .map(({ name, weeks }) => ({ name, weeks }));

  // Busiest times over the 8 finished weeks before this one.
  const allRules = (rules ?? []) as Rule[];
  const firstHour = allRules.length ? Math.min(...allRules.map((r) => Number(r.start_time.slice(0, 2)))) : 8;
  const lastHour = allRules.length ? Math.max(...allRules.map((r) => Math.ceil(Number(r.end_time.slice(0, 2)) + Number(r.end_time.slice(3, 5)) / 60))) : 21;
  const hours = Array.from({ length: Math.max(1, lastHour - firstHour) }, (_, i) => firstHour + i);
  const counts = Array.from({ length: 7 }, () => hours.map(() => 0));
  const thisWeekStart = zonedWallToUtc(thisMonday, "00:00").getTime();
  for (const b of confirmed) {
    if (b.start >= thisWeekStart) continue;
    const { day, hour } = ctWeekdayHour(b.startsAt);
    const h = hours.indexOf(hour);
    if (day >= 0 && h >= 0) counts[day][h]++;
  }

  // Sessions paid for and not used yet.
  type BucketRow = {
    user_id: string;
    credits_total: number;
    credits_remaining: number;
    expires_at: string | null;
    service: { category: string } | { category: string }[] | null;
    purchase: { amount_cents: number | null } | { amount_cents: number | null }[] | null;
  };
  const rows = (buckets ?? []) as BucketRow[];
  const soonCutoff = addDays(today, 7);
  const soon = rows.filter((b) => b.expires_at && b.expires_at <= soonCutoff);
  const soonIds = [...new Set(soon.map((b) => b.user_id))];
  const { data: soonPeople } = soonIds.length
    ? await admin.from("profiles").select("id, first_name, last_name").in("id", soonIds)
    : { data: [] as { id: string; first_name: string | null; last_name: string | null }[] };
  const personName = new Map((soonPeople ?? []).map((p) => [p.id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Athlete"]));
  const expiring = new Map<string, { name: string; sessions: number; expiresOn: string }>();
  for (const b of soon) {
    const key = `${b.user_id}|${b.expires_at}`;
    const entry = expiring.get(key) ?? { name: personName.get(b.user_id) ?? "Athlete", sessions: 0, expiresOn: b.expires_at! };
    entry.sessions += b.credits_remaining;
    expiring.set(key, entry);
  }

  const unused: Unused = {
    sessions: rows.reduce((n, b) => n + b.credits_remaining, 0),
    accounts: new Set(rows.map((b) => b.user_id)).size,
    valueCents: Math.round(
      rows.reduce((n, b) => {
        const paid = one(b.purchase)?.amount_cents ?? 0;
        return n + (b.credits_total > 0 ? (paid * b.credits_remaining) / b.credits_total : 0);
      }, 0),
    ),
    notStarted: rows.filter((b) => !b.expires_at).reduce((n, b) => n + b.credits_remaining, 0),
    pitching: rows.filter((b) => one(b.service)?.category !== "hitting").reduce((n, b) => n + b.credits_remaining, 0),
    hitting: rows.filter((b) => one(b.service)?.category === "hitting").reduce((n, b) => n + b.credits_remaining, 0),
    expiringSoon: [...expiring.values()].sort((a, b) => a.expiresOn.localeCompare(b.expiresOn)),
  };

  return {
    today,
    revenue,
    members,
    sessions,
    fill,
    busiest: { days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], hours, counts, weeks: PAST_WEEKS },
    unused,
    signupsThisMonth: signups ?? 0,
  };
}

