"use client";

import { LayoutGroup, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion";
import { pad2, type TechFilter } from "./utils";

export interface FilterOption {
  value: TechFilter;
  count: number;
}

export interface FilterBarProps {
  options: readonly FilterOption[];
  active: TechFilter;
  onChange: (value: TechFilter) => void;
  className?: string;
}

/**
 * Mono pill toggle group ("All" + categories) with counts; the active pill is a shared-layout
 * indicator that glides between buttons. Native buttons + aria-pressed → fully keyboard accessible.
 */
export default function FilterBar({ options, active, onChange, className }: FilterBarProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <LayoutGroup id="tech-filter">
      <div
        role="group"
        aria-label="Filter projects by category"
        className={cn("no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1 md:mx-0 md:flex-wrap md:px-0", className)}
      >
        {options.map((o) => {
          const isActive = o.value === active;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(o.value)}
              className={cn(
                "relative isolate flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors duration-300",
                isActive
                  ? "border-transparent text-paper"
                  : "border-line bg-ink/85 text-paper/70 hover:border-tech/50 hover:text-paper",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="tech-filter-active"
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-full bg-linear-to-r from-tech to-[#4a8dff] shadow-[0_0_24px_-6px_var(--color-tech)]"
                  transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36, mass: 0.8 }}
                />
              ) : null}
              <span>{o.value}</span>
              <span className={cn("tabular-nums text-[10px]", isActive ? "text-paper/75" : "text-mute")}>
                <span className="sr-only">(</span>
                {pad2(o.count)}
                <span className="sr-only"> projects)</span>
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
