import type { ReactNode } from "react";

/**
 * The title band at the top of the site's inner pages. Kept short so the
 * page's real content (plans, prices, answers) shows on a phone's first
 * screen. No stock photo: real D9 photos live in the page content.
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
  /** The purple half of the title. */
  accent?: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative pt-10 pb-8 sm:pt-14 sm:pb-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_90%_at_50%_0%,rgba(153,84,210,0.12)_0%,transparent_100%)]" />
      <div className="absolute inset-0 grid-bg opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {badge && <span className="badge-amber mb-4 inline-flex">{badge}</span>}
        <h1 className="font-display leading-none text-5xl sm:text-6xl lg:text-7xl">
          <span className="text-white">{title}</span>
          {accent && (
            <>
              {" "}
              <span className="gradient-text">{accent}</span>
            </>
          )}
        </h1>
        <div className="divider-glow max-w-[100px] mx-auto mt-4" />
        {subtitle && (
          <p className="text-zinc-400 text-sm sm:text-base mt-4 max-w-xl mx-auto">{subtitle}</p>
        )}
        {children}
      </div>
    </section>
  );
}
