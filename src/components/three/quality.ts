import { useSyncExternalStore } from "react";

/**
 * "Dimmed" = the hero has scrolled away and the content scrim covers most of the scene. While dimmed
 * the canvas renders cheaper (DPR 1, no post stack, ~60 fps cap) so the GPU has headroom for the
 * page compositor during scroll. Toggled with hysteresis by ContentScrim — never per frame.
 */
let dimmed = false;
const listeners = new Set<() => void>();

export function setSceneDimmed(next: boolean): void {
  if (next === dimmed) return;
  dimmed = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSceneDimmed(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => dimmed,
    () => false,
  );
}

/** Scrim progress (0..1) thresholds: dim above ON, restore below OFF. */
export const DIM_ON = 0.6;
export const DIM_OFF = 0.3;
