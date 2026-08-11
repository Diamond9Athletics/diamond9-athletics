/**
 * Admin actions on a single athlete profile.
 * Only callable by users with is_admin=true on their profile.
 *
 * Body: { userId, action, ...actionArgs? }
 * Actions:
 *  - send_reset      : trigger Supabase recovery email
 *  - send_magic      : generate a magic sign-in link and email it via Resend
 *  - promote_trainer : set is_trainer=true and (optional) trainer_categories
 *  - demote_trainer  : set is_trainer=false, clear trainer_* fields
 *  - delete          : delete the auth user (cascades to profile via FK)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, shell } from "@/lib/email";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.userId || !body?.action) {
    return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const admin = createAdminClient();
  const targetId = String(body.userId);

  const { data: target, error: targetErr } = await admin
    .from("profiles")
    .select("id, first_name, email, is_admin, is_trainer")
    .eq("id", targetId)
    .single();
  if (targetErr || !target) {
    return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
  }

  // Protect against admins deleting themselves accidentally.
  if (body.action === "delete" && target.id === user.id) {
    return NextResponse.json(
      { error: "You can't delete your own account from here." },
      { status: 400 },
    );
  }

  switch (body.action) {
    case "send_reset": {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`,
        {
          method: "POST",
          headers: {
            apikey: process.env.SUPABASE_SECRET_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "recovery",
            email: target.email,
            options: {
              redirect_to:
                "https://www.diamond9athletics.com/book/reset-password",
            },
          }),
        },
      );
      if (!res.ok) {
        return NextResponse.json(
          { error: `Reset generate failed: ${res.status}` },
          { status: 500 },
        );
      }
      // Supabase's generate_link does NOT send an email — we do it ourselves
      // so we control the copy and it doesn't stomp on the standard reset flow.
      const json = await res.json();
      const link = json.action_link ?? json.properties?.action_link;
      if (!link) return NextResponse.json({ ok: true });

      try {
        await sendEmail({
          to: target.email,
          subject: "Reset your Diamond Nine Athletics password",
          html: shell({
            title: "Password reset",
            body: `
              <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#fff;">Password reset</h1>
              <p style="margin:0 0 14px 0;color:#a1a1aa;font-size:14px;">Click below to set a new password. This link expires in 1 hour.</p>
              <p style="margin:0 0 12px 0;">
                <a href="${esc(link)}" style="display:inline-block;background:linear-gradient(135deg,#9954d2,#7a40b0);color:#000;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:800;letter-spacing:0.1em;font-size:12px;">SET NEW PASSWORD</a>
              </p>
              <p style="margin:0;color:#71717a;font-size:12px;">If you didn't request this, ignore this email.</p>
            `,
          }),
          replyTo: "support@diamond9athletics.com",
        });
      } catch (e) {
        console.error("reset send failed:", e);
      }
      return NextResponse.json({ ok: true });
    }

    case "send_magic": {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`,
        {
          method: "POST",
          headers: {
            apikey: process.env.SUPABASE_SECRET_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "recovery",
            email: target.email,
            options: {
              redirect_to:
                "https://www.diamond9athletics.com/book/dashboard",
            },
          }),
        },
      );
      if (!res.ok) {
        return NextResponse.json(
          { error: `Magic generate failed: ${res.status}` },
          { status: 500 },
        );
      }
      const json = await res.json();
      const link = json.action_link ?? json.properties?.action_link;
      if (!link) return NextResponse.json({ ok: true });

      const first = (target.first_name ?? "Athlete").trim();
      try {
        await sendEmail({
          to: target.email,
          subject: "Sign in to Diamond Nine Athletics",
          html: shell({
            title: "One-click sign in",
            body: `
              <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#fff;">Hey ${esc(first)} —</h1>
              <p style="margin:0 0 14px 0;color:#a1a1aa;font-size:14px;">Click below to jump straight into your dashboard. No password needed.</p>
              <p style="margin:0 0 12px 0;">
                <a href="${esc(link)}" style="display:inline-block;background:linear-gradient(135deg,#9954d2,#7a40b0);color:#000;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:800;letter-spacing:0.1em;font-size:12px;">SIGN ME IN →</a>
              </p>
              <p style="margin:0;color:#71717a;font-size:12px;">If you didn't expect this, ignore this email.</p>
            `,
          }),
          replyTo: "support@diamond9athletics.com",
        });
      } catch (e) {
        console.error("magic send failed:", e);
      }
      return NextResponse.json({ ok: true });
    }

    case "promote_trainer": {
      const { error } = await admin
        .from("profiles")
        .update({ is_trainer: true })
        .eq("id", targetId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    case "demote_trainer": {
      const { error } = await admin
        .from("profiles")
        .update({
          is_trainer: false,
          trainer_slug: null,
          trainer_categories: null,
        })
        .eq("id", targetId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    case "delete": {
      // auth.admin.deleteUser cascades to public.profiles via FK.
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${targetId}`,
        {
          method: "DELETE",
          headers: {
            apikey: process.env.SUPABASE_SECRET_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
          },
        },
      );
      if (!res.ok) {
        return NextResponse.json(
          { error: `Delete failed: ${res.status}` },
          { status: 500 },
        );
      }
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
