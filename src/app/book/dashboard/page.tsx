import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CancelButton } from "./CancelButton";
import { ManageSubscriptionLink } from "./ManageSubscriptionLink";
import { requireWaiver } from "@/lib/legal/waiver";
import {
  DIAMOND_PITCHING_PRICE_ID,
  hasActiveSubscription,
} from "@/lib/stripe/subscription";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Account",
};

const TZ = "America/Chicago";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/book/login");
  }
  await requireWaiver(supabase, user, "/book/dashboard");

  const [{ data: profile }, { data: buckets }, { data: bookings }] =
    await Promise.all([
      supabase
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
          "id, starts_at, ends_at, status, service:services(name), trainer:profiles!bookings_trainer_id_fkey(first_name, last_name)",
        )
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at"),
    ]);

  const totalCredits =
    buckets?.reduce((sum, b) => sum + (b.credits_remaining ?? 0), 0) ?? 0;

  // Live-check Stripe for an active Diamond pitching membership. Runs
  // one HTTP round-trip; keeps the source of truth in Stripe so a
  // lapsed card is caught even without our webhook running.
  let isPitchingSubscriber = false;
  if (user.email) {
    try {
      isPitchingSubscriber = await hasActiveSubscription(
        user.email,
        DIAMOND_PITCHING_PRICE_ID,
      );
    } catch (e) {
      console.warn("Dashboard subscription check failed:", (e as Error).message);
    }
  }

  const canBook = isPitchingSubscriber || totalCredits > 0;

  const displayName =
    profile?.first_name || user.email?.split("@")[0] || "Athlete";

  // The next session gets the spotlight up top; the rest list below it.
  const [next, ...later] = bookings ?? [];
  const nextService = next && (Array.isArray(next.service) ? next.service[0] : next.service);
  const nextTrainer = next && (Array.isArray(next.trainer) ? next.trainer[0] : next.trainer);

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

        {/* What's next, and the one button most people come here for */}
        <div className="card-modern-amber rounded-2xl p-6 sm:p-8 mb-6 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1 min-w-0">
            {next ? (
              <>
                <p className="text-zinc-500 text-[10px] tracking-widest mb-2 font-bold">YOUR NEXT SESSION</p>
                <p className="font-display text-4xl sm:text-5xl text-white leading-none">
                  {sessionDay(next.starts_at).toUpperCase()}
                  {/* Time drops to its own line on phones instead of wrapping mid-time. */}
                  <span className="hidden sm:inline gradient-text"> · </span>
                  <br className="sm:hidden" />
                  <span className="gradient-text whitespace-nowrap">{sessionTime(next.starts_at)}</span>
                </p>
                <p className="text-zinc-400 text-sm mt-2">
                  {nextService?.name ?? "Session"}
                  {nextTrainer?.first_name && (
                    <>
                      {" "}with {nextTrainer.first_name} {nextTrainer.last_name}
                    </>
                  )}
                </p>
                <div className="mt-3">
                  <CancelButton bookingId={next.id} />
                </div>
              </>
            ) : (
              <>
                <p className="text-zinc-500 text-[10px] tracking-widest mb-2 font-bold">NO SESSIONS BOOKED</p>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {canBook
                    ? "Pick a day and time that works for you."
                    : "Join Diamond or grab a package, then book any open time."}
                </p>
              </>
            )}
          </div>
          <Link
            href={canBook ? "/book/schedule" : "/book/packages"}
            className="btn-gold shrink-0 text-center px-10 py-4 rounded-full text-sm tracking-widest font-black"
          >
            {canBook ? "BOOK A SESSION" : "SEE PACKAGES"}
          </Link>
        </div>

        {/* Without credits the big button above already says SEE PACKAGES,
            so the package card only shows for people who can book. */}
        <div className={`grid grid-cols-1 ${canBook ? "md:grid-cols-2" : ""} gap-5 mb-6`}>
          <div className="card-modern rounded-2xl p-6 sm:p-7">
            {isPitchingSubscriber ? (
              <>
                <p className="text-zinc-500 text-[10px] tracking-widest mb-2 font-bold">DIAMOND MEMBERSHIP</p>
                <p className="font-display gradient-text mb-1 leading-none flex items-baseline gap-3">
                  <span className="text-7xl">∞</span>
                  <span className="text-2xl text-zinc-400 font-normal tracking-wider">UNLIMITED</span>
                </p>
                <p className="text-zinc-500 text-xs mt-2">
                  Pitching sessions — book anytime the schedule is open.
                </p>
              </>
            ) : (
              <>
                <p className="text-zinc-500 text-[10px] tracking-widest mb-2 font-bold">MY CREDITS</p>
                <p className="font-display text-5xl gradient-text mb-1">{totalCredits}</p>
                <p className="text-zinc-500 text-xs">
                  {totalCredits > 0
                    ? "Ready to book"
                    : "No active credits — buy a package to get started"}
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
                      {svc?.name ?? "credit"}
                      {b.expires_at && (
                        <span className="text-zinc-600"> · expires {b.expires_at}</span>
                      )}
                    </p>
                  );
                })}
              </div>
            )}
          </div>

          {canBook && (
            <div className="card-modern rounded-2xl p-6 sm:p-7 flex flex-col">
              <p className="text-zinc-500 text-[10px] tracking-widest mb-2 font-bold">BUY A PACKAGE</p>
              <p className="text-zinc-300 text-sm leading-relaxed mb-5 flex-1">
                Join Diamond for unlimited pitching, or grab a session package for pitching or
                hitting — then book without paying again.
              </p>
              <Link
                href="/book/packages"
                className="btn-outline px-6 py-3 rounded-full text-xs tracking-widest font-black text-center"
              >
                SEE PACKAGES
              </Link>
            </div>
          )}
        </div>

        {later.length > 0 && (
          <div className="card-modern rounded-2xl p-6 sm:p-7 mb-6">
            <p className="text-zinc-500 text-[10px] tracking-widest mb-3 font-bold">ALSO ON YOUR CALENDAR</p>
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
                      <p className="text-zinc-300 text-sm mt-0.5">{svc?.name ?? "Session"}</p>
                      <p className="text-zinc-500 text-xs">
                        with {trn?.first_name} {trn?.last_name}
                      </p>
                    </div>
                    <CancelButton bookingId={b.id} />
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {(profile?.is_trainer || profile?.is_admin) && (
          <div className="card-modern rounded-2xl p-6 sm:p-7 mb-6">
            <p className="text-zinc-500 text-[10px] tracking-widest mb-3 font-bold">COACH TOOLS</p>
            <div className="flex flex-wrap gap-3">
              {profile.is_trainer && (
                <Link
                  href="/book/trainer"
                  className="btn-outline px-5 py-2.5 rounded-full text-[11px] tracking-widest font-bold"
                >
                  MY SCHEDULE
                </Link>
              )}
              {profile.is_admin && (
                <>
                  <Link
                    href="/book/trainer?coach=all"
                    className="btn-outline px-5 py-2.5 rounded-full text-[11px] tracking-widest font-bold"
                  >
                    ALL COACHES&rsquo; SCHEDULES
                  </Link>
                  <Link
                    href="/book/admin"
                    className="btn-outline px-5 py-2.5 rounded-full text-[11px] tracking-widest font-bold"
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
          <p className="text-zinc-500 text-[10px] tracking-widest font-bold text-center">ACCOUNT</p>
          <ManageSubscriptionLink prominent={isPitchingSubscriber} />
          <div className="card-modern rounded-2xl p-5 sm:p-6 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-zinc-500 text-xs min-w-0 truncate">
              Signed in as <span className="text-zinc-300">{profile?.email ?? user.email}</span>
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/book/profile"
                className="btn-outline px-5 py-2.5 rounded-full text-[11px] tracking-widest font-bold"
              >
                MY PROFILE
              </Link>
              <form action="/book/logout" method="post">
                <button
                  type="submit"
                  className="btn-outline px-5 py-2.5 rounded-full text-[11px] tracking-widest font-bold"
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
