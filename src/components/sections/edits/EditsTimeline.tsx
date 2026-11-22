"use client";

import { useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { gsap } from "gsap";
import type { VideoEdit } from "@/data/types";
import { cn } from "@/lib/cn";
import { formatTimecode } from "@/lib/motion";
import { scrollTo } from "@/lib/scroll";
import { cardId, formatClock, parseDuration, slotSeconds, toneFor } from "./utils";

interface EditsTimelineProps {
  /** Full reel (segments stay mounted so filtering animates their width). */
  all: VideoEdit[];
  /** Slugs currently in the sequence (filtered bin). */
  visible: ReadonlySet<string>;
  /** The grid whose scroll range drives the playhead. */
  gridRef: RefObject<HTMLElement | null>;
  onSelect: (slug: string) => void;
}

const MAJOR_STEPS = [5, 10, 15, 30, 60, 120, 300, 600];

function rulerSteps(total: number): { major: number; minor: number } {
  const major = MAJOR_STEPS.find((s) => total / s <= 8) ?? MAJOR_STEPS[MAJOR_STEPS.length - 1];
  return { major, minor: major / 5 };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * NLE-style sequence: one clip per edit (width ∝ duration; unknown lengths get a hatched, estimated slot),
 * ruler + timecodes, and a playhead that follows page scroll through the grid. All per-frame work writes
 * to the DOM from the GSAP ticker — no React state while scrolling.
 */
export default function EditsTimeline({ all, visible, gridRef, onSelect }: EditsTimelineProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const tcRef = useRef<HTMLSpanElement | null>(null);
  const nowRef = useRef<HTMLSpanElement | null>(null);

  const sequence = useMemo(() => {
    const clips: { edit: VideoEdit; start: number; len: number; known: boolean }[] = [];
    let t = 0;
    for (const edit of all) {
      if (!visible.has(edit.slug)) continue;
      const len = slotSeconds(edit);
      clips.push({ edit, start: t, len, known: parseDuration(edit.duration) !== null });
      t += len;
    }
    return { clips, total: t };
  }, [all, visible]);

  const ruler = useMemo(() => {
    const T = Math.max(1, sequence.total);
    const { major, minor } = rulerSteps(T);
    const marks: { t: number; left: number }[] = [];
    for (let t = 0; t <= T + 0.001; t += major) marks.push({ t, left: (t / T) * 100 });
    return { marks, minorPct: (minor / T) * 100 };
  }, [sequence.total]);

  /* Playhead loop. Re-subscribes when the sequence changes (filter). */
  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const grid = gridRef.current;
    if (!root || !track || !grid) return;

    const T = Math.max(1, sequence.total);
    let gridTop = 0;
    let gridH = 1;
    let trackW = 0;
    let segEls: (HTMLElement | null)[] = [];
    let cardEls: (HTMLElement | null)[] = [];
    let lastY = -1;
    let lastVh = -1;
    let active = -2;
    let dirty = true;

    const measure = () => {
      const rect = grid.getBoundingClientRect();
      gridTop = rect.top + window.scrollY;
      gridH = Math.max(1, rect.height);
      trackW = track.offsetWidth;
      segEls = sequence.clips.map((c) => root.querySelector<HTMLElement>(`[data-seg="${c.edit.slug}"]`));
      cardEls = sequence.clips.map((c) => document.getElementById(cardId(c.edit.slug)));
      active = -2; // re-apply highlights (cards may have remounted)
      dirty = true;
    };

    const setActive = (next: number) => {
      if (next === active) return;
      for (let i = 0; i < segEls.length; i += 1) {
        const on = i === next ? "true" : "false";
        const seg = segEls[i];
        if (seg && seg.dataset.active !== on) seg.dataset.active = on;
        const card = cardEls[i];
        if (card && card.dataset.playhead !== on) card.dataset.playhead = on;
      }
      active = next;
      if (nowRef.current) {
        const clip = next >= 0 ? sequence.clips[next] : null;
        nowRef.current.textContent = clip ? `${String(all.indexOf(clip.edit) + 1).padStart(2, "0")} · ${clip.edit.title}` : "—";
      }
    };

    const tick = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (!dirty && y === lastY && vh === lastVh) return;
      dirty = false;
      lastY = y;
      lastVh = vh;
      const raw = (y + vh * 0.5 - gridTop) / gridH;
      const p = clamp01(raw);
      if (headRef.current) headRef.current.style.transform = `translate3d(${(p * trackW).toFixed(1)}px,0,0)`;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
      const seq = p * T;
      if (tcRef.current) tcRef.current.textContent = formatTimecode(seq);
      let next = -1;
      if (raw >= 0 && raw <= 1) {
        for (let i = sequence.clips.length - 1; i >= 0; i -= 1) {
          if (seq >= sequence.clips[i].start) {
            next = i;
            break;
          }
        }
      }
      setActive(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    ro.observe(track);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      for (const el of segEls) if (el) el.dataset.active = "false";
      for (const el of cardEls) if (el) el.dataset.playhead = "false";
    };
  }, [all, gridRef, sequence]);

  /* Ruler scrubbing: drag across the ruler to scrub the page through the grid. */
  const scrubTo = (clientX: number, immediate: boolean) => {
    const track = trackRef.current;
    const grid = gridRef.current;
    if (!track || !grid) return;
    const r = track.getBoundingClientRect();
    const p = clamp01((clientX - r.left) / Math.max(1, r.width));
    const g = grid.getBoundingClientRect();
    const top = g.top + window.scrollY;
    scrollTo(top + p * g.height - window.innerHeight * 0.5, { immediate });
  };

  const onRulerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubTo(e.clientX, false);
  };
  const onRulerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) scrubTo(e.clientX, true);
  };

  const clipCount = sequence.clips.length;

  return (
    <div ref={rootRef} className="overflow-hidden rounded-lg border border-line bg-ink/90 shadow-[0_24px_60px_-30px_rgb(0_0_0/0.9)]">
      {/* Header strip */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mute md:px-4">
        <span className="flex min-w-0 items-center gap-2">
          <span className="rounded-[3px] bg-edit px-1.5 py-0.5 font-semibold text-paper">V1</span>
          <span className="hidden sm:inline">Sequence</span>
          <span aria-hidden="true" className="hidden text-paper/20 sm:inline">
            /
          </span>
          <span ref={nowRef} aria-hidden="true" className="min-w-0 truncate text-paper/80">
            —
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="hidden md:inline">
            {String(clipCount).padStart(2, "0")} {clipCount === 1 ? "clip" : "clips"}
          </span>
          <span aria-hidden="true" className="flex items-center gap-1.5 text-paper tabular-nums">
            <span className="size-1.5 rounded-full bg-edit shadow-[0_0_8px_var(--color-edit)]" />
            <span ref={tcRef}>00:00:00:00</span>
          </span>
        </span>
      </div>

      <div ref={trackRef} className="relative mx-3 md:mx-4">
        {/* Ruler (pointer scrub; decorative for assistive tech — clips below are the controls). */}
        <div
          aria-hidden="true"
          onPointerDown={onRulerDown}
          onPointerMove={onRulerMove}
          data-cursor="Scrub"
          className="relative h-6 cursor-ew-resize touch-none select-none"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, rgb(255 255 255 / 0.16) 0 1px, transparent 1px ${ruler.minorPct}%)`,
            backgroundSize: "100% 5px",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "0 100%",
          }}
        >
          {ruler.marks.map((m) => (
            <span key={m.t} className="absolute bottom-0 h-full border-l border-paper/30" style={{ left: `${m.left}%` }}>
              <span
                className={cn(
                  "absolute top-1 font-mono text-[9px] tracking-[0.08em] text-mute tabular-nums",
                  m.left > 92 ? "right-1" : "left-1",
                )}
              >
                {formatClock(m.t)}
              </span>
            </span>
          ))}
        </div>

        {/* Clips */}
        <ol className="relative flex h-10 pb-2 md:h-12" aria-label="Sequence clips">
          {all.map((edit) => {
            const on = visible.has(edit.slug);
            const tone = toneFor(edit.category);
            const known = parseDuration(edit.duration) !== null;
            const n = String(all.indexOf(edit) + 1).padStart(2, "0");
            return (
              <li
                key={edit.slug}
                aria-hidden={on ? undefined : true}
                className={cn(
                  "@container min-w-0 transition-[flex-grow,opacity] duration-700 ease-expo",
                  on ? "opacity-100" : "pointer-events-none opacity-0",
                )}
                style={{ flexGrow: on ? slotSeconds(edit) : 0, flexBasis: 0, flexShrink: 1 }}
              >
                <button
                  type="button"
                  tabIndex={on ? 0 : -1}
                  data-seg={edit.slug}
                  data-active="false"
                  data-cursor="Open"
                  onClick={() => onSelect(edit.slug)}
                  title={`${n} · ${edit.title}${edit.duration ? ` (${edit.duration})` : ""}`}
                  aria-label={`Open ${n}, ${edit.title} — ${edit.category}${edit.duration ? `, ${edit.duration}` : ""}`}
                  className={cn(
                    "relative mx-px flex h-full w-[calc(100%-2px)] items-center gap-1.5 overflow-hidden rounded-[3px] border-l-2 px-1.5 text-left transition-[filter,box-shadow] duration-300",
                    tone.soft,
                    tone.border,
                    "hover:brightness-150 data-[active=true]:shadow-[inset_0_0_0_1px_rgb(244_244_246/0.6)] data-[active=true]:brightness-[1.8]",
                  )}
                >
                  {!known ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-40"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(135deg, rgb(244 244 246 / 0.18) 0 2px, transparent 2px 7px)",
                      }}
                    />
                  ) : null}
                  {/* Narrow slots: index only (< 3rem), then the title alone so a few characters fit, then both. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative hidden shrink-0 font-mono text-[9px] font-semibold tabular-nums @[1.6rem]:block @[3rem]:hidden @[7rem]:block",
                      tone.text,
                    )}
                  >
                    {n}
                  </span>
                  <span
                    aria-hidden="true"
                    className="relative hidden min-w-0 truncate text-[11px] leading-none text-paper/85 @[3rem]:block"
                  >
                    {edit.title}
                  </span>
                  {edit.duration ? (
                    <span
                      aria-hidden="true"
                      className="relative ml-auto hidden shrink-0 font-mono text-[9px] text-paper/50 tabular-nums @[10.5rem]:block"
                    >
                      {edit.duration}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>

        {/* Played region + playhead */}
        <div
          ref={fillRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-6 origin-left [transform:scaleX(0)] bg-linear-to-r from-edit/0 to-edit/20"
        />
        <div ref={headRef} aria-hidden="true" className="pointer-events-none absolute top-0 bottom-0 left-0 will-change-transform">
          <span className="absolute -top-px -left-[5px] h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-edit" />
          <span className="absolute top-0 bottom-0 left-0 w-px -translate-x-1/2 bg-edit shadow-[0_0_10px_var(--color-edit)]" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-mute md:px-4">
        <span className="flex items-center gap-3">
          {Array.from(new Set(all.map((e) => e.category))).map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={cn("size-1.5 rounded-full", toneFor(c).bg)} />
              {c}
            </span>
          ))}
        </span>
        {sequence.clips.some((c) => !c.known) ? (
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-3 rounded-[1px] border border-paper/30"
              style={{ backgroundImage: "repeating-linear-gradient(135deg, rgb(244 244 246 / 0.35) 0 1px, transparent 1px 3px)" }}
            />
            Est. length
          </span>
        ) : null}
      </div>
    </div>
  );
}
