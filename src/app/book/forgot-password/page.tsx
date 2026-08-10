"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/book/reset-password`,
    });

    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Supabase intentionally succeeds whether or not the email exists —
    // just show the confirmation screen either way.
    setSent(true);
  }

  if (sent) {
    return (
      <main className="pt-24 bg-[#040200] min-h-screen">
        <section className="max-w-md mx-auto px-6 py-20 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ CHECK YOUR EMAIL</span>
          <h1 className="font-display text-5xl text-white mb-4">RESET LINK SENT</h1>
          <div className="divider-glow max-w-[80px] mx-auto mb-6" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            If <span className="text-white">{email}</span> is an account here, you&rsquo;ll
            get a password-reset link within a minute. Check your spam folder too.
          </p>
          <p className="text-zinc-600 text-xs">
            <Link href="/book/login" className="text-[#b07adf] hover:underline">
              Back to sign in
            </Link>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <span className="badge-amber mb-4 inline-flex">◆ FORGOT PASSWORD</span>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">
            RESET
            <span className="block gradient-text">PASSWORD</span>
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mt-5" />
        </div>

        <div className="card-modern rounded-2xl p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-zinc-400 text-xs leading-relaxed">
              Enter your account email and we&rsquo;ll send you a link to set a new password.
            </p>
            <div>
              <label className="block text-zinc-500 text-[10px] tracking-widest mb-1.5">EMAIL</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>

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
              {submitting ? "SENDING…" : "SEND RESET LINK"}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-6">
          Remembered it?{" "}
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
