import type { ReactNode } from "react";

/**
 * The title band at the top of the site's inner pages: a quiet label, a big
 * sentence-case headline with its last words in purple, and a short line
 * under it. Kept short so the page's real content shows on a phone's first
 * screen.
 */
export function PageHero({
  badge,
  title,
  accent,
  subtitle,
  children,
}: {
  badge?: ReactNode;
  title: string;
  /** The purple end of the headline. */
  accent?: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative pt-14 pb-12 sm:pt-20 sm:pb-16 overflow-hidden border-b border-white/[0.06]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_85%_at_50%_0%,rgba(153,84,210,0.11)_0%,transparent_70%)]" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {badge && (
          <p className="text-zinc-500 text-[11px] font-medium tracking-[0.16em] mb-5">{badge}</p>
        )}
        <h1 className="font-display text-[2.6rem] leading-[1.03] sm:text-6xl lg:text-7xl text-white">
          {title}
          {accent && (
            <>
              {" "}
              <span className="text-[#b48ae6]">{accent}</span>
            </>
          )}
        </h1>
        {subtitle && (
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed mt-5 max-w-xl mx-auto">{subtitle}</p>
        )}
        {children}
      </div>
    </section>
  );
}
