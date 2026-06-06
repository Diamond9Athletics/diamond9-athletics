/**
 * Slot computation for a single trainer on a single day.
 * Timezone-aware: rules' wall-clock times are interpreted in STUDIO_TZ.
 */
import { dayOfWeekInZone, STUDIO_TZ, zonedWallToUtc } from "./tz";

export type TimeRange = { start: Date; end: Date };

export type AvailabilityRule = {
  day_of_week: number;
  start_time: string; // "08:00:00" or "08:00"
  end_time: string;
};

export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end;
}

function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

export function computeSlots({
  dateStr,
  durationMin,
  rules,
  busy,
  tz = STUDIO_TZ,
}: {
  /** YYYY-MM-DD in the studio timezone. */
  dateStr: string;
  durationMin: number;
  rules: AvailabilityRule[];
  busy: TimeRange[];
  tz?: string;
}): Date[] {
  const dow = dayOfWeekInZone(dateStr, tz);
  const applicable = rules.filter((r) => r.day_of_week === dow);

  const slots: Date[] = [];

  for (const rule of applicable) {
    const open = zonedWallToUtc(dateStr, rule.start_time, tz);
    const close = zonedWallToUtc(dateStr, rule.end_time, tz);

    for (
      let cur = new Date(open);
      addMinutes(cur, durationMin).getTime() <= close.getTime();
      cur = addMinutes(cur, durationMin)
    ) {
      const slot: TimeRange = { start: cur, end: addMinutes(cur, durationMin) };

      // Skip slots that start in the past (15-min cushion).
      if (slot.start.getTime() < Date.now() + 15 * 60_000) continue;

      // Skip overlaps with existing bookings or blocks.
      if (busy.some((b) => overlaps(slot, b))) continue;

      slots.push(slot.start);
    }
  }

  return slots;
}
