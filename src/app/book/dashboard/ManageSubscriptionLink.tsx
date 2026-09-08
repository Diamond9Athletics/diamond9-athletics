"use client";

import { useState } from "react";

/**
 * Opens the Stripe Customer Portal so the athlete can cancel their
 * Diamond membership, update the card on file, or download invoices.
 *
 * When the parent knows the athlete is subscribed, this renders as a
 * prominent outlined button. Otherwise it falls back to a small text
 * link that hides itself once we learn (via a 404 from /portal) that
 * they don't have a subscription.
 */
export function ManageSubscriptionLink({
  prominent = false,
}: {
  prominent?: boolean;
}) {
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

  if (prominent) {
    return (
      <div className="card-modern rounded-2xl p-6 mt-4">
        <p className="text-zinc-500 text-[10px] tracking-widest mb-2 font-bold">
          DIAMOND MEMBERSHIP
        </p>
        <p className="text-zinc-300 text-sm mb-4">
          Manage your card, view invoices, or cancel — all handled on Stripe&rsquo;s
          secure portal.
        </p>
        <button
          onClick={open}
          disabled={busy}
          className="btn-outline w-full sm:w-auto px-6 py-3 rounded-full text-xs tracking-widest font-black disabled:opacity-60"
        >
          {busy ? "OPENING…" : "MANAGE / CANCEL MEMBERSHIP"}
        </button>
        {error && (
          <p className="text-red-400 text-[11px] mt-2">{error}</p>
        )}
      </div>
    );
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
      {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
    </div>
  );
}
