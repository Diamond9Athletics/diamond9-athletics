"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function doCancel() {
    setBusy(true);
    const res = await fetch("/api/booking/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    setBusy(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json.error ?? "Could not cancel.");
      setConfirming(false);
      return;
    }
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={doCancel}
          disabled={busy}
          className="text-red-400 hover:text-red-300 text-xs tracking-wider font-bold disabled:opacity-60"
        >
          {busy ? "CANCELING…" : "YES, CANCEL"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-zinc-500 hover:text-zinc-300 text-xs tracking-wider"
        >
          KEEP
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-zinc-500 hover:text-red-400 text-[11px] tracking-wider shrink-0"
    >
      CANCEL
    </button>
  );
}
