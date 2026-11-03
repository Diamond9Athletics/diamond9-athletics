"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { img } from "@/lib/config";

export const BUILD_VERSION = "v1.9.1";

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
  { href: "https://shop.flyp.space/diamond9ath", label: "Shop", external: true },
];

// BOOK NOW for someone who isn't signed in: sign in (or create an account
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
        className={`flex items-center gap-1 text-sm font-medium tracking-wide transition-colors duration-200 ${
          active || open ? "text-[#b07adf]" : "text-zinc-400 hover:text-white"
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
          <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800/80 rounded-xl p-1.5 min-w-[180px] shadow-xl">
            {planLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-3.5 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-colors ${
                  pathname === l.href
                    ? "text-[#b07adf] bg-[#9954d2]/10"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-800/60"
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

  // Until we know, BOOK NOW goes through /book, which routes server-side.
  const bookHref =
    account === undefined ? "/book" : account ? "/book/schedule" : SIGNED_OUT_BOOK_HREF;
  const accountHref = account ? "/book/dashboard" : "/book/login";
  const accountLabel = account ? "MY ACCOUNT" : "SIGN IN";
  // Hold the button's space while checking so signed-in visitors never
  // see a flash of SIGN IN.
  const accountHidden = account === undefined ? "invisible" : "";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Top glow line */}
      <div className="divider-glow" />

      <div className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src={img("/images/d9-logo.png")}
                alt="Diamond Nine Athletics"
                className="h-[96px] w-auto mix-blend-screen group-hover:opacity-90 transition-opacity duration-200"
              />

            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-5 xl:gap-8">
              <PlansMenu pathname={pathname} />
              {navLinks.map((link) => (
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium tracking-wide transition-colors duration-200 text-zinc-400 hover:text-white"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
                      pathname === link.href
                        ? "text-[#b07adf]"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </div>

            {/* Theme Toggle + Account + Book Now */}
            <div className="hidden lg:flex items-center gap-3">
              <ThemeToggle />
              {account?.isTrainer && (
                <Link
                  href="/book/trainer"
                  className="btn-outline px-4 xl:px-5 py-2.5 rounded-full text-sm tracking-wider inline-block"
                >
                  MY SCHEDULE
                </Link>
              )}
              <Link
                href={accountHref}
                className={`btn-outline px-4 xl:px-5 py-2.5 rounded-full text-sm tracking-wider inline-block ${accountHidden}`}
              >
                {accountLabel}
              </Link>
              <Link
                href={bookHref}
                className="btn-gold px-5 xl:px-6 py-2.5 rounded-full text-sm tracking-wider inline-block"
              >
                BOOK NOW
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden text-white p-2"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 relative flex flex-col justify-between">
                <span
                  className={`w-full h-0.5 bg-white transition-all duration-300 ${
                    isOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                />
                <span
                  className={`w-full h-0.5 bg-white transition-all duration-300 ${
                    isOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`w-full h-0.5 bg-white transition-all duration-300 ${
                    isOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            isOpen ? "max-h-[640px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 pb-4 pt-2 space-y-1 bg-zinc-950/95 border-t border-zinc-800/50">
            <div className="flex items-center justify-between px-4 py-2 mb-1">
              <span className="text-zinc-500 text-xs tracking-wider">THEME</span>
              <ThemeToggle />
            </div>
            {[...planLinks, ...navLinks].map((link) => (
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-sm text-sm font-medium tracking-wide transition-colors text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-sm text-sm font-medium tracking-wide transition-colors ${
                    pathname === link.href
                      ? "text-[#b07adf] bg-[#9954d2]/5"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  }`}
                >
                  {link.label}
                </Link>
              )
            ))}
            {account?.isTrainer && (
              <Link
                href="/book/trainer"
                onClick={() => setIsOpen(false)}
                className="block mt-2 btn-outline px-4 py-3 rounded-full text-sm tracking-wider text-center"
              >
                MY SCHEDULE
              </Link>
            )}
            <Link
              href={accountHref}
              onClick={() => setIsOpen(false)}
              className={`block mt-2 btn-outline px-4 py-3 rounded-full text-sm tracking-wider text-center ${accountHidden}`}
            >
              {accountLabel}
            </Link>
            <Link
              href={bookHref}
              onClick={() => setIsOpen(false)}
              className="block mt-2 btn-gold px-4 py-3 rounded-full text-sm tracking-wider text-center"
            >
              BOOK NOW
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
