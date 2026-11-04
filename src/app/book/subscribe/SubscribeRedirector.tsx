"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function SubscribeRedirector({ athleteKey }: { athleteKey: string }) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteKey }),
      });
      const json = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok || !json.url) {
        setError(json.error ?? "Could not start checkout. Please try again.");
        return;
      }
      // replace, not assign — Back from Stripe returns to the plans page
      // instead of bouncing straight back into checkout.
      window.location.replace(json.url);
    })();
    return () => {
      cancelled = true;
    };
  }, [athleteKey]);

  if (!error) return null;

  return (
    <div>
      <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/40 rounded-lg px-4 py-3 mb-6">
        {error}
      </p>
      <Link
        href="/pitching-plans"
        className="btn-outline inline-block px-8 py-3 rounded-full text-xs tracking-widest font-bold"
      >
        Back to plans
      </Link>
    </div>
  );
}
