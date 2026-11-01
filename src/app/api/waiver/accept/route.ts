/**
 * Record the signed-in user's acceptance of the current Participant
 * Agreement, then email them a receipt.
 *
 * POST { role: "athlete" | "guardian", guardianName?, version }
 *
 * The record goes into app_metadata.waivers[version] — server-writable
 * only — with the time, role, guardian's typed name, IP, and device.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  WAIVER_VERSION,
  WAIVER_VERSION_LABEL,
  type WaiverRecord,
} from "@/lib/legal/waiver";
import { fmtCT, sendEmail, shell } from "@/lib/email";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json().catch(() => null)) ?? {};
  const role = body.role;
  if (role !== "athlete" && role !== "guardian") {
    return NextResponse.json(
      { error: "Choose whether you're the athlete or a parent or guardian." },
      { status: 400 },
    );
  }
  if (body.version !== WAIVER_VERSION) {
    return NextResponse.json(
      { error: "The agreement was just updated. Refresh the page to read the latest version." },
      { status: 409 },
    );
  }
  const guardianName =
    typeof body.guardianName === "string" ? body.guardianName.trim().slice(0, 100) : "";
  if (role === "guardian" && guardianName.length < 3) {
    return NextResponse.json(
      { error: "Enter your full name as the parent or guardian." },
      { status: 400 },
    );
  }

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 200);
  const record: WaiverRecord = {
    acceptedAt: new Date().toISOString(),
    role,
    ...(role === "guardian" ? { guardianName } : {}),
    ...(ip ? { ip } : {}),
    ...(userAgent ? { userAgent } : {}),
  };

  const admin = createAdminClient();
  const existing = (user.app_metadata?.waivers ?? {}) as Record<string, WaiverRecord>;
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { waivers: { ...existing, [WAIVER_VERSION]: record } },
  });
  if (error) {
    console.error("Waiver accept failed:", error);
    return NextResponse.json(
      { error: "Couldn't save your acceptance. Try again." },
      { status: 500 },
    );
  }

  // Receipt: when they accepted, which version, and where to read it.
  if (user.email) {
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();
      const athleteName =
        `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "the athlete";
      const asWho =
        role === "guardian"
          ? ` as the parent or guardian of ${esc(athleteName)} (accepted by ${esc(guardianName)})`
          : "";
      await sendEmail({
        to: user.email,
        subject: "You accepted the D9 Participant Agreement",
        html: shell({
          title: "Agreement accepted",
          body: `
            <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:800;color:#fff;">Agreement accepted</h1>
            <p style="margin:0 0 14px 0;color:#a1a1aa;font-size:14px;line-height:1.6;">
              This confirms that on ${esc(fmtCT(record.acceptedAt))} you accepted the Diamond Nine Athletics
              Participant Agreement (version ${esc(WAIVER_VERSION_LABEL)})${asWho}.
            </p>
            <p style="margin:0 0 18px 0;color:#a1a1aa;font-size:14px;line-height:1.6;">
              It covers the risks of training, the release of liability, and responsibility for equipment
              the athlete damages. You can read it anytime.
            </p>
            <p style="margin:0 0 18px 0;">
              <a href="https://diamond9athletics.com/waiver" style="display:inline-block;background:linear-gradient(135deg,#9954d2,#7a40b0);color:#000;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:800;letter-spacing:0.1em;font-size:12px;">READ THE AGREEMENT</a>
            </p>
            <p style="margin:0;color:#71717a;font-size:12px;">Questions? Reply to this email.</p>
          `,
        }),
        replyTo: "support@diamond9athletics.com",
      });
    } catch (e) {
      console.error("Waiver receipt email failed:", e);
    }
  }

  return NextResponse.json({ ok: true });
}

function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
