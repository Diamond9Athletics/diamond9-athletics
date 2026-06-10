import type { Metadata } from "next";
import Link from "next/link";
import { img } from "@/lib/config";

export const metadata: Metadata = {
  title: "The App",
  description:
    "The Diamond Nine Athletics iOS app — pitching analytics, training calendars, drill library, and coach-athlete tools. Built for pitchers and the coaches who develop them.",
};

const EMAIL = "support@diamond9athletics.com";

const APP_STORE_URL =
  "https://apps.apple.com/us/app/diamond-nine-athletics/id6762482389";

const features = [
  {
    title: "PITCHING ANALYTICS",
    desc: "Log every outing and watch your stats build over time. Velocity, command, and progress — all in one place.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 15l4-4 3 3 5-6" />
    ),
  },
  {
    title: "LEADERBOARDS",
    desc: "See where you stack up. Rankings keep athletes competitive and motivated to chase the top spot.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4M6 4h12v4a6 6 0 01-12 0V4zM6 6H4a2 2 0 002 4m12-4h2a2 2 0 01-2 4" />
    ),
  },
  {
    title: "TRAINING CALENDAR",
    desc: "Coaches program a full month of development. Athletes open the app and know exactly what to do each day.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
    ),
  },
  {
    title: "DRILL LIBRARY",
    desc: "A full library of training drills with instructional video — so every rep is done right.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
    ),
  },
  {
    title: "DAILY CHECKLIST",
    desc: "Mark all your work complete for the day in one tap. Stay accountable and never lose track.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    title: "COACH + ATHLETE",
    desc: "Coaches claim and manage their players, program their training, and monitor progress from anywhere.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.5-1.34" />
    ),
  },
];

function AppStoreBadge({ className = "" }: { className?: string }) {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 rounded-xl bg-black border border-zinc-700 px-5 py-3 hover:border-zinc-500 transition-colors ${className}`}
      aria-label="Download on the App Store"
    >
      <svg className="w-7 h-7 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.564 12.72c-.027-2.69 2.196-3.98 2.296-4.043-1.25-1.83-3.196-2.08-3.886-2.107-1.654-.167-3.228.974-4.066.974-.837 0-2.131-.95-3.503-.924-1.802.027-3.466 1.048-4.392 2.66-1.872 3.245-.479 8.046 1.343 10.68.89 1.29 1.952 2.738 3.343 2.686 1.342-.054 1.85-.868 3.472-.868 1.622 0 2.08.868 3.502.842 1.446-.027 2.362-1.314 3.245-2.606 1.022-1.496 1.444-2.943 1.47-3.018-.032-.014-2.822-1.083-2.85-4.296zM14.96 4.79c.74-.898 1.24-2.146 1.103-3.39-1.067.043-2.36.71-3.124 1.608-.685.795-1.285 2.065-1.124 3.283 1.19.092 2.405-.605 3.145-1.501z" />
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[10px] text-zinc-400 tracking-wide">Download on the</span>
        <span className="block text-white font-semibold text-lg -mt-0.5">App Store</span>
      </span>
    </a>
  );
}

export default function AppPage() {
  return (
    <main className="pt-24 bg-[#040200]">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${img("/images/hero-pitcher-night.jpg")}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/65 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(153,84,210,0.08)_0%,transparent_100%)]" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ NOW ON iOS</span>
          <h1 className="font-display leading-none">
            <span className="text-white text-5xl sm:text-7xl lg:text-8xl block">THE DIAMOND 9</span>
            <span className="gradient-text text-glow text-5xl sm:text-7xl lg:text-8xl block">APP</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-6 mb-5" />
          <p className="text-zinc-300 text-base sm:text-lg max-w-xl mx-auto mb-8">
            Track your pitching. Follow your plan. Outwork everyone. The training tool built for
            serious pitchers — and the coaches who develop them.
          </p>
          <div className="flex flex-col items-center gap-4">
            <AppStoreBadge />
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <Link href="/terms" className="hover:text-[#b07adf] transition-colors">Terms of Use</Link>
              <span className="text-zinc-700">·</span>
              <Link href="/privacy" className="hover:text-[#b07adf] transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="section-label mb-3">WHAT&rsquo;S INSIDE</p>
          <h2 className="font-display text-4xl sm:text-6xl text-white">BUILT TO <span className="gradient-text">DEVELOP</span></h2>
          <div className="divider-glow max-w-[120px] mx-auto mt-5" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="card-modern rounded-2xl p-7 card-lift">
              <div className="icon-box mb-5">
                <svg className="w-5 h-5 text-[#b07adf]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  {f.icon}
                </svg>
              </div>
              <h3 className="font-display text-2xl text-white mb-2 tracking-wide">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="section-label mb-3">SIMPLE PRICING</p>
          <h2 className="font-display text-4xl sm:text-6xl text-white">ONE PRICE. <span className="gradient-text">ALL IN.</span></h2>
          <div className="divider-glow max-w-[120px] mx-auto mt-5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">

          {/* Athletes */}
          <div className="relative card-modern-amber rounded-2xl overflow-hidden card-lift flex flex-col">
            <div className="h-1 bg-gradient-to-r from-transparent via-[#9954d2] to-transparent" />
            <div className="p-8 sm:p-10 flex flex-col flex-1">
              <span className="badge-amber mb-5 inline-flex self-start">★ FOR ATHLETES</span>
              <h3 className="font-display text-3xl text-white mb-1">ATHLETE</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display text-6xl gradient-text">$9.99</span>
                <span className="text-zinc-500 text-sm">/ month</span>
              </div>
              <p className="text-zinc-500 text-sm mb-7">or <span className="text-zinc-300">$99 / year</span> — save 17%</p>
              <ul className="space-y-3 mb-8 flex-1">
                {["Full pitching analytics","Leaderboards & rankings","Your daily training plan","Complete drill library","Daily progress checklist"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-zinc-300 text-sm">
                    <svg className="w-4 h-4 text-[#9954d2] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <AppStoreBadge className="self-start" />
            </div>
          </div>

          {/* Coaches */}
          <div className="relative card-modern rounded-2xl overflow-hidden card-lift flex flex-col">
            <div className="p-8 sm:p-10 flex flex-col flex-1">
              <span className="badge-amber mb-5 inline-flex self-start">FOR COACHES</span>
              <h3 className="font-display text-3xl text-white mb-1">COACH</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display text-6xl gradient-text-white">FREE</span>
              </div>
              <p className="text-zinc-500 text-sm mb-7">Always — no cost to coaches</p>
              <ul className="space-y-3 mb-8 flex-1">
                {["Claim & manage your athletes","Program a full month of training","Assign drills from the library","Monitor every athlete's progress","Build your roster"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-zinc-300 text-sm">
                    <svg className="w-4 h-4 text-[#9954d2] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <AppStoreBadge className="self-start" />
            </div>
          </div>

        </div>
      </section>

      {/* ── Support / CTA ────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-24 pt-4">
        <div className="card-modern rounded-2xl p-8 sm:p-10 text-center">
          <p className="section-label mb-3">QUESTIONS?</p>
          <h2 className="font-display text-3xl sm:text-4xl text-white mb-3">WE&rsquo;VE GOT YOU</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Reach out anytime — we typically respond within 1–2 business days.
          </p>
          <a
            href={`mailto:${EMAIL}?subject=Diamond%20Nine%20App`}
            className="btn-gold px-10 py-4 rounded-full text-sm tracking-widest font-black inline-block break-all"
          >
            {EMAIL}
          </a>
          <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 mt-7">
            <Link href="/terms" className="hover:text-[#b07adf] transition-colors">Terms of Use</Link>
            <span className="text-zinc-700">·</span>
            <Link href="/privacy" className="hover:text-[#b07adf] transition-colors">Privacy Policy</Link>
            <span className="text-zinc-700">·</span>
            <Link href="/support" className="hover:text-[#b07adf] transition-colors">Support</Link>
          </div>
        </div>
      </section>

    </main>
  );
}
