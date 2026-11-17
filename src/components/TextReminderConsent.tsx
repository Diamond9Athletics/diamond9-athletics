import Link from "next/link";

/**
 * The text-reminder opt-in. Never checked for someone ahead of time, and
 * the fine print is what phone carriers look for before they approve a
 * business number: who's texting, what about, how often, the cost
 * notice, STOP/HELP, and links to the terms and privacy policy.
 */
export function TextReminderConsent({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-2.5 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-[#9954d2] shrink-0"
      />
      <span>
        <span className="block text-zinc-200 text-sm">Text me a reminder before each session</span>
        <span className="block text-zinc-500 text-xs leading-relaxed mt-1">
          Diamond Nine Athletics will text reminders for sessions you book, about one per
          session. Msg &amp; data rates may apply. Reply STOP to cancel, HELP for help. Not
          required to book. See our{" "}
          <Link href="/terms" target="_blank" className="text-[#b07adf] hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="text-[#b07adf] hover:underline">
            Privacy Policy
          </Link>
          .
        </span>
      </span>
    </label>
  );
}
