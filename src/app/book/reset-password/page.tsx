"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * The email link from resetPasswordForEmail lands here.
 * Supabase's /auth/v1/verify sets a session cookie first, then
 * redirects here — so the user is signed in "recovery" mode and can
 * call auth.updateUser({ password }) to set a new one.
 */
export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Confirm we actually have a session before showing the form.
  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        setError(
          "This reset link has expired or is invalid. Request a new one from Forgot Password.",
        );
      }
      setReady(true);
    });
  }, [supabase]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPw) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
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
          <span className="badge-amber mb-5 inline-flex">◆ ALL SET</span>
          <h1 className="font-display text-5xl text-white mb-4">PASSWORD UPDATED</h1>
          <div className="divider-glow max-w-[80px] mx-auto mb-6" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            You&rsquo;re signed in with your new password.
          </p>
          <button
            onClick={() => {
              router.push("/book/dashboard");
              router.refresh();
            }}
            className="btn-gold px-10 py-4 rounded-full text-sm tracking-widest font-black inline-block"
          >
            GO TO DASHBOARD
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <span className="badge-amber mb-4 inline-flex">◆ SET NEW PASSWORD</span>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">
            NEW
            <span className="block gradient-text">PASSWORD</span>
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mt-5" />
        </div>

        <div className="card-modern rounded-2xl p-6 sm:p-8">
          {!ready ? (
            <p className="text-zinc-500 text-sm text-center">Loading…</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-500 text-[10px] tracking-widest mb-1.5">NEW PASSWORD</label>
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
              </div>
              <div>
                <label className="block text-zinc-500 text-[10px] tracking-widest mb-1.5">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
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
                {submitting ? "UPDATING…" : "UPDATE PASSWORD"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-zinc-500 text-xs mt-6">
          <Link href="/book/login" className="text-[#b07adf] hover:underline">
            Back to sign in
          </Link>
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
