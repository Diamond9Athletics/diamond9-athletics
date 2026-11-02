"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays } from "@/lib/booking/coach-calendar";

/**
 * Block time off from the calendar. A multi-day stretch is saved as one
 * block per day (first day from its start time, last day until its end
 * time), the same shape the hours page and the booking page use.
 */
export function TimeOffForm({
  defaultDate,
  onClose,
}: {
  defaultDate: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(defaultDate);
  const [to, setTo] = useState(defaultDate);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!from || !to) return setError("Pick the first and last day.");
    if (to < from) return setError("The last day can't be before the first day.");
    const days: string[] = [];
    for (let d = from; d <= to && days.length <= 31; d = addDays(d, 1)) days.push(d);
    if (days.length > 31) return setError("Block 31 days or fewer at a time.");
    if (!allDay && from === to && endTime <= startTime) {
      return setError("The end time has to be after the start time.");
    }

    setBusy(true);
    for (const date of days) {
      const res = await fetch("/api/trainer/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          startTime: allDay || date !== from ? "00:00" : startTime,
          endTime: allDay || date !== to ? "23:59" : endTime,
          reason: reason.trim() || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setBusy(false);
        setError(json.error ?? "Couldn't save the time off. Try again.");
        router.refresh(); // show whichever days did save
        return;
      }
    }
    router.refresh();
    onClose();
  }

  const inputCls =
    "w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#9954d2]/60";
  const labelCls = "block text-zinc-500 text-[10px] tracking-widest font-bold mb-1.5";

  return (
    <form onSubmit={submit} className="card-modern rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-zinc-500 text-[10px] tracking-widest font-bold">BLOCK TIME OFF</p>
          <p className="text-zinc-500 text-xs mt-1">
            Athletes won&rsquo;t be able to book these hours.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 text-[10px] tracking-widest font-bold"
        >
          CLOSE
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls} htmlFor="off-from">FIRST DAY</label>
          <input
            id="off-from"
            type="date"
            required
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              if (to < e.target.value) setTo(e.target.value);
            }}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="off-to">LAST DAY</label>
          <input
            id="off-to"
            type="date"
            required
            min={from}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-zinc-300 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="accent-[#9954d2] w-4 h-4"
        />
        All day
      </label>

      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="off-start">
              {from === to ? "FROM" : "STARTS (FIRST DAY)"}
            </label>
            <input
              id="off-start"
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="off-end">
              {from === to ? "UNTIL" : "ENDS (LAST DAY)"}
            </label>
            <input
              id="off-end"
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelCls} htmlFor="off-reason">REASON (OPTIONAL)</label>
        <input
          id="off-reason"
          type="text"
          maxLength={80}
          placeholder="Out of town"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={inputCls}
        />
        <p className="text-zinc-600 text-[11px] mt-1.5">
          Athletes see this reason when they pick a day. Sessions already booked in this
          time stay on your calendar — move them if needed.
        </p>
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-gold w-full py-3 rounded-full text-xs tracking-widest font-black disabled:opacity-60"
      >
        {busy ? "SAVING…" : "BLOCK THIS TIME"}
      </button>
    </form>
  );
}
