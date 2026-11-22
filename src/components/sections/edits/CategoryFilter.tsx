"use client";

import { LayoutGroup, motion } from "framer-motion";
import { videoEdits } from "@/data/portfolio";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion";
import { ALL_FILTER, editCategories, toneFor } from "./utils";

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const options = [
  { id: ALL_FILTER, count: videoEdits.length },
  ...editCategories.map((c) => ({ id: c, count: videoEdits.filter((e) => e.category === c).length })),
];

/** Bin-style category switch with a sliding (shared-layout) indicator. */
export default function CategoryFilter({ value, onChange, className }: CategoryFilterProps) {
  const reduced = usePrefersReducedMotion();

  // Nothing to filter with a single category.
  if (editCategories.length < 2) return null;

  return (
    <LayoutGroup id="edits-filter">
      <div
        role="group"
        aria-label="Filter edits by category"
        className={cn("inline-flex flex-wrap items-center gap-1 rounded-full border border-line bg-ink/85 p-1", className)}
      >
        {options.map((opt) => {
          const active = opt.id === value;
          const tone = opt.id === ALL_FILTER ? null : toneFor(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors duration-300",
                active ? "text-ink" : "text-paper/70 hover:text-paper",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="edits-filter-pill"
                  aria-hidden="true"
                  className="absolute inset-0 -z-0 rounded-full bg-paper"
                  transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36, mass: 0.8 }}
                />
              ) : null}
              <span
                aria-hidden="true"
                className={cn(
                  "relative size-1.5 rounded-full",
                  tone ? tone.bg : "bg-linear-to-r from-edit to-edit-2",
                )}
              />
              <span className="relative">{opt.id}</span>
              <span className={cn("relative tabular-nums", active ? "text-ink/60" : "text-mute")}>
                {String(opt.count).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
