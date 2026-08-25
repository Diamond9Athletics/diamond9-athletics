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

/**
 * How many concurrent bookings a single time slot can hold, per service
 * category. Pitching runs shared bullpen space so two athletes can train
 * side-by-side; hitting stays one-at-a-time.
 */
export const CATEGORY_CAPACITY: Record<string, number> = {
  pitching: 2,
  hitting: 1,
};

export function categoryCapacity(category: string | null | undefined): number {
  if (!category) return 1;
  return CATEGORY_CAPACITY[category] ?? 1;
}

export function computeSlots({
  dateStr,
  durationMin,
  rules,
  busy,
  shared = [],
  sharedCapacity = 1,
  tz = STUDIO_TZ,
}: {
  /** YYYY-MM-DD in the studio timezone. */
  dateStr: string;
  durationMin: number;
  rules: AvailabilityRule[];
  /** Hard blocks: Google busy, availability blocks, other-category bookings. */
  busy: TimeRange[];
  /** Soft blocks: same-category bookings. A slot is only full when
   *  `sharedCapacity` of them overlap it. */
  shared?: TimeRange[];
  sharedCapacity?: number;
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

      // Hard blocks always win.
      if (busy.some((b) => overlaps(slot, b))) continue;

      // Shared bookings only block once the slot is at capacity.
      if (
        sharedCapacity <= 1
          ? shared.some((b) => overlaps(slot, b))
          : shared.filter((b) => overlaps(slot, b)).length >= sharedCapacity
      ) {
        continue;
      }

      slots.push(slot.start);
    }
  }

  return slots;
}
