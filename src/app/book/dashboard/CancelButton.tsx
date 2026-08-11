"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "idle" | "menu" | "confirm";

export function CancelButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");

  async function cancel(then?: "rebook") {
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
      setMode("idle");
      return;
    }
    if (then === "rebook") {
      router.push("/book/schedule");
      return;
    }
    router.refresh();
  }

  if (mode === "confirm") {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => cancel()}
          disabled={busy}
          className="text-red-400 hover:text-red-300 text-xs tracking-wider font-bold disabled:opacity-60"
        >
          {busy ? "CANCELING…" : "YES, CANCEL"}
        </button>
        <button
          onClick={() => setMode("menu")}
          className="text-zinc-500 hover:text-zinc-300 text-xs tracking-wider"
        >
          KEEP
        </button>
      </div>
    );
  }

  if (mode === "menu") {
    return (
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => cancel("rebook")}
          disabled={busy}
          className="text-[#b07adf] hover:text-[#c89cff] text-[11px] tracking-wider font-bold disabled:opacity-60"
        >
          {busy ? "…" : "RESCHEDULE"}
        </button>
        <button
          onClick={() => setMode("confirm")}
          className="text-zinc-500 hover:text-red-400 text-[11px] tracking-wider"
        >
          CANCEL
        </button>
        <button
          onClick={() => setMode("idle")}
          className="text-zinc-700 hover:text-zinc-500 text-[11px] tracking-wider"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setMode("menu")}
      className="text-zinc-500 hover:text-[#b07adf] text-[11px] tracking-wider shrink-0"
    >
      CHANGE ▾
    </button>
  );
}
