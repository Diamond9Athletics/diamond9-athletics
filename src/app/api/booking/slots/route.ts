import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeSlots, type TimeRange } from "@/lib/booking/slots";
import { zonedWallToUtc } from "@/lib/booking/tz";
import { getValidAccessToken, getBusy } from "@/lib/google/calendar";

/**
 * GET /api/booking/slots?trainer=ID&duration=30|60&date=YYYY-MM-DD
 * Returns available slot start times for the given trainer on that date.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trainerId = searchParams.get("trainer");
  const durationMin = Number(searchParams.get("duration"));
  const dateStr = searchParams.get("date");

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

  const categories = (trainer.trainer_categories ?? []) as string[];

  // Day window in the studio timezone, converted to UTC bounds for queries.
  const dayStart = zonedWallToUtc(dateStr, "00:00:00");
  const dayEnd = zonedWallToUtc(dateStr, "23:59:59");

  const [rulesRes, bookingsRes, blocksRes] = await Promise.all([
    supabase
      .from("availability_rules")
      .select("day_of_week, start_time, end_time")
      .eq("trainer_id", trainerId)
      .in("category", categories)
      .eq("active", true),
    supabase
      .from("bookings")
      .select("starts_at, ends_at")
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
  const bookings = (bookingsRes.data ?? []).map<TimeRange>((b) => ({
    start: new Date(b.starts_at),
    end: new Date(b.ends_at),
  }));
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
    busy: [...bookings, ...blocks, ...googleBusy],
  });

  return NextResponse.json({
    slots: slots.map((s) => s.toISOString()),
  });
}
