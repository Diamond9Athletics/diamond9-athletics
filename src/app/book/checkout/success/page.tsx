import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FirstSteps } from "@/components/FirstSteps";
import { WaitForSessions } from "./WaitForSessions";

/** A purchase this recent is the one they just made. */
const JUST_NOW_MS = 2 * 60 * 60 * 1000;

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment Confirmed" };

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Ready once there's something to book with; a first-timer has never booked.
 * A full-program enrollment has no sessions to book: the coach schedules it.
 */
async function purchaseState(supabase: Supabase, userId: string) {
  const [{ count: sessionsLeft }, { count: everBooked }, { data: latest }] = await Promise.all([
    supabase
      .from("credit_buckets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("credits_remaining", 0),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    createAdminClient()
      .from("purchases")
      .select("created_at, package:packages(kind, name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const pkg = latest && (Array.isArray(latest.package) ? latest.package[0] : latest.package);
  const enrolledIn =
    latest &&
    pkg?.kind === "enrollment" &&
    Date.now() - new Date(latest.created_at).getTime() < JUST_NOW_MS
      ? pkg.name
      : null;
  return {
    ready: (sessionsLeft ?? 0) > 0,
    firstTime: (everBooked ?? 0) === 0,
    enrolledIn,
  };
}

export default async function Success() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { ready, firstTime, enrolledIn } = user
    ? await purchaseState(supabase, user.id)
    : { ready: false, firstTime: false, enrolledIn: null };

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-xl mx-auto px-6 py-16 sm:py-20 text-center">
        {firstTime && !enrolledIn && <FirstSteps current={4} />}
        <span className="badge-amber mb-5 inline-flex">◆ THANK YOU</span>
        <h1 className="font-display text-5xl sm:text-7xl text-white leading-none">
          PAYMENT
          <span className="block gradient-text">CONFIRMED</span>
        </h1>
        <div className="divider-glow max-w-[100px] mx-auto mt-5 mb-7" />

        {!user ? (
          <>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              Your sessions will be on your account in a moment. Sign in to book.
            </p>
            <Link
              href="/book/login?next=%2Fbook%2Fschedule"
              className="btn-gold px-10 py-4 rounded-full text-sm tracking-widest font-black inline-block"
            >
              SIGN IN TO BOOK
            </Link>
          </>
        ) : enrolledIn ? (
          <>
            <p className="text-zinc-300 text-sm leading-relaxed mb-8">
              You&rsquo;re enrolled in {enrolledIn}. We&rsquo;ll reach out to set up your schedule.
            </p>
            <Link
              href="/book/dashboard"
              className="btn-gold px-10 py-4 rounded-full text-sm tracking-widest font-black inline-block"
            >
              GO TO MY ACCOUNT
            </Link>
          </>
        ) : ready ? (
          <>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              Your sessions are on your account. Pick a day and time that works for you.
            </p>
            <Link
              href="/book/schedule"
              className="btn-gold px-10 py-4 rounded-full text-sm tracking-widest font-black inline-block"
            >
              {firstTime ? "BOOK YOUR FIRST SESSION" : "BOOK A SESSION"}
            </Link>
            <div className="mt-4">
              <Link
                href="/book/dashboard"
                className="inline-flex items-center min-h-[44px] text-zinc-400 hover:text-[#b07adf] text-xs tracking-widest"
              >
                GO TO MY ACCOUNT →
              </Link>
            </div>
          </>
        ) : (
          <WaitForSessions />
        )}
      </section>
    </main>
  );
}
