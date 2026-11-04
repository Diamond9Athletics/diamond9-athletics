/**
 * Family accounts: the brothers and sisters on a parent's account.
 *
 * POST   { firstName, lastName?, guardianName, accept: true }  → add one
 * PATCH  { id, guardianName, accept: true }  → re-accept the current
 *        Participant Agreement for them (after it's been updated)
 * DELETE { id }  → take them off the account. Someone with past sessions
 *        is archived so their history stays; upcoming sessions or a
 *        Diamond membership have to be cancelled first.
 *
 * Adding someone means the parent accepts the Participant Agreement on
 * their behalf, recorded on the athlete's row with the version, time and
 * the guardian's typed name.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WAIVER_VERSION } from "@/lib/legal/waiver";
import { MAX_FAMILY_SIZE } from "@/lib/booking/athletes";
import { diamondMemberships } from "@/lib/stripe/subscription";

const name = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";

/** The guardian's acceptance, or an error to show. */
function agreement(body: Record<string, unknown>) {
  const guardian = name(body.guardianName, 100);
  if (body.accept !== true) {
    return { error: "Accept the Participant Agreement for them to continue." } as const;
  }
  if (guardian.length < 3) {
    return { error: "Enter your full name as their parent or guardian." } as const;
  }
  return {
    fields: {
      waiver_version: WAIVER_VERSION,
      waiver_accepted_at: new Date().toISOString(),
      waiver_guardian: guardian,
    },
  } as const;
}

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: NextRequest) {
  const user = await signedIn();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json().catch(() => null)) ?? {};
  const firstName = name(body.firstName, 60);
  const lastName = name(body.lastName, 60);
  if (!firstName) {
    return NextResponse.json({ error: "Enter their first name." }, { status: 400 });
  }
  const accepted = agreement(body);
  if ("error" in accepted) {
    return NextResponse.json({ error: accepted.error }, { status: 400 });
  }

  const admin = createAdminClient();
  const { count } = await admin
    .from("athletes")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", user.id)
    .is("archived_at", null);
  if ((count ?? 0) + 1 >= MAX_FAMILY_SIZE) {
    return NextResponse.json(
      { error: `An account can hold up to ${MAX_FAMILY_SIZE} athletes.` },
      { status: 400 },
    );
  }

  const { data, error } = await admin
    .from("athletes")
    .insert({
      parent_id: user.id,
      first_name: firstName,
      last_name: lastName || null,
      ...accepted.fields,
    })
    .select("id, first_name, last_name")
    .single();
  if (error || !data) {
    console.error("Add athlete failed:", error);
    return NextResponse.json({ error: "Couldn't add them. Try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, athlete: data });
}

export async function PATCH(request: NextRequest) {
  const user = await signedIn();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json().catch(() => null)) ?? {};
  const accepted = agreement(body);
  if ("error" in accepted) {
    return NextResponse.json({ error: accepted.error }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("athletes")
    .update(accepted.fields)
    .eq("id", typeof body.id === "string" ? body.id : "")
    .eq("parent_id", user.id)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ error: "Athlete not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await signedIn();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json().catch(() => null)) ?? {};
  const id = typeof body.id === "string" ? body.id : "";

  const admin = createAdminClient();
  const { data: athlete } = await admin
    .from("athletes")
    .select("id, first_name")
    .eq("id", id)
    .eq("parent_id", user.id)
    .is("archived_at", null)
    .maybeSingle();
  if (!athlete) {
    return NextResponse.json({ error: "Athlete not found." }, { status: 404 });
  }

  const { data: upcoming } = await admin
    .from("bookings")
    .select("id")
    .eq("athlete_id", athlete.id)
    .eq("status", "confirmed")
    .gt("starts_at", new Date().toISOString())
    .limit(1);
  if (upcoming && upcoming.length > 0) {
    return NextResponse.json(
      { error: `Cancel ${athlete.first_name}'s upcoming sessions first.` },
      { status: 409 },
    );
  }

  if (user.email) {
    const memberships = await diamondMemberships(user.email).catch(() => []);
    if (memberships.some((m) => m.athleteKey === athlete.id && !m.cancelAtPeriodEnd)) {
      return NextResponse.json(
        { error: `Cancel ${athlete.first_name}'s Diamond membership first.` },
        { status: 409 },
      );
    }
  }

  // Anyone who has trained here keeps their history; otherwise just delete.
  const { count } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("athlete_id", athlete.id);
  const { error } =
    (count ?? 0) > 0
      ? await admin
          .from("athletes")
          .update({ archived_at: new Date().toISOString() })
          .eq("id", athlete.id)
      : await admin.from("athletes").delete().eq("id", athlete.id);
  if (error) {
    console.error("Remove athlete failed:", error);
    return NextResponse.json({ error: "Couldn't remove them. Try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
