/**
 * Open start times for one trainer, day by day — what the booking page's
 * date and time pickers show. Shared by GET /api/booking/slots (one day),
 * GET /api/booking/availability (the month), the public open-times preview,
 * and the weekly-repeat check in POST /api/booking/create.
 *
 * One set of reads covers the whole range; each day then runs the same
 * rules on its own share, so a one-day call and a month call always agree.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { categoryCapacity, computeSlots, type TimeRange } from "./slots";
import { dayOfWeekInZone, zonedWallToUtc } from "./tz";
import { addDays } from "./coach-calendar";
import { getValidAccessToken, getBusy } from "@/lib/google/calendar";
import { firstPitchingBookingIds } from "./first-session";

/** A range longer than this is a mistake, not a request. */
const MAX_DAYS = 62;

export type DayOpenings = {
  /** Open start times, earliest first. */
  slots: Date[];
  /** The trainer works this weekday at all (so no times = booked up, not closed). */
  hasHours: boolean;
};

type Args = {
  /** Reads rules, bookings and blocks. */
  db: SupabaseClient;
  /** Reads booking history for the first-session rule. */
  admin: SupabaseClient;
  trainerId: string;
  durationMin: number;
  category: string | null;
  ruleCategories: string[];
  /** Hours ahead a time has to be; left out = the athletes' booking lead. */
  leadHours?: number;
  /** Only times nobody has booked yet: what a brand-new athlete, whose first
   *  pitching session is one-on-one, could pick. */
  emptyOnly?: boolean;
};

export async function openSlotsByDay({
  fromDate,
  toDate,
  ...args
}: Args & {
  /** YYYY-MM-DD in the studio timezone, first and last day (inclusive). */
  fromDate: string;
  toDate: string;
}): Promise<Map<string, DayOpenings>> {
  const { db, admin, trainerId, durationMin, category, ruleCategories, leadHours, emptyOnly } = args;
  const dates: string[] = [];
  for (let d = fromDate; d <= toDate && dates.length < MAX_DAYS; d = addDays(d, 1)) dates.push(d);
  const out = new Map<string, DayOpenings>();
  if (dates.length === 0) return out;

  // The whole range in the studio timezone, as UTC bounds for the queries.
  const rangeStart = zonedWallToUtc(dates[0], "00:00:00");
  const rangeEnd = zonedWallToUtc(dates[dates.length - 1], "23:59:59");

  const [rulesRes, bookingsRes, blocksRes] = await Promise.all([
    db
      .from("availability_rules")
      .select("day_of_week, start_time, end_time")
      .eq("trainer_id", trainerId)
      .in("category", ruleCategories)
      .eq("active", true),
    db
      .from("bookings")
      .select("id, starts_at, ends_at, user_id, service:services(category)")
      .eq("trainer_id", trainerId)
      .eq("status", "confirmed")
      .gte("starts_at", rangeStart.toISOString())
      .lt("starts_at", rangeEnd.toISOString()),
    db
      .from("availability_blocks")
      .select("starts_at, ends_at, trainer_id")
      .or(`trainer_id.eq.${trainerId},trainer_id.is.null`)
      .lt("starts_at", rangeEnd.toISOString())
      .gt("ends_at", rangeStart.toISOString()),
  ]);

  const rules = rulesRes.data ?? [];

  // Supabase can return the joined row as either an object or a single-item
  // array depending on how the FK resolves — accept both.
  type BookingRow = {
    id: string;
    starts_at: string;
    ends_at: string;
    user_id: string;
    service: { category: string | null } | { category: string | null }[] | null;
  };
  const bookingRows = (bookingsRes.data ?? []) as BookingRow[];
  const blockRows = (blocksRes.data ?? []) as { starts_at: string; ends_at: string }[];

  const categoryOf = (b: BookingRow) =>
    (Array.isArray(b.service) ? b.service[0] : b.service)?.category ?? null;

  // First-session promotion: a pitching booking that is its athlete's
  // earliest ever confirmed pitching booking claims the whole slot solo,
  // so it's treated as a hard block rather than a shared booking.
  const pitchingUserIds =
    category === "pitching"
      ? [...new Set(bookingRows.filter((b) => categoryOf(b) === "pitching").map((b) => b.user_id))]
      : [];
  const firstSessions = await firstPitchingBookingIds(admin, pitchingUserIds);

  // If the trainer has connected Google Calendar, pull busy ranges too.
  let googleBusy: TimeRange[] = [];
  try {
    const { accessToken, calendarId } = await getValidAccessToken(trainerId);
    googleBusy = await getBusy({ accessToken, calendarId, timeMin: rangeStart, timeMax: rangeEnd });
  } catch {
    // Trainer hasn't connected Google or token issue — ignore.
  }

  for (const dateStr of dates) {
    // Each day sees what a one-day lookup would: bookings that start that
    // day, and blocks that overlap it.
    const dayStart = zonedWallToUtc(dateStr, "00:00:00").getTime();
    const dayEnd = zonedWallToUtc(dateStr, "23:59:59").getTime();

    // Split bookings by whether they share the target category. Same-category
    // bookings only fill a slot once its capacity is reached; other-category
    // bookings block the trainer entirely.
    const sameCategoryBookings: TimeRange[] = [];
    const otherCategoryBookings: TimeRange[] = [];
    for (const b of bookingRows) {
      const starts = Date.parse(b.starts_at);
      if (starts < dayStart || starts >= dayEnd) continue;
      const range: TimeRange = { start: new Date(b.starts_at), end: new Date(b.ends_at) };
      if (category && categoryOf(b) === category) {
        // Solo first sessions are hard blocks even within the same category,
        // and so is every booking when only empty times count.
        if (emptyOnly || firstSessions.has(b.id)) {
          otherCategoryBookings.push(range);
        } else {
          sameCategoryBookings.push(range);
        }
      } else {
        otherCategoryBookings.push(range);
      }
    }

    const blocks = blockRows
      .filter((b) => Date.parse(b.starts_at) < dayEnd && Date.parse(b.ends_at) > dayStart)
      .map<TimeRange>((b) => ({ start: new Date(b.starts_at), end: new Date(b.ends_at) }));

    const slots = computeSlots({
      dateStr,
      durationMin,
      rules,
      busy: [...otherCategoryBookings, ...blocks, ...googleBusy],
      shared: sameCategoryBookings,
      sharedCapacity: categoryCapacity(category),
      leadHours,
    }).sort((a, b) => a.getTime() - b.getTime());

    const dow = dayOfWeekInZone(dateStr);
    out.set(dateStr, { slots, hasHours: rules.some((r) => r.day_of_week === dow) });
  }

  return out;
}

/** Open start times for one studio day. */
export async function openSlotStarts({
  dateStr,
  ...args
}: Args & {
  /** YYYY-MM-DD in the studio timezone. */
  dateStr: string;
}): Promise<Date[]> {
  const days = await openSlotsByDay({ ...args, fromDate: dateStr, toDate: dateStr });
  return days.get(dateStr)?.slots ?? [];
}
