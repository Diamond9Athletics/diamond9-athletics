import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { openSlotsByDay } from "@/lib/booking/open-slots";
import { bookingLeadHours } from "@/lib/booking/policy";
import { addDays } from "@/lib/booking/coach-calendar";
import { isStaff } from "@/lib/auth/staff";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/booking/availability?trainer=ID&duration=60&category=pitching&from=YYYY-MM-DD&days=31
 *
 * Open times for each day of the booking page's date picker, worked out
 * exactly like GET /api/booking/slots does for a single day.
 * → { days: [{ date, slots: [ISO…], hasHours }] }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trainerId = searchParams.get("trainer");
  const durationMin = Number(searchParams.get("duration"));
  const category = searchParams.get("category");
  const from = searchParams.get("from") ?? "";
  const days = Math.min(Math.max(Math.trunc(Number(searchParams.get("days"))) || 31, 1), 35);

  if (!trainerId || !durationMin || !DATE_RE.test(from)) {
    return NextResponse.json({ error: "Missing trainer, duration, or start date" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: trainer } = await supabase
    .from("profiles")
    .select("trainer_categories")
    .eq("id", trainerId)
    .eq("is_trainer", true)
    .single();
  if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 404 });

  const trainerCategories = (trainer.trainer_categories ?? []) as string[];
  const byDay = await openSlotsByDay({
    db: supabase,
    admin: createAdminClient(),
    trainerId,
    fromDate: from,
    toDate: addDays(from, days - 1),
    durationMin,
    category,
    ruleCategories: category ? [category] : trainerCategories,
    // Coaches and admins can book any time that hasn't started yet.
    leadHours: bookingLeadHours(await isStaff(supabase, user.id)),
  });

  return NextResponse.json(
    {
      days: [...byDay].map(([date, d]) => ({
        date,
        slots: d.slots.map((s) => s.toISOString()),
        hasHours: d.hasHours,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
