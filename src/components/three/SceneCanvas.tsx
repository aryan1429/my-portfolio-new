"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import SceneErrorBoundary from "./SceneErrorBoundary";
import { useWebGLSupport } from "./hooks";

// The whole WebGL stack (three, fiber, drei, postprocessing) stays out of the server bundle and
// out of the critical path: it is fetched and mounted only on the client.
const Scene = dynamic(() => import("./Scene"), { ssr: false, loading: () => null });

/** Static dual-identity backdrop used when WebGL 2 is unavailable or the context is lost. */
export function SceneFallback() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: [
          "radial-gradient(55% 45% at 28% 42%, rgb(91 108 255 / 0.22), transparent 70%)",
          "radial-gradient(50% 42% at 74% 58%, rgb(255 46 77 / 0.17), transparent 70%)",
          "radial-gradient(90% 60% at 50% 115%, rgb(255 176 32 / 0.07), transparent 65%)",
          "radial-gradient(70% 50% at 50% -10%, rgb(34 211 238 / 0.06), transparent 60%)",
          "var(--color-ink, #07070A)",
        ].join(", "),
      }}
    />
  );
}

/**
 * Ink scrim strength once the hero has scrolled away (0 = scene at full strength), per route side.
 * The hub core is the brightest subject and sits mid-screen, so home/contact dim the most.
 */
const SCRIM_MAX: Record<string, number> = { home: 0.7, contact: 0.7, tech: 0.55, edits: 0.6 };
const SCRIM_DEFAULT = 0.65;
/** Scroll range (in viewport heights) over which the scrim fades in. */
const SCRIM_START = 0.35;
const SCRIM_END = 1.05;

/**
 * Dims the WebGL layer behind body content: the hero keeps the scene at full strength, and once it
 * scrolls away an ink scrim fades in so copy, cards and form fields stay readable over the bright
 * core / grid / film frames. Written straight to the DOM on scroll (no React state per frame).
 */
function ContentScrim() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = -1;
    const update = () => {
      const vh = window.innerHeight || 1;
      const t = (window.scrollY / vh - SCRIM_START) / (SCRIM_END - SCRIM_START);
      const k = Math.min(1, Math.max(0, t));
      const max = SCRIM_MAX[document.documentElement.dataset.side ?? ""] ?? SCRIM_DEFAULT;
      const o = Math.round(k * k * (3 - 2 * k) * max * 1000) / 1000;
      if (o !== last) {
        last = o;
        el.style.opacity = String(o);
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return <div ref={ref} className="absolute inset-0 bg-ink" style={{ opacity: 0 }} />;
}

/**
 * Fixed, full-viewport WebGL layer behind the page (z-0, never intercepts pointer events).
 * Mount once in the root layout. Pointer input is read from the shared `pointerState` store.
 */
export default function SceneCanvas() {
  const support = useWebGLSupport();
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => setFailed(true), []);

  const showFallback = support === "unsupported" || failed;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {showFallback ? (
        <SceneFallback />
      ) : support === "supported" ? (
        <SceneErrorBoundary fallback={<SceneFallback />} onError={fail}>
          <Scene onFatal={fail} />
        </SceneErrorBoundary>
      ) : null}
      <ContentScrim />
    </div>
  );
}
