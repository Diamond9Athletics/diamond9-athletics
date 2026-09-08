"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type Service = {
  id: string;
  name: string;
  category: "pitching" | "hitting";
  duration_min: number;
};

export type Bucket = {
  id: string;
  credits_remaining: number;
  expires_at: string | null;
  service: Service;
  /** True when this "bucket" is really an active subscription entitlement,
   * not a purchased credit pack. Renders as ∞ / UNLIMITED. */
  isSubscription?: boolean;
};

export type Trainer = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  trainer_slug: string | null;
  trainer_bio: string | null;
  trainer_categories: ("pitching" | "hitting")[];
};

type Step = "service" | "trainer" | "date" | "time" | "confirm";

type BlockRange = {
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

export type RescheduleFor = {
  bookingId: string;
  serviceId: string;
  trainerId: string;
  startsAt: string;
} | null;

export function BookingFlow({
  buckets,
  trainers,
  rescheduleFor = null,
}: {
  buckets: Bucket[];
  trainers: Trainer[];
  rescheduleFor?: RescheduleFor;
}) {
  const router = useRouter();
  // Pre-select bucket and trainer when rescheduling.
  const presetBucket = rescheduleFor
    ? buckets.find((b) => b.service.id === rescheduleFor.serviceId) ?? null
    : null;
  const presetTrainer = rescheduleFor
    ? trainers.find((t) => t.id === rescheduleFor.trainerId) ?? null
    : null;
  const [step, setStep] = useState<Step>(
    rescheduleFor && presetBucket && presetTrainer ? "date" : "service",
  );
  const [bucket, setBucket] = useState<Bucket | null>(presetBucket);
  const [trainer, setTrainer] = useState<Trainer | null>(presetTrainer);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<BlockRange[]>([]);

  // When a trainer is picked, pull their upcoming blocks so the date
  // and time pickers can surface *why* certain days are unavailable
  // instead of just showing nothing.
  useEffect(() => {
    if (!trainer) {
      setBlocks([]);
      return;
    }
    let canceled = false;
    fetch(`/api/booking/blocks?trainer=${trainer.id}&days=31`)
      .then((r) => r.json())
      .then((json) => {
        if (canceled) return;
        setBlocks(json.blocks ?? []);
      })
      .catch(() => {
        if (!canceled) setBlocks([]);
      });
    return () => {
      canceled = true;
    };
  }, [trainer]);

  // No credits → tell them to buy a package.
  // Reschedule is fine even when buckets are empty (we'll refund the credit
  // first), so skip this check in that mode.
  if (buckets.length === 0 && !rescheduleFor) {
    return (
      <div className="card-modern rounded-2xl p-8 text-center space-y-5">
        <p className="text-[#b07adf] text-xs tracking-widest font-bold">NO CREDITS</p>
        <p className="text-zinc-300 text-sm">
          You don&rsquo;t have any active credits yet. Buy a package to start booking.
        </p>
        <Link
          href="/book/packages"
          className="btn-gold inline-block px-8 py-3 rounded-full text-xs tracking-widest font-black"
        >
          SEE PACKAGES
        </Link>
      </div>
    );
  }

  const eligibleTrainers = trainer
    ? [trainer]
    : trainers.filter((t) =>
        bucket ? t.trainer_categories.includes(bucket.service.category) : false,
      );

  // Auto-skip trainer step if there's only one match.
  function pickBucket(b: Bucket) {
    setBucket(b);
    setError(null);
    const matches = trainers.filter((t) =>
      t.trainer_categories.includes(b.service.category),
    );
    if (matches.length === 1) {
      setTrainer(matches[0]);
      setStep("date");
    } else {
      setStep("trainer");
    }
  }

  return (
    <div className="space-y-6">
      {rescheduleFor && (
        <div className="rounded-2xl border border-[#9954d2]/30 bg-[#9954d2]/10 px-4 py-3">
          <p className="text-[10px] tracking-widest text-[#b07adf] font-bold mb-1">
            RESCHEDULING
          </p>
          <p className="text-zinc-300 text-sm">
            Your current booking is{" "}
            <span className="text-white">
              {new Date(rescheduleFor.startsAt).toLocaleString("en-US", {
                timeZone: "America/Chicago",
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            . Pick a new time below — it&rsquo;ll be cancelled and the credit reused.
          </p>
        </div>
      )}
      <Stepper step={step} />

      {step === "service" && (
        <ServiceStep buckets={buckets} onPick={pickBucket} />
      )}

      {step === "trainer" && bucket && (
        <TrainerStep
          trainers={eligibleTrainers}
          onPick={(t) => {
            setTrainer(t);
            setStep("date");
          }}
          onBack={() => setStep("service")}
        />
      )}

      {step === "date" && bucket && trainer && (
        <DateStep
          blocks={blocks}
          onPick={(d) => {
            setDate(d);
            setStep("time");
          }}
          onBack={() => setStep(trainer ? "trainer" : "service")}
        />
      )}

      {step === "time" && bucket && trainer && date && (
        <TimeStep
          trainerId={trainer.id}
          duration={bucket.service.duration_min}
          category={bucket.service.category}
          date={date}
          blocks={blocks}
          onPick={(iso) => {
            setSlot(iso);
            setStep("confirm");
          }}
          onBack={() => setStep("date")}
        />
      )}

      {step === "confirm" && bucket && trainer && slot && (
        <ConfirmStep
          bucket={bucket}
          trainer={trainer}
          slot={slot}
          rescheduleFor={rescheduleFor}
          onBack={() => setStep("time")}
          onError={setError}
          onSuccess={(bookingId) => {
            router.push(`/book/dashboard?booked=${bookingId}`);
            router.refresh();
          }}
        />
      )}

      {error && (
        <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "service", label: "Service" },
    { id: "trainer", label: "Trainer" },
    { id: "date", label: "Date" },
    { id: "time", label: "Time" },
    { id: "confirm", label: "Confirm" },
  ];
  const currentIdx = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex justify-between text-[10px] tracking-widest text-zinc-600 mb-2">
      {steps.map((s, i) => (
        <span
          key={s.id}
          className={
            i === currentIdx
              ? "text-[#b07adf] font-bold"
              : i < currentIdx
                ? "text-zinc-400"
                : ""
          }
        >
          {i + 1}. {s.label.toUpperCase()}
        </span>
      ))}
    </div>
  );
}

function ServiceStep({
  buckets,
  onPick,
}: {
  buckets: Bucket[];
  onPick: (b: Bucket) => void;
}) {
  // Group by service. A subscription "bucket" always wins as the picked
  // bucket for that service — booking route bypasses credit deduction
  // when the subscription covers it.
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { service: Service; total: number; bucket: Bucket; isSubscription: boolean }
    >();
    for (const b of buckets) {
      const k = b.service.id;
      const prev = map.get(k);
      if (prev) {
        if (!b.isSubscription) prev.total += b.credits_remaining;
        if (b.isSubscription) {
          prev.isSubscription = true;
          prev.bucket = b;
        }
      } else {
        map.set(k, {
          service: b.service,
          total: b.isSubscription ? 0 : b.credits_remaining,
          bucket: b,
          isSubscription: !!b.isSubscription,
        });
      }
    }
    return [...map.values()];
  }, [buckets]);

  return (
    <div className="card-modern rounded-2xl p-6 sm:p-8 space-y-3">
      <h2 className="font-display text-2xl text-white mb-2">Pick a service</h2>
      {grouped.map(({ service, total, bucket, isSubscription }) => (
        <button
          key={service.id}
          onClick={() => onPick(bucket)}
          className="w-full text-left flex items-center justify-between rounded-xl px-4 py-3 bg-zinc-900/50 border border-zinc-800 hover:border-[#9954d2]/50 transition"
        >
          <div>
            <p className="text-white text-sm font-bold">{service.name}</p>
            <p className="text-zinc-500 text-xs capitalize">{service.category} · {service.duration_min} min</p>
          </div>
          {isSubscription ? (
            <span className="text-[#b07adf] text-xs font-bold flex items-baseline gap-1">
              <span className="text-lg leading-none">∞</span>
              <span>UNLIMITED</span>
            </span>
          ) : (
            <span className="text-[#b07adf] text-xs font-bold">
              {total} {total === 1 ? "credit" : "credits"}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function TrainerStep({
  trainers,
  onPick,
  onBack,
}: {
  trainers: Trainer[];
  onPick: (t: Trainer) => void;
  onBack: () => void;
}) {
  return (
    <div className="card-modern rounded-2xl p-6 sm:p-8 space-y-3">
      <h2 className="font-display text-2xl text-white mb-2">Pick a trainer</h2>
      {trainers.length === 0 ? (
        <p className="text-zinc-400 text-sm">No trainer available for this service yet.</p>
      ) : (
        trainers.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t)}
            className="w-full text-left rounded-xl px-4 py-3 bg-zinc-900/50 border border-zinc-800 hover:border-[#9954d2]/50 transition"
          >
            <p className="text-white text-sm font-bold">
              {t.first_name} {t.last_name}
            </p>
            {t.trainer_bio && (
              <p className="text-zinc-500 text-xs mt-1">{t.trainer_bio}</p>
            )}
          </button>
        ))
      )}
      <BackButton onClick={onBack} />
    </div>
  );
}

/** Return the day-of-CT-time span [00:00, 24:00) for a YYYY-MM-DD date. */
function ctDayBounds(dateIso: string): { start: Date; end: Date } {
  // Interpret the ISO date as noon CT and clip to day. Good enough for
  // determining whether a block overlaps this day (blocks are minute-
  // granular but we compare day-buckets for the picker).
  const noon = new Date(`${dateIso}T12:00:00-05:00`);
  const dayLabel = noon.toLocaleDateString("en-CA", {
    timeZone: "America/Chicago",
  });
  const start = new Date(`${dayLabel}T00:00:00-05:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function blocksForDay(blocks: BlockRange[], dateIso: string): BlockRange[] {
  const { start, end } = ctDayBounds(dateIso);
  return blocks.filter((b) => {
    const bs = new Date(b.starts_at).getTime();
    const be = new Date(b.ends_at).getTime();
    return bs < end.getTime() && be > start.getTime();
  });
}

/** Does a block cover the entire day? */
function isFullDayBlock(block: BlockRange, dateIso: string): boolean {
  const { start, end } = ctDayBounds(dateIso);
  const bs = new Date(block.starts_at).getTime();
  const be = new Date(block.ends_at).getTime();
  return bs <= start.getTime() && be >= end.getTime();
}

function DateStep({
  blocks,
  onPick,
  onBack,
}: {
  blocks: BlockRange[];
  onPick: (date: string) => void;
  onBack: () => void;
}) {
  // Next 31 days.
  const days = useMemo(() => {
    const out: Date[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 31; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  return (
    <div className="card-modern rounded-2xl p-6 sm:p-8 space-y-4">
      <h2 className="font-display text-2xl text-white mb-2">Pick a date</h2>
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
        {days.map((d) => {
          const iso = isoDate(d);
          const dayBlocks = blocksForDay(blocks, iso);
          const fullDay = dayBlocks.some((b) => isFullDayBlock(b, iso));
          const partial = dayBlocks.length > 0 && !fullDay;
          const label = fullDay ? "UNAVAILABLE" : partial ? "PARTIAL" : null;
          return (
            <button
              key={iso}
              onClick={() => onPick(iso)}
              className={`rounded-xl px-2 py-3 border transition text-center ${
                fullDay
                  ? "bg-red-950/20 border-red-900/40 hover:border-red-500/60"
                  : partial
                    ? "bg-amber-950/15 border-amber-900/30 hover:border-amber-500/40"
                    : "bg-zinc-900/50 border-zinc-800 hover:border-[#9954d2]/50"
              }`}
              title={
                dayBlocks
                  .map((b) => b.reason ?? "Blocked")
                  .join(" · ") || undefined
              }
            >
              <p className="text-zinc-500 text-[10px] tracking-wider">
                {d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}
              </p>
              <p className={`text-lg font-bold leading-tight ${fullDay ? "text-red-300" : "text-white"}`}>
                {d.getDate()}
              </p>
              <p className="text-zinc-600 text-[10px]">
                {d.toLocaleDateString(undefined, { month: "short" })}
              </p>
              {label && (
                <p
                  className={`text-[8px] tracking-widest font-bold mt-1 ${
                    fullDay ? "text-red-400" : "text-amber-400"
                  }`}
                >
                  {label}
                </p>
              )}
            </button>
          );
        })}
      </div>
      {(() => {
        const upcomingBlocked = days
          .map((d) => ({ iso: isoDate(d), d }))
          .flatMap(({ iso, d }) =>
            blocksForDay(blocks, iso).map((b) => ({ iso, d, b })),
          );
        if (upcomingBlocked.length === 0) return null;
        return (
          <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-3 mt-3">
            <p className="text-[10px] tracking-widest text-zinc-500 font-bold mb-2">
              UPCOMING BLOCKED TIMES
            </p>
            <ul className="space-y-1">
              {upcomingBlocked.slice(0, 6).map(({ iso, d, b }, i) => (
                <li key={`${iso}-${i}`} className="text-xs text-zinc-400">
                  <span className="text-white">
                    {d.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {isFullDayBlock(b, iso) ? (
                    <span className="text-red-400"> · all day</span>
                  ) : (
                    <span className="text-amber-400">
                      {" "}·{" "}
                      {new Date(b.starts_at).toLocaleTimeString("en-US", {
                        timeZone: "America/Chicago",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {" – "}
                      {new Date(b.ends_at).toLocaleTimeString("en-US", {
                        timeZone: "America/Chicago",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  {b.reason && (
                    <span className="text-zinc-500"> · {b.reason}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })()}
      <BackButton onClick={onBack} />
    </div>
  );
}

function TimeStep({
  trainerId,
  duration,
  category,
  date,
  blocks,
  onPick,
  onBack,
}: {
  trainerId: string;
  duration: number;
  category: string;
  date: string;
  blocks: BlockRange[];
  onPick: (iso: string) => void;
  onBack: () => void;
}) {
  const dayBlocks = blocksForDay(blocks, date);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    let firstLoad = true;

    async function loadSlots() {
      if (firstLoad) {
        setSlots(null);
      }
      setError(null);
      try {
        const res = await fetch(
          `/api/booking/slots?trainer=${trainerId}&duration=${duration}&category=${category}&date=${date}`,
        );
        const json = await res.json();
        if (canceled) return;
        if (json.error) {
          setError(json.error);
        } else {
          setSlots(json.slots ?? []);
        }
      } catch (err) {
        if (!canceled) setError((err as Error).message);
      } finally {
        firstLoad = false;
      }
    }

    loadSlots();

    // Refresh every 30s while the tab is visible so someone who leaves
    // the picker open doesn't see a stale slot fill up under them.
    const interval = window.setInterval(() => {
      if (!document.hidden) loadSlots();
    }, 30_000);

    // When the tab regains focus (opened yesterday, revisited now),
    // force a fresh pull immediately.
    function onFocus() {
      if (!document.hidden) loadSlots();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      canceled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [trainerId, duration, category, date]);

  return (
    <div className="card-modern rounded-2xl p-6 sm:p-8 space-y-4">
      <h2 className="font-display text-2xl text-white mb-2">
        Pick a time —{" "}
        <span className="gradient-text">
          {new Date(`${date}T12:00:00-05:00`).toLocaleDateString("en-US", {
            timeZone: "America/Chicago",
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </span>
      </h2>
      {dayBlocks.length > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-3">
          <p className="text-[10px] tracking-widest text-amber-400 font-bold mb-1">
            {dayBlocks.some((b) => isFullDayBlock(b, date))
              ? "TRAINER OUT ALL DAY"
              : "PARTIALLY UNAVAILABLE"}
          </p>
          <ul className="space-y-0.5">
            {dayBlocks.map((b, i) => (
              <li key={i} className="text-xs text-zinc-300">
                {isFullDayBlock(b, date) ? (
                  "All day"
                ) : (
                  <>
                    {new Date(b.starts_at).toLocaleTimeString("en-US", {
                      timeZone: "America/Chicago",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {" – "}
                    {new Date(b.ends_at).toLocaleTimeString("en-US", {
                      timeZone: "America/Chicago",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </>
                )}
                {b.reason && (
                  <span className="text-zinc-400"> · {b.reason}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {slots === null && !error && (
        <p className="text-zinc-500 text-xs">Loading…</p>
      )}
      {slots && slots.length === 0 && !error && (
        <p className="text-zinc-400 text-sm">
          No open slots that day. Try another date.
        </p>
      )}
      {slots && slots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {slots.map((iso) => {
            const d = new Date(iso);
            return (
              <button
                key={iso}
                onClick={() => onPick(iso)}
                className="rounded-xl px-2 py-3 bg-zinc-900/50 border border-zinc-800 hover:border-[#9954d2]/50 transition text-white text-sm"
              >
                {d.toLocaleTimeString("en-US", {
                  timeZone: "America/Chicago",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </button>
            );
          })}
        </div>
      )}
      <BackButton onClick={onBack} />
    </div>
  );
}

function ConfirmStep({
  bucket,
  trainer,
  slot,
  rescheduleFor,
  onBack,
  onError,
  onSuccess,
}: {
  bucket: Bucket;
  trainer: Trainer;
  slot: string;
  rescheduleFor: RescheduleFor;
  onBack: () => void;
  onError: (msg: string) => void;
  onSuccess: (id: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const start = new Date(slot);

  async function confirm() {
    setSubmitting(true);
    onError("");
    const res = await fetch("/api/booking/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trainerId: trainer.id,
        serviceId: bucket.service.id,
        startsAt: slot,
        rescheduleFor: rescheduleFor?.bookingId ?? null,
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      onError(json.error ?? "Could not confirm booking.");
      return;
    }
    onSuccess(json.booking.id);
  }

  return (
    <div className="card-modern-amber rounded-2xl p-6 sm:p-8 space-y-4">
      <h2 className="font-display text-2xl text-white mb-2">
        {rescheduleFor ? "Confirm reschedule" : "Confirm your booking"}
      </h2>
      <div className="text-zinc-300 text-sm space-y-2">
        <Row label="Service" value={bucket.service.name} />
        <Row
          label="Trainer"
          value={`${trainer.first_name ?? ""} ${trainer.last_name ?? ""}`.trim()}
        />
        <Row
          label="When"
          value={start.toLocaleString("en-US", {
            timeZone: "America/Chicago",
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        />
        <Row label="Cost" value={rescheduleFor ? "No charge (reusing credit)" : "1 credit"} />
      </div>
      <button
        onClick={confirm}
        disabled={submitting}
        className="btn-gold w-full py-4 rounded-full text-sm tracking-widest font-black disabled:opacity-60"
      >
        {submitting ? "BOOKING…" : rescheduleFor ? "CONFIRM RESCHEDULE" : "CONFIRM BOOKING"}
      </button>
      <BackButton onClick={onBack} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-2">
      <span className="text-zinc-500 text-xs tracking-widest uppercase">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-zinc-500 hover:text-[#b07adf] text-xs tracking-wider mt-2"
    >
      ← BACK
    </button>
  );
}

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
