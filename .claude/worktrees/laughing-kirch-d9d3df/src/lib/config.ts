// Base path for static assets — only set when building for GitHub Pages.
// Vercel builds leave this empty (no basePath needed).
const BASE_PATH = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true" ? "/diamond9-athletics" : "";

export function img(path: string): string {
  return `${BASE_PATH}${path}`;
}
