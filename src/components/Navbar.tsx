"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { img, STORE_URL } from "@/lib/config";

export const BUILD_VERSION = "v1.18.3";

type NavLink = { href: string; label: string; external?: boolean };

// One "Plans" menu on desktop; the phone menu lists them directly.
const planLinks: NavLink[] = [
  { href: "/pitching-plans", label: "Pitching Plans" },
  { href: "/hitting-plans", label: "Hitting Plans" },
];

const navLinks: NavLink[] = [
  { href: "/app", label: "D9 App" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: STORE_URL, label: "Shop", external: true },
];

// The phone menu lists the plans directly, and the FAQ.
const mobileLinks: NavLink[] = [
  ...planLinks,
  ...navLinks.slice(0, 2),
  { href: "/faq", label: "FAQ" },
  ...navLinks.slice(2),
];

// "Book now" for someone who isn't signed in: sign in (or create an account
// from the sign-in page), then straight back to the calendar.
const SIGNED_OUT_BOOK_HREF = `/book/login?next=${encodeURIComponent("/book/schedule")}`;

type Account = { userId: string; isTrainer: boolean };

/**
 * Who's signed in, for the menu buttons. undefined while the session is
 * still being read, null when signed out. Re-checked on every navigation
 * so a sign-in that happened server-side (signup, waiver) shows up
 * without a reload. The Supabase client is loaded lazily so public pages
 * don't pay for it up front.
 */
function useAccount(pathname: string) {
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const known = useRef<Account | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user.id;
        if (!userId) {
          known.current = null;
        } else if (known.current?.userId !== userId) {
          const { data } = await supabase
            .from("profiles")
            .select("is_trainer")
            .eq("id", userId)
            .maybeSingle();
          known.current = { userId, isTrainer: Boolean(data?.is_trainer) };
        }
      } catch {
        known.current = null;
      }
      if (!cancelled) setAccount(known.current);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return account;
}

/**
 * Desktop "Plans ▾" menu. Opens on mouse hover, or on click/tap and the
 * keyboard; closes on Escape, an outside tap, or tabbing away.
 */
function PlansMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = planLinks.some((l) => l.href === pathname);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      // Hover only for a real mouse — on touch screens the tap toggles.
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 text-[13px] font-medium transition-colors duration-200 ${
          active || open ? "text-white" : "text-zinc-400 hover:text-white"
        }`}
      >
        Plans
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        // pt-3 (not mt-3) keeps the hover area continuous down to the panel.
        <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3">
          <div className="bg-[#141319] border border-white/10 rounded-xl p-1.5 min-w-[180px] shadow-2xl shadow-black/50">
            {planLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  pathname === l.href
                    ? "text-white bg-white/[0.06]"
                    : "text-zinc-300 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const account = useAccount(pathname);

  // Until we know, "Book now" goes through /book, which routes server-side.
  const bookHref =
    account === undefined ? "/book" : account ? "/book/schedule" : SIGNED_OUT_BOOK_HREF;
  const accountHref = account ? "/book/dashboard" : "/book/login";
  const accountLabel = account ? "My account" : "Sign in";
  // Hold the link's space while checking so signed-in visitors never
  // see a flash of "Sign in".
  const accountHidden = account === undefined ? "invisible" : "";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-[#0d0c11]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center shrink-0" aria-label="Diamond Nine Athletics home">
              <img
                src={img("/images/d9-wordmark.png")}
                alt="Diamond Nine Athletics"
                className="h-9 w-auto opacity-95 hover:opacity-100 transition-opacity duration-200"
              />
            </Link>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-7">
              <PlansMenu pathname={pathname} />
              {navLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-[13px] font-medium transition-colors duration-200 text-zinc-400 hover:text-white"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-[13px] font-medium transition-colors duration-200 ${
                      pathname === link.href ? "text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </div>

            {/* Account + Book now */}
            <div className="hidden lg:flex items-center gap-5">
              {account?.isTrainer && (
                <Link href="/book/trainer" className="text-[13px] font-medium text-zinc-300 hover:text-white transition-colors">
                  My schedule
                </Link>
              )}
              <Link
                href={accountHref}
                className={`text-[13px] font-medium text-zinc-300 hover:text-white transition-colors ${accountHidden}`}
              >
                {accountLabel}
              </Link>
              <Link
                href={bookHref}
                className="btn-gold inline-flex items-center gap-1.5 pl-4 pr-3.5 py-2 rounded-full text-[13px]"
              >
                Book now
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* Phone: the main action stays in sight, next to the menu. */}
            <div className="lg:hidden flex items-center gap-1">
              <Link
                href={bookHref}
                onClick={() => setIsOpen(false)}
                className="btn-gold px-4 py-2 rounded-full text-[13px]"
              >
                Book
              </Link>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-white p-3"
                aria-label="Toggle menu"
                aria-expanded={isOpen}
              >
                <div className="w-5 h-3.5 relative flex flex-col justify-between">
                  <span
                    className={`w-full h-px bg-white transition-all duration-300 ${
                      isOpen ? "rotate-45 translate-y-[6.5px]" : ""
                    }`}
                  />
                  <span
                    className={`w-full h-px bg-white transition-all duration-300 ${
                      isOpen ? "opacity-0" : ""
                    }`}
                  />
                  <span
                    className={`w-full h-px bg-white transition-all duration-300 ${
                      isOpen ? "-rotate-45 -translate-y-[6.5px]" : ""
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Phone menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            isOpen ? "max-h-[640px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 pb-5 pt-2 border-t border-white/[0.06]">
            {mobileLinks.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-2 py-3 text-[15px] font-medium border-b border-white/[0.05] transition-colors text-zinc-300 hover:text-white"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-2 py-3 text-[15px] font-medium border-b border-white/[0.05] transition-colors ${
                    pathname === link.href ? "text-white" : "text-zinc-300 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ),
            )}
            <div className="grid gap-2 pt-4">
              {account?.isTrainer && (
                <Link
                  href="/book/trainer"
                  onClick={() => setIsOpen(false)}
                  className="btn-outline px-4 py-3 rounded-full text-sm text-center"
                >
                  My schedule
                </Link>
              )}
              <Link
                href={accountHref}
                onClick={() => setIsOpen(false)}
                className={`btn-outline px-4 py-3 rounded-full text-sm text-center ${accountHidden}`}
              >
                {accountLabel}
              </Link>
              <Link
                href={bookHref}
                onClick={() => setIsOpen(false)}
                className="btn-gold px-4 py-3 rounded-full text-sm text-center"
              >
                Book now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
