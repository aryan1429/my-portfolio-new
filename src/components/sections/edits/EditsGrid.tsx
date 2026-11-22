"use client";

import { useMemo, useSyncExternalStore, type Ref } from "react";
import { motion } from "framer-motion";
import type { VideoEdit } from "@/data/types";
import { cn } from "@/lib/cn";
import { ease, usePrefersReducedMotion } from "@/lib/motion";
import EditCard from "./EditCard";
import { aspectRatioValue } from "./utils";

/* Column count per breakpoint (mobile-first: 2 → 3 → 4). */
const COLUMN_QUERIES: ReadonlyArray<readonly [string, number]> = [
  ["(min-width: 1280px)", 4],
  ["(min-width: 768px)", 3],
];
const BASE_COLUMNS = 2;

function subscribeColumns(cb: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mqls = COLUMN_QUERIES.map(([q]) => window.matchMedia(q));
  for (const m of mqls) m.addEventListener("change", cb);
  return () => {
    for (const m of mqls) m.removeEventListener("change", cb);
  };
}

function readColumns(): number {
  if (typeof window === "undefined" || !window.matchMedia) return BASE_COLUMNS;
  for (const [q, n] of COLUMN_QUERIES) if (window.matchMedia(q).matches) return n;
  return BASE_COLUMNS;
}

function useColumns(): number {
  return useSyncExternalStore(subscribeColumns, readColumns, () => BASE_COLUMNS);
}

/** Caption block under each frame, in units of column width (title + meta). */
const CAPTION_UNITS = 0.32;

interface Placed {
  edit: VideoEdit;
  index: number;
}

/** Greedy masonry: each card drops into the currently shortest column (reading order stays ~row-major). */
function distribute(items: Placed[], columns: number): Placed[][] {
  const cols: Placed[][] = Array.from({ length: columns }, () => []);
  const heights = new Array<number>(columns).fill(0);
  for (const item of items) {
    let target = 0;
    for (let c = 1; c < columns; c += 1) if (heights[c] < heights[target] - 0.01) target = c;
    cols[target].push(item);
    heights[target] += 1 / aspectRatioValue(item.edit.aspect) + CAPTION_UNITS;
  }
  return cols;
}

interface EditsGridProps {
  items: VideoEdit[];
  /** Full reel, for stable "03/13" numbering. */
  all: VideoEdit[];
  /** Changes whenever the filter changes — cards re-enter with a depth/blur dissolve. */
  filterKey: string;
  onOpen: (slug: string) => void;
  ref?: Ref<HTMLDivElement>;
}

/** Masonry contact sheet of the (filtered) reel. */
export default function EditsGrid({ items, all, filterKey, onOpen, ref }: EditsGridProps) {
  const columns = useColumns();
  const reduced = usePrefersReducedMotion();

  const cols = useMemo(
    () => distribute(items.map((edit) => ({ edit, index: all.indexOf(edit) })), columns),
    [items, all, columns],
  );

  return (
    <div ref={ref} className="relative">
      <div key={`${filterKey}-${columns}`} className="flex items-start gap-3 sm:gap-5 lg:gap-6">
        {cols.map((col, c) => (
          <ul key={c} className={cn("flex min-w-0 flex-1 flex-col gap-8 sm:gap-10", c % 2 === 1 && "pt-10 md:pt-16")}>
            {col.map(({ edit, index }, row) => (
              <motion.li
                key={edit.slug}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.96, filter: "blur(12px)" }}
                whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: reduced ? 0.2 : 0.9, ease: ease.out, delay: reduced ? 0 : (c * 0.07 + row * 0.04) % 0.4 }}
              >
                <EditCard edit={edit} index={index} total={all.length} onOpen={onOpen} />
              </motion.li>
            ))}
          </ul>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="py-24 text-center font-mono text-xs uppercase tracking-[0.2em] text-mute">No clips in this bin.</p>
      ) : null}
    </div>
  );
}
