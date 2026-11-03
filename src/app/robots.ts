import type { MetadataRoute } from "next";

/** Crawl the public site; skip the API and the signed-in booking pages. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/book/"] },
    sitemap: "https://www.diamond9athletics.com/sitemap.xml",
  };
}
