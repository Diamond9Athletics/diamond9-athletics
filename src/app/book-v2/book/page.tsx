import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingFlow, type Trainer, type Bucket, type Service } from "./BookingFlow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Book a Session",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ reschedule?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/book-v2/login");

  const { reschedule: rescheduleId } = await searchParams;

  // If this is a reschedule, fetch the original booking so the flow
  // can pre-pick the service and trainer.
  let rescheduleFor: {
    bookingId: string;
    serviceId: string;
    trainerId: string;
    startsAt: string;
  } | null = null;
  if (rescheduleId) {
    const { data: orig } = await supabase
      .from("bookings")
      .select("id, service_id, trainer_id, starts_at, user_id, status")
      .eq("id", rescheduleId)
      .single();
    if (orig && orig.user_id === user.id && orig.status === "confirmed") {
      rescheduleFor = {
        bookingId: orig.id,
        serviceId: orig.service_id,
        trainerId: orig.trainer_id,
        startsAt: orig.starts_at,
      };
    }
  }

  // What can this athlete book? Pull their non-empty credit buckets.
  const { data: bucketRows } = await supabase
    .from("credit_buckets")
    .select(
      "id, credits_remaining, expires_at, service:services(id, name, category, duration_min)",
    )
    .eq("user_id", user.id)
    .gt("credits_remaining", 0);

  const buckets: Bucket[] = (bucketRows ?? []).flatMap((b) => {
    const svc = Array.isArray(b.service) ? b.service[0] : b.service;
    if (!svc) return [];
    return [
      {
        id: b.id,
        credits_remaining: b.credits_remaining,
        expires_at: b.expires_at,
        service: svc as Service,
      },
    ];
  });

  // Pull active trainers.
  const { data: trainerRows } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, trainer_slug, trainer_bio, trainer_categories")
    .eq("is_trainer", true);

  const trainers: Trainer[] = (trainerRows ?? []).map((t) => ({
    id: t.id,
    first_name: t.first_name,
    last_name: t.last_name,
    trainer_slug: t.trainer_slug,
    trainer_bio: t.trainer_bio,
    trainer_categories: (t.trainer_categories ?? []) as ("pitching" | "hitting")[],
  }));

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="section-label mb-3">USE YOUR CREDITS</p>
          <h1 className="font-display text-5xl sm:text-7xl text-white leading-none">
            BOOK A
            <span className="block gradient-text">SESSION</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-5" />
        </div>

        <BookingFlow
          buckets={buckets}
          trainers={trainers}
          rescheduleFor={rescheduleFor}
        />
      </section>
    </main>
  );
}
