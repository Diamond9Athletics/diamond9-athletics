import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Session",
  description:
    "Book pitching or hitting sessions with Diamond Nine Athletics. Buy a package, use credits to schedule without paying again.",
};

export default function BookV2() {
  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(153,84,210,0.07)_0%,transparent_100%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ NEW BOOKING SYSTEM</span>
          <h1 className="font-display leading-none">
            <span className="text-white text-6xl sm:text-8xl lg:text-9xl block">BOOK A</span>
            <span className="gradient-text text-glow text-6xl sm:text-8xl lg:text-9xl block">SESSION</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-6 mb-5" />
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
            Buy a package once, then use credits to book sessions without paying again.
            Phase 1 — coming together now.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="card-modern rounded-2xl p-7 sm:p-10 space-y-5 text-zinc-300 text-sm leading-relaxed">
          <p className="text-[#b07adf] text-xs tracking-widest font-bold">UNDER CONSTRUCTION</p>
          <p>
            This page will replace the current Acuity scheduler. The new flow lets athletes:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Create an account and log in</li>
            <li>Buy a package (Diamond, Gold, Single, Half) via Stripe</li>
            <li>Use prepaid credits to book future sessions — no payment prompt on the second, third, fourth, fifth lesson</li>
            <li>Reschedule or cancel from their own dashboard</li>
          </ul>
          <p className="text-zinc-500 text-xs">
            Credits expire 31 days after the first scheduled session.
          </p>
        </div>
      </section>
    </main>
  );
}
