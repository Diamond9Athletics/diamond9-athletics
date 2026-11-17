"use client";

import { useState } from "react";
import { formatUsPhone } from "@/lib/phone";
import { TextReminderConsent } from "@/components/TextReminderConsent";

/**
 * Asks an account with no phone number for one, once. "Not now" is
 * remembered, so it never comes back after that.
 */
export function PhonePrompt() {
  const [phone, setPhone] = useState("");
  const [textReminders, setTextReminders] = useState(false);
  const [state, setState] = useState<"open" | "saving" | "saved" | "closed">("open");
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!formatUsPhone(phone)) {
      setError("Please enter a 10-digit U.S. phone number.");
      return;
    }
    setState("saving");
    const res = await fetch("/api/profile/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, textReminders, source: "booking" }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setState("open");
      setError(json.error ?? "Couldn't save. Please try again.");
      return;
    }
    setState("saved");
  }

  function notNow() {
    setState("closed");
    fetch("/api/profile/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismiss: true }),
    }).catch(() => {});
  }

  if (state === "closed") return null;

  if (state === "saved") {
    return (
      <div className="card-modern rounded-2xl px-5 py-4 mb-8 flex items-center justify-between gap-4">
        <p className="text-zinc-300 text-sm">
          Thanks, your number is saved{textReminders ? " and text reminders are on" : ""}. You can
          change it anytime in My Profile.
        </p>
        <button
          type="button"
          onClick={() => setState("closed")}
          className="text-zinc-500 hover:text-white text-xs tracking-widest shrink-0"
        >
          CLOSE
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="card-modern-amber rounded-2xl p-5 sm:p-6 mb-8 space-y-4">
      <div>
        <p className="section-label mb-1.5">ONE QUICK THING</p>
        <h2 className="font-display text-2xl text-white">ADD YOUR PHONE NUMBER</h2>
        <p className="text-zinc-400 text-sm mt-1.5">
          So your coach can reach you if a session has to move. A parent&rsquo;s number is best if
          the player is under 18.
        </p>
      </div>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(512) 555-0123"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onBlur={() => setPhone((p) => formatUsPhone(p) ?? p)}
        aria-label="Phone number"
        className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#9954d2]/40 text-white text-sm px-4 py-3 rounded-xl outline-none transition-all placeholder:text-zinc-600"
      />
      <TextReminderConsent checked={textReminders} onChange={setTextReminders} />
      {error && (
        <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={state === "saving"}
          className="btn-gold px-6 py-2.5 rounded-full text-xs tracking-widest font-black disabled:opacity-60"
        >
          {state === "saving" ? "SAVING…" : "SAVE"}
        </button>
        <button
          type="button"
          onClick={notNow}
          className="text-zinc-500 hover:text-white text-xs tracking-widest px-2 py-2.5"
        >
          NOT NOW
        </button>
      </div>
    </form>
  );
}
