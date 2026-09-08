import type { Metadata } from "next";
import Link from "next/link";
import { img } from "@/lib/config";

const STORE_URL = "https://shop.flyp.space/diamond9ath";

export const metadata: Metadata = {
  title: "Shop | Diamond Nine Athletics",
  description: "Official Diamond Nine Athletics merchandise.",
};

const products = [
  { name: "D9 Logo Hat",        price: "$35", tag: "NEW",     accent: "#9954d2", icon: "🧢" },
  { name: "Training Tee",       price: "$30", tag: null,      accent: "#d4d4d8", icon: "👕" },
  { name: "Performance Hoodie", price: "$65", tag: "POPULAR", accent: "#9954d2", icon: "🧥" },
  { name: "D9 Snapback",        price: "$40", tag: null,      accent: "#ffffff", icon: "🧢" },
  { name: "Bucket Hat",         price: "$32", tag: null,      accent: "#9954d2", icon: "🎩" },
  { name: "Long Sleeve Tee",    price: "$35", tag: null,      accent: "#d4d4d8", icon: "👔" },
];

export default function Shop() {
  return (
    <main className="pt-24 bg-[#040200]">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${img("/images/hero-allstar.jpg")}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(153,84,210,0.07)_0%,transparent_100%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ OFFICIAL GEAR</span>
          <h1 className="font-display leading-none">
            <span className="text-white text-6xl sm:text-8xl lg:text-9xl block">D9</span>
            <span className="gradient-text text-glow text-6xl sm:text-8xl lg:text-9xl block">MERCH</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-6 mb-4" />
          <p className="text-zinc-400 text-sm">Wear the brand. Rep the grind.</p>
        </div>
      </section>

      {/* ── Drop Banner ───────────────────────────────────────── */}
      <div className="bg-[#030200] border-y border-[#9954d2]/15 py-4 overflow-hidden">
        <div className="marquee-container">
          <div className="animate-marquee flex items-center">
            {Array(8).fill(0).map((_, i) => (
              <span key={i} className="inline-block px-8 marquee-led-text text-[0.65rem]">
                ⚾ FULL STORE LAUNCHING SOON &nbsp;·&nbsp; LIMITED DROPS &nbsp;·&nbsp; JOIN THE LIST
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Products ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-12 pb-24">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {products.map((product, i) => (
            <a key={i} href={STORE_URL} target="_blank" rel="noopener noreferrer" className="card-modern rounded-2xl overflow-hidden card-lift card-shine group cursor-pointer">
              {/* Product visual */}
              <div className="relative aspect-[4/3] flex items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-900 to-[#050202]">
                <div className="absolute inset-0 grid-bg opacity-10" />
                {/* D9 giant watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <span className="font-display text-[6rem] sm:text-[8rem] text-white/[0.04]">D9</span>
                </div>
                {/* Icon */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-300"
                    style={{ background: `${product.accent}12`, border: `1px solid ${product.accent}22` }}
                  >
                    {product.icon}
                  </div>
                  <div className="w-8 h-0.5 rounded-full opacity-40 mt-1" style={{ background: product.accent }} />
                </div>
                {product.tag && (
                  <div className="absolute top-3 right-3">
                    <span className="badge-amber text-[9px]">{product.tag}</span>
                  </div>
                )}
                {/* Radial hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${product.accent}0a, transparent)` }}
                />
              </div>
              {/* Product info */}
              <div className="p-4 sm:p-5">
                <h3 className="text-white font-semibold text-sm mb-0.5">{product.name}</h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="gradient-text font-black font-display text-2xl">{product.price}</span>
                  <span className="btn-outline text-xs px-4 py-2 rounded-full">SHOP →</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Info strip */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-zinc-900/50 border border-zinc-800/50 flex-wrap justify-center">
            <span className="text-zinc-600 text-xs tracking-wider">FREE SHIPPING OVER $75</span>
            <span className="text-zinc-700 hidden sm:inline">·</span>
            <span className="text-zinc-600 text-xs tracking-wider">SECURE CHECKOUT</span>
            <span className="text-zinc-700 hidden sm:inline">·</span>
            <span className="text-zinc-600 text-xs tracking-wider">OFFICIAL D9 GEAR</span>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-zinc-500 text-sm mb-5">Browse the full store on our official shop.</p>
          <a href={STORE_URL} target="_blank" rel="noopener noreferrer" className="btn-gold px-8 py-3.5 rounded-full text-sm tracking-widest inline-block">VISIT FULL STORE →</a>
        </div>
      </section>

    </main>
  );
}
