"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Play } from "lucide-react";
import type { VideoEdit } from "@/data/types";
import { cn } from "@/lib/cn";
import { formatTimecode, isTouchDevice, prefersReducedMotion } from "@/lib/motion";
import { aspectRatioValue, cardId, indexLabel, isVideoFailed, markVideoFailed, parseDuration, toneFor, videoFormat } from "./utils";

interface EditCardProps {
  edit: VideoEdit;
  /** Position in the full reel (stable numbering across filters). */
  index: number;
  total: number;
  onOpen: (slug: string) => void;
}

const HOVER_DELAY_MS = 250;

/** Film-sprocket strip (decorative). */
function Sprockets({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-x-0 z-10 h-3 bg-ink/70", className)}
      style={{
        backgroundImage: "linear-gradient(90deg, rgb(244 244 246 / 0.28) 0 7px, transparent 7px 15px)",
        backgroundSize: "15px 4px",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "4px center",
      }}
    />
  );
}

/** Muted hover preview: unloads its source on unmount so the download stops. */
function HoverPreview({ src, onReady, onFail }: { src: string; onReady: () => void; onFail: () => void }) {
  const attach = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return;
    video.muted = true;
    const p = video.play();
    if (p) p.catch(() => undefined);
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, []);

  return (
    <video
      ref={attach}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={onReady}
      onError={onFail}
      className="absolute inset-0 z-[1] size-full object-cover"
    />
  );
}

/**
 * One "frame" of the reel: thumbnail at the edit's aspect, mono metadata, sprocket strips.
 * Desktop hover (after 250 ms) swaps in a muted live preview; touch devices never load video here.
 */
export default function EditCard({ edit, index, total, onOpen }: EditCardProps) {
  const [previewing, setPreviewing] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(() => isVideoFailed(edit.videoUrl));
  const timer = useRef<number | null>(null);

  const tone = toneFor(edit.category);
  const ratio = aspectRatioValue(edit.aspect);
  const seconds = parseDuration(edit.duration);
  const format = videoFormat(edit.videoUrl);

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  const onEnter = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse" || isTouchDevice() || prefersReducedMotion()) return;
    // A clip that failed once this session is never requested again (survives remounts via the module set).
    if (previewFailed || isVideoFailed(edit.videoUrl)) return;
    clearTimer();
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setPreviewing(true);
    }, HOVER_DELAY_MS);
  };

  const onLeave = () => {
    clearTimer();
    setPreviewing(false);
    setPreviewReady(false);
  };

  // Unknown facts are left out (no "n/a" placeholders).
  const meta = [seconds !== null ? `DUR ${formatTimecode(seconds)}` : null, edit.aspect, format].filter(
    (v): v is string => Boolean(v),
  );

  return (
    <article id={cardId(edit.slug)} data-edit-card="" data-playhead="false" className="group/card relative">
      <button
        type="button"
        data-cursor="Play"
        onClick={() => onOpen(edit.slug)}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        aria-label={`Play ${edit.title} (${edit.category}${edit.duration ? `, ${edit.duration}` : ""})`}
        className="block w-full rounded-lg text-left after:absolute after:inset-0 after:z-[4] after:content-[''] focus-visible:outline-offset-4"
      >
        <span
          className={cn(
            "relative block overflow-hidden rounded-lg border bg-ink-2 transition-[border-color,box-shadow,transform] duration-500 ease-expo",
            "border-line group-hover/card:border-paper/25 group-data-[playhead=true]/card:shadow-[0_0_0_1px_var(--color-edit),0_20px_60px_-20px_rgb(255_46_77/0.55)]",
          )}
          style={{ aspectRatio: ratio }}
        >
          <Sprockets className="top-0" />
          <Sprockets className="bottom-0" />

          <Image
            src={edit.thumbnail}
            alt={`${edit.title} thumbnail`}
            fill
            sizes="(min-width: 1440px) 340px, (min-width: 1280px) 24vw, (min-width: 768px) 32vw, 50vw"
            className="object-cover transition-[transform,filter] duration-700 ease-expo group-hover/card:scale-[1.04] group-hover/card:saturate-[1.15]"
            style={{ objectPosition: edit.thumbnailPosition ?? "center" }}
          />

          {previewing && !previewFailed ? (
            <span className={cn("absolute inset-0 block transition-opacity duration-500", previewReady ? "opacity-100" : "opacity-0")}>
              <HoverPreview
                src={edit.videoUrl}
                onReady={() => setPreviewReady(true)}
                onFail={() => {
                  markVideoFailed(edit.videoUrl);
                  setPreviewFailed(true);
                  setPreviewing(false);
                }}
              />
            </span>
          ) : null}

          {/* Grade + vignette for legible overlays. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgb(7_7_10/0.55)_0%,transparent_22%,transparent_62%,rgb(7_7_10/0.85)_100%)]"
          />

          {/* HUD metadata */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-3 z-[3] flex items-start justify-between px-3 pt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/85 tabular-nums"
          >
            <span>{indexLabel(index, total)}</span>
            {edit.duration || previewReady ? (
              <span className={cn("flex items-center gap-1.5", previewReady && "text-edit")}>
                {previewReady ? <span className="size-1.5 rounded-full bg-edit motion-safe:animate-blink" /> : null}
                {edit.duration ?? "Live"}
              </span>
            ) : null}
          </span>

          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-3 z-[3] flex items-end justify-between gap-2 px-3 pb-1.5"
          >
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/90">
              <span className={cn("size-1.5 rounded-full", tone.bg)} />
              {edit.category}
            </span>
          </span>

          {/* Corner brackets + play glyph on hover / focus */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 group-focus-within/card:opacity-100"
          >
            <span className="absolute top-5 left-2 size-3 border-t border-l border-paper/70" />
            <span className="absolute top-5 right-2 size-3 border-t border-r border-paper/70" />
            <span className="absolute bottom-5 left-2 size-3 border-b border-l border-paper/70" />
            <span className="absolute right-2 bottom-5 size-3 border-r border-b border-paper/70" />
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-full bg-paper/90 text-ink transition-[opacity,scale] duration-300",
                previewReady ? "scale-75 opacity-0" : "scale-100",
              )}
            >
              <Play className="ml-0.5 size-4 fill-current" strokeWidth={0} />
            </span>
          </span>
        </span>
      </button>

      <div className="mt-3 flex items-start justify-between gap-3 px-0.5">
        <h3 className="font-display text-[15px] leading-snug font-semibold text-paper transition-colors group-hover/card:text-edit-2 md:text-lg">
          {edit.title}
        </h3>
      </div>
      {meta.length > 0 ? (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 px-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mute tabular-nums">
          {meta.map((m, i) => (
            <span key={m} className="flex items-center gap-2">
              {i > 0 ? (
                <span aria-hidden="true" className="text-paper/20">
                  /
                </span>
              ) : null}
              {m}
            </span>
          ))}
        </p>
      ) : null}
    </article>
  );
}
