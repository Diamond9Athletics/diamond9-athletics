"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function SubscribeRedirector() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/stripe/subscribe", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok || !json.url) {
        setError(json.error ?? "Could not start checkout. Please try again.");
        return;
      }
      window.location.assign(json.url);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
