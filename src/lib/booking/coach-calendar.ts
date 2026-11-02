/**
 * The coach calendar on My Schedule: one week of each coach's hours,
 * worked out the way the booking page sees them — weekly hours, time
 * off, booked sessions, spots per hour (pitching 2, hitting 1) and solo
 * first pitching sessions. Pure, so the page just feeds it rows.
 */
import { categoryCapacity } from "./slots";
import { STUDIO_TZ, dayOfWeekInZone, zonedWallToUtc } from "./tz";

export type CalCategory = "pitching" | "hitting";

export type CalSession = {
  id: string;
  trainerId: string;
  startsAt: string;
  endsAt: string;
  athleteName: string;
  /** "Jack J." — fits in a calendar cell. */
  shortName: string;
  email: string | null;
  phone: string | null;
  serviceName: string;
  category: CalCategory;
  notes: string | null;
  firstSession: boolean;
  waiverAccepted: boolean;
};

export type CalTimeOff = {
  id: string;
  /** null = the whole studio is closed. */
  trainerId: string | null;
  startsAt: string;
  endsAt: string;
  reason: string | null;
};

export type CalCell = {
  state: "closed" | "open" | "some" | "full" | "off";
  /** The hour is already over. */
  past: boolean;
  sessionIds: string[];
  spotsLeft: number;
  capacity: number;
  /** Full because a first pitching session gets the hour to itself. */
  solo: boolean;
  timeOffId: string | null;
};

export type CalDay = { date: string; weekday: string; dayNum: number; isToday: boolean };
export type CalCoach = { id: string; name: string; first: string; category: CalCategory | null };
export type CalRule = {
  trainer_id: string;
  category: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type CoachCalendarData = {
  weekStart: string;
  /** "Nov 2 – 8" */
  label: string;
  isThisWeek: boolean;
  days: CalDay[];
  /** Hour rows, 0–23 in studio time. */
  hours: number[];
  coaches: CalCoach[];
  /** cells[coachId][date][hour] */
  cells: Record<string, Record<string, Record<string, CalCell>>>;
  sessions: Record<string, CalSession>;
  timeOff: Record<string, CalTimeOff>;
};

const HOUR_MS = 60 * 60 * 1000;

export function todayInStudio(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: STUDIO_TZ });
}

/** Calendar-date math on YYYY-MM-DD strings (noon UTC dodges DST edges). */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week that contains dateStr. */
export function mondayOf(dateStr: string): string {
  return addDays(dateStr, -((dayOfWeekInZone(dateStr) + 6) % 7));
}

/** A ?week= value from the URL, snapped to its Monday; this week if missing or junk. */
export function parseWeek(param: string | undefined, now = new Date()): string {
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param) && !Number.isNaN(Date.parse(`${param}T12:00:00Z`))) {
    return mondayOf(param);
  }
  return mondayOf(todayInStudio(now));
}

/** UTC instants for Monday 00:00 → next Monday 00:00, studio time. */
export function weekBounds(weekStart: string): { start: Date; end: Date } {
  return {
    start: zonedWallToUtc(weekStart, "00:00"),
    end: zonedWallToUtc(addDays(weekStart, 7), "00:00"),
  };
}

function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function studioHour(iso: string): number {
  return Number(
    new Date(iso).toLocaleString("en-US", { timeZone: STUDIO_TZ, hour: "numeric", hourCycle: "h23" }),
  );
}

function utcDay(dateStr: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
}

function weekLabel(weekStart: string): string {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.slice(0, 7) === end.slice(0, 7);
  return `${utcDay(weekStart, { month: "short", day: "numeric" })} – ${utcDay(
    end,
    sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" },
  )}`;
}

export function buildCoachCalendar({
  weekStart,
  coaches,
  rules,
  timeOff,
  sessions,
  now = new Date(),
}: {
  weekStart: string;
  coaches: CalCoach[];
  rules: CalRule[];
  timeOff: CalTimeOff[];
  sessions: CalSession[];
  now?: Date;
}): CoachCalendarData {
  const today = todayInStudio(now);
  const days: CalDay[] = [...Array(7)].map((_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      weekday: utcDay(date, { weekday: "short" }),
      dayNum: Number(date.slice(8, 10)),
      isToday: date === today,
    };
  });

  // Rows run from the earliest opening to the latest closing (or a
  // session a coach added outside their hours).
  let first = 24;
  let last = 0;
  for (const r of rules) {
    first = Math.min(first, Math.floor(minutesOf(r.start_time) / 60));
    last = Math.max(last, Math.ceil(minutesOf(r.end_time) / 60));
  }
  for (const s of sessions) {
    first = Math.min(first, studioHour(s.startsAt));
    last = Math.max(last, studioHour(s.startsAt) + 1);
  }
  if (first >= last) {
    first = 8;
    last = 21;
  }
  const hours = [...Array(last - first)].map((_, i) => first + i);

  const cells: CoachCalendarData["cells"] = {};
  for (const coach of coaches) {
    const coachRules = rules.filter((r) => r.trainer_id === coach.id);
    const coachSessions = sessions.filter((s) => s.trainerId === coach.id);
    const coachOff = timeOff.filter((b) => b.trainerId === coach.id || b.trainerId === null);
    cells[coach.id] = {};

    for (const day of days) {
      const dow = dayOfWeekInZone(day.date);
      const dayRules = coachRules.filter((r) => r.day_of_week === dow);
      const row: Record<string, CalCell> = {};

      for (const h of hours) {
        const start = zonedWallToUtc(day.date, `${String(h).padStart(2, "0")}:00`).getTime();
        const end = start + HOUR_MS;
        const overlaps = (a: string, b: string) => Date.parse(a) < end && Date.parse(b) > start;

        const rule = dayRules.find(
          (r) => minutesOf(r.start_time) < (h + 1) * 60 && minutesOf(r.end_time) > h * 60,
        );
        const here = coachSessions.filter((s) => overlaps(s.startsAt, s.endsAt));
        const off = coachOff.find((b) => overlaps(b.startsAt, b.endsAt));
        const category = rule?.category ?? here[0]?.category ?? coach.category;
        const capacity = categoryCapacity(category);
        const base = { past: end <= now.getTime(), capacity, sessionIds: here.map((s) => s.id) };

        if (here.length > 0) {
          // Same rules as the booking page: a first pitching session or a
          // session of the other kind takes the whole hour.
          const solo = here.some((s) => s.firstSession && s.category === "pitching");
          const full = solo || here.some((s) => s.category !== category) || here.length >= capacity;
          row[String(h)] = {
            ...base,
            state: full ? "full" : "some",
            spotsLeft: full ? 0 : capacity - here.length,
            solo,
            timeOffId: off?.id ?? null,
          };
        } else if (rule && off) {
          row[String(h)] = { ...base, state: "off", spotsLeft: 0, solo: false, timeOffId: off.id };
        } else if (rule) {
          row[String(h)] = { ...base, state: "open", spotsLeft: capacity, solo: false, timeOffId: null };
        } else {
          row[String(h)] = { ...base, state: "closed", spotsLeft: 0, solo: false, timeOffId: null };
        }
      }
      cells[coach.id][day.date] = row;
    }
  }

  return {
    weekStart,
    label: weekLabel(weekStart),
    isThisWeek: weekStart === mondayOf(today),
    days,
    hours,
    coaches,
    cells,
    sessions: Object.fromEntries(sessions.map((s) => [s.id, s])),
    timeOff: Object.fromEntries(timeOff.map((b) => [b.id, b])),
  };
}
