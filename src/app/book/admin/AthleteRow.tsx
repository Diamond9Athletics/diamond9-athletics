"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Athlete = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  is_admin: boolean;
  is_trainer: boolean;
  created_at: string;
  credits: number;
  upcoming: number;
  creditsByService: Record<string, number>;
  hasPitchingSubscription: boolean;
};

type Service = {
  id: string;
  name: string;
  category: string;
  duration_min: number;
};

export function AthleteRow({
  athlete: a,
  services,
}: {
  athlete: Athlete;
  services: Service[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Optimistic per-service credit counts so the UI updates instantly on
  // click, then we refresh from the server.
  const [localCredits, setLocalCredits] = useState<Record<string, number>>(
    a.creditsByService,
  );

  const name = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || "—";
  const joined = new Date(a.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  async function act(action: string, confirmMsg?: string, extra?: object) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(action);
    setError(null);
    const res = await fetch("/api/admin/athlete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: a.id, action, ...(extra ?? {}) }),
    });
    setBusy(null);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? `Could not ${action}.`);
      return false;
    }
    router.refresh();
    if (action !== "adjust_credits") setOpen(false);
    return true;
  }

  async function bump(serviceId: string, delta: number) {
    const key = `bump-${serviceId}-${delta}`;
    setError(null);
    setBusy(key);
    // Optimistic UI update.
    const previous = localCredits[serviceId] ?? 0;
    const nextValue = Math.max(0, previous + delta);
    setLocalCredits((c) => ({ ...c, [serviceId]: nextValue }));

    const ok = await act("adjust_credits", undefined, {
      delta,
      serviceId,
    });

    if (!ok) {
      // Roll back on failure.
      setLocalCredits((c) => ({ ...c, [serviceId]: previous }));
    }
    setBusy(null);
  }

  const totalDisplayed = Object.values(localCredits).reduce((s, n) => s + n, 0);

  return (
    <div
      className={`rounded-xl border border-transparent transition ${
        open ? "border-[#9954d2]/25 bg-[#9954d2]/[0.04]" : "hover:bg-white/[0.02]"
      }`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left flex items-center justify-between gap-3 p-3"
      >
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm truncate flex items-center gap-2">
            <span>{name}</span>
            {a.is_admin && (
              <span className="text-[9px] tracking-wider bg-[#9954d2]/15 border border-[#9954d2]/25 text-[#b07adf] px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            )}
            {a.is_trainer && (
              <span className="text-[9px] tracking-wider bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 px-2 py-0.5 rounded-full">
                TRAINER
              </span>
            )}
            {a.hasPitchingSubscription && (
              <span className="text-[9px] tracking-wider bg-gradient-to-r from-[#9954d2]/25 to-[#b07adf]/25 border border-[#9954d2]/40 text-[#b07adf] px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                <span className="text-sm leading-none">◆</span> DIAMOND ∞
              </span>
            )}
          </p>
          <p className="text-zinc-500 text-xs truncate">
            {a.email}
            {a.phone && <span> · {a.phone}</span>}
          </p>
        </div>
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-[#b07adf] text-sm font-bold">
            {a.hasPitchingSubscription ? (
              <>
                <span className="text-base leading-none">∞</span> pitching
                {totalDisplayed > 0 && (
                  <span className="text-zinc-500"> · +{totalDisplayed} credit{totalDisplayed === 1 ? "" : "s"}</span>
                )}
              </>
            ) : (
              <>
                {totalDisplayed} credit{totalDisplayed === 1 ? "" : "s"}
              </>
            )}
          </p>
          <p className="text-zinc-600 text-xs">
            {a.upcoming} upcoming · joined {joined}
          </p>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5 px-3 py-3 space-y-3 text-xs">
          {/* Per-service credit stepper */}
          <div>
            <p className="text-[10px] tracking-widest text-zinc-500 font-bold mb-2">
              CREDITS
            </p>
            <div className="space-y-1.5">
              {services.map((s) => {
                const count = localCredits[s.id] ?? 0;
                const decBusy = busy === `bump-${s.id}--1`;
                const incBusy = busy === `bump-${s.id}-1`;
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 bg-zinc-900/40 border border-white/5 rounded-lg px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">{s.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => bump(s.id, -1)}
                        disabled={decBusy || count <= 0}
                        aria-label={`Deduct one ${s.name} credit`}
                        className="w-7 h-7 rounded-full border border-white/10 text-zinc-300 hover:border-red-500/40 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-sm font-bold"
                      >
                        {decBusy ? "…" : "−"}
                      </button>
                      <span className="w-8 text-center text-white font-bold text-sm">
                        {count}
                      </span>
                      <button
                        onClick={() => bump(s.id, 1)}
                        disabled={incBusy}
                        aria-label={`Add one ${s.name} credit`}
                        className="w-7 h-7 rounded-full border border-white/10 text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 disabled:opacity-30 flex items-center justify-center text-sm font-bold"
                      >
                        {incBusy ? "…" : "+"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-400 pt-1">
            <p>
              <span className="text-zinc-600">Upcoming:</span>{" "}
              <span className="text-white">{a.upcoming}</span>
            </p>
            <p>
              <span className="text-zinc-600">Joined:</span>{" "}
              <span className="text-white">{joined}</span>
            </p>
          </div>

          {/* Other actions */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
            <ActionBtn
              onClick={() => act("send_reset")}
              busy={busy === "send_reset"}
              label="SEND RESET EMAIL"
            />
            <ActionBtn
              onClick={() => act("send_magic")}
              busy={busy === "send_magic"}
              label="SEND SIGN-IN LINK"
            />
            {!a.is_trainer && (
              <ActionBtn
                onClick={() =>
                  act("promote_trainer", `Make ${name || a.email} a trainer?`)
                }
                busy={busy === "promote_trainer"}
                label="MAKE TRAINER"
              />
            )}
            {a.is_trainer && !a.is_admin && (
              <ActionBtn
                onClick={() =>
                  act("demote_trainer", `Remove trainer role from ${name}?`)
                }
                busy={busy === "demote_trainer"}
                label="REMOVE TRAINER"
              />
            )}
            {!a.is_admin && (
              <ActionBtn
                onClick={() =>
                  act(
                    "delete",
                    `Delete ${name || a.email} permanently? All bookings and credits will be removed. This can't be undone.`,
                  )
                }
                busy={busy === "delete"}
                label="DELETE ACCOUNT"
                danger
              />
            )}
          </div>

          {error && (
            <p className="text-red-400 text-[11px] bg-red-950/30 border border-red-900/40 rounded-lg px-2 py-1.5">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  onClick,
  busy,
  label,
  danger,
}: {
  onClick: () => void;
  busy: boolean;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-full border transition disabled:opacity-50 ${
        danger
          ? "border-red-900/40 text-red-400 hover:bg-red-950/30"
          : "border-white/10 text-zinc-300 hover:border-[#9954d2]/40 hover:text-white"
      }`}
    >
      {busy ? "…" : label}
    </button>
  );
}
