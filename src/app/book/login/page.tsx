"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { planFromPath } from "@/lib/plans";
import { PlanContext } from "@/components/PlanContext";
import { FirstSteps } from "@/components/FirstSteps";

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
  // On the way to buying a plan: say which, and lead with making an account.
  const plan = planFromPath(next);
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
    <main className="pt-16 bg-[#0d0c11] min-h-screen">
      <section className="max-w-md mx-auto px-6 pt-8 pb-16 sm:py-16">
        <div className="text-center mb-8">
          <span className="badge-amber mb-4 inline-flex">{plan ? "◆ ALMOST THERE" : "◆ ATHLETE LOGIN"}</span>
          <h1 className="font-display text-[2.6rem] sm:text-5xl text-white leading-[1.04]">
            {plan ? "Your account" : "Sign in"}
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mt-5" />
        </div>

        {plan && (
          <>
            <FirstSteps current={1} />
            <PlanContext plan={plan} />
            <div className="card-modern rounded-2xl p-6 sm:p-8 mb-4 text-center">
              <p className="text-[#b07adf] text-xs tracking-widest font-bold mb-2">NEW TO D9?</p>
              <p className="text-zinc-400 text-sm leading-relaxed mb-5">
                Create your free account first &mdash; even if you&rsquo;ve trained with D9 before.
                It takes about a minute.
              </p>
              <Link
                href={signupHref}
                className="btn-gold block w-full py-3.5 rounded-full text-sm tracking-widest font-black"
              >
                Create an account
              </Link>
            </div>
          </>
        )}

        {searchParams.get("reason") === "signin-again" && (
          <p className="text-zinc-300 text-sm text-center leading-relaxed bg-[#9954d2]/10 border border-[#9954d2]/25 rounded-xl px-4 py-3 mb-4">
            For your security, coach and admin pages ask you to sign in again once a week.
          </p>
        )}

        <div className="card-modern rounded-2xl p-6 sm:p-8">
          {plan && (
            <p className="text-zinc-400 text-xs tracking-widest font-bold mb-4 text-center">
              ALREADY HAVE AN ACCOUNT? SIGN IN
            </p>
          )}
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
                  className="text-[#b07adf] hover:underline text-xs tracking-wider"
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
                    className="btn-gold inline-block px-4 py-2 rounded-full text-xs no-underline"
                  >
                    Create an account →
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-gold w-full py-3.5 rounded-full text-sm tracking-widest font-black disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Lots of athletes who trained with D9 before online booking try
            to sign in without ever having made an account — make the way
            in impossible to miss. (On the way to a plan it's up top.) */}
        {!plan && (
        <div className="card-modern rounded-2xl p-6 sm:p-8 mt-4 text-center">
          <p className="text-[#b07adf] text-xs tracking-widest font-bold mb-2">
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
            Create an account
          </Link>
        </div>
        )}
      </section>

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
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-zinc-500 text-xs tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}
