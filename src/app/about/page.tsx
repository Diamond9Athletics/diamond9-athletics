import type { Metadata } from "next";
import Link from "next/link";
import { img } from "@/lib/config";
import { IconBaseball, IconGlove, IconDiamond } from "@/components/BaseballIcons";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "About",
  description: "Meet the trainers behind Diamond Nine Athletics — a data-first baseball training program based in Austin, Texas.",
};

const trainers = [
  {
    name: "WES GAFFORD",
    href: "/trainers/wes",
    title: "HEAD TRAINER",
    jersey: "1",
    bio: "Rapsodo-certified pitching specialist with a data-first approach to velocity and command development.",
    specialties: ["Rapsodo Analytics", "Velocity Development", "Arm Health", "Recruiting Prep"],
    icon: <IconBaseball className="w-10 h-10 text-[#b07adf]" />,
  },
  {
    name: "TURNER OLSON",
    href: "/trainers/turner",
    title: "HITTING TRAINER",
    jersey: "9",
    bio: "Swing-mechanics specialist focused on bat speed, contact consistency, and a repeatable, game-ready swing.",
    specialties: ["Swing Mechanics", "Bat Speed", "Pitch Recognition", "Video Breakdown"],
    icon: <IconGlove className="w-10 h-10 text-[#b07adf]" />,
  },
];

/**
 * A Google Drive video that only loads when it's scrolled near, with a
 * placeholder showing until Drive's player appears.
 */
function DriveVideo({ id, title }: { id: string; title: string }) {
  return (
    <div className="relative aspect-video w-full bg-[radial-gradient(ellipse_at_center,rgba(153,84,210,0.18)_0%,transparent_70%)]">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-400 text-xs tracking-widest">
        <span className="w-14 h-14 rounded-full bg-[#9954d2]/20 border border-[#9954d2]/40 flex items-center justify-center">
          <svg className="w-6 h-6 text-[#b07adf] ml-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        LOADING VIDEO…
      </div>
      <iframe
        src={`https://drive.google.com/file/d/${id}/preview`}
        title={title}
        loading="lazy"
        className="relative w-full h-full"
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    </div>
  );
}

export default function About() {
  return (
    <main className="pt-24 bg-[#040200]">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <PageHero
        badge="◆ MEET THE TEAM"
        title="THE"
        accent="TRAINERS"
        subtitle="Built on data. Defined by results."
      />

      {/* ── Trainer Cards ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trainers.map((trainer, i) => {
            const card = (
              <>
                {/* Photo panel */}
                <div className="relative h-56 bg-gradient-to-br from-zinc-900 to-[#050202] overflow-hidden">
                  {/* Diagonal corner accent */}
                  <div className="coach-accent" />
                  {/* Grid */}
                  <div className="absolute inset-0 grid-bg opacity-15" />
                  {/* Jersey watermark */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 font-display text-[8rem] leading-none text-white/[0.04] select-none pointer-events-none">
                    #{trainer.jersey}
                  </div>
                  {/* Photo */}
                  {i === 0 ? (
                    <div className="absolute inset-0">
                      <img src={img("/images/wes-gafford.jpg")} alt="Wes Gafford" className="w-full h-full object-cover object-top" />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 to-transparent" />
                    </div>
                  ) : (
                    <div className="absolute inset-0">
                      <img src={img("/images/turner-olson.jpg")} alt="Turner Olson" className="w-full h-full object-cover object-top" />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 to-transparent" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5 sm:p-7">
                  <p className="section-label mb-1">{trainer.title}</p>
                  <h2 className="font-display text-3xl text-white mb-3">{trainer.name}</h2>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-5">{trainer.bio}</p>
                  <div className="flex flex-wrap gap-2">
                    {trainer.specialties.map((s, j) => (
                      <span key={j} className="text-xs text-[#9954d2]/70 bg-[#9954d2]/8 border border-[#9954d2]/15 px-3 py-1 rounded-full tracking-wide">{s}</span>
                    ))}
                  </div>
                </div>
              </>
            );

            return (
              <Link key={i} href={trainer.href} className="card-modern rounded-2xl overflow-hidden card-lift group block">
                {card}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Featured Video ───────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-4">
        <div className="text-center mb-8">
          <p className="section-label mb-3">SEE IT IN ACTION</p>
          <h2 className="font-display text-4xl sm:text-5xl text-white">WATCH THE <span className="gradient-text">TRAINERS</span></h2>
          <div className="divider-glow max-w-[100px] mx-auto mt-5" />
        </div>

        {/* Main trainer video */}
        <div className="relative rounded-2xl overflow-hidden card-modern-amber card-lift mb-5">
          <div className="h-1 bg-gradient-to-r from-transparent via-[#9954d2] to-transparent" />
          <DriveVideo id="1aGdvsoJLRG3xG-LepY_DHETKaGb87hH1" title="Trainers in action" />
          <div className="px-6 py-4 flex items-center justify-between gap-4 bg-zinc-950/60">
            <div>
              <p className="text-white font-bold text-sm">TRAINERS IN ACTION</p>
              <p className="text-zinc-500 text-xs mt-0.5">Diamond Nine Athletics — Training Session</p>
            </div>
            <span className="badge-amber shrink-0">◆ FEATURED</span>
          </div>
        </div>

        {/* Athlete clip */}
        <div className="relative rounded-2xl overflow-hidden card-modern card-lift">
          <DriveVideo id="1Py9YLc1LKHXo5QuFh4RByXdiXNZYkd0U" title="Athlete spotlight" />
          <div className="px-6 py-4 flex items-center justify-between gap-4 bg-zinc-950/60">
            <div>
              <p className="text-white font-bold text-sm">ATHLETE SPOTLIGHT</p>
              <p className="text-zinc-500 text-xs mt-0.5">Thrall — Completion Highlight</p>
            </div>
            <span className="pitch-tag pitch-tag-fb shrink-0">⚾ LIVE SESSION</span>
          </div>
        </div>
      </section>

      {/* ── Mission quote ────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <div className="card-modern-amber rounded-2xl p-8 sm:p-14 relative overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-[#9954d2]/40 to-transparent absolute top-0 left-8 right-8" />
          <div className="absolute inset-0 stripe-card" />
          <IconDiamond className="w-8 h-8 text-[#9954d2]/40 mx-auto mb-5 relative z-10" />
          <p className="font-display text-xl sm:text-2xl text-white leading-relaxed relative z-10 text-center">
            &ldquo;DATA-DRIVEN TRAINING. ELITE INSTRUCTION. EVERY ATHLETE LEAVES BETTER THAN THEY ARRIVED.&rdquo;
          </p>
          <div className="divider-glow max-w-[80px] mx-auto mt-7 relative z-10" />
          <div className="mt-8 relative z-10 text-center">
            <Link href="/book" className="btn-gold px-8 py-3.5 rounded-full text-sm tracking-widest font-black inline-block">
              BOOK A SESSION
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
