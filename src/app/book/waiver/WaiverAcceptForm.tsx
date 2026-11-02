"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "athlete" | "guardian";

export function WaiverAcceptForm({
  athleteName,
  version,
  next,
}: {
  athleteName: string;
  version: string;
  next: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [guardianName, setGuardianName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready =
    role !== null &&
    agreed &&
    (role === "athlete" || guardianName.trim().length >= 3);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/waiver/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, guardianName, version }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      setBusy(false);
      setError(json.error ?? "Couldn't save your acceptance. Try again.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="card-modern-amber rounded-2xl p-5 sm:p-7 mt-5 space-y-5"
    >
      <fieldset>
        <legend className="text-zinc-500 text-[10px] tracking-widest font-bold mb-2">
          WHO IS ACCEPTING?
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <RoleOption
            id="role-athlete"
            checked={role === "athlete"}
            onSelect={() => setRole("athlete")}
            title="I'm the athlete"
            detail="18 or older"
          />
          <RoleOption
            id="role-guardian"
            checked={role === "guardian"}
            onSelect={() => setRole("guardian")}
            title="I'm a parent or guardian"
            detail={`Accepting for ${athleteName}`}
          />
        </div>
        <p className="text-zinc-500 text-xs mt-2">
          Under 18? A parent or guardian needs to accept this for you.
        </p>
      </fieldset>

      {role === "guardian" && (
        <div>
          <label
            htmlFor="guardian-name"
            className="block text-zinc-500 text-[10px] tracking-widest font-bold mb-1.5"
          >
            YOUR FULL NAME
          </label>
          <input
            id="guardian-name"
            type="text"
            value={guardianName}
            onChange={(e) => setGuardianName(e.target.value)}
            autoComplete="name"
            maxLength={100}
            placeholder="Parent or guardian name"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#9954d2]/60"
          />
        </div>
      )}

      <label htmlFor="waiver-agree" className="flex items-start gap-3 cursor-pointer">
        <input
          id="waiver-agree"
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#9954d2]"
        />
        <span className="text-sm text-zinc-300 leading-relaxed">
          I have read and agree to the Participant Agreement, including the release of
          liability and my responsibility to pay for equipment the athlete damages.
        </span>
      </label>

      {error && (
        <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!ready || busy}
        className="btn-gold w-full py-3.5 rounded-full text-sm tracking-widest font-black disabled:opacity-50"
      >
        {busy ? "SAVING…" : "ACKNOWLEDGE & CONTINUE"}
      </button>
    </form>
  );
}

function RoleOption({
  id,
  checked,
  onSelect,
  title,
  detail,
}: {
  id: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`block cursor-pointer rounded-xl border px-4 py-3 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#9954d2]/60 ${
        checked
          ? "border-[#9954d2] bg-[#9954d2]/15"
          : "border-zinc-800 bg-zinc-900/50 hover:border-[#9954d2]/50"
      }`}
    >
      <input
        id={id}
        type="radio"
        name="waiver-role"
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="block text-white text-sm font-bold">{title}</span>
      <span className="block text-zinc-500 text-xs mt-0.5 truncate">{detail}</span>
    </label>
  );
}
