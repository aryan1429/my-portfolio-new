"use client";

import { useEffect, useRef, useState } from "react";
import { getImageProps } from "next/image";
import { motion, useIsPresent } from "framer-motion";
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Volume2, X } from "lucide-react";
import { HudFrame } from "@/components/motion";
import type { EditBreakdown, VideoEdit } from "@/data/types";
import { cn } from "@/lib/cn";
import { ease, formatTimecode, prefersReducedMotion, usePrefersReducedMotion } from "@/lib/motion";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import { useTransitionState } from "@/lib/transition";
import { wasOpenedByGesture } from "./hashStore";
import {
  aspectRatioValue,
  formatClock,
  indexLabel,
  isVideoFailed,
  markVideoFailed,
  parseDuration,
  toneFor,
  videoFormat,
} from "./utils";

interface EditLightboxProps {
  edit: VideoEdit;
  /** Position in the full reel. */
  index: number;
  total: number;
  prev: VideoEdit | null;
  next: VideoEdit | null;
  onStep: (slug: string) => void;
  onClose: () => void;
  /** Called once the dialog has unmounted (focus return). */
  onAfterClose: () => void;
}

const BREAKDOWN_ROWS: ReadonlyArray<readonly [keyof EditBreakdown, string]> = [
  ["pacing", "Pacing"],
  ["transitions", "Transitions"],
  ["motion", "Motion graphics"],
  ["color", "Color"],
  ["sound", "Sound"],
];

const FOCUSABLE =
  'a[href], button:not([disabled]), video[controls], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface MediaInfo {
  slug: string;
  width: number;
  height: number;
  duration: number;
}

function posterFor(src: string): string {
  const { props } = getImageProps({ src, alt: "", width: 960, height: 960 });
  return props.src;
}

/**
 * Viewer: native <video controls> letterboxed by the edit's aspect, breakdown/specs side panel,
 * prev/next, Esc, focus trap, scroll lock. Only facts present in the data (or read from the file's
 * own metadata once it loads) are shown.
 */
export default function EditLightbox({ edit, index, total, prev, next, onStep, onClose, onAfterClose }: EditLightboxProps) {
  const reduced = usePrefersReducedMotion();
  const isPresent = useIsPresent();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const afterCloseRef = useRef(onAfterClose);
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [failedSlug, setFailedSlug] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const tone = toneFor(edit.category);
  const info = media && media.slug === edit.slug ? media : null;
  const failed = failedSlug === edit.slug || isVideoFailed(edit.videoUrl);
  // Opened from a hash deep link during a page wipe: wait for the reveal before playing.
  const { phase } = useTransitionState();
  const wipeCovering = phase === "covering" || phase === "covered";
  const ratio = edit.aspect
    ? aspectRatioValue(edit.aspect)
    : info && info.width > 0 && info.height > 0
      ? info.width / info.height
      : 16 / 9;
  const format = videoFormat(edit.videoUrl);
  const durationSecs = parseDuration(edit.duration);
  const breakdownRows = BREAKDOWN_ROWS.filter(([key]) => Boolean(edit.breakdown?.[key]?.trim()));
  const tools = edit.tools?.filter(Boolean) ?? [];
  const titleId = "edit-viewer-title";

  useEffect(() => {
    afterCloseRef.current = onAfterClose;
  }, [onAfterClose]);

  /* Scroll lock, initial focus, focus return. */
  useEffect(() => {
    lockScroll("edits-lightbox");
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      unlockScroll("edits-lightbox");
      afterCloseRef.current();
    };
  }, []);

  /* Esc, arrows, focus trap (detached while the exit animation plays). */
  useEffect(() => {
    if (!isPresent) return;
    const onKey = (e: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      const target = e.target as HTMLElement | null;
      const typing = target?.closest("video, input, textarea, select, [contenteditable='true']");
      if (!typing && e.key === "ArrowLeft" && prev) {
        e.preventDefault();
        onStep(prev.slug);
        return;
      }
      if (!typing && e.key === "ArrowRight" && next) {
        e.preventDefault();
        onStep(next.slug);
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (!dialog.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isPresent, next, onClose, onStep, prev]);

  /* Autoplay: with sound after a click; muted when opened from a link/hash (browser autoplay policy). */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || wipeCovering) return;
    const gesture = wasOpenedByGesture();
    if (!gesture && prefersReducedMotion()) return;
    v.muted = !gesture;
    v.play()
      .catch(() => {
        if (v.muted) return undefined;
        v.muted = true;
        return v.play();
      })
      .catch(() => undefined);
  }, [edit.slug, wipeCovering]);

  const unmute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    if (v.volume === 0) v.volume = 1;
    v.play().catch(() => undefined);
  };

  const specs: { label: string; value: string }[] = [
    { label: "Category", value: edit.category },
    ...(edit.aspect ? [{ label: "Aspect", value: edit.aspect }] : []),
    ...(edit.duration ? [{ label: "Duration", value: edit.duration }] : []),
    ...(format ? [{ label: "Format", value: format }] : []),
    ...(info && info.width > 0 ? [{ label: "Resolution", value: `${info.width}×${info.height}` }] : []),
    ...(!edit.duration && info && Number.isFinite(info.duration) && info.duration > 0
      ? [{ label: "Runtime", value: formatClock(info.duration) }]
      : []),
  ];

  const fade = reduced ? { duration: 0.15 } : { duration: 0.45, ease: ease.out };

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-lenis-prevent=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fade}
      /* z-85: above the nav (z-50), below the page-transition wipe (z-90) so a deep link opens under the slate. */
      className="fixed inset-0 z-[85] flex flex-col overflow-y-auto bg-ink/95 lg:overflow-hidden"
    >
      {/* Top bar */}
      <div className="flex items-center gap-4 border-b border-line px-4 py-3 md:px-6">
        <span className="font-mono text-[11px] tracking-[0.16em] text-mute tabular-nums">{indexLabel(index, total)}</span>
        <span className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-paper/80 sm:flex">
          <span aria-hidden="true" className={cn("size-1.5 rounded-full", tone.bg)} />
          {edit.category}
        </span>
        <h2 id={titleId} className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-paper md:text-xl">
          {edit.title}
        </h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="flex items-center gap-2 rounded-full border border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/80 transition-colors hover:border-paper/40 hover:text-paper"
        >
          <span className="hidden sm:inline">Esc</span>
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-none flex-col lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Stage */}
        <div className="relative flex h-[62svh] shrink-0 items-center justify-center p-4 [container-type:size] md:p-8 lg:h-auto lg:min-h-0">
          <motion.div
            key={edit.slug}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, filter: "blur(14px)" }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={reduced ? { duration: 0.15 } : { duration: 0.6, ease: ease.out }}
            className="relative overflow-hidden rounded-md bg-black shadow-[0_40px_120px_-40px_rgb(255_46_77/0.45)]"
            style={{ aspectRatio: ratio, width: `min(100cqw, calc(100cqh * ${ratio.toFixed(5)}))` }}
          >
            {failed ? (
              <div role="alert" className="absolute inset-0 isolate flex flex-col items-center justify-center gap-4 p-6 text-center">
                {/* Keep the frame recognisable: the poster, dimmed, behind the message. */}
                {/* eslint-disable-next-line @next/next/no-img-element -- optimised URL from getImageProps */}
                <img
                  src={posterFor(edit.thumbnail)}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 size-full object-cover opacity-35 blur-[2px]"
                  style={{ objectPosition: edit.thumbnailPosition }}
                />
                <span aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-ink/80 via-ink/40 to-ink/60" />
                <AlertTriangle className="size-6 text-edit-2" aria-hidden="true" />
                <p className="max-w-xs text-sm text-paper/80">This clip isn&apos;t available right now.</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={edit.videoUrl}
                poster={posterFor(edit.thumbnail)}
                controls
                playsInline
                preload="metadata"
                aria-label={`${edit.title} video`}
                onError={() => {
                  markVideoFailed(edit.videoUrl);
                  setFailedSlug(edit.slug);
                }}
                onLoadStart={(e) => setMuted(e.currentTarget.muted)}
                onVolumeChange={(e) => setMuted(e.currentTarget.muted || e.currentTarget.volume === 0)}
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  setMedia({ slug: edit.slug, width: v.videoWidth, height: v.videoHeight, duration: v.duration });
                }}
                className="absolute inset-0 size-full bg-black object-contain"
              />
            )}
            {!failed && muted ? (
              <button
                type="button"
                onClick={unmute}
                className="absolute top-3 right-3 z-20 flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink shadow-lg"
              >
                <Volume2 className="size-3.5" aria-hidden="true" />
                Unmute
              </button>
            ) : null}
          </motion.div>
          <HudFrame
            rec
            recLabel="PLAY"
            resolution={info && info.width > 0 ? `${info.width}×${info.height}` : undefined}
            size={16}
            inset={8}
            className="hidden md:block"
          />
        </div>

        {/* Side panel */}
        <aside
          aria-label="Edit details"
          className="flex flex-col gap-8 border-t border-line px-4 py-6 md:px-6 lg:min-h-0 lg:overflow-y-auto lg:border-t-0 lg:border-l lg:py-8"
        >
          {breakdownRows.length > 0 ? (
            <section aria-labelledby="edit-breakdown-title">
              <h3 id="edit-breakdown-title" className="eyebrow mb-4 flex items-center gap-2">
                <span aria-hidden="true" className="h-px w-6 bg-edit" />
                Breakdown
              </h3>
              <dl className="flex flex-col">
                {breakdownRows.map(([key, label], i) => (
                  <div key={key} className="grid grid-cols-[2rem_1fr] gap-x-3 border-t border-line py-3">
                    <span aria-hidden="true" className="font-mono text-[10px] text-edit tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">{label}</dt>
                      <dd className="mt-1 text-sm leading-relaxed text-paper/85">{edit.breakdown?.[key]}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {edit.description ? <p className="text-sm leading-relaxed text-paper/80">{edit.description}</p> : null}

          {tools.length > 0 ? (
            <section aria-labelledby="edit-tools-title">
              <h3 id="edit-tools-title" className="eyebrow mb-3">
                Tools
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {tools.map((t) => (
                  <li key={t} className="rounded-[3px] border-l-2 border-edit/70 bg-paper/[0.05] px-2 py-1 text-xs text-paper/85">
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="edit-specs-title">
            <h3 id="edit-specs-title" className="eyebrow mb-3">
              Specs
            </h3>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
              {specs.map((s) => (
                <div key={s.label} className="bg-ink px-3 py-2.5">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-mute">{s.label}</dt>
                  <dd className="mt-1 font-mono text-xs text-paper tabular-nums">{s.value}</dd>
                </div>
              ))}
            </dl>
            {durationSecs !== null ? (
              <p aria-hidden="true" className="mt-3 font-mono text-[10px] tracking-[0.14em] text-mute tabular-nums">
                IN 00:00:00:00 → OUT {formatTimecode(durationSecs)}
              </p>
            ) : null}
          </section>

          {/* No link to a file that just failed to load. */}
          {!failed ? (
            <a
              href={edit.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex w-fit items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-mute transition-colors hover:text-paper"
            >
              Open source file <ArrowUpRight className="size-3" aria-hidden="true" />
            </a>
          ) : null}
        </aside>
      </div>

      {/* Prev / next */}
      <div className="sticky bottom-0 mt-auto grid grid-cols-2 border-t border-line bg-ink lg:static lg:bg-transparent">
        <button
          type="button"
          disabled={!prev}
          onClick={() => prev && onStep(prev.slug)}
          aria-label={prev ? `Previous: ${prev.title}` : "No previous edit"}
          className="group flex min-w-0 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-paper/[0.03] disabled:opacity-30 md:px-6"
        >
          <ArrowLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-mute">Prev</span>
            <span className="block truncate text-sm text-paper/85">{prev?.title ?? "—"}</span>
          </span>
        </button>
        <button
          type="button"
          disabled={!next}
          onClick={() => next && onStep(next.slug)}
          aria-label={next ? `Next: ${next.title}` : "No next edit"}
          className="group flex min-w-0 items-center justify-end gap-3 border-l border-line px-4 py-3 text-right transition-colors hover:bg-paper/[0.03] disabled:opacity-30 md:px-6"
        >
          <span className="min-w-0">
            <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-mute">Next</span>
            <span className="block truncate text-sm text-paper/85">{next?.title ?? "—"}</span>
          </span>
          <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}
