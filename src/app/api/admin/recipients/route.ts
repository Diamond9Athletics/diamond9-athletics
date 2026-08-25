/**
 * Admin: full list of email recipients the /api/admin/announce blast
 * would send to. Same de-dupe rules — profiles.email present, unique
 * by lowercase email.
 *
 * GET /api/admin/recipients
 * GET /api/admin/recipients?format=csv   → text/csv download
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
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
  const { data: rows, error } = await admin
    .from("profiles")
    .select("email, first_name, last_name")
    .not("email", "is", null)
    .order("last_name", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const seen = new Set<string>();
  const recipients: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  }[] = [];
  for (const r of rows ?? []) {
    const em = (r.email ?? "").trim().toLowerCase();
    if (!em || seen.has(em)) continue;
    seen.add(em);
    recipients.push({
      email: em,
      first_name: r.first_name ?? null,
      last_name: r.last_name ?? null,
    });
  }

  const format = new URL(request.url).searchParams.get("format");
  if (format === "csv") {
    const escape = (v: string | null) => {
      const s = v ?? "";
      return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
    };
    const lines = ["email,first_name,last_name"];
    for (const r of recipients) {
      lines.push(`${escape(r.email)},${escape(r.first_name)},${escape(r.last_name)}`);
    }
    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="d9-recipients.csv"',
      },
    });
  }

  return NextResponse.json({
    count: recipients.length,
    emails: recipients.map((r) => r.email),
    recipients,
  });
}
