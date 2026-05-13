import Link from "next/link";
import { BUILD_VERSION } from "./Navbar";
import { img } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="bg-[#020101] border-t border-zinc-800/50 relative overflow-hidden">
      {/* Baseball stitching SVG top decoration */}
      <svg className="absolute top-0 left-0 right-0 w-full opacity-[0.07] pointer-events-none" height="40" viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none">
        <path d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20" stroke="#9954d2" strokeWidth="1.5" fill="none" strokeDasharray="6 6"/>
      </svg>

      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">

          {/* Brand */}
          <div className="col-span-2">
            <div className="mb-4">
              <img
                src={img("/images/d9-logo.png")}
                alt="Diamond Nine Athletics"
                className="h-48 w-auto mix-blend-screen"
              />
            </div>
            <p className="text-zinc-600 text-xs leading-relaxed mb-5 max-w-[220px]">
              Elite baseball training powered by Rapsodo data. Real trainers. Real results.
            </p>

          </div>

          {/* Training */}
          <div>
            <p className="text-zinc-500 text-[10px] tracking-widest mb-4 font-bold">TRAINING</p>
            <div className="space-y-2.5">
              <Link href="/pitching-plans" className="block text-zinc-400 text-sm hover:text-[#b07adf] transition-colors">Pitching Plans</Link>
              <Link href="/hitting-plans"  className="block text-zinc-400 text-sm hover:text-[#b07adf] transition-colors">Hitting Plans</Link>
              <Link href="/appointments"   className="block text-zinc-400 text-sm hover:text-[#b07adf] transition-colors">Book Session</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <p className="text-zinc-500 text-[10px] tracking-widest mb-4 font-bold">COMPANY</p>
            <div className="space-y-2.5">
              <Link href="/about"   className="block text-zinc-400 text-sm hover:text-[#b07adf] transition-colors">About</Link>
              <Link href="/shop"    className="block text-zinc-400 text-sm hover:text-[#b07adf] transition-colors">Shop</Link>
              <Link href="/contact" className="block text-zinc-400 text-sm hover:text-[#b07adf] transition-colors">Contact</Link>
              <Link href="/support" className="block text-zinc-400 text-sm hover:text-[#b07adf] transition-colors">App Support</Link>
              <Link href="/privacy" className="block text-zinc-400 text-sm hover:text-[#b07adf] transition-colors">Privacy Policy</Link>
              <Link href="/terms"   className="block text-zinc-400 text-sm hover:text-[#b07adf] transition-colors">Terms of Service</Link>
            </div>
          </div>

          {/* Connect */}
          <div>
            <p className="text-zinc-500 text-[10px] tracking-widest mb-4 font-bold">CONNECT</p>
            <div className="space-y-3">
              <a href="https://instagram.com/diamond9atx" target="_blank" rel="noopener noreferrer" className="block text-zinc-400 text-sm hover:text-[#b07adf] transition-colors">
                Instagram
              </a>
            </div>
            <div className="mt-6">
              <Link href="/appointments" className="btn-gold px-5 py-2.5 rounded-full text-xs tracking-widest inline-block font-black">
                BOOK NOW
              </Link>
            </div>
          </div>

        </div>

        <div className="divider-glow mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-zinc-700 text-xs">© 2025 Diamond Nine Athletics. All rights reserved.</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="pitch-tag pitch-tag-fb" style={{fontSize:"0.55rem"}}>4-Seam</span>
            <span className="pitch-tag pitch-tag-sl" style={{fontSize:"0.55rem"}}>Slider</span>
            <span className="pitch-tag pitch-tag-cb" style={{fontSize:"0.55rem"}}>Curve</span>
            <span className="font-mono text-zinc-700 text-[10px] ml-1">{BUILD_VERSION}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
