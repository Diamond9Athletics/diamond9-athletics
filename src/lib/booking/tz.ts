/**
 * Timezone helpers.  Pinned to America/Chicago (Austin) because the
 * studio is there.  When the business expands, make this per-trainer.
 */
export const STUDIO_TZ = "America/Chicago";

/**
 * Convert a wall-clock time in the studio timezone to the equivalent
 * UTC Date.  e.g. "2026-06-07" + "08:00" in CT → the UTC instant that
 * equals 8am CT on June 7.
 */
export function zonedWallToUtc(
  dateStr: string,
  timeStr: string,
  tz: string = STUDIO_TZ,
): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm, ss = 0] = timeStr.split(":").map(Number);

  // Pretend the wall-clock numbers are UTC and find where that lands in tz.
  const guess = Date.UTC(y, m - 1, d, hh, mm, ss);

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(new Date(guess));
  const part = (type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value, 10);

  const tzWallAsUtc = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
  );

  const offsetMs = tzWallAsUtc - guess; // how far ahead tz is of UTC
  return new Date(guess - offsetMs);
}

/**
 * Day of week (0 = Sunday, 6 = Saturday) for a calendar date in the
 * studio timezone.
 */
export function dayOfWeekInZone(
  dateStr: string,
  tz: string = STUDIO_TZ,
): number {
  const utc = zonedWallToUtc(dateStr, "12:00:00", tz);
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" });
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(fmt.format(utc));
}
