import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { FirstSteps } from "@/components/FirstSteps";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "You're in",
  description: "Diamond Nine Athletics — Diamond membership confirmed.",
};

export default async function SubscribeSuccessPage() {
  // A first-timer (never booked) gets the last step of the buying steps.
  // The membership itself is checked live with Stripe on the booking page,
  // so it's ready to book with right away.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let firstTime = false;
  if (user) {
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    firstTime = (count ?? 0) === 0;
  }

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-md mx-auto px-6 py-16 sm:py-20 text-center">
        {firstTime && <FirstSteps current={4} />}
        <span className="badge-amber mb-5 inline-flex">◆ YOU&rsquo;RE IN</span>
        <h1 className="font-display text-5xl sm:text-6xl text-white leading-none mb-3">
          WELCOME TO
          <span className="block gradient-text">DIAMOND</span>
        </h1>
        <div className="divider-glow max-w-[80px] mx-auto mb-6" />
        <p className="text-zinc-300 text-sm leading-relaxed mb-3">
          Your Diamond membership is active. You&rsquo;ve got unlimited pitching sessions
          per month — come in whenever the schedule is open.
        </p>
        <p className="text-zinc-500 text-xs leading-relaxed mb-8">
          A confirmation is on its way from Stripe. Wes will follow up personally
          to build out your throwing plan.
        </p>
        <Link
          href={user ? "/book/schedule" : "/book/login?next=%2Fbook%2Fschedule"}
          className="btn-gold inline-block px-10 py-4 rounded-full text-sm tracking-widest font-black"
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
      </section>
    </main>
  );
}
