import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CancelButton } from "./CancelButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/book/login");
  }

  const [{ data: profile }, { data: buckets }, { data: bookings }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("first_name, last_name, email, is_trainer")
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

  const displayName =
    profile?.first_name || user.email?.split("@")[0] || "Athlete";

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="section-label mb-3">YOUR DASHBOARD</p>
          <h1 className="font-display text-5xl sm:text-7xl text-white leading-none">
            WELCOME<span className="text-[#b07adf]">,</span>
            <span className="block gradient-text">{displayName.toUpperCase()}</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="card-modern rounded-2xl p-6 sm:p-7">
            <p className="text-zinc-500 text-[10px] tracking-widest mb-2 font-bold">MY CREDITS</p>
            <p className="font-display text-5xl gradient-text mb-1">{totalCredits}</p>
            <p className="text-zinc-500 text-xs">
              {totalCredits > 0
                ? "Ready to book"
                : "No active credits — buy a package to get started"}
            </p>
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
            {totalCredits > 0 && (
              <Link
                href="/book/schedule"
                className="btn-gold inline-block mt-5 px-6 py-3 rounded-full text-xs tracking-widest font-black"
              >
                BOOK A SESSION
              </Link>
            )}
          </div>

          <div className="card-modern-amber rounded-2xl p-6 sm:p-7 flex flex-col">
            <p className="text-zinc-500 text-[10px] tracking-widest mb-2 font-bold">BUY A PACKAGE</p>
            <p className="text-zinc-300 text-sm leading-relaxed mb-5 flex-1">
              Pick a Diamond, Gold, Single, or Half package — then use credits to book without paying again.
            </p>
            <Link
              href="/book/packages"
              className="btn-outline px-6 py-3 rounded-full text-xs tracking-widest font-black text-center"
            >
              SEE PACKAGES
            </Link>
          </div>
        </div>

        {/* Upcoming sessions */}
        <div className="card-modern rounded-2xl p-6 sm:p-7 mb-6">
          <p className="text-zinc-500 text-[10px] tracking-widest mb-3 font-bold">UPCOMING SESSIONS</p>
          {!bookings || bookings.length === 0 ? (
            <p className="text-zinc-500 text-sm">No upcoming sessions.</p>
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => {
                const svc = Array.isArray(b.service) ? b.service[0] : b.service;
                const trn = Array.isArray(b.trainer) ? b.trainer[0] : b.trainer;
                const d = new Date(b.starts_at);
                return (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 border-b border-white/5 pb-2"
                  >
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{svc?.name ?? "Session"}</p>
                      <p className="text-zinc-500 text-xs">
                        with {trn?.first_name} {trn?.last_name}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <p className="text-[#b07adf] text-sm font-bold">
                        {d.toLocaleString("en-US", {
                          timeZone: "America/Chicago",
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/book/schedule?reschedule=${b.id}`}
                          className="text-zinc-500 hover:text-[#b07adf] text-[11px] tracking-wider"
                        >
                          RESCHEDULE
                        </Link>
                        <CancelButton bookingId={b.id} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {profile?.is_trainer && (
          <Link
            href="/book/trainer"
            className="block card-modern-amber rounded-2xl p-6 mb-6 hover:opacity-90 transition"
          >
            <p className="text-zinc-500 text-[10px] tracking-widest mb-2 font-bold">TRAINER VIEW</p>
            <p className="text-white text-sm">
              See your schedule, athletes, and availability →
            </p>
          </Link>
        )}

        <p className="text-zinc-700 text-xs text-center mt-6">
          Signed in as {profile?.email ?? user.email}
        </p>

        <form action="/book/logout" method="post" className="mt-4 text-center">
          <button
            type="submit"
            className="btn-outline px-8 py-3 rounded-full text-xs tracking-widest font-bold"
          >
            SIGN OUT
          </button>
        </form>
      </section>
    </main>
  );
}
