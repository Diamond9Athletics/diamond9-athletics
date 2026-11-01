/**
 * Participant Agreement (liability waiver + equipment responsibility).
 *
 * Acceptances live in each user's Supabase app_metadata under
 * `waivers[<version>]`. app_metadata is server-writable only, so a user
 * can't fake an acceptance, and it comes back fresh on every
 * auth.getUser() call — gating costs no extra query.
 *
 * Changing the agreement text = bump WAIVER_VERSION, and everyone is
 * asked to accept again on their next visit.
 */
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export const WAIVER_VERSION = "2026-11-01";
export const WAIVER_VERSION_LABEL = "November 1, 2026";

export type WaiverRecord = {
  acceptedAt: string;
  role: "athlete" | "guardian";
  guardianName?: string;
  ip?: string;
  userAgent?: string;
};

export function waiverRecord(
  user: Pick<User, "app_metadata"> | null | undefined,
): WaiverRecord | null {
  const waivers = user?.app_metadata?.waivers as
    | Record<string, WaiverRecord>
    | undefined;
  return waivers?.[WAIVER_VERSION] ?? null;
}

export function hasAcceptedWaiver(
  user: Pick<User, "app_metadata"> | null | undefined,
): boolean {
  return waiverRecord(user) !== null;
}

/** Staff (trainers/admins) never have to accept the athlete agreement. */
async function isStaff(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("is_trainer, is_admin")
    .eq("id", userId)
    .single();
  return Boolean(data?.is_trainer || data?.is_admin);
}

/** True when this user still needs to accept before booking. */
export async function needsWaiver(supabase: SupabaseClient, user: User) {
  if (hasAcceptedWaiver(user)) return false;
  return !(await isStaff(supabase, user.id));
}

/**
 * Server-component gate: sends athletes who haven't accepted the current
 * agreement to /book/waiver, then back to `nextPath` once they accept.
 */
export async function requireWaiver(
  supabase: SupabaseClient,
  user: User,
  nextPath: string,
) {
  if (await needsWaiver(supabase, user)) {
    redirect(`/book/waiver?next=${encodeURIComponent(nextPath)}`);
  }
}
