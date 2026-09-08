import type { Metadata } from "next";
import Link from "next/link";
import { img } from "@/lib/config";
import { IconBaseball, IconGlove, IconDiamond } from "@/components/BaseballIcons";

export const metadata: Metadata = {
  title: "About | Diamond Nine Athletics",
  description: "Meet the elite trainers behind Diamond Nine Athletics.",
};

const trainers = [
  {
    name: "WES GAFFORD",
    title: "HEAD TRAINER",
    jersey: "1",
    bio: "Rapsodo-certified pitching specialist with a data-first approach to velocity and command development.",
    specialties: ["Rapsodo Analytics", "Velocity Development", "Arm Health", "Recruiting Prep"],
    icon: <IconBaseball className="w-10 h-10 text-[#b07adf]" />,
  },
  {
    name: "TURNER OLSON",
    title: "HITTING TRAINER",
    jersey: "9",
    bio: "Swing-mechanics specialist focused on bat speed, contact consistency, and a repeatable, game-ready swing.",
    specialties: ["Swing Mechanics", "Bat Speed", "Pitch Recognition", "Video Breakdown"],
    icon: <IconGlove className="w-10 h-10 text-[#b07adf]" />,
  },
];

export default function About() {
  return (
    <main className="pt-24 bg-[#040200]">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${img("/images/hero-stadium-vintage.jpg")}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(153,84,210,0.07)_0%,transparent_100%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ MEET THE TEAM</span>
          <h1 className="font-display leading-none">
            <span className="text-white text-6xl sm:text-8xl lg:text-9xl block">THE</span>
            <span className="gradient-text text-glow text-6xl sm:text-8xl lg:text-9xl block">TRAINERS</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-6 mb-4" />
          <p className="text-zinc-400 text-sm">Built on data. Defined by results.</p>
        </div>
      </section>

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
                      <span key={j} className="text-[10px] text-[#9954d2]/70 bg-[#9954d2]/8 border border-[#9954d2]/15 px-3 py-1 rounded-full tracking-wide">{s}</span>
                    ))}
                  </div>
                </div>
              </>
            );

            if (i === 0) {
              return (
                <Link key={i} href="/trainers/wes" className="card-modern rounded-2xl overflow-hidden card-lift group block">
                  {card}
                </Link>
              );
            }

            return (
              <div key={i} className="card-modern rounded-2xl overflow-hidden card-lift group">
                {card}
              </div>
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
          <div className="aspect-video w-full">
            <iframe
              src="https://drive.google.com/file/d/1aGdvsoJLRG3xG-LepY_DHETKaGb87hH1/preview"
              className="w-full h-full"
              allow="autoplay"
              allowFullScreen
            />
          </div>
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
          <div className="aspect-video w-full">
            <iframe
              src="https://drive.google.com/file/d/1Py9YLc1LKHXo5QuFh4RByXdiXNZYkd0U/preview"
              className="w-full h-full"
              allow="autoplay"
              allowFullScreen
            />
          </div>
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
            <Link href="/appointments" className="btn-gold px-8 py-3.5 rounded-full text-sm tracking-widest font-black inline-block">
              BOOK A SESSION
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
