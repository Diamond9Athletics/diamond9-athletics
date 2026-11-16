// Base path for static assets — only set when building for GitHub Pages.
// Vercel builds leave this empty (no basePath needed).
const BASE_PATH = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true" ? "/diamond9-athletics" : "";

/** The merch store. The site's own /shop address forwards here (next.config.ts). */
export const STORE_URL = "https://shop.flyp.space/diamond9ath";

export function img(path: string): string {
  return `${BASE_PATH}${path}`;
}
