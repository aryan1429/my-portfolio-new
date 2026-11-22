# Build spec — Aryan Aligeti 3D / motion portfolio

Project root: `C:\Users\aryan\Desktop\aryan-portfolio-3d` (Next 16.4 App Router, React 19.3, TS, Tailwind v4,
`cacheComponents: true` in next.config.ts). Source of truth for content: the local clone of
`https://github.com/aryan1429/My-Portfolio` at `C:\Users\aryan\Desktop\my-portfolio` (read-only — never modify it).

Read `AGENTS.md` in the project root: Next 16 differs from older versions; check `node_modules/next/dist/docs/`
before using an API you are unsure of. Installed: three 0.187, @react-three/fiber 9, @react-three/drei 10,
@react-three/postprocessing 3, gsap 3.15 + @gsap/react, framer-motion 14 (import from `framer-motion`), lenis 1.3
(`lenis/react` available), clsx, tailwind-merge, lucide-react. Do NOT add dependencies without a strong reason;
if you must, use `npm install` and say so in your report.

## Design tokens (defined in `src/app/globals.css` via Tailwind v4 `@theme`)
| token | value | Tailwind usage |
|---|---|---|
| `--color-ink` | `#07070A` (page bg) | `bg-ink` |
| `--color-ink-2` | `#0E0E13` (raised surface) | `bg-ink-2` |
| `--color-paper` | `#F4F4F6` (text) | `text-paper` |
| `--color-mute` | `#8B8B98` (secondary text) | `text-mute` |
| `--color-line` | `rgb(255 255 255 / 0.08)` | `border-line` |
| `--color-tech` | `#5B6CFF` (electric indigo) | `text-tech`, `bg-tech` |
| `--color-tech-2` | `#22D3EE` (cyan) | `text-tech-2` |
| `--color-edit` | `#FF2E4D` (crimson) | `text-edit` |
| `--color-edit-2` | `#FFB020` (amber) | `text-edit-2` |
| `--color-accent` | route-driven: `var(--accent)` | `text-accent`, `bg-accent` |
| `--font-display` | Syne (next/font/google, variable `--font-syne`) | `font-display` |
| `--font-sans` | Inter (variable `--font-inter`) | `font-sans` |
| `--font-mono` | JetBrains Mono (variable `--font-jetbrains`) | `font-mono` |

Route side: `<html data-side="home|tech|edits|contact">` is set by `RouteSide` (client) on pathname change.
`--accent` = tech indigo on `tech`, crimson on `edits`, paper on `home`/`contact`. Gradients for the dual identity:
`.text-dual` (indigo → crimson text gradient) is a utility in globals.css.

Global utilities in globals.css: `.container-x` (max-w 1440px, px-5 md:px-10), `.eyebrow` (mono, 11px, uppercase,
tracking 0.2em, text-mute), `.hairline` (1px line border-line), `.text-dual`, `.no-scrollbar`, Lenis CSS
(`html.lenis` rules), `::selection` (accent bg). `cursor: none` only when `html.has-custom-cursor` is set.
`@media (prefers-reduced-motion: reduce)` disables non-essential animation.

## Shared runtime modules (exact paths / export names — other agents import these)
- `src/lib/cn.ts` → `export function cn(...inputs: ClassValue[]): string` (clsx + tailwind-merge).
- `src/lib/scroll.ts` → `export const scrollState = { y: 0, progress: 0, velocity: 0, direction: 1 as 1 | -1 }`
  (mutable, updated every Lenis scroll event; progress = 0..1 of page) and
  `export function getLenis(): Lenis | null`, `export function setLenis(l: Lenis | null): void`.
- `src/lib/pointer.ts` → `export const pointerState = { x: 0, y: 0, nx: 0, ny: 0 }` (px and normalised -1..1, updated
  by a single passive window `pointermove` listener installed by `Cursor`/`SmoothScroll`; 3D reads it in useFrame).
- `src/lib/motion.ts` → `export const ease = { out: [0.22, 1, 0.36, 1], inOut: [0.76, 0, 0.24, 1] } as const`,
  `export const gsapEase = { out: "expo.out", inOut: "power4.inOut" }`, and
  `export function usePrefersReducedMotion(): boolean`, `export function useIsTouch(): boolean`.
- `src/lib/transition.ts` → tiny external store (useSyncExternalStore) for page transitions:
  `export function useTransitionState(): { phase: "idle" | "covering" | "covered" | "revealing"; label: string }`,
  `export function startTransition(href: string, label?: string): void`.
- `src/data/types.ts` (exists — do not change field names) and `src/data/portfolio.ts` →
  `export const portfolio: Portfolio` plus named re-exports `profile, stats, skills, techProjects, videoEdits,
  experience, socials, techCategories` (`techCategories: TechCategory[]` = categories actually used, in order).

## Component map (ownership in parentheses — only touch files you own)
Foundation (agent FOUNDATION):
- `src/app/layout.tsx` — fonts, metadata (title template `%s — Aryan Aligeti`), `<html data-side>`, mounts in order:
  `<SmoothScroll>` wrapper, `<SceneCanvas/>` (fixed, z-0), `<Grain/>`, `<Cursor/>`, `<Nav/>`, `<main className="relative z-10">`,
  `<Footer/>`, `<PageTransition/>` overlay, `<Preloader/>`, `<RouteSide/>`.
- `src/app/globals.css`, `src/lib/{cn,scroll,pointer,motion,transition}.ts`
- `src/components/providers/SmoothScroll.tsx` (Lenis root + GSAP ScrollTrigger sync via gsap.ticker, lagSmoothing(0),
  scroll-to-top on pathname change, disabled for reduced motion; stores instance with setLenis).
- `src/components/providers/RouteSide.tsx`
- `src/components/layout/Nav.tsx` (fixed top: monogram "AA" + name, links Home/Tech/Edits/Contact with active
  indicator, live clock/timecode in mono on desktop, mobile full-screen menu with staggered links),
  `Footer.tsx` (big "Let's work" link to /contact, socials, © year, back-to-top),
  `TransitionLink.tsx` (`export default function TransitionLink(props: ComponentProps<typeof Link> & { label?: string })`
  — intercepts same-origin clicks, calls startTransition, falls back to normal Link for modifier-clicks/external),
  `PageTransition.tsx` (full-screen wipe: two staggered panels — indigo + crimson edges — sliding over, route label
  in mono + timecode; drives router.push when covered, reveals when pathname matches),
  `Preloader.tsx` (first load only, sessionStorage flag; 0→100 counter in mono timecode style, name reveal, ~1.6 s,
  skips under reduced motion).
- `src/components/motion/Cursor.tsx` (dot + lagging ring; grows over `a, button, [data-cursor]`, shows text from
  `data-cursor="View"`; attracts to `[data-magnetic]`; disabled on touch/coarse pointers),
  `src/components/motion/Grain.tsx` (animated SVG/canvas film grain overlay, pointer-events-none, opacity ~0.06).
- `src/app/not-found.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/icon` (reuse favicon), metadata/OG.

3D (agent THREE) — everything under `src/components/three/`:
- `SceneCanvas.tsx` (default export, "use client"): wraps a `next/dynamic(..., { ssr: false })` import of `Scene.tsx`;
  renders a `fixed inset-0 z-0 pointer-events-none` container. Canvas uses `eventSource`/window pointer via
  `pointerState`, `dpr={[1, 1.75]}`, drei `PerformanceMonitor` + `AdaptiveDpr`, `gl={{ antialias: false, powerPreference: "high-performance" }}`.
- `Scene.tsx`: reads `usePathname()`, keeps current + previous scene keys, cross-fades (uniform/opacity + scale +
  camera tween with damp) — never hard-swaps. Postprocessing (Bloom, Noise, Vignette, subtle ChromaticAberration) on
  desktop only.
- `scenes/HubScene.tsx` (home + contact variant): central shader "core" (noise-displaced icosahedron, fresnel, two-tone
  indigo/crimson), two orbit rings (one cool, one warm) = the dual identity, drifting particle field; reacts to
  pointer (tilt/parallax) and `scrollState.progress` (camera dolly, core scale/dissolve).
- `scenes/TechGridScene.tsx` (/tech): instanced node grid + connecting lines (network/graph), wave travelling with
  scroll, data-pulse along edges, cool indigo/cyan lighting.
- `scenes/EditsStudioScene.tsx` (/edits): floating film frames (rounded planes, some textured with `videoEdits[i].thumbnail`
  via drei `useTexture`, loaded lazily with Suspense) arranged along a curved timeline ribbon that scrolls with
  `scrollState.progress`, wave motion, film-strip sprockets, dramatic warm crimson/amber rim light, light leaks.
- Fallbacks: `prefers-reduced-motion` → render one still frame (`frameloop="demand"`); mobile/coarse pointer → lower
  counts, no postprocessing; WebGL unavailable → CSS gradient fallback. Pause rendering when tab hidden.

Motion primitives (agent MOTION) — `src/components/motion/` (all "use client", typed props, reduced-motion aware):
- `KineticText.tsx` — `export default function KineticText({ text, as = "h1", className, delay = 0, stagger = 0.03,
  mode = "chars" | "words" | "lines", trigger = "mount" | "inView" })` — masked rise + skew reveal per char/word,
  accessible (aria-label on wrapper, split spans aria-hidden).
- `ScrambleText.tsx` — `{ text, className, duration?, trigger? }` decoding effect with mono glyphs.
- `Reveal.tsx` — `{ children, delay?, y?, className, as? }` fade/translate/blur-in on inView (Framer Motion).
- `MagneticButton.tsx` — `{ children, className, strength?, as?: "button" | "a" | typeof TransitionLink, ...rest }`
  with `data-magnetic`; spring-based pull, inner label counter-moves.
- `Marquee.tsx` — `{ items: string[], speed?, direction?, className, separator? }`, velocity-reactive (reads
  `scrollState.velocity`), pauses on hover.
- `Timecode.tsx` — `{ className, fps = 24, running = true, startSeconds? }` "00:00:12:04" ticking display.
- `SectionHeading.tsx` — `{ index: string /* "01" */, eyebrow: string, title: string, side?: Side, className }`.
- `TiltCard.tsx` — `{ children, className, max = 8 }` pointer tilt + glare.
- `ScrollProgress.tsx` — thin accent bar / scrubber reading `scrollState.progress`.
- `HudFrame.tsx` — four corner brackets + optional labels (REC dot, resolution "3840×2160", fps) as an overlay.
- `Counter.tsx` — `{ value: string }` animates numeric part on inView.
- `index.ts` barrel exporting all of the above.

Data (agent DATA): `src/data/portfolio.ts` + assets copied to `public/images/{profile,projects,edits}/` and
`public/resume.pdf`. Images keep original extensions; file names kebab-case.

Pages (later phase): `src/app/page.tsx`, `src/app/tech/page.tsx`, `src/app/edits/page.tsx`,
`src/app/contact/page.tsx`, each with sections in `src/components/sections/{home,tech,edits,contact}/`.

## Quality bar
- Strict TS, no `any`, no unused vars; `npm run lint` and `npx tsc --noEmit` clean for your files.
- "use client" only where needed; pages export `metadata`. Server components import static data directly.
- 60 fps: no React state updates in rAF loops (use refs / mutable stores); GSAP contexts via `useGSAP` with cleanup;
  dispose three resources; no layout thrash on scroll.
- Responsive from 360 px; touch-friendly; keyboard-accessible (focus-visible styles, ESC closes modals); alt text;
  respects prefers-reduced-motion.
- Never invent portfolio facts. If the source lacks a field, omit it (UI must handle absence gracefully).
