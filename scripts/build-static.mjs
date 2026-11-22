// Cross-platform `STATIC_EXPORT=1 next build` → ./out (for Cloudflare Pages / any static host).
import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  STATIC_EXPORT: "1",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "https://aryanaligeti.pages.dev",
};

for (const cmd of ["node scripts/gen-seo.mjs", "npx next build"]) {
  const r = spawnSync(cmd, { stdio: "inherit", shell: true, env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
