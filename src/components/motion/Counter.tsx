"use client";

import { useEffect, useMemo, useRef } from "react";
import { inView } from "framer-motion";
import { cn } from "@/lib/cn";
import { gsapEase, usePrefersReducedMotion } from "@/lib/motion";
import { formatNumeric, gsap, parseNumeric, useGSAP, useMotionReady } from "./internal";

export interface CounterProps {
  /** Display value, e.g. "15+", "3.5k", "1,200". The numeric part counts up; prefix/suffix stay put. */
  value: string;
  className?: string;
  /** Seconds. */
  duration?: number;
  delay?: number;
}

/**
 * Counts the numeric part of `value` up from zero when it scrolls into view.
 * The final value is server-rendered (SEO / no-JS) and an invisible copy reserves its width,
 * so the changing digits never shift layout. Screen readers only ever hear the final value.
 */
export default function Counter({ value, className, duration = 1.6, delay = 0 }: CounterProps) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const outRef = useRef<HTMLSpanElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const ready = useMotionReady();
  const readyRef = useRef(ready);
  const playRef = useRef<(() => void) | null>(null);
  const parsed = useMemo(() => parseNumeric(value), [value]);

  useGSAP(
    (_ctx, safe) => {
      const root = rootRef.current;
      const out = outRef.current;
      if (!root || !out || !safe) return;
      out.textContent = value;
      if (!parsed || reduced || parsed.value === 0) return;

      const state = { n: 0 };
      out.textContent = formatNumeric(0, parsed);
      let seen = false;
      let played = false;

      const run = safe(() => {
        gsap.to(state, {
          n: parsed.value,
          duration,
          delay,
          ease: gsapEase.out,
          onUpdate: () => {
            out.textContent = formatNumeric(state.n, parsed);
          },
          onComplete: () => {
            out.textContent = value;
          },
        });
      });

      const tryPlay = () => {
        if (played || !seen || !readyRef.current) return;
        played = true;
        run();
      };
      playRef.current = tryPlay;

      const stop = inView(
        root,
        () => {
          seen = true;
          tryPlay();
        },
        { amount: 0.6 },
      );

      return () => {
        stop();
        playRef.current = null;
        out.textContent = value;
      };
    },
    { scope: rootRef, dependencies: [value, parsed, reduced, duration, delay], revertOnUpdate: true },
  );

  useEffect(() => {
    readyRef.current = ready;
    if (ready) playRef.current?.();
  }, [ready]);

  return (
    <span ref={rootRef} className={cn("relative inline-block whitespace-nowrap tabular-nums", className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="invisible">
        {value}
      </span>
      <span ref={outRef} aria-hidden="true" className="absolute inset-0 whitespace-nowrap">
        {value}
      </span>
    </span>
  );
}
