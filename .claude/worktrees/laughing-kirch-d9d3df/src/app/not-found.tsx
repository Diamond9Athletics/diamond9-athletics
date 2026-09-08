import Link from "next/link";
import { IconBaseball, IconDiamond } from "@/components/BaseballIcons";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#040200] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">

      {/* Background orb */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(153,84,210,0.05)_0%,transparent_100%)]" />

      {/* Giant 404 watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="font-display text-[22rem] sm:text-[28rem] text-white/[0.025] leading-none">404</span>
      </div>

      {/* Baseball stitching SVG */}
      <svg className="absolute bottom-0 left-0 right-0 w-full opacity-10 pointer-events-none" height="60" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
        <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,20 1440,30" stroke="#9954d2" strokeWidth="1" fill="none" strokeDasharray="6 6"/>
        <path d="M0,40 C360,70 720,10 1080,40 C1260,55 1380,30 1440,40" stroke="#9954d2" strokeWidth="1" fill="none" strokeDasharray="6 6"/>
      </svg>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Badge */}
        <span className="badge-amber mb-8 inline-flex gap-1.5 items-center">
          <IconBaseball className="w-3 h-3" /> FOUL BALL
        </span>

        {/* Heading */}
        <h1 className="font-display leading-none mb-4">
          <span className="text-white text-6xl sm:text-8xl block">OUT OF</span>
          <span className="gradient-text text-glow text-6xl sm:text-8xl block">BOUNDS</span>
        </h1>

        <p className="text-zinc-500 text-sm mb-10 leading-relaxed">
          That page doesn&apos;t exist. Let&apos;s get you back in the box.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/" className="btn-gold px-10 py-4 rounded-full text-sm tracking-widest font-black inline-block">
            GO HOME
          </Link>
          <Link href="/pitching-plans" className="btn-outline px-10 py-4 rounded-full text-sm tracking-widest inline-block">
            VIEW PLANS
          </Link>
        </div>

        {/* Divider + brand */}
        <div className="divider-glow max-w-[80px] mx-auto mt-12 mb-6" />
        <div className="flex items-center justify-center gap-2 text-zinc-700 text-xs tracking-widest">
          <IconDiamond className="w-3 h-3 text-[#9954d2]/40" />
          DIAMOND NINE ATHLETICS
        </div>
      </div>

    </main>
  );
}
