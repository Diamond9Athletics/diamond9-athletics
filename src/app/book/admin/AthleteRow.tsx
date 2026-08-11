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
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustServiceId, setAdjustServiceId] = useState(
    services[0]?.id ?? "",
  );
  const [adjustDelta, setAdjustDelta] = useState<string>("1");
  const [adjustNote, setAdjustNote] = useState("");

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
      return;
    }
    router.refresh();
    if (action === "adjust_credits") {
      setAdjustOpen(false);
      setAdjustDelta("1");
      setAdjustNote("");
    } else {
      setOpen(false);
    }
  }

  async function applyAdjust() {
    const delta = parseInt(adjustDelta, 10);
    if (!Number.isFinite(delta) || delta === 0) {
      setError("Enter a non-zero number (e.g. 2 to add, -1 to deduct).");
      return;
    }
    await act("adjust_credits", undefined, {
      delta,
      serviceId: adjustServiceId,
      note: adjustNote,
    });
  }

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
          </p>
          <p className="text-zinc-500 text-xs truncate">
            {a.email}
            {a.phone && <span> · {a.phone}</span>}
          </p>
        </div>
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-[#b07adf] text-sm font-bold">
            {a.credits} credit{a.credits === 1 ? "" : "s"}
          </p>
          <p className="text-zinc-600 text-xs">
            {a.upcoming} upcoming · joined {joined}
          </p>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5 px-3 py-3 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-400">
            <p>
              <span className="text-zinc-600">Credits:</span>{" "}
              <span className="text-white">{a.credits}</span>
            </p>
            <p>
              <span className="text-zinc-600">Upcoming:</span>{" "}
              <span className="text-white">{a.upcoming}</span>
            </p>
            <p>
              <span className="text-zinc-600">Joined:</span>{" "}
              <span className="text-white">{joined}</span>
            </p>
            <p>
              <span className="text-zinc-600">User ID:</span>{" "}
              <span className="text-white font-mono text-[10px]">
                {a.id.slice(0, 8)}…
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <ActionBtn
              onClick={() => setAdjustOpen((v) => !v)}
              busy={false}
              label={adjustOpen ? "CLOSE ADJUST" : "ADJUST CREDITS"}
            />
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

          {adjustOpen && (
            <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
              <p className="text-[10px] tracking-widest text-zinc-500 font-bold">
                ADJUST CREDITS
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2">
                <select
                  value={adjustServiceId}
                  onChange={(e) => setAdjustServiceId(e.target.value)}
                  className="adjust-input"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="1"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  placeholder="±"
                  className="adjust-input text-center font-bold"
                />
              </div>
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="Reason (optional) — e.g. Venmo cash, comp session"
                className="adjust-input"
                maxLength={200}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={applyAdjust}
                  disabled={busy === "adjust_credits"}
                  className="text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-full border border-[#9954d2]/40 text-[#b07adf] hover:bg-[#9954d2]/10 disabled:opacity-50"
                >
                  {busy === "adjust_credits"
                    ? "APPLYING…"
                    : Number(adjustDelta) >= 0
                      ? "ADD CREDITS"
                      : "DEDUCT CREDITS"}
                </button>
                <p className="text-zinc-600 text-[10px] tracking-wider">
                  Positive to add · negative to deduct
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-[11px] bg-red-950/30 border border-red-900/40 rounded-lg px-2 py-1.5 mt-2">
              {error}
            </p>
          )}
        </div>
      )}
      <style jsx>{`
        .adjust-input {
          background: rgba(24, 24, 27, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 6px;
          outline: none;
          width: 100%;
        }
        .adjust-input:focus {
          border-color: rgba(153, 84, 210, 0.5);
        }
      `}</style>
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
