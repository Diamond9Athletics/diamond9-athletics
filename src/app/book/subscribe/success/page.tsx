import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're in",
  description: "Diamond Nine Athletics — Diamond membership confirmed.",
};

export default function SubscribeSuccessPage() {
  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-md mx-auto px-6 py-20 text-center">
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
          href="/book/dashboard"
          className="btn-gold inline-block px-10 py-4 rounded-full text-sm tracking-widest font-black mb-3"
        >
          GO TO DASHBOARD
        </Link>
        <div>
          <Link
            href="/book/schedule"
            className="text-[#b07adf] hover:underline text-xs tracking-widest"
          >
            OR BOOK A SESSION NOW →
          </Link>
        </div>
      </section>
    </main>
  );
}
