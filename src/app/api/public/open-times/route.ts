import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { openSlotsByDay } from "@/lib/booking/open-slots";
import { MIN_BOOKING_LEAD_HOURS } from "@/lib/booking/policy";
import { addDays, todayInStudio } from "@/lib/booking/coach-calendar";

/** Plan sessions are 60 minutes. */
const SESSION_MIN = 60;
const DAYS = 7;

/**
 * GET /api/public/open-times?category=pitching|hitting
 *
 * This week's open times for the plan pages, so visitors can see there's
 * room before they make an account. Times only, nothing about who booked
 * what. Counted the way a brand-new athlete would book: at least the
 * booking lead ahead, and only times nobody has booked yet (a first
 * pitching session is one-on-one).
 * → { coaches: [{ name, slug, days: [{ date, slots: [ISO…] }] }] }
 */
export async function GET(request: NextRequest) {
  const category = new URL(request.url).searchParams.get("category");
  if (category !== "pitching" && category !== "hitting") {
    return NextResponse.json({ error: "Pick pitching or hitting." }, { status: 400 });
  }

  // Bookings and coach hours aren't readable without signing in, so the
  // server's key reads them; only open times leave this route.
  const admin = createAdminClient();
  const { data: coaches } = await admin
    .from("profiles")
    .select("id, first_name, trainer_slug")
    .eq("is_trainer", true)
    .contains("trainer_categories", [category]);

  const from = todayInStudio();
  const out = await Promise.all(
    (coaches ?? []).map(async (c) => {
      const byDay = await openSlotsByDay({
        db: admin,
        admin,
        trainerId: c.id,
        fromDate: from,
        toDate: addDays(from, DAYS - 1),
        durationMin: SESSION_MIN,
        category,
        ruleCategories: [category],
        leadHours: MIN_BOOKING_LEAD_HOURS,
        emptyOnly: true,
      });
      return {
        name: c.first_name ?? "Coach",
        slug: c.trainer_slug,
        days: [...byDay]
          .filter(([, d]) => d.slots.length > 0)
          .map(([date, d]) => ({ date, slots: d.slots.map((s) => s.toISOString()) })),
      };
    }),
  );

  return NextResponse.json(
    { coaches: out },
    // Shared by every visitor: a couple of minutes old is fine.
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } },
  );
}
