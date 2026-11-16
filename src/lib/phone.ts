/**
 * Phone numbers are U.S. only and stored as "(512) 555-0123", so every
 * screen shows them the same way. Safe to use in the browser.
 */

/** "(512) 555-0123" for a valid U.S. number typed any way; null if it isn't one. */
export function formatUsPhone(raw: string | null | undefined): string | null {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  // Area codes and exchanges never start with 0 or 1.
  if (/^[01]/.test(digits) || /^[01]/.test(digits.slice(3))) return null;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** The number for tel: and sms: links: "+15125550123". */
export function phoneLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits;
}
