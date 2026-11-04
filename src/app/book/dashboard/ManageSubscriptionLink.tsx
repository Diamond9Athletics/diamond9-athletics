"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Membership } from "@/lib/stripe/subscription";

/**
 * Management card for one Diamond membership (a family can have one per
 * athlete). The dashboard reads the state live from Stripe and passes it in.
 *
 * The primary action is a native CANCEL — a confirmation modal calls
 * /api/stripe/cancel-subscription which flips the Stripe sub to
 * cancel_at_period_end: true. Athletes stay on D9 the whole time.
 *
 * A "manage card / invoices" link routes to the Stripe Customer Portal
 * for everything else (updating card, downloading invoices).
 */
export function ManageSubscriptionLink({
  membership,
  athleteName,
}: {
  membership: Membership;
  /** Whose membership it is, on a family account. */
  athleteName?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(membership);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<"cancel" | "resume" | "portal" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subscription = JSON.stringify({ subscriptionId: membership.subscriptionId });

  async function cancelNow() {
    setBusy("cancel");
    setError(null);
    setNotice(null);
    const res = await fetch("/api/stripe/cancel-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: subscription,
    });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok || !json.ok) {
      setError(json.error ?? "Could not cancel. Please try again.");
      return;
    }
    setConfirming(false);
    setStatus((s) => ({ ...s, cancelAtPeriodEnd: true, currentPeriodEnd: json.cancelsOn ?? s.currentPeriodEnd }));
    setNotice(
      json.alreadyScheduled
        ? `You already asked to cancel. Access ends ${fmtDate(json.cancelsOn)}.`
        : `Membership canceled. You keep access through ${fmtDate(json.cancelsOn)}.`,
    );
    router.refresh();
  }

  async function resumeMembership() {
    setBusy("resume");
    setError(null);
    setNotice(null);
    const res = await fetch("/api/stripe/resume-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: subscription,
    });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok || !json.ok) {
      setError(json.error ?? "Could not resume. Please try again.");
      return;
    }
    setStatus((s) => ({ ...s, cancelAtPeriodEnd: false }));
    setNotice("Membership reactivated — your card will be charged next cycle.");
    router.refresh();
  }

  async function openPortal() {
    setBusy("portal");
    setError(null);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.url) {
      setBusy(null);
      setError(json.error ?? "Could not open the billing portal.");
      return;
    }
    window.location.assign(json.url);
  }

  const windingDown = status.cancelAtPeriodEnd;

  return (
    <>
      <div className="card-modern rounded-2xl p-6 mt-4">
        <p className="text-zinc-500 text-[10px] tracking-widest mb-2 font-bold">
          DIAMOND MEMBERSHIP{athleteName && <span className="text-[#b07adf]"> · {athleteName.toUpperCase()}</span>}
        </p>
        {windingDown ? (
          <p className="text-amber-300 text-sm mb-4">
            Scheduled to cancel on <span className="text-white font-bold">{fmtDate(status.currentPeriodEnd)}</span>. You still have unlimited access until then.
          </p>
        ) : (
          <p className="text-zinc-300 text-sm mb-4">
            Active · $350/month. Cancel anytime — you&rsquo;ll keep access through the end of the paid period.
          </p>
        )}

        {notice && (
          <p className="text-emerald-300 text-xs bg-emerald-950/30 border border-emerald-900/40 rounded-lg px-3 py-2 mb-3">
            {notice}
          </p>
        )}
        {error && (
          <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          {windingDown ? (
            <button
              onClick={resumeMembership}
              disabled={busy !== null}
              className="btn-gold px-6 py-3 rounded-full text-xs tracking-widest font-black disabled:opacity-60"
            >
              {busy === "resume" ? "RESUMING…" : "RESUME MEMBERSHIP"}
            </button>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              disabled={busy !== null}
              className="btn-outline px-6 py-3 rounded-full text-xs tracking-widest font-black disabled:opacity-60"
            >
              CANCEL MEMBERSHIP
            </button>
          )}
          <button
            onClick={openPortal}
            disabled={busy !== null}
            className="text-zinc-400 hover:text-[#b07adf] text-xs tracking-widest font-bold px-2 py-3 disabled:opacity-60"
          >
            {busy === "portal" ? "OPENING…" : "UPDATE CARD / INVOICES →"}
          </button>
        </div>
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => !busy && setConfirming(false)}
        >
          <div
            className="card-modern rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-zinc-500 text-[10px] tracking-widest mb-2 font-bold">
              CANCEL DIAMOND MEMBERSHIP
            </p>
            <h2 className="font-display text-2xl text-white mb-3">
              Are you sure?
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed mb-5">
              You&rsquo;ll keep unlimited access through{" "}
              <span className="text-white font-bold">
                {fmtDate(status.currentPeriodEnd)}
              </span>
              . After that your card won&rsquo;t be charged and the membership ends.
              You can resume anytime before that date.
            </p>
            <div className="flex flex-col sm:flex-row-reverse gap-3">
              <button
                onClick={cancelNow}
                disabled={busy !== null}
                className="btn-outline-danger px-6 py-3 rounded-full text-xs tracking-widest font-black disabled:opacity-60 border border-red-500/50 text-red-300 hover:border-red-500 hover:text-red-200"
              >
                {busy === "cancel" ? "CANCELING…" : "YES, CANCEL"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={busy !== null}
                className="btn-gold px-6 py-3 rounded-full text-xs tracking-widest font-black disabled:opacity-60"
              >
                KEEP MEMBERSHIP
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "the end of the period";
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
