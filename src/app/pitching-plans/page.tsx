import Link from "next/link";
import type { Metadata } from "next";
import { img } from "@/lib/config";

export const metadata: Metadata = {
  title: "Pitching Plans",
  description: "Elite pitching training plans with Rapsodo tracking — velocity, command, and arm care programs in Austin, TX.",
};

const plans = [
  {
    name: "DIAMOND",
    tag: "MOST POPULAR",
    price: "$300",
    sub: "4 sessions",
    features: ["4 Lessons","2 Recruiting Videos","Throwing Plan","Weighted Ball Training","Mobility Training","Rapsodo Tracking","Arm Care"],
    featured: true,
    jersey: "4",
    bar: 100,
  },
  {
    name: "GOLD",
    tag: "GREAT VALUE",
    price: "$275",
    sub: "3 sessions",
    features: ["3 Lessons","1 Media Video","Throwing Plan","Weighted Ball Training","Mobility Training","Rapsodo Tracking","Arm Care"],
    featured: false,
    jersey: "3",
    bar: 78,
  },
  {
    name: "SINGLE",
    tag: "ONE TIME",
    price: "$100",
    sub: "60 min session",
    features: ["60 Min Bullpen","Rapsodo Tracking","Throwing Drills","Arm Care"],
    featured: false,
    jersey: "1",
    bar: 55,
  },
  {
    name: "HALF",
    tag: "QUICK HIT",
    price: "$50",
    sub: "30 min session",
    features: ["30 Min Bullpen","Mechanical Breakdown","Arm Care"],
    featured: false,
    jersey: "½",
    bar: 35,
  },
];

export default function PitchingPlans() {
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
            <span className="text-white text-6xl sm:text-8xl lg:text-9xl block">PITCHING</span>
            <span className="gradient-text text-glow text-6xl sm:text-8xl lg:text-9xl block">PLANS</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-6 mb-5" />
          <p className="text-zinc-400 text-sm">Every session Rapsodo tracked. Every throw has a purpose.</p>
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
                <Link href="/book" className={`text-center py-3.5 rounded-full text-sm tracking-widest font-bold block ${plan.featured ? "btn-gold" : "btn-outline"}`}>
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
