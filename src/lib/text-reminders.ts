/**
 * Text reminders: who said yes, to which number, and when.
 *
 * The choice is kept in the account's app_metadata.sms, which only the
 * server can write, so there's a record if a phone carrier ever asks.
 * A yes only counts for the number it was given with: a new number needs
 * a new yes.
 */

export type TextConsentSource = "signup" | "booking" | "profile";

export type TextConsent = {
  reminders: boolean;
  phone: string | null;
  at: string;
  source: TextConsentSource;
  ip?: string;
};

export function readTextConsent(
  appMetadata: Record<string, unknown> | null | undefined,
): TextConsent | null {
  const sms = appMetadata?.sms;
  if (!sms || typeof sms !== "object") return null;
  return sms as TextConsent;
}

/** Whether this account said yes to text reminders at this number. */
export function textRemindersOn(
  appMetadata: Record<string, unknown> | null | undefined,
  phone: string | null | undefined,
): boolean {
  const consent = readTextConsent(appMetadata);
  return Boolean(consent?.reminders && phone && consent.phone === phone);
}
