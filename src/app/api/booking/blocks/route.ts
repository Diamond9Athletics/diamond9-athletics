/**
 * GET /api/booking/blocks?trainer=ID&days=31
 *
 * Public-athlete view of a trainer's upcoming availability blocks —
 * the times Wes has marked as unavailable and the reason for each.
 * Used by the booking flow's date/time pickers to show athletes
 * *why* a day is unavailable instead of just hiding slots.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trainerId = searchParams.get("trainer");
  const days = Math.min(Math.max(Number(searchParams.get("days") ?? 31), 1), 60);
  if (!trainerId) {
    return NextResponse.json({ error: "Missing trainer" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("availability_blocks")
    .select("starts_at, ends_at, reason")
    .or(`trainer_id.eq.${trainerId},trainer_id.is.null`)
    .lt("starts_at", end.toISOString())
    .gt("ends_at", now.toISOString())
    .order("starts_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    blocks: (data ?? []).map((b) => ({
      starts_at: b.starts_at,
      ends_at: b.ends_at,
      reason: b.reason ?? null,
    })),
  });
}
