/** Site-wide constants: canonical URL, primary navigation, route → side mapping. */

export type RouteSide = "home" | "tech" | "edits" | "contact";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

/** Absolute origin used for metadataBase, sitemap and robots. Set NEXT_PUBLIC_SITE_URL in production. */
export const siteUrl: string = resolveSiteUrl();

export interface NavItem {
  href: "/" | "/tech" | "/edits" | "/contact";
  label: string;
  /** Two-digit index shown next to the link ("01"). */
  index: string;
  side: RouteSide;
}

export const navItems: readonly NavItem[] = [
  { href: "/", label: "Home", index: "01", side: "home" },
  { href: "/tech", label: "Tech", index: "02", side: "tech" },
  { href: "/edits", label: "Edits", index: "03", side: "edits" },
  { href: "/contact", label: "Contact", index: "04", side: "contact" },
];

/** Strip query/hash and trailing slashes: "/tech/?a#b" → "/tech". */
export function normalizePath(path: string): string {
  const clean = path.split(/[?#]/)[0] ?? "/";
  const trimmed = clean.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

const SIDE_PREFIXES: ReadonlyArray<readonly [string, RouteSide]> = [
  ["/tech", "tech"],
  ["/edits", "edits"],
  ["/contact", "contact"],
];

export function getRouteSide(pathname: string | null | undefined): RouteSide {
  if (!pathname) return "home";
  const p = normalizePath(pathname);
  for (const [prefix, side] of SIDE_PREFIXES) {
    if (p === prefix || p.startsWith(`${prefix}/`)) return side;
  }
  return "home";
}

/** Human label for a route ("/edits" → "Edits"); falls back to the last path segment. */
export function getRouteLabel(path: string): string {
  const p = normalizePath(path);
  const item = navItems.find((n) => n.href === p);
  if (item) return item.label;
  const last = p.split("/").filter(Boolean).pop();
  if (!last) return "Home";
  const words = decodeURIComponent(last).replace(/[-_]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** sessionStorage key set once the intro preloader has played. */
export const PRELOADED_KEY = "aa:preloaded";

/**
 * Inline <head> script: runs before first paint so the route accent (data-side) and the
 * preloader skip flag are correct on hard loads — no flash of the wrong state. The intro only plays
 * when a session enters on "/": deep links, repeat visits and reduced motion skip it.
 */
export const bootScript = `(function(){try{var d=document.documentElement,p=location.pathname.replace(/\\/+$/,"")||"/",s="home",m=${JSON.stringify(
  SIDE_PREFIXES,
)};for(var i=0;i<m.length;i++){if(p===m[i][0]||p.indexOf(m[i][0]+"/")===0){s=m[i][1];break}}d.setAttribute("data-side",s);var r=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(r||p!=="/"||sessionStorage.getItem(${JSON.stringify(
  PRELOADED_KEY,
)})==="1")d.setAttribute("data-preloaded","")}catch(e){document.documentElement.setAttribute("data-preloaded","")}})();`;
