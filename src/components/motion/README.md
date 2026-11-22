# Motion primitives — `@/components/motion`

Import everything from the barrel:

```tsx
import { KineticText, Reveal, SectionHeading, MagneticButton } from "@/components/motion";
```

All primitives are client components (`"use client"` lives in each file), so they can be dropped straight into
server components / pages. Shared guarantees:

- **Accessible** — split / scrambled / counting text is `aria-hidden`; screen readers get the full final text exactly
  once through an `sr-only` copy. Decorative overlays (`HudFrame`, `ScrollProgress`, `Marquee` copies) are `aria-hidden`.
- **Reduced motion** — `prefers-reduced-motion: reduce` shows final states immediately (text visible, no tilt/magnet,
  static marquee, timecode ticks once per second, Reveal only fades).
- **SSR-safe** — no `window` access during render; final text is in the server HTML.
- **Zero layout shift** — only `transform` / `opacity` / `filter` animate; scramble & counter reserve the final
  footprint with an invisible copy.
- **Waits for the curtain** — entrance animations (KineticText, ScrambleText, Reveal, Counter) don't start while the
  first-visit Preloader or a PageTransition panel covers the screen (`useIntroReady` + `useTransitionState`; 4 s
  safety fallback if no Preloader is mounted). So a hero `KineticText` with `trigger="mount"` plays as the curtain lifts.
- **60 fps** — per-frame work writes to the DOM via refs (GSAP ticker / rAF), never React state.

---

## KineticText

Masked rise + skew reveal per character, word or line.

| prop | type | default |
|---|---|---|
| `text` | `string` (use `"\n"` for hard line breaks) | — |
| `as` | `"h1" \| "h2" \| "h3" \| "h4" \| "h5" \| "h6" \| "p" \| "span" \| "div"` | `"h1"` |
| `mode` | `"chars" \| "words" \| "lines"` | `"chars"` |
| `trigger` | `"mount" \| "inView"` | `"mount"` |
| `delay` | seconds | `0` |
| `stagger` | seconds between units | `0.03` chars · `0.06` words · `0.12` lines |
| `duration` | seconds per unit | `1.1` |
| `className`, `unitClassName`, `id` | `string` | — |

```tsx
<KineticText
  as="h1"
  text={"Aryan\nAligeti"}
  className="font-display text-[clamp(3rem,12vw,11rem)] leading-[0.9] font-bold"
  delay={0.2}
/>
<KineticText as="p" mode="lines" trigger="inView" text={profile.tagline} className="text-xl text-mute" />
```

Notes: words never break mid-word in `chars` mode. `lines` mode measures line wraps at play time (after fonts load),
so it adapts to any width. Typography (size, leading, colour, gradients like `.text-dual`) goes on `className`;
gradients that must span the whole line should use `mode="words"` or `"lines"` + `unitClassName="text-dual"`.
Without JavaScript the text stays hidden (CSS start state) — keep it for display headings, not body copy.

## ScrambleText

Decoding effect: characters churn through mono-style glyphs (`A–Z 0–9 # % & * + = < > / \ [ ] { } _ - : ;`) and lock
in left → right.

| prop | type | default |
|---|---|---|
| `text` | `string` | — |
| `trigger` | `"mount" \| "inView" \| "hover"` (hover = decode on view, re-scramble on hover/focus) | `"mount"` |
| `duration` | seconds | `1.2` |
| `delay` | seconds | `0` |
| `as` | `"span" \| "p" \| "div" \| "h1"–"h4" \| "strong" \| "time"` | `"span"` |
| `glyphs` | custom glyph pool | see above |
| `className` | `string` | — |

```tsx
<ScrambleText text="Full-Stack Developer" className="eyebrow" trigger="inView" />
<a href="/edits" className="font-mono"><ScrambleText text="View reel" trigger="hover" /></a>
```

Renders as `inline-block`; pair with `font-mono` for the tightest look.

## Reveal

Fade + rise + de-blur when scrolled into view (Framer Motion).

| prop | type | default |
|---|---|---|
| `children` | `ReactNode` | — |
| `as` | `"div" \| "section" \| "article" \| "aside" \| "header" \| "footer" \| "figure" \| "li" \| "ul" \| "ol" \| "p" \| "span"` | `"div"` |
| `delay` | seconds | `0` |
| `y` | px start offset | `28` |
| `blur` | px start blur (`0` = none) | `8` |
| `duration` | seconds | `0.9` |
| `amount` | visible fraction to trigger | `0.2` |
| `repeat` | replay on every re-entry | `false` |
| `className`, `id` | `string` | — |

```tsx
{projects.map((p, i) => (
  <Reveal key={p.slug} as="li" delay={(i % 3) * 0.08}>
    <ProjectCard project={p} />
  </Reveal>
))}
```

Tip: use `blur={0}` on very large blocks (blur filters on full-width sections are costly).

## MagneticButton

Spring-based pull toward the pointer; the inner label counter-moves for depth. The static outer wrapper carries
`data-magnetic` (the global `Cursor` snaps to it). Polymorphic — every prop of the rendered element passes through and
is type-checked.

| prop | type | default |
|---|---|---|
| `as` | `"button" \| "a" \| any component (e.g. `TransitionLink`) | `"button"` |
| `children` | `ReactNode` | — |
| `className` | classes for the button/link itself | — |
| `wrapperClassName` | classes for the outer wrapper (layout: `w-full`, margins) | — |
| `labelClassName` | classes for the inner label span | — |
| `strength` | fraction of pointer offset travelled | `0.35` |
| `labelCounter` | fraction the label moves the opposite way | `0.25` |
| `...rest` | props of `as` (`href`, `onClick`, `download`, `label`, `aria-*`…) | — |

```tsx
import TransitionLink from "@/components/layout/TransitionLink";

<MagneticButton
  as={TransitionLink}
  href="/contact"
  label="Contact"
  className="rounded-full bg-paper px-7 py-4 font-medium text-ink"
>
  Let&apos;s work <ArrowUpRight className="size-4" />
</MagneticButton>

<MagneticButton as="a" href="/resume.pdf" download className="rounded-full border border-line px-6 py-3">
  Résumé
</MagneticButton>

<MagneticButton onClick={copyEmail} className="rounded-full bg-accent px-6 py-3">Copy email</MagneticButton>
```

`as="button"` defaults `type="button"`. The label span is `inline-flex items-center gap-[inherit]`, so put `gap-*` on
`className`. Disabled on touch devices and under reduced motion.

## Marquee

Infinite seamless ticker; speeds up with scroll velocity (`scrollState.velocity`), flips with scroll direction, eases
to a stop on hover, pauses rendering off-screen. Static under reduced motion.

| prop | type | default |
|---|---|---|
| `items` | `string[]` | — |
| `speed` | px / second | `60` |
| `direction` | `"left" \| "right"` | `"left"` |
| `separator` | `ReactNode` | accent `✦` |
| `className`, `itemClassName` | `string` | — |
| `followScroll` | flip with scroll direction | `true` |
| `velocityFactor` | scroll boost strength (`0` = off) | `1` |
| `pauseOnHover` | | `true` |

```tsx
<Marquee
  items={["Next.js", "React", "Node", "After Effects", "Premiere Pro"]}
  className="border-y border-line py-6 font-display text-[clamp(2rem,6vw,5rem)] uppercase"
  speed={80}
/>
<Marquee items={skills} direction="right" separator={<span className="mx-6 text-edit">/</span>} />
```

## Timecode

Ticking SMPTE display `HH:MM:SS:FF` (fixed width via tabular numerals; DOM updated directly, not via state).

| prop | type | default |
|---|---|---|
| `fps` | `number` | `24` |
| `running` | `boolean` | `true` |
| `startSeconds` | `number` | `0` |
| `label` | expose to screen readers as `role="timer"` with this label; otherwise `aria-hidden` | — |
| `className` | `string` | — |

```tsx
<Timecode className="text-xs text-mute" />
<Timecode fps={30} startSeconds={12} running={false} />
```

For static formatting on the server use `formatTimecode(seconds, fps)` from `@/lib/motion`.

## SectionHeading

`01 ── EYEBROW` row (index coloured by side, drawn gradient rule, `.eyebrow` label) above a kinetic display title
(KineticText, `trigger="inView"`).

| prop | type | default |
|---|---|---|
| `index` | `string` e.g. `"01"` | — |
| `eyebrow` | `string` | — |
| `title` | `string` (`"\n"` allowed) | — |
| `side` | `"tech" \| "edits"` (indigo / crimson; omitted → route `accent`) | — |
| `as` | `"h1" \| "h2" \| "h3"` | `"h2"` |
| `mode` | KineticText mode | `"words"` |
| `description` | `ReactNode` under the title (Reveal) | — |
| `align` | `"left" \| "center"` | `"left"` |
| `className`, `id` | `string` (`id` goes on the heading — use it for `aria-labelledby`) | — |

```tsx
<section aria-labelledby="work-title" className="container-x py-32">
  <SectionHeading id="work-title" index="02" eyebrow="Selected work" title="Things I've shipped" side="tech" />
</section>
```

## TiltCard

Pointer tilt (springs) + soft glare that follows the pointer. Transform-only; static on touch / reduced motion.

| prop | type | default |
|---|---|---|
| `children` | `ReactNode` | — |
| `max` | degrees | `8` |
| `glare` | `boolean` | `true` |
| `glareOpacity` | `0..1` | `0.22` |
| `hoverScale` | `number` | `1.015` |
| `className` | put rounding / overflow / bg here (glare inherits the radius) | — |

```tsx
<TiltCard className="overflow-hidden rounded-2xl border border-line bg-ink-2" max={6}>
  <Image src={p.image} alt={p.title} width={1200} height={750} />
</TiltCard>
```

## ScrollProgress

Page progress indicator driven by `scrollState.progress` in the GSAP ticker.

| prop | type | default |
|---|---|---|
| `variant` | `"bar"` (2 px accent line fixed at the top) \| `"scrubber"` (vertical NLE rail + playhead + `000–100` readout on the right edge, md+) | `"bar"` |
| `className` | `string` | — |

```tsx
<ScrollProgress />                       {/* e.g. once per page */}
<ScrollProgress variant="scrubber" />    {/* nice on /edits */}
```

## HudFrame

Camera-viewfinder overlay: four corner brackets + optional labels. Absolutely fills the nearest positioned ancestor
(give the parent `relative`); `aria-hidden`, `pointer-events-none`.

| prop | type | default |
|---|---|---|
| `rec` | blinking REC dot (top-left) | `false` |
| `recLabel` | `string` | `"REC"` |
| `resolution` | top-right, e.g. `"3840×2160"` | — |
| `fps` | bottom-right `"24 FPS"`, also timecode rate | — |
| `timecode` | `boolean \| number` (number = start second) — running Timecode bottom-right | `false` |
| `label` | bottom-left, e.g. clip title | — |
| `size` | bracket arm px | `18` |
| `inset` | px from edges | `12` |
| `tone` | `"paper" \| "accent"` | `"paper"` |
| `children` | extra overlay nodes | — |
| `className` | `string` | — |

```tsx
<div className="relative aspect-video overflow-hidden rounded-xl">
  <video … />
  <HudFrame rec resolution="3840×2160" fps={24} timecode label={edit.title} />
</div>
```

## Counter

Counts the numeric part of a string up from zero when ≥ 60 % visible. Prefix/suffix and thousands separators are
preserved (`"15+"`, `"3.5k"`, `"1,200+"`, `"$40K"`, `"99%"`); strings without a number render as-is.

| prop | type | default |
|---|---|---|
| `value` | `string` | — |
| `duration` | seconds | `1.6` |
| `delay` | seconds | `0` |
| `className` | `string` | — |

```tsx
{stats.map((s) => (
  <div key={s.label}>
    <Counter value={s.value} className="font-display text-6xl" />
    <p className="eyebrow mt-2">{s.label}</p>
  </div>
))}
```

## Cursor / Grain

Owned by FOUNDATION (mounted once in `layout.tsx`), re-exported here for convenience. `Cursor` grows over
`a, button, [data-cursor]`, shows the text of `data-cursor="View"`, and snaps to `[data-magnetic]`
(every `MagneticButton` sets it).
