import type { Metadata } from "next";
import Link from "next/link";
import { img } from "@/lib/config";

export const metadata: Metadata = {
  title: "Wes Gafford | Diamond Nine Athletics",
  description: "Head Trainer Wes Gafford — Diamond Nine Athletics",
};

const credentials = [
  "Top 25 Pitcher USA (Perfect Game) 2018",
  "National Junior College South Central Region 1st Team 2020",
  "National Junior College ALL STAR 2020",
  "All American Pitcher 2022",
  "Regional Pitcher of the year 2022",
  "LSC Conference Pitcher of the year 2022",
  "2nd Team all LSC conference pitcher 2023",
  "2nd Team all region pitcher 2023",
  "Starting Pitcher Trenton Thunder 2023",
];

const goals = [
  {
    num: "#1",
    title: "THROW HARDER",
    desc: "Who doesn't like to throw hard? But how do we get there? Through Flexibility, Arm Speed, Scap Retraction, Rotational Velocity, and synced-up mechanics. Finding what your deficiency is the key.",
  },
  {
    num: "#2",
    title: "THROW LONGER",
    desc: "How do we throw longer? We throw more strikes and we have an arm that can handle a heavier load. If you want to stop getting pulled after 2 innings, we have to throw more strikes. Challenge the hitters more. THROW HARDER STRIKES.",
  },
  {
    num: "#3",
    title: "THROW HEALTHIER",
    desc: "When inexperienced pitchers try to throw harder, it can lead to injuries. Finding and correcting bio-mechanical issues puts your body in a better spot. Tommy John surgeries are on the rise. Bad mechanics mixed with trying to throw harder are the reason.",
  },
];

export default function WesGaffordBio() {
  return (
    <main className="pt-24 bg-[#040200]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${img("/images/hero-pitcher-night.jpg")}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <span className="badge-amber mb-5 inline-flex">HEAD TRAINER</span>
          <h1 className="font-display leading-none">
            <span className="text-white text-5xl sm:text-7xl lg:text-8xl block">WES</span>
            <span className="gradient-text text-glow text-5xl sm:text-7xl lg:text-8xl block">GAFFORD</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-6 mb-4" />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="relative rounded-2xl overflow-hidden card-lift h-80 lg:h-[480px]">
            <img src={img("/images/wes-gafford.jpg")} alt="Wes Gafford" className="w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
          </div>
          <div>
            <p className="section-label mb-3">HEAD TRAINER</p>
            <h2 className="font-display text-4xl text-white mb-4">WES GAFFORD</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              I strive for 3 main goals with every athlete I work with. My entire approach is built around helping you throw harder, longer, and healthier using real mechanics, real data, and real feedback.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Arm Speed", "Scap Retraction", "Rotational Velocity", "Mechanics", "Arm Care", "Recruiting Prep"].map((s) => (
                <span key={s} className="text-[10px] text-[#9954d2]/70 bg-[#9954d2]/8 border border-[#9954d2]/15 px-3 py-1 rounded-full tracking-wide">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="text-center mb-12">
          <p className="section-label mb-3">THE APPROACH</p>
          <h2 className="font-display text-4xl sm:text-5xl text-white">3 MAIN <span className="gradient-text">GOALS</span></h2>
          <div className="divider-glow max-w-[100px] mx-auto mt-5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {goals.map((g) => (
            <div key={g.num} className="card-modern rounded-2xl p-7 card-lift">
              <div className="step-num mb-3">{g.num}</div>
              <h3 className="font-display text-2xl text-white mb-3">{g.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20 border-t border-zinc-800/40 pt-16">
        <div className="text-center mb-10">
          <p className="section-label mb-3">RESUME</p>
          <h2 className="font-display text-4xl sm:text-5xl text-white">CREDENTIALS <span className="gradient-text">&amp; AWARDS</span></h2>
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
        <div className="mt-10 text-center flex flex-wrap gap-3 justify-center">
          <Link href="/appointments" className="btn-gold px-10 py-4 rounded-full text-sm tracking-widest font-black inline-block">BOOK A SESSION</Link>
          <Link href="/about" className="btn-outline px-8 py-4 rounded-full text-sm tracking-widest inline-block">MEET THE TEAM</Link>
        </div>
      </section>
    </main>
  );
}
