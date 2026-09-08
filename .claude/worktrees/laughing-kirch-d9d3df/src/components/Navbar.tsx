"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { img } from "@/lib/config";

export const BUILD_VERSION = "v1.6.0";

const navLinks = [
  { href: "/pitching-plans", label: "Pitching Plans" },
  { href: "/hitting-plans", label: "Hitting Plans" },
  { href: "https://shop.flyp.space/diamond9ath", label: "Shop", external: true },
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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
            <div className="hidden md:flex items-center gap-8">
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

            {/* Theme Toggle + Book Now */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              <Link
                href="/appointments"
                className="btn-gold px-6 py-2.5 rounded-full text-sm tracking-wider inline-block"
              >
                BOOK NOW
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-white p-2"
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
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 pb-4 pt-2 space-y-1 bg-zinc-950/95 border-t border-zinc-800/50">
            <div className="flex items-center justify-between px-4 py-2 mb-1">
              <span className="text-zinc-500 text-xs tracking-wider">THEME</span>
              <ThemeToggle />
            </div>
            {navLinks.map((link) => (
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
            <Link
              href="/appointments"
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
