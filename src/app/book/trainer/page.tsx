import Link from "next/link";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClientOption, ServiceOption } from "./AddSessionPanel";
import { CoachCalendar } from "./CoachCalendar";
import {
  DIAMOND_PITCHING_PRICE_ID,
  activeMemberships,
} from "@/lib/stripe/subscription";
import { WAIVER_VERSION, hasAcceptedWaiver } from "@/lib/legal/waiver";
import { PRIMARY, keyOf } from "@/lib/booking/athletes";
import { firstPitchingBookingIds } from "@/lib/booking/first-session";
import {
  addDays,
  buildCoachCalendar,
  mondayOf,
  parseWeek,
  todayInStudio,
  weekBounds,
  type CalCategory,
  type CalSession,
} from "@/lib/booking/coach-calendar";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Schedule" };

type Athlete = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};
type Service = { name: string; category: CalCategory };
/** A brother or sister on the client's account. */
type Sibling = { first_name: string; last_name: string | null; waiver_version: string | null };
type BookingRow = {
  id: string;
  user_id: string;
  athlete_id: string | null;
  sibling: Sibling | Sibling[] | null;
  trainer_id: string;
  starts_at: string;
  ends_at: string;
  notes: string | null;
  service: Service | Service[] | null;
  athlete: Athlete | Athlete[] | null;
};

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export default async function TrainerPage({
  searchParams,
}: {
  searchParams: Promise<{ coach?: string; week?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/book/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("first_name, is_trainer, is_admin, trainer_categories")
    .eq("id", user.id)
    .single();

  if (!me?.is_trainer && !me?.is_admin) {
    return (
      <main className="pt-24 bg-[#040200] min-h-screen">
        <section className="max-w-md mx-auto px-6 py-24 text-center text-zinc-400">
          This page is for trainers.{" "}
          <Link href="/book/dashboard" className="text-[#b07adf]">Go to your dashboard</Link>.
        </section>
      </main>
    );
  }

  // Use admin client — RLS blocks trainers from reading the athlete's
  // profile row directly, which nulls out the joined athlete fields.
  // The is_trainer/is_admin check above already gates access to this data.
  const admin = createAdminClient();
  const isAdmin = Boolean(me.is_admin);
  const isTrainer = Boolean(me.is_trainer);

  const { data: trainerRows } = await admin
    .from("profiles")
    .select("id, first_name, last_name, trainer_categories")
    .eq("is_trainer", true)
    .order("first_name");
  const trainers = (trainerRows ?? []).map((t) => ({
    id: t.id as string,
    first: t.first_name || "Coach",
    name: `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() || "Coach",
    category: ((t.trainer_categories ?? [])[0] ?? null) as CalCategory | null,
  }));

  // Whose schedule is on screen. Only admins can switch: ?coach=all for
  // every coach at once, ?coach=<trainer id> for one coach.
  type View = { kind: "mine" } | { kind: "all" } | { kind: "coach"; id: string; first: string };
  let view: View = isTrainer ? { kind: "mine" } : { kind: "all" };
  if (isAdmin && sp.coach === "all") {
    view = { kind: "all" };
  } else if (isAdmin && sp.coach && sp.coach !== user.id) {
    const coach = trainers.find((t) => t.id === sp.coach);
    if (coach) view = { kind: "coach", id: coach.id, first: coach.first };
  }

  const shownIds =
    view.kind === "all" ? trainers.map((t) => t.id) : [view.kind === "coach" ? view.id : user.id];
  if (shownIds.length === 0) {
    return (
      <main className="pt-24 bg-[#040200] min-h-screen">
        <section className="max-w-md mx-auto px-6 py-24 text-center text-zinc-400">
          No coaches set up yet.
        </section>
      </main>
    );
  }
  // Admins load every coach's week for the tab counts; trainers only their own.
  const loadIds = isAdmin ? [...new Set([...trainers.map((t) => t.id), user.id])] : [user.id];

  const weekStart = parseWeek(sp.week);
  const { start: weekFrom, end: weekTo } = weekBounds(weekStart);

  const [{ data: bookingRows }, { data: ruleRows }, { data: blockRows }, { data: authUsers }, addSessionBase] =
    await Promise.all([
      admin
        .from("bookings")
        .select(
          "id, user_id, athlete_id, trainer_id, starts_at, ends_at, notes, service:services(name, category), athlete:profiles!bookings_user_id_fkey(first_name, last_name, email, phone), sibling:athletes(first_name, last_name, waiver_version)",
        )
        .eq("status", "confirmed")
        .in("trainer_id", loadIds)
        .lt("starts_at", weekTo.toISOString())
        .gt("ends_at", weekFrom.toISOString())
        .order("starts_at"),
      admin
        .from("availability_rules")
        .select("trainer_id, category, day_of_week, start_time, end_time")
        .in("trainer_id", shownIds)
        .eq("active", true),
      admin
        .from("availability_blocks")
        .select("id, trainer_id, starts_at, ends_at, reason")
        .lt("starts_at", weekTo.toISOString())
        .gt("ends_at", weekFrom.toISOString())
        .or(`trainer_id.is.null,trainer_id.in.(${shownIds.join(",")})`),
      // Participant Agreement acceptances live on the auth user record.
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      view.kind === "mine"
        ? loadAddSession(admin, user.id, (me.trainer_categories ?? []) as string[])
        : Promise.resolve(null),
    ]);

  const acceptedWaiver = new Set(
    (authUsers?.users ?? []).filter((u) => hasAcceptedWaiver(u)).map((u) => u.id),
  );
  const rows = (bookingRows ?? []) as unknown as BookingRow[];
  const shown = rows.filter((r) => shownIds.includes(r.trainer_id));
  const firstSessions = await firstPitchingBookingIds(admin, [...new Set(shown.map((r) => r.user_id))]);

  const sessions: CalSession[] = shown.map((r) => {
    const a = one(r.athlete);
    const sib = one(r.sibling);
    const svc = one(r.service);
    // A brother's or sister's session shows their name; contact is the account's.
    const first = (sib ? sib.first_name : a?.first_name)?.trim() ?? "";
    const last = (sib ? sib.last_name : a?.last_name)?.trim() ?? "";
    const athleteName = `${first} ${last}`.trim() || a?.email || "Athlete";
    return {
      id: r.id,
      trainerId: r.trainer_id,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      athleteName,
      shortName: first ? `${first}${last ? ` ${last[0]}.` : ""}` : athleteName,
      email: a?.email ?? null,
      phone: a?.phone ?? null,
      serviceName: svc?.name ?? "Session",
      category: svc?.category ?? "pitching",
      notes: r.notes,
      firstSession: firstSessions.has(r.id),
      waiverAccepted: sib ? sib.waiver_version === WAIVER_VERSION : acceptedWaiver.has(r.user_id),
    };
  });

  const cal = buildCoachCalendar({
    weekStart,
    // You first, then everyone else.
    coaches: trainers
      .filter((t) => shownIds.includes(t.id))
      .sort((a, b) => Number(b.id === user.id) - Number(a.id === user.id)),
    rules: ruleRows ?? [],
    timeOff: (blockRows ?? []).map((b) => ({
      id: b.id,
      trainerId: b.trainer_id,
      startsAt: b.starts_at,
      endsAt: b.ends_at,
      reason: b.reason,
    })),
    sessions,
  });

  const addSession = addSessionBase && {
    ...addSessionBase,
    clients: addSessionBase.clients.map(({ siblingAgreement, ...c }) => ({
      ...c,
      waiverAccepted: siblingAgreement ?? acceptedWaiver.has(c.id),
    })),
  };

  // Links keep the coach and the week you're looking at.
  const coachParam = view.kind === "mine" ? null : view.kind === "all" ? "all" : view.id;
  const weekParam = weekStart === mondayOf(todayInStudio()) ? null : weekStart;
  const href = (coach: string | null, week: string | null) => {
    const q = new URLSearchParams();
    if (coach) q.set("coach", coach);
    if (week) q.set("week", week);
    const s = q.toString();
    return `/book/trainer${s ? `?${s}` : ""}`;
  };
  const nav = {
    prev: href(coachParam, addDays(weekStart, -7)),
    next: href(coachParam, addDays(weekStart, 7)),
    thisWeek: cal.isThisWeek ? null : href(coachParam, null),
  };

  const countFor = (id: string) => rows.filter((r) => r.trainer_id === id).length;
  const tabs = isAdmin
    ? [
        ...(isTrainer
          ? [{ key: "mine", label: "MY SCHEDULE", href: href(null, weekParam), count: countFor(user.id) }]
          : []),
        { key: "all", label: "ALL COACHES", href: href("all", weekParam), count: rows.length },
        ...trainers
          .filter((t) => t.id !== user.id)
          .map((t) => ({
            key: t.id,
            label: t.name.toUpperCase(),
            href: href(t.id, weekParam),
            count: countFor(t.id),
          })),
      ]
    : [];
  const activeTab = view.kind === "coach" ? view.id : view.kind;

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-8">
          <p className="section-label mb-3">TRAINER VIEW</p>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">
            {view.kind === "mine"
              ? "YOUR"
              : view.kind === "all"
                ? "TEAM"
                : `${view.first.toUpperCase()}’S`}
            <span className="block gradient-text">SCHEDULE</span>
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mt-5" />
          <p className="text-zinc-500 text-xs mt-4">All times Central</p>
          {view.kind === "mine" && (
            <div className="mt-5">
              <Link
                href="/book/trainer/availability"
                className="btn-outline inline-block px-5 py-2 rounded-full text-[11px] tracking-widest font-bold"
              >
                EDIT MY WEEKLY HOURS
              </Link>
            </div>
          )}
        </div>

        {/* Owner's switcher between coaches — counts are sessions this week */}
        {tabs.length > 0 && (
          <nav aria-label="Whose schedule" className="flex flex-wrap justify-center gap-2 mb-6">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                aria-current={t.key === activeTab ? "page" : undefined}
                className={`${t.key === activeTab ? "btn-gold" : "btn-outline"} px-4 py-2 rounded-full text-[11px] tracking-widest font-bold`}
              >
                {t.label} <span className="opacity-60">· {t.count}</span>
              </Link>
            ))}
          </nav>
        )}

        <CoachCalendar
          cal={cal}
          team={view.kind === "all"}
          myId={user.id}
          canEdit={view.kind === "mine"}
          canMove={isAdmin || view.kind === "mine"}
          addSession={addSession}
          nav={nav}
        />

        <div className="mt-10 text-center">
          <Link
            href="/book/dashboard"
            className="text-zinc-500 hover:text-[#b07adf] text-xs tracking-wider"
          >
            ← BACK TO MY DASHBOARD
          </Link>
        </div>
      </section>
    </main>
  );
}

/** Everything the "Add a session" form needs: services and every client. */
async function loadAddSession(admin: SupabaseClient, userId: string, myCategories: string[]) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const [
    { data: serviceRows },
    { data: profileRows },
    { data: siblingRows },
    { data: historyRows },
    { data: bucketRows },
    memberships,
  ] = await Promise.all([
    admin
      .from("services")
      .select("id, name, category, duration_min")
      .eq("active", true)
      .order("category")
      .order("duration_min", { ascending: false }),
    admin.from("profiles").select("id, first_name, last_name, email").neq("id", userId),
    admin
      .from("athletes")
      .select("id, parent_id, first_name, last_name, waiver_version")
      .is("archived_at", null)
      .order("created_at"),
    admin
      .from("bookings")
      .select("user_id, athlete_id, starts_at")
      .eq("trainer_id", userId)
      .eq("status", "confirmed"),
    admin
      .from("credit_buckets")
      .select("user_id, service_id, credits_remaining")
      .gt("credits_remaining", 0)
      .or(`expires_at.is.null,expires_at.gte.${today}`),
    activeMemberships(DIAMOND_PITCHING_PRICE_ID).catch(() => new Map<string, Set<string>>()),
  ]);

  const services: ServiceOption[] = [...(serviceRows ?? [])].sort(
    (a, b) =>
      Number(!myCategories.includes(a.category)) - Number(!myCategories.includes(b.category)),
  );

  // Session history per athlete with this trainer.
  const history = new Map<string, { sessions: number; lastSession: string | null }>();
  for (const h of historyRows ?? []) {
    const who = `${h.user_id}:${keyOf(h.athlete_id)}`;
    const entry = history.get(who) ?? { sessions: 0, lastSession: null };
    entry.sessions += 1;
    if (new Date(h.starts_at) <= now && (!entry.lastSession || h.starts_at > entry.lastSession)) {
      entry.lastSession = h.starts_at;
    }
    history.set(who, entry);
  }

  const siblings = new Map<string, NonNullable<typeof siblingRows>>();
  for (const s of siblingRows ?? []) {
    siblings.set(s.parent_id, [...(siblings.get(s.parent_id) ?? []), s]);
  }

  const credits = new Map<string, Record<string, number>>();
  for (const b of bucketRows ?? []) {
    const byService = credits.get(b.user_id) ?? {};
    byService[b.service_id] = (byService[b.service_id] ?? 0) + b.credits_remaining;
    credits.set(b.user_id, byService);
  }

  // Each account holder, then any brothers or sisters on their account —
  // who share the account's credits but have their own membership.
  const clients: (Omit<ClientOption, "waiverAccepted"> & { siblingAgreement: boolean | null })[] = (
    profileRows ?? []
  )
    .filter((p) => p.email)
    .flatMap((p) => {
      const holderName = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email;
      const covered = memberships.get(p.email.trim().toLowerCase());
      const option = (athleteKey: string, name: string, siblingAgreement: boolean | null) => {
        const h = history.get(`${p.id}:${athleteKey}`);
        return {
          id: p.id,
          athleteKey,
          name,
          accountName: athleteKey === PRIMARY ? null : holderName,
          email: p.email,
          sessions: h?.sessions ?? 0,
          lastSession: h?.lastSession ?? null,
          isDiamond: covered?.has(athleteKey) ?? false,
          creditsByService: credits.get(p.id) ?? {},
          siblingAgreement,
        };
      };
      return [
        option(PRIMARY, holderName, null),
        ...(siblings.get(p.id) ?? []).map((s) =>
          option(
            s.id,
            `${s.first_name} ${s.last_name ?? ""}`.trim(),
            s.waiver_version === WAIVER_VERSION,
          ),
        ),
      ];
    })
    // Past clients first, most recently seen at the top; then everyone else A–Z.
    .sort((a, b) => {
      if ((a.sessions > 0) !== (b.sessions > 0)) return a.sessions > 0 ? -1 : 1;
      const al = a.lastSession ?? "";
      const bl = b.lastSession ?? "";
      if (al !== bl) return bl.localeCompare(al);
      return a.name.localeCompare(b.name);
    });

  return { services, defaultServiceId: services[0]?.id ?? "", clients };
}
