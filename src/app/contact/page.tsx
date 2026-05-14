"use client";
import { useState } from "react";
import { img } from "@/lib/config";

const plans = ["Diamond Plan ($300)","Gold Plan ($275)","Single Session ($100)","Half Session ($50)","College Summer ($1,100)","Hitting Plans"];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <main className="pt-24 bg-[#040200]">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${img("/images/hero-contact.jpg")}')` }} />
        <div className="absolute inset-0 bg-zinc-950/60" />
        <div className="absolute inset-0 grid-bg opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(153,84,210,0.06)_0%,transparent_100%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ REACH OUT</span>
          <h1 className="font-display text-6xl sm:text-8xl lg:text-9xl leading-none">
            <span className="text-white">GET IN</span>
            <span className="block gradient-text">TOUCH</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-5" />
        </div>
      </section>

      {/* Form + Info */}
      <section className="max-w-5xl mx-auto px-6 py-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3 card-modern rounded-2xl p-7 sm:p-9">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#9954d2]/10 border border-[#9954d2]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#b07adf]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                </div>
                <h3 className="font-display text-3xl text-white">MESSAGE SENT</h3>
                <p className="text-zinc-500 text-sm">We&apos;ll be in touch shortly.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-500 text-xs tracking-wider mb-1.5">NAME</label>
                    <input type="text" required placeholder="Your name" className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#9954d2]/40 text-white text-sm px-4 py-3 rounded-xl outline-none transition-all placeholder:text-zinc-700" />
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-xs tracking-wider mb-1.5">EMAIL</label>
                    <input type="email" required placeholder="your@email.com" className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#9954d2]/40 text-white text-sm px-4 py-3 rounded-xl outline-none transition-all placeholder:text-zinc-700" />
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-500 text-xs tracking-wider mb-1.5">PHONE</label>
                  <input type="tel" placeholder="(555) 000-0000" className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#9954d2]/40 text-white text-sm px-4 py-3 rounded-xl outline-none transition-all placeholder:text-zinc-700" />
                </div>
                <div>
                  <label className="block text-zinc-500 text-xs tracking-wider mb-1.5">PLAN INTEREST</label>
                  <select className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#9954d2]/40 text-white text-sm px-4 py-3 rounded-xl outline-none transition-all">
                    <option value="">Select a plan...</option>
                    {plans.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 text-xs tracking-wider mb-1.5">MESSAGE</label>
                  <textarea rows={4} placeholder="Tell us about your goals..." className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#9954d2]/40 text-white text-sm px-4 py-3 rounded-xl outline-none transition-all placeholder:text-zinc-700 resize-none" />
                </div>
                <button type="submit" className="btn-gold w-full py-4 rounded-full text-sm tracking-wider font-bold">
                  SEND MESSAGE
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card-modern rounded-2xl p-6 space-y-5">
              {[
                { label: "INSTAGRAM", value: "@diamond9atx", icon: "📸" },
                { label: "EMAIL", value: "info@diamond9athletics.com", icon: "✉️" },
                { label: "LOCATION", value: "Austin, Texas", icon: "📍" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="icon-box text-lg">{item.icon}</div>
                  <div>
                    <p className="text-zinc-600 text-[10px] tracking-widest mb-0.5">{item.label}</p>
                    <p className="text-white text-sm">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="card-modern-amber rounded-2xl p-6">
              <p className="section-label mb-3">TRAINING HOURS</p>
              <div className="space-y-2">
                {[
                  ["Mon – Fri", "By appointment"],
                  ["Weekends", "By appointment"],
                ].map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-zinc-400">{day}</span>
                    <span className="text-[#b07adf]">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
