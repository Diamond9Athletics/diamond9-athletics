"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const TZ = "America/Chicago";

export type ClientOption = {
  id: string;
  name: string;
  email: string;
  sessions: number;
  lastSession: string | null;
  isDiamond: boolean;
  creditsByService: Record<string, number>;
};

export type ServiceOption = {
  id: string;
  name: string;
  category: string;
  duration_min: number;
};

/** Current wall-clock parts in the studio timezone. */
function ctParts(d: Date) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((a, x) => {
      if (x.type !== "literal") a[x.type] = x.value;
      return a;
    }, {});
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
    hour: p.hour,
  };
}

function defaultDateTime() {
  // Next whole hour in Central time (rolls over to tomorrow after 11pm).
  const inAnHour = ctParts(new Date(Date.now() + 60 * 60 * 1000));
  return { date: inAnHour.date, time: `${inAnHour.hour}:00` };
}

function fmtWall(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const [hh, mm] = time.split(":").map(Number);
  const suffix = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${day}, ${h12}:${String(mm).padStart(2, "0")} ${suffix}`;
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
  });
}

export function AddSessionPanel({
  clients,
  services,
  defaultServiceId,
}: {
  clients: ClientOption[];
  services: ServiceOption[];
  defaultServiceId: string;
}) {
  const router = useRouter();
  const initial = defaultDateTime();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ClientOption | null>(null);
  const [serviceId, setServiceId] = useState(defaultServiceId);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [useCredit, setUseCredit] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const service = services.find((s) => s.id === serviceId) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients.filter((c) => c.sessions > 0).slice(0, 6);
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [clients, query]);

  const nowCT = ctParts(new Date());
  const isPast = date < nowCT.date || (date === nowCT.date && time <= nowCT.time);

  let creditHint = "";
  if (selected && service) {
    if (!useCredit) {
      creditHint = "No credit will be used.";
    } else if (service.category === "pitching" && selected.isDiamond) {
      creditHint = "Diamond member — their membership covers this, no credit used.";
    } else {
      const n = selected.creditsByService[service.id] ?? 0;
      creditHint =
        n > 0
          ? `They have ${n} credit${n === 1 ? "" : "s"} for this session type. One will be used.`
          : "No credits for this session type — it will be booked free.";
    }
  }

  function reset() {
    setSelected(null);
    setQuery("");
    setNote("");
    setError(null);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) {
      setError("Pick a client first.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await fetch("/api/admin/booking/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        athleteId: selected.id,
        serviceId,
        date,
        time,
        useCredit,
        sendEmail,
        note,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !json.ok) {
      setError(json.error ?? "Couldn't add the session. Try again.");
      return;
    }
    setNotice(
      `Added ${json.athleteName} — ${fmtWall(date, time)}. ${json.creditNote}${
        json.emailed ? " Confirmation emailed." : ""
      }`,
    );
    reset();
    router.refresh();
  }

  if (!open) {
    return (
      <div className="card-modern rounded-2xl p-5 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-zinc-500 text-[10px] tracking-widest font-bold mb-1">
            ADD A SESSION
          </p>
          <p className="text-zinc-300 text-sm">
            Put any client on your schedule at any time. Slot limits and booking
            cutoffs don&rsquo;t apply.
          </p>
          {notice && <p className="text-emerald-400 text-xs mt-2">{notice}</p>}
        </div>
        <button
          onClick={() => {
            setOpen(true);
            setNotice(null);
          }}
          className="btn-gold px-5 py-2 rounded-full text-[11px] tracking-widest font-black"
        >
          + ADD SESSION
        </button>
      </div>
    );
  }

  const inputCls =
    "w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#9954d2]/60";
  const labelCls = "block text-zinc-500 text-[10px] tracking-widest font-bold mb-1.5";

  return (
    <form onSubmit={submit} className="card-modern rounded-2xl p-5 sm:p-6 mb-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-zinc-500 text-[10px] tracking-widest font-bold">ADD A SESSION</p>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="text-zinc-500 hover:text-zinc-300 text-[10px] tracking-widest font-bold"
        >
          CLOSE
        </button>
      </div>

      {notice && (
        <p className="text-emerald-300 text-xs bg-emerald-950/30 border border-emerald-900/40 rounded-lg px-3 py-2">
          {notice}
        </p>
      )}

      {/* Client */}
      <div>
        <label htmlFor="add-client-search" className={labelCls}>
          CLIENT
        </label>
        {selected ? (
          <div className="flex items-center justify-between gap-3 bg-[#9954d2]/10 border border-[#9954d2]/30 rounded-lg px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-white text-sm font-bold truncate flex items-center gap-2">
                {selected.name}
                {selected.isDiamond && (
                  <span className="text-[9px] tracking-wider text-[#b07adf] border border-[#9954d2]/40 rounded-full px-2 py-0.5">
                    ◆ DIAMOND
                  </span>
                )}
              </p>
              <p className="text-zinc-500 text-xs truncate">{selected.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setQuery("");
              }}
              className="text-zinc-400 hover:text-[#b07adf] text-[10px] tracking-widest font-bold shrink-0"
            >
              CHANGE
            </button>
          </div>
        ) : (
          <>
            <input
              id="add-client-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              autoComplete="off"
              className={inputCls}
            />
            <p className="text-zinc-600 text-[10px] tracking-wider mt-2 mb-1.5">
              {query.trim() ? "MATCHES" : "RECENT CLIENTS"}
            </p>
            {matches.length === 0 ? (
              <p className="text-zinc-500 text-xs py-2">
                No client matches &ldquo;{query}&rdquo;. They need a website account to be booked.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {matches.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(c);
                        setError(null);
                      }}
                      className="w-full text-left flex items-center justify-between gap-3 bg-zinc-900/50 border border-zinc-800 hover:border-[#9954d2]/50 rounded-lg px-3 py-2 transition"
                    >
                      <span className="min-w-0">
                        <span className="block text-white text-sm truncate">
                          {c.name}
                          {c.isDiamond && (
                            <span className="text-[#b07adf] text-[10px] ml-2">◆</span>
                          )}
                        </span>
                        <span className="block text-zinc-500 text-xs truncate">{c.email}</span>
                      </span>
                      <span className="text-zinc-500 text-[11px] shrink-0 text-right">
                        {c.sessions > 0
                          ? `${c.sessions} session${c.sessions === 1 ? "" : "s"}${
                              c.lastSession ? ` · last ${fmtShortDate(c.lastSession)}` : ""
                            }`
                          : "New client"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Session + time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-3">
          <label htmlFor="add-service" className={labelCls}>
            SESSION TYPE
          </label>
          <select
            id="add-service"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className={inputCls}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="add-date" className={labelCls}>
            DATE
          </label>
          <input
            id="add-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="add-time" className={labelCls}>
            START (CENTRAL)
          </label>
          <input
            id="add-time"
            type="time"
            step={900}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className={inputCls}
          />
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            id="add-use-credit"
            type="checkbox"
            checked={useCredit}
            onChange={(e) => setUseCredit(e.target.checked)}
            className="mt-0.5 accent-[#9954d2]"
          />
          <span className="text-sm text-zinc-300">
            Use one of their credits
            {creditHint && (
              <span className="block text-xs text-zinc-500 mt-0.5">{creditHint}</span>
            )}
          </span>
        </label>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            id="add-send-email"
            type="checkbox"
            checked={sendEmail && !isPast}
            disabled={isPast}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="mt-0.5 accent-[#9954d2]"
          />
          <span className={`text-sm ${isPast ? "text-zinc-600" : "text-zinc-300"}`}>
            Email them a confirmation
            {isPast && (
              <span className="block text-xs text-zinc-600 mt-0.5">
                That time has already passed, so no email will be sent.
              </span>
            )}
          </span>
        </label>
      </div>

      <div>
        <label htmlFor="add-note" className={labelCls}>
          NOTE (OPTIONAL)
        </label>
        <input
          id="add-note"
          type="text"
          value={note}
          maxLength={200}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Makeup session, comp, booked by text…"
          className={inputCls}
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-zinc-500 text-xs">
          {selected && service
            ? `${selected.name} · ${service.name} · ${fmtWall(date, time)}`
            : "Pick a client to continue."}
        </p>
        <button
          type="submit"
          disabled={busy || !selected}
          className="btn-gold px-6 py-2.5 rounded-full text-[11px] tracking-widest font-black disabled:opacity-50"
        >
          {busy ? "ADDING…" : "ADD SESSION"}
        </button>
      </div>
    </form>
  );
}
