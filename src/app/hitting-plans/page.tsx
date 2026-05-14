import Link from "next/link";
import type { Metadata } from "next";
import { img } from "@/lib/config";
import { IconField } from "@/components/BaseballIcons";

export const metadata: Metadata = {
  title: "Hitting Plans",
  description: "Elite, data-driven hitting plans from Diamond Nine Athletics — swing assessments, bat speed work, and video breakdown in Austin, TX.",
};

const plans = [
  {
    name: "DIAMOND",
    tag: "MOST POPULAR",
    price: "$300",
    sub: "5 sessions",
    features: ["5 Lessons", "2 Media / Recruiting Videos", "At-Home Tee Plan", "Swing Path & Barrel Control", "Lower-Half Sequencing", "Video Analysis", "Bat Speed Development"],
    featured: true,
    jersey: "5",
    bar: 100,
  },
  {
    name: "GOLD",
    tag: "GREAT VALUE",
    price: "$275",
    sub: "4 sessions",
    features: ["4 Lessons", "1 Media / Recruiting Video", "Swing Assessment", "Video Breakdown", "Bat Speed & Rotational Power", "Mobility Training"],
    featured: false,
    jersey: "4",
    bar: 78,
  },
  {
    name: "SINGLE",
    tag: "ONE TIME",
    price: "$100",
    sub: "60 min session",
    features: ["60 Min Cage Session", "Full Swing Assessment", "Corrective Drill Series", "Timing & Velocity Work", "Take-Home Drill Plan"],
    featured: false,
    jersey: "1",
    bar: 55,
  },
  {
    name: "HALF",
    tag: "QUICK HIT",
    price: "$50",
    sub: "30 min session",
    features: ["30 Min Cage Session", "Swing Flaw ID", "1-2 Key Adjustments", "Contact Consistency Drills"],
    featured: false,
    jersey: "½",
    bar: 35,
  },
];

export default function HittingPlans() {
  return (
    <main className="pt-24 bg-[#040200]">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${img("/images/hero-vintage.jpg")}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/75 via-zinc-950/55 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(153,84,210,0.07)_0%,transparent_100%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <span className="badge-amber mb-5 inline-flex">TRAINING PROGRAMS</span>
          <h1 className="font-display leading-none">
            <span className="text-white text-6xl sm:text-8xl lg:text-9xl block">HITTING</span>
            <span className="gradient-text text-glow text-6xl sm:text-8xl lg:text-9xl block">PLANS</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-6 mb-5" />
          <p className="text-zinc-400 text-sm">Every rep has a purpose.</p>
        </div>
      </section>

      {/* ── Summer Hitter Training ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="relative card-modern-amber rounded-2xl overflow-hidden card-lift card-shine">
          <div className="h-1 bg-gradient-to-r from-transparent via-[#9954d2] to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#9954d2]/3 rounded-full blur-[80px]" />
          <div className="jersey-num absolute right-8 bottom-0 text-[12rem] opacity-[0.03]">S</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 relative z-10">
            <div className="p-8 sm:p-12">
              <span className="badge-amber mb-4 inline-flex"><IconField className="w-3 h-3" /> SUMMER PROGRAM</span>
              <h2 className="font-display text-4xl sm:text-5xl text-white mt-3 mb-2">SUMMER HITTER TRAINING</h2>
              <p className="text-zinc-500 text-sm mb-4">The complete package for hitters looking to level up this summer.</p>
              <p className="gradient-text font-display text-7xl mb-2">$1,100</p>
              <p className="text-zinc-600 text-xs mb-8">Full program · All-inclusive</p>
              <Link href="/appointments" className="btn-gold px-10 py-4 rounded-full text-sm tracking-widest font-black inline-block">
                ENROLL NOW
              </Link>
            </div>
            <div className="p-8 sm:p-12 border-t lg:border-t-0 lg:border-l border-[#9954d2]/10 flex items-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {["Structured Weekly Sessions","Weekly Live At-Bats","Rapsodo Data Tracking","Progressive Bat Speed Training","Pitch Recognition Training","Video Capture","Rotational Strength Programming","Mobility & Recovery Integration","Workload Management"].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-zinc-300 text-sm">
                    <svg className="w-3.5 h-3.5 text-[#9954d2] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Plans Grid ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl overflow-hidden flex flex-col card-lift card-shine ${plan.featured ? "plan-featured card-modern-amber" : "card-modern"}`}
            >
              {plan.featured && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#9954d2] to-transparent" />
                  <div className="ribbon">MOST POPULAR</div>
                </>
              )}
              {/* Jersey number watermark */}
              <div className="jersey-num absolute right-2 bottom-[-10px] text-[6rem] opacity-[0.06]">{plan.jersey}</div>

              <div className={`p-6 flex flex-col flex-1 ${plan.featured ? "pt-7" : ""}`}>
                <div className="mb-5">
                  <span className={`text-[10px] tracking-wider font-bold px-2.5 py-1 rounded-full ${plan.featured ? "bg-[#9954d2]/15 text-[#b07adf] border border-[#9954d2]/20" : "bg-zinc-800/60 text-zinc-500 border border-zinc-700/30"}`}>
                    {plan.tag}
                  </span>
                </div>
                <h3 className="font-display text-3xl text-white mb-0.5">{plan.name}</h3>
                <p className="text-zinc-600 text-xs mb-4">{plan.sub}</p>
                <p className="gradient-text font-display text-5xl mb-5">{plan.price}</p>

                {/* Intensity bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-[10px] text-zinc-600 mb-1.5">
                    <span>SESSION VALUE</span>
                    <span className="text-[#9954d2]">{plan.bar}%</span>
                  </div>
                  <div className="velocity-bar-track">
                    <div className="velocity-bar-fill" style={{ width: `${plan.bar}%` }} />
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-zinc-300 text-sm">
                      <svg className="w-3.5 h-3.5 text-[#9954d2] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/appointments" className={`text-center py-3.5 rounded-full text-sm tracking-widest font-bold block ${plan.featured ? "btn-gold" : "btn-outline"}`}>
                  SELECT PLAN
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
