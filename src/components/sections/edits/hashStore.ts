import { useSyncExternalStore } from "react";

/**
 * The URL hash (`/edits#<slug>`) is the single source of truth for which edit the viewer shows.
 * Opening / stepping / closing writes it with history.replaceState (no extra history entries);
 * manual hash edits and in-page `#slug` links arrive through `hashchange`.
 */

const listeners = new Set<() => void>();
let openedByGesture = false;

function emit(): void {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("hashchange", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("hashchange", listener);
  };
}

function readHash(): string {
  const raw = window.location.hash.slice(1);
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Current hash without "#", "" during SSR. */
export function useHashSlug(): string {
  return useSyncExternalStore(subscribe, readHash, () => "");
}

/** Set (or clear with `null`) the open edit. `gesture` = opened from a click / key press. */
export function setHashSlug(slug: string | null, gesture: boolean): void {
  if (typeof window === "undefined") return;
  openedByGesture = gesture;
  const { pathname, search } = window.location;
  const next = slug ? `${pathname}${search}#${encodeURIComponent(slug)}` : `${pathname}${search}`;
  window.history.replaceState(null, "", next);
  emit();
}

/** Whether the latest open came from a user gesture (so sound can start unmuted). */
export function wasOpenedByGesture(): boolean {
  return openedByGesture;
}
