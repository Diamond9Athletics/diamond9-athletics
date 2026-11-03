import type { MetadataRoute } from "next";

const SITE = "https://www.diamond9athletics.com";

/** Public pages for search engines; the sign-in and booking pages stay out. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [path: string, priority: number, change: "weekly" | "monthly" | "yearly"][] = [
    ["", 1, "weekly"],
    ["/pitching-plans", 0.9, "monthly"],
    ["/hitting-plans", 0.9, "monthly"],
    ["/about", 0.7, "monthly"],
    ["/trainers/wes", 0.6, "monthly"],
    ["/app", 0.6, "monthly"],
    ["/contact", 0.6, "yearly"],
    ["/shop", 0.4, "monthly"],
    ["/support", 0.3, "yearly"],
    ["/privacy", 0.2, "yearly"],
    ["/terms", 0.2, "yearly"],
    ["/waiver", 0.2, "yearly"],
  ];
  return pages.map(([path, priority, changeFrequency]) => ({
    url: `${SITE}${path}`,
    priority,
    changeFrequency,
  }));
}
