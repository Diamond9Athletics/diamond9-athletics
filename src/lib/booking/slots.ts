/**
 * Slot computation for a single trainer on a single day.
 * Pure functions — no Supabase, easy to test.
 */

export type TimeRange = { start: Date; end: Date };

export type AvailabilityRule = {
  day_of_week: number;
  start_time: string; // "08:00:00" or "08:00"
  end_time: string;   // "21:00:00" or "21:00"
};

/** Build a Date in the same timezone as `dateLocal`. */
function dateAtTime(dateLocal: Date, hhmmss: string): Date {
  const [h, m, s = "0"] = hhmmss.split(":");
  const d = new Date(dateLocal);
  d.setHours(parseInt(h, 10), parseInt(m, 10), parseInt(s, 10), 0);
  return d;
}

export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end;
}

export function computeSlots({
  date,
  durationMin,
  rules,
  busy,
}: {
  /** Local-time date whose day-of-week + window we'll use. */
  date: Date;
  durationMin: number;
  rules: AvailabilityRule[];
  /** Booked or blocked ranges that should be excluded. */
  busy: TimeRange[];
}): Date[] {
  const day = date.getDay();
  const applicable = rules.filter((r) => r.day_of_week === day);

  const slots: Date[] = [];

  for (const rule of applicable) {
    const open = dateAtTime(date, rule.start_time);
    const close = dateAtTime(date, rule.end_time);

    // Walk slots forward in `durationMin` increments.
    for (
      let cur = new Date(open);
      cur.getTime() + durationMin * 60_000 <= close.getTime();
      cur = new Date(cur.getTime() + durationMin * 60_000)
    ) {
      const slot: TimeRange = {
        start: new Date(cur),
        end: new Date(cur.getTime() + durationMin * 60_000),
      };

      // Skip slots that start in the past (use a 15-min buffer so the
      // "book the next slot 5 seconds from now" footgun is avoided).
      if (slot.start.getTime() < Date.now() + 15 * 60_000) continue;

      // Skip overlaps with anything in busy[].
      if (busy.some((b) => overlaps(slot, b))) continue;

      slots.push(slot.start);
    }
  }

  return slots;
}
