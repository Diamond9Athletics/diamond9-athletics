"use client";

import { useCallback, useEffect, useState } from "react";
import type { RosterAthlete, RosterCategory, WeekRoster as Roster } from "@/lib/booking/roster";
import { formatUsPhone, phoneLink } from "@/lib/phone";

const TZ = "America/Chicago";
const BOOK_URL = "https://www.diamond9athletics.com/book";
type Filter = "all" | RosterCategory;

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("en-US", { timeZone: TZ, ...opts });
const dayTime = (iso: string) => fmt(iso, { weekday: "short", hour: "numeric", minute: "2-digit" }).replace(":00", "");
const shortDate = (iso: string) => fmt(iso, { month: "short", day: "numeric" });
/** "Nov 23" for a YYYY-MM-DD date. */
const weekLabel = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" });

function textHref(phone: string, body?: string) {
  // "?&body=" opens with the message filled in on both iPhone and Android.
  return `sms:${phoneLink(phone)}${body ? `?&body=${encodeURIComponent(body)}` : ""}`;
}

/** "2 pitching sessions left", "1 pitching + 1 hitting sessions left". */
function sessionsLeftLabel(a: RosterAthlete): string | null {
  const kinds = (["pitching", "hitting"] as const).filter((c) => (a.sessionsLeft[c] ?? 0) > 0);
  if (!kinds.length) return null;
  const total = kinds.reduce((n, c) => n + (a.sessionsLeft[c] ?? 0), 0);
  return `${kinds.map((c) => `${a.sessionsLeft[c]} ${c}`).join(" + ")} ${total === 1 ? "session" : "sessions"} left`;
}

/** Save a phone number for an account that has none (or fix one). */
function AddPhone({ accountId, onDone }: { accountId: string; onDone: (phone: string | null) => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const phone = formatUsPhone(value);
    if (!phone) {
      setErr("Enter a 10-digit U.S. number.");
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/admin/athlete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: accountId, action: "set_phone", phone }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) {
      setErr(json?.error ?? "Couldn’t save it. Try again.");
      return;
    }
    onDone(json?.phone ?? phone);
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-1.5">
      <input
        type="tel"
        inputMode="tel"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="(512) 555-0123"
        aria-label="Phone number"
        className="w-36 bg-white/[0.03] border border-white/10 focus:border-[#a97ce2]/60 text-white text-sm px-3 py-2 rounded-full outline-none placeholder:text-zinc-600"
      />
      <button type="submit" disabled={busy} className="btn-gold px-3.5 py-2 rounded-full text-[13px] disabled:opacity-60">
        {busy ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={() => onDone(null)} disabled={busy} aria-label="Cancel" className="text-zinc-500 hover:text-white px-2 py-2 text-sm">
        ✕
      </button>
      {err && <span className="basis-full text-red-400 text-xs">{err}</span>}
    </form>
  );
}

async function fetchRoster(weekStart: string): Promise<Roster | null> {
  const res = await fetch(`/api/admin/roster?week=${weekStart}`, { cache: "no-store" }).catch(() => null);
  return res?.ok ? ((await res.json().catch(() => null)) as Roster | null) : null;
}

/**
 * Admin, under the calendar: this week's active athletes, split into who
 * still needs a time and who's booked, each a tap away from a text.
 * Keyed by week where it's used, so changing weeks starts fresh.
 */
export function WeekRoster({ weekStart, adminFirstName }: { weekStart: string; adminFirstName: string }) {
  const [roster, setRoster] = useState<Roster | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  // Numbers saved here, by account, and the row whose number is being added.
  const [phones, setPhones] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState<string | null>(null);
  const accountOf = (a: RosterAthlete) => a.id.split(":")[0];
  const phoneOf = (a: RosterAthlete) => phones[accountOf(a)] ?? a.phone;
  const savePhone = (a: RosterAthlete) => (phone: string | null) => {
    if (phone) setPhones((p) => ({ ...p, [accountOf(a)]: phone }));
    setAdding(null);
  };
  const addPhoneButton = (a: RosterAthlete, quiet = false) =>
    adding === a.id ? (
      <AddPhone accountId={accountOf(a)} onDone={savePhone(a)} />
    ) : (
      <button
        type="button"
        onClick={() => setAdding(a.id)}
        className={quiet ? "text-zinc-400 hover:text-white text-[13px] shrink-0 px-2 py-2" : "btn-outline shrink-0 px-4 py-2 rounded-full text-[13px]"}
      >
        Add phone
      </button>
    );

  const retry = useCallback(() => {
    setFailed(false);
    fetchRoster(weekStart).then((r) => (r ? setRoster(r) : setFailed(true)));
  }, [weekStart]);

  useEffect(() => {
    let current = true;
    fetchRoster(weekStart).then((r) => {
      if (!current) return;
      if (r) setRoster(r);
      else setFailed(true);
    });
    return () => {
      current = false;
    };
  }, [weekStart]);

  const message = `Hi! It’s ${adminFirstName} at Diamond Nine Athletics. There are open spots this week — grab a time here: ${BOOK_URL}`;
  const inFilter = (a: RosterAthlete) => filter === "all" || a.categories.includes(filter);
  const booked = (a: RosterAthlete) => a.thisWeek.some((s) => filter === "all" || s.category === filter);
  const rank = (a: RosterAthlete) =>
    a.diamond ? 0 : (a.sessionsLeft.pitching ?? 0) + (a.sessionsLeft.hitting ?? 0) > 0 ? 1 : 2;

  const athletes = (roster?.athletes ?? []).filter(inFilter);
  const notBooked = athletes.filter((a) => !booked(a)).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  const bookedList = athletes
    .filter(booked)
    .sort((a, b) => a.thisWeek[0].startsAt.localeCompare(b.thisWeek[0].startsAt) || a.name.localeCompare(b.name));

  return (
    <section className="mt-12" aria-labelledby="week-roster-title">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
        <div>
          <p className="section-label mb-2">Week of {weekLabel(weekStart)}</p>
          <h2 id="week-roster-title" className="font-display text-3xl sm:text-4xl text-white">
            Who&rsquo;s <span className="gradient-text">booked</span>
          </h2>
          <p className="text-zinc-500 text-sm mt-2 max-w-xl">
            Diamond members, anyone with sessions left, and anyone who trained in the last 30 days.
          </p>
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Show athletes for">
          {(["all", "pitching", "hitting"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`${filter === f ? "btn-gold" : "btn-outline"} px-3.5 py-1.5 rounded-full text-[13px] capitalize`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {roster?.membershipsUnavailable && (
        <p className="text-amber-400 text-xs mb-4">Couldn&rsquo;t check Diamond memberships just now, so members aren&rsquo;t marked.</p>
      )}

      {!roster ? (
        <div className="card-modern rounded-2xl p-6 text-sm text-zinc-400" role="status">
          {failed ? (
            <span>
              Couldn&rsquo;t load who&rsquo;s booked.{" "}
              <button type="button" onClick={retry} className="text-[#b48ae6] hover:underline">
                Try again
              </button>
            </span>
          ) : (
            "Checking who’s booked…"
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          <div className="card-modern rounded-2xl p-5 sm:p-6">
            <p className="text-zinc-400 text-[11px] font-medium tracking-[0.14em] uppercase mb-2">
              Not booked yet · {notBooked.length}
            </p>
            {notBooked.length === 0 ? (
              <p className="text-zinc-500 text-sm py-3">Everyone&rsquo;s on the schedule this week.</p>
            ) : (
              <ul>
                {notBooked.map((a) => {
                  const left = sessionsLeftLabel(a);
                  const phone = phoneOf(a);
                  return (
                    <li key={a.id} className="py-3 border-b border-white/[0.06] last:border-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{a.name}</p>
                        <p className="text-xs text-zinc-500 mt-1 flex flex-wrap gap-x-2.5 gap-y-1">
                          {a.diamond && <span className="text-[#c9a6f2]">Diamond</span>}
                          {left && <span className="text-zinc-300">{left}</span>}
                          {!a.diamond && !left && <span className="text-amber-400/90">No sessions left</span>}
                          {a.lastSession && <span>Last {shortDate(a.lastSession)}</span>}
                          {a.nextAfter && <span>Next {shortDate(a.nextAfter)}</span>}
                          {phone ? (
                            <a href={`tel:${phoneLink(phone)}`} className="hover:text-white">
                              {phone}
                            </a>
                          ) : (
                            <span>No phone on file{a.email ? " · " : ""}{a.email && <a href={`mailto:${a.email}`} className="hover:text-white">email</a>}</span>
                          )}
                        </p>
                      </div>
                      {phone ? (
                        <a
                          href={textHref(phone, message)}
                          className="btn-outline shrink-0 px-4 py-2 rounded-full text-[13px]"
                          aria-label={`Text ${a.firstName}`}
                        >
                          Text
                        </a>
                      ) : (
                        addPhoneButton(a)
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="card-modern rounded-2xl p-5 sm:p-6">
            <p className="text-zinc-400 text-[11px] font-medium tracking-[0.14em] uppercase mb-2">
              Booked · {bookedList.length}
            </p>
            {bookedList.length === 0 ? (
              <p className="text-zinc-500 text-sm py-3">No one has booked this week yet.</p>
            ) : (
              <ul>
                {bookedList.map((a) => (
                  <li key={a.id} className="py-3 border-b border-white/[0.06] last:border-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{a.name}</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {a.thisWeek
                          .filter((s) => filter === "all" || s.category === filter)
                          .map((s) => `${dayTime(s.startsAt)}${s.coach && s.coach !== adminFirstName ? ` with ${s.coach}` : ""}`)
                          .join(" · ")}
                      </p>
                    </div>
                    {phoneOf(a) ? (
                      <a
                        href={textHref(phoneOf(a)!)}
                        className="text-zinc-400 hover:text-white text-[13px] shrink-0 px-2 py-2"
                        aria-label={`Text ${a.firstName}`}
                      >
                        Text
                      </a>
                    ) : (
                      addPhoneButton(a, true)
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
