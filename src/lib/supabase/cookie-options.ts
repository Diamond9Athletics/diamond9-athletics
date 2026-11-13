/**
 * Options for the sign-in cookie, shared by the browser, server and
 * middleware clients. On the live site the cookie is "Secure": browsers only
 * ever send it over an encrypted (https) connection. Local development runs
 * on plain http, so it's left off there.
 */
export const AUTH_COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === "production",
};
