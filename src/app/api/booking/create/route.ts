import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmedEmails } from "@/lib/booking/emails";
import { categoryCapacity } from "@/lib/booking/slots";
import { openSlotStarts } from "@/lib/booking/open-slots";
import {
  BOOKING_WINDOW_DAYS,
  MAX_REPEAT_WEEKS,
  inBookingWindow,
  weeklyStarts,
} from "@/lib/booking/repeat";
import {
  createEvent,
  deleteEvent,
  getValidAccessToken,
} from "@/lib/google/calendar";
import { diamondMemberships } from "@/lib/stripe/subscription";
import {
  firstPitchingBookingIds,
  wouldBeFirstPitching,
} from "@/lib/booking/first-session";
import { bookingAthlete, fullName, keyOf } from "@/lib/booking/athletes";
import { needsWaiver } from "@/lib/legal/waiver";
import { LATE_CANCELLED, isLateCancel } from "@/lib/booking/policy";
import { alertOwner } from "@/lib/alerts";

// Athletes must book at least this far ahead of the slot's start.
const MIN_LEAD_MS = 5 * 60 * 60 * 1000;

// Diamond members can book this many pitching sessions a calendar month.
const SUBSCRIPTION_MONTHLY_CAP = 12;

type Booked = { id: string; starts_at: string; ends_at: string; isFirstPitching: boolean };
type Attempt =
  | { ok: true; booking: Booked }
  // `error` answers a single booking; `reason` labels a skipped week.
  | { ok: false; status: number; error: string; reason: string };

/**
 * POST /api/booking/create
 * Body: { trainerId, serviceId, startsAt (ISO), athleteKey?, repeatWeeks?, rescheduleFor? }
 *
 * athleteKey says who on a family account the session is for ("primary"
 * or left out = the account holder). Credits are shared by the family;
 * a Diamond membership, the monthly cap, the double-booking check and
 * the first-session rule all go by the athlete.
 *
 * - Verifies the user has a credit_bucket with credits_remaining > 0 for
 *   the matching service.
 * - Inserts the booking.
 * - Decrements credits_remaining on the bucket.
 * - If this is the user's first booking against the bucket, sets
 *   first_booking_date / expires_at on the bucket.
 * - repeatWeeks (2–5) also books the same time each following week. The
 *   first session has to go through; a later week that can't be booked
 *   (coach off, full, out of credits…) is skipped and reported back.
 *
 * Not yet atomic (no DB transaction in JS supabase SDK) — we'll harden
 * this in phase 3b. For MVP we serialize the steps and accept the tiny
 * race window.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { trainerId, serviceId, startsAt, rescheduleFor } = body ?? {};
  // How many weeks running to book; a reschedule moves just the one session.
  const repeatWeeks = rescheduleFor
    ? 1
    : Math.min(Math.max(Math.trunc(Number(body?.repeatWeeks)) || 1, 1), MAX_REPEAT_WEEKS);

  if (!trainerId || !serviceId || !startsAt) {
    return NextResponse.json(
      { error: "Missing trainerId, serviceId, or startsAt" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (await needsWaiver(supabase, user)) {
    return NextResponse.json(
      {
        error: "Please accept the Participant Agreement before booking.",
        needsWaiver: true,
      },
      { status: 403 },
    );
  }

  const admin = createAdminClient();

  // A reschedule keeps the session with the athlete it was booked for.
  let oldBooking: {
    id: string;
    user_id: string;
    athlete_id: string | null;
    credit_bucket_id: string | null;
    status: string;
    starts_at: string;
  } | null = null;
  if (rescheduleFor) {
    const { data } = await admin
      .from("bookings")
      .select("id, user_id, athlete_id, credit_bucket_id, status, starts_at")
      .eq("id", rescheduleFor)
      .single();
    if (!data || data.user_id !== user.id) {
      return NextResponse.json(
        { error: "Original booking not found" },
        { status: 404 },
      );
    }
    oldBooking = data;
  }

  const athlete = await bookingAthlete(
    admin,
    user.id,
    oldBooking ? keyOf(oldBooking.athlete_id) : body?.athleteKey,
  );
  if (!athlete) {
    return NextResponse.json(
      { error: "We couldn't find that athlete on your account." },
      { status: 404 },
    );
  }
  if (!athlete.agreementCurrent) {
    return NextResponse.json(
      {
        error: `Accept the Participant Agreement for ${athlete.firstName} on your account page before booking for them.`,
        needsAthleteAgreement: true,
      },
      { status: 403 },
    );
  }
  // PostgREST filter for this athlete's own sessions on the account.
  const ownSessions: [string, string | null] = athlete.id
    ? ["eq", athlete.id]
    : ["is", null];

  // A reschedule replaces the old booking, which is cancelled only once
  // the new one is in — a time that doesn't work out leaves it alone.
  // Outside the free-cancel window its credit moves to the new booking;
  // inside it, the old session counts as used and the new one is paid for.
  const replacing =
    oldBooking && oldBooking.status === "confirmed"
      ? {
          id: oldBooking.id,
          creditBucketId: oldBooking.credit_bucket_id,
          late: isLateCancel(oldBooking.starts_at),
        }
      : null;

  // 1) Look up the service to know its duration.
  const { data: service, error: svcErr } = await admin
    .from("services")
    .select("id, duration_min, category")
    .eq("id", serviceId)
    .single();
  if (svcErr || !service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const startDate = new Date(startsAt);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  // Bookings must be at least 5 hours ahead of now — no last-minute
  // scheduling. Rescheduling is exempt only when the original slot was
  // in the future; we still enforce the cushion on the *new* slot.
  if (startDate.getTime() < Date.now() + MIN_LEAD_MS) {
    return NextResponse.json(
      {
        error:
          "Sessions must be booked at least 5 hours before they start. Please pick a later time.",
      },
      { status: 400 },
    );
  }

  // Bookings must be within the next 31 days (matches credit-expiry rule).
  if (!inBookingWindow(startDate)) {
    return NextResponse.json(
      { error: `You can only book up to ${BOOKING_WINDOW_DAYS} days in advance.` },
      { status: 400 },
    );
  }

  // 2) Entitlement: either a Diamond pitching membership for this athlete
  //    (up to 12 bookings/month) or a credit_bucket with credits left.
  //    The membership check hits Stripe as the source of truth, so a
  //    lapsed card is caught even without our webhook running.
  let hasSubscriptionEntitlement = false;
  if (service.category === "pitching" && user.email) {
    try {
      const memberships = await diamondMemberships(user.email);
      hasSubscriptionEntitlement = memberships.some(
        (m) => m.athleteKey === keyOf(athlete.id),
      );
    } catch (e) {
      // Don't punish the athlete for a Stripe hiccup — fall through
      // to the credit bucket check.
      console.warn("Subscription check failed:", (e as Error).message);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const fail = (status: number, error: string, reason = error): Attempt => ({
    ok: false,
    status,
    error,
    reason,
  });

  /** Checks one session, then books it and takes the credit. A later week
   *  of a repeat also has to be open on the coach's schedule — it never
   *  went through the time picker. */
  const bookOne = async (start: Date, laterWeek: { date: string } | null): Promise<Attempt> => {
    const end = new Date(start.getTime() + service.duration_min * 60_000);

    // One athlete can't hold two sessions at once — a second try or a
    // second tab used to double-book and take another athlete's spot.
    // (Brothers and sisters can train side by side.)
    let sameTime = admin
      .from("bookings")
      .select("id")
      .eq("user_id", user.id)
      .filter("athlete_id", ...ownSessions)
      .eq("status", "confirmed")
      .lt("starts_at", end.toISOString())
      .gt("ends_at", start.toISOString());
    if (replacing) sameTime = sameTime.neq("id", replacing.id);
    const { data: alreadyBooked } = await sameTime.limit(1);
    if (alreadyBooked && alreadyBooked.length > 0) {
      return fail(
        409,
        athlete.id
          ? `${athlete.firstName} already has a session booked at that time — check your dashboard.`
          : "You already have a session booked at that time — check your dashboard.",
        athlete.id ? `${athlete.firstName} already has a session then` : "You already have a session then",
      );
    }

    if (laterWeek) {
      const open = await openSlotStarts({
        db: admin,
        admin,
        trainerId,
        dateStr: laterWeek.date,
        durationMin: service.duration_min,
        category: service.category,
        ruleCategories: [service.category],
      });
      if (!open.some((t) => t.getTime() === start.getTime())) {
        return fail(409, "That time isn't open that week.", "Not open that week");
      }
    }

    // Enforce the monthly cap for subscribers. We count confirmed (and
    // late-cancelled) pitching bookings this athlete already has whose
    // start falls in the same *calendar month* (America/Chicago) as the
    // new booking. The cap is generous (12) so daily trainers are fine.
    if (hasSubscriptionEntitlement) {
      const monthLabel = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "2-digit",
      }).format(start);
      const [y, m] = monthLabel.split("-").map(Number);
      const monthStart = new Date(`${monthLabel}-01T00:00:00-05:00`);
      const nextMonth = new Date(
        `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01T00:00:00-05:00`,
      );

      let monthSessions = admin
        .from("bookings")
        .select("id, service:services!inner(category)", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .filter("athlete_id", ...ownSessions)
        .in("status", ["confirmed", LATE_CANCELLED])
        .eq("service.category", "pitching")
        .gte("starts_at", monthStart.toISOString())
        .lt("starts_at", nextMonth.toISOString());
      // A late reschedule's original still counts; a free one's won't.
      if (replacing && !replacing.late) monthSessions = monthSessions.neq("id", replacing.id);
      const { count } = await monthSessions;

      if ((count ?? 0) >= SUBSCRIPTION_MONTHLY_CAP) {
        return fail(
          402,
          `You've hit your ${SUBSCRIPTION_MONTHLY_CAP}-session cap for the month. Your booking will open back up on the 1st.`,
          `Monthly limit of ${SUBSCRIPTION_MONTHLY_CAP} reached`,
        );
      }
    }

    // A free reschedule moves the original booking's credit over.
    const movedCredit = replacing && !replacing.late ? replacing.creditBucketId : null;

    const { data: buckets, error: bucketErr } = await admin
      .from("credit_buckets")
      .select("id, credits_remaining, expires_at, first_booking_date, expiry_days")
      .eq("user_id", user.id)
      .eq("service_id", serviceId)
      .gt("credits_remaining", 0)
      .or(`expires_at.is.null,expires_at.gte.${today}`)
      .order("created_at", { ascending: true });

    if (bucketErr) {
      return fail(500, bucketErr.message, "Couldn't check your credits");
    }

    const bucket = buckets?.[0] ?? null;

    if (!hasSubscriptionEntitlement && !bucket && !movedCredit) {
      return fail(
        402,
        "You don't have credits for this service. Buy a package first.",
        "Out of credits",
      );
    }

    // 3) Sanity: trainer is real, the requested slot doesn't overlap an
    //    existing booking, and it falls inside an availability rule.
    //    For MVP we trust the client's /slots query did most of this; we
    //    just re-check for direct overlap here.
    let overlapping = admin
      .from("bookings")
      .select("id, user_id, service:services(category)")
      .eq("trainer_id", trainerId)
      .eq("status", "confirmed")
      .lt("starts_at", end.toISOString())
      .gt("ends_at", start.toISOString());
    if (replacing) overlapping = overlapping.neq("id", replacing.id);
    const { data: clashing } = await overlapping;

    // Same-category overlaps only fill the slot once capacity is hit
    // (pitching = 2, hitting = 1). Any other-category overlap still blocks.
    const cap = categoryCapacity(service.category);
    let sameCategoryOverlap = 0;
    let otherCategoryOverlap = false;
    const overlappingPitching: { id: string; user_id: string }[] = [];
    for (const row of clashing ?? []) {
      const svc = Array.isArray(row.service) ? row.service[0] : row.service;
      if (svc?.category === service.category) {
        sameCategoryOverlap += 1;
        if (service.category === "pitching") {
          overlappingPitching.push(row);
        }
      } else {
        otherCategoryOverlap = true;
      }
    }
    if (otherCategoryOverlap || sameCategoryOverlap >= cap) {
      return fail(409, "That slot was just taken. Please pick another.", "That time is full");
    }

    // First-session solo policy (pitching only). Hoisted here so the
    // Google Calendar event below can tag the booking as a first session:
    //  - If this booking would be *this athlete's* first pitching session,
    //    the slot must be totally empty of other pitching bookings.
    //  - If any overlapping pitching booking is *another* athlete's
    //    first session, that other athlete owns the slot solo — block.
    const isFirstPitchingSession =
      service.category === "pitching"
        ? await wouldBeFirstPitching(admin, user.id, start, athlete.id, replacing?.id)
        : false;

    if (service.category === "pitching") {
      if (isFirstPitchingSession && sameCategoryOverlap > 0) {
        return fail(
          409,
          "First-session athletes get the slot to themselves — please pick a time no one else has booked.",
          "That time is full",
        );
      }
      if (overlappingPitching.length > 0) {
        const firsts = await firstPitchingBookingIds(admin, [
          ...new Set(overlappingPitching.map((b) => b.user_id)),
        ]);
        if (overlappingPitching.some((b) => firsts.has(b.id))) {
          return fail(
            409,
            "That slot is reserved for a first-time athlete. Please pick another.",
            "That time is full",
          );
        }
      }
    }

    // 4) Insert booking. A moved credit comes along as-is; when the
    //    subscription covers it, no bucket is attached — subscribers don't
    //    consume credits.
    const useBucket = !movedCredit && !hasSubscriptionEntitlement && bucket;

    const { data: booking, error: bookErr } = await admin
      .from("bookings")
      .insert({
        user_id: user.id,
        athlete_id: athlete.id,
        trainer_id: trainerId,
        service_id: serviceId,
        credit_bucket_id: movedCredit ?? (useBucket ? bucket.id : null),
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status: "confirmed",
      })
      .select("id, starts_at, ends_at")
      .single();

    if (bookErr || !booking) {
      return fail(
        500,
        `Could not save booking: ${bookErr?.message}`,
        "Couldn't save it — try booking that week on its own",
      );
    }

    // 5) Decrement the bucket (only when the booking was paid for by
    //    credits, not by the subscription).  If this is the first
    //    booking against the bucket, also set first_booking_date and
    //    expires_at.
    if (useBucket) {
      const update: Record<string, unknown> = {
        credits_remaining: bucket.credits_remaining - 1,
      };
      if (!bucket.first_booking_date) {
        const firstDate = start.toISOString().slice(0, 10);
        update.first_booking_date = firstDate;
        const exp = new Date(start);
        exp.setDate(exp.getDate() + (bucket.expiry_days ?? 31));
        update.expires_at = exp.toISOString().slice(0, 10);
      }
      await admin.from("credit_buckets").update(update).eq("id", bucket.id);
    }

    return { ok: true, booking: { ...booking, isFirstPitching: isFirstPitchingSession } };
  };

  // The session they picked has to go through; nothing is booked otherwise.
  const firstTry = await bookOne(startDate, null);
  if (!firstTry.ok) {
    // A full slot or a missing credit is the athlete's to sort out; a
    // database error means the site is broken.
    if (firstTry.status >= 500) {
      await alertOwner({
        where: "Booking",
        what: "An athlete couldn't book a session",
        impact: "They saw an error when booking, so the session wasn't booked. They may try again or reach out.",
        error: firstTry.error,
        details: { user: user.id, startsAt: startDate.toISOString() },
      });
    }
    return NextResponse.json({ error: firstTry.error }, { status: firstTry.status });
  }

  // Now the new time is booked, cancel the one it replaces.
  if (replacing) {
    await admin
      .from("bookings")
      .update({ status: replacing.late ? LATE_CANCELLED : "cancelled" })
      .eq("id", replacing.id);
  }

  // Then the same time each following week, skipping any that won't go.
  const booked: Booked[] = [firstTry.booking];
  const skipped: { startsAt: string; reason: string }[] = [];
  for (const { start, date } of weeklyStarts(startDate, repeatWeeks).slice(1)) {
    if (!inBookingWindow(start)) {
      skipped.push({
        startsAt: start.toISOString(),
        reason: `Past the ${BOOKING_WINDOW_DAYS}-day booking window`,
      });
      continue;
    }
    const next = await bookOne(start, { date });
    if (next.ok) booked.push(next.booking);
    else skipped.push({ startsAt: start.toISOString(), reason: next.reason });
  }

  // If the old booking had a Google event, delete it.  Idempotent.
  if (rescheduleFor) {
    try {
      const { data: oldB } = await admin
        .from("bookings")
        .select("google_event_id, trainer_id")
        .eq("id", rescheduleFor)
        .single();
      if (oldB?.google_event_id) {
        const { accessToken, calendarId } = await getValidAccessToken(
          oldB.trainer_id,
        );
        await deleteEvent({
          accessToken,
          calendarId,
          eventId: oldB.google_event_id,
        });
      }
    } catch {
      // Trainer hasn't connected Google, or token issue — ignore.
    }
  }

  const [{ data: account }, { data: trainer }, { data: svcRow }] = await Promise.all([
    admin
      .from("profiles")
      .select("first_name, last_name, email, phone")
      .eq("id", user.id)
      .single(),
    admin
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", trainerId)
      .single(),
    admin.from("services").select("name").eq("id", serviceId).single(),
  ]);

  // If the trainer has Google Calendar connected, push an event per session.
  try {
    const { accessToken, calendarId } = await getValidAccessToken(trainerId);
    const athleteName = fullName(athlete) || "Athlete";
    for (const b of booked) {
      const soloTag = b.isFirstPitching ? " · 1st session (solo)" : "";
      const eventId = await createEvent({
        accessToken,
        calendarId,
        bookingId: b.id,
        startsAt: new Date(b.starts_at),
        endsAt: new Date(b.ends_at),
        summary: `${athleteName} — ${service.category === "pitching" ? "Pitching" : "Hitting"}${soloTag}`,
        description:
          `Diamond Nine Athletics booking\n\n` +
          `Athlete: ${athleteName}\n` +
          `Email: ${account?.email ?? "—"}\n` +
          (account?.phone ? `Phone: ${account.phone}\n` : "") +
          (b.isFirstPitching
            ? "\nFIRST PITCHING SESSION — slot is solo, no other bookings will join.\n"
            : ""),
        attendeeEmail: account?.email ?? undefined,
      });
      await admin
        .from("bookings")
        .update({ google_event_id: eventId })
        .eq("id", b.id);
    }
  } catch (e) {
    // Trainer hasn't connected Google Calendar yet, or call failed.
    // Booking still stands; we'll just have no calendar entry.
    console.warn("Google event create skipped:", (e as Error).message);
  }

  // One confirmation covers every session booked (athlete + trainer).
  // Don't fail the booking if email sending hiccups — log and move on.
  try {
    if (account && trainer && svcRow) {
      await sendBookingConfirmedEmails({
        sessions: booked.map((b) => ({
          bookingId: b.id,
          startsAtIso: b.starts_at,
          endsAtIso: b.ends_at,
        })),
        serviceName: svcRow.name,
        athleteFirstName: athlete.firstName,
        athleteLastName: athlete.lastName,
        // A brother's or sister's session: the email still goes to the account.
        bookedBy: athlete.id
          ? `${account.first_name ?? ""} ${account.last_name ?? ""}`.trim()
          : null,
        athleteEmail: account.email,
        athletePhone: account.phone,
        trainerFirstName: trainer.first_name,
        trainerLastName: trainer.last_name,
        trainerEmail: trainer.email,
      });
    }
  } catch (e) {
    await alertOwner({
      where: "Booking",
      what: "A booking's confirmation emails didn't send",
      impact: "The session is booked, but the athlete and coach may not have gotten the email.",
      error: e,
      details: { booking: booked[0]?.id },
    });
  }

  return NextResponse.json({ booking: booked[0], bookings: booked, skipped });
}
