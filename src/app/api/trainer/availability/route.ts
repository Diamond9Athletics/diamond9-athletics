import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireTrainer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_trainer, trainer_categories")
    .eq("id", user.id)
    .single();
  if (!profile?.is_trainer) return null;
  return { userId: user.id, categories: (profile.trainer_categories ?? []) as string[] };
}

/** POST { rules: [{ day_of_week, category, start_time, end_time }] } — replaces ALL rules for this trainer. */
export async function POST(request: NextRequest) {
  const me = await requireTrainer();
  if (!me) return NextResponse.json({ error: "Not a trainer" }, { status: 403 });

  const { rules } = (await request.json()) ?? {};
  if (!Array.isArray(rules)) {
    return NextResponse.json({ error: "rules[] required" }, { status: 400 });
  }

  // Validate.
  for (const r of rules) {
    if (
      typeof r.day_of_week !== "number" ||
      r.day_of_week < 0 ||
      r.day_of_week > 6 ||
      !me.categories.includes(r.category) ||
      typeof r.start_time !== "string" ||
      typeof r.end_time !== "string" ||
      r.start_time >= r.end_time
    ) {
      return NextResponse.json({ error: "Invalid rule" }, { status: 400 });
    }
  }

  const admin = createAdminClient();

  // Replace strategy: delete this trainer's rules, then insert.
  await admin
    .from("availability_rules")
    .delete()
    .eq("trainer_id", me.userId);

  if (rules.length > 0) {
    const rows = rules.map((r) => ({
      trainer_id: me.userId,
      day_of_week: r.day_of_week,
      category: r.category,
      start_time: r.start_time,
      end_time: r.end_time,
      active: true,
    }));
    const { error } = await admin.from("availability_rules").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
