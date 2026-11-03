/**
 * Cancellation policy. Cancel or reschedule at least this long before a
 * session and it's free (credit back). Closer than that it's a late
 * cancellation: credit users don't get the credit back, and for Diamond
 * members the session still counts toward their 12 a month. Coaches and
 * admins acting on someone else's booking are never charged.
 */
export const FREE_CANCEL_HOURS = 24;

/** Status for a late cancellation — not active, but it counts as used. */
export const LATE_CANCELLED = "late_cancelled";

export function isLateCancel(startsAt: string | Date, now = Date.now()): boolean {
  return new Date(startsAt).getTime() - now < FREE_CANCEL_HOURS * 60 * 60 * 1000;
}

/** Last moment a booking can be changed for free. */
export function freeCancelDeadline(startsAt: string | Date): Date {
  return new Date(new Date(startsAt).getTime() - FREE_CANCEL_HOURS * 60 * 60 * 1000);
}
