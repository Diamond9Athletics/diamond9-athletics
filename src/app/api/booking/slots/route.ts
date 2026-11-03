import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { openSlotStarts } from "@/lib/booking/open-slots";

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

  const slots = await openSlotStarts({
    db: supabase,
    admin: createAdminClient(),
    trainerId,
    dateStr,
    durationMin,
    category,
    ruleCategories,
  });

  return NextResponse.json({
    slots: slots.map((s) => s.toISOString()),
  });
}
