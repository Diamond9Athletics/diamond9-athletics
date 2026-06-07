"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/book/auth/confirm`,
        data: { first_name: firstName, last_name: lastName },
      },
    });

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <main className="pt-24 bg-[#040200] min-h-screen">
        <section className="max-w-md mx-auto px-6 py-20 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ ALMOST DONE</span>
          <h1 className="font-display text-5xl text-white mb-4">CHECK YOUR EMAIL</h1>
          <div className="divider-glow max-w-[80px] mx-auto mb-6" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            We sent a confirmation link to <span className="text-white">{email}</span>.
            Click the link to finish creating your account.
          </p>
          <p className="text-zinc-600 text-xs">
            Already confirmed?{" "}
            <Link href="/book/login" className="text-[#b07adf] hover:underline">
              Sign in
            </Link>
            .
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <span className="badge-amber mb-4 inline-flex">◆ ATHLETE SIGNUP</span>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">
            CREATE
            <span className="block gradient-text">ACCOUNT</span>
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mt-5" />
        </div>

        <div className="card-modern rounded-2xl p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-[#b07adf] text-[11px] tracking-wider bg-[#9954d2]/8 border border-[#9954d2]/20 rounded-lg px-3 py-2.5 leading-relaxed">
              <span className="font-bold">PARENTS:</span> please enter the <span className="text-white">player&rsquo;s</span> name here, not your own.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="PLAYER FIRST NAME">
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="PLAYER LAST NAME">
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input"
                />
              </Field>
            </div>
            <Field label="EMAIL">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="PASSWORD">
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
              <p className="text-zinc-600 text-[10px] mt-1.5 tracking-wider">AT LEAST 8 CHARACTERS</p>
            </Field>

            {error && (
              <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-gold w-full py-3.5 rounded-full text-sm tracking-widest font-black disabled:opacity-60"
            >
              {submitting ? "CREATING…" : "CREATE ACCOUNT"}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-6">
          Already have an account?{" "}
          <Link href="/book/login" className="text-[#b07adf] hover:underline">
            Sign in
          </Link>
          .
        </p>
      </section>

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
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-zinc-500 text-[10px] tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}
