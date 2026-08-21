"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Block = {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

const TZ = "America/Chicago";

function isoDateInCT(d: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function fmtBlockRange(b: Block) {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  const start = new Date(b.starts_at);
  const end = new Date(b.ends_at);
  return `${start.toLocaleString("en-US", opts)} — ${end.toLocaleString("en-US", { ...opts, month: undefined, day: undefined })}`;
}

export function BlocksEditor({ initialBlocks }: { initialBlocks: Block[] }) {
  const router = useRouter();
  // Drive the list off the prop so a router.refresh() re-render is
  // reflected immediately. Local `useState(initialBlocks)` only
  // initializes once, which caused newly-added blocks to never appear.
  const blocks = initialBlocks;
  const [date, setDate] = useState(isoDateInCT(new Date()));
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/trainer/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, startTime, endTime, reason: reason || null }),
    });
    setBusy(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setMsg(json.error ?? "Could not add block.");
      return;
    }
    setReason("");
    router.refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/trainer/blocks?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setMsg(json.error ?? "Could not delete block.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-3">
        <p className="text-zinc-500 text-[10px] tracking-widest font-bold mb-3">ADD A BLOCK</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            type="text"
            placeholder="Optional reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
        <div className="flex items-center justify-between gap-2 mt-3">
          {msg && <p className="text-red-400 text-xs">{msg}</p>}
          <button
            onClick={add}
            disabled={busy}
            className="ml-auto btn-gold px-5 py-2 rounded-full text-[11px] tracking-widest font-black disabled:opacity-60"
          >
            {busy ? "ADDING…" : "ADD BLOCK"}
          </button>
        </div>
      </div>

      {blocks.length === 0 ? (
        <p className="text-zinc-500 text-xs italic pl-1">No upcoming blocks.</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {blocks.map((b) => (
            <li key={b.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-white text-sm">{fmtBlockRange(b)}</p>
                {b.reason && <p className="text-zinc-500 text-xs">{b.reason}</p>}
              </div>
              <button
                onClick={() => remove(b.id)}
                className="text-zinc-500 hover:text-red-400 text-xs"
              >
                REMOVE
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
