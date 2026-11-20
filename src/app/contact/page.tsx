"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";

// No prices here — they live on the plan pages, so this list can't go stale.
const plans = [
  "Diamond Membership (pitching)",
  "Gold Pitching Plan",
  "Single Pitching Session",
  "Diamond Hitting Plan",
  "Gold Hitting Plan",
  "Single Hitting Session",
  "Not sure yet",
];

// Drawn icons, matching the rest of the site.
const CONTACT_ITEMS: { label: string; value: string; href?: string; icon: React.ReactNode }[] = [
  {
    label: "INSTAGRAM",
    value: "@diamond9atx",
    href: "https://instagram.com/diamond9atx",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    label: "EMAIL",
    value: "info@diamond9athletics.com",
    href: "mailto:info@diamond9athletics.com",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.5 6.5 8.5 6 8.5-6" />
      </>
    ),
  },
  {
    label: "LOCATION",
    value: "Austin, Texas",
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
        <circle cx="12" cy="10" r="2.3" />
      </>
    ),
  },
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", plan: "", message: "", honey: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // When the form appeared — bots fill it in instantly.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, startedAt: startedAt.current }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setSending(false);
    if (!res?.ok) {
      setError(json?.error ?? "Your message didn't send. Check your connection and try again.");
      return;
    }
    setSubmitted(true);
  }

  return (
    <main className="pt-16 bg-[#0d0c11]">
      {/* Hero */}
      <PageHero
        badge="◆ REACH OUT"
        title="Get in"
        accent="touch"
      />

      {/* Form + Info */}
      <section className="max-w-5xl mx-auto px-6 py-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3 card-modern rounded-2xl p-7 sm:p-9">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#b07adf]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                </div>
                <h3 className="font-display text-3xl text-white">Message sent</h3>
                <p className="text-zinc-500 text-sm">We&apos;ll be in touch shortly.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                {/* Honeypot — invisible to people, tempting to bots. */}
                <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
                  <label htmlFor="company">Company (leave blank)</label>
                  <input id="company" type="text" tabIndex={-1} autoComplete="off" value={form.honey} onChange={set("honey")} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-500 text-xs tracking-wider mb-1.5">NAME</label>
                    <input type="text" required autoComplete="name" value={form.name} onChange={set("name")} placeholder="Your name" className="w-full bg-white/[0.03] border border-white/10 focus:border-[#a97ce2]/60 text-white text-sm px-4 py-3 rounded-xl outline-none transition-all placeholder:text-zinc-600" />
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-xs tracking-wider mb-1.5">EMAIL</label>
                    <input type="email" required autoComplete="email" value={form.email} onChange={set("email")} placeholder="your@email.com" className="w-full bg-white/[0.03] border border-white/10 focus:border-[#a97ce2]/60 text-white text-sm px-4 py-3 rounded-xl outline-none transition-all placeholder:text-zinc-600" />
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-500 text-xs tracking-wider mb-1.5">PHONE</label>
                  <input type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} placeholder="(555) 000-0000" className="w-full bg-white/[0.03] border border-white/10 focus:border-[#a97ce2]/60 text-white text-sm px-4 py-3 rounded-xl outline-none transition-all placeholder:text-zinc-600" />
                </div>
                <div>
                  <label className="block text-zinc-500 text-xs tracking-wider mb-1.5">PLAN INTEREST</label>
                  <select value={form.plan} onChange={set("plan")} className="w-full bg-white/[0.03] border border-white/10 focus:border-[#a97ce2]/60 text-white text-sm px-4 py-3 rounded-xl outline-none transition-all">
                    <option value="">Select a plan...</option>
                    {plans.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 text-xs tracking-wider mb-1.5">MESSAGE</label>
                  <textarea rows={4} value={form.message} onChange={set("message")} placeholder="Tell us about your goals..." className="w-full bg-white/[0.03] border border-white/10 focus:border-[#a97ce2]/60 text-white text-sm px-4 py-3 rounded-xl outline-none transition-all placeholder:text-zinc-600 resize-none" />
                </div>
                {error && (
                  <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>
                )}
                <button type="submit" disabled={sending} className="btn-gold w-full py-3.5 rounded-full text-sm disabled:opacity-60">
                  {sending ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card-modern rounded-2xl p-6 space-y-5">
              {CONTACT_ITEMS.map((item) => {
                const body = (
                  <>
                    <div className="icon-box">
                      <svg className="w-5 h-5 text-[#b07adf]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                        {item.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs tracking-widest mb-0.5">{item.label}</p>
                      <p className="text-white text-sm">{item.value}</p>
                    </div>
                  </>
                );
                return item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    {...(item.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                  >
                    {body}
                  </a>
                ) : (
                  <div key={item.label} className="flex items-center gap-4">
                    {body}
                  </div>
                );
              })}
            </div>
            <div className="card-modern-amber rounded-2xl p-6">
              <p className="section-label mb-2">TRAINING HOURS</p>
              <p className="text-zinc-300 text-sm leading-relaxed">
                By appointment.{" "}
                <Link href="/book" className="text-[#b07adf] hover:underline">
                  Book any open time online →
                </Link>
              </p>
            </div>
            <Link href="/faq" className="card-modern rounded-2xl p-6 card-lift block group">
              <p className="section-label mb-2">QUICK ANSWERS</p>
              <p className="text-zinc-400 text-sm">
                Booking, cancelling, plans and memberships.{" "}
                <span className="text-[#b07adf] group-hover:underline">Read the FAQ →</span>
              </p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
