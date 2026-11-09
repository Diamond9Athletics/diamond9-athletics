import type { Instrumentation } from "next";

/**
 * Next.js calls this for any error a page, API route or server action
 * throws without handling. Email the admins (lib/alerts) so a broken page
 * doesn't go unnoticed.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Redirects and "not found" travel as errors too. They aren't problems.
  const digest = (err as { digest?: unknown } | null)?.digest;
  if (typeof digest === "string" && /^NEXT_(REDIRECT|NOT_FOUND|HTTP_ERROR_FALLBACK)/.test(digest)) return;

  const { alertOwner } = await import("@/lib/alerts");
  const page = context.routeType === "render";
  // Leave the query string out: it can hold sign-in and reset tokens.
  await alertOwner({
    where: `${request.method} ${request.path.split("?")[0]}`,
    what: page ? "A page failed to load" : "A request to the site failed",
    impact: page
      ? "Anyone opening this page saw an error instead of the page."
      : "Whatever the person was doing (booking, paying, saving) may not have gone through.",
    error: err,
    details: {
      route: context.routePath,
      type: context.routeType,
      digest: typeof digest === "string" ? digest : undefined,
    },
  });
};
