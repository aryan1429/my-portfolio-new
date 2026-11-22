"use client";

import { Fragment, useEffect, useMemo, useRef } from "react";
import { inView } from "framer-motion";
import { cn } from "@/lib/cn";
import { gsapEase, usePrefersReducedMotion } from "@/lib/motion";
import { gsap, splitGraphemes, splitLinesWords, useGSAP, useMotionReady } from "./internal";

export type KineticTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
export type KineticMode = "chars" | "words" | "lines";
export type KineticTrigger = "mount" | "inView";

export interface KineticTextProps {
  /** Text to animate. Use "\n" for explicit line breaks. */
  text: string;
  as?: KineticTag;
  className?: string;
  /** Seconds before the reveal starts (after the trigger fires). */
  delay?: number;
  /** Seconds between units. Defaults to 0.03 (chars), 0.06 (words), 0.12 (lines). */
  stagger?: number;
  mode?: KineticMode;
  trigger?: KineticTrigger;
  /** Duration of each unit's rise, seconds. */
  duration?: number;
  /** Extra class applied to every split unit (e.g. to colour words). */
  unitClassName?: string;
  id?: string;
}

const DEFAULT_STAGGER: Record<KineticMode, number> = { chars: 0.03, words: 0.06, lines: 0.12 };

/*
 * Hidden start state lives in CSS (not inline style) so it is painted from the very first SSR frame
 * (no flash of visible text) and so `prefers-reduced-motion` can override it without JavaScript.
 */
const MASK =
  "inline-block overflow-hidden align-top pt-[0.08em] pb-[0.14em] -mt-[0.08em] -mb-[0.14em]";
const UNIT_HIDDEN =
  "inline-block will-change-transform origin-[0%_100%] [transform:translateY(115%)_skewY(7deg)] motion-reduce:[transform:none]";

export default function KineticText({
  text,
  as: Tag = "h1",
  className,
  delay = 0,
  stagger,
  mode = "chars",
  trigger = "mount",
  duration = 1.1,
  unitClassName,
  id,
}: KineticTextProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const ready = useMotionReady();
  const readyRef = useRef(ready);
  const playRef = useRef<(() => void) | null>(null);
  const lines = useMemo(() => splitLinesWords(text), [text]);
  const step = stagger ?? DEFAULT_STAGGER[mode];

  useGSAP(
    (_context, contextSafe) => {
      const root = rootRef.current;
      if (!root || reduced || !contextSafe) return;

      let seen = trigger === "mount";
      let played = false;
      let alive = true;

      const run = contextSafe(() => {
        const units = Array.from(root.querySelectorAll<HTMLElement>("[data-k-unit]"));
        if (units.length === 0) return;

        // Line index per unit, measured at play time so fonts / container width are final.
        let lineIndex: number[] = [];
        if (mode === "lines") {
          const words = Array.from(root.querySelectorAll<HTMLElement>("[data-k-word]"));
          let line = -1;
          let lastTop = Number.NEGATIVE_INFINITY;
          lineIndex = words.map((w) => {
            const top = w.offsetTop;
            if (top > lastTop + 2) {
              line += 1;
              lastTop = top;
            }
            return line;
          });
        }

        // The hidden start pose lives in a CSS class. GSAP decomposes that computed matrix into
        // px `y` + rotation/skewX/scale on first read, so every component is reset explicitly here —
        // otherwise the parsed `y` (≈115% in px) survives the tween and the text stays masked.
        gsap.fromTo(
          units,
          { x: 0, y: 0, rotation: 0, skewX: 0, scaleX: 1, scaleY: 1, yPercent: 115, skewY: 7 },
          {
            y: 0,
            yPercent: 0,
            skewY: 0,
            duration,
            delay,
            ease: gsapEase.out,
            stagger: mode === "lines" ? (i: number) => (lineIndex[i] ?? 0) * step : step,
          },
        );
      });

      const tryPlay = () => {
        if (played || !seen || !readyRef.current) return;
        played = true;
        if (mode === "lines" && typeof document !== "undefined" && document.fonts) {
          void document.fonts.ready.then(() => {
            if (alive) run();
          });
        } else {
          run();
        }
      };
      playRef.current = tryPlay;

      let stop: VoidFunction | undefined;
      if (trigger === "inView") {
        stop = inView(
          root,
          () => {
            seen = true;
            tryPlay();
          },
          { margin: "0px 0px -12% 0px", amount: 0.15 },
        );
      } else {
        tryPlay();
      }

      return () => {
        alive = false;
        stop?.();
        playRef.current = null;
      };
    },
    { scope: rootRef, dependencies: [text, mode, trigger, reduced, delay, step, duration], revertOnUpdate: true },
  );

  useEffect(() => {
    readyRef.current = ready;
    if (ready) playRef.current?.();
  }, [ready]);

  const unitClass = cn(UNIT_HIDDEN, unitClassName);

  const renderWord = (word: string, key: string) => {
    if (mode === "chars") {
      return (
        <span key={key} data-k-word="" className="inline-block whitespace-nowrap">
          {splitGraphemes(word).map((ch, ci) => (
            <span key={ci} className={MASK}>
              <span data-k-unit="" className={unitClass}>
                {ch}
              </span>
            </span>
          ))}
        </span>
      );
    }
    return (
      <span key={key} data-k-word="" className={MASK}>
        <span data-k-unit="" className={unitClass}>
          {word}
        </span>
      </span>
    );
  };

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        rootRef.current = el;
      }}
      id={id}
      className={className}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {lines.map((words, li) => (
          <Fragment key={li}>
            {li > 0 && <br />}
            {words.map((word, wi) => (
              <Fragment key={`${li}-${wi}`}>
                {wi > 0 && " "}
                {renderWord(word, `w-${li}-${wi}`)}
              </Fragment>
            ))}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
