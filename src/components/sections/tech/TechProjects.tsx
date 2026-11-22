"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { SectionHeading } from "@/components/motion";
import { techCategories, techProjects } from "@/data/portfolio";
import type { TechProject } from "@/data/types";
import { cn } from "@/lib/cn";
import { ease, usePrefersReducedMotion } from "@/lib/motion";
import { useIntroReady, useTransitionState } from "@/lib/transition";
import FilterBar, { type FilterOption } from "./FilterBar";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";
import { hashToId, setLocationHash, useLocationHash } from "./hash";
import { matchesFilter, pad2, type TechFilter } from "./utils";

const TOTAL = techProjects.length;
const POSITION = new Map(techProjects.map((p, i) => [p.slug, i + 1] as const));

const FILTER_OPTIONS: FilterOption[] = [
  { value: "All", count: TOTAL },
  ...techCategories.map((c) => ({ value: c, count: techProjects.filter((p) => p.categories.includes(c)).length })),
];

function neighbours(list: readonly TechProject[], slug: string): [TechProject | null, TechProject | null] {
  const i = list.findIndex((p) => p.slug === slug);
  if (i < 0 || list.length < 2) return [null, null];
  return [list[(i - 1 + list.length) % list.length] ?? null, list[(i + 1) % list.length] ?? null];
}

/**
 * Filterable project grid + detail dialog. The dialog is driven by `location.hash` (`/tech#<slug>`):
 * deep links and hashchange open it, opening writes the hash, closing clears it (replaceState).
 */
export default function TechProjects() {
  const reduced = usePrefersReducedMotion();
  const [filter, setFilter] = useState<TechFilter>("All");
  const visible = useMemo(() => techProjects.filter((p) => matchesFilter(p, filter)), [filter]);

  // Modal state lives in the URL hash.
  const hash = useLocationHash();
  const openId = hashToId(hash);
  const openProject = techProjects.find((p) => p.slug === openId) ?? null;
  const navList = openProject && visible.some((p) => p.slug === openProject.slug) ? visible : techProjects;
  const [prev, next] = openProject ? neighbours(navList, openProject.slug) : [null, null];

  const openerRef = useRef<HTMLElement | null>(null);
  const cardButtons = useRef(new Map<string, HTMLButtonElement>());

  const openProjectBySlug = useCallback(
    (slug: string, trigger?: HTMLElement) => {
      if (!openProject) openerRef.current = trigger ?? null;
      setLocationHash(slug);
    },
    [openProject],
  );

  const close = useCallback(() => {
    const lastSlug = openProject?.slug;
    const opener = openerRef.current;
    openerRef.current = null;
    setLocationHash(null);
    window.requestAnimationFrame(() => {
      const target = opener && opener.isConnected ? opener : lastSlug ? cardButtons.current.get(lastSlug) : undefined;
      target?.focus({ preventScroll: true });
    });
  }, [openProject]);

  const navigate = useCallback((slug: string) => setLocationHash(slug), []);

  // First reveal waits for the preloader / page wipe and for the grid to be in view.
  const gridRef = useRef<HTMLUListElement>(null);
  const inView = useInView(gridRef, { once: true, amount: 0.08 });
  const intro = useIntroReady();
  const { phase } = useTransitionState();
  const revealed = reduced || (inView && intro && (phase === "idle" || phase === "revealing"));

  const activeLabel = filter === "All" ? "all categories" : filter;

  return (
    <section aria-labelledby="tech-projects-title" className="container-x relative py-24 md:py-32">
      <SectionHeading
        id="tech-projects-title"
        index="01"
        eyebrow="Projects"
        title="Things I've built"
        side="tech"
      />

      <div className="mt-10 flex flex-col gap-5 md:mt-14 md:flex-row md:items-center md:justify-between">
        <FilterBar options={FILTER_OPTIONS} active={filter} onChange={setFilter} />
        <p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-mute tabular-nums" aria-hidden="true">
          Showing <span className="text-paper">{pad2(visible.length)}</span>/{pad2(TOTAL)}
        </p>
      </div>
      <p className="sr-only" aria-live="polite">
        {`Showing ${visible.length} of ${TOTAL} projects in ${activeLabel}.`}
      </p>

      <ul
        ref={gridRef}
        className="mt-8 grid grid-flow-dense grid-cols-1 gap-5 md:mt-10 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout" initial>
          {visible.map((project, i) => (
            <motion.li
              key={project.slug}
              layout={reduced ? false : "position"}
              className={cn("relative", project.featured && "md:col-span-2")}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 48, scale: 0.97, filter: "blur(10px)" }}
              animate={
                revealed
                  ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
                  : reduced
                    ? { opacity: 0 }
                    : { opacity: 0, y: 48, scale: 0.97, filter: "blur(10px)" }
              }
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, filter: "blur(8px)" }}
              transition={{
                duration: reduced ? 0.2 : 0.8,
                ease: ease.out,
                delay: reduced ? 0 : Math.min(i, 6) * 0.07,
                layout: { duration: 0.7, ease: ease.out },
              }}
            >
              <ProjectCard
                project={project}
                index={POSITION.get(project.slug) ?? i + 1}
                total={TOTAL}
                onOpen={openProjectBySlug}
                buttonRef={(el) => {
                  if (el) cardButtons.current.set(project.slug, el);
                  else cardButtons.current.delete(project.slug);
                }}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <ProjectModal
        project={openProject}
        index={openProject ? (POSITION.get(openProject.slug) ?? 1) : 1}
        total={TOTAL}
        prev={prev}
        next={next}
        onClose={close}
        onNavigate={navigate}
      />
    </section>
  );
}
