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

/** A failed call to Google's token endpoint, with Google's own error code. */
export class GoogleTokenError extends Error {
  constructor(
    public code: string,
    public detail: string,
  ) {
    super(detail ? `${code} (${detail})` : code);
  }
}

async function tokenError(res: Response): Promise<GoogleTokenError> {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return new GoogleTokenError(json.error ?? `http_${res.status}`, json.error_description ?? "");
  } catch {
    return new GoogleTokenError(`http_${res.status}`, text.slice(0, 200));
  }
}

/** Plain-English next step for the trainer, keeping Google's code for debugging. */
export function describeTokenError(e: unknown, redirectUri: string): string {
  if (!(e instanceof GoogleTokenError)) {
    return `Couldn't reach Google — try again (${e instanceof Error ? e.message : "unknown error"})`;
  }
  switch (e.code) {
    case "invalid_client":
    case "unauthorized_client":
      return `Google rejected the site's client ID or secret — check GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in Vercel, then redeploy [${e.message}]`;
    case "redirect_uri_mismatch":
      return `Add ${redirectUri} to the OAuth client's Authorized redirect URIs in Google Cloud [${e.message}]`;
    case "invalid_grant":
      return `Google said the sign-in expired or was already used — connect again [${e.message}]`;
    default:
      return `Google said: ${e.message}`;
  }
}

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
  if (!res.ok) throw await tokenError(res);
  return res.json();
}

/**
 * Does Google accept our client ID + secret? Trades a deliberately fake
 * code: Google authenticates the client before it looks at the code, so
 * "invalid_client" means the credentials are wrong and anything else
 * (normally "invalid_grant") means they're fine. Returns the problem, or
 * null when the credentials look good or Google couldn't be reached.
 */
export async function checkClientCredentials(redirectUri: string): Promise<GoogleTokenError | null> {
  try {
    await exchangeCodeForTokens({ code: "d9-credential-check", redirectUri });
  } catch (e) {
    if (
      e instanceof GoogleTokenError &&
      (e.code === "invalid_client" || e.code === "unauthorized_client")
    ) {
      return e;
    }
  }
  return null;
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
  if (!res.ok) throw await tokenError(res);
  return res.json();
}
