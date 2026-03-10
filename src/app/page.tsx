import Link from "next/link";
import { img } from "@/lib/config";
import { IconBaseball, IconBat, IconDiamond } from "@/components/BaseballIcons";

const steps = [
  { num: "01", title: "CHOOSE A PLAN", desc: "Pick from Half Session to the full College Summer program." },
  { num: "02", title: "BOOK & SHOW UP", desc: "Schedule your session. Bring the effort. We bring the tech." },
  { num: "03", title: "GET THE DATA", desc: "Walk away with Rapsodo numbers, video, and a plan to improve." },
];

export default function Home() {
  return (
    <main className="overflow-hidden page-reveal">

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Stadium background */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${img("/images/hero-main.jpg")}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/55 to-zinc-950" />
        {/* Amber radial */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_65%,rgba(153,84,210,0.07)_0%,transparent_100%)]" />

        {/* Giant watermark "9" */}
        <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 font-display text-[32rem] leading-none text-white/[0.025] select-none pointer-events-none hidden lg:block">9</div>

        {/* Baseball stitching SVG curves */}
        <svg className="absolute bottom-0 left-0 right-0 w-full opacity-10 pointer-events-none" height="80" viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none">
          <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40" stroke="#9954d2" strokeWidth="1.5" fill="none" strokeDasharray="6 6"/>
          <path d="M0,55 C240,95 480,15 720,55 C960,95 1200,15 1440,55" stroke="#9954d2" strokeWidth="1" fill="none" strokeDasharray="6 6"/>
        </svg>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-20">
          <p className="animate-fade-in-up text-zinc-400 text-sm sm:text-base tracking-[0.3em] uppercase mb-4">Elevate Your Game</p>
          <h1 className="font-display leading-none mb-6">
            <span className="animate-fade-in-up block text-5xl sm:text-8xl lg:text-[10rem] gradient-text-white">DIAMOND 9</span>
            <div className="divider-glow max-w-[80px] mx-auto my-2 animate-fade-in-up-delay" />
            <span className="animate-fade-in-up-delay block text-5xl sm:text-8xl lg:text-[10rem] gradient-text text-glow">ATHLETICS</span>
          </h1>
          <p className="animate-fade-in-up-delay-2 text-zinc-400 text-base sm:text-lg mb-10">
            Real data. Real results.
          </p>
          <div className="animate-fade-in-up-delay-3 flex flex-row gap-3 justify-center flex-wrap">
            <Link href="/appointments" className="btn-gold animate-pulse-glow px-8 py-4 text-sm rounded-full inline-block font-black tracking-widest">
              BOOK NOW
            </Link>
            <Link href="/pitching-plans" className="btn-outline px-8 py-4 text-sm rounded-full inline-block tracking-widest">
              VIEW PLANS
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center scroll-bounce">
          <div className="w-px h-10 bg-gradient-to-b from-[#9954d2]/30 to-transparent" />
        </div>
      </section>

      {/* ══ TRAINING PLANS ════════════════════════════════════════ */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${img("/images/hero-training.jpg")}')` }} />
        <div className="absolute inset-0 bg-zinc-950/82" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="section-label mb-3">WHAT WE OFFER</p>
            <h2 className="font-display text-5xl sm:text-7xl text-white">TRAINING <span className="gradient-text">PLANS</span></h2>
            <div className="divider-glow max-w-[120px] mx-auto mt-5" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Pitching — ACTIVE */}
            <Link href="/pitching-plans" className="group card-lift card-shine">
              <div className="relative rounded-2xl overflow-hidden card-modern-amber stripe-card">
                <div className="absolute inset-0 bg-gradient-to-br from-[#9954d2]/12 via-zinc-950/80 to-zinc-950" />
                <div className="absolute right-0 bottom-0 font-display text-[120px] text-[#9954d2]/5 leading-none select-none pointer-events-none">01</div>
                <div className="relative z-10 p-7 sm:p-10">
                  <div className="flex items-center gap-2 mb-5 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-[#9954d2] animate-pulse shrink-0" />
                    <span className="text-[10px] text-[#b07adf] font-bold tracking-[0.2em] shrink-0">ACTIVE</span>
                    <IconBaseball className="w-5 h-5 text-[#b07adf] shrink-0" />
                  </div>
                  <h3 className="font-display text-5xl sm:text-6xl text-white mb-1">PITCHING</h3>
                  <h3 className="font-display text-5xl sm:text-6xl gradient-text leading-tight mb-4">PLANS</h3>
                  <p className="text-zinc-400 text-sm mb-6">From $50 · Rapsodo tracked every session</p>
                  <span className="flex items-center gap-2 text-[#b07adf] text-sm font-black tracking-wider">
                    VIEW ALL PLANS
                    <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>
                  </span>
                </div>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{boxShadow:"inset 0 0 0 1px rgba(153,84,210,0.4)"}} />
              </div>
            </Link>

            {/* Hitting — ACTIVE */}
            <Link href="/hitting-plans" className="group card-lift card-shine">
              <div className="relative rounded-2xl overflow-hidden card-modern-amber stripe-card">
                <div className="absolute inset-0 bg-gradient-to-br from-[#9954d2]/12 via-zinc-950/80 to-zinc-950" />
                <div className="absolute right-0 bottom-0 font-display text-[120px] text-[#9954d2]/5 leading-none select-none pointer-events-none">02</div>
                <div className="relative z-10 p-7 sm:p-10">
                  <div className="flex items-center gap-2 mb-5 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-[#9954d2] animate-pulse shrink-0" />
                    <span className="text-[10px] text-[#b07adf] font-bold tracking-[0.2em] shrink-0">ACTIVE</span>
                    <IconBat className="w-5 h-5 text-[#b07adf] shrink-0" />
                  </div>
                  <h3 className="font-display text-5xl sm:text-6xl text-white mb-1">HITTING</h3>
                  <h3 className="font-display text-5xl sm:text-6xl gradient-text leading-tight mb-4">PLANS</h3>
                  <p className="text-zinc-400 text-sm mb-6">From $50 · Data-driven every session</p>
                  <span className="flex items-center gap-2 text-[#b07adf] text-sm font-black tracking-wider">
                    VIEW ALL PLANS
                    <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>
                  </span>
                </div>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{boxShadow:"inset 0 0 0 1px rgba(153,84,210,0.4)"}} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════ */}
      <section className="relative py-24 px-6 bg-[#020101] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#9954d2]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#9954d2]/30 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-3">THE PROCESS</p>
            <h2 className="font-display text-5xl sm:text-7xl text-white">HOW IT <span className="gradient-text">WORKS</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative card-modern rounded-2xl p-8 card-lift group">
                <div className="step-num mb-2">{step.num}</div>
                <h3 className="font-display text-2xl text-white mb-2">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
                <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#9954d2]/8 border border-[#9954d2]/15 flex items-center justify-center">
                  <span className="text-[#9954d2]/60 text-xs font-black">{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SUMMER TRAINING ═══════════════════════════════════════ */}
      <section className="relative py-24 px-6 bg-[#040200]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#9954d2]/30 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="section-label mb-3">SEASONAL PROGRAMS</p>
            <h2 className="font-display text-5xl sm:text-7xl text-white">SUMMER <span className="gradient-text">TRAINING</span></h2>
            <div className="divider-glow max-w-[120px] mx-auto mt-5" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* College — FEATURED */}
            <div className="rounded-2xl overflow-hidden card-lift card-shine card-modern-amber">
              <div className="h-1 bg-gradient-to-r from-transparent via-[#9954d2] to-transparent" />
              <div className="p-8 sm:p-10 relative overflow-hidden">
                <div className="jersey-num absolute right-2 bottom-0 text-[8rem]">C</div>
                <span className="badge-amber mb-5 inline-flex">★ FLAGSHIP PROGRAM</span>
                <h2 className="font-display text-4xl sm:text-5xl text-white mb-1">COLLEGE SUMMER</h2>
                <div className="flex items-baseline gap-2 mb-7">
                  <span className="font-display text-6xl gradient-text">$1,100</span>
                  <span className="text-zinc-600 text-sm">/ full program</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 mb-8">
                  {["A/B/Recovery System","Long Toss Plan","Weekly Live At-Bats","Rapsodo Tracking","Plyo Ball + Arm Care","Mobility Training","Video Capture","Recruiting Video","Workload Management"].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-zinc-300 text-xs">
                      <svg className="w-3 h-3 text-[#9954d2] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/pitching-plans" className="btn-gold px-10 py-4 rounded-full text-sm tracking-widest font-black inline-block">
                    ENROLL NOW
                  </Link>
                  <a href={img("/downloads/summer-college-flyer.pdf")} download className="btn-outline px-8 py-4 rounded-full text-sm tracking-widest font-bold inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    GET THE FLYER
                  </a>
                </div>
              </div>
            </div>

            {/* High School */}
            <div className="rounded-2xl overflow-hidden card-lift card-shine card-modern">
              <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
              <div className="p-8 sm:p-10 relative overflow-hidden">
                <div className="jersey-num absolute right-2 bottom-0 text-[8rem] opacity-[0.04]">HS</div>
                <span className="badge-amber mb-5 inline-flex">⚾ PREP PROGRAM</span>
                <h2 className="font-display text-4xl sm:text-5xl text-white mb-1">HIGH SCHOOL SUMMER</h2>
                <div className="flex items-baseline gap-2 mb-7">
                  <span className="font-display text-6xl gradient-text">$850</span>
                  <span className="text-zinc-600 text-sm">/ full program</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 mb-8">
                  {["Rapsodo Feedback","Mechanical Analysis","Arm Care Protocol","Video Breakdown","Weighted Ball","Recruiting Prep"].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-zinc-300 text-xs">
                      <svg className="w-3 h-3 text-[#9954d2] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      {feature}
                    </div>
                  ))}
                </div>
                <Link href="/appointments" className="btn-gold px-10 py-4 rounded-full text-sm tracking-widest font-black inline-block">ENROLL NOW</Link>
              </div>
            </div>

          </div>
        </div>
      </section>


    </main>
  );
}
