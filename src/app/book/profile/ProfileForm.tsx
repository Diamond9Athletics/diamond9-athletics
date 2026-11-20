"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatUsPhone } from "@/lib/phone";
import { TextReminderConsent } from "@/components/TextReminderConsent";

type Initial = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  textReminders: boolean;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const supabase = createClient();
  const router = useRouter();
  const [firstName, setFirstName] = useState(initial.first_name);
  const [lastName, setLastName] = useState(initial.last_name);
  const [phone, setPhone] = useState(initial.phone);
  const [textReminders, setTextReminders] = useState(initial.textReminders);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/book/login");
      return;
    }

    if (phone.trim() && !formatUsPhone(phone)) {
      setProfileSaving(false);
      setProfileMsg({ kind: "err", text: "Please enter a 10-digit U.S. phone number." });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      })
      .eq("id", user.id);
    if (error) {
      setProfileSaving(false);
      setProfileMsg({ kind: "err", text: error.message });
      return;
    }

    // The phone and the text-reminder choice are saved by the server,
    // which keeps the record of the choice.
    const res = await fetch("/api/profile/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, textReminders, source: "profile" }),
    });
    const json = await res.json().catch(() => ({}));
    setProfileSaving(false);
    if (!res.ok) {
      setProfileMsg({ kind: "err", text: json.error ?? "Couldn't save. Please try again." });
      return;
    }
    setPhone(json.phone ?? "");
    setTextReminders(Boolean(json.textReminders));
    setProfileMsg({ kind: "ok", text: "Saved." });
    router.refresh();
  }

  async function changePw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwMsg(null);

    if (pw.length < 8) {
      setPwMsg({ kind: "err", text: "Password must be at least 8 characters." });
      return;
    }
    if (pw !== pw2) {
      setPwMsg({ kind: "err", text: "Passwords don't match." });
      return;
    }

    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwSaving(false);

    if (error) {
      setPwMsg({ kind: "err", text: error.message });
      return;
    }
    setPw("");
    setPw2("");
    setPwMsg({ kind: "ok", text: "Password updated." });
  }

  return (
    <div className="space-y-6">
      {/* Details */}
      <div className="card-modern rounded-2xl p-6 sm:p-8">
        <p className="text-zinc-500 text-xs tracking-widest mb-4 font-bold">DETAILS</p>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-500 text-xs tracking-widest mb-1.5">FIRST NAME</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-zinc-500 text-xs tracking-widest mb-1.5">LAST NAME</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="block text-zinc-500 text-xs tracking-widest mb-1.5">PHONE</label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(512) 555-0123"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setPhone((p) => formatUsPhone(p) ?? p)}
              className="input"
            />
            <p className="text-zinc-500 text-xs mt-1.5">
              A parent&rsquo;s number if the player is under 18. Your coach uses it if a session
              has to move.
            </p>
          </div>
          <TextReminderConsent
            checked={textReminders && Boolean(phone.trim())}
            onChange={setTextReminders}
            disabled={!phone.trim()}
          />
          <div>
            <label className="block text-zinc-500 text-xs tracking-widest mb-1.5">EMAIL</label>
            <input
              type="email"
              disabled
              value={initial.email}
              className="input opacity-60"
            />
            <p className="text-zinc-500 text-xs mt-1.5">
              Contact support to change your email address.
            </p>
          </div>

          {profileMsg && (
            <p
              className={`text-xs rounded-lg px-3 py-2 ${
                profileMsg.kind === "ok"
                  ? "text-emerald-400 bg-emerald-950/30 border border-emerald-900/40"
                  : "text-red-400 bg-red-950/30 border border-red-900/40"
              }`}
            >
              {profileMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="btn-gold px-8 py-3 rounded-full text-xs tracking-widest font-black disabled:opacity-60"
          >
            {profileSaving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="card-modern rounded-2xl p-6 sm:p-8">
        <p className="text-zinc-500 text-xs tracking-widest mb-4 font-bold">CHANGE PASSWORD</p>
        <form onSubmit={changePw} className="space-y-4">
          <div>
            <label className="block text-zinc-500 text-xs tracking-widest mb-1.5">NEW PASSWORD</label>
            <input
              type="password"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="input"
            />
            <p className="text-zinc-500 text-xs mt-1.5 tracking-wider">AT LEAST 8 CHARACTERS</p>
          </div>
          <div>
            <label className="block text-zinc-500 text-xs tracking-widest mb-1.5">CONFIRM PASSWORD</label>
            <input
              type="password"
              autoComplete="new-password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="input"
            />
          </div>

          {pwMsg && (
            <p
              className={`text-xs rounded-lg px-3 py-2 ${
                pwMsg.kind === "ok"
                  ? "text-emerald-400 bg-emerald-950/30 border border-emerald-900/40"
                  : "text-red-400 bg-red-950/30 border border-red-900/40"
              }`}
            >
              {pwMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={pwSaving || !pw}
            className="btn-outline px-8 py-3 rounded-full text-xs tracking-widest font-black disabled:opacity-60"
          >
            {pwSaving ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>

      <div className="text-center">
        <Link
          href="/book/dashboard"
          className="text-zinc-500 hover:text-[#b07adf] text-xs tracking-wider"
        >
          ← Back to dashboard
        </Link>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          font-size: 0.875rem;
          padding: 0.75rem 0.9rem;
          border-radius: 0.65rem;
          outline: none;
          transition: border-color .15s;
        }
        .input:focus { border-color: rgba(169,124,226,0.6); }
      `}</style>
    </div>
  );
}
