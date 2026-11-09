"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Shown when a page breaks. Errors thrown on the server already reached the
 * admins (instrumentation.ts) and arrive here with a digest; a crash in the
 * browser has none, so report those.
 */
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (error.digest) return;
    fetch("/api/report-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 8).join("\n"),
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [error]);

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-md mx-auto px-6 py-24 text-center">
        <p className="section-label mb-3">SOMETHING WENT WRONG</p>
        <h1 className="font-display text-4xl sm:text-5xl text-white leading-none mb-5">
          THAT DIDN&rsquo;T LOAD
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          We&rsquo;ve been told about it. Try again, and if it keeps happening, email{" "}
          <a href="mailto:support@diamond9athletics.com" className="text-[#b07adf] hover:underline">
            support@diamond9athletics.com
          </a>
          .
        </p>
        <div className="flex items-center justify-center gap-5">
          <button
            onClick={() => (error.digest ? window.location.reload() : reset())}
            className="btn-gold px-7 py-3 rounded-full text-[11px] tracking-widest font-black"
          >
            TRY AGAIN
          </button>
          <Link href="/" className="text-zinc-400 hover:text-white text-[11px] tracking-widest font-bold">
            HOME
          </Link>
        </div>
      </section>
    </main>
  );
}
