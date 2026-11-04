"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type FamilyMember = {
  key: string;
  name: string;
  firstName: string;
  /** The account holder (always first). */
  holder: boolean;
  member: boolean;
  agreementCurrent: boolean;
};

/**
 * "Your athletes" on the dashboard: everyone a parent can book for. Credits
 * on the account are shared by all of them; a Diamond membership covers one.
 */
export function FamilyCard({ athletes }: { athletes: FamilyMember[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  // The sibling whose agreement is being renewed, or confirmed for removal.
  const [renewing, setRenewing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const family = athletes.length > 1;

  async function send(method: "POST" | "PATCH" | "DELETE", body: object) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/athletes", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) {
      setError(json?.error ?? "Something went wrong. Try again.");
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <div className="card-modern rounded-2xl p-6 sm:p-7 mb-6">
      <p className="text-zinc-500 text-[10px] tracking-widest mb-3 font-bold">
        {family ? "YOUR ATHLETES" : "TRAINING MORE THAN ONE ATHLETE?"}
      </p>

      {family ? (
        <ul className="space-y-3 mb-4">
          {athletes.map((a) => (
            <li key={a.key} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold truncate">{a.name}</p>
                  <p className="text-zinc-500 text-xs">
                    {a.holder ? "Account holder" : a.agreementCurrent ? "Agreement accepted" : (
                      <span className="text-amber-400">Agreement needs renewing</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {a.member ? (
                    <span className="text-[#b07adf] text-[10px] tracking-widest font-bold">◆ DIAMOND</span>
                  ) : (
                    <Link
                      href={`/book/subscribe?for=${encodeURIComponent(a.key)}`}
                      className="text-zinc-400 hover:text-[#b07adf] text-[10px] tracking-widest font-bold"
                    >
                      JOIN DIAMOND
                    </Link>
                  )}
                  {!a.holder && !a.agreementCurrent && renewing !== a.key && (
                    <button
                      onClick={() => {
                        setRenewing(a.key);
                        setRemoving(null);
                        setError(null);
                      }}
                      className="text-amber-400 hover:text-amber-300 text-[10px] tracking-widest font-bold"
                    >
                      RENEW
                    </button>
                  )}
                  {!a.holder && removing !== a.key && (
                    <button
                      onClick={() => {
                        setRemoving(a.key);
                        setRenewing(null);
                        setError(null);
                      }}
                      className="text-zinc-600 hover:text-red-300 text-[10px] tracking-widest font-bold"
                    >
                      REMOVE
                    </button>
                  )}
                </div>
              </div>

              {removing === a.key && (
                <div className="mt-3 rounded-xl border border-red-900/40 bg-red-950/20 p-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-zinc-300 text-xs">Take {a.firstName} off your account?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRemoving(null)}
                      disabled={busy}
                      className="text-zinc-400 hover:text-white text-[10px] tracking-widest font-bold"
                    >
                      KEEP
                    </button>
                    <button
                      onClick={async () => {
                        if (await send("DELETE", { id: a.key })) setRemoving(null);
                      }}
                      disabled={busy}
                      className="text-red-300 hover:text-red-200 text-[10px] tracking-widest font-bold disabled:opacity-60"
                    >
                      {busy ? "REMOVING…" : "YES, REMOVE"}
                    </button>
                  </div>
                </div>
              )}

              {renewing === a.key && (
                <AgreementForm
                  athleteFirstName={a.firstName}
                  busy={busy}
                  submitLabel="RENEW AGREEMENT"
                  onCancel={() => setRenewing(null)}
                  onSubmit={async (guardianName) => {
                    if (await send("PATCH", { id: a.key, guardianName, accept: true })) {
                      setRenewing(null);
                    }
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
          Add a brother or sister to your account and book for them here. They share your
          credits; a Diamond membership covers one athlete.
        </p>
      )}

      {error && (
        <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {adding ? (
        <AddAthleteForm
          busy={busy}
          onCancel={() => {
            setAdding(false);
            setError(null);
          }}
          onSubmit={async (fields) => {
            if (await send("POST", { ...fields, accept: true })) setAdding(false);
          }}
        />
      ) : (
        <button
          onClick={() => {
            setAdding(true);
            setRenewing(null);
            setRemoving(null);
            setError(null);
          }}
          className="btn-outline px-5 py-2.5 rounded-full text-[11px] tracking-widest font-bold"
        >
          + ADD AN ATHLETE
        </button>
      )}
      {family && (
        <p className="text-zinc-600 text-xs mt-3">
          Credits are shared by everyone here. A Diamond membership covers one athlete.
        </p>
      )}
    </div>
  );
}

const inputCls =
  "w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#9954d2]/40 text-white text-sm px-3 py-2.5 rounded-lg outline-none transition-all placeholder:text-zinc-700";
const labelCls = "block text-zinc-500 text-[10px] tracking-widest font-bold mb-1.5";

function AddAthleteForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (fields: { firstName: string; lastName: string; guardianName: string }) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  return (
    <div className="rounded-xl border border-[#9954d2]/25 bg-[#9954d2]/5 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="athlete-first" className={labelCls}>THEIR FIRST NAME</label>
          <input
            id="athlete-first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={60}
            autoComplete="off"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="athlete-last" className={labelCls}>LAST NAME</label>
          <input
            id="athlete-last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            maxLength={60}
            autoComplete="off"
            className={inputCls}
          />
        </div>
      </div>
      <AgreementForm
        athleteFirstName={firstName.trim() || "them"}
        busy={busy}
        submitLabel="ADD ATHLETE"
        disabled={!firstName.trim()}
        onCancel={onCancel}
        onSubmit={(guardianName) => onSubmit({ firstName, lastName, guardianName })}
      />
    </div>
  );
}

/** A parent or guardian accepting the Participant Agreement for someone. */
function AgreementForm({
  athleteFirstName,
  busy,
  submitLabel,
  disabled = false,
  onCancel,
  onSubmit,
}: {
  athleteFirstName: string;
  busy: boolean;
  submitLabel: string;
  disabled?: boolean;
  onCancel: () => void;
  onSubmit: (guardianName: string) => void;
}) {
  const [guardianName, setGuardianName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const ready = accepted && guardianName.trim().length >= 3 && !disabled;
  return (
    <div className="space-y-3 mt-3">
      <div>
        <label htmlFor="guardian-name" className={labelCls}>YOUR FULL NAME (PARENT OR GUARDIAN)</label>
        <input
          id="guardian-name"
          value={guardianName}
          onChange={(e) => setGuardianName(e.target.value)}
          maxLength={100}
          autoComplete="name"
          className={inputCls}
        />
      </div>
      <label className="flex items-start gap-3 text-zinc-300 text-xs leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 accent-[#9954d2]"
        />
        <span>
          I&rsquo;m {athleteFirstName === "them" ? "their" : `${athleteFirstName}’s`} parent or
          legal guardian, and I accept the{" "}
          <Link href="/waiver" target="_blank" className="text-[#b07adf] hover:underline">
            Participant Agreement
          </Link>{" "}
          on their behalf.
        </span>
      </label>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onSubmit(guardianName.trim())}
          disabled={!ready || busy}
          className="btn-gold px-6 py-2.5 rounded-full text-[11px] tracking-widest font-black disabled:opacity-50"
        >
          {busy ? "SAVING…" : submitLabel}
        </button>
        <button
          onClick={onCancel}
          disabled={busy}
          className="text-zinc-500 hover:text-zinc-300 text-[10px] tracking-widest font-bold"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
