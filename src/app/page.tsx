import Link from "next/link";
import { img } from "@/lib/config";
import { HomeTestimonials } from "@/components/HomeTestimonials";
import { HeroBackdrop } from "@/components/HeroBackdrop";

/** A coach's photo, with their name, linking to their page. */
function CoachPhoto({
  href,
  src,
  alt,
  role,
  name,
  className,
  position,
}: {
  href: string;
  src: string;
  alt: string;
  role: string;
  name: string;
  className: string;
  position: string;
}) {
  return (
    <Link
      href={href}
      className={`${className} group block rounded-2xl overflow-hidden border border-[#9954d2]/25 shadow-2xl shadow-black/60 card-lift`}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" style={{ objectPosition: position }} />
      <div className="absolute inset-x-0 bottom-0 px-4 pt-12 pb-3 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-transparent">
        <p className="text-[#c49bea] text-xs font-bold tracking-widest">{role}</p>
        <p className="font-display text-xl sm:text-3xl text-white leading-tight flex items-center gap-1.5 sm:gap-2">
          {name}
          <span className="text-[#b07adf] text-lg transition-transform duration-200 group-hover:translate-x-1">→</span>
        </p>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden page-reveal">

      {/* ══ HERO: the name, front and center, over the moving field ═══ */}
      <section className="relative overflow-hidden flex items-center justify-center min-h-[72svh] sm:min-h-[80vh] pt-32 pb-20 sm:pt-36 sm:pb-24">
        <HeroBackdrop />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="animate-fade-in-up text-zinc-400 text-sm sm:text-base tracking-[0.3em] uppercase mb-4">Elevate Your Game</p>
          <h1 className="font-display leading-none mb-6">
            <span className="animate-fade-in-up block text-6xl sm:text-8xl lg:text-[10rem] gradient-text-white">DIAMOND 9</span>
            <span aria-hidden="true" className="animate-fade-in-up-delay divider-glow block max-w-[80px] mx-auto my-2" />
            <span className="animate-fade-in-up-delay block text-6xl sm:text-8xl lg:text-[10rem] gradient-text text-glow">ATHLETICS</span>
          </h1>
          <p className="animate-fade-in-up-delay-2 text-zinc-300 text-base sm:text-lg tracking-wide mb-9">
            Real data. Real results.
          </p>
          <div className="animate-fade-in-up-delay-3 flex flex-row gap-3 justify-center flex-wrap">
            <Link href="/book" className="btn-gold animate-pulse-glow px-6 sm:px-8 py-4 text-sm rounded-full inline-block font-black tracking-widest">
              BOOK NOW
            </Link>
            <Link href="/pitching-plans" className="btn-outline px-6 sm:px-8 py-4 text-sm rounded-full inline-block tracking-widest">
              VIEW PLANS
            </Link>
          </div>
        </div>
      </section>

      {/* ══ DIAMOND MEMBERSHIP ════════════════════════════════════ */}
      <section className="relative py-14 sm:py-20 px-6 bg-[#040200]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#9954d2]/30 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <p className="section-label mb-3">NEW · MOST POPULAR</p>
            <h2 className="font-display text-4xl sm:text-7xl text-white leading-none">DIAMOND <span className="gradient-text">MEMBERSHIP</span></h2>
            <div className="divider-glow max-w-[120px] mx-auto mt-5" />
          </div>

          <div className="rounded-2xl overflow-hidden card-lift card-shine card-modern-amber">
            <div className="h-1 bg-gradient-to-r from-transparent via-[#9954d2] to-transparent" />
            <div className="p-6 sm:p-10 relative overflow-hidden">
              <div className="jersey-num absolute right-2 bottom-0 text-[6rem] sm:text-[10rem] select-none pointer-events-none">◆</div>

              <span className="badge-amber mb-5 inline-flex">★ UNLIMITED TRAINING</span>
              <h2 className="font-display text-3xl sm:text-5xl text-white mb-1">PITCHING · MONTHLY</h2>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-display text-5xl sm:text-6xl gradient-text">$350</span>
                <span className="text-zinc-500 text-sm">/ month</span>
              </div>
              <p className="text-zinc-400 text-sm mb-6 sm:mb-8 max-w-2xl">
                Come in whenever the schedule is open. Bullpens, high-intent throwing days, plyo work,
                pulldowns, med ball — all coached, all yours. Cancel anytime.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6 sm:mb-8 max-w-2xl">
                {[
                  "Unlimited Sessions Per Month",
                  "Personal Throwing Plan",
                  "Plyo Ball Program",
                  "Weighted Ball Training",
                  "Mobility & Arm Care",
                  "Rapsodo Tracking Every Session",
                  "Unlimited Video Review",
                  "Full D9 App Access",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-zinc-300 text-xs">
                    <svg className="w-3 h-3 text-[#9954d2] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    {feature}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-3 relative z-10">
                <Link href="/book/subscribe" className="btn-gold px-6 sm:px-10 py-4 rounded-full text-sm tracking-widest font-black inline-block text-center whitespace-nowrap">
                  SUBSCRIBE · $350/MO
                </Link>
                <Link href="/pitching-plans" className="btn-outline px-6 sm:px-8 py-4 rounded-full text-xs sm:text-sm tracking-widest font-bold inline-block text-center whitespace-nowrap">
                  SEE ALL PLANS
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRAINING PLANS ════════════════════════════════════════ */}
      <section className="relative py-16 sm:py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(153,84,210,0.08)_0%,transparent_100%)]" />
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
                    <span className="text-xs text-[#b07adf] font-bold tracking-[0.2em] shrink-0">ACTIVE</span>
                  </div>
                  <h3 className="font-display text-5xl sm:text-6xl text-white mb-1">PITCHING</h3>
                  <h3 className="font-display text-5xl sm:text-6xl gradient-text leading-tight mb-4">PLANS</h3>
                  <p className="text-zinc-400 text-sm mb-6">From $125 · Rapsodo tracked every session</p>
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
                    <span className="text-xs text-[#b07adf] font-bold tracking-[0.2em] shrink-0">ACTIVE</span>
                  </div>
                  <h3 className="font-display text-5xl sm:text-6xl text-white mb-1">HITTING</h3>
                  <h3 className="font-display text-5xl sm:text-6xl gradient-text leading-tight mb-4">PLANS</h3>
                  <p className="text-zinc-400 text-sm mb-6">From $100 · Data-driven every session</p>
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

      {/* ══ COACHES ═══════════════════════════════════════════════ */}
      <section className="relative py-16 sm:py-24 px-6">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#9954d2]/30 to-transparent" />
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <p className="section-label mb-3">WHO YOU&rsquo;LL TRAIN WITH</p>
            <h2 className="font-display text-5xl sm:text-7xl text-white">YOUR <span className="gradient-text">COACHES</span></h2>
            <div className="divider-glow max-w-[120px] mx-auto mt-5" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <CoachPhoto
              href="/trainers/wes"
              src={img("/images/wes-pitching.jpg")}
              alt="Head Trainer Wes Gafford pitching"
              role="HEAD TRAINER"
              name="WES GAFFORD"
              className="relative h-72 sm:h-[28rem]"
              position="center 15%"
            />
            <CoachPhoto
              href="/trainers/turner"
              src={img("/images/turner-olson.jpg")}
              alt="Hitting Trainer Turner Olson at the plate"
              role="HITTING TRAINER"
              name="TURNER OLSON"
              className="relative h-72 sm:h-[28rem]"
              position="48% 30%"
            />
          </div>
        </div>
      </section>

      <HomeTestimonials />

    </main>
  );
}
