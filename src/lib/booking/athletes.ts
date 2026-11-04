/**
 * Family accounts: one parent login, several athletes. The account holder
 * is the first athlete (bookings.athlete_id is null for them); brothers
 * and sisters are rows in `athletes` (bookings.athlete_id points there).
 * Credits belong to the account and are shared by everyone on it; a
 * Diamond membership covers one named athlete.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { WAIVER_VERSION } from "@/lib/legal/waiver";

/** How forms, URLs and Stripe metadata name the account holder. */
export const PRIMARY = "primary";

/** Most athletes one account can hold, the holder included. */
export const MAX_FAMILY_SIZE = 8;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type FamilyAthlete = {
  /** PRIMARY for the account holder, else their athletes row id. */
  key: string;
  firstName: string;
  lastName: string | null;
  /** The Participant Agreement is accepted for them at the current version.
   *  Always true for the holder — sign-in already makes them accept it. */
  agreementCurrent: boolean;
};

/** The athlete a booking is for, as the booking routes need them. */
export type BookingAthlete = {
  /** bookings.athlete_id: null for the account holder. */
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  agreementCurrent: boolean;
};

/** The key for a bookings.athlete_id value. */
export function keyOf(athleteId: string | null | undefined): string {
  return athleteId ?? PRIMARY;
}

export function fullName(a: { firstName: string | null; lastName: string | null }): string {
  return `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim();
}

/** Everyone on the account, holder first, then siblings in the order added. */
export async function loadFamily(
  db: SupabaseClient,
  userId: string,
  holder: { first_name: string | null; last_name: string | null; email?: string | null },
): Promise<FamilyAthlete[]> {
  const { data } = await db
    .from("athletes")
    .select("id, first_name, last_name, waiver_version")
    .eq("parent_id", userId)
    .is("archived_at", null)
    .order("created_at");
  return [
    {
      key: PRIMARY,
      firstName: holder.first_name?.trim() || holder.email?.split("@")[0] || "Me",
      lastName: holder.last_name,
      agreementCurrent: true,
    },
    ...(data ?? []).map((a) => ({
      key: a.id,
      firstName: a.first_name,
      lastName: a.last_name,
      agreementCurrent: a.waiver_version === WAIVER_VERSION,
    })),
  ];
}

/**
 * Who a booking request is for: PRIMARY (or nothing) is the account
 * holder; otherwise a sibling on this account who hasn't been removed.
 * Null when the key doesn't name anyone on the account.
 */
export async function bookingAthlete(
  admin: SupabaseClient,
  userId: string,
  key: unknown,
): Promise<BookingAthlete | null> {
  if (key == null || key === "" || key === PRIMARY) {
    const { data } = await admin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", userId)
      .single();
    return {
      id: null,
      firstName: data?.first_name ?? null,
      lastName: data?.last_name ?? null,
      agreementCurrent: true,
    };
  }
  if (typeof key !== "string" || !UUID_RE.test(key)) return null;
  const { data } = await admin
    .from("athletes")
    .select("id, first_name, last_name, waiver_version")
    .eq("id", key)
    .eq("parent_id", userId)
    .is("archived_at", null)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    agreementCurrent: data.waiver_version === WAIVER_VERSION,
  };
}
