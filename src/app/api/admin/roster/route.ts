/**
 * GET /api/admin/roster?week=YYYY-MM-DD
 *
 * Admin only: the week's active athletes and who has booked (see
 * lib/booking/roster). `week` is any date in the week; it snaps to Monday.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseWeek } from "@/lib/booking/coach-calendar";
import { loadWeekRoster } from "@/lib/booking/roster";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminClient();
  const { data: me } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  try {
    const roster = await loadWeekRoster(admin, parseWeek(request.nextUrl.searchParams.get("week") ?? undefined));
    return NextResponse.json(roster, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error("Roster failed:", e);
    return NextResponse.json({ error: "Couldn’t load the roster." }, { status: 500 });
  }
}
