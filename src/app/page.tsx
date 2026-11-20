import Link from "next/link";
import { img } from "@/lib/config";
import { HomeTestimonials } from "@/components/HomeTestimonials";
import { HeroBackdrop } from "@/components/HeroBackdrop";

const MEMBERSHIP_FEATURES = [
  "Unlimited sessions per month",
  "Personal throwing plan",
  "Plyo ball program",
  "Weighted ball training",
  "Mobility & arm care",
  "Rapsodo tracking every session",
  "Unlimited video review",
  "Full D9 App access",
];

const PLAN_LINKS = [
  {
    href: "/pitching-plans",
    label: "Pitching",
    title: "Pitching plans",
    meta: "From $125 · Rapsodo tracked every session",
  },
  {
    href: "/hitting-plans",
    label: "Hitting",
    title: "Hitting plans",
    meta: "From $100 · Data-driven every session",
  },
];

/** A section's label, headline and side note, in the site's editorial style. */
function SectionHeader({
  label,
  title,
  accent,
  note,
}: {
  label: string;
  title: string;
  accent: string;
  note?: string;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-end mb-12 sm:mb-14">
      <div>
        <p className="section-label mb-5">{label}</p>
        <h2 className="font-display text-[2.5rem] leading-[1.02] sm:text-5xl lg:text-6xl text-white">
          {title}
          <span className="block text-[#b48ae6]">{accent}</span>
        </h2>
      </div>
      {note && <p className="text-zinc-400 text-base sm:text-lg leading-relaxed md:max-w-sm md:justify-self-end">{note}</p>}
    </div>
  );
}

/** A coach's photo with their name under it, linking to their page. */
function CoachPhoto({
  href,
  src,
  alt,
  role,
  name,
  position,
}: {
  href: string;
  src: string;
  alt: string;
  role: string;
  name: string;
  position: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] aspect-[4/5] bg-[#141319]">
        {/* eslint-disable-next-line @next/next/no-img-element -- plain photo, same as the rest of the site */}
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          style={{ objectPosition: position }}
        />
      </div>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 sm:gap-3">
        <div>
          <p className="text-zinc-500 text-[11px] font-medium tracking-[0.14em] uppercase">{role}</p>
          <p className="font-display text-xl sm:text-3xl text-white mt-1">{name}</p>
        </div>
        <span className="text-zinc-400 group-hover:text-white text-sm transition-colors whitespace-nowrap sm:pb-1">
          View profile <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden">
      {/* ══ HERO: the name over the ballpark at night ════════════════ */}
      <section className="relative min-h-[100svh] flex flex-col">
        <HeroBackdrop />

        <div className="relative z-10 flex-1 flex items-center justify-center px-6 pt-28 pb-10">
          <h1 className="hero-title animate-fade-in-up font-display text-white text-center text-[3.5rem] leading-[0.96] sm:text-8xl lg:text-[7rem] tracking-[-0.045em]">
            Diamond 9 <br className="sm:hidden" />
            Athletics
          </h1>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-10 sm:pb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 animate-fade-in-up-delay">
          <p className="text-zinc-200 text-base sm:text-lg leading-snug">
            Elevate your game.
            <span className="block text-zinc-400">Real data. Real results.</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/book" className="btn-gold inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm">
              Book now <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/pitching-plans" className="btn-outline inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm backdrop-blur-sm">
              View plans <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 01 · DIAMOND MEMBERSHIP ══════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label="01 / Diamond membership"
            title="Unlimited pitching."
            accent="One monthly price."
            note="Come in whenever the schedule is open. Bullpens, high-intent throwing days, plyo work, pulldowns, med ball — all coached, all yours. Cancel anytime."
          />

          <div className="card-modern-amber rounded-2xl grid lg:grid-cols-[1fr_1.4fr]">
            <div className="p-7 sm:p-10 border-b lg:border-b-0 lg:border-r border-white/[0.08] flex flex-col">
              <p className="text-zinc-400 text-sm">Diamond · pitching</p>
              <p className="font-display text-6xl sm:text-7xl text-white mt-3">
                $350<span className="text-xl text-zinc-500 font-normal ml-2">/ month</span>
              </p>
              <p className="text-zinc-500 text-sm mt-3">Renews monthly. Cancel anytime.</p>
              <div className="flex flex-wrap gap-3 mt-8 lg:mt-auto lg:pt-10">
                <Link href="/book/subscribe" className="btn-gold inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm">
                  Subscribe <span aria-hidden="true">↗</span>
                </Link>
                <Link href="/pitching-plans" className="btn-outline inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm">
                  See all plans
                </Link>
              </div>
            </div>
            <ul className="p-7 sm:p-10 grid sm:grid-cols-2 gap-x-8 gap-y-4 content-center">
              {MEMBERSHIP_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-zinc-200 text-[15px] leading-snug">
                  <svg className="w-4 h-4 mt-0.5 text-[#a97ce2] shrink-0" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5l3.5 3.5 7.5-8" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══ 02 · TRAINING PLANS ═════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 px-6 border-t border-white/[0.06] bg-[#0a090d]">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label="02 / Training plans"
            title="Training plans."
            accent="Pitching and hitting."
            note="Every session is tracked, so you can see exactly what’s getting better."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {PLAN_LINKS.map((plan) => (
              <Link
                key={plan.href}
                href={plan.href}
                className="group card-modern rounded-2xl p-7 sm:p-10 flex flex-col min-h-[240px] transition-colors hover:border-white/20"
              >
                <p className="section-label">{plan.label}</p>
                <h3 className="font-display text-4xl sm:text-5xl text-white mt-auto pt-14">{plan.title}</h3>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <p className="text-zinc-400 text-sm">{plan.meta}</p>
                  <span className="text-zinc-400 group-hover:text-white text-sm transition-colors whitespace-nowrap">
                    View plans <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 03 · COACHES ════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <SectionHeader label="03 / Coaches" title="Your coaches." accent="Who you’ll train with." />
          <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-4xl">
            <CoachPhoto
              href="/trainers/wes"
              src={img("/images/wes-pitching.jpg")}
              alt="Head Trainer Wes Gafford pitching"
              role="Head trainer"
              name="Wes Gafford"
              position="center 15%"
            />
            <CoachPhoto
              href="/trainers/turner"
              src={img("/images/turner-olson.jpg")}
              alt="Hitting Trainer Turner Olson at the plate"
              role="Hitting trainer"
              name="Turner Olson"
              position="48% 30%"
            />
          </div>
        </div>
      </section>

      <HomeTestimonials />
    </main>
  );
}
