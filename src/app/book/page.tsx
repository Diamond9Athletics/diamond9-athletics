import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a Session",
  description:
    "Book pitching or hitting sessions with Diamond Nine Athletics. Buy a package, use credits to schedule without paying again.",
};

export default async function BookV2() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/book/dashboard");
  }

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(153,84,210,0.07)_0%,transparent_100%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ NEW BOOKING SYSTEM</span>
          <h1 className="font-display leading-none">
            <span className="text-white text-6xl sm:text-8xl lg:text-9xl block">BOOK A</span>
            <span className="gradient-text text-glow text-6xl sm:text-8xl lg:text-9xl block">SESSION</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-6 mb-5" />
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Buy a package once, then use credits to book sessions without paying again.
          </p>
          <div className="flex flex-row gap-3 justify-center flex-wrap">
            <Link
              href="/book/signup"
              className="btn-gold px-8 py-4 text-sm rounded-full inline-block font-black tracking-widest"
            >
              CREATE ACCOUNT
            </Link>
            <Link
              href="/book/login"
              className="btn-outline px-8 py-4 text-sm rounded-full inline-block tracking-widest"
            >
              SIGN IN
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
