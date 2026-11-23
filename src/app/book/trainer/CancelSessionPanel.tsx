"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CalSession } from "@/lib/booking/coach-calendar";

const NOTE_MAX = 500;

/**
 * Admin only: cancel a session from the calendar. By default the session
 * goes back on their account and they get an email (with an optional note);
 * either can be switched off, e.g. for a same-day no-show.
 */
export function CancelSessionPanel({ s, onDone }: { s: CalSession; onDone: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [refund, setRefund] = useState(true);
  const [notify, setNotify] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function cancel() {
    setErr(null);
    setBusy(true);
    const res = await fetch("/api/admin/booking/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: s.id, refund, notify, note: notify ? note : "" }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) {
      setErr(json?.error ?? "Couldn’t cancel the session. Check your connection and try again.");
      return;
    }
    router.refresh();
    onDone();
  }

  if (!open) {
    return (
      <div className="border-t border-white/[0.08] pt-4 flex items-center justify-between gap-3">
        <span className="text-zinc-500 text-[10px] tracking-widest font-bold">CANCEL</span>
        <button
          type="button"
          onClick={() => {
            // Nobody needs an email about a session that's already over.
            setNotify(new Date(s.endsAt).getTime() > Date.now());
            setOpen(true);
          }}
          className="text-red-300 hover:text-red-200 text-[13px] font-medium px-3 py-1.5 rounded-full border border-red-500/30 hover:border-red-500/60 transition-colors"
        >
          Cancel this session
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-white/[0.08] pt-4 space-y-4">
      <p className="text-white font-medium">Cancel {s.firstName}&rsquo;s session?</p>

      {s.usesSession ? (
        <label className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={refund}
            onChange={(e) => setRefund(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#a97ce2] shrink-0"
          />
          <span>
            Give the session back to their account
            {!refund && (
              <span className="block text-amber-400 text-xs mt-1">
                It will count as a used session (like a late cancel or no-show).
              </span>
            )}
          </span>
        </label>
      ) : (
        <p className="text-zinc-500 text-xs">Diamond membership session — there&rsquo;s nothing to give back.</p>
      )}

      <label className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer">
        <input
          type="checkbox"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#a97ce2] shrink-0"
        />
        <span>Email them to let them know</span>
      </label>

      {notify && (
        <div>
          <label htmlFor={`cancel-note-${s.id}`} className="block text-zinc-500 text-[10px] tracking-widest font-bold mb-1.5">
            NOTE FOR {s.firstName.toUpperCase()} (OPTIONAL)
          </label>
          <textarea
            id={`cancel-note-${s.id}`}
            rows={3}
            maxLength={NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Coach is sick today, sorry! Pick any other time that works."
            className="w-full bg-white/[0.03] border border-white/10 focus:border-[#a97ce2]/60 text-white text-sm px-3 py-2.5 rounded-xl outline-none resize-none placeholder:text-zinc-600"
          />
        </div>
      )}

      {err && <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">{err}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={cancel}
          disabled={busy}
          className="px-5 py-2.5 rounded-full text-[13px] font-medium bg-red-500/15 border border-red-500/50 text-red-200 hover:bg-red-500/25 hover:border-red-500 transition-colors disabled:opacity-60"
        >
          {busy ? "Cancelling…" : "Yes, cancel session"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setErr(null);
          }}
          disabled={busy}
          className="text-zinc-400 hover:text-white text-[13px] px-2 py-2.5"
        >
          Keep it
        </button>
      </div>
    </div>
  );
}
