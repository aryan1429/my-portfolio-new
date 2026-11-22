"use client";

import { type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/cn";
import { useIsTouch, usePrefersReducedMotion } from "@/lib/motion";

export interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees. */
  max?: number;
  /** Show the pointer-following glare highlight (default true). */
  glare?: boolean;
  /** Peak glare opacity 0..1 (default 0.22). */
  glareOpacity?: number;
  /** Slight scale while hovered (default 1.015). */
  hoverScale?: number;
}

const SPRING = { stiffness: 170, damping: 20, mass: 0.5 };

/**
 * Pointer-driven 3D tilt with a soft specular glare. Transform-only (no layout shift).
 * Falls back to a static card on touch devices and under reduced motion.
 * Put rounding/overflow on `className`; the glare inherits the border radius.
 */
export default function TiltCard({
  children,
  className,
  max = 8,
  glare = true,
  glareOpacity = 0.22,
  hoverScale = 1.015,
}: TiltCardProps) {
  const reduced = usePrefersReducedMotion();
  const touch = useIsTouch();
  const enabled = !reduced && !touch;

  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);
  const scale = useSpring(1, SPRING);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const gOpacity = useSpring(0, { stiffness: 120, damping: 22 });
  const glareBg = useMotionTemplate`radial-gradient(120% 120% at ${gx}% ${gy}%, rgb(255 255 255 / 0.9), rgb(255 255 255 / 0.15) 30%, transparent 60%)`;

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 2 * max);
    rotateX.set(-(py - 0.5) * 2 * max);
    gx.set(px * 100);
    gy.set(py * 100);
  };

  const onEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || e.pointerType !== "mouse") return;
    scale.set(hoverScale);
    gOpacity.set(glareOpacity);
  };

  const onLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
    gOpacity.set(0);
  };

  return (
    <motion.div
      className={cn("relative isolate [transform-style:preserve-3d]", className)}
      style={enabled ? { rotateX, rotateY, scale, transformPerspective: 1000 } : undefined}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
      {glare && enabled ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] mix-blend-soft-light"
          style={{ background: glareBg, opacity: gOpacity }}
        />
      ) : null}
    </motion.div>
  );
}
