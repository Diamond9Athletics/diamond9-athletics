import type { Metadata } from "next";
import Link from "next/link";
import { img } from "@/lib/config";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Turner Olson",
  description:
    "Hitting Trainer Turner Olson: swing mechanics, bat speed, and consistent contact at Diamond Nine Athletics in Austin, TX.",
};

/** Turner's playing and coaching background. The section shows up once
 *  there's something in this list. */
const credentials: string[] = [];

const focus = [
  {
    num: "#1",
    title: "Bat speed",
    desc: "More bat speed and rotational power, built from the ground up with lower-half sequencing that carries into the swing.",
  },
  {
    num: "#2",
    title: "Consistent contact",
    desc: "A clean swing path and barrel control, so hard contact shows up more often instead of once in a while.",
  },
  {
    num: "#3",
    title: "A game-ready swing",
    desc: "Timing, pitch recognition, and video breakdown to build a swing that's repeatable and holds up against live pitching.",
  },
];

export default function TurnerOlsonBio() {
  return (
    <main className="pt-16 bg-[#0d0c11]">
      <PageHero
        badge="HITTING TRAINER"
        title="Turner"
        accent="Olson"
      />

      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] h-80 lg:h-[480px]">
            <img src={img("/images/turner-olson.jpg")} alt="Turner Olson at the plate" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
          </div>
          <div>
            <p className="section-label mb-3">HITTING TRAINER</p>
            <h2 className="font-display text-4xl text-white mb-4">Turner Olson</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Swing-mechanics specialist focused on bat speed, contact consistency, and a
              repeatable, game-ready swing. Every hitting session is one-on-one.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Swing Mechanics", "Bat Speed", "Pitch Recognition", "Video Breakdown", "Lower-Half Sequencing", "Barrel Control"].map((s) => (
                <span key={s} className="text-xs text-zinc-300 bg-white/[0.03] border border-white/10 px-3 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="text-center mb-12">
          <p className="section-label mb-3">THE APPROACH</p>
          <h2 className="font-display text-4xl sm:text-5xl text-white">What we <span className="gradient-text">work on</span></h2>
          <div className="divider-glow max-w-[100px] mx-auto mt-5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {focus.map((f) => (
            <div key={f.num} className="card-modern rounded-2xl p-7 card-lift">
              <div className="step-num mb-3">{f.num}</div>
              <h3 className="font-display text-2xl text-white mb-3">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`max-w-5xl mx-auto px-6 pb-20 ${credentials.length ? "border-t border-white/[0.06] pt-16" : ""}`}>
        {credentials.length > 0 && (
          <>
            <div className="text-center mb-10">
              <p className="section-label mb-3">RESUME</p>
              <h2 className="font-display text-4xl sm:text-5xl text-white">Playing <span className="gradient-text">&amp; coaching</span></h2>
            </div>
            <div className="card-modern-amber rounded-2xl p-8 sm:p-12">
              <ul className="space-y-3">
                {credentials.map((c) => (
                  <li key={c} className="flex items-center gap-3 text-zinc-300 text-sm">
                    <svg className="w-4 h-4 text-[#a97ce2] shrink-0" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5l3.5 3.5 7.5-8" />
                    </svg>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        <div className={`${credentials.length ? "mt-10 " : ""}text-center flex flex-wrap gap-3 justify-center`}>
          <Link href="/hitting-plans" className="btn-gold inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm">See hitting plans <span aria-hidden="true">↗</span></Link>
          <Link href="/about" className="btn-outline inline-flex items-center px-7 py-3 rounded-full text-sm">Meet the team</Link>
        </div>
      </section>
    </main>
  );
}
