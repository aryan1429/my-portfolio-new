"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView, type Transition } from "framer-motion";
import { ease, usePrefersReducedMotion } from "@/lib/motion";
import { useMotionReady } from "./internal";

export type RevealTag =
  | "div"
  | "section"
  | "article"
  | "aside"
  | "header"
  | "footer"
  | "figure"
  | "li"
  | "ul"
  | "ol"
  | "p"
  | "span";

export interface RevealProps {
  children: ReactNode;
  /** Seconds before the reveal starts once in view. */
  delay?: number;
  /** Start offset in px (positive = rises up). */
  y?: number;
  /** Start blur in px. 0 disables the blur. */
  blur?: number;
  /** Seconds. */
  duration?: number;
  className?: string;
  as?: RevealTag;
  /** Fraction of the element that must be visible (0..1). */
  amount?: number;
  /** Replay every time it re-enters the viewport. Default false (reveal once). */
  repeat?: boolean;
  id?: string;
}

/**
 * Fade + rise (optional de-blur) on enter. Transform/opacity/filter only → zero layout shift.
 * Waits for page transitions to uncover the screen before playing.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  blur = 0,
  duration = 0.9,
  className,
  as = "div",
  amount = 0.2,
  repeat = false,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const ready = useMotionReady();
  const inView = useInView(ref, { once: !repeat, amount, margin: "0px 0px -8% 0px" });
  const shown = inView && ready;

  const Component = motion[as];

  // Blur is opt-in: an animated filter re-renders the element's layer every frame (and blur(0px)
  // still keeps an effect node alive), which is costly over the always-animating WebGL canvas.
  const hidden = blur > 0 ? { opacity: 0, y, filter: `blur(${blur}px)` } : { opacity: 0, y };
  const visible = blur > 0 ? { opacity: 1, y: 0, filter: "none" } : { opacity: 1, y: 0 };

  const base: Transition = { duration, delay, ease: ease.out };
  const transition: Transition = reduced
    ? { ...base, duration: Math.min(duration, 0.4), y: { duration: 0 }, filter: { duration: 0 } }
    : base;

  return (
    <Component
      ref={(el: HTMLElement | null) => {
        ref.current = el;
      }}
      id={id}
      className={className}
      initial={hidden}
      animate={shown ? visible : hidden}
      transition={transition}
    >
      {children}
    </Component>
  );
}
