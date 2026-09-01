"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Only allow internal paths so ?next= can't be used as an open redirect.
function safeNext(next: string | null): string {
  if (!next) return "/book/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/book/dashboard";
  return next;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // When Supabase returns "Invalid login credentials", surface a friendly
  // signup nudge alongside — a lot of existing customers try to sign in
  // without ever having created an account.
  const [showSignupNudge, setShowSignupNudge] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setShowSignupNudge(false);
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);

    if (error) {
      const isCredsError = /invalid.*(login|credentials)/i.test(error.message);
      if (isCredsError) {
        setError(
          "That email and password don't match. If you've never signed up before, create an account below.",
        );
        setShowSignupNudge(true);
      } else {
        setError(error.message);
      }
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <span className="badge-amber mb-4 inline-flex">◆ ATHLETE LOGIN</span>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">
            SIGN
            <span className="block gradient-text">IN</span>
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mt-5" />
        </div>

        <div className="card-modern rounded-2xl p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-4">
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
              <div className="text-right mt-1.5">
                <Link
                  href="/book/forgot-password"
                  className="text-[#b07adf] hover:underline text-[11px] tracking-wider"
                >
                  Forgot password?
                </Link>
              </div>
            </Field>

            {error && (
              <div className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2.5 space-y-2">
                <p>{error}</p>
                {showSignupNudge && (
                  <Link
                    href={`/book/signup${next !== "/book/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
                    className="inline-block bg-[#9954d2] hover:bg-[#b07adf] text-black px-4 py-2 rounded-full text-[11px] tracking-widest font-black no-underline"
                  >
                    CREATE AN ACCOUNT →
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-gold w-full py-3.5 rounded-full text-sm tracking-widest font-black disabled:opacity-60"
            >
              {submitting ? "SIGNING IN…" : "SIGN IN"}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-6">
          New here?{" "}
          <Link
            href={`/book/signup${next !== "/book/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="text-[#b07adf] hover:underline"
          >
            Create an account
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
