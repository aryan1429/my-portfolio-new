"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { formatTimecode, usePrefersReducedMotion } from "@/lib/motion";

export interface TimecodeProps {
  className?: string;
  /** Frames per second used for the FF field. */
  fps?: number;
  /** Tick in real time. When false, shows `startSeconds` statically. */
  running?: boolean;
  /** Offset in seconds the clock starts from. */
  startSeconds?: number;
  /** Decorative by default (hidden from screen readers). Provide a label to expose it as a timer. */
  label?: string;
}

/**
 * Ticking "00:00:12:04" display. Updates the DOM directly (no React re-render per frame);
 * the footprint is fixed via tabular numerals. Under reduced motion it only updates once per second.
 */
export default function Timecode({ className, fps = 24, running = true, startSeconds = 0, label }: TimecodeProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = formatTimecode(startSeconds, fps);
    if (!running) return;

    const origin = performance.now();
    let last = "";
    let raf = 0;
    let interval = 0;

    const update = () => {
      const elapsed = (performance.now() - origin) / 1000;
      const t = startSeconds + (reduced ? Math.floor(elapsed) : elapsed);
      const next = formatTimecode(t, fps);
      if (next !== last) {
        el.textContent = next;
        last = next;
      }
    };

    if (reduced) {
      interval = window.setInterval(update, 1000);
    } else {
      const loop = () => {
        update();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
    };
  }, [fps, running, startSeconds, reduced]);

  return (
    <span
      ref={ref}
      className={cn("inline-block font-mono tabular-nums tracking-wider", className)}
      {...(label ? { role: "timer", "aria-label": label } : { "aria-hidden": true })}
      suppressHydrationWarning
    >
      {formatTimecode(startSeconds, fps)}
    </span>
  );
}
