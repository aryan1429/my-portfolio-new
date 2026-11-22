"use client";

import { useEffect, useRef } from "react";
import { inView } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion";
import { gsap, splitGraphemes, useGSAP, useMotionReady } from "./internal";

export type ScrambleTrigger = "mount" | "inView" | "hover";
export type ScrambleTag = "span" | "p" | "div" | "h1" | "h2" | "h3" | "h4" | "strong" | "time";

export interface ScrambleTextProps {
  text: string;
  className?: string;
  /** Seconds for the full decode. */
  duration?: number;
  /** "mount" (default) | "inView" | "hover" (decodes once on view, re-scrambles on hover/focus). */
  trigger?: ScrambleTrigger;
  delay?: number;
  as?: ScrambleTag;
  /** Glyph pool used while scrambling. */
  glyphs?: string;
}

const DEFAULT_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/\\[]{}_-:;";
/** Glyph refresh rate while scrambling (changes per second) — keeps it legible, not strobing. */
const GLYPH_HZ = 22;

export default function ScrambleText({
  text,
  className,
  duration = 1.2,
  trigger = "mount",
  delay = 0,
  as: Tag = "span",
  glyphs = DEFAULT_GLYPHS,
}: ScrambleTextProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const outRef = useRef<HTMLSpanElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const ready = useMotionReady();
  const readyRef = useRef(ready);
  const playRef = useRef<(() => void) | null>(null);

  useGSAP(
    (_ctx, safe) => {
      const root = rootRef.current;
      const out = outRef.current;
      if (!root || !out || !safe) return;
      out.textContent = text;
      if (reduced) return;

      const chars = splitGraphemes(text);
      const pool = splitGraphemes(glyphs);
      let tween: gsap.core.Tween | null = null;

      const scramble = safe(() => {
        tween?.kill();
        // Each character resolves at a slightly randomised point, sweeping left → right.
        const n = Math.max(chars.length, 1);
        const thresholds = chars.map((_, i) => 0.15 + (i / n) * 0.65 + Math.random() * 0.2);
        const current = chars.map((c) => (/\s/.test(c) ? c : pool[Math.floor(Math.random() * pool.length)]));
        const state = { p: 0 };
        let lastSwap = 0;
        out.textContent = current.join("");
        tween = gsap.to(state, {
          p: 1,
          duration,
          delay,
          ease: "none",
          onUpdate: () => {
            const now = performance.now();
            const swap = now - lastSwap > 1000 / GLYPH_HZ;
            if (swap) lastSwap = now;
            let s = "";
            for (let i = 0; i < chars.length; i++) {
              const c = chars[i];
              if (state.p >= thresholds[i] || /\s/.test(c)) {
                s += c;
              } else {
                if (swap) current[i] = pool[Math.floor(Math.random() * pool.length)];
                s += current[i];
              }
            }
            out.textContent = s;
          },
          onComplete: () => {
            out.textContent = text;
          },
        });
      });

      let seen = trigger === "mount";
      let played = false;
      const tryPlay = () => {
        if (played || !seen || !readyRef.current) return;
        played = true;
        scramble();
      };
      playRef.current = tryPlay;

      let stop: VoidFunction | undefined;
      if (trigger === "mount") {
        // If a page transition is covering the screen, the ready effect below starts it later.
        tryPlay();
      } else {
        stop = inView(
          root,
          () => {
            seen = true;
            tryPlay();
          },
          { amount: 0.4 },
        );
      }

      const onEnter = () => {
        if (trigger === "hover" && played) scramble();
      };
      root.addEventListener("pointerenter", onEnter);
      root.addEventListener("focusin", onEnter);

      return () => {
        stop?.();
        root.removeEventListener("pointerenter", onEnter);
        root.removeEventListener("focusin", onEnter);
        playRef.current = null;
        out.textContent = text;
      };
    },
    { scope: rootRef, dependencies: [text, duration, trigger, delay, glyphs, reduced], revertOnUpdate: true },
  );

  useEffect(() => {
    readyRef.current = ready;
    if (ready) playRef.current?.();
  }, [ready]);

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        rootRef.current = el;
      }}
      className={cn("relative inline-block", className)}
    >
      <span className="sr-only">{text}</span>
      {/* Invisible copy reserves the final footprint → zero layout shift while glyphs churn. */}
      <span aria-hidden="true" className="invisible">
        {text}
      </span>
      <span ref={outRef} aria-hidden="true" className="absolute inset-0">
        {text}
      </span>
    </Tag>
  );
}
