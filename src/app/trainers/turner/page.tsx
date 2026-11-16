import type { Metadata } from "next";
import Link from "next/link";
import { img } from "@/lib/config";

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
    title: "BAT SPEED",
    desc: "More bat speed and rotational power, built from the ground up with lower-half sequencing that carries into the swing.",
  },
  {
    num: "#2",
    title: "CONSISTENT CONTACT",
    desc: "A clean swing path and barrel control, so hard contact shows up more often instead of once in a while.",
  },
  {
    num: "#3",
    title: "A GAME-READY SWING",
    desc: "Timing, pitch recognition, and video breakdown to build a swing that's repeatable and holds up against live pitching.",
  },
];

export default function TurnerOlsonBio() {
  return (
    <main className="pt-24 bg-[#040200]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${img("/images/batting-cages.jpg")}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <span className="badge-amber mb-5 inline-flex">HITTING TRAINER</span>
          <h1 className="font-display leading-none">
            <span className="text-white text-5xl sm:text-7xl lg:text-8xl block">TURNER</span>
            <span className="gradient-text text-glow text-5xl sm:text-7xl lg:text-8xl block">OLSON</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-6 mb-4" />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="relative rounded-2xl overflow-hidden card-lift h-80 lg:h-[480px]">
            <img src={img("/images/turner-olson.jpg")} alt="Turner Olson at the plate" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
          </div>
          <div>
            <p className="section-label mb-3">HITTING TRAINER</p>
            <h2 className="font-display text-4xl text-white mb-4">TURNER OLSON</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Swing-mechanics specialist focused on bat speed, contact consistency, and a
              repeatable, game-ready swing. Every hitting session is one-on-one.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Swing Mechanics", "Bat Speed", "Pitch Recognition", "Video Breakdown", "Lower-Half Sequencing", "Barrel Control"].map((s) => (
                <span key={s} className="text-[10px] text-[#9954d2]/70 bg-[#9954d2]/8 border border-[#9954d2]/15 px-3 py-1 rounded-full tracking-wide">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="text-center mb-12">
          <p className="section-label mb-3">THE APPROACH</p>
          <h2 className="font-display text-4xl sm:text-5xl text-white">WHAT WE <span className="gradient-text">WORK ON</span></h2>
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

      <section className={`max-w-5xl mx-auto px-6 pb-20 ${credentials.length ? "border-t border-zinc-800/40 pt-16" : ""}`}>
        {credentials.length > 0 && (
          <>
            <div className="text-center mb-10">
              <p className="section-label mb-3">RESUME</p>
              <h2 className="font-display text-4xl sm:text-5xl text-white">PLAYING <span className="gradient-text">&amp; COACHING</span></h2>
            </div>
            <div className="card-modern-amber rounded-2xl p-8 sm:p-12">
              <ul className="space-y-3">
                {credentials.map((c) => (
                  <li key={c} className="flex items-center gap-3 text-zinc-300 text-sm">
                    <svg className="w-3.5 h-3.5 text-[#9954d2] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        <div className={`${credentials.length ? "mt-10 " : ""}text-center flex flex-wrap gap-3 justify-center`}>
          <Link href="/hitting-plans" className="btn-gold px-10 py-4 rounded-full text-sm tracking-widest font-black inline-block">SEE HITTING PLANS</Link>
          <Link href="/about" className="btn-outline px-8 py-4 rounded-full text-sm tracking-widest inline-block">MEET THE TEAM</Link>
        </div>
      </section>
    </main>
  );
}
