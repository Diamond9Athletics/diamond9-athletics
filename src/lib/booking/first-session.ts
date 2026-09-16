/**
 * First-pitching-session policy.
 *
 * The first pitching booking any athlete has ever made is a solo slot —
 * they get the whole slot to themselves, and no one else can join it.
 *
 * This is derived purely from booking history; no schema column is
 * needed. Anything that treats bookings as "shared" (up to the cap)
 * must consult this to promote first-sessions into hard blocks.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** Returns the set of user_ids whose *earliest ever* confirmed pitching
 *  booking is on or before `maxStart`. Used to decide whether one of
 *  today's overlapping pitching bookings is a first-timer's solo slot. */
export async function firstPitchingBookingUsers(
  admin: SupabaseClient,
  userIds: string[],
  maxStart: Date,
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  // For each user, pull their earliest confirmed pitching booking on or
  // before `maxStart`. If that earliest one is ON `maxStart`, they're a
  // first-timer that day; if it's earlier, they aren't. We fetch a
  // small window and reduce in memory.
  const { data } = await admin
    .from("bookings")
    .select("user_id, starts_at, service:services!inner(category)")
    .in("user_id", userIds)
    .eq("service.category", "pitching")
    .eq("status", "confirmed")
    .lte("starts_at", maxStart.toISOString())
    .order("starts_at", { ascending: true });

  const earliestByUser = new Map<string, string>();
  for (const row of data ?? []) {
    if (!earliestByUser.has(row.user_id)) {
      earliestByUser.set(row.user_id, row.starts_at);
    }
  }

  const result = new Set<string>();
  for (const [uid, earliest] of earliestByUser) {
    if (new Date(earliest).getTime() === maxStart.getTime()) result.add(uid);
  }
  return result;
}

/** Would this specific booking be the given user's first pitching
 *  session? True iff they have no confirmed pitching booking with a
 *  starts_at strictly earlier than `newStart`. */
export async function wouldBeFirstPitching(
  admin: SupabaseClient,
  userId: string,
  newStart: Date,
): Promise<boolean> {
  const { data } = await admin
    .from("bookings")
    .select("id, service:services!inner(category)")
    .eq("user_id", userId)
    .eq("service.category", "pitching")
    .eq("status", "confirmed")
    .lt("starts_at", newStart.toISOString())
    .limit(1);
  return !data || data.length === 0;
}
