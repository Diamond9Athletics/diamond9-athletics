/**
 * Google OAuth 2.0 helpers — used to connect a trainer's Google
 * Calendar to the booking system.
 *
 * Tokens are stored encrypted-at-rest in Supabase (trainer_google_oauth).
 * The refresh token is long-lived; the access token expires hourly and
 * is refreshed on demand.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events", // create + delete events
  "https://www.googleapis.com/auth/calendar.readonly", // read busy times
  "openid",
  "email",
];

function clientId() {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_OAUTH_CLIENT_ID is not set");
  return id;
}
function clientSecret() {
  const s = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!s) throw new Error("GOOGLE_OAUTH_CLIENT_SECRET is not set");
  return s;
}

/** Build the URL we redirect the trainer to in order to start OAuth. */
export function buildAuthUrl({
  redirectUri,
  state,
}: {
  redirectUri: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline", // gives us a refresh_token
    prompt: "consent", // forces refresh_token on re-connect too
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/** Exchange the one-time code for access + refresh tokens. */
export async function exchangeCodeForTokens({
  code,
  redirectUri,
}: {
  code: string;
  redirectUri: string;
}): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }
  return res.json();
}

/** Use a stored refresh_token to get a fresh access_token. */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed: ${text}`);
  }
  return res.json();
}
