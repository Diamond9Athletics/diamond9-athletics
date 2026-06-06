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

export function BookingFlow({
  buckets,
  trainers,
}: {
  buckets: Bucket[];
  trainers: Trainer[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("service");
  const [bucket, setBucket] = useState<Bucket | null>(null);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // No credits → tell them to buy a package.
  if (buckets.length === 0) {
    return (
      <div className="card-modern rounded-2xl p-8 text-center space-y-5">
        <p className="text-[#b07adf] text-xs tracking-widest font-bold">NO CREDITS</p>
        <p className="text-zinc-300 text-sm">
          You don&rsquo;t have any active credits yet. Buy a package to start booking.
        </p>
        <Link
          href="/book-v2/packages"
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
          date={date}
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
          onBack={() => setStep("time")}
          onError={setError}
          onSuccess={(bookingId) => {
            router.push(`/book-v2/dashboard?booked=${bookingId}`);
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
  // De-dup: if the user has multiple buckets for the same service, list it once with the total.
  const grouped = useMemo(() => {
    const map = new Map<string, { service: Service; total: number; bucket: Bucket }>();
    for (const b of buckets) {
      const k = b.service.id;
      const prev = map.get(k);
      if (prev) {
        prev.total += b.credits_remaining;
      } else {
        map.set(k, { service: b.service, total: b.credits_remaining, bucket: b });
      }
    }
    return [...map.values()];
  }, [buckets]);

  return (
    <div className="card-modern rounded-2xl p-6 sm:p-8 space-y-3">
      <h2 className="font-display text-2xl text-white mb-2">Pick a service</h2>
      {grouped.map(({ service, total, bucket }) => (
        <button
          key={service.id}
          onClick={() => onPick(bucket)}
          className="w-full text-left flex items-center justify-between rounded-xl px-4 py-3 bg-zinc-900/50 border border-zinc-800 hover:border-[#9954d2]/50 transition"
        >
          <div>
            <p className="text-white text-sm font-bold">{service.name}</p>
            <p className="text-zinc-500 text-xs capitalize">{service.category} · {service.duration_min} min</p>
          </div>
          <span className="text-[#b07adf] text-xs font-bold">
            {total} {total === 1 ? "credit" : "credits"}
          </span>
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

function DateStep({
  onPick,
  onBack,
}: {
  onPick: (date: string) => void;
  onBack: () => void;
}) {
  // Next 21 days.
  const days = useMemo(() => {
    const out: Date[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 21; i++) {
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
          return (
            <button
              key={iso}
              onClick={() => onPick(iso)}
              className="rounded-xl px-2 py-3 bg-zinc-900/50 border border-zinc-800 hover:border-[#9954d2]/50 transition text-center"
            >
              <p className="text-zinc-500 text-[10px] tracking-wider">
                {d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}
              </p>
              <p className="text-white text-lg font-bold leading-tight">
                {d.getDate()}
              </p>
              <p className="text-zinc-600 text-[10px]">
                {d.toLocaleDateString(undefined, { month: "short" })}
              </p>
            </button>
          );
        })}
      </div>
      <BackButton onClick={onBack} />
    </div>
  );
}

function TimeStep({
  trainerId,
  duration,
  date,
  onPick,
  onBack,
}: {
  trainerId: string;
  duration: number;
  date: string;
  onPick: (iso: string) => void;
  onBack: () => void;
}) {
  const [slots, setSlots] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    setSlots(null);
    setError(null);
    fetch(`/api/booking/slots?trainer=${trainerId}&duration=${duration}&date=${date}`)
      .then((r) => r.json())
      .then((json) => {
        if (canceled) return;
        if (json.error) setError(json.error);
        else setSlots(json.slots ?? []);
      })
      .catch((err: Error) => !canceled && setError(err.message));
    return () => {
      canceled = true;
    };
  }, [trainerId, duration, date]);

  return (
    <div className="card-modern rounded-2xl p-6 sm:p-8 space-y-4">
      <h2 className="font-display text-2xl text-white mb-2">
        Pick a time —{" "}
        <span className="gradient-text">
          {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </span>
      </h2>
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
                {d.toLocaleTimeString(undefined, {
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
  onBack,
  onError,
  onSuccess,
}: {
  bucket: Bucket;
  trainer: Trainer;
  slot: string;
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
      <h2 className="font-display text-2xl text-white mb-2">Confirm your booking</h2>
      <div className="text-zinc-300 text-sm space-y-2">
        <Row label="Service" value={bucket.service.name} />
        <Row
          label="Trainer"
          value={`${trainer.first_name ?? ""} ${trainer.last_name ?? ""}`.trim()}
        />
        <Row
          label="When"
          value={start.toLocaleString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        />
        <Row label="Cost" value="1 credit" />
      </div>
      <button
        onClick={confirm}
        disabled={submitting}
        className="btn-gold w-full py-4 rounded-full text-sm tracking-widest font-black disabled:opacity-60"
      >
        {submitting ? "BOOKING…" : "CONFIRM BOOKING"}
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
