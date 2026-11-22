"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion";
import { scrollState } from "@/lib/scroll";
import { gsap } from "./internal";

export interface MarqueeProps {
  items: string[];
  /** Base speed in px per second. */
  speed?: number;
  /** Base travel direction. */
  direction?: "left" | "right";
  className?: string;
  /** Node rendered between items. */
  separator?: ReactNode;
  /** Class applied to every item. */
  itemClassName?: string;
  /** Flip direction with the scroll direction (default true). */
  followScroll?: boolean;
  /** How strongly scroll velocity speeds the band up (default 1). 0 disables. */
  velocityFactor?: number;
  /** Pause when hovered (default true). */
  pauseOnHover?: boolean;
}

const DEFAULT_SEPARATOR = (
  <span className="mx-[0.5em] inline-block translate-y-[-0.05em] text-[0.55em] text-accent" aria-hidden="true">
    ✦
  </span>
);

/**
 * Infinite, seamless ticker. Velocity-reactive (reads `scrollState.velocity`), optionally follows scroll
 * direction, eases to a stop on hover. Static (first copy only) under prefers-reduced-motion.
 * Rendering happens in the GSAP ticker via refs — no React state per frame.
 */
export default function Marquee({
  items,
  speed = 60,
  direction = "left",
  className,
  separator = DEFAULT_SEPARATOR,
  itemClassName,
  followScroll = true,
  velocityFactor = 1,
  pauseOnHover = true,
}: MarqueeProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);
  const hoverRef = useRef(false);
  const [copies, setCopies] = useState(2);
  const reduced = usePrefersReducedMotion();

  // Keep enough copies to always overfill the viewport, whatever the item lengths.
  useEffect(() => {
    const root = rootRef.current;
    const group = groupRef.current;
    if (!root || !group) return;
    const ro = new ResizeObserver(() => {
      const gw = group.offsetWidth;
      if (gw <= 0) return;
      const needed = Math.max(2, Math.ceil(root.offsetWidth / gw) + 1);
      setCopies((c) => (c === needed ? c : needed));
    });
    ro.observe(root);
    ro.observe(group);
    return () => ro.disconnect();
  }, [items]);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const group = groupRef.current;
    if (!root || !track || !group) return;
    if (reduced) {
      track.style.transform = "";
      return;
    }

    const baseDir = direction === "left" ? -1 : 1;
    let x = 0;
    let factor = 1; // smoothed speed multiplier (velocity boost × hover pause)
    let scrollDir = 1;
    let visible = true;
    let groupWidth = group.offsetWidth;

    const ro = new ResizeObserver(() => {
      groupWidth = group.offsetWidth;
    });
    ro.observe(group);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    io.observe(root);

    const tick = (_time: number, deltaMs: number) => {
      if (!visible || groupWidth <= 0) return;
      const dt = Math.min(deltaMs, 64) / 1000;
      const v = Math.abs(scrollState.velocity);
      const boost = 1 + Math.min(v * 0.12 * velocityFactor, 6);
      const target = pauseOnHover && hoverRef.current ? 0 : boost;
      factor += (target - factor) * Math.min(1, dt * 6);
      if (followScroll && v > 0.5) scrollDir = scrollState.direction;
      x += baseDir * scrollDir * speed * factor * dt;
      // Wrap inside one group width → seamless loop.
      x = ((x % groupWidth) - groupWidth) % groupWidth;
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      io.disconnect();
    };
  }, [reduced, direction, speed, followScroll, velocityFactor, pauseOnHover]);

  const group = (index: number) => (
    <div
      key={index}
      ref={index === 0 ? groupRef : undefined}
      className="flex shrink-0 items-center"
    >
      {items.map((item, i) => (
        <Fragment key={`${index}-${i}`}>
          <span className={cn("whitespace-nowrap", itemClassName)}>{item}</span>
          {separator}
        </Fragment>
      ))}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={cn("relative flex overflow-hidden select-none", className)}
      onPointerEnter={() => {
        hoverRef.current = true;
      }}
      onPointerLeave={() => {
        hoverRef.current = false;
      }}
    >
      <span className="sr-only">{items.join(", ")}</span>
      <div ref={trackRef} aria-hidden="true" className="flex w-max shrink-0 will-change-transform">
        {Array.from({ length: copies }, (_, i) => group(i))}
      </div>
    </div>
  );
}
