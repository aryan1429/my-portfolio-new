import { useSyncExternalStore } from "react";

/** Cubic-bezier curves for Framer Motion / CSS. */
export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.76, 0, 0.24, 1],
} as const;

/** Matching GSAP ease names. */
export const gsapEase = {
  out: "expo.out",
  inOut: "power4.inOut",
} as const;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const TOUCH_QUERY = "(hover: none), (pointer: coarse)";

function subscribeQuery(query: string, onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(query);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function readQuery(query: string): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
}

const serverFalse = (): boolean => false;

const subscribeReduced = (cb: () => void) => subscribeQuery(REDUCED_QUERY, cb);
const readReduced = () => readQuery(REDUCED_QUERY);
const subscribeTouch = (cb: () => void) => subscribeQuery(TOUCH_QUERY, cb);
const readTouch = () => readQuery(TOUCH_QUERY);

/** `true` when the user asked the OS to reduce motion. Always `false` during SSR. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, readReduced, serverFalse);
}

/** `true` on touch / coarse-pointer devices (no hover). Always `false` during SSR. */
export function useIsTouch(): boolean {
  return useSyncExternalStore(subscribeTouch, readTouch, serverFalse);
}

/** Non-hook reads for imperative code (event handlers, effects, rAF). */
export function prefersReducedMotion(): boolean {
  return readReduced();
}

export function isTouchDevice(): boolean {
  return readTouch();
}

const pad2 = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

/** Format seconds as an SMPTE-style timecode `HH:MM:SS:FF`. */
export function formatTimecode(seconds: number, fps = 24): string {
  const rate = Math.max(1, Math.round(fps));
  const total = Math.max(0, Math.floor(seconds * rate));
  const frames = total % rate;
  const secs = Math.floor(total / rate) % 60;
  const mins = Math.floor(total / (rate * 60)) % 60;
  const hours = Math.floor(total / (rate * 3600)) % 100;
  return `${pad2(hours)}:${pad2(mins)}:${pad2(secs)}:${pad2(frames)}`;
}

/** Frame-rate independent lerp factor: `damp(0.15, dt)` behaves like 0.15 per 60 fps frame. */
export function damp(factor: number, dtSeconds: number): number {
  return 1 - Math.pow(1 - factor, dtSeconds * 60);
}
