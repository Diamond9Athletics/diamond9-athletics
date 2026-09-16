import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  categoryCapacity,
  computeSlots,
  type TimeRange,
} from "@/lib/booking/slots";
import { zonedWallToUtc } from "@/lib/booking/tz";
import { getValidAccessToken, getBusy } from "@/lib/google/calendar";
import { firstPitchingBookingUsers } from "@/lib/booking/first-session";

/**
 * GET /api/booking/slots?trainer=ID&duration=30|60&date=YYYY-MM-DD
 * Returns available slot start times for the given trainer on that date.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trainerId = searchParams.get("trainer");
  const durationMin = Number(searchParams.get("duration"));
  const dateStr = searchParams.get("date");
  const category = searchParams.get("category");

  if (!trainerId || !durationMin || !dateStr) {
    return NextResponse.json(
      { error: "Missing trainer, duration, or date" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // The trainer profile tells us which categories they serve.
  const { data: trainer } = await supabase
    .from("profiles")
    .select("trainer_categories")
    .eq("id", trainerId)
    .eq("is_trainer", true)
    .single();

  if (!trainer) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  const trainerCategories = (trainer.trainer_categories ?? []) as string[];
  // If the caller specified a category, only use rules for that one.
  const ruleCategories = category ? [category] : trainerCategories;

  // Day window in the studio timezone, converted to UTC bounds for queries.
  const dayStart = zonedWallToUtc(dateStr, "00:00:00");
  const dayEnd = zonedWallToUtc(dateStr, "23:59:59");

  const [rulesRes, bookingsRes, blocksRes] = await Promise.all([
    supabase
      .from("availability_rules")
      .select("day_of_week, start_time, end_time")
      .eq("trainer_id", trainerId)
      .in("category", ruleCategories)
      .eq("active", true),
    supabase
      .from("bookings")
      .select("starts_at, ends_at, user_id, service:services(category)")
      .eq("trainer_id", trainerId)
      .eq("status", "confirmed")
      .gte("starts_at", dayStart.toISOString())
      .lt("starts_at", dayEnd.toISOString()),
    supabase
      .from("availability_blocks")
      .select("starts_at, ends_at, trainer_id")
      .or(`trainer_id.eq.${trainerId},trainer_id.is.null`)
      .lt("starts_at", dayEnd.toISOString())
      .gt("ends_at", dayStart.toISOString()),
  ]);

  const rules = rulesRes.data ?? [];

  // Split bookings by whether they share the target category. Same-category
  // bookings only fill a slot once its capacity is reached; other-category
  // bookings block the trainer entirely.
  type BookingRow = {
    starts_at: string;
    ends_at: string;
    user_id: string;
    // Supabase can return the joined row as either an object or a single-item
    // array depending on how the FK resolves — accept both.
    service:
      | { category: string | null }
      | { category: string | null }[]
      | null;
  };
  const bookingRows = (bookingsRes.data ?? []) as BookingRow[];

  // First-session promotion: a pitching booking that is its athlete's
  // earliest ever confirmed pitching booking claims the whole slot solo.
  // Look up which of today's pitching bookings qualify, then treat those
  // as hard blocks rather than shared bookings.
  let firstSessionUsers = new Set<string>();
  if (category === "pitching" && bookingRows.length > 0) {
    const pitchingUserIds = [
      ...new Set(
        bookingRows
          .filter((b) => {
            const svc = Array.isArray(b.service) ? b.service[0] : b.service;
            return svc?.category === "pitching";
          })
          .map((b) => b.user_id),
      ),
    ];
    if (pitchingUserIds.length > 0) {
      const admin = createAdminClient();
      // Per booking, we ask: is the earliest confirmed pitching booking
      // for this user on or before *this booking's* start? For the
      // whole day we can approximate by using the day's latest pitching
      // booking start as the ceiling — but that would over-promote.
      // Instead, do it per unique start time.
      const uniqueStarts = [
        ...new Set(
          bookingRows
            .filter((b) => {
              const svc = Array.isArray(b.service) ? b.service[0] : b.service;
              return svc?.category === "pitching";
            })
            .map((b) => b.starts_at),
        ),
      ];
      const perStart = await Promise.all(
        uniqueStarts.map(async (iso) => {
          const users = bookingRows
            .filter((b) => {
              const svc = Array.isArray(b.service) ? b.service[0] : b.service;
              return svc?.category === "pitching" && b.starts_at === iso;
            })
            .map((b) => b.user_id);
          const firsts = await firstPitchingBookingUsers(
            admin,
            users,
            new Date(iso),
          );
          return { iso, firsts };
        }),
      );
      firstSessionUsers = new Set();
      for (const { iso, firsts } of perStart) {
        for (const uid of firsts) {
          firstSessionUsers.add(`${uid}|${iso}`);
        }
      }
    }
  }

  const sameCategoryBookings: TimeRange[] = [];
  const otherCategoryBookings: TimeRange[] = [];
  for (const b of bookingRows) {
    const svc = Array.isArray(b.service) ? b.service[0] : b.service;
    const range: TimeRange = {
      start: new Date(b.starts_at),
      end: new Date(b.ends_at),
    };
    if (category && svc?.category === category) {
      // Solo first sessions are hard blocks even within the same category.
      const key = `${b.user_id}|${b.starts_at}`;
      if (category === "pitching" && firstSessionUsers.has(key)) {
        otherCategoryBookings.push(range);
      } else {
        sameCategoryBookings.push(range);
      }
    } else {
      otherCategoryBookings.push(range);
    }
  }

  const blocks = (blocksRes.data ?? []).map<TimeRange>((b) => ({
    start: new Date(b.starts_at),
    end: new Date(b.ends_at),
  }));

  // If the trainer has connected Google Calendar, pull busy ranges too.
  let googleBusy: TimeRange[] = [];
  try {
    const { accessToken, calendarId } = await getValidAccessToken(trainerId);
    googleBusy = await getBusy({
      accessToken,
      calendarId,
      timeMin: dayStart,
      timeMax: dayEnd,
    });
  } catch {
    // Trainer hasn't connected Google or token issue — ignore.
  }

  const slots = computeSlots({
    dateStr,
    durationMin,
    rules,
    busy: [...otherCategoryBookings, ...blocks, ...googleBusy],
    shared: sameCategoryBookings,
    sharedCapacity: categoryCapacity(category),
  });

  return NextResponse.json({
    slots: slots.map((s) => s.toISOString()),
  });
}
