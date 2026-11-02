import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MoveBookingButton } from "./MoveBookingButton";
import {
  AddSessionPanel,
  type ClientOption,
  type ServiceOption,
} from "./AddSessionPanel";
import {
  DIAMOND_PITCHING_PRICE_ID,
  activeSubscriberEmails,
} from "@/lib/stripe/subscription";
import { hasAcceptedWaiver } from "@/lib/legal/waiver";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trainer Dashboard" };

const TZ = "America/Chicago";

type BookingRow = {
  id: string;
  user_id: string;
  trainer_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  service: { name: string } | { name: string }[] | null;
  athlete: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
  } | Array<{
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
  }> | null;
};

export default async function TrainerPage({
  searchParams,
}: {
  searchParams: Promise<{ google_connected?: string; google_error?: string; coach?: string }>;
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

  const now = new Date();
  const in30Days = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

  // trainer_google_oauth is locked to service_role only — use admin
  // client to fetch just the non-secret metadata.
  const admin = createAdminClient();
  const today = now.toISOString().slice(0, 10);
  const isAdmin = Boolean(me.is_admin);
  const isTrainer = Boolean(me.is_trainer);

  // Use admin client — RLS blocks trainers from reading the athlete's
  // profile row directly, which nulls out the joined athlete fields.
  // The is_trainer/is_admin check above already gates access to this data.
  // Admins (the owner) get every coach's bookings so they can switch
  // between schedules; trainers only ever load their own.
  let bookingsQuery = admin
    .from("bookings")
    .select(
      "id, user_id, trainer_id, starts_at, ends_at, status, notes, service:services(name), athlete:profiles!bookings_user_id_fkey(first_name, last_name, email, phone)",
    )
    .eq("status", "confirmed")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", in30Days.toISOString());
  if (!isAdmin) bookingsQuery = bookingsQuery.eq("trainer_id", user.id);

  const [
    { data: bookings },
    { data: trainerRows },
    { data: gOAuth },
    { data: serviceRows },
    { data: profileRows },
    { data: historyRows },
    { data: bucketRows },
    subscriberEmails,
    { data: authUsers },
  ] = await Promise.all([
    bookingsQuery.order("starts_at"),
    admin
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("is_trainer", true)
      .order("first_name"),
    admin
      .from("trainer_google_oauth")
      .select("calendar_id, connected_at")
      .eq("trainer_id", user.id)
      .maybeSingle(),
    // Everything below feeds the "Add a session" panel.
    admin
      .from("services")
      .select("id, name, category, duration_min")
      .eq("active", true)
      .order("category")
      .order("duration_min", { ascending: false }),
    admin
      .from("profiles")
      .select("id, first_name, last_name, email")
      .neq("id", user.id),
    admin
      .from("bookings")
      .select("user_id, starts_at")
      .eq("trainer_id", user.id)
      .eq("status", "confirmed"),
    admin
      .from("credit_buckets")
      .select("user_id, service_id, credits_remaining")
      .gt("credits_remaining", 0)
      .or(`expires_at.is.null,expires_at.gte.${today}`),
    activeSubscriberEmails(DIAMOND_PITCHING_PRICE_ID).catch(() => new Set<string>()),
    // Participant Agreement acceptances live on the auth user record.
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const acceptedWaiver = new Set(
    (authUsers?.users ?? []).filter((u) => hasAcceptedWaiver(u)).map((u) => u.id),
  );

  const trainers = (trainerRows ?? []).map((t) => ({
    id: t.id,
    first: t.first_name || "Coach",
    name: `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() || "Coach",
  }));
  const coachFirstName = new Map(trainers.map((t) => [t.id, t.first]));

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

  const allRows = (bookings ?? []) as unknown as BookingRow[];
  const viewTrainerId = view.kind === "coach" ? view.id : user.id;
  const rows =
    view.kind === "all" ? allRows : allRows.filter((r) => r.trainer_id === viewTrainerId);
  const grouped = groupByDayInCT(rows);

  const sessionsFor = (trainerId: string) =>
    allRows.filter((r) => r.trainer_id === trainerId).length;
  const tabs = isAdmin
    ? [
        ...(isTrainer
          ? [{ key: "mine", label: "MY SCHEDULE", href: "/book/trainer", count: sessionsFor(user.id) }]
          : []),
        { key: "all", label: "ALL COACHES", href: "/book/trainer?coach=all", count: allRows.length },
        ...trainers
          .filter((t) => t.id !== user.id)
          .map((t) => ({
            key: t.id,
            label: t.name.toUpperCase(),
            href: `/book/trainer?coach=${t.id}`,
            count: sessionsFor(t.id),
          })),
      ]
    : [];
  const activeTab = view.kind === "coach" ? view.id : view.kind;

  const myCategories = (me.trainer_categories ?? []) as string[];
  const services: ServiceOption[] = [...(serviceRows ?? [])].sort(
    (a, b) =>
      Number(!myCategories.includes(a.category)) -
      Number(!myCategories.includes(b.category)),
  );
  const defaultServiceId = services[0]?.id ?? "";

  // Session history per client with this trainer.
  const history = new Map<string, { sessions: number; lastSession: string | null }>();
  for (const h of historyRows ?? []) {
    const entry = history.get(h.user_id) ?? { sessions: 0, lastSession: null };
    entry.sessions += 1;
    if (
      new Date(h.starts_at) <= now &&
      (!entry.lastSession || h.starts_at > entry.lastSession)
    ) {
      entry.lastSession = h.starts_at;
    }
    history.set(h.user_id, entry);
  }

  const credits = new Map<string, Record<string, number>>();
  for (const b of bucketRows ?? []) {
    const byService = credits.get(b.user_id) ?? {};
    byService[b.service_id] = (byService[b.service_id] ?? 0) + b.credits_remaining;
    credits.set(b.user_id, byService);
  }

  const clients: ClientOption[] = (profileRows ?? [])
    .filter((p) => p.email)
    .map((p) => {
      const h = history.get(p.id);
      return {
        id: p.id,
        name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email,
        email: p.email,
        sessions: h?.sessions ?? 0,
        lastSession: h?.lastSession ?? null,
        isDiamond: subscriberEmails.has(p.email.trim().toLowerCase()),
        waiverAccepted: acceptedWaiver.has(p.id),
        creditsByService: credits.get(p.id) ?? {},
      };
    })
    // Past clients first, most recently seen at the top; then everyone else A–Z.
    .sort((a, b) => {
      if ((a.sessions > 0) !== (b.sessions > 0)) return a.sessions > 0 ? -1 : 1;
      const al = a.lastSession ?? "";
      const bl = b.lastSession ?? "";
      if (al !== bl) return bl.localeCompare(al);
      return a.name.localeCompare(b.name);
    });

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
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
          <p className="text-zinc-500 text-xs mt-4">
            Next 31 days — all times Central
          </p>
          {view.kind === "mine" && (
            <div className="mt-5">
              <Link
                href="/book/trainer/availability"
                className="btn-outline inline-block px-5 py-2 rounded-full text-[11px] tracking-widest font-bold"
              >
                EDIT MY HOURS
              </Link>
            </div>
          )}
        </div>

        {/* Owner's switcher between coaches */}
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

        {view.kind === "mine" && (
          <>
            {/* Google Calendar status */}
            <div className="card-modern rounded-2xl p-5 mb-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="text-zinc-500 text-[10px] tracking-widest font-bold mb-1">
                  GOOGLE CALENDAR
                </p>
                {gOAuth ? (
                  <p className="text-zinc-300 text-sm">
                    ✓ Connected — bookings auto-appear on{" "}
                    <span className="text-white truncate">{gOAuth.calendar_id}</span>.
                    Your Google busy times block bookings too.
                  </p>
                ) : (
                  <p className="text-zinc-400 text-sm">
                    Not connected. Bookings won&rsquo;t appear on your calendar yet.
                  </p>
                )}
                {sp.google_connected === "1" && (
                  <p className="text-green-400 text-xs mt-1">Connection successful.</p>
                )}
                {sp.google_error && (
                  <p className="text-red-400 text-xs mt-1">
                    Couldn&rsquo;t connect: {sp.google_error}
                  </p>
                )}
              </div>
              {gOAuth ? (
                <form action="/api/google/disconnect" method="post">
                  <button
                    type="submit"
                    className="text-zinc-500 hover:text-red-400 text-[11px] tracking-wider font-bold"
                  >
                    DISCONNECT
                  </button>
                </form>
              ) : (
                <a
                  href="/api/google/connect"
                  className="btn-gold px-5 py-2 rounded-full text-[11px] tracking-widest font-black"
                >
                  CONNECT GOOGLE CALENDAR
                </a>
              )}
            </div>

            <AddSessionPanel
              clients={clients}
              services={services}
              defaultServiceId={defaultServiceId}
            />
          </>
        )}

        {grouped.length === 0 ? (
          <div className="card-modern rounded-2xl p-8 text-center text-zinc-400 text-sm">
            {view.kind === "mine"
              ? "No bookings on the calendar."
              : view.kind === "all"
                ? "No sessions booked for any coach in the next 31 days."
                : `No sessions booked for ${view.first} in the next 31 days.`}
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(({ dayLabel, bookings }) => (
              <div key={dayLabel}>
                <p className="text-[#b07adf] text-[11px] tracking-widest font-bold mb-2 pl-1">
                  {dayLabel.toUpperCase()}
                </p>
                <ul className="card-modern rounded-2xl divide-y divide-white/5">
                  {bookings.map((b) => {
                    const svc = Array.isArray(b.service) ? b.service[0] : b.service;
                    const ath = Array.isArray(b.athlete) ? b.athlete[0] : b.athlete;
                    return (
                      <li key={b.id} className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-base font-bold leading-tight">
                            {fmtTime(b.starts_at)}
                            <span className="text-zinc-600 text-xs font-normal">
                              {" "}— {fmtTime(b.ends_at)}
                            </span>
                            {view.kind === "all" && (
                              <span className="ml-2 align-middle text-[10px] tracking-widest font-bold px-2 py-0.5 rounded-full bg-[#9954d2]/15 text-[#b07adf] border border-[#9954d2]/20">
                                {(coachFirstName.get(b.trainer_id) ?? "Coach").toUpperCase()}
                              </span>
                            )}
                          </p>
                          <p className="text-zinc-300 text-sm mt-1 truncate">
                            {ath?.first_name} {ath?.last_name}
                            <span className="text-zinc-600"> · {svc?.name}</span>
                          </p>
                          <div className="text-zinc-500 text-xs mt-1 space-x-2">
                            <a href={`mailto:${ath?.email ?? ""}`} className="hover:text-[#b07adf]">
                              {ath?.email}
                            </a>
                            {ath?.phone && (
                              <a href={`tel:${ath.phone}`} className="hover:text-[#b07adf]">
                                · {ath.phone}
                              </a>
                            )}
                          </div>
                          {b.notes && (
                            <p className="text-[#b07adf]/80 text-xs mt-1.5">{b.notes}</p>
                          )}
                          {!acceptedWaiver.has(b.user_id) && (
                            <p className="text-amber-400 text-xs mt-1.5">
                              Hasn&rsquo;t accepted the Participant Agreement yet
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          <MoveBookingButton
                            bookingId={b.id}
                            startsAtIso={b.starts_at}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

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

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function groupByDayInCT(rows: BookingRow[]) {
  const map = new Map<string, { dayLabel: string; bookings: BookingRow[] }>();
  for (const r of rows) {
    const k = dayKey(r.starts_at);
    if (!map.has(k)) {
      map.set(k, { dayLabel: dayLabel(r.starts_at), bookings: [] });
    }
    map.get(k)!.bookings.push(r);
  }
  // Map iteration order = insertion order; bookings are already
  // sorted by starts_at ASC from the query.
  return [...map.values()];
}
