import { googleCalendarUrl } from "@/lib/booking/calendar-links";

/**
 * "Add to calendar" for one booked session: Google Calendar, or the .ics
 * file (Apple Calendar on an iPhone opens it straight in; Outlook too).
 * Plain HTML, no script needed.
 */
export function AddToCalendar({
  bookingId,
  startsAt,
  endsAt,
  serviceName,
  trainerName,
  open = false,
}: {
  bookingId: string;
  startsAt: string;
  endsAt: string;
  serviceName: string;
  trainerName: string;
  /** Start opened, e.g. right after booking. */
  open?: boolean;
}) {
  return (
    <details className="group" open={open}>
      <summary className="no-marker list-none cursor-pointer inline-flex items-center gap-1 min-h-[44px] text-zinc-400 hover:text-white text-[13px]">
        Add to calendar
        <span aria-hidden="true" className="transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="flex flex-wrap gap-2 pb-2">
        <a
          href={googleCalendarUrl(serviceName, trainerName, { startsAtIso: startsAt, endsAtIso: endsAt })}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline px-4 py-2.5 rounded-full text-[13px]"
        >
          Google
        </a>
        <a
          href={`/api/booking/ics?id=${bookingId}`}
          className="btn-outline px-4 py-2.5 rounded-full text-[13px]"
        >
          Apple / Outlook
        </a>
      </div>
    </details>
  );
}
