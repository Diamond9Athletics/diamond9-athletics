import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "App Support | Diamond Nine Athletics",
  description: "Support and help for the Diamond Nine Athletics mobile app.",
};

const EMAIL = "support@diamond9athletics.com";

const topics = [
  {
    title: "ACCOUNT & LOGIN",
    desc: "Trouble creating an account, signing in, or resetting your password.",
  },
  {
    title: "TRAINING DATA",
    desc: "Sessions, metrics, or videos not saving or displaying correctly.",
  },
  {
    title: "BILLING & PLANS",
    desc: "Questions about subscriptions, receipts, or upgrading your plan.",
  },
  {
    title: "BUG REPORTS",
    desc: "Something not working as expected — include device + steps to reproduce.",
  },
  {
    title: "FEATURE REQUESTS",
    desc: "Have an idea that would make the app better? We&rsquo;d love to hear it.",
  },
  {
    title: "DATA & PRIVACY",
    desc: "Requests to export or delete your data, or questions about our privacy practices.",
  },
];

export default function Support() {
  return (
    <main className="pt-24 bg-[#040200]">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(153,84,210,0.06)_0%,transparent_100%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ WE&rsquo;RE HERE TO HELP</span>
          <h1 className="font-display text-5xl sm:text-7xl leading-none">
            <span className="text-white">APP</span>
            <span className="block gradient-text">SUPPORT</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-5" />
          <p className="text-zinc-400 text-sm mt-5">
            Questions about the Diamond Nine Athletics app? Reach out anytime.
          </p>
        </div>
      </section>

      {/* Contact card */}
      <section className="max-w-3xl mx-auto px-6 pb-6">
        <div className="card-modern-amber rounded-2xl p-7 sm:p-10 text-center">
          <p className="section-label mb-3">GET IN TOUCH</p>
          <h2 className="font-display text-3xl sm:text-4xl text-white mb-2">EMAIL US</h2>
          <p className="text-zinc-400 text-sm mb-6">
            We typically respond within 1–2 business days.
          </p>
          <a
            href={`mailto:${EMAIL}?subject=App%20Support`}
            className="btn-gold px-10 py-4 rounded-full text-sm tracking-widest font-black inline-block break-all"
          >
            {EMAIL}
          </a>
        </div>
      </section>

      {/* Topics */}
      <section className="max-w-3xl mx-auto px-6 pb-24 pt-10">
        <div className="text-center mb-8">
          <p className="section-label mb-3">WHAT CAN WE HELP WITH?</p>
          <h2 className="font-display text-3xl sm:text-4xl text-white">COMMON <span className="gradient-text">TOPICS</span></h2>
          <div className="divider-glow max-w-[100px] mx-auto mt-5" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topics.map((t) => (
            <div key={t.title} className="card-modern rounded-2xl p-6">
              <p className="text-[#b07adf] text-[10px] tracking-widest font-bold mb-2">{t.title}</p>
              <p className="text-zinc-400 text-sm leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 text-zinc-500 text-xs">
          Looking for our privacy practices? See our{" "}
          <Link href="/privacy" className="text-[#b07adf] hover:underline">Privacy Policy</Link>.
        </div>
      </section>
    </main>
  );
}
