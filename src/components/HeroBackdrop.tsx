/**
 * The backdrop behind the name at the top of the home page, kept calm on
 * purpose: soft purple light drifting slowly, two stadium light beams
 * swaying, and a fine outline of a ball field that draws itself in once
 * when the page opens and then holds still.
 *
 * CSS only (no scripts). Styles live in globals.css under HOME HERO BACKDROP.
 * Devices set to reduce motion get the still picture.
 */

// The field, seen from behind home plate, drawn in a 1440 × 800 box.
const HOME = "M708 714 L732 714 L732 720 L720 727 L708 720 Z";
const BASES = [
  "M1011 552 L1020 547 L1029 552 L1020 557 Z", // 1st
  "M711 440 L720 435 L729 440 L720 445 Z", // 2nd
  "M411 552 L420 547 L429 552 L420 557 Z", // 3rd
];

export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="hero-fx">
      <div className="fx-aurora fx-aurora-1" />
      <div className="fx-aurora fx-aurora-2" />
      <div className="fx-aurora fx-aurora-3" />
      <div className="fx-beam fx-beam-l" />
      <div className="fx-beam fx-beam-r" />

      <svg className="fx-field" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMax slice">
        <path className="fx-draw faint" style={{ animationDelay: "0.35s" }} pathLength={1} d="M720 720 L1520 272" />
        <path className="fx-draw faint" style={{ animationDelay: "0.35s" }} pathLength={1} d="M720 720 L-80 272" />
        <path className="fx-draw" style={{ animationDelay: "0.55s" }} pathLength={1} d="M720 720 L1020 552 L720 440 L420 552 Z" />
        <path className="fx-draw faint" style={{ animationDelay: "0.85s" }} pathLength={1} d="M330 502 Q720 290 1110 502" />
        <path className="fx-draw fence" style={{ animationDelay: "1s" }} pathLength={1} d="M90 367 Q720 -10 1350 367" />
        <g className="fx-appear">
          <ellipse cx="720" cy="597" rx="26" ry="8" />
          <path className="solid" d={HOME} />
          {BASES.map((d) => (
            <path key={d} className="solid" d={d} />
          ))}
        </g>
      </svg>

      <div className="fx-grain" />
      <div className="fx-scrim" />
      <div className="fx-fade" />
    </div>
  );
}
