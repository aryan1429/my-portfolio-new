"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HudFrame } from "@/components/motion";
import { cn } from "@/lib/cn";
import { ease, usePrefersReducedMotion } from "@/lib/motion";
import { pad2 } from "./utils";

export interface ProjectGalleryProps {
  images: readonly string[];
  title: string;
  /** Image shown first. */
  startIndex?: number;
}

const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 450;

/**
 * Modal gallery: contained screenshot over a blurred backdrop of itself, HUD frame + "IMG 02/04",
 * swipe (drag), ←/→ keys, arrow buttons and a thumbnail strip. Single images skip the controls.
 * Mount with `key={slug}` so the position resets per project.
 */
export default function ProjectGallery({ images, title, startIndex = 0 }: ProjectGalleryProps) {
  const reduced = usePrefersReducedMotion();
  const count = images.length;
  const many = count > 1;
  const [[index, direction], setPage] = useState<[number, number]>(() => [
    Math.min(Math.max(0, startIndex), Math.max(0, count - 1)),
    0,
  ]);

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setPage(([i]) => [(i + delta + count) % count, delta]);
    },
    [count],
  );

  const goTo = (target: number) => {
    setPage(([i]) => [target, target > i ? 1 : target < i ? -1 : 0]);
  };

  useEffect(() => {
    if (!many) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [many, go]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) go(1);
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) go(-1);
  };

  const src = images[index] ?? images[0];
  if (!src) return null;

  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`${title} screenshots`}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-line bg-ink sm:aspect-[16/9] lg:max-h-[58svh]"
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={src}
            custom={direction}
            className={cn("absolute inset-0", many && "cursor-grab touch-pan-y active:cursor-grabbing")}
            variants={{
              enter: (d: number) =>
                reduced ? { opacity: 0 } : { opacity: 0, x: `${d * 8}%`, scale: 1.02, filter: "blur(8px)" },
              center: { opacity: 1, x: "0%", scale: 1, filter: "blur(0px)" },
              exit: (d: number) =>
                reduced ? { opacity: 0 } : { opacity: 0, x: `${d * -8}%`, scale: 0.98, filter: "blur(8px)" },
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduced ? 0.2 : 0.55, ease: ease.out }}
            drag={many && !reduced ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.35}
            dragMomentum={false}
            onDragEnd={onDragEnd}
            data-cursor={many ? "Drag" : undefined}
          >
            <Image
              src={src}
              alt=""
              aria-hidden="true"
              fill
              sizes="15vw"
              draggable={false}
              className="pointer-events-none scale-110 object-cover opacity-35 blur-2xl"
            />
            <Image
              src={src}
              alt={`${title} — screenshot ${index + 1} of ${count}`}
              fill
              sizes="(min-width: 1280px) 1150px, (min-width: 768px) 90vw, 100vw"
              draggable={false}
              className="pointer-events-none select-none object-contain p-2 sm:p-4"
            />
          </motion.div>
        </AnimatePresence>

        <HudFrame size={14} inset={10} label={`IMG ${pad2(index + 1)}/${pad2(count)}`} />

        {many ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous screenshot"
              className="absolute left-3 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-ink/70 text-paper/85 transition-colors hover:border-tech-2/60 hover:text-tech-2"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next screenshot"
              className="absolute right-3 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-ink/70 text-paper/85 transition-colors hover:border-tech-2/60 hover:text-tech-2"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {`Screenshot ${index + 1} of ${count}`}
        </p>
      </div>

      {many ? (
        <div className="flex items-center gap-4">
          <ul className="no-scrollbar flex flex-1 gap-2 overflow-x-auto py-1" aria-label="Screenshots">
            {images.map((img, i) => {
              const active = i === index;
              return (
                <li key={img} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Show screenshot ${i + 1} of ${count}`}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "relative block h-12 w-20 overflow-hidden rounded-md border transition-[border-color,opacity] duration-300 sm:h-14 sm:w-24",
                      active ? "border-tech-2 opacity-100" : "border-line opacity-55 hover:opacity-90",
                    )}
                  >
                    <Image src={img} alt="" fill sizes="96px" className="object-cover object-top" />
                    {active ? (
                      <motion.span
                        layoutId="tech-gallery-thumb"
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-0.5 bg-tech-2"
                        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 }}
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-mute sm:block">
            ← → · Swipe
          </p>
        </div>
      ) : null}
    </div>
  );
}
