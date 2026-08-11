"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Initial = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const supabase = createClient();
  const router = useRouter();
  const [firstName, setFirstName] = useState(initial.first_name);
  const [lastName, setLastName] = useState(initial.last_name);
  const [phone, setPhone] = useState(initial.phone);
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

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
      })
      .eq("id", user.id);
    setProfileSaving(false);

    if (error) {
      setProfileMsg({ kind: "err", text: error.message });
      return;
    }
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
        <p className="text-zinc-500 text-[10px] tracking-widest mb-4 font-bold">DETAILS</p>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-500 text-[10px] tracking-widest mb-1.5">FIRST NAME</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-zinc-500 text-[10px] tracking-widest mb-1.5">LAST NAME</label>
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
            <label className="block text-zinc-500 text-[10px] tracking-widest mb-1.5">PHONE</label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(512) 555-0123"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
            />
            <p className="text-zinc-600 text-[10px] mt-1.5">
              Optional — used for session reminders and if we need to reach you quickly.
            </p>
          </div>
          <div>
            <label className="block text-zinc-500 text-[10px] tracking-widest mb-1.5">EMAIL</label>
            <input
              type="email"
              disabled
              value={initial.email}
              className="input opacity-60"
            />
            <p className="text-zinc-600 text-[10px] mt-1.5">
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
            {profileSaving ? "SAVING…" : "SAVE CHANGES"}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="card-modern rounded-2xl p-6 sm:p-8">
        <p className="text-zinc-500 text-[10px] tracking-widest mb-4 font-bold">CHANGE PASSWORD</p>
        <form onSubmit={changePw} className="space-y-4">
          <div>
            <label className="block text-zinc-500 text-[10px] tracking-widest mb-1.5">NEW PASSWORD</label>
            <input
              type="password"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="input"
            />
            <p className="text-zinc-600 text-[10px] mt-1.5 tracking-wider">AT LEAST 8 CHARACTERS</p>
          </div>
          <div>
            <label className="block text-zinc-500 text-[10px] tracking-widest mb-1.5">CONFIRM PASSWORD</label>
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
            {pwSaving ? "UPDATING…" : "UPDATE PASSWORD"}
          </button>
        </form>
      </div>

      <div className="text-center">
        <Link
          href="/book/dashboard"
          className="text-zinc-500 hover:text-[#b07adf] text-xs tracking-wider"
        >
          ← BACK TO DASHBOARD
        </Link>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: rgba(24,24,27,0.5);
          border: 1px solid rgba(255,255,255,0.08);
          color: white;
          font-size: 0.875rem;
          padding: 0.75rem 0.9rem;
          border-radius: 0.65rem;
          outline: none;
          transition: border-color .15s;
        }
        .input:focus { border-color: rgba(153,84,210,0.5); }
      `}</style>
    </div>
  );
}
