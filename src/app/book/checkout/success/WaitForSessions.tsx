"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Checks every 2 seconds, for about 30 seconds. */
const EVERY_MS = 2000;
const TRIES = 15;

/**
 * Stripe tells the site about a payment a few seconds after the buyer
 * lands here. Until the sessions show up, re-check the page instead of
 * sending them to book with nothing to book with.
 */
export function WaitForSessions() {
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (tries >= TRIES) return;
    const timer = window.setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, EVERY_MS);
    return () => window.clearTimeout(timer);
  }, [tries, router]);

  if (tries >= TRIES) {
    return (
      <div className="space-y-4">
        <p className="text-zinc-300 text-sm leading-relaxed">
          This is taking longer than usual. Your sessions will be on your account within a minute
          or two.
        </p>
        <Link
          href="/book/dashboard"
          className="btn-gold inline-block px-10 py-4 rounded-full text-sm tracking-widest font-black"
        >
          Go to my account
        </Link>
      </div>
    );
  }

  return (
    <p className="text-zinc-300 text-sm flex items-center justify-center gap-3" role="status">
      <span
        aria-hidden="true"
        className="w-4 h-4 rounded-full border-2 border-[#9954d2]/30 border-t-[#9954d2] animate-spin"
      />
      Setting up your sessions…
    </p>
  );
}
