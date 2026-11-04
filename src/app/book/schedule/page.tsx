import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BookingFlow,
  type AthleteOption,
  type Trainer,
  type Bucket,
  type RescheduleFor,
  type Service,
} from "./BookingFlow";
import { requireWaiver } from "@/lib/legal/waiver";
import { diamondMemberships } from "@/lib/stripe/subscription";
import { fullName, keyOf, loadFamily } from "@/lib/booking/athletes";

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
  if (!user) redirect("/book/login");

  const { reschedule: rescheduleId } = await searchParams;
  await requireWaiver(
    supabase,
    user,
    rescheduleId ? `/book/schedule?reschedule=${rescheduleId}` : "/book/schedule",
  );

  // If this is a reschedule, fetch the original booking so the flow
  // can pre-pick the service and trainer.
  let rescheduleFor: RescheduleFor = null;
  if (rescheduleId) {
    const { data: orig } = await supabase
      .from("bookings")
      .select(
        "id, trainer_id, starts_at, user_id, athlete_id, status, service:services(id, name, category, duration_min)",
      )
      .eq("id", rescheduleId)
      .single();
    const service = Array.isArray(orig?.service) ? orig.service[0] : orig?.service;
    if (orig && service && orig.user_id === user.id && orig.status === "confirmed") {
      rescheduleFor = {
        bookingId: orig.id,
        service: service as Service,
        trainerId: orig.trainer_id,
        startsAt: orig.starts_at,
        athleteKey: keyOf(orig.athlete_id),
      };
    }
  }

  // Everyone on the account; a family books for one of them at a time.
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();
  const family = await loadFamily(supabase, user.id, {
    first_name: profile?.first_name ?? null,
    last_name: profile?.last_name ?? null,
    email: user.email,
  });

  // What can the family book? Credits are on the account and shared.
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

  // A Diamond membership covers one named athlete: they get a synthetic
  // "unlimited" bucket for any pitching service so the booking flow
  // treats them as entitled. The booking POST re-verifies against Stripe
  // and inserts with no credit_bucket_id, so no credits get consumed.
  let members = new Set<string>();
  if (user.email) {
    try {
      members = new Set((await diamondMemberships(user.email)).map((m) => m.athleteKey));
    } catch (e) {
      console.warn("Schedule subscription check failed:", (e as Error).message);
    }
  }

  const memberBuckets: Bucket[] = [];
  if (members.size > 0) {
    const { data: pitchingServices } = await supabase
      .from("services")
      .select("id, name, category, duration_min")
      .eq("category", "pitching");
    for (const svc of pitchingServices ?? []) {
      memberBuckets.push({
        id: `sub-${svc.id}`,
        credits_remaining: Number.MAX_SAFE_INTEGER,
        expires_at: null,
        service: svc as Service,
        isSubscription: true,
      });
    }
  }

  const athletes: AthleteOption[] = family.map((a) => ({
    key: a.key,
    name: fullName(a) || a.firstName,
    firstName: a.firstName,
    member: members.has(a.key),
    agreementCurrent: a.agreementCurrent,
  }));

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
          athletes={athletes}
          buckets={buckets}
          memberBuckets={memberBuckets}
          trainers={trainers}
          rescheduleFor={rescheduleFor}
        />
      </section>
    </main>
  );
}
