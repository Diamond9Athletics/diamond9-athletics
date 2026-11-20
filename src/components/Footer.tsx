import Link from "next/link";
import { BUILD_VERSION } from "./Navbar";
import { img, STORE_URL } from "@/lib/config";

const LINK = "block text-zinc-400 text-sm hover:text-white transition-colors";
const HEADING = "text-zinc-500 text-[11px] font-medium tracking-[0.14em] uppercase mb-4";

export default function Footer() {
  return (
    <footer className="bg-[#0a090d] border-t border-white/[0.06]">
      {/* Closing call to action */}
      <div className="max-w-7xl mx-auto px-6 pt-16 sm:pt-20 pb-14 sm:pb-16 border-b border-white/[0.06]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.02] text-white">
            Ready to train?
            <span className="block text-[#b48ae6]">Book your next session.</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/book" className="btn-gold inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm">
              Book now <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/pitching-plans" className="btn-outline inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm">
              View plans <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <img src={img("/images/d9-wordmark.png")} alt="Diamond Nine Athletics" className="h-12 w-auto mb-5" />
            <p className="text-zinc-500 text-sm leading-relaxed max-w-[260px]">
              Elite baseball training powered by Rapsodo data. Real trainers. Real results.
            </p>
          </div>

          <div>
            <p className={HEADING}>Training</p>
            <div className="space-y-2.5">
              <Link href="/pitching-plans" className={LINK}>Pitching plans</Link>
              <Link href="/hitting-plans" className={LINK}>Hitting plans</Link>
              <Link href="/book" className={LINK}>Book a session</Link>
              <Link href="/faq" className={LINK}>FAQ</Link>
            </div>
          </div>

          <div>
            <p className={HEADING}>Company</p>
            <div className="space-y-2.5">
              <Link href="/app" className={LINK}>D9 App</Link>
              <Link href="/about" className={LINK}>About</Link>
              <a href={STORE_URL} target="_blank" rel="noopener noreferrer" className={LINK}>Shop</a>
              <Link href="/contact" className={LINK}>Contact</Link>
              <Link href="/support" className={LINK}>App support</Link>
            </div>
          </div>

          <div>
            <p className={HEADING}>More</p>
            <div className="space-y-2.5">
              <a href="https://instagram.com/diamond9atx" target="_blank" rel="noopener noreferrer" className={LINK}>
                Instagram
              </a>
              <Link href="/privacy" className={LINK}>Privacy policy</Link>
              <Link href="/terms" className={LINK}>Terms of service</Link>
              <Link href="/waiver" className={LINK}>Participant agreement</Link>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-zinc-500 text-xs">© 2026 Diamond Nine Athletics. All rights reserved.</p>
          <span className="font-mono text-zinc-600 text-xs">{BUILD_VERSION}</span>
        </div>
      </div>
    </footer>
  );
}
