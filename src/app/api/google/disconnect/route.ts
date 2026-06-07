import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const admin = createAdminClient();
  await admin.from("trainer_google_oauth").delete().eq("trainer_id", user.id);
  return NextResponse.redirect(new URL("/book-v2/trainer", request.url), {
    status: 303,
  });
}
