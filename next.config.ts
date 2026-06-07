import type { NextConfig } from "next";
import path from "path";

// NEXT_PUBLIC_GITHUB_PAGES=true is only set during manual gh-pages builds.
// Vercel builds never set this — so basePath/output are Vercel-safe.
const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: isGitHubPages ? "export" : undefined,
  basePath: isGitHubPages ? "/diamond9-athletics" : "",
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      // Old Acuity-era URL keeps working.
      { source: "/appointments", destination: "/book", permanent: true },
      // Preview/dev URLs that linked at /book-v2 stay working.
      { source: "/book-v2", destination: "/book", permanent: true },
      { source: "/book-v2/:path*", destination: "/book/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
