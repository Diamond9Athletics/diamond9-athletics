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
  const signupHref = `/book/signup${next !== "/book/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`;
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

    // replace, not push — Back shouldn't land on the sign-in form again.
    router.replace(next);
    router.refresh();
  }

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-md mx-auto px-6 pt-8 pb-16 sm:py-16">
        <div className="text-center mb-8">
          <span className="badge-amber mb-4 inline-flex">◆ ATHLETE LOGIN</span>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">
            SIGN
            <span className="block gradient-text">IN</span>
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mt-5" />
        </div>

        {searchParams.get("reason") === "signin-again" && (
          <p className="text-zinc-300 text-sm text-center leading-relaxed bg-[#9954d2]/10 border border-[#9954d2]/25 rounded-xl px-4 py-3 mb-4">
            For your security, coach and admin pages ask you to sign in again once a week.
          </p>
        )}

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
                    href={signupHref}
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

        {/* Lots of athletes who trained with D9 before online booking try
            to sign in without ever having made an account — make the way
            in impossible to miss. */}
        <div className="card-modern rounded-2xl p-6 sm:p-8 mt-4 text-center">
          <p className="text-[#b07adf] text-[10px] tracking-widest font-bold mb-2">
            FIRST TIME BOOKING ONLINE?
          </p>
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            Create your free account first &mdash; even if you&rsquo;ve trained with D9 before.
            It takes about a minute.
          </p>
          <Link
            href={signupHref}
            className="btn-outline block w-full py-3.5 rounded-full text-sm tracking-widest font-black"
          >
            CREATE AN ACCOUNT
          </Link>
        </div>
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
