"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { getLenis, scrollState } from "@/lib/scroll";
import { gsap } from "./internal";

export interface ScrollProgressProps {
  className?: string;
  /**
   * "bar" (default): thin full-width accent line fixed to the top of the viewport.
   * "scrubber": vertical NLE-style rail on the right edge with a playhead + mono percentage (md and up).
   */
  variant?: "bar" | "scrubber";
}

/** Page progress 0..1 — Lenis-driven when smooth scroll is active, native otherwise (e.g. reduced motion). */
function readProgress(): number {
  if (getLenis()) return scrollState.progress;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

/**
 * Reads progress inside the GSAP ticker and writes a single transform — no React state, no layout thrash
 * (native fallback only measures on scroll/resize events).
 */
export default function ScrollProgress({ className, variant = "bar" }: ScrollProgressProps) {
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const headRef = useRef<HTMLSpanElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let progress = -1;
    let nativeProgress = 0;
    let railHeight = railRef.current?.offsetHeight ?? 0;

    const measureNative = () => {
      if (!getLenis()) nativeProgress = readProgress();
    };
    const onResize = () => {
      railHeight = railRef.current?.offsetHeight ?? 0;
      measureNative();
      progress = -1; // force a repaint
    };
    measureNative();
    window.addEventListener("scroll", measureNative, { passive: true });
    window.addEventListener("resize", onResize);

    const tick = () => {
      const p = getLenis() ? scrollState.progress : nativeProgress;
      if (Math.abs(p - progress) < 0.0005) return;
      progress = p;
      if (fillRef.current) fillRef.current.style.transform = variant === "bar" ? `scaleX(${p})` : `scaleY(${p})`;
      if (headRef.current) headRef.current.style.transform = `translate3d(0, ${(p * railHeight).toFixed(1)}px, 0)`;
      if (labelRef.current) labelRef.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("scroll", measureNative);
      window.removeEventListener("resize", onResize);
    };
  }, [variant]);

  if (variant === "scrubber") {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex lg:right-6",
          className,
        )}
      >
        <span className="font-mono text-[10px] tracking-[0.2em] text-mute">IN</span>
        <div ref={railRef} className="relative h-[28vh] w-px bg-line">
          <span ref={fillRef} className="absolute inset-0 origin-top [transform:scaleY(0)] bg-accent" />
          <span ref={headRef} className="absolute top-0 left-1/2 block">
            <span className="block h-px w-3 -translate-x-1/2 bg-paper" />
            <span
              ref={labelRef}
              className="absolute top-1/2 right-3 -translate-y-1/2 font-mono text-[10px] tabular-nums tracking-[0.15em] text-paper"
            >
              000
            </span>
          </span>
        </div>
        <span className="font-mono text-[10px] tracking-[0.2em] text-mute">OUT</span>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={cn("pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px]", className)}>
      <span ref={fillRef} className="block h-full w-full origin-left [transform:scaleX(0)] bg-accent" />
    </div>
  );
}
