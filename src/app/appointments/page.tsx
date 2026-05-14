import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { img } from "@/lib/config";

export const metadata: Metadata = {
  title: "Book a Session",
  description: "Book a pitching or hitting training session with Diamond Nine Athletics in Austin, Texas.",
};

const bookingSteps = [
  { num: "01", title: "PICK A PLAN",  desc: "Choose from our pitching or hitting plans: Half Session to College Summer." },
  { num: "02", title: "BOOK ONLINE",  desc: "Select your date and time directly in the scheduler below. Instant confirmation." },
  { num: "03", title: "COME READY TO WORK", desc: "" },
];

const plans = [
  { name: "Half Session",   price: "$50",    sub: "30 min",        featured: false },
  { name: "Single Session", price: "$100",   sub: "60 min",        featured: false },
  { name: "Gold Plan",      price: "$275",   sub: "4 sessions",    featured: false },
  { name: "Diamond Plan",   price: "$300",   sub: "5 sessions",    featured: true  },
  { name: "College Summer", price: "$1,100", sub: "Full program",  featured: false },
];

export default function Appointments() {
  return (
    <main className="pt-24 bg-[#040200]">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${img("/images/batting-cages.jpg")}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(153,84,210,0.07)_0%,transparent_100%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ GET STARTED</span>
          <h1 className="font-display leading-none">
            <span className="text-white text-6xl sm:text-8xl lg:text-9xl block">BOOK A</span>
            <span className="gradient-text text-glow text-6xl sm:text-8xl lg:text-9xl block">SESSION</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-6 mb-4" />
          <p className="text-zinc-400 text-sm">Every session is Rapsodo-tracked. Every rep has data behind it.</p>
        </div>
      </section>

      {/* ── How to Book ──────────────────────────────────────── */}
      <section className="bg-[#020101] border-y border-zinc-800/40 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="section-label text-center mb-10">HOW TO BOOK</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bookingSteps.map((step, i) => (
              <div key={i} className="relative card-modern rounded-2xl p-7 card-lift">
                <div className="step-num mb-1">{step.num}</div>
                <h3 className="font-display text-xl text-white mb-2">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
                <div className="absolute top-5 right-5 w-7 h-7 rounded-full bg-[#9954d2]/8 border border-[#9954d2]/15 flex items-center justify-center">
                  <span className="text-[#9954d2]/50 text-xs font-black">{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Info Row ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-14 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick info */}
          <div className="card-modern rounded-2xl p-6 space-y-4">
            {[
              { label: "RESPONSE TIME", value: "Within 24 hours",   icon: "⚡" },
              { label: "LOCATION",      value: "Texas",              icon: "📍" },
              { label: "INSTAGRAM",     value: "@diamond9atx", icon: "📸" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="icon-box text-lg flex-shrink-0">{item.icon}</div>
                <div>
                  <p className="text-zinc-600 text-[10px] tracking-widest mb-0.5">{item.label}</p>
                  <p className="text-white text-sm">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Plan pricing mini-table */}
          <div className="card-modern rounded-2xl p-6">
            <p className="section-label mb-4">AVAILABLE PLANS</p>
            <div className="space-y-2.5">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex justify-between items-center py-1.5 px-2 rounded-lg transition-colors ${plan.featured ? "bg-[#9954d2]/8 border border-[#9954d2]/10" : "hover:bg-zinc-800/20"}`}
                >
                  <div>
                    <span className="text-sm text-zinc-300">{plan.name}</span>
                    <span className="ml-2 text-zinc-600 text-xs">{plan.sub}</span>
                  </div>
                  <span className={`font-black font-display text-lg ${plan.featured ? "gradient-text" : "text-[#b07adf]"}`}>{plan.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Acuity Scheduler ─────────────────────────────────── */}
      <section className="w-full px-6 pb-24">
        <div className="card-modern-amber rounded-2xl overflow-hidden relative">
          <div className="h-px bg-gradient-to-r from-transparent via-[#9954d2]/40 to-transparent absolute top-0 left-0 right-0 z-10" />
          <iframe
            src="https://app.acuityscheduling.com/schedule.php?owner=32061627&ref=embedded_csp"
            title="Schedule Appointment"
            width="100%"
            height="1000"
            frameBorder="0"
            allow="payment"
            className="w-full block"
          />
          <Script src="https://embed.acuityscheduling.com/js/embed.js" strategy="lazyOnload" />
        </div>
      </section>

    </main>
  );
}
