import Link from "next/link";
import { IconBaseball } from "@/components/BaseballIcons";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0d0c11] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">

      {/* Background orb */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(153,84,210,0.10)_0%,transparent_100%)]" />


      <div className="relative z-10 max-w-md mx-auto">
        {/* Badge */}
        <span className="badge-amber mb-8 inline-flex gap-1.5 items-center">
          <IconBaseball className="w-3 h-3" /> FOUL BALL
        </span>

        {/* Heading */}
        <h1 className="font-display leading-none mb-4">
          <span className="text-white text-6xl sm:text-8xl block">Out of</span>
          <span className="gradient-text text-6xl sm:text-8xl block">bounds.</span>
        </h1>

        <p className="text-zinc-400 text-base mb-10 leading-relaxed">
          That page doesn&apos;t exist. Let&apos;s get you back in the box.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/" className="btn-gold inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm">
            Go home <span aria-hidden="true">↗</span>
          </Link>
          <Link href="/pitching-plans" className="btn-outline inline-flex items-center px-7 py-3 rounded-full text-sm">
            View plans
          </Link>
        </div>


      </div>

    </main>
  );
}
