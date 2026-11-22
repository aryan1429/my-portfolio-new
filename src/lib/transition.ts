import { useSyncExternalStore } from "react";
import { getRouteLabel } from "./site";

/**
 * Tiny external store driving the page-transition wipe.
 *
 *   idle ──startTransition()──▶ covering ──(panels closed)──▶ covered ──(new pathname rendered)──▶ revealing ──▶ idle
 *
 * `PageTransition` is the driver: it animates the panels, calls router.push while covered and
 * reveals once the new route has rendered.
 */

export type TransitionPhase = "idle" | "covering" | "covered" | "revealing";

export interface TransitionState {
  phase: TransitionPhase;
  /** Route label shown on the wipe ("Tech"). */
  label: string;
  /** Destination (path + search + hash) of the running transition, null when idle. */
  href: string | null;
  /** Increments for every transition started. */
  id: number;
}

const IDLE: TransitionState = { phase: "idle", label: "", href: null, id: 0 };

let state: TransitionState = IDLE;
let drivers = 0;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): TransitionState {
  return state;
}

function getServerSnapshot(): TransitionState {
  return IDLE;
}

export function useTransitionState(): TransitionState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function getTransitionState(): TransitionState {
  return state;
}

/**
 * Start a wipe transition to `href`. No-op while a transition is past the covering phase;
 * while still covering, the destination is retargeted to the latest request.
 * Falls back to a hard navigation if no `PageTransition` driver is mounted.
 */
export function startTransition(href: string, label?: string): void {
  if (typeof window === "undefined") return;
  if (drivers === 0) {
    window.location.assign(href);
    return;
  }
  const nextLabel = label ?? getRouteLabel(href);
  if (state.phase === "covering") {
    state = { ...state, href, label: nextLabel };
    emit();
    return;
  }
  if (state.phase !== "idle") return;
  state = { phase: "covering", label: nextLabel, href, id: state.id + 1 };
  emit();
}

/** Advance the state machine (driver only). Returning to idle clears the destination. */
export function setTransitionPhase(phase: TransitionPhase): void {
  if (state.phase === phase) return;
  state = phase === "idle" ? { ...IDLE, id: state.id } : { ...state, phase };
  emit();
}

/** Register a mounted transition driver. Returns the unregister function. */
export function registerTransitionDriver(): () => void {
  drivers += 1;
  let done = false;
  return () => {
    if (done) return;
    done = true;
    drivers -= 1;
    if (drivers === 0 && state.phase !== "idle") {
      state = { ...IDLE, id: state.id };
      emit();
    }
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Intro gate: flips to true when the preloader starts lifting (or immediately when skipped).  */
/* Hero sections can wait on it so their entrance plays in view instead of under the overlay. */
/* ------------------------------------------------------------------------------------------ */

let introReady = false;
const introListeners = new Set<() => void>();

function subscribeIntro(listener: () => void): () => void {
  introListeners.add(listener);
  return () => {
    introListeners.delete(listener);
  };
}

export function markIntroReady(): void {
  if (introReady) return;
  introReady = true;
  for (const l of introListeners) l();
}

export function isIntroReady(): boolean {
  return introReady;
}

/** `false` during SSR and while the first-visit preloader is still covering the page. */
export function useIntroReady(): boolean {
  return useSyncExternalStore(subscribeIntro, isIntroReady, () => false);
}
