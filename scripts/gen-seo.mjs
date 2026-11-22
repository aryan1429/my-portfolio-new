// Writes public/robots.txt and public/sitemap.xml before each build.
// Static files work in every deploy mode (Node/Vercel and STATIC_EXPORT=1),
// whereas metadata route handlers conflict with cacheComponents + output: "export".
import { writeFileSync } from "node:fs";

function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

const site = resolveSiteUrl();
const trailing = process.env.STATIC_EXPORT === "1" ? "/" : "";
const routes = [
  ["/", 1],
  ["/tech", 0.9],
  ["/edits", 0.9],
  ["/contact", 0.6],
];

const urls = routes
  .map(([path, priority]) => {
    const loc = path === "/" ? `${site}/` : `${site}${path}${trailing}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  })
  .join("\n");

writeFileSync(
  "public/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);
writeFileSync("public/robots.txt", `User-Agent: *\nAllow: /\n\nHost: ${site}\nSitemap: ${site}/sitemap.xml\n`);
console.log(`seo: robots.txt + sitemap.xml for ${site}`);
