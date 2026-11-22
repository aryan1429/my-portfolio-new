"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { profile } from "@/data/portfolio";
import { formatTimecode, gsapEase, prefersReducedMotion } from "@/lib/motion";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { normalizePath, PRELOADED_KEY } from "@/lib/site";
import { markIntroReady } from "@/lib/transition";

/** Frames the counter "plays" from 0 → 100 %, displayed as a 24 fps timecode. */
const CLIP_FRAMES = 100;
/** If JS boots this late the CSS failsafe is about to hide the overlay — skip instead. */
const LATE_BOOT_MS = 6000;

/** Where the outro starts (s): the lift overlaps the end of the count so content shows by ~0.85 s. */
const OUTRO_AT = 0.75;

function Chars({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {Array.from(text).map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          data-pl-char
          className="inline-block will-change-transform"
          style={{ transform: "translate3d(0, 115%, 0)" }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

/**
 * First-visit intro (once per session, home page entries only): a 0 → 100 counter rendered as a
 * timecode with a scrubber, the name rising out of masks, then the slate lifts with a crimson trailing
 * edge — ~1.4 s end to end, content uncovered from ~0.85 s. Deep links (/tech, /edits, /contact),
 * repeat visits and reduced motion skip it (the inline boot script hides it before first paint).
 * No waiting on window "load": the counter is choreography, not a real progress bar.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const edge = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const timecode = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const html = document.documentElement;
    const el = root.current;

    let seen = false;
    try {
      seen = sessionStorage.getItem(PRELOADED_KEY) === "1";
    } catch {
      seen = false;
    }

    const complete = (remember: boolean) => {
      html.setAttribute("data-preloaded", "");
      if (remember) {
        try {
          sessionStorage.setItem(PRELOADED_KEY, "1");
        } catch {
          /* storage unavailable (private mode) — the intro will simply replay next visit */
        }
      }
      markIntroReady();
    };

    // Deep links go straight to their content (no LCP delay); the intro is kept for a later home entry.
    const homeEntry = normalizePath(window.location.pathname) === "/";
    if (!homeEntry) {
      complete(false);
      return;
    }
    if (!el || seen || prefersReducedMotion() || performance.now() > LATE_BOOT_MS) {
      complete(true);
      return;
    }

    lockScroll("preloader");
    html.removeAttribute("data-preloaded");

    const chars = el.querySelectorAll<HTMLElement>("[data-pl-char]");
    const fades = el.querySelectorAll<HTMLElement>("[data-pl-fade]");
    const progress = { p: 0 };
    const render = () => {
      const pct = Math.round(progress.p * 100);
      if (counter.current) counter.current.textContent = String(pct).padStart(3, "0");
      if (timecode.current) timecode.current.textContent = formatTimecode((progress.p * CLIP_FRAMES) / 24, 24);
      if (bar.current) bar.current.style.transform = `scaleX(${progress.p})`;
    };

    gsap.set(chars, { y: 0, yPercent: 115 });
    gsap.set(fades, { autoAlpha: 0, y: 12 });
    gsap.set([panel.current, edge.current], { yPercent: 0 });
    render();

    // One timeline: count + name rise, then (overlapping the tail of the count) name out and lift.
    const tl = gsap
      .timeline({
        onComplete: () => {
          unlockScroll("preloader");
          complete(true);
        },
      })
      .to(fades, { autoAlpha: 1, y: 0, duration: 0.4, ease: gsapEase.out, stagger: 0.03 }, 0)
      .to(chars, { yPercent: 0, duration: 0.5, ease: gsapEase.out, stagger: 0.015 }, 0.05)
      .to(progress, { p: 1, duration: OUTRO_AT + 0.1, ease: "power2.inOut", onUpdate: render }, 0)
      .to(chars, { yPercent: -115, duration: 0.4, ease: gsapEase.inOut, stagger: 0.01 }, OUTRO_AT)
      .to(fades, { autoAlpha: 0, y: -10, duration: 0.25, ease: "power2.in" }, OUTRO_AT)
      .add(() => markIntroReady(), OUTRO_AT + 0.08)
      .to(panel.current, { yPercent: -100, duration: 0.55, ease: gsapEase.inOut }, OUTRO_AT + 0.08)
      .to(edge.current, { yPercent: -100, duration: 0.55, ease: gsapEase.inOut }, OUTRO_AT + 0.14);

    return () => {
      tl.kill();
      unlockScroll("preloader");
    };
  }, []);

  const roles = profile.roles.join("  ×  ");

  return (
    <div ref={root} data-preloader aria-hidden="true" className="fixed inset-0 z-[100] overflow-hidden">
      <div ref={edge} className="absolute inset-0 bg-edit will-change-transform" />
      <div
        ref={panel}
        className="absolute inset-0 flex flex-col justify-between bg-ink p-5 will-change-transform md:p-10"
      >
        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-tech shadow-[0_0_24px_2px_rgb(91_108_255/0.6)]" />

        <div className="flex items-start justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
          <span data-pl-fade className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-edit animate-blink" />
            Rec
          </span>
          <span data-pl-fade>AA — Portfolio</span>
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="font-display font-bold uppercase leading-[0.82] tracking-[-0.045em] text-[clamp(3.25rem,15vw,14rem)]">
            <span className="block overflow-hidden pb-[0.06em]">
              <Chars text={profile.firstName} className="block text-paper" />
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <Chars
                text={profile.lastName}
                className="block text-transparent [-webkit-text-stroke:1.5px_var(--color-paper)]"
              />
            </span>
          </h2>
          <p data-pl-fade className="max-w-[46ch] font-mono text-[11px] uppercase tracking-[0.2em] text-mute md:text-xs">
            {roles}
          </p>
        </div>

        <div className="flex items-end gap-5 md:gap-10">
          <div data-pl-fade className="flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
            <span>TC</span>
            <span ref={timecode} className="text-paper tabular-nums">
              00:00:00:00
            </span>
          </div>
          <div data-pl-fade className="relative mb-2 h-px flex-1 bg-line">
            <span
              ref={bar}
              className="absolute inset-0 origin-left bg-linear-to-r from-tech to-edit"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
          <div data-pl-fade className="flex items-start font-mono leading-none tabular-nums text-paper">
            <span ref={counter} className="text-[clamp(2.5rem,8vw,6rem)] font-medium tracking-[-0.04em]">
              000
            </span>
            <span className="ml-1 mt-1 text-xs text-mute">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
