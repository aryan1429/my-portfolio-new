import type { NextConfig } from "next";

/**
 * STATIC_EXPORT=1 builds a fully static site into ./out for static hosts
 * (Cloudflare Pages, GitHub Pages, Netlify). Without it the app builds for
 * a Node/Vercel runtime with Next image optimization.
 */
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  // PPR (cacheComponents) is not allowed with output: "export".
  cacheComponents: !staticExport,
  partialPrefetching: !staticExport,
  ...(staticExport && {
    output: "export",
    trailingSlash: true,
    images: { unoptimized: true },
  }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
