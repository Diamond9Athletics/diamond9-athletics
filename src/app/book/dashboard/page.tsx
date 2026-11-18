import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CancelButton } from "./CancelButton";
import { AddToCalendar } from "./AddToCalendar";
import { ManageSubscriptionLink } from "./ManageSubscriptionLink";
import { FamilyCard } from "./FamilyCard";
import { requireWaiver } from "@/lib/legal/waiver";
import { diamondMemberships, type Membership } from "@/lib/stripe/subscription";
import { fullName, keyOf, loadFamily } from "@/lib/booking/athletes";
import { LATE_CANCELLED } from "@/lib/booking/policy";

/** Past sessions listed before "show all". */
const PAST_SHOWN = 5;

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Account",
};

const TZ = "America/Chicago";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/book/login");
  }
  await requireWaiver(supabase, user, "/book/dashboard");
  const { booked } = await searchParams;

  // One clock for both lists, so a session is never in both or neither.
  const nowIso = new Date().toISOString();
  const [{ data: profile }, { data: buckets }, { data: bookings }, { data: past }] =
    await Promise.all([
      // Email isn't readable from the browser's side (migration 005).
      createAdminClient()
        .from("profiles")
        .select("first_name, last_name, email, is_trainer, is_admin")
        .eq("id", user.id)
        .single(),
      supabase
        .from("credit_buckets")
        .select(
          "credits_remaining, expires_at, service:services(name, category)",
        )
        .eq("user_id", user.id)
        .gt("credits_remaining", 0),
      supabase
        .from("bookings")
        .select(
          "id, starts_at, ends_at, status, athlete_id, service:services(name), trainer:profiles!bookings_trainer_id_fkey(first_name, last_name)",
        )
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .gte("starts_at", nowIso)
        .order("starts_at"),
      // Sessions already done (and late cancels, which counted as used).
      supabase
        .from("bookings")
        .select(
          "id, starts_at, status, athlete_id, service:services(name), trainer:profiles!bookings_trainer_id_fkey(first_name, last_name)",
        )
        .eq("user_id", user.id)
        .in("status", ["confirmed", LATE_CANCELLED])
        .lt("starts_at", nowIso)
        .order("starts_at", { ascending: false })
        .limit(30),
    ]);

  const totalCredits =
    buckets?.reduce((sum, b) => sum + (b.credits_remaining ?? 0), 0) ?? 0;

  // Live-check Stripe for Diamond memberships (one per athlete they
  // cover). Keeps the source of truth in Stripe so a lapsed card is
  // caught even without our webhook running.
  let memberships: Membership[] = [];
  if (user.email) {
    try {
      memberships = await diamondMemberships(user.email);
    } catch (e) {
      console.warn("Dashboard subscription check failed:", (e as Error).message);
    }
  }
  const isPitchingSubscriber = memberships.length > 0;

  // Everyone on the account. With more than one, sessions say whose they are.
  const family = await loadFamily(supabase, user.id, {
    first_name: profile?.first_name ?? null,
    last_name: profile?.last_name ?? null,
    email: user.email,
  });
  const isFamily = family.length > 1;
  const athleteByKey = new Map(family.map((a) => [a.key, a]));
  const whose = (athleteId: string | null) =>
    isFamily ? athleteByKey.get(keyOf(athleteId))?.firstName ?? null : null;
  const memberKeys = new Set(memberships.map((m) => m.athleteKey));
  const memberNames = family.filter((a) => memberKeys.has(a.key)).map((a) => a.firstName);

  const canBook = isPitchingSubscriber || totalCredits > 0;

  const displayName =
    profile?.first_name || user.email?.split("@")[0] || "Athlete";

  // The next session gets the spotlight up top; the rest list below it.
  const [next, ...later] = bookings ?? [];
  const nextService = next && (Array.isArray(next.service) ? next.service[0] : next.service);
  const nextTrainer = next && (Array.isArray(next.trainer) ? next.trainer[0] : next.trainer);
  const trainerName = (t: { first_name: string | null; last_name: string | null } | null | undefined) =>
    `${t?.first_name ?? ""} ${t?.last_name ?? ""}`.trim() || "your coach";

  // Just booked (the booking page sends them here with ?booked=ID).
  const justBooked = booked ? (bookings ?? []).find((b) => b.id === booked) : undefined;
  const justBookedService =
    justBooked && (Array.isArray(justBooked.service) ? justBooked.service[0] : justBooked.service);
  const justBookedTrainer =
    justBooked && (Array.isArray(justBooked.trainer) ? justBooked.trainer[0] : justBooked.trainer);

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
        <div className="text-center mb-10">
          <p className="section-label mb-3">YOUR DASHBOARD</p>
          <h1 className="font-display text-5xl sm:text-7xl text-white leading-none">
            WELCOME<span className="text-[#b07adf]">,</span>
            <span className="block gradient-text">{displayName.toUpperCase()}</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-5" />
        </div>

        {justBooked && (
          <div className="rounded-2xl border border-[#9954d2]/40 bg-[#9954d2]/10 px-5 py-4 mb-6" role="status">
            <p className="text-[#c49bea] text-xs tracking-widest font-bold mb-1">✓ YOU&rsquo;RE BOOKED</p>
            <p className="text-white text-sm leading-relaxed">
              {sessionDay(justBooked.starts_at)} at {sessionTime(justBooked.starts_at)}
              {" — "}
              {justBookedService?.name ?? "Session"} with {trainerName(justBookedTrainer)}. A
              confirmation email is on its way.
            </p>
            <AddToCalendar
              bookingId={justBooked.id}
              startsAt={justBooked.starts_at}
              endsAt={justBooked.ends_at}
              serviceName={justBookedService?.name ?? "Training Session"}
              trainerName={trainerName(justBookedTrainer)}
              open
            />
          </div>
        )}

        {/* What's next, and the one button most people come here for */}
        <div className="card-modern-amber rounded-2xl p-6 sm:p-8 mb-6 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1 min-w-0">
            {next ? (
              <>
                <p className="text-zinc-500 text-xs tracking-widest mb-2 font-bold">YOUR NEXT SESSION</p>
                <p className="font-display text-4xl sm:text-5xl text-white leading-none">
                  {sessionDay(next.starts_at).toUpperCase()}
                  {/* Time drops to its own line on phones instead of wrapping mid-time. */}
                  <span className="hidden sm:inline gradient-text"> · </span>
                  <br className="sm:hidden" />
                  <span className="gradient-text whitespace-nowrap">{sessionTime(next.starts_at)}</span>
                </p>
                <p className="text-zinc-400 text-sm mt-2">
                  {whose(next.athlete_id) && (
                    <span className="text-white font-bold">{whose(next.athlete_id)} · </span>
                  )}
                  {nextService?.name ?? "Session"}
                  {nextTrainer?.first_name && (
                    <>
                      {" "}with {nextTrainer.first_name} {nextTrainer.last_name}
                    </>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap items-start gap-x-6">
                  <CancelButton bookingId={next.id} startsAt={next.starts_at} />
                  <AddToCalendar
                    bookingId={next.id}
                    startsAt={next.starts_at}
                    endsAt={next.ends_at}
                    serviceName={nextService?.name ?? "Training Session"}
                    trainerName={trainerName(nextTrainer)}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-zinc-500 text-xs tracking-widest mb-2 font-bold">NO SESSIONS BOOKED</p>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {canBook
                    ? "Pick a day and time that works for you."
                    : "Join Diamond or grab a plan, then book any open time."}
                </p>
              </>
            )}
          </div>
          <Link
            href={canBook ? "/book/schedule" : "/book/packages"}
            className="btn-gold shrink-0 text-center px-10 py-4 rounded-full text-sm tracking-widest font-black"
          >
            {canBook ? "BOOK A SESSION" : "SEE PLANS"}
          </Link>
        </div>

        {/* Without credits the big button above already says SEE PLANS,
            so the package card only shows for people who can book. */}
        <div className={`grid grid-cols-1 ${canBook ? "md:grid-cols-2" : ""} gap-5 mb-6`}>
          <div className="card-modern rounded-2xl p-6 sm:p-7">
            {isPitchingSubscriber ? (
              <>
                <p className="text-zinc-500 text-xs tracking-widest mb-2 font-bold">DIAMOND MEMBERSHIP</p>
                <p className="font-display gradient-text mb-1 leading-none flex items-baseline gap-3">
                  <span className="text-7xl">∞</span>
                  <span className="text-2xl text-zinc-400 font-normal tracking-wider">UNLIMITED</span>
                </p>
                <p className="text-zinc-500 text-xs mt-2">
                  {isFamily && memberNames.length > 0
                    ? `Pitching sessions for ${memberNames.join(" and ")} — book anytime the schedule is open.`
                    : "Pitching sessions — book anytime the schedule is open."}
                </p>
              </>
            ) : (
              <>
                <p className="text-zinc-500 text-xs tracking-widest mb-2 font-bold">SESSIONS LEFT</p>
                <p className="font-display text-5xl gradient-text mb-1">{totalCredits}</p>
                <p className="text-zinc-500 text-xs">
                  {totalCredits > 0
                    ? "Ready to book"
                    : "No sessions left — buy a plan to get started"}
                </p>
              </>
            )}
            {buckets && buckets.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {buckets.map((b, i) => {
                  const svc = Array.isArray(b.service) ? b.service[0] : b.service;
                  return (
                    <p key={i} className="text-zinc-400 text-xs">
                      <span className="text-white">{b.credits_remaining}</span>{" "}
                      {svc?.name ?? "session"}
                      {b.expires_at && (
                        <span className="text-zinc-500"> · expires {b.expires_at}</span>
                      )}
                    </p>
                  );
                })}
              </div>
            )}
          </div>

          {canBook && (
            <div className="card-modern rounded-2xl p-6 sm:p-7 flex flex-col">
              <p className="text-zinc-500 text-xs tracking-widest mb-2 font-bold">BUY A PLAN</p>
              <p className="text-zinc-300 text-sm leading-relaxed mb-5 flex-1">
                Join Diamond for unlimited pitching, or grab a plan for pitching or
                hitting — then book without paying again.
              </p>
              <Link
                href="/book/packages"
                className="btn-outline px-6 py-3 rounded-full text-xs tracking-widest font-black text-center"
              >
                SEE PLANS
              </Link>
            </div>
          )}
        </div>

        {later.length > 0 && (
          <div className="card-modern rounded-2xl p-6 sm:p-7 mb-6">
            <p className="text-zinc-500 text-xs tracking-widest mb-3 font-bold">ALSO ON YOUR CALENDAR</p>
            <ul className="space-y-3">
              {later.map((b) => {
                const svc = Array.isArray(b.service) ? b.service[0] : b.service;
                const trn = Array.isArray(b.trainer) ? b.trainer[0] : b.trainer;
                return (
                  <li
                    key={b.id}
                    className="flex items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-[#b07adf] text-sm font-bold">
                        {sessionDay(b.starts_at)} · {sessionTime(b.starts_at)}
                      </p>
                      <p className="text-zinc-300 text-sm mt-0.5">
                        {whose(b.athlete_id) && (
                          <span className="text-white font-bold">{whose(b.athlete_id)} · </span>
                        )}
                        {svc?.name ?? "Session"}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        with {trainerName(trn)}
                      </p>
                      <AddToCalendar
                        bookingId={b.id}
                        startsAt={b.starts_at}
                        endsAt={b.ends_at}
                        serviceName={svc?.name ?? "Training Session"}
                        trainerName={trainerName(trn)}
                      />
                    </div>
                    <CancelButton bookingId={b.id} startsAt={b.starts_at} />
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {past && past.length > 0 && (
          <div className="card-modern rounded-2xl p-6 sm:p-7 mb-6">
            <p className="text-zinc-500 text-xs tracking-widest mb-3 font-bold">PAST SESSIONS</p>
            <ul className="space-y-2">
              {past.slice(0, PAST_SHOWN).map((b) => (
                <PastRow key={b.id} b={b} who={whose(b.athlete_id)} trainerName={trainerName} />
              ))}
            </ul>
            {past.length > PAST_SHOWN && (
              <details className="group mt-2">
                <summary className="no-marker list-none cursor-pointer inline-flex items-center gap-1 min-h-[44px] text-zinc-400 hover:text-[#b07adf] text-xs tracking-widest">
                  <span className="group-open:hidden">SHOW ALL ({past.length})</span>
                  <span className="hidden group-open:inline">SHOW FEWER</span>
                  <span aria-hidden="true" className="transition-transform group-open:rotate-180">▾</span>
                </summary>
                <ul className="space-y-2 mt-1">
                  {past.slice(PAST_SHOWN).map((b) => (
                    <PastRow key={b.id} b={b} who={whose(b.athlete_id)} trainerName={trainerName} />
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {/* Coaches' own accounts aren't athletes — skip the pitch unless they've added someone. */}
        {(isFamily || !(profile?.is_trainer || profile?.is_admin)) && (
          <FamilyCard
            athletes={family.map((a, i) => ({
              key: a.key,
              name: fullName(a) || a.firstName,
              firstName: a.firstName,
              holder: i === 0,
              member: memberKeys.has(a.key),
              agreementCurrent: a.agreementCurrent,
            }))}
          />
        )}

        {(profile?.is_trainer || profile?.is_admin) && (
          <div className="card-modern rounded-2xl p-6 sm:p-7 mb-6">
            <p className="text-zinc-500 text-xs tracking-widest mb-3 font-bold">COACH TOOLS</p>
            <div className="flex flex-wrap gap-3">
              {profile.is_trainer && (
                <Link
                  href="/book/trainer"
                  className="btn-outline px-5 py-2.5 rounded-full text-xs tracking-widest font-bold"
                >
                  MY SCHEDULE
                </Link>
              )}
              {profile.is_admin && (
                <>
                  <Link
                    href="/book/trainer?coach=all"
                    className="btn-outline px-5 py-2.5 rounded-full text-xs tracking-widest font-bold"
                  >
                    ALL COACHES&rsquo; SCHEDULES
                  </Link>
                  <Link
                    href="/book/admin"
                    className="btn-outline px-5 py-2.5 rounded-full text-xs tracking-widest font-bold"
                  >
                    ADMIN PANEL
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Account housekeeping lives at the bottom */}
        <div className="mt-10">
          <p className="text-zinc-500 text-xs tracking-widest font-bold text-center">ACCOUNT</p>
          {memberships.map((m) => (
            <ManageSubscriptionLink
              key={m.subscriptionId}
              membership={m}
              athleteName={isFamily ? athleteByKey.get(m.athleteKey)?.firstName : undefined}
            />
          ))}
          <div className="card-modern rounded-2xl p-5 sm:p-6 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-zinc-500 text-xs min-w-0 truncate">
              Signed in as <span className="text-zinc-300">{profile?.email ?? user.email}</span>
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/book/profile"
                className="btn-outline px-5 py-2.5 rounded-full text-xs tracking-widest font-bold"
              >
                MY PROFILE
              </Link>
              <form action="/book/logout" method="post">
                <button
                  type="submit"
                  className="btn-outline px-5 py-2.5 rounded-full text-xs tracking-widest font-bold"
                >
                  SIGN OUT
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

type PastBooking = {
  id: string;
  starts_at: string;
  status: string;
  athlete_id: string | null;
  service: { name: string } | { name: string }[] | null;
  trainer:
    | { first_name: string | null; last_name: string | null }
    | { first_name: string | null; last_name: string | null }[]
    | null;
};

/** One line in Past sessions. */
function PastRow({
  b,
  who,
  trainerName,
}: {
  b: PastBooking;
  who: string | null;
  trainerName: (t: { first_name: string | null; last_name: string | null } | null | undefined) => string;
}) {
  const svc = Array.isArray(b.service) ? b.service[0] : b.service;
  const trn = Array.isArray(b.trainer) ? b.trainer[0] : b.trainer;
  const late = b.status === LATE_CANCELLED;
  return (
    <li className="flex items-start justify-between gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className={`text-sm ${late ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
          {sessionDay(b.starts_at)} · {sessionTime(b.starts_at)}
        </p>
        <p className="text-zinc-500 text-xs">
          {who && <span className="text-zinc-300">{who} · </span>}
          {svc?.name ?? "Session"} with {trainerName(trn)}
        </p>
      </div>
      {late && (
        <span className="text-amber-500 text-xs tracking-wider font-bold shrink-0 text-right">
          LATE CANCEL
          <span className="block text-zinc-500 font-normal tracking-normal">counted as used</span>
        </span>
      )}
    </li>
  );
}

function dayKey(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** "Today", "Tomorrow", or "Tue, Nov 4" — in studio (Central) time. */
function sessionDay(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (dayKey(d) === dayKey(now)) return "Today";
  if (dayKey(d) === dayKey(new Date(now.getTime() + 24 * 60 * 60 * 1000))) return "Tomorrow";
  return d.toLocaleDateString("en-US", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function sessionTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  });
}
