"use client";

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/motion";
import { videoEdits } from "@/data/portfolio";
import { scrollTo } from "@/lib/scroll";
import CategoryFilter from "./CategoryFilter";
import EditLightbox from "./EditLightbox";
import EditsGrid from "./EditsGrid";
import EditsTimeline from "./EditsTimeline";
import { setHashSlug, useHashSlug } from "./hashStore";
import { ALL_FILTER, cardId, filterEdits } from "./utils";

const noopSubscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

/** Px between the sticky nav + timeline and a card scrolled into place. */
const CARD_GAP = 24;

/** Negative scroll offset that clears the sticky timeline (its own `top` already includes the nav). */
function stickyOffset(el: HTMLElement | null): number {
  if (!el) return -CARD_GAP;
  const top = Number.parseFloat(getComputedStyle(el).top) || 0;
  return -(top + el.offsetHeight + CARD_GAP);
}

/**
 * The reel: section heading, category bins, sticky NLE timeline (playhead = scroll through the grid),
 * masonry grid of frames and the hash-addressable viewer (`/edits#<slug>`).
 */
export default function EditsStudio() {
  const [filter, setFilter] = useState(ALL_FILTER);
  const hash = useHashSlug();
  const isClient = useIsClient();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const lastShownRef = useRef<string | null>(null);

  const items = useMemo(() => filterEdits(filter), [filter]);
  const visible = useMemo(() => new Set(items.map((e) => e.slug)), [items]);

  const openEdit = hash ? (videoEdits.find((e) => e.slug === hash) ?? null) : null;
  // Step through the current bin; a hash pointing outside it steps through the whole reel.
  const navList = openEdit && !visible.has(openEdit.slug) ? videoEdits : items;
  const pos = openEdit ? navList.indexOf(openEdit) : -1;
  const wrap = navList.length > 1;
  const prev = pos >= 0 && wrap ? navList[(pos - 1 + navList.length) % navList.length] : null;
  const next = pos >= 0 && wrap ? navList[(pos + 1) % navList.length] : null;

  const open = useCallback((slug: string) => {
    lastShownRef.current = slug;
    setHashSlug(slug, true);
  }, []);

  const step = useCallback((slug: string) => {
    lastShownRef.current = slug;
    setHashSlug(slug, true);
  }, []);

  const close = useCallback(() => {
    const slug = lastShownRef.current ?? (hash || null);
    lastShownRef.current = slug;
    setHashSlug(null, true);
    // Land the page on the last clip watched (it may differ from the one that was opened).
    const card = slug ? document.getElementById(cardId(slug)) : null;
    if (card) {
      const r = card.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) scrollTo(card, { immediate: true, offset: stickyOffset(timelineRef.current) });
    }
  }, [hash]);

  const afterClose = useCallback(() => {
    const slug = lastShownRef.current;
    lastShownRef.current = null;
    const button = slug ? document.getElementById(cardId(slug))?.querySelector("button") : null;
    button?.focus({ preventScroll: true });
  }, []);

  const selectFromTimeline = useCallback(
    (slug: string) => {
      const card = document.getElementById(cardId(slug));
      if (card) scrollTo(card, { immediate: true, offset: stickyOffset(timelineRef.current) });
      open(slug);
    },
    [open],
  );

  return (
    <section aria-labelledby="edits-reel-title" className="relative pt-16 pb-24 md:pt-24 md:pb-36">
      <div className="container-x">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            id="edits-reel-title"
            index="01"
            eyebrow="The reel"
            title={"Every frame,\non the timeline."}
            side="edits"
            description="Scrub the sequence or pick a frame — each clip opens in the viewer. Hover a frame for a live preview."
          />
          <CategoryFilter value={filter} onChange={setFilter} className="self-start md:self-end" />
        </div>

        <div ref={timelineRef} className="sticky top-[calc(var(--nav-height)+0.5rem)] z-20 mt-10 md:mt-14">
          <EditsTimeline all={videoEdits} visible={visible} gridRef={gridRef} onSelect={selectFromTimeline} />
        </div>

        <div className="mt-10 md:mt-14">
          <EditsGrid ref={gridRef} items={items} all={videoEdits} filterKey={filter} onOpen={open} />
        </div>
      </div>

      {isClient
        ? createPortal(
            <AnimatePresence>
              {openEdit ? (
                <EditLightbox
                  key="edit-viewer"
                  edit={openEdit}
                  index={videoEdits.indexOf(openEdit)}
                  total={videoEdits.length}
                  prev={prev}
                  next={next}
                  onStep={step}
                  onClose={close}
                  onAfterClose={afterClose}
                />
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </section>
  );
}
