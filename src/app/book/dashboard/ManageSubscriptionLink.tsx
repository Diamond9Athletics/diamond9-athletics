"use client";

import { useState } from "react";

/**
 * Opens the Stripe Customer Portal so the athlete can cancel their
 * Diamond membership, update the card on file, or download invoices.
 * Renders as a small text link — always visible on the dashboard;
 * hides itself only after a "no subscription found" response so a
 * non-subscriber isn't prompted repeatedly.
 */
export function ManageSubscriptionLink() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  async function open() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.url) {
      // Non-subscribers get 404 — quietly hide the link for them.
      if (res.status === 404) {
        setHidden(true);
        return;
      }
      setError(json.error ?? "Could not open the subscription portal.");
      setBusy(false);
      return;
    }
    window.location.assign(json.url);
  }

  return (
    <div className="text-center mt-3">
      <button
        onClick={open}
        disabled={busy}
        className="text-zinc-500 hover:text-[#b07adf] text-xs tracking-wider disabled:opacity-60"
      >
        {busy ? "OPENING…" : "MANAGE SUBSCRIPTION →"}
      </button>
      {error && (
        <p className="text-red-400 text-[11px] mt-1">{error}</p>
      )}
    </div>
  );
}
