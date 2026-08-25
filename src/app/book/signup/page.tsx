"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Only allow internal paths so ?next= can't be used as an open redirect.
function safeNext(next: string | null): string {
  if (!next) return "/book/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/book/dashboard";
  return next;
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Cloudflare Turnstile — global stub injected by their script.
declare global {
  interface Window {
    turnstile?: {
      render: (
        el: string | HTMLElement,
        opts: { sitekey: string; callback: (token: string) => void; theme?: string },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honey, setHoney] = useState(""); // bot honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  // Timestamp of first render — real users need at least ~2s to fill the form.
  const startedAt = useRef(Date.now());
  const turnstileWidgetRef = useRef<string | null>(null);

  // Mount Turnstile once the CF script loads.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    const tryRender = () => {
      if (window.turnstile && !turnstileWidgetRef.current) {
        turnstileWidgetRef.current = window.turnstile.render(
          "#turnstile-container",
          {
            sitekey: TURNSTILE_SITE_KEY,
            theme: "dark",
            callback: (token: string) => setTurnstileToken(token),
          },
        );
      }
    };
    tryRender();
    const t = setInterval(tryRender, 500);
    return () => clearInterval(t);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        honey,
        startedAt: startedAt.current,
        turnstileToken,
      }),
    });
    const json = await res.json().catch(() => ({}));

    setSubmitting(false);

    if (!res.ok) {
      setError(json.error ?? "Something went wrong.");
      // Reset Turnstile so the user gets a fresh challenge on retry.
      if (window.turnstile && turnstileWidgetRef.current) {
        window.turnstile.reset(turnstileWidgetRef.current);
        setTurnstileToken("");
      }
      return;
    }

    if (json.needsSignIn) {
      router.push(
        `/book/login${next !== "/book/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`,
      );
      return;
    }

    // Session cookie is set — land on the next page (or dashboard).
    router.push(next);
    router.refresh();
  }

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      {TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
          async
          defer
        />
      )}
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
          <form onSubmit={onSubmit} className="space-y-4" autoComplete="on">
            <p className="text-[#b07adf] text-[11px] tracking-wider bg-[#9954d2]/8 border border-[#9954d2]/20 rounded-lg px-3 py-2.5 leading-relaxed">
              <span className="font-bold">PARENTS:</span> please enter the <span className="text-white">player&rsquo;s</span> name here, not your own.
            </p>

            {/* Honeypot — invisible to humans, tempting to bots. */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
              <label htmlFor="middle_name">Middle name (leave blank)</label>
              <input
                id="middle_name"
                name="middle_name"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honey}
                onChange={(e) => setHoney(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="PLAYER FIRST NAME">
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input"
                  autoComplete="given-name"
                />
              </Field>
              <Field label="PLAYER LAST NAME">
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input"
                  autoComplete="family-name"
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

            {TURNSTILE_SITE_KEY && (
              <div id="turnstile-container" className="flex justify-center" />
            )}

            {error && (
              <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={
                submitting || (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)
              }
              className="btn-gold w-full py-3.5 rounded-full text-sm tracking-widest font-black disabled:opacity-60"
            >
              {submitting ? "CREATING…" : "CREATE ACCOUNT"}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-6">
          Already have an account?{" "}
          <Link
            href={`/book/login${next !== "/book/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="text-[#b07adf] hover:underline"
          >
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
