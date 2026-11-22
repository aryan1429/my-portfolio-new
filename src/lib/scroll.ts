import type Lenis from "lenis";

/**
 * Mutable scroll snapshot shared by DOM and WebGL code.
 * Written on every Lenis (or native, under reduced motion) scroll event by `SmoothScroll`;
 * read it inside rAF / useFrame loops — never put it in React state.
 */
export const scrollState = {
  /** Current scroll offset in px. */
  y: 0,
  /** 0..1 progress of the whole page. */
  progress: 0,
  /** Signed scroll velocity (px per frame, Lenis units). Decays to 0 when idle. */
  velocity: 0,
  /** Last non-zero scroll direction. */
  direction: 1 as 1 | -1,
};

let instance: Lenis | null = null;
const lockReasons = new Set<string>();

type ScrollTarget = number | string | HTMLElement;
/**
 * Smooth scroll requested while a lock is held (e.g. tapping the current page's link in the mobile menu).
 * Lenis' start() resets its animation, so the scroll would die the moment the lock is released —
 * it is replayed after the last lock goes instead.
 */
let pendingScroll: { target: ScrollTarget; options: ScrollToOptions } | null = null;

export function getLenis(): Lenis | null {
  return instance;
}

export function setLenis(l: Lenis | null): void {
  instance = l;
  if (l && lockReasons.size > 0) l.stop();
}

const lockListeners = new Set<() => void>();

/** Subscribe to lock changes (useSyncExternalStore-compatible). */
export function subscribeScrollLocks(listener: () => void): () => void {
  lockListeners.add(listener);
  return () => {
    lockListeners.delete(listener);
  };
}

/** Whether `reason` currently holds a lock ("menu", "edits-lightbox", "tech-project-modal", …). */
export function hasScrollLock(reason: string): boolean {
  return lockReasons.has(reason);
}

function applyLock(): void {
  for (const l of lockListeners) l();
  if (typeof document === "undefined") return;
  const locked = lockReasons.size > 0;
  const root = document.documentElement;
  if (locked) root.setAttribute("data-scroll-locked", "");
  else root.removeAttribute("data-scroll-locked");
  if (instance) {
    if (locked) {
      instance.stop();
    } else {
      instance.start();
      if (pendingScroll) {
        const { target, options } = pendingScroll;
        pendingScroll = null;
        scrollTo(target, options);
      }
    }
  }
}

/**
 * Stop page scrolling. Several owners (preloader, mobile menu, page transition) can lock at the
 * same time — scrolling resumes only when every reason has been released.
 */
export function lockScroll(reason: string): void {
  lockReasons.add(reason);
  applyLock();
}

export function unlockScroll(reason: string): void {
  if (!lockReasons.delete(reason)) return;
  applyLock();
}

export function isScrollLocked(): boolean {
  return lockReasons.size > 0;
}

export interface ScrollToOptions {
  /** Jump without animating. */
  immediate?: boolean;
  /** Offset in px added to the resolved target (e.g. -80 to clear the nav). */
  offset?: number;
  /** Animation duration in seconds (Lenis only). */
  duration?: number;
}

/** Scroll the page through Lenis when available, natively otherwise. */
export function scrollTo(target: ScrollTarget, options: ScrollToOptions = {}): void {
  const { immediate = false, offset = 0, duration } = options;
  if (instance) {
    if (immediate) {
      // A jump supersedes any deferred smooth scroll (e.g. the route-change reset under the page wipe).
      pendingScroll = null;
    } else if (lockReasons.size > 0) {
      pendingScroll = { target, options };
      return;
    }
    instance.scrollTo(target, { immediate, offset, duration, force: true });
    return;
  }
  if (typeof window === "undefined") return;
  let top: number;
  if (typeof target === "number") {
    top = target;
  } else {
    const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    if (!el) return;
    top = el.getBoundingClientRect().top + window.scrollY;
  }
  window.scrollTo({ top: top + offset, behavior: immediate ? "auto" : "smooth" });
}
