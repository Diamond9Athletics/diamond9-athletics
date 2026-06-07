"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = "pitching" | "hitting";

type Rule = {
  day_of_week: number;
  category: Category;
  start_time: string;
  end_time: string;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function asHHMM(t: string): string {
  // Database returns "08:00:00"; HTML <input type=time> wants "08:00".
  return t.slice(0, 5);
}

export function AvailabilityEditor({
  initialRules,
  categories,
}: {
  initialRules: { day_of_week: number; category: string; start_time: string; end_time: string }[];
  categories: Category[];
}) {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>(
    initialRules.map((r) => ({
      day_of_week: r.day_of_week,
      category: r.category as Category,
      start_time: asHHMM(r.start_time),
      end_time: asHHMM(r.end_time),
    })),
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function addRule(day: number, cat: Category) {
    setRules((prev) => [
      ...prev,
      { day_of_week: day, category: cat, start_time: "16:00", end_time: "20:00" },
    ]);
    setMsg(null);
  }

  function updateRule(idx: number, patch: Partial<Rule>) {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    setMsg(null);
  }

  function deleteRule(idx: number) {
    setRules((prev) => prev.filter((_, i) => i !== idx));
    setMsg(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/trainer/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setMsg(json.error ?? "Could not save.");
      return;
    }
    setMsg("Saved.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {DAYS.map((dayLabel, dayIdx) => {
        const dayRules = rules
          .map((r, i) => ({ rule: r, idx: i }))
          .filter(({ rule }) => rule.day_of_week === dayIdx);
        return (
          <div key={dayIdx} className="rounded-xl border border-white/5 bg-zinc-900/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white text-sm font-bold w-12">{dayLabel}</p>
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => addRule(dayIdx, cat)}
                    className="text-[10px] tracking-widest font-bold text-[#b07adf] hover:text-white border border-[#9954d2]/30 rounded-full px-3 py-1"
                  >
                    + {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {dayRules.length === 0 ? (
              <p className="text-zinc-600 text-xs italic pl-1">Off</p>
            ) : (
              <div className="space-y-2">
                {dayRules.map(({ rule, idx }) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 flex-wrap"
                  >
                    <span className="text-[10px] text-[#b07adf] font-bold tracking-widest w-16 shrink-0">
                      {rule.category.toUpperCase()}
                    </span>
                    <input
                      type="time"
                      value={rule.start_time}
                      onChange={(e) => updateRule(idx, { start_time: e.target.value })}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-white text-sm"
                    />
                    <span className="text-zinc-500 text-xs">to</span>
                    <input
                      type="time"
                      value={rule.end_time}
                      onChange={(e) => updateRule(idx, { end_time: e.target.value })}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-white text-sm"
                    />
                    <button
                      onClick={() => deleteRule(idx)}
                      className="text-zinc-500 hover:text-red-400 text-xs ml-auto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="flex items-center justify-between gap-3 pt-2">
        {msg && (
          <p className={`text-xs ${msg === "Saved." ? "text-green-400" : "text-red-400"}`}>
            {msg}
          </p>
        )}
        <button
          onClick={save}
          disabled={saving}
          className="btn-gold ml-auto px-6 py-2.5 rounded-full text-xs tracking-widest font-black disabled:opacity-60"
        >
          {saving ? "SAVING…" : "SAVE HOURS"}
        </button>
      </div>
    </div>
  );
}
