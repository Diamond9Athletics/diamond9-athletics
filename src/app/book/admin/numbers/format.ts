/** Number formatting shared by the numbers page and its charts. */

export function money(cents: number, compact = false): string {
  const dollars = cents / 100;
  if (compact && Math.abs(dollars) >= 1000) {
    return `$${(dollars / 1000).toFixed(dollars >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  }
  return `$${Math.round(dollars).toLocaleString("en-US")}`;
}

export function hourLabel(h: number, short = false): string {
  const twelve = h % 12 === 0 ? 12 : h % 12;
  if (short) return `${twelve}${h < 12 ? "a" : "p"}`;
  return `${twelve} ${h < 12 ? "AM" : "PM"}`;
}

/** 12 or 12.5: hours to at most one decimal. */
export function hours(h: number): string {
  const r = Math.round(h * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
