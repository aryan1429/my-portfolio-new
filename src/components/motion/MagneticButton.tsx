"use client";

import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { motion, useSpring } from "framer-motion";
import { cn } from "@/lib/cn";
import { useIsTouch, usePrefersReducedMotion } from "@/lib/motion";

interface MagneticOwnProps<C extends ElementType> {
  /** Element or component to render: "button" (default), "a", or e.g. `TransitionLink`. */
  as?: C;
  children: ReactNode;
  /** Class for the interactive element itself (the button / link). */
  className?: string;
  /** Class for the static outer wrapper (layout: width, alignment, margins). */
  wrapperClassName?: string;
  /** Class for the inner label span. */
  labelClassName?: string;
  /** Fraction of the pointer offset the element travels toward the pointer. Default 0.35. */
  strength?: number;
  /** Fraction of the element's travel the label moves the opposite way. Default 0.25. */
  labelCounter?: number;
}

export type MagneticButtonProps<C extends ElementType = "button"> = MagneticOwnProps<C> &
  Omit<ComponentPropsWithoutRef<C>, keyof MagneticOwnProps<C>>;

const SPRING = { stiffness: 220, damping: 18, mass: 0.6 };

/**
 * Spring-based magnetic pull toward the pointer; the inner label counter-moves for depth.
 * Polymorphic: `<MagneticButton as={TransitionLink} href="/tech">…</MagneticButton>` passes href/label through.
 * The outer wrapper carries `data-magnetic` (the global Cursor snaps to it) and is the stable hit area.
 */
export default function MagneticButton<C extends ElementType = "button">({
  as,
  children,
  className,
  wrapperClassName,
  labelClassName,
  strength = 0.35,
  labelCounter = 0.25,
  ...rest
}: MagneticButtonProps<C>) {
  const Comp: ElementType = as ?? "button";
  const reduced = usePrefersReducedMotion();
  const touch = useIsTouch();
  const enabled = !reduced && !touch;

  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);
  const lx = useSpring(0, SPRING);
  const ly = useSpring(0, SPRING);

  const onMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (!enabled || e.pointerType !== "mouse") return;
    // The outer wrapper never moves, so its rect is the stable reference (also correct mid-scroll).
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
    lx.set(-dx * strength * labelCounter);
    ly.set(-dy * strength * labelCounter);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
    lx.set(0);
    ly.set(0);
  };

  const type = Comp === "button" && !("type" in rest) ? { type: "button" as const } : null;

  return (
    <span
      data-magnetic=""
      className={cn("relative inline-flex", wrapperClassName)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <motion.span className="inline-flex w-full will-change-transform" style={{ x, y }}>
        <Comp {...type} {...rest} className={className}>
          <motion.span
            className={cn("relative inline-flex items-center justify-center gap-[inherit]", labelClassName)}
            style={{ x: lx, y: ly }}
          >
            {children}
          </motion.span>
        </Comp>
      </motion.span>
    </span>
  );
}
