import { img } from "@/lib/config";

/**
 * The cinematic picture behind the name at the top of the home page: the
 * night-game ballpark photo, tinted purple, drifting slowly like a camera
 * move, with soft stadium light and haze passing over it and shade to keep
 * the words readable.
 *
 * CSS only. Styles live in globals.css under HOME HERO BACKDROP. Devices set
 * to reduce motion get the still picture.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="hero-fx">
      <div className="fx-camera">
        {/* eslint-disable-next-line @next/next/no-img-element -- a plain, eagerly loaded background picture */}
        <img className="fx-photo" src={img("/images/hero-main.jpg")} alt="" fetchPriority="high" decoding="async" />
      </div>
      <div className="fx-tint" />
      <div className="fx-light" />
      <div className="fx-mist" />
      <div className="fx-shade" />
      <div className="fx-grain" />
    </div>
  );
}
