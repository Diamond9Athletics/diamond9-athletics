"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FREE_CANCEL_HOURS, freeCancelDeadline, isLateCancel } from "@/lib/booking/policy";

type Mode = "idle" | "menu" | "confirm";

/** Big enough to tap with a thumb. */
const TAP = "inline-flex items-center min-h-[44px] px-2 -mx-2";

export function CancelButton({ bookingId, startsAt }: { bookingId: string; startsAt: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  // Checked when the menu opens, so the warning matches the moment they act.
  const [late, setLate] = useState(false);

  async function cancel() {
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
    router.refresh();
  }

  const hint = late ? (
    <p className="text-amber-500 text-xs leading-snug max-w-[260px]">
      It&rsquo;s within {FREE_CANCEL_HOURS} hours — changing it now uses this session.
    </p>
  ) : (
    <p className="text-zinc-500 text-xs leading-snug">
      Free to change until{" "}
      {freeCancelDeadline(startsAt).toLocaleString("en-US", {
        timeZone: "America/Chicago",
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}
      .
    </p>
  );

  if (mode === "confirm") {
    return (
      <div className="flex flex-col items-start gap-1 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => cancel()}
            disabled={busy}
            className={`${TAP} text-red-400 hover:text-red-300 text-[13px] font-medium disabled:opacity-60`}
          >
            {busy ? "Canceling…" : "Yes, cancel"}
          </button>
          <button
            onClick={() => setMode("menu")}
            className={`${TAP} text-zinc-400 hover:text-zinc-200 text-[13px]`}
          >
            Keep it
          </button>
        </div>
        {hint}
      </div>
    );
  }

  if (mode === "menu") {
    return (
      <div className="flex flex-col items-start gap-1 shrink-0">
        <div className="flex items-center gap-4">
          {/* Moves the session: the original is only let go once the new
              time is booked, so nothing is lost if they change their mind. */}
          <button
            onClick={() => router.push(`/book/schedule?reschedule=${bookingId}`)}
            className={`${TAP} text-[#b07adf] hover:text-[#c89cff] text-[13px] font-medium`}
          >
            Reschedule
          </button>
          <button
            onClick={() => setMode("confirm")}
            className={`${TAP} text-zinc-400 hover:text-red-400 text-[13px]`}
          >
            Cancel
          </button>
          <button
            onClick={() => setMode("idle")}
            aria-label="Close"
            className={`${TAP} text-zinc-400 hover:text-zinc-200 text-sm`}
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
      className={`${TAP} text-zinc-400 hover:text-white text-[13px] shrink-0`}
    >
      Change ▾
    </button>
  );
}
