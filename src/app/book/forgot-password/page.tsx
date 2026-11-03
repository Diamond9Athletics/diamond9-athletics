"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordInner />
    </Suspense>
  );
}

function ForgotPasswordInner() {
  // /book/auth/confirm sends people back here when a reset link has expired.
  const expired = useSearchParams().get("expired") === "1";
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Our own endpoint (not Supabase's mailer) so the link works on any device.
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));

    setSubmitting(false);
    if (!res?.ok) {
      setError(json?.error ?? "Couldn't send the link. Check your connection and try again.");
      return;
    }
    // Same answer whether or not the email has an account.
    setSent(true);
  }

  if (sent) {
    return (
      <main className="pt-24 bg-[#040200] min-h-screen">
        <section className="max-w-md mx-auto px-6 py-20 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ CHECK YOUR EMAIL</span>
          <h1 className="font-display text-5xl text-white mb-4">RESET LINK SENT</h1>
          <div className="divider-glow max-w-[80px] mx-auto mb-6" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            If <span className="text-white">{email}</span> has an account here, a link to set a
            new password is on its way. It works on any phone or computer — check your spam
            folder too.
          </p>
          <div className="card-modern rounded-2xl p-5 text-left mb-8">
            <p className="text-[#b07adf] text-[10px] tracking-widest font-bold mb-1.5">
              NO EMAIL AFTER A FEW MINUTES?
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              You may not have an account on the website yet — even if you&rsquo;ve trained with
              D9 before. Creating one takes about a minute.
            </p>
            <Link
              href="/book/signup"
              className="btn-outline block w-full text-center py-3 rounded-full text-xs tracking-widest font-black"
            >
              CREATE AN ACCOUNT
            </Link>
          </div>
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
            {expired && (
              <p className="text-amber-500 text-xs bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2.5 leading-relaxed">
                That link expired or was already used. Enter your email and we&rsquo;ll send a
                fresh one.
              </p>
            )}
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
