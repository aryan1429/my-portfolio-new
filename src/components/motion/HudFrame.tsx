"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import Timecode from "./Timecode";

export interface HudFrameProps {
  className?: string;
  /** Show the blinking REC indicator (top-left). */
  rec?: boolean;
  /** Text next to the REC dot. Default "REC". */
  recLabel?: string;
  /** Resolution label (top-right), e.g. "3840×2160". */
  resolution?: string;
  /** Frame rate (bottom-right), e.g. 24 → "24 FPS". Also drives the timecode frames. */
  fps?: number;
  /** Free label (bottom-left), e.g. a clip name or "CAM A". */
  label?: string;
  /** Show a running timecode (bottom-right, before fps). Pass a number to start from that second. */
  timecode?: boolean | number;
  /** Bracket arm length in px (default 18). */
  size?: number;
  /** Bracket inset from the edges in px (default 12). */
  inset?: number;
  /** Bracket / label colour. "paper" (default) or "accent". */
  tone?: "paper" | "accent";
  /** Extra overlay content (absolutely positioned by the caller). */
  children?: ReactNode;
}

const CORNERS = [
  "top-0 left-0 border-t border-l",
  "top-0 right-0 border-t border-r",
  "bottom-0 left-0 border-b border-l",
  "bottom-0 right-0 border-b border-r",
] as const;

/**
 * Camera-viewfinder overlay: four corner brackets + optional REC / resolution / fps / timecode labels.
 * Absolutely fills its nearest positioned ancestor; purely decorative (aria-hidden, pointer-events-none).
 */
export default function HudFrame({
  className,
  rec = false,
  recLabel = "REC",
  resolution,
  fps,
  label,
  timecode = false,
  size = 18,
  inset = 12,
  tone = "paper",
  children,
}: HudFrameProps) {
  const toneBorder = tone === "accent" ? "border-accent/80" : "border-paper/55";
  const toneText = tone === "accent" ? "text-accent" : "text-paper/75";
  const label10 = cn("font-mono text-[10px] leading-none tracking-[0.18em] uppercase tabular-nums", toneText);
  const showTimecode = timecode !== false;
  const hasBottomRight = showTimecode || fps !== undefined;

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 z-10 select-none", className)}>
      <div className="absolute" style={{ inset }}>
        {CORNERS.map((pos) => (
          <span key={pos} className={cn("absolute", pos, toneBorder)} style={{ width: size, height: size }} />
        ))}

        {rec || resolution ? (
          <div
            className="absolute inset-x-0 top-0 flex items-start justify-between"
            style={{ padding: `${Math.round(size * 0.55)}px ${Math.round(size * 0.75)}px` }}
          >
            {rec ? (
              <span className={cn("flex items-center gap-1.5", label10)}>
                <span className="size-1.5 rounded-full bg-edit shadow-[0_0_8px_var(--color-edit)] motion-safe:animate-pulse" />
                {recLabel}
              </span>
            ) : (
              <span />
            )}
            {resolution ? <span className={label10}>{resolution}</span> : null}
          </div>
        ) : null}

        {label || hasBottomRight ? (
          <div
            className="absolute inset-x-0 bottom-0 flex items-end justify-between"
            style={{ padding: `${Math.round(size * 0.55)}px ${Math.round(size * 0.75)}px` }}
          >
            {label ? <span className={label10}>{label}</span> : <span />}
            {hasBottomRight ? (
              <span className={cn("flex items-center gap-3", label10)}>
                {showTimecode ? (
                  <Timecode
                    fps={fps ?? 24}
                    startSeconds={typeof timecode === "number" ? timecode : 0}
                    className="tracking-[0.12em]"
                  />
                ) : null}
                {fps !== undefined ? <span>{fps} FPS</span> : null}
              </span>
            ) : null}
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
}
