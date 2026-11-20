"use client";

import { useState } from "react";

export function BuyButton({
  slug,
  kind,
  featured = false,
}: {
  slug: string;
  kind: string;
  featured?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const json = await res.json();

    if (!res.ok || !json.url) {
      setError(json.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    window.location.href = json.url;
  }

  return (
    <div>
      <button
        onClick={onClick}
        disabled={loading}
        className={`${featured ? "btn-gold" : "btn-outline"} w-full py-3.5 rounded-full text-sm tracking-widest font-bold disabled:opacity-60`}
      >
        {loading ? "Redirecting…" : kind === "enrollment" ? "Enroll now" : "Buy plan"}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-2">{error}</p>
      )}
    </div>
  );
}
