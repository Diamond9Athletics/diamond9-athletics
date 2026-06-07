"use client";

import { useState } from "react";

export function BuyButton({ slug, kind }: { slug: string; kind: string }) {
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
        className="btn-gold w-full py-3 rounded-full text-xs tracking-widest font-black disabled:opacity-60"
      >
        {loading ? "REDIRECTING…" : kind === "enrollment" ? "ENROLL NOW" : "BUY PACKAGE"}
      </button>
      {error && (
        <p className="text-red-400 text-[11px] mt-2">{error}</p>
      )}
    </div>
  );
}
