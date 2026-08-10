"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honey, setHoney] = useState(""); // bot honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Timestamp of first render — real users need at least ~2s to fill the form.
  const startedAt = useRef(Date.now());

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
      }),
    });
    const json = await res.json().catch(() => ({}));

    setSubmitting(false);

    if (!res.ok) {
      setError(json.error ?? "Something went wrong.");
      return;
    }

    if (json.needsSignIn) {
      router.push("/book/login");
      return;
    }

    // Session cookie is set — land straight on dashboard.
    router.push("/book/dashboard");
    router.refresh();
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
