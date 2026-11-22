"use client";

import { useSyncExternalStore } from "react";
import { hasScrollLock, subscribeScrollLocks } from "@/lib/scroll";

/* Page visibility ------------------------------------------------------------------------- */

function subscribeVisibility(cb: () => void): () => void {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}
const readVisible = (): boolean => document.visibilityState !== "hidden";
const serverVisible = (): boolean => true;

/** `false` while the tab is hidden — used to stop the render loop entirely. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(subscribeVisibility, readVisible, serverVisible);
}

/* Full-screen overlays ------------------------------------------------------------------ */

/**
 * Scroll-lock owners whose overlay hides the canvas completely (opaque menu, edits viewer, project
 * modal). The preloader and page wipe are left out on purpose: the scene warms up / compiles under them.
 */
const COVERING_LOCKS = ["menu", "edits-lightbox", "tech-project-modal"] as const;
const readCovered = (): boolean => COVERING_LOCKS.some(hasScrollLock);
const serverNotCovered = (): boolean => false;

/** `true` while a full-screen overlay hides the scene — rendering pauses until it closes. */
export function useSceneCovered(): boolean {
  return useSyncExternalStore(subscribeScrollLocks, readCovered, serverNotCovered);
}

/* Media queries --------------------------------------------------------------------------- */

const SMALL_QUERY = "(max-width: 767px)";

function subscribeSmall(cb: () => void): () => void {
  if (!window.matchMedia) return () => {};
  const mql = window.matchMedia(SMALL_QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}
const readSmall = (): boolean => (window.matchMedia ? window.matchMedia(SMALL_QUERY).matches : false);
const serverFalse = (): boolean => false;

/** `true` below the md breakpoint. */
export function useIsSmallScreen(): boolean {
  return useSyncExternalStore(subscribeSmall, readSmall, serverFalse);
}

/* WebGL capability ------------------------------------------------------------------------ */

export type WebGLSupport = "unknown" | "supported" | "unsupported";

let cachedSupport: WebGLSupport | null = null;

function detectWebGL(): WebGLSupport {
  if (cachedSupport) return cachedSupport;
  try {
    const canvas = document.createElement("canvas");
    // three r163+ requires WebGL 2.
    const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false });
    cachedSupport = gl ? "supported" : "unsupported";
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cachedSupport = "unsupported";
  }
  return cachedSupport;
}

const noopSubscribe = (): (() => void) => () => {};
const serverUnknown = (): WebGLSupport => "unknown";

/** WebGL 2 availability, probed once on the client ("unknown" during SSR / hydration). */
export function useWebGLSupport(): WebGLSupport {
  return useSyncExternalStore(noopSubscribe, detectWebGL, serverUnknown);
}
