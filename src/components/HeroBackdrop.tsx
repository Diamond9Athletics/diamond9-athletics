"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * The moving backdrop behind the name at the top of the home page:
 * drifting purple light, two stadium light beams, a glowing outline of a
 * ball field with hits flying out of home plate and a runner circling the
 * bases, and sparks floating up. On a computer, a glow follows the mouse.
 *
 * It all pauses while scrolled out of view and holds still for anyone whose
 * device asks for less motion. Styles live in globals.css (HOME HERO BACKDROP).
 */

type Vars = CSSProperties & Record<`--${string}`, string>;

/** Same "random" numbers on the server and in the browser, so the page hydrates cleanly. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = seeded(9);
const SPARKS = Array.from({ length: 26 }, (_, i) => {
  const size = `${1 + Math.floor(rand() * 3)}px`;
  return {
    phoneToo: i % 2 === 0,
    style: {
      left: `${(rand() * 100).toFixed(1)}%`,
      top: `${(60 + rand() * 45).toFixed(1)}%`,
      width: size,
      height: size,
      "--dur": `${(11 + rand() * 11).toFixed(1)}s`,
      "--delay": `${(-rand() * 22).toFixed(1)}s`,
      "--drift": `${Math.round(rand() * 70 - 35)}px`,
    } as Vars,
  };
});

// The field, seen from behind home plate (drawn in a 1440 × 800 box).
const HOME = "M708 714 L732 714 L732 720 L720 727 L708 720 Z";
const DIAMOND = "M720 720 L1020 552 L720 440 L420 552 Z"; // home → 1st → 2nd → 3rd → home
const BASES = [
  { d: "M1011 552 L1020 547 L1029 552 L1020 557 Z", delay: "2.33s" }, // 1st
  { d: "M711 440 L720 435 L729 440 L720 445 Z", delay: "4.5s" }, // 2nd
  { d: "M411 552 L420 547 L429 552 L420 557 Z", delay: "6.67s" }, // 3rd
];

/** Hits out of home plate: where each lands, and its own rhythm. */
const HITS = [
  { d: "M720 720 C650 420 520 250 380 300", land: [380, 300], dur: "9s", delay: "-1.2s" },
  { d: "M720 720 C712 330 640 110 560 128", land: [560, 128], dur: "11s", delay: "-6.4s" }, // over the fence
  { d: "M720 720 C800 560 930 420 1050 380", land: [1050, 380], dur: "8.5s", delay: "-3.7s" },
  { d: "M720 720 C840 400 1010 270 1150 320", land: [1150, 320], dur: "10s", delay: "-8.6s" },
  { d: "M720 720 C660 590 560 470 500 430", land: [500, 430], dur: "9.5s", delay: "-5.1s" },
];

export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;

    // Nothing moves while the top of the page is scrolled out of view.
    const io = new IntersectionObserver(([entry]) => {
      el.toggleAttribute("data-paused", !entry.isIntersecting);
    });
    io.observe(el);

    // The glow that follows the mouse (not on phones: there's no pointer to follow).
    const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let frame = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${Math.round(e.clientX - r.left)}px`);
        el.style.setProperty("--my", `${Math.round(e.clientY - r.top)}px`);
        el.setAttribute("data-pointer", "");
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      el.removeAttribute("data-pointer");
    };
    if (hasMouse) {
      host.addEventListener("pointermove", move);
      host.addEventListener("pointerleave", leave);
    }
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="hero-fx">
      <div className="fx-aurora fx-aurora-1" />
      <div className="fx-aurora fx-aurora-2" />
      <div className="fx-aurora fx-aurora-3" />
      <div className="fx-beam fx-beam-l" />
      <div className="fx-beam fx-beam-r" />
      <div className="grid-bg fx-grid" />

      {/* The field: still lines, drawn once. */}
      <svg className="fx-svg" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax slice">
        <g className="fx-lines">
          <path className="faint" d="M720 720 L1520 272 M720 720 L-80 272" vectorEffect="non-scaling-stroke" />
          <path className="fence" d="M90 367 Q720 -10 1350 367" vectorEffect="non-scaling-stroke" />
          <path className="faint" d="M330 502 Q720 290 1110 502" vectorEffect="non-scaling-stroke" />
          <path d={DIAMOND} vectorEffect="non-scaling-stroke" />
          <ellipse cx="720" cy="597" rx="26" ry="8" vectorEffect="non-scaling-stroke" />
          <ellipse className="faint" cx="720" cy="719" rx="44" ry="15" vectorEffect="non-scaling-stroke" />
          <path className="fill" d={HOME} />
        </g>
      </svg>

      {/* The plays: hits, landing spots, the runner and the bases lighting up. */}
      <svg className="fx-svg fx-plays" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax slice">
        {HITS.map((hit) => (
          <g key={hit.d} className="fx-hit" style={{ "--dur": hit.dur, "--delay": hit.delay } as Vars}>
            <path className="t" d={hit.d} pathLength={1000} />
            <path className="m" d={hit.d} pathLength={1000} />
            <path className="g" d={hit.d} pathLength={1000} />
            <path className="h" d={hit.d} pathLength={1000} />
            <ellipse className="p" cx={hit.land[0]} cy={hit.land[1]} rx="14" ry="5" />
          </g>
        ))}
        <path className="fx-runner g" d={DIAMOND} pathLength={1000} />
        <path className="fx-runner c" d={DIAMOND} pathLength={1000} />
        {BASES.map((base) => (
          <path key={base.d} className="fx-base" d={base.d} style={{ animationDelay: base.delay }} />
        ))}
        <path className="fx-base" d={HOME} />
      </svg>

      {SPARKS.map((spark, i) => (
        <span key={i} className={`fx-spark${spark.phoneToo ? "" : " fx-spark-wide"}`} style={spark.style} />
      ))}

      <div className="fx-scrim" />
      <div className="fx-spot" />
      <div className="fx-grid-reveal" />
      <div className="fx-fade" />
    </div>
  );
}
