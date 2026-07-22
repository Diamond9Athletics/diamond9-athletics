import type { Metadata } from "next";
import Link from "next/link";
import { img } from "@/lib/config";

export const metadata: Metadata = {
  title: "The App",
  description:
    "The Diamond Nine Athletics iOS app — Rapsodo & Trackman analytics, training programs, drill library, coach–athlete messaging, and scouting reports. Free for everyone.",
};

const EMAIL = "support@diamond9athletics.com";

const APP_STORE_URL =
  "https://apps.apple.com/us/app/diamond-nine-athletics/id6762482389";

const features = [
  {
    title: "RAPSODO & TRACKMAN",
    desc: "Upload your Rapsodo or Trackman CSV — get per-pitch analytics, strike zone heatmaps, movement profiles, personal bests, and progression charts automatically.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 15l4-4 3 3 5-6" />
    ),
  },
  {
    title: "LEADERBOARDS",
    desc: "See where you stack up against every Diamond Nine athlete. Live rankings keep pitchers competitive and chasing the top spot.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4M6 4h12v4a6 6 0 01-12 0V4zM6 6H4a2 2 0 002 4m12-4h2a2 2 0 01-2 4" />
    ),
  },
  {
    title: "TRAINING PROGRAMS",
    desc: "Coaches build reusable multi-week training programs once, then apply them to any athlete's calendar in a single tap.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
    ),
  },
  {
    title: "DRILL LIBRARY",
    desc: "Organized library of drills with video attachments — either YouTube links or coach-uploaded clips — so every rep is done right.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
    ),
  },
  {
    title: "COACH ↔ ATHLETE",
    desc: "Direct messaging between coaches and athletes, plus daily training checklists so nothing gets missed.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.5-1.34" />
    ),
  },
  {
    title: "SCOUTING REPORTS",
    desc: "Generate professional PDF reports of any athlete's arsenal and progression — ready to send to college coaches and scouts.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
          <span className="badge-amber mb-5 inline-flex">◆ NOW ON iOS · FREE</span>
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
        <p className="text-center text-zinc-600 text-[11px] mt-8 tracking-wide">
          Compatible with Rapsodo and Trackman CSV exports. Not affiliated with or endorsed by
          Rapsodo or Trackman.
        </p>
      </section>

      {/* ── Free banner ──────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="card-modern-amber rounded-2xl overflow-hidden card-lift">
          <div className="h-1 bg-gradient-to-r from-transparent via-[#9954d2] to-transparent" />
          <div className="p-8 sm:p-10 text-center">
            <p className="section-label mb-3">SIMPLE</p>
            <h2 className="font-display text-4xl sm:text-5xl text-white mb-3">
              <span className="gradient-text">FREE</span> TO DOWNLOAD AND USE
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-6">
              For athletes and coaches. No subscription. No in-app purchases. Premium plans coming soon.
            </p>
            <AppStoreBadge />
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
