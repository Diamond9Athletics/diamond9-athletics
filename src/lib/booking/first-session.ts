/**
 * First-pitching-session policy.
 *
 * The first pitching booking any athlete has ever made is a solo slot —
 * they get the whole slot to themselves, and no one else can join it.
 * "Athlete" means the account's own athlete or a sibling on a family
 * account (bookings.athlete_id), so each sibling gets their own first.
 *
 * This is derived purely from booking history; no schema column is
 * needed. Anything that treats bookings as "shared" (up to the cap)
 * must consult this to promote first-sessions into hard blocks.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** Who a booking is for: the account's own athlete, or a sibling on it. */
export function athleteKey(userId: string, athleteId: string | null | undefined): string {
  return `${userId}:${athleteId ?? "primary"}`;
}

/** The id of each athlete's earliest-ever confirmed pitching booking — their
 *  solo first session. Pass the account ids whose bookings you care about. */
export async function firstPitchingBookingIds(
  admin: SupabaseClient,
  userIds: string[],
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const { data } = await admin
    .from("bookings")
    .select("id, user_id, athlete_id, starts_at, service:services!inner(category)")
    .in("user_id", userIds)
    .eq("service.category", "pitching")
    .eq("status", "confirmed")
    .order("starts_at", { ascending: true });

  const seen = new Set<string>();
  const ids = new Set<string>();
  for (const row of data ?? []) {
    const key = athleteKey(row.user_id, row.athlete_id);
    if (seen.has(key)) continue;
    seen.add(key);
    ids.add(row.id);
  }
  return ids;
}

/** Would a booking at `newStart` be this athlete's first pitching session?
 *  True iff they have no confirmed pitching booking that starts earlier —
 *  not counting `replacingId`, a booking being rescheduled. */
export async function wouldBeFirstPitching(
  admin: SupabaseClient,
  userId: string,
  newStart: Date,
  athleteId: string | null = null,
  replacingId: string | null = null,
): Promise<boolean> {
  let query = admin
    .from("bookings")
    .select("id, service:services!inner(category)")
    .eq("user_id", userId)
    .eq("service.category", "pitching")
    .eq("status", "confirmed")
    .lt("starts_at", newStart.toISOString());
  query = athleteId ? query.eq("athlete_id", athleteId) : query.is("athlete_id", null);
  if (replacingId) query = query.neq("id", replacingId);
  const { data } = await query.limit(1);
  return !data || data.length === 0;
}
