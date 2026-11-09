/**
 * Check-in emails: short notes from Wes that bring athletes back in. A
 * daily run (/api/cron/send-checkins) looks at every account and sends at
 * most one, the first that applies:
 *
 *   expiring         credits that run out within 7 days
 *   member_idle      a Diamond member with no session this past week and
 *                    nothing on the calendar
 *   credits_waiting  credits on the account, nothing booked, no session in
 *                    2 weeks
 *   review           3+ sessions, trained in the last 30 days: asks once
 *                    for a Google review
 *   never_booked     signed up 3–60 days ago, never booked, bought nothing
 *   lapsed           no credits or membership, last session 30–120 days ago
 *
 * never_booked and lapsed are promotional, so they wait for the studio's
 * mailing address; review waits for the Google review link (both in
 * CHECKIN_SETTINGS).
 *
 * Each kind has its own cooldown, nobody gets more than one a week, coaches
 * never get them, and anyone can turn them off from the link in the email.
 * What was sent when lives in the account's app_metadata.checkins.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { shell } from "@/lib/email";
import { todayInStudio } from "@/lib/booking/coach-calendar";
import { STUDIO_TZ } from "@/lib/booking/tz";

/** Off until Wes approves the wording: the daily run reports who would get
 *  what and sends nothing. */
export const CHECKINS_LIVE = false;

export const CHECKIN_SETTINGS = {
  /** The studio's mailing address, shown at the bottom of every check-in.
   *  U.S. law (CAN-SPAM) requires one on promotional email, so the
   *  promotional kinds don't go out while it's empty. */
  mailingAddress: "",
  /** Where the review request sends people (Google Business Profile → "Ask
   *  for reviews"). The review request doesn't go out while it's empty. */
  reviewUrl: "",
};

const PROMOTIONAL: ReadonlySet<CheckinKind> = new Set(["never_booked", "lapsed"]);

export type CheckinKind =
  | "expiring"
  | "member_idle"
  | "review"
  | "credits_waiting"
  | "never_booked"
  | "lapsed";

/** Days before the same kind can go to the same person again. */
const COOLDOWN_DAYS: Record<CheckinKind, number> = {
  expiring: 30,
  member_idle: 14,
  review: Infinity,
  credits_waiting: 21,
  never_booked: Infinity,
  lapsed: 60,
};

/** Fewest days between any two check-ins to one person. */
const MIN_GAP_DAYS = 7;

const SITE = "https://www.diamond9athletics.com";

/** Studio dates (YYYY-MM-DD) each kind was last sent, plus `last` for any. */
export type CheckinLog = Partial<Record<CheckinKind | "last", string>>;

export type CheckinAccount = {
  userId: string;
  email: string;
  firstName: string | null;
  createdAt: string;
  staff: boolean;
  optedOut: boolean;
  sent: CheckinLog;
  member: boolean;
  credits: { remaining: number; expiresAt: string | null; createdAt: string }[];
  lastSession: { startsAt: string; category: string | null } | null;
  /** Confirmed sessions that have already happened. */
  pastSessions: number;
  hasUpcoming: boolean;
  everBooked: boolean;
};

export type Checkin = { kind: CheckinKind; subject: string; html: string };

const studioDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: STUDIO_TZ });

/** Whole days from date a to date b (YYYY-MM-DD). */
const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

/** The check-in this account should get today, if any. */
export function pickCheckin(a: CheckinAccount, today: string): Checkin | null {
  if (a.staff || a.optedOut || !a.email) return null;
  if (a.sent.last && daysBetween(a.sent.last, today) < MIN_GAP_DAYS) return null;
  const due = (kind: CheckinKind) => {
    if (PROMOTIONAL.has(kind) && !CHECKIN_SETTINGS.mailingAddress) return false;
    if (kind === "review" && !CHECKIN_SETTINGS.reviewUrl) return false;
    const last = a.sent[kind];
    return !last || daysBetween(last, today) >= COOLDOWN_DAYS[kind];
  };

  const credits = a.credits.reduce((n, c) => n + c.remaining, 0);
  const sinceLast = a.lastSession ? daysBetween(studioDate(a.lastSession.startsAt), today) : null;
  const sinceSignup = daysBetween(studioDate(a.createdAt), today);

  const expiring = a.credits.filter(
    (c) => c.expiresAt && daysBetween(today, c.expiresAt) >= 0 && daysBetween(today, c.expiresAt) <= 7,
  );
  if (expiring.length > 0 && due("expiring")) {
    const date = expiring.map((c) => c.expiresAt!).sort()[0];
    return expiringEmail(a, expiring.reduce((n, c) => n + c.remaining, 0), date);
  }

  if (a.member && !a.hasUpcoming && (sinceLast ?? sinceSignup) >= 7 && due("member_idle")) {
    return memberIdleEmail(a);
  }


  // Not right after a purchase: give them a few days to book on their own.
  const newestCredit = a.credits.map((c) => c.createdAt).sort().pop();
  if (
    credits > 0 &&
    !a.hasUpcoming &&
    (sinceLast === null || sinceLast >= 14) &&
    newestCredit &&
    daysBetween(studioDate(newestCredit), today) >= 3 &&
    due("credits_waiting")
  ) {
    return creditsWaitingEmail(a, a.credits.some((c) => !c.expiresAt));
  }

  if (a.pastSessions >= 3 && sinceLast !== null && sinceLast <= 30 && due("review")) {
    return reviewEmail(a);
  }

  if (
    !a.everBooked &&
    credits === 0 &&
    !a.member &&
    sinceSignup >= 3 &&
    sinceSignup <= 60 &&
    !a.sent.never_booked &&
    due("never_booked")
  ) {
    return neverBookedEmail(a);
  }

  if (
    !a.member &&
    credits === 0 &&
    !a.hasUpcoming &&
    sinceLast !== null &&
    sinceLast >= 30 &&
    sinceLast <= 120 &&
    due("lapsed")
  ) {
    return lapsedEmail(a);
  }
  return null;
}

// ── The emails: short plain notes from Wes, like the ones he sends by hand ──

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const p = (html: string) =>
  `<p style="margin:0 0 14px 0;color:#d4d4d8;font-size:15px;line-height:1.6;">${html}</p>`;
const link = (path: string) =>
  `<a href="${SITE}${path}" style="color:#b07adf;text-decoration:none;font-weight:700;">diamond9athletics.com${path}</a>`;
const hello = (a: CheckinAccount) =>
  a.firstName?.trim() ? `Hey ${esc(a.firstName.trim())}, quick note from Wes.` : "Hey, quick note from Wes.";

function note(a: CheckinAccount, kind: CheckinKind, subject: string, title: string, paragraphs: string[]): Checkin {
  const optOut = `<p style="margin:18px 0 0 0;color:#71717a;font-size:12px;line-height:1.5;">Don&rsquo;t want check-ins like this? <a href="${esc(
    preferencesUrl(a.userId),
  )}" style="color:#a1a1aa;">Turn them off</a>.</p>`;
  const address = CHECKIN_SETTINGS.mailingAddress
    ? `<p style="margin:6px 0 0 0;color:#71717a;font-size:12px;line-height:1.5;">Diamond Nine Athletics · ${esc(CHECKIN_SETTINGS.mailingAddress)}</p>`
    : "";
  return { kind, subject, html: shell({ title, body: paragraphs.map(p).join("") + optOut + address }) };
}

function expiringEmail(a: CheckinAccount, count: number, date: string): Checkin {
  const day = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const short = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const sessions = count === 1 ? "1 session" : `${count} sessions`;
  return note(a, "expiring", `Your D9 sessions expire ${short}`, "Sessions expiring", [
    hello(a),
    `You have ${sessions} on your account that expire on ${day}. Grab a time before then so they don&rsquo;t go to waste: ${link("/book")}.`,
    "See you soon,<br>Wes",
  ]);
}

function memberIdleEmail(a: CheckinAccount): Checkin {
  return note(a, "member_idle", "Let's get your next session booked", "Book your next session", [
    hello(a),
    `You don&rsquo;t have anything on the calendar right now. Grab a time that works this week: ${link("/book")}.`,
    "See you soon,<br>Wes",
  ]);
}

function reviewEmail(a: CheckinAccount): Checkin {
  const button = `<a href="${esc(CHECKIN_SETTINGS.reviewUrl)}" style="display:inline-block;background:#9954d2;color:#fff;text-decoration:none;font-weight:800;font-size:13px;letter-spacing:0.08em;padding:12px 22px;border-radius:999px;">Leave a Google review</a>`;
  return note(a, "review", "Would you leave D9 a quick review?", "A quick favor", [
    hello(a),
    "Thanks for training at Diamond Nine. If you&rsquo;ve liked your sessions, would you leave us a quick Google review? It takes about a minute, and it&rsquo;s the best way for other athletes and parents to find us.",
    button,
    "Thanks,<br>Wes",
  ]);
}

function creditsWaitingEmail(a: CheckinAccount, notStarted: boolean): Checkin {
  return note(a, "credits_waiting", "Your D9 sessions are ready to book", "Your sessions are ready", [
    hello(a),
    `You have sessions on your account you haven&rsquo;t booked yet. Pick any open time that works for you: ${link("/book")}.`,
    ...(notStarted
      ? ["Your 31 days don&rsquo;t start until your first session, but the sooner we get you in, the better."]
      : []),
    "See you soon,<br>Wes",
  ]);
}

function neverBookedEmail(a: CheckinAccount): Checkin {
  return note(a, "never_booked", "Ready for your first session at D9?", "Ready for your first session?", [
    `${hello(a)} Thanks for creating your Diamond Nine account.`,
    "Whenever you&rsquo;re ready: the Diamond membership is unlimited pitching for $350/month (cancel anytime), or grab a pitching or hitting package and book on your own schedule.",
    `See the plans: ${link("/pitching-plans")}.`,
    "Questions? Just reply.<br>Wes",
  ]);
}

function lapsedEmail(a: CheckinAccount): Checkin {
  const plans = a.lastSession?.category === "hitting" ? "/hitting-plans" : "/pitching-plans";
  return note(a, "lapsed", "Ready to get back at it?", "Ready to get back at it?", [
    hello(a),
    "It&rsquo;s been a while since your last session. Whenever you&rsquo;re ready to pick it back up, the Diamond membership is unlimited pitching for $350/month (cancel anytime), or grab a package and book on your own schedule.",
    `See the plans: ${link(plans)}.`,
    "Questions? Just reply.<br>Wes",
  ]);
}

// ── Turning them off: a signed link, so it works without signing in ──

function token(userId: string): string {
  return createHmac("sha256", process.env.SUPABASE_SECRET_KEY ?? "")
    .update(`checkins:${userId}`)
    .digest("hex")
    .slice(0, 32);
}

export function validPreferencesToken(userId: string, t: string): boolean {
  const expected = Buffer.from(token(userId));
  const given = Buffer.from(t);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function preferencesUrl(userId: string): string {
  return `${SITE}/book/email-preferences?${new URLSearchParams({ u: userId, t: token(userId) })}`;
}

// ── Everything the daily run needs to know about each account ──

export async function loadCheckinAccounts(
  admin: SupabaseClient,
  members: Set<string>,
  now = new Date(),
): Promise<CheckinAccount[]> {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  const today = todayInStudio(now);
  const [{ data: profiles }, { data: buckets }, { data: bookings }] = await Promise.all([
    admin.from("profiles").select("id, first_name, is_trainer, is_admin"),
    admin
      .from("credit_buckets")
      .select("user_id, credits_remaining, expires_at, created_at")
      .gt("credits_remaining", 0)
      .or(`expires_at.is.null,expires_at.gte.${today}`),
    admin.from("bookings").select("user_id, starts_at, status, service:services(category)"),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  return users.map((u) => {
    const profile = profileById.get(u.id);
    const mine = (bookings ?? []).filter((b) => b.user_id === u.id);
    const past = mine
      .filter((b) => b.status === "confirmed" && new Date(b.starts_at) < now)
      .sort((x, y) => y.starts_at.localeCompare(x.starts_at))[0];
    const service = past && (Array.isArray(past.service) ? past.service[0] : past.service);
    return {
      userId: u.id,
      email: (u.email ?? "").trim().toLowerCase(),
      firstName: profile?.first_name ?? null,
      createdAt: u.created_at,
      staff: Boolean(profile?.is_trainer || profile?.is_admin),
      optedOut: u.app_metadata?.checkins_off === true,
      sent: (u.app_metadata?.checkins ?? {}) as CheckinLog,
      member: members.has((u.email ?? "").trim().toLowerCase()),
      credits: (buckets ?? [])
        .filter((b) => b.user_id === u.id)
        .map((b) => ({ remaining: b.credits_remaining, expiresAt: b.expires_at, createdAt: b.created_at })),
      lastSession: past ? { startsAt: past.starts_at, category: service?.category ?? null } : null,
      pastSessions: mine.filter((b) => b.status === "confirmed" && new Date(b.starts_at) < now).length,
      hasUpcoming: mine.some((b) => b.status === "confirmed" && new Date(b.starts_at) >= now),
      everBooked: mine.length > 0,
    };
  });
}
