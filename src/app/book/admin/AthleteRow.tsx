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

export function AthleteRow({ athlete: a }: { athlete: Athlete }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const name = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || "—";
  const joined = new Date(a.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  async function act(action: string, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(action);
    setError(null);
    const res = await fetch("/api/admin/athlete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: a.id, action }),
    });
    setBusy(null);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? `Could not ${action}.`);
      return;
    }
    router.refresh();
    setOpen(false);
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
            <p className="text-red-400 text-[11px] bg-red-950/30 border border-red-900/40 rounded-lg px-2 py-1.5 mt-2">
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
