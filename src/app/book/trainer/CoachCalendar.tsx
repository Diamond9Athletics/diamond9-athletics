"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  CalCell,
  CalSession,
  CalTimeOff,
  CoachCalendarData,
} from "@/lib/booking/coach-calendar";
import { AddSessionPanel, type ClientOption, type ServiceOption } from "./AddSessionPanel";
import { MoveBookingButton } from "./MoveBookingButton";
import { TimeOffForm } from "./TimeOffForm";

const TZ = "America/Chicago";

export type AddSessionData = {
  clients: ClientOption[];
  services: ServiceOption[];
  defaultServiceId: string;
};

type Modal =
  | { kind: "session"; id: string }
  | { kind: "timeoff"; id: string }
  | { kind: "add"; date?: string; time?: string }
  | { kind: "block" };

const hourLabel = (h: number) => `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
const wallTime = (h: number) => `${String(h).padStart(2, "0")}:00`;
const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("en-US", { timeZone: TZ, ...opts });
const timeOf = (iso: string) => fmt(iso, { hour: "numeric", minute: "2-digit" });
const shortTime = (iso: string) => timeOf(iso).replace(":00", "");
const studioDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
const clock = (iso: string) => fmt(iso, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dayShort = (iso: string) => `${fmt(iso, { weekday: "short" })} ${fmt(iso, { day: "numeric" })}`;

/** "Fri 6, all day" · "Wed 4, 3 PM – 5 PM" · "Fri 6 – Sun 8, 1 PM" */
function timeOffLabel(startsAt: string, endsAt: string): string {
  // Days are blocked until 23:59 (or the next midnight) — show them as whole days.
  const end = clock(endsAt) === "00:00" ? new Date(Date.parse(endsAt) - 60_000).toISOString() : endsAt;
  const fromMidnight = clock(startsAt) === "00:00";
  const toMidnight = clock(end) === "23:59";
  if (studioDate(startsAt) === studioDate(end)) {
    return fromMidnight && toMidnight
      ? `${dayShort(startsAt)}, all day`
      : `${dayShort(startsAt)}, ${shortTime(startsAt)} – ${shortTime(end)}`;
  }
  return `${dayShort(startsAt)}${fromMidnight ? "" : ` ${shortTime(startsAt)}`} – ${dayShort(end)}${
    toMidnight ? "" : `, ${shortTime(end)}`
  }`;
}

/** Back-to-back day blocks (a trip saved one day at a time) read as one stretch. */
function mergeTimeOff(blocks: CalTimeOff[]): { startsAt: string; endsAt: string }[] {
  const out: { startsAt: string; endsAt: string }[] = [];
  for (const b of [...blocks].sort((x, y) => Date.parse(x.startsAt) - Date.parse(y.startsAt))) {
    const last = out.at(-1);
    if (last && Date.parse(b.startsAt) - Date.parse(last.endsAt) <= 2 * 60_000) {
      if (Date.parse(b.endsAt) > Date.parse(last.endsAt)) last.endsAt = b.endsAt;
    } else {
      out.push({ startsAt: b.startsAt, endsAt: b.endsAt });
    }
  }
  return out;
}

export function CoachCalendar({
  cal,
  team,
  myId,
  canEdit,
  canMove,
  addSession,
  nav,
}: {
  cal: CoachCalendarData;
  /** The owner's all-coaches view: one day, a column per coach. */
  team: boolean;
  myId: string;
  /** Your own schedule: add sessions, block and remove time off. */
  canEdit: boolean;
  canMove: boolean;
  addSession: AddSessionData | null;
  nav: { prev: string; next: string; thisWeek: string | null };
}) {
  const firstDay = cal.days.find((d) => d.isToday)?.date ?? cal.days[0].date;
  const [picked, setPicked] = useState(firstDay);
  // A day picked in another week falls back to this week's first day.
  const day = cal.days.some((d) => d.date === picked) ? picked : firstDay;
  const [modal, setModal] = useState<Modal | null>(null);
  const close = useCallback(() => setModal(null), []);

  const openSession = (id: string) => setModal({ kind: "session", id });
  const openTimeOff = (id: string) => setModal({ kind: "timeoff", id });
  const addAt = canEdit && addSession
    ? (date: string, time: string) => setModal({ kind: "add", date, time })
    : undefined;

  const coachIds = cal.coaches.map((c) => c.id);
  const coachName = (id: string) => cal.coaches.find((c) => c.id === id)?.name ?? "";
  const sessionsList = Object.values(cal.sessions);

  const openSpots = (coachId: string, dates: string[]) =>
    dates.reduce(
      (sum, date) =>
        sum +
        cal.hours.reduce((s, h) => {
          const c = cal.cells[coachId][date][String(h)];
          return s + (!c.past && (c.state === "open" || c.state === "some") ? c.spotsLeft : 0);
        }, 0),
      0,
    );

  const session = modal?.kind === "session" ? cal.sessions[modal.id] : undefined;
  const timeOff = modal?.kind === "timeoff" ? cal.timeOff[modal.id] : undefined;

  return (
    <div>
      {/* Week navigation + your tools */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Link
          href={nav.prev}
          scroll={false}
          aria-label="Previous week"
          className="btn-outline w-9 h-9 rounded-full flex items-center justify-center text-lg leading-none"
        >
          ‹
        </Link>
        <p className="font-display text-2xl sm:text-3xl text-white min-w-[130px] text-center leading-none">
          {cal.label}
        </p>
        <Link
          href={nav.next}
          scroll={false}
          aria-label="Next week"
          className="btn-outline w-9 h-9 rounded-full flex items-center justify-center text-lg leading-none"
        >
          ›
        </Link>
        {nav.thisWeek && (
          <Link
            href={nav.thisWeek}
            scroll={false}
            className="text-[#b07adf] hover:underline text-[11px] tracking-widest font-bold ml-1"
          >
            THIS WEEK
          </Link>
        )}
        <span className="flex-1" />
        {addAt && (
          <button
            type="button"
            onClick={() => setModal({ kind: "add" })}
            className="btn-gold px-4 py-2 rounded-full text-[11px] tracking-widest font-black"
          >
            + ADD SESSION
          </button>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={() => setModal({ kind: "block" })}
            className="btn-outline px-4 py-2 rounded-full text-[11px] tracking-widest font-bold"
          >
            BLOCK TIME OFF
          </button>
        )}
      </div>

      {team ? (
        <>
          <DateStrip cal={cal} coachIds={coachIds} date={day} onPick={setPicked} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {cal.coaches.map((c) => (
              <Stat
                key={c.id}
                label={c.name.toUpperCase()}
                value={`${sessionsList.filter((s) => s.trainerId === c.id && studioDate(s.startsAt) === day).length} booked · ${openSpots(c.id, [day])} open spots`}
              />
            ))}
          </div>
          <div className="card-modern rounded-2xl p-2 sm:p-4">
            <TeamDay
              cal={cal}
              date={day}
              onSession={openSession}
              onTimeOff={openTimeOff}
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            <Stat label="SESSIONS" value={String(sessionsList.length)} />
            <Stat
              label="OPEN SPOTS"
              value={String(openSpots(cal.coaches[0].id, cal.days.map((d) => d.date)))}
            />
            <Stat
              label="TIME OFF"
              value={
                mergeTimeOff(Object.values(cal.timeOff))
                  .map((b) => timeOffLabel(b.startsAt, b.endsAt))
                  .join(" · ") || "None"
              }
              small
            />
          </div>
          <div className="hidden lg:block card-modern rounded-2xl p-4">
            <WeekGrid
              cal={cal}
              coachId={cal.coaches[0].id}
              onSession={openSession}
              onTimeOff={openTimeOff}
              onAdd={addAt}
            />
          </div>
          <div className="lg:hidden">
            <DateStrip cal={cal} coachIds={coachIds} date={day} onPick={setPicked} />
            <DayList
              cal={cal}
              coachId={cal.coaches[0].id}
              date={day}
              onSession={openSession}
              onTimeOff={openTimeOff}
              onAdd={addAt}
            />
          </div>
        </>
      )}

      <Legend />

      {session && (
        <Modal label={`Session with ${session.athleteName}`} onClose={close}>
          <SessionDetail
            s={session}
            coachName={team ? coachName(session.trainerId) : null}
            canMove={canMove}
            onClose={close}
          />
        </Modal>
      )}
      {timeOff && (
        <Modal label="Time off" onClose={close}>
          <TimeOffDetail
            b={timeOff}
            canRemove={canEdit && timeOff.trainerId === myId}
            onClose={close}
          />
        </Modal>
      )}
      {modal?.kind === "add" && addSession && (
        <Modal label="Add a session" onClose={close}>
          <AddSessionPanel
            {...addSession}
            initialDate={modal.date}
            initialTime={modal.time}
            onClose={close}
          />
        </Modal>
      )}
      {modal?.kind === "block" && (
        <Modal label="Block time off" onClose={close}>
          <TimeOffForm defaultDate={day} onClose={close} />
        </Modal>
      )}
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="card-modern rounded-xl px-3 sm:px-4 py-3 min-w-0">
      <p className="text-zinc-500 text-[10px] tracking-widest font-bold truncate">{label}</p>
      <p className={`text-white font-bold mt-0.5 leading-snug ${small ? "text-xs sm:text-sm" : "text-lg sm:text-xl"}`}>
        {value}
      </p>
    </div>
  );
}

/** One hour for one coach. Names open the session; open hours add one (your own calendar). */
function Cell({
  cell,
  cal,
  label,
  onSession,
  onTimeOff,
  onAdd,
}: {
  cell: CalCell;
  cal: CoachCalendarData;
  /** Time-off reason, shown on the first hour of a stretch. */
  label: string | null;
  onSession: (id: string) => void;
  onTimeOff: (id: string) => void;
  onAdd?: () => void;
}) {
  const box = "rounded-lg min-h-[48px] w-full p-1.5 text-left text-[11px] leading-tight";
  const dim = cell.past ? " opacity-50" : "";

  if (cell.state === "closed") return <div className="min-h-[48px]" />;

  if (cell.state === "off") {
    return (
      <button
        type="button"
        onClick={() => cell.timeOffId && onTimeOff(cell.timeOffId)}
        className={`${box} bg-amber-500/10 border border-amber-500/25 text-amber-500 font-bold${dim}`}
      >
        {label}
      </button>
    );
  }

  if (cell.state === "open") {
    if (cell.past) return <div className={`${box} border border-dashed border-zinc-800`} />;
    if (!onAdd) return <div className={`${box} border border-zinc-800 bg-zinc-900/40`} />;
    return (
      <button
        type="button"
        onClick={onAdd}
        aria-label="Add a session at this hour"
        className={`group ${box} border border-zinc-800 bg-zinc-900/40 hover:border-[#9954d2]/60 hover:bg-[#9954d2]/10 transition-colors`}
      >
        <span className="text-[10px] tracking-widest font-bold text-[#b07adf] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
          + ADD
        </span>
      </button>
    );
  }

  const full = cell.state === "full";
  return (
    <div className={`${box} ${full ? "bg-[#9954d2]" : "bg-[#9954d2]/15 border border-[#9954d2]/40"}${dim}`}>
      {cell.sessionIds.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onSession(id)}
          className={`block w-full truncate text-left font-bold hover:underline ${full ? "text-black" : "text-white"}`}
        >
          {cal.sessions[id]?.shortName ?? "Session"}
        </button>
      ))}
      {cell.solo ? (
        <span className="block text-[10px] tracking-widest font-black text-black/70 mt-0.5">SOLO · 1ST</span>
      ) : full ? null : onAdd && !cell.past ? (
        <button type="button" onClick={onAdd} className="text-[10px] text-[#b07adf] hover:underline">
          + {cell.spotsLeft} spot left
        </button>
      ) : (
        <span className="text-[10px] text-[#b07adf]">{cell.spotsLeft} spot left</span>
      )}
    </div>
  );
}

function offLabel(cal: CoachCalendarData, cell: CalCell, prev: CalCell | null): string | null {
  if (cell.state !== "off") return null;
  if (prev?.state === "off" && prev.timeOffId === cell.timeOffId) return null;
  return (cell.timeOffId && cal.timeOff[cell.timeOffId]?.reason) || "Time off";
}

/** Computer: the whole week for one coach, hours down the side. */
function WeekGrid({
  cal,
  coachId,
  onSession,
  onTimeOff,
  onAdd,
}: {
  cal: CoachCalendarData;
  coachId: string;
  onSession: (id: string) => void;
  onTimeOff: (id: string) => void;
  onAdd?: (date: string, time: string) => void;
}) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: "52px repeat(7, minmax(0, 1fr))" }}>
      <div />
      {cal.days.map((d) => (
        <div key={d.date} className="text-center pb-1">
          <span className={`block text-[10px] tracking-widest font-bold ${d.isToday ? "text-[#b07adf]" : "text-zinc-500"}`}>
            {d.weekday.toUpperCase()}
            {d.isToday ? " · TODAY" : ""}
          </span>
          <span className={`block font-display text-2xl leading-none ${d.isToday ? "text-[#b07adf]" : "text-white"}`}>
            {d.dayNum}
          </span>
        </div>
      ))}
      {cal.hours.map((h, i) => (
        <Fragment key={h}>
          <div className="text-zinc-500 text-[10px] text-right pr-2 pt-1.5">{hourLabel(h)}</div>
          {cal.days.map((d) => {
            const cell = cal.cells[coachId][d.date][String(h)];
            const prev = i > 0 ? cal.cells[coachId][d.date][String(cal.hours[i - 1])] : null;
            return (
              <Cell
                key={d.date}
                cell={cell}
                cal={cal}
                label={offLabel(cal, cell, prev)}
                onSession={onSession}
                onTimeOff={onTimeOff}
                onAdd={onAdd ? () => onAdd(d.date, wallTime(h)) : undefined}
              />
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

/** Owner: one day, a column per coach. */
function TeamDay({
  cal,
  date,
  onSession,
  onTimeOff,
}: {
  cal: CoachCalendarData;
  date: string;
  onSession: (id: string) => void;
  onTimeOff: (id: string) => void;
}) {
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `44px repeat(${cal.coaches.length}, minmax(0, 1fr))` }}
    >
      <div />
      {cal.coaches.map((c) => (
        <div key={c.id} className="text-center pb-1">
          <span className="block text-white text-sm font-bold truncate">{c.first}</span>
          <span className="block text-zinc-500 text-[10px] tracking-widest font-bold">
            {(c.category ?? "").toUpperCase()}
          </span>
        </div>
      ))}
      {cal.hours.map((h, i) => (
        <Fragment key={h}>
          <div className="text-zinc-500 text-[10px] text-right pr-1.5 pt-1.5">{hourLabel(h)}</div>
          {cal.coaches.map((c) => {
            const cell = cal.cells[c.id][date][String(h)];
            const prev = i > 0 ? cal.cells[c.id][date][String(cal.hours[i - 1])] : null;
            return (
              <Cell
                key={c.id}
                cell={cell}
                cal={cal}
                label={offLabel(cal, cell, prev)}
                onSession={onSession}
                onTimeOff={onTimeOff}
              />
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

/** The week's days as buttons; each shows how many are booked (or OFF). */
function DateStrip({
  cal,
  coachIds,
  date,
  onPick,
}: {
  cal: CoachCalendarData;
  coachIds: string[];
  date: string;
  onPick: (date: string) => void;
}) {
  const sessions = Object.values(cal.sessions);
  return (
    <div className="grid grid-cols-7 gap-1 mb-4">
      {cal.days.map((d) => {
        const count = sessions.filter((s) => studioDate(s.startsAt) === d.date).length;
        const working = coachIds
          .flatMap((id) => Object.values(cal.cells[id][d.date]))
          .filter((c) => c.state !== "closed");
        const allOff = working.length > 0 && working.every((c) => c.state === "off");
        const sel = d.date === date;
        return (
          <button
            key={d.date}
            type="button"
            onClick={() => onPick(d.date)}
            aria-pressed={sel}
            aria-label={`${d.weekday} ${d.dayNum}: ${allOff ? "time off" : `${count} booked`}`}
            className={`rounded-xl py-2 text-center transition-colors ${
              sel
                ? "bg-[#9954d2]"
                : `bg-zinc-900/40 border ${d.isToday ? "border-[#9954d2]/60" : "border-zinc-800"}`
            }`}
          >
            <span className={`block text-[10px] tracking-widest font-bold ${sel ? "text-black" : "text-zinc-500"}`}>
              {d.weekday.toUpperCase()}
            </span>
            <span className={`block font-display text-2xl leading-none ${sel ? "text-black" : "text-white"}`}>
              {d.dayNum}
            </span>
            <span
              className={`block text-[10px] font-bold mt-0.5 ${
                sel ? "text-black/70" : allOff ? "text-amber-500" : "text-[#b07adf]"
              }`}
            >
              {allOff ? "OFF" : count || "·"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type DayRow =
  | { kind: "open"; from: number; to: number; spots: number }
  | { kind: "off"; from: number; to: number; timeOffId: string | null }
  | { kind: "booked"; h: number; cell: CalCell };

/** Phone: one coach's day, open stretches folded into one line. */
function DayList({
  cal,
  coachId,
  date,
  onSession,
  onTimeOff,
  onAdd,
}: {
  cal: CoachCalendarData;
  coachId: string;
  date: string;
  onSession: (id: string) => void;
  onTimeOff: (id: string) => void;
  onAdd?: (date: string, time: string) => void;
}) {
  const rows: DayRow[] = [];
  let working = false;
  for (const h of cal.hours) {
    const cell = cal.cells[coachId][date][String(h)];
    if (cell.state === "closed") continue;
    working = true;
    if (cell.past && (cell.state === "open" || cell.state === "off")) continue;
    const last = rows.at(-1);
    if (cell.state === "open") {
      if (last?.kind === "open" && last.to === h - 1 && last.spots === cell.spotsLeft) last.to = h;
      else rows.push({ kind: "open", from: h, to: h, spots: cell.spotsLeft });
    } else if (cell.state === "off") {
      if (last?.kind === "off" && last.to === h - 1 && last.timeOffId === cell.timeOffId) last.to = h;
      else rows.push({ kind: "off", from: h, to: h, timeOffId: cell.timeOffId });
    } else {
      rows.push({ kind: "booked", h, cell });
    }
  }

  if (rows.length === 0) {
    return (
      <p className="card-modern rounded-2xl p-6 text-center text-zinc-500 text-sm">
        {working ? "That’s everything for this day." : "No hours on this day."}
      </p>
    );
  }

  const span = (from: number, to: number) =>
    from === to ? hourLabel(from) : `${hourLabel(from)} – ${hourLabel(to + 1)}`;

  return (
    <ul className="card-modern rounded-2xl divide-y divide-zinc-800 overflow-hidden">
      {rows.map((r) => {
        if (r.kind === "open") {
          return (
            <li key={`o${r.from}`} className="flex items-center gap-3 px-4 py-3">
              <span className="w-28 shrink-0 text-zinc-400 text-sm">{span(r.from, r.to)}</span>
              <span className="flex-1 text-zinc-500 text-sm">
                Open · {r.spots} spot{r.spots === 1 ? "" : "s"}
                {r.from === r.to ? "" : " each hour"}
              </span>
              {onAdd && (
                <button
                  type="button"
                  onClick={() => onAdd(date, wallTime(r.from))}
                  className="text-[#b07adf] text-[10px] tracking-widest font-bold shrink-0"
                >
                  + ADD
                </button>
              )}
            </li>
          );
        }
        if (r.kind === "off") {
          return (
            <li key={`t${r.from}`}>
              <button
                type="button"
                onClick={() => r.timeOffId && onTimeOff(r.timeOffId)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left bg-amber-500/10"
              >
                <span className="w-28 shrink-0 text-amber-500 text-sm">{span(r.from, r.to)}</span>
                <span className="flex-1 text-amber-500 text-sm font-bold">
                  {(r.timeOffId && cal.timeOff[r.timeOffId]?.reason) || "Time off"}
                </span>
              </button>
            </li>
          );
        }
        const { cell } = r;
        const full = cell.state === "full";
        return (
          <li key={`b${r.h}`} className={`flex items-start gap-3 px-4 py-3${cell.past ? " opacity-50" : ""}`}>
            <span className="w-28 shrink-0 text-white text-sm font-bold">{hourLabel(r.h)}</span>
            <span className="flex-1 min-w-0">
              {cell.sessionIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSession(id)}
                  className="block max-w-full truncate text-left text-white text-sm hover:text-[#b07adf]"
                >
                  {cal.sessions[id]?.athleteName ?? "Session"}
                </button>
              ))}
            </span>
            <span className="shrink-0 flex flex-col items-end gap-1">
              <span
                className={`text-[10px] tracking-widest font-black px-2 py-0.5 rounded-full ${
                  full ? "bg-[#9954d2] text-black" : "bg-[#9954d2]/15 text-[#b07adf]"
                }`}
              >
                {cell.solo ? "SOLO · 1ST" : full ? "FULL" : `${cell.spotsLeft} SPOT LEFT`}
              </span>
              {!full && onAdd && !cell.past && (
                <button
                  type="button"
                  onClick={() => onAdd(date, wallTime(r.h))}
                  className="text-[#b07adf] text-[10px] tracking-widest font-bold"
                >
                  + ADD
                </button>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Legend() {
  const sw = "inline-block w-3 h-3 rounded align-[-2px] mr-1.5";
  return (
    <div className="mt-4 text-zinc-500 text-[11px] space-y-1.5">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <span><i className={`${sw} border border-zinc-800 bg-zinc-900/40`} />Open</span>
        <span><i className={`${sw} bg-[#9954d2]/15 border border-[#9954d2]/40`} />Booked, spot left</span>
        <span><i className={`${sw} bg-[#9954d2]`} />Full</span>
        <span><i className={`${sw} bg-amber-500/10 border border-amber-500/25`} />Time off</span>
        <span><i className={`${sw} border border-dashed border-zinc-800`} />Already happened</span>
      </div>
      <p>
        Pitching hours hold 2 athletes, hitting 1. SOLO · 1ST is an athlete&rsquo;s first pitching
        session — they get the hour to themselves.
      </p>
    </div>
  );
}

function Modal({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 p-3 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-zinc-950"
      >
        {children}
      </div>
    </div>
  );
}

function SessionDetail({
  s,
  coachName,
  canMove,
  onClose,
}: {
  s: CalSession;
  coachName: string | null;
  canMove: boolean;
  onClose: () => void;
}) {
  return (
    <div className="card-modern rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[#b07adf] text-[10px] tracking-widest font-bold">
            {fmt(s.startsAt, { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}
          </p>
          <p className="font-display text-4xl text-white leading-none mt-1.5 break-words">
            {s.athleteName}
          </p>
          <p className="text-zinc-400 text-sm mt-2">
            {timeOf(s.startsAt)} – {timeOf(s.endsAt)} · {s.serviceName}
            {coachName ? ` · with ${coachName}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 text-[10px] tracking-widest font-bold shrink-0"
        >
          CLOSE
        </button>
      </div>

      {s.firstSession && s.category === "pitching" && (
        <p className="text-[#b07adf] text-xs bg-[#9954d2]/10 border border-[#9954d2]/25 rounded-lg px-3 py-2">
          First pitching session — they get the hour to themselves.
        </p>
      )}
      {!s.waiverAccepted && (
        <p className="text-amber-500 text-xs bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
          Hasn&rsquo;t accepted the Participant Agreement yet.
        </p>
      )}

      {(s.email || s.phone) && (
        <div className="space-y-1.5 text-sm">
          {s.phone && (
            <a href={`tel:${s.phone}`} className="block text-zinc-300 hover:text-[#b07adf]">
              {s.phone}
            </a>
          )}
          {s.email && (
            <a href={`mailto:${s.email}`} className="block text-zinc-300 hover:text-[#b07adf] break-all">
              {s.email}
            </a>
          )}
        </div>
      )}

      {s.notes && (
        <p className="text-zinc-400 text-sm border-l-2 border-[#9954d2]/40 pl-3">{s.notes}</p>
      )}

      {canMove && (
        <div className="border-t border-zinc-800 pt-4 flex items-center justify-between gap-3">
          <span className="text-zinc-500 text-[10px] tracking-widest font-bold">CHANGE THE TIME</span>
          {/* Remount after a move so the picker starts from the new time. */}
          <MoveBookingButton key={s.startsAt} bookingId={s.id} startsAtIso={s.startsAt} />
        </div>
      )}
    </div>
  );
}

function TimeOffDetail({
  b,
  canRemove,
  onClose,
}: {
  b: CalTimeOff;
  canRemove: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/trainer/blocks?id=${encodeURIComponent(b.id)}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Couldn't remove it. Try again.");
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div className="card-modern rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-amber-500 text-[10px] tracking-widest font-bold">TIME OFF</p>
          <p className="font-display text-4xl text-white leading-none mt-1.5 break-words">
            {b.reason || "Time off"}
          </p>
          <p className="text-zinc-400 text-sm mt-2">
            {timeOffLabel(b.startsAt, b.endsAt)}
            {b.trainerId === null ? " · whole studio" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 text-[10px] tracking-widest font-bold shrink-0"
        >
          CLOSE
        </button>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="btn-outline px-5 py-2.5 rounded-full text-[11px] tracking-widest font-bold disabled:opacity-60"
        >
          {busy ? "REMOVING…" : "REMOVE THIS TIME OFF"}
        </button>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
