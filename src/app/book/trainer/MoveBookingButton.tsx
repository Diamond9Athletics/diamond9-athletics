"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TZ = "America/Chicago";

/** ISO instant → { date: "YYYY-MM-DD", time: "HH:MM" } in the studio TZ. */
function toStudioParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((a, x) => {
      if (x.type !== "literal") a[x.type] = x.value;
      return a;
    }, {});
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour === "24" ? "00" : p.hour}:${p.minute}`,
  };
}

export function MoveBookingButton({
  bookingId,
  startsAtIso,
}: {
  bookingId: string;
  startsAtIso: string;
}) {
  const router = useRouter();
  const initial = toStudioParts(startsAtIso);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setBusy(true);
    const res = await fetch("/api/admin/booking/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, date, time }),
    });
    setBusy(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setErr(json.error ?? "Could not move booking.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] tracking-widest text-zinc-500 hover:text-[#b07adf] font-bold"
      >
        MOVE
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 items-end">
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-white text-xs"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-white text-xs"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={busy}
          className="text-[10px] tracking-widest text-emerald-400 hover:text-emerald-300 font-bold disabled:opacity-50"
        >
          {busy ? "SAVING…" : "SAVE"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setDate(initial.date);
            setTime(initial.time);
            setErr(null);
          }}
          className="text-[10px] tracking-widest text-zinc-600 hover:text-zinc-400 font-bold"
        >
          CANCEL
        </button>
      </div>
      {err && <span className="text-red-400 text-[10px] max-w-[220px]">{err}</span>}
    </div>
  );
}
