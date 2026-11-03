"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Reset emails link here with ?token_hash=… (lib/auth/sign-in-link). The
 * token is only checked when the new password is saved — through
 * /api/auth/reset-password — so opening or previewing the link can't use
 * it up, and it still works after switching from an in-app browser.
 *
 * Without a token we need a session instead: earlier reset emails went
 * through /book/auth/confirm, which signs people in first, and older
 * Supabase-style links (?code= or #access_token=) still work too. Then the
 * page calls auth.updateUser({ password }) itself.
 */
export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The link was already used or is too old: offer a fresh one.
  const [expired, setExpired] = useState(false);
  const [done, setDone] = useState(false);
  // The reset link's token, checked when the new password is saved.
  const [tokenHash, setTokenHash] = useState<string | null>(null);

  // Establish the recovery session from the URL before showing the form.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const url = new URL(window.location.href);
      const params = url.searchParams;

      // 0) Current reset emails: nothing to verify until they save.
      const token = params.get("token_hash");
      if (token) {
        if (cancelled) return;
        setTokenHash(token);
        setReady(true);
        return;
      }

      // 1) Supabase can bounce back with error params on failure.
      const errParam =
        params.get("error_description") ?? params.get("error");
      if (errParam) {
        if (cancelled) return;
        setError(
          decodeURIComponent(errParam).replaceAll("+", " ") +
            " — request a new link from Forgot Password.",
        );
        setReady(true);
        return;
      }

      // 2) PKCE flow: `?code=…` query param → exchange for a session.
      const code = params.get("code");
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(
          code,
        );
        // Clean the URL either way so a refresh doesn't retry a stale code.
        window.history.replaceState({}, "", "/book/reset-password");
        if (exErr) {
          if (cancelled) return;
          setError(
            "This older link only works in the browser that asked for it. Head back to Forgot Password for a new one — new links work on any device.",
          );
          setReady(true);
          return;
        }
      }

      // 3) Implicit flow: `#access_token=…` hash (older admin emails). Our
      //    PKCE client won't pick that up on its own, so set it here.
      const hash = new URLSearchParams(url.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        window.history.replaceState({}, "", "/book/reset-password");
      }

      // Whichever way we got here, check that we're now signed in.
      const { data, error: userErr } = await supabase.auth.getUser();
      if (cancelled) return;
      if (userErr || !data.user) {
        setError("This reset link has expired or was already used.");
        setExpired(true);
      }
      setReady(true);
    }

    init();
    return () => {
      cancelled = true;
    };
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
    if (tokenHash) {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenHash, password }),
      }).catch(() => null);
      const json = await res?.json().catch(() => ({}));
      setSubmitting(false);
      if (!res?.ok) {
        setError(json?.error ?? "Couldn't save your password. Check your connection and try again.");
        setExpired(Boolean(json?.expired));
        // The link is used up but they're signed in, so a retry needs no token.
        if (json?.signedIn) setTokenHash(null);
        return;
      }
      window.history.replaceState({}, "", "/book/reset-password");
      setDone(true);
      return;
    }

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
                  {expired && (
                    <>
                      {" "}
                      <Link href="/book/forgot-password" className="text-white underline">
                        Send me a new link
                      </Link>
                    </>
                  )}
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
