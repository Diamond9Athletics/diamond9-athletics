import Link from "next/link";

export const metadata = { title: "Payment Confirmed" };

export default function Success() {
  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-xl mx-auto px-6 py-24 text-center">
        <span className="badge-amber mb-5 inline-flex">◆ THANK YOU</span>
        <h1 className="font-display text-5xl sm:text-7xl text-white leading-none">
          PAYMENT
          <span className="block gradient-text">CONFIRMED</span>
        </h1>
        <div className="divider-glow max-w-[100px] mx-auto mt-5 mb-7" />
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          Your purchase is processing. Credits will appear on your dashboard within a few seconds.
        </p>
        <Link
          href="/book/dashboard"
          className="btn-gold px-10 py-4 rounded-full text-sm tracking-widest font-black inline-block"
        >
          GO TO DASHBOARD
        </Link>
      </section>
    </main>
  );
}
