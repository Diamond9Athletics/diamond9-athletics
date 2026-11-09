"use client";

import { useState, type KeyboardEvent } from "react";
import { hourLabel, money } from "./format";

/**
 * The owner dashboard's two charts, drawn in plain HTML. Colors come from
 * the .viz-root variables in globals.css (one set per theme). Every value is
 * also in the table under each chart, so hover is a convenience, not the
 * only way in.
 */

export type Series = { key: string; label: string; color: string };
export type Column = {
  key: string;
  label: string;
  /** Full name for the tooltip and table, e.g. "Week of Nov 2". */
  title: string;
  values: Record<string, number>;
  /** Not finished yet (this month, this or next week): drawn lighter. */
  partial?: boolean;
  /** Print the total above this column. Label a few, not all. */
  showTotal?: boolean;
};

/** A round axis top. Counts also need a whole-number middle tick (24, not 25). */
function niceMax(value: number, wholeHalves: boolean): number {
  if (value <= 0) return wholeHalves ? 2 : 1;
  const power = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 1.2, 1.5, 2, 2.4, 2.5, 3, 4, 5, 6, 8, 10]) {
    const top = Math.round(step * power * 1e6) / 1e6;
    if (top < value) continue;
    if (wholeHalves && (!Number.isInteger(top) || top % 2 !== 0)) continue;
    return top;
  }
  return 10 * power;
}

export function StackedColumns({
  label,
  series,
  columns,
  unit,
  partialNote,
}: {
  label: string;
  series: Series[];
  columns: Column[];
  unit: "money" | "count";
  partialNote?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const fmt = (v: number, compact = false) => (unit === "money" ? money(v, compact) : v.toLocaleString("en-US"));
  const totals = columns.map((c) => series.reduce((n, s) => n + (c.values[s.key] ?? 0), 0));
  const top = niceMax(Math.max(...totals, 0), unit === "count");
  const PLOT = 176;

  return (
    <figure className="viz-root m-0">
      <figcaption className="sr-only">{label}</figcaption>
      {/* Legend: always shown for two or more series. */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-4" aria-hidden="true">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-2 text-zinc-400 text-xs">
            <span className="inline-block w-2.5 h-2.5 rounded-[3px]" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        {partialNote && (
          <span className="inline-flex items-center gap-2 text-zinc-500 text-xs">
            <span
              className="inline-block w-2.5 h-2.5 rounded-[3px] opacity-50"
              style={{ background: series[0]?.color }}
            />
            {partialNote}
          </span>
        )}
      </div>

      <div className="flex pt-5">
        {/* Y axis ticks */}
        <div className="relative w-11 shrink-0 text-[10px] text-zinc-500 tabular-nums" style={{ height: PLOT }}>
          {[1, 0.5, 0].map((f) => (
            <span key={f} className="absolute right-2 -translate-y-1/2" style={{ top: PLOT * (1 - f) }}>
              {fmt(top * f, true)}
            </span>
          ))}
        </div>

        <div className="relative flex-1 min-w-0">
          {/* Gridlines: solid hairlines, recessive. */}
          <div className="absolute inset-x-0 top-0" style={{ height: PLOT }} aria-hidden="true">
            {[1, 0.5, 0].map((f) => (
              <div
                key={f}
                className="absolute inset-x-0"
                style={{ top: PLOT * (1 - f), height: 1, background: f === 0 ? "var(--viz-axis)" : "var(--viz-grid)" }}
              />
            ))}
          </div>

          <div className="relative flex" role="list" aria-label={label}>
            {columns.map((c, i) => {
              const total = totals[i];
              const parts = series
                .map((s) => ({ s, v: c.values[s.key] ?? 0 }))
                .filter((p) => p.v > 0);
              const described = `${c.title}: ${series.map((s) => `${s.label} ${fmt(c.values[s.key] ?? 0)}`).join(", ")}; total ${fmt(total)}`;
              return (
                <div
                  key={c.key}
                  role="listitem"
                  tabIndex={0}
                  aria-label={described}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="relative flex-1 min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-[#9954d2]/60 rounded-md cursor-default"
                >
                  {/* The column: segments with a 2px gap, rounded only at the top. */}
                  <div className="relative flex flex-col-reverse items-center gap-[2px]" style={{ height: PLOT }}>
                    {parts.map((p, j) => (
                      <div
                        key={p.s.key}
                        className="w-[min(24px,60%)] shrink-0 transition-opacity"
                        style={{
                          height: Math.max(2, (p.v / top) * PLOT - (j > 0 ? 2 : 0)),
                          background: p.s.color,
                          opacity: c.partial ? 0.5 : active === null || active === i ? 1 : 0.55,
                          borderRadius: j === parts.length - 1 ? "4px 4px 0 0" : 0,
                        }}
                      />
                    ))}
                    {c.showTotal && total > 0 && (
                      <span className="text-[11px] font-semibold text-white tabular-nums whitespace-nowrap mb-1">
                        {fmt(total, true)}
                      </span>
                    )}
                  </div>
                  {/* Many columns on a phone: label every other one. */}
                  <div
                    className={`text-center text-[10px] text-zinc-500 mt-2 whitespace-nowrap ${
                      columns.length > 6 && i % 2 === 1 ? "invisible sm:visible" : ""
                    }`}
                  >
                    {c.label}
                  </div>

                  {active === i && (
                    <div
                      role="tooltip"
                      className={`absolute z-10 bottom-full mb-1 w-44 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl p-3 pointer-events-none ${
                        i > columns.length / 2 ? "right-0" : "left-0"
                      }`}
                    >
                      <p className="text-zinc-400 text-[11px] mb-2">{c.title}</p>
                      {series.map((s) => (
                        <p key={s.key} className="flex items-center gap-2 text-xs mb-1">
                          <span className="inline-block w-3 h-[2px] rounded" style={{ background: s.color }} />
                          <span className="text-white font-semibold tabular-nums">{fmt(c.values[s.key] ?? 0)}</span>
                          <span className="text-zinc-500">{s.label}</span>
                        </p>
                      ))}
                      <p className="text-xs text-zinc-400 mt-2 pt-2 border-t border-zinc-800">
                        Total <span className="text-white font-semibold tabular-nums">{fmt(total)}</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </figure>
  );
}

const DAY_NAMES: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

/** Sessions by weekday and start hour: one hue, more sessions = stronger. */
export function BusiestTimes({
  days,
  hours,
  counts,
  weeks,
}: {
  days: string[];
  hours: number[];
  counts: number[][];
  weeks: number;
}) {
  const [active, setActive] = useState<{ d: number; h: number } | null>(null);
  // Keyboard: the grid is one tab stop; arrow keys move between cells.
  const [cursor, setCursor] = useState({ d: 0, h: 0 });
  const max = Math.max(1, ...counts.flat());
  const move = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const dir = delta[e.key];
    if (!dir) return;
    e.preventDefault();
    const next = {
      d: Math.min(days.length - 1, Math.max(0, cursor.d + dir[0])),
      h: Math.min(hours.length - 1, Math.max(0, cursor.h + dir[1])),
    };
    setCursor(next);
    setActive(next);
    const grid = e.currentTarget;
    grid.querySelector<HTMLElement>(`[data-cell="${next.d}-${next.h}"]`)?.focus();
  };
  const step = (n: number) => (n === 0 ? 0 : Math.min(5, Math.ceil((n / max) * 5)));

  return (
    <figure className="viz-root m-0">
      <figcaption className="sr-only">Sessions by day and start time over the last {weeks} weeks</figcaption>
      <div className="overflow-x-auto -mx-1 px-1">
        <div
          className="grid gap-[2px] min-w-[300px] max-w-[600px]"
          style={{ gridTemplateColumns: `2.25rem repeat(${hours.length}, minmax(14px, 1fr))` }}
          role="group"
          aria-label={`Sessions by day and start time, last ${weeks} weeks. Use the arrow keys to move.`}
          onKeyDown={move}
        >
          <div />
          {hours.map((h, i) => (
            <div key={h} className="text-[9px] text-zinc-500 text-center tabular-nums" aria-hidden="true">
              {i % 2 === 0 ? hourLabel(h, true) : ""}
            </div>
          ))}
          {days.map((day, d) => (
            <div key={day} className="contents">
              <div className="text-[10px] text-zinc-500 self-center" aria-hidden="true">{day}</div>
              {hours.map((h, i) => {
                const n = counts[d][i];
                const on = active?.d === d && active?.h === i;
                return (
                  <div
                    key={h}
                    role="img"
                    data-cell={`${d}-${i}`}
                    tabIndex={cursor.d === d && cursor.h === i ? 0 : -1}
                    aria-label={`${DAY_NAMES[day] ?? day} ${hourLabel(h)}: ${n} session${n === 1 ? "" : "s"}`}
                    onMouseEnter={() => setActive({ d, h: i })}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => {
                      setCursor({ d, h: i });
                      setActive({ d, h: i });
                    }}
                    onBlur={() => setActive(null)}
                    className="relative aspect-square rounded-[4px] outline-none"
                    style={{
                      background: `var(--viz-seq-${step(n)})`,
                      boxShadow: on ? "0 0 0 2px var(--viz-ring)" : undefined,
                    }}
                  >
                    {on && (
                      <div
                        role="tooltip"
                        className={`absolute z-10 bottom-full mb-2 w-40 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl p-2.5 pointer-events-none ${
                          i > hours.length / 2 ? "right-0" : "left-0"
                        }`}
                      >
                        <p className="text-white text-xs font-semibold">
                          {n} session{n === 1 ? "" : "s"}
                        </p>
                        <p className="text-zinc-400 text-[11px]">
                          {DAY_NAMES[day] ?? day}s at {hourLabel(h)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Scale legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-zinc-500" aria-hidden="true">
        <span>None</span>
        {[0, 1, 2, 3, 4, 5].map((s) => (
          <span key={s} className="inline-block w-3 h-3 rounded-[3px]" style={{ background: `var(--viz-seq-${s})` }} />
        ))}
        <span>Most ({max})</span>
      </div>
    </figure>
  );
}
