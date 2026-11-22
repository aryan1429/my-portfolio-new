import type { MetadataRoute } from "next";
import { navItems, siteUrl } from "@/lib/site";

const PRIORITY: Record<string, number> = {
  "/": 1,
  "/tech": 0.9,
  "/edits": 0.9,
  "/contact": 0.6,
};

export default function sitemap(): MetadataRoute.Sitemap {
  return navItems.map((item) => ({
    url: item.href === "/" ? siteUrl : `${siteUrl}${item.href}`,
    changeFrequency: "monthly",
    priority: PRIORITY[item.href] ?? 0.5,
  }));
}
