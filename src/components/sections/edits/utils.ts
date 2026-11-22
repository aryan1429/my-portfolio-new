import { videoEdits } from "@/data/portfolio";
import type { VideoEdit } from "@/data/types";

/** Every category used by `videoEdits`, in order of first appearance. */
export const editCategories: string[] = videoEdits.reduce<string[]>((acc, edit) => {
  if (!acc.includes(edit.category)) acc.push(edit.category);
  return acc;
}, []);

export const ALL_FILTER = "All";

export interface CategoryTone {
  /** Text colour class. */
  text: string;
  /** Solid background class. */
  bg: string;
  /** Translucent background class (timeline clips). */
  soft: string;
  /** Border colour class. */
  border: string;
  /** Raw CSS colour (inline styles / gradients). */
  color: string;
}

/* Full class names (Tailwind scans for literal strings). Warm first: this is the edits side. */
const TONES: readonly CategoryTone[] = [
  { text: "text-edit", bg: "bg-edit", soft: "bg-edit/25", border: "border-edit/70", color: "var(--color-edit)" },
  { text: "text-edit-2", bg: "bg-edit-2", soft: "bg-edit-2/25", border: "border-edit-2/70", color: "var(--color-edit-2)" },
  { text: "text-tech-2", bg: "bg-tech-2", soft: "bg-tech-2/25", border: "border-tech-2/70", color: "var(--color-tech-2)" },
  { text: "text-tech", bg: "bg-tech", soft: "bg-tech/25", border: "border-tech/70", color: "var(--color-tech)" },
];

export function toneFor(category: string): CategoryTone {
  const i = editCategories.indexOf(category);
  return TONES[(i < 0 ? 0 : i) % TONES.length];
}

/** "00:29" / "1:02:03" → seconds. Returns null when the string is not a timecode. */
export function parseDuration(value: string | undefined): number | null {
  if (!value) return null;
  const parts = value.trim().split(":");
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

/** Seconds → "MM:SS" (or "H:MM:SS"). */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const knownDurations = videoEdits
  .map((e) => parseDuration(e.duration))
  .filter((d): d is number => d !== null);

/** Sum of the durations that are actually on file. */
export const timedRuntime = knownDurations.reduce((a, b) => a + b, 0);
export const timedCount = knownDurations.length;

/**
 * Layout-only slot length for clips whose duration is unknown (the mean of the known ones).
 * Never displayed as a duration — unknown clips are labelled "--:--".
 */
export const DEFAULT_SLOT = knownDurations.length ? timedRuntime / knownDurations.length : 30;

export function slotSeconds(edit: VideoEdit): number {
  return parseDuration(edit.duration) ?? DEFAULT_SLOT;
}

/** CSS aspect-ratio value for a card; unknown aspect falls back to a neutral 4:5 frame (not labelled). */
export function aspectRatioValue(aspect: VideoEdit["aspect"]): number {
  switch (aspect) {
    case "16:9":
      return 16 / 9;
    case "9:16":
      return 9 / 16;
    case "1:1":
      return 1;
    case "4:5":
      return 4 / 5;
    default:
      return 4 / 5;
  }
}

/** Container format from the file extension in the video URL ("MP4"), or null. */
export function videoFormat(url: string): string | null {
  const match = /\.([a-z0-9]{2,4})(?:[?#]|$)/i.exec(url);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Video sources that failed to load this session (dead host, 404, unsupported codec). Module-level so it
 * survives remounts: hover previews request a broken clip once, then stay on the still frame, and the
 * viewer shows its error state straight away.
 */
const failedVideos = new Set<string>();

export function markVideoFailed(url: string): void {
  failedVideos.add(url);
}

export function isVideoFailed(url: string): boolean {
  return failedVideos.has(url);
}

/** "03/13" */
export function indexLabel(i: number, total: number): string {
  const width = Math.max(2, String(total).length);
  return `${String(i + 1).padStart(width, "0")}/${String(total).padStart(width, "0")}`;
}

/** Stable DOM id of a grid card (the URL hash uses the bare slug). */
export function cardId(slug: string): string {
  return `edit-${slug}`;
}

export function filterEdits(filter: string): VideoEdit[] {
  return filter === ALL_FILTER ? videoEdits : videoEdits.filter((e) => e.category === filter);
}
