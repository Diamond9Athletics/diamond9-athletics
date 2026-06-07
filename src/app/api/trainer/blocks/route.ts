import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { zonedWallToUtc } from "@/lib/booking/tz";

async function requireTrainer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_trainer")
    .eq("id", user.id)
    .single();
  if (!profile?.is_trainer) return null;
  return { userId: user.id };
}

/** POST add a block. Body: { date, startTime, endTime, reason? } — all in studio TZ. */
export async function POST(request: NextRequest) {
  const me = await requireTrainer();
  if (!me) return NextResponse.json({ error: "Not a trainer" }, { status: 403 });

  const { date, startTime, endTime, reason } = (await request.json()) ?? {};
  if (!date || !startTime || !endTime) {
    return NextResponse.json(
      { error: "date, startTime, endTime required" },
      { status: 400 },
    );
  }

  const starts = zonedWallToUtc(date, startTime);
  const ends = zonedWallToUtc(date, endTime);
  if (ends <= starts) {
    return NextResponse.json({ error: "end must be after start" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("availability_blocks")
    .insert({
      trainer_id: me.userId,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      reason: reason ?? null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

/** DELETE ?id=... remove a block. */
export async function DELETE(request: NextRequest) {
  const me = await requireTrainer();
  if (!me) return NextResponse.json({ error: "Not a trainer" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("availability_blocks")
    .delete()
    .eq("id", id)
    .eq("trainer_id", me.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
