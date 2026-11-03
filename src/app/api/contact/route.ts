/**
 * Contact form → email to the admins (Reply goes straight to the sender).
 * Same light spam guard as signup: a hidden honeypot field and a minimum
 * time on the form. Bots get a normal-looking success so they don't retry.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, shell } from "@/lib/email";

const FALLBACK_TO = "support@diamond9athletics.com";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const field = (k: string, max: number) => String(body?.[k] ?? "").trim().slice(0, max);
  const name = field("name", 100);
  const email = field("email", 200);
  const phone = field("phone", 40);
  const plan = field("plan", 100);
  const message = field("message", 4000);

  if (!name) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email so we can write back." }, { status: 400 });
  }
  if (!message && !plan) {
    return NextResponse.json({ error: "Tell us a little about what you're looking for." }, { status: 400 });
  }

  const tooFast = Date.now() - Number(body?.startedAt ?? 0) < 2000;
  if (body?.honey || tooFast) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: admins } = await admin.from("profiles").select("email").eq("is_admin", true);
  const to = [...new Set((admins ?? []).map((a) => a.email).filter(Boolean))];
  if (to.length === 0) to.push(FALLBACK_TO);

  const row = (label: string, value: string) =>
    value
      ? `<tr><td style="padding:4px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">${label}</td></tr>
         <tr><td style="padding:0 0 10px 0;color:#fff;font-size:15px;">${value}</td></tr>`
      : "";

  try {
    for (const recipient of to) {
      await sendEmail({
        to: recipient,
        subject: `Website message — ${name}`,
        html: shell({
          title: "New website message",
          body: `
            <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#fff;">New message from the website</h1>
            <p style="margin:0 0 18px 0;color:#a1a1aa;font-size:14px;">Hit reply to answer ${esc(name)} directly.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;">
              ${row("Name", esc(name))}
              ${row("Email", `<a href="mailto:${esc(email)}" style="color:#b07adf;text-decoration:none;">${esc(email)}</a>`)}
              ${row("Phone", phone ? `<a href="tel:${esc(phone)}" style="color:#b07adf;text-decoration:none;">${esc(phone)}</a>` : "")}
              ${row("Interested in", esc(plan))}
              ${row("Message", esc(message).replace(/\n/g, "<br>"))}
            </table>
          `,
        }),
        replyTo: email,
      });
    }
  } catch (e) {
    console.error("Contact form email failed:", e);
    return NextResponse.json(
      { error: "Your message didn't send. Try again, or email support@diamond9athletics.com." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
