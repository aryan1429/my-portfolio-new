# Aryan Aligeti — 3D / motion portfolio

A dual-identity portfolio for **Aryan Aligeti**, full-stack developer *and* video editor / motion-graphics artist.
One persistent WebGL scene runs behind every page and re-stages itself per route (a shader "core" hub for home and
contact, a network grid for `/tech`, a curved film-frame timeline for `/edits`). Pages are connected by an
editor's-cut wipe, scrolling is smooth (Lenis) and synced with GSAP ScrollTrigger, and the UI is built from a small
set of reusable motion primitives.

| Route | What it is |
|---|---|
| `/` | Hero, gateways into both sides, selected work, about, skills, experience, closing CTA |
| `/tech` | Filterable project gallery; each project opens a modal (`/tech#<slug>` deep link) |
| `/edits` | NLE-style timeline + reel grid; each edit opens a video viewer (`/edits#<slug>` deep link) |
| `/contact` | Intent lanes, mail composer (opens the visitor's mail client), socials, live studio clock |

## Stack

- **Next.js 16.4** (App Router, Turbopack, `cacheComponents` + `partialPrefetching`) · **React 19.3** · **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first `@theme` tokens in `src/app/globals.css`)
- **three 0.187** · **@react-three/fiber 9** · **@react-three/drei 10** · **@react-three/postprocessing 3** / `postprocessing`
- **GSAP 3.15** (+ `@gsap/react`, ScrollTrigger) · **Framer Motion 14** · **Lenis 1.3**
- `clsx` + `tailwind-merge` (`cn()`), `lucide-react` icons

## Getting started

Requires Node.js 20.9+ and npm.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build (every route is prerendered as static content) |
| `npm run start` | Serve the production build (`npm run start -- -p 3123` for another port) |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npx tsc --noEmit -p .` | Type-check |

> `AGENTS.md` is written by `next dev`: Next 16 differs from older versions, so check `node_modules/next/dist/docs/`
> before using an API you are unsure of. `docs/BUILD_SPEC.md` is the original build spec (tokens, module contracts).

## Environment variables

Both are optional and **inlined at build time** (`NEXT_PUBLIC_*`), so rebuild / redeploy after changing them. Copy
`.env.example` to `.env.local` for local overrides.

| Variable | Used for | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin: `metadataBase`, Open Graph URLs, `sitemap.xml`, `robots.txt` (`src/lib/site.ts`) | Vercel's `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL`, else `http://localhost:3000` |
| `NEXT_PUBLIC_VIDEO_CDN` | Base URL for edit videos that are **not** shipped in `public/videos` (trimmed, trailing `/` removed) | The original DigitalOcean Spaces bucket, which no longer exists |

## Folder structure

Generated from the real tree (`node_modules`, `.next`, `.git` and `*.tsbuildinfo` excluded).

```text
aryan-portfolio-3d/
├── docs/
│   └── BUILD_SPEC.md
├── public/
│   ├── images/
│   │   ├── edits/
│   │   │   ├── tex/
│   │   │   │   ├── 2-broke-girls.jpg
│   │   │   │   ├── can-wolverine-survive-a-black-hole.jpg
│   │   │   │   ├── cartoons-finale.jpg
│   │   │   │   ├── how-did-our-moon-form.jpg
│   │   │   │   ├── ironman.jpg
│   │   │   │   ├── jon-snow.jpg
│   │   │   │   ├── salesman.jpg
│   │   │   │   ├── soldier-boy.jpg
│   │   │   │   ├── spider-x-doakes.jpg
│   │   │   │   ├── spiderman-x-funk.jpg
│   │   │   │   ├── spiderman.jpg
│   │   │   │   ├── steve.jpg
│   │   │   │   └── william-butcher.jpg
│   │   │   ├── 2-broke-girls.jpg
│   │   │   ├── can-wolverine-survive-a-black-hole.png
│   │   │   ├── cartoons-finale.png
│   │   │   ├── how-did-our-moon-form.png
│   │   │   ├── ironman.jpg
│   │   │   ├── jon-snow.png
│   │   │   ├── salesman.avif
│   │   │   ├── soldier-boy.png
│   │   │   ├── spider-x-doakes.png
│   │   │   ├── spiderman-x-funk.jpg
│   │   │   ├── spiderman.jpg
│   │   │   ├── steve.jpg
│   │   │   └── william-butcher.jpg
│   │   ├── profile/
│   │   │   └── aryan-aligeti.jpeg
│   │   └── projects/
│   │       ├── bro-study-buddy-1.png
│   │       ├── bro-study-buddy-2.png
│   │       ├── bro-study-buddy-3.png
│   │       ├── bro-study-buddy-4.png
│   │       ├── chest-xray-report-generator.png
│   │       ├── expense-tracker.png
│   │       ├── gym-tracker-1.png
│   │       ├── gym-tracker-2.png
│   │       ├── gym-tracker-3.png
│   │       ├── gym-tracker-4.png
│   │       ├── mr-sarcastic.png
│   │       ├── snakebite-detection-1.png
│   │       ├── snakebite-detection-2.png
│   │       ├── snakebite-detection-3.png
│   │       └── text-mood-dj.png
│   ├── videos/
│   │   ├── can-wolverine-survive-a-black-hole.mp4
│   │   ├── how-did-our-moon-form.mp4
│   │   ├── ironman.mp4
│   │   ├── salesman.mp4
│   │   ├── spider-x-doakes.mp4
│   │   ├── spiderman.mp4
│   │   └── steve.mp4
│   └── resume.pdf
├── src/
│   ├── app/
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   ├── edits/
│   │   │   └── page.tsx
│   │   ├── tech/
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── icon.png
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   ├── opengraph-image.tsx
│   │   ├── page.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Footer.tsx
│   │   │   ├── Nav.tsx
│   │   │   ├── PageTransition.tsx
│   │   │   ├── Preloader.tsx
│   │   │   └── TransitionLink.tsx
│   │   ├── motion/
│   │   │   ├── Counter.tsx
│   │   │   ├── Cursor.tsx
│   │   │   ├── Grain.tsx
│   │   │   ├── HudFrame.tsx
│   │   │   ├── index.ts
│   │   │   ├── internal.ts
│   │   │   ├── KineticText.tsx
│   │   │   ├── MagneticButton.tsx
│   │   │   ├── Marquee.tsx
│   │   │   ├── README.md
│   │   │   ├── Reveal.tsx
│   │   │   ├── ScrambleText.tsx
│   │   │   ├── ScrollProgress.tsx
│   │   │   ├── SectionHeading.tsx
│   │   │   ├── TiltCard.tsx
│   │   │   └── Timecode.tsx
│   │   ├── providers/
│   │   │   ├── RouteSide.tsx
│   │   │   └── SmoothScroll.tsx
│   │   ├── sections/
│   │   │   ├── contact/
│   │   │   │   ├── ContactComposer.tsx
│   │   │   │   ├── ContactHero.tsx
│   │   │   │   ├── ContactIntents.tsx
│   │   │   │   ├── ContactMeta.tsx
│   │   │   │   ├── ContactSocials.tsx
│   │   │   │   ├── CopyEmailButton.tsx
│   │   │   │   └── mail.ts
│   │   │   ├── edits/
│   │   │   │   ├── CategoryFilter.tsx
│   │   │   │   ├── EditCard.tsx
│   │   │   │   ├── EditLightbox.tsx
│   │   │   │   ├── EditsCta.tsx
│   │   │   │   ├── EditsGrid.tsx
│   │   │   │   ├── EditsHero.tsx
│   │   │   │   ├── EditsStudio.tsx
│   │   │   │   ├── EditsTimeline.tsx
│   │   │   │   ├── hashStore.ts
│   │   │   │   └── utils.ts
│   │   │   ├── home/
│   │   │   │   ├── About.tsx
│   │   │   │   ├── ClosingCta.tsx
│   │   │   │   ├── data.ts
│   │   │   │   ├── Experience.tsx
│   │   │   │   ├── Gateways.tsx
│   │   │   │   ├── HomeHero.tsx
│   │   │   │   ├── SelectedWork.tsx
│   │   │   │   ├── Skills.tsx
│   │   │   │   └── SkillsMarquee.tsx
│   │   │   └── tech/
│   │   │       ├── FilterBar.tsx
│   │   │       ├── hash.ts
│   │   │       ├── ProjectCard.tsx
│   │   │       ├── ProjectGallery.tsx
│   │   │       ├── ProjectModal.tsx
│   │   │       ├── TechCta.tsx
│   │   │       ├── TechHeader.tsx
│   │   │       ├── TechProjects.tsx
│   │   │       ├── TechStackStrip.tsx
│   │   │       └── utils.ts
│   │   └── three/
│   │       ├── scenes/
│   │       │   ├── EditsStudioScene.tsx
│   │       │   ├── HubScene.tsx
│   │       │   └── TechGridScene.tsx
│   │       ├── shaders/
│   │       │   ├── core.ts
│   │       │   ├── film.ts
│   │       │   ├── grid.ts
│   │       │   ├── noise.ts
│   │       │   ├── particles.ts
│   │       │   └── rings.ts
│   │       ├── director.ts
│   │       ├── Effects.tsx
│   │       ├── geometry.ts
│   │       ├── hooks.ts
│   │       ├── math.ts
│   │       ├── palette.ts
│   │       ├── ParticleField.tsx
│   │       ├── Scene.tsx
│   │       ├── SceneCanvas.tsx
│   │       ├── SceneErrorBoundary.tsx
│   │       ├── textures.ts
│   │       └── types.ts
│   ├── data/
│   │   ├── portfolio.ts
│   │   └── types.ts
│   └── lib/
│       ├── cn.ts
│       ├── motion.ts
│       ├── pointer.ts
│       ├── scroll.ts
│       ├── site.ts
│       └── transition.ts
├── .env.example
├── .gitignore
├── AGENTS.md
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```

## Architecture

### Root layout (`src/app/layout.tsx`)

Mounted once and kept across navigations, in this order: `SmoothScroll` (wraps everything) → `SceneCanvas` (fixed,
`z-0`) → `Grain` → `Cursor` → `Nav` → `<main id="main" class="relative z-10">` → `Footer` → `PageTransition` →
`Preloader` → `RouteSide`. An inline boot script in `<head>` (`bootScript` in `src/lib/site.ts`) sets
`<html data-side>` (route accent) and `data-preloaded` (skip the intro) before first paint.

Stacking order: nav `z-50` · project modal `z-80` · edits viewer `z-85` · page wipe `z-90` · preloader `z-100` ·
grain `z-110` · cursor `z-120`. Overlays that open from a deep link during a wipe sit *below* it on purpose.

### Persistent canvas + scene director (`src/components/three/`)

- `SceneCanvas.tsx` loads `Scene.tsx` with `next/dynamic({ ssr: false })`, so three/fiber/drei never touch the
  server bundle or the critical path. It renders a CSS gradient fallback when WebGL 2 is missing or the context is
  lost, and adds a per-route ink scrim as the hero scrolls away.
- `Scene.tsx` owns the single `<Canvas>`. Every scene the visitor has seen stays mounted (revisits are instant) and
  fades by *presence*, never by unmounting. Quality adapts with drei `PerformanceMonitor` + `AdaptiveDpr`.
  Post-processing (`Effects.tsx`: bloom, chromatic aberration, noise, vignette) runs on desktop only and is
  `React.lazy`-loaded, so phones never download it. The frameloop is `demand` under reduced motion, and `never`
  while the tab is hidden or an opaque overlay (mobile menu, edits viewer, project modal) covers the canvas.
- `director.ts` is a mutable store advanced once per frame (`stepDirector`, `useFrame` priority −10): route key,
  per-scene presence cross-fades, smoothed scroll / pointer / energy and the damped camera tween. React only tells
  it which route is active (`setDirectorRoute`); scenes read `director` inside their own `useFrame`.
- `scenes/` (`HubScene`, `TechGridScene`, `EditsStudioScene`), `shaders/` (GLSL as TS strings), `palette.ts`,
  `geometry.ts`, `textures.ts`, `math.ts`. The `/edits` film frames use 512 px JPEG renditions in
  `public/images/edits/tex/<basename>.jpg`.

### Shared stores (`src/lib/`)

All per-frame state lives in plain mutable objects, never in React state.

| Module | Exports | Notes |
|---|---|---|
| `scroll.ts` | `scrollState { y, progress, velocity, direction }`, `getLenis` / `setLenis`, `lockScroll` / `unlockScroll(reason)`, `isScrollLocked`, `hasScrollLock`, `subscribeScrollLocks`, `scrollTo` | Locks are counted by reason (`preloader`, `menu`, `transition`, `edits-lightbox`, `tech-project-modal`). A smooth `scrollTo` requested while locked is replayed once the last lock is released (Lenis' `start()` would otherwise cancel it). |
| `pointer.ts` | `pointerState { x, y, nx, ny }`, `installPointerListener()` | One passive, ref-counted `pointermove` listener; `ny` is y-up for WebGL. |
| `transition.ts` | `useTransitionState()`, `startTransition(href, label)`, `useIntroReady()` / `markIntroReady()` | `useSyncExternalStore` stores for the page wipe (`idle → covering → covered → revealing → idle`) and the first-visit intro gate. |
| `motion.ts` | `ease`, `gsapEase`, `usePrefersReducedMotion`, `useIsTouch`, `formatTimecode`, `damp` | Shared easing and media-query hooks. |
| `site.ts` | `siteUrl`, `navItems`, `getRouteSide`, `getRouteLabel`, `normalizePath`, `bootScript` | Route → side (`home` / `tech` / `edits` / `contact`) mapping drives the accent colour. |

### Page transitions

`TransitionLink` is a drop-in `next/link` built on Link's `onNavigate`: same-origin navigations call
`startTransition()`; modifier-clicks, new tabs, downloads and external URLs keep native behaviour, and a link to the
current page smooth-scrolls to the top instead. `PageTransition` drives the wipe: two staggered panels cover the
screen, `router.push` runs while covered, and the reveal starts two frames after the new pathname renders (6 s
timeout fallback). Browser back/forward navigates without a wipe.

### Lenis + ScrollTrigger sync

`SmoothScroll` creates one Lenis instance with `autoRaf: false` and drives it from `gsap.ticker`
(`lagSmoothing(0)`), so Lenis and ScrollTrigger share one clock; every Lenis scroll event updates `scrollState` and
calls `ScrollTrigger.update()`. On a pathname change it jumps to the top (or to the `#hash` target, −80 px for the
nav) and refreshes ScrollTrigger two frames later. Under `prefers-reduced-motion` Lenis is not created and native
scrolling feeds `scrollState` instead. Scrollable overlays carry `data-lenis-prevent`.

### Motion primitives

`src/components/motion/`: `KineticText`, `ScrambleText`, `Reveal`, `MagneticButton`, `Marquee`, `Timecode`,
`SectionHeading`, `TiltCard`, `ScrollProgress`, `HudFrame`, `Counter`, `Cursor`, `Grain`, all exported from
`@/components/motion`. They are accessible (split text is `aria-hidden` with an `sr-only` copy), reduced-motion
aware and SSR-safe, and they wait for the preloader / page wipe before playing entrances (`useMotionReady`). Props
and examples: [src/components/motion/README.md](src/components/motion/README.md).

### Preloader

Plays on the first visit per session **that enters on `/`**: a ~1.4 s counter + name intro, with page content
uncovered from about 0.85 s. Deep links (`/tech`, `/edits`, `/contact`), repeat visits (`sessionStorage` key
`aa:preloaded`) and reduced motion skip it before first paint. A CSS failsafe hides it after 7 s if JavaScript never
boots.

## Editing content

**All content lives in `src/data/portfolio.ts`** (types in `src/data/types.ts`; keep the field names). Server
components import it directly, so a content change is a code change: edit, `npm run build`, deploy. The rule of the
data file is to never invent facts: leave a field out when you don't know it, and the UI hides missing optional
fields.

Images go in `public/images/{profile,projects,edits}/` with kebab-case file names; reference them as `/images/...`
paths.

### Profile, stats, skills, experience, socials

| Export | Fields |
|---|---|
| `profile` | `name`, `firstName`, `lastName`, `roles[]` (the first two are the headline pair), `tagline`, `bio[]` (paragraphs), `location?`, `education?`, `email?`, `avatar`, `resume?`, `availability?` |
| `stats` | `{ label, value }`; `value` is a string (`"100+"`) and counters animate its numeric part |
| `skills` | `{ side: "tech" \| "edits", title, items[] }`; the side decides which page / track shows it |
| `experience` | `{ title, org, period, description? }` |
| `socials` | `{ id, label, href, handle? }`; `id: "resume"` is the PDF link (`public/resume.pdf`) |

### Add a tech project

Append to `techProjects`:

```ts
{
  slug: "my-project",                   // URL hash: /tech#my-project (unique, kebab-case)
  title: "My Project",
  summary: "One line for the card.",
  description: "Full write-up for the modal.",
  categories: ["Full-Stack", "AI / ML"], // "Full-Stack" | "Frontend" | "Backend / Systems" | "AI / ML" | "Mobile"
  stack: ["Next.js", "FastAPI"],
  highlights: ["What it does well"],
  role: "Solo developer",               // optional
  year: "2025",                         // optional
  image: "/images/projects/my-project.png",
  gallery: ["/images/projects/my-project-2.png"], // optional, extra modal images
  liveUrl: "https://example.com",       // optional
  liveLabel: "Live demo",               // optional ("Download APK", ...)
  repoUrl: "https://github.com/aryan1429/my-project", // optional
  featured: true,                       // optional, see "Featured flags"
},
```

`techCategories` (the filter chips) is derived automatically from the categories actually used.

### Add a video edit

1. Add the thumbnail to `public/images/edits/<slug>.<ext>` **and** a ~512 px wide JPEG rendition to
   `public/images/edits/tex/<slug>.jpg` (the texture for the 3D film frames on `/edits`), e.g.
   `ffmpeg -i thumb.png -vf scale=512:-2 -q:v 4 public/images/edits/tex/<slug>.jpg`.
2. Host the video (see [Re-hosting videos](#re-hosting-videos)).
3. Append to `videoEdits` (array order = reel order):

```ts
{
  slug: "my-edit",                      // URL hash: /edits#my-edit
  title: "My Edit",
  category: "Edits",                    // free text; categories become filter chips + timeline colours
  thumbnail: "/images/edits/my-edit.jpg",
  thumbnailPosition: "center 20%",      // optional CSS object-position for the crop
  videoUrl: videoSrc("My_Edit_Final.mp4", "my-edit.mp4"), // see below
  aspect: "9:16",                       // optional: "16:9" | "9:16" | "1:1" | "4:5"
  duration: "00:31",                    // optional "MM:SS"; drives timeline width + timecodes
  description: "...",                   // optional
  tools: ["After Effects", "DaVinci Resolve"], // optional
  breakdown: { /* see below */ },       // optional
  featured: true,                       // optional, see "Featured flags"
},
```

`videoSrc(file, local?)` returns `/videos/<local>` when a copy is shipped in `public/videos`, otherwise
`${NEXT_PUBLIC_VIDEO_CDN}/<file>` (the file name is URL-encoded, so spaces are fine). Read `aspect` and `duration`
from the file itself:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height:format=duration -of compact my-edit.mp4
```

Clips without a `duration` get an estimated (hatched) slot in the timeline and no runtime label; the "Total runtime"
readout on `/edits` only appears once every clip has a duration.

### Fill an edit breakdown

`breakdown` is shown as numbered rows in the viewer's side panel. Any subset of keys works; empty ones are hidden.

```ts
breakdown: {
  pacing: "Cuts locked to the kick; drops to half-time for the reveal.",
  transitions: "Whip pans and a 3D camera dive through the eye at 0:12.",
  motion: "Tracked lyric titles, glow on the beat drops.",
  color: "Teal/orange grade, crushed blacks, bloom on highlights.",
  sound: "Riser into the drop, layered whooshes per transition.",
},
```

(Examples only: write what was actually done in that edit.)

### Featured flags

- `techProjects[].featured`: the tech column of "Selected work" on `/` and the highlighted cards on `/tech`.
- `videoEdits[].featured`: the edits column of "Selected work" on `/` and the first frames of the `/edits` 3D studio.
- With nothing flagged, the home page falls back to the first 3 projects / 6 edits.

## Re-hosting videos

The source repo served every edit from `https://portfolio-videos.sgp1.cdn.digitaloceanspaces.com`. **That bucket no
longer exists.** Current state:

- **7 edits are self-hosted** in `public/videos/`, re-encoded from local copies in the source repo (H.264 High,
  `+faststart`, AAC 128 kb/s; squares 960×960 @ 30 fps, shorts 720×1280 @ 60 fps; ~64 MB in total): Steve,
  Spider x Doakes, Spiderman, How did our Moon Form?, Can Wolverine Survive a Black Hole?, IronMan, Salesman.
- **6 edits need their files re-uploaded**: `Cartoons_FINALE.mp4`, `Jon Snow - Funk Criminal.mp4`,
  `William_Butcher_Final.mp4`, `SpidermanXFunk_FINALs.mp4`, `SoldierBoy_bestCC.mp4`, `sample bettermp4.mp4`. Until
  then their hover preview stays on the still (one failed request per session, never retried) and the viewer shows
  "This clip isn't available right now" without a dead "Open source file" link.

To host them:

1. Upload the files (keep these names, or change the first argument of `videoSrc(...)`) to any public object store or
   CDN: AWS S3 + CloudFront, Cloudflare R2 (public bucket or custom domain), Bunny Storage + Pull Zone, Cloudinary,
   Vercel Blob, or a new DigitalOcean Space.
2. Set `NEXT_PUBLIC_VIDEO_CDN` to the folder URL (e.g. `https://cdn.example.com/edits`) in Vercel → Project →
   Settings → Environment Variables (and in `.env.local` for dev), then redeploy.
3. To move the self-hosted 7 to the CDN too (smaller deploys), upload them and drop the second argument of their
   `videoSrc(...)` calls.

Tips:

- **Encode for the web**: H.264 (`yuv420p`, High profile) + AAC in MP4, with the index (`moov` atom) at the front so
  playback starts before the download ends:
  `ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 24 -maxrate 3M -bufsize 3M -vf "scale=1080:-2,format=yuv420p" -c:a aac -b:a 128k -movflags +faststart out.mp4`
- **Range requests**: the host must answer `Range` requests with `206 Partial Content` (all hosts above do). Seeking
  and `preload="metadata"` depend on it.
- **CORS**: plain `<video src>` playback does not need CORS. Add `Access-Control-Allow-Origin: <your site>`
  (methods `GET, HEAD`, allowed header `Range`) only if you later read frames into a canvas / WebGL or fetch the
  files from JavaScript.
- **Headers**: `Content-Type: video/mp4`; a long `Cache-Control` (`public, max-age=31536000, immutable`), and a new
  file name when you replace a cut.
- **Size**: about 2–4 Mb/s at 1080p is plenty. Hover previews start streaming on hover and phones play the same files.

## Deployment (Vercel)

1. Push the repo to GitHub and import it in Vercel (framework preset **Next.js**, default build command
   `next build`, no output directory override).
2. Set `NEXT_PUBLIC_SITE_URL` (your production domain) and, once videos are re-hosted, `NEXT_PUBLIC_VIDEO_CDN`.
3. Deploy. Every route is prerendered as static content and `public/videos` is served from Vercel's CDN with range
   support. Add the custom domain under Project → Domains and redeploy so the canonical URL matches.

Any Node host works too: `npm run build && npm run start`.

## Accessibility & performance notes

- **Keyboard & screen readers**: skip link to `#main`; visible `:focus-visible` styles; Esc closes the mobile menu,
  project modal and edits viewer. The modal and viewer trap focus and return it to the trigger. While the mobile menu
  is open the rest of the page is `inert` and Tab cycles between the header (including the Close button) and the
  menu; any route change, including browser back, closes it. Split / scrambled text keeps an `sr-only` copy.
- **Reduced motion**: Lenis off (native scroll), preloader skipped, the canvas renders a still on demand, entrances
  become fades, timecodes tick once per second, hover video previews are disabled.
- **Touch / small screens**: no custom cursor; no post-processing (and its code is never downloaded); lower particle
  and instance counts; no `backdrop-filter` (the `fine:` variant in `globals.css` reserves glass blur for mouse /
  trackpad devices, because blur over the live canvas is recomputed every frame); menu tap targets ≥ 44 px.
- **Rendering budget**: per-frame work writes to the DOM / uniforms through refs and mutable stores, never React
  state. The canvas stops while the tab is hidden or a full-screen overlay covers it; the nav clock only runs on
  `lg` screens, where it is visible.
- **Loading**: the WebGL bundle is client-only and dynamically imported; the intro only plays on a first visit to
  `/`, so deep links paint their content immediately; images go through `next/image`.
- **Contrast**: informative text uses `text-mute` (#8B8B98, ≈5.9:1 on ink) or `text-paper/60` and up; lower alphas
  are reserved for decorative separators.
