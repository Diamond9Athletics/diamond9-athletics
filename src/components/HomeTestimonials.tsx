import { testimonials } from "@/lib/testimonials";

export function HomeTestimonials() {
  if (testimonials.length === 0) return null;

  return (
    <section className="relative py-24 px-6 bg-[#040200] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#9954d2]/30 to-transparent" />
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="section-label mb-3">RESULTS</p>
          <h2 className="font-display text-5xl sm:text-7xl text-white">
            WHAT ATHLETES <span className="gradient-text">SAY</span>
          </h2>
          <div className="divider-glow max-w-[120px] mx-auto mt-5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className="card-modern rounded-2xl p-7 card-lift flex flex-col"
            >
              <svg
                className="w-8 h-8 text-[#9954d2]/60 mb-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7.17 6C4.86 6 3 7.86 3 10.17V15h5V9.17H5.83c0-.92.75-1.67 1.67-1.67V6zm10 0c-2.31 0-4.17 1.86-4.17 4.17V15h5V9.17h-2.17c0-.92.75-1.67 1.67-1.67V6z" />
              </svg>
              <blockquote className="text-zinc-200 text-sm sm:text-base leading-relaxed flex-1">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 pt-4 border-t border-white/5">
                <p className="text-white text-sm font-bold">{t.name}</p>
                {t.detail && (
                  <p className="text-zinc-500 text-xs mt-0.5">{t.detail}</p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
