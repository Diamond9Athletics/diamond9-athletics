/**
 * Next.js middleware helper — refreshes Supabase auth tokens on every request.
 * Called from src/middleware.ts.
 *
 * Staff areas (the Control Room, the numbers, coach pages and their APIs)
 * also need a fresh sign-in: a coach or admin whose last real sign-in on
 * this device is over a week old is signed out here and sent to the login
 * page. Customers' sessions are untouched.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_OPTIONS } from "./cookie-options";

const STAFF_AREAS = ["/book/admin", "/book/trainer", "/api/admin", "/api/trainer"];

/** How long a staff sign-in lasts in staff areas. STAFF_SIGNIN_MAX_AGE_SECONDS
 *  overrides it, for testing. */
const STAFF_SIGNIN_MAX_AGE_MS =
  Number(process.env.STAFF_SIGNIN_MAX_AGE_SECONDS || 7 * 24 * 60 * 60) * 1000;

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Important: refreshes the session if it's about to expire.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const staffArea = STAFF_AREAS.some((area) => path === area || path.startsWith(`${area}/`));
  if (user && staffArea) {
    // A session refresh doesn't move last_sign_in_at; only signing in does.
    const signedInAt = Date.parse(user.last_sign_in_at ?? "");
    if (!signedInAt || Date.now() - signedInAt > STAFF_SIGNIN_MAX_AGE_MS) {
      const { data: me } = await supabase
        .from("profiles")
        .select("is_admin, is_trainer")
        .eq("id", user.id)
        .maybeSingle();
      if (me?.is_admin || me?.is_trainer) {
        // This device only: each device gets asked on its own.
        await supabase.auth.signOut({ scope: "local" });
        const out = path.startsWith("/api/")
          ? NextResponse.json({ error: "Please sign in again." }, { status: 401 })
          : NextResponse.redirect(loginUrl(request));
        // Carry over the cleared session cookies.
        response.cookies.getAll().forEach((cookie) => out.cookies.set(cookie));
        return out;
      }
    }
  }

  return response;
}

function loginUrl(request: NextRequest): URL {
  const url = new URL("/book/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  url.searchParams.set("reason", "signin-again");
  return url;
}
