"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FREE_CANCEL_HOURS, freeCancelDeadline, isLateCancel } from "@/lib/booking/policy";

type Mode = "idle" | "menu" | "confirm";

export function CancelButton({ bookingId, startsAt }: { bookingId: string; startsAt: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  // Checked when the menu opens, so the warning matches the moment they act.
  const [late, setLate] = useState(false);

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

  const hint = late ? (
    <p className="text-amber-500 text-[10px] leading-snug max-w-[240px]">
      It&rsquo;s within {FREE_CANCEL_HOURS} hours — changing it now uses this session.
    </p>
  ) : (
    <p className="text-zinc-500 text-[10px] leading-snug">
      Free to change until{" "}
      {freeCancelDeadline(startsAt).toLocaleString("en-US", {
        timeZone: "America/Chicago",
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      })}
      .
    </p>
  );

  if (mode === "confirm") {
    return (
      <div className="flex flex-col items-start gap-1 shrink-0">
        <div className="flex items-center gap-2">
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
        {hint}
      </div>
    );
  }

  if (mode === "menu") {
    return (
      <div className="flex flex-col items-start gap-1 shrink-0">
        <div className="flex items-center gap-3">
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
        {hint}
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setLate(isLateCancel(startsAt));
        setMode("menu");
      }}
      className="text-zinc-500 hover:text-[#b07adf] text-[11px] tracking-wider shrink-0"
    >
      CHANGE ▾
    </button>
  );
}
