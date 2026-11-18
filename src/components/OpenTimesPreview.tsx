"use client";

import { useEffect, useState } from "react";
import { addDays } from "@/lib/booking/coach-calendar";

const TZ = "America/Chicago";
/** Times shown per day before "+N more". */
const PER_DAY = 8;

type Coach = { name: string; slug: string | null; days: { date: string; slots: string[] }[] };

/**
 * This week's open times on the plan pages, so visitors can see there's
 * room before they make an account. Read-only: booking needs a plan.
 */
export function OpenTimesPreview({ category }: { category: "pitching" | "hitting" }) {
  const [coaches, setCoaches] = useState<Coach[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let canceled = false;
    fetch(`/api/public/open-times?category=${category}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: { coaches?: Coach[] }) => {
        if (!canceled) setCoaches(json.coaches ?? []);
      })
      .catch(() => {
        if (!canceled) setFailed(true);
      });
    return () => {
      canceled = true;
    };
  }, [category]);

  // If the schedule can't be read, leave the section out rather than show an error.
  if (failed) return null;
  const withTimes = (coaches ?? []).filter((c) => c.days.length > 0);

  return (
    <section className="max-w-6xl mx-auto px-6 pb-16">
      <div className="card-modern rounded-2xl p-6 sm:p-8">
        <p className="section-label mb-2">THIS WEEK</p>
        <h2 className="font-display text-3xl sm:text-4xl text-white leading-none mb-2">
          OPEN <span className="gradient-text">TIMES</span>
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          Times a new athlete can book right now. Pick a plan above to grab one.
        </p>

        {coaches === null ? (
          <p className="text-zinc-500 text-sm" role="status">Checking the schedule…</p>
        ) : withTimes.length === 0 ? (
          <p className="text-zinc-300 text-sm">
            This week is booked up. New times open up as schedules change, so check back soon.
          </p>
        ) : (
          <div className="space-y-6">
            {withTimes.map((c) => (
              <div key={c.slug ?? c.name}>
                <p className="text-zinc-300 text-xs tracking-widest font-bold mb-3">
                  WITH {c.name.toUpperCase()}
                </p>
                <ul className="space-y-3">
                  {c.days.map((d) => (
                    <li key={d.date} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                      <span className="text-white text-sm font-semibold sm:w-32 shrink-0 sm:pt-1">
                        {dayLabel(d.date)}
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        {d.slots.slice(0, PER_DAY).map((s) => (
                          <span
                            key={s}
                            className="text-xs text-zinc-200 bg-zinc-900/60 border border-zinc-800 rounded-full px-3 py-1.5"
                          >
                            {timeLabel(s)}
                          </span>
                        ))}
                        {d.slots.length > PER_DAY && (
                          <span className="text-xs text-zinc-400 px-1 py-1.5">
                            +{d.slots.length - PER_DAY} more
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** "Today", "Tomorrow", or "Thu, Nov 20" for a studio date (YYYY-MM-DD). */
function dayLabel(date: string) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
}
