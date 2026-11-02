"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function BuyRedirector({ slug }: { slug: string }) {
  const [error, setError] = useState<string | null>(null);
  // React runs effects twice in dev — don't open two checkouts.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.url) {
          setError(json.error ?? "Could not start checkout. Please try again.");
          return;
        }
        // replace, not assign — Back from Stripe returns to the plans page
        // instead of bouncing straight back into checkout.
        window.location.replace(json.url);
      } catch {
        setError("Could not start checkout. Check your connection and try again.");
      }
    })();
  }, [slug]);

  if (!error) return null;

  return (
    <div>
      <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/40 rounded-lg px-4 py-3 mb-6">
        {error}
      </p>
      <Link
        href="/book/packages"
        className="btn-outline inline-block px-8 py-3 rounded-full text-xs tracking-widest font-bold"
      >
        See all packages
      </Link>
    </div>
  );
}
