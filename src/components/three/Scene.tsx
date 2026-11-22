"use client";

import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, type PerformanceMonitorApi } from "@react-three/drei";
import { installPointerListener } from "@/lib/pointer";
import { useIsTouch, usePrefersReducedMotion } from "@/lib/motion";
import SceneErrorBoundary from "./SceneErrorBoundary";
import {
  groupOf,
  resetDirector,
  sceneKeyFromPath,
  setDirectorRoute,
  stepDirector,
  type SceneGroup,
  type SceneKey,
} from "./director";
import { useIsSmallScreen, usePageVisible, useSceneCovered } from "./hooks";
import { BACKGROUND } from "./palette";
import EditsStudioScene from "./scenes/EditsStudioScene";
import HubScene from "./scenes/HubScene";
import TechGridScene from "./scenes/TechGridScene";
import type { Detail } from "./types";

/**
 * Post stack (postprocessing + @react-three/postprocessing) in its own chunk: only desktops that
 * actually enable fx download it — phones never parse it.
 */
const Effects = lazy(() => import("./Effects"));

interface PerfState {
  /** Upper bound of the device-pixel-ratio range. */
  dpr: number;
  /** Post-processing enabled (desktop only, dropped when the monitor reports a decline). */
  fx: boolean;
  /** Set once the monitor gives up (fallback) — quality stays low. */
  locked: boolean;
}

const BG_ARGS: [string] = [BACKGROUND.home];
const CAMERA = { position: [0, 0, 9] as [number, number, number], fov: 40, near: 0.1, far: 80 };
const GL = { antialias: false, alpha: false, stencil: false, powerPreference: "high-performance" as const };

/** Pushes the active route into the director and advances it before any scene updates. */
function SceneDirector({ sceneKey, reduced }: { sceneKey: SceneKey; reduced: boolean }) {
  const invalidate = useThree((s) => s.invalidate);

  // Layout effect: the route must be known before the first frame renders.
  useLayoutEffect(() => {
    setDirectorRoute(sceneKey, reduced);
    // Under reduced motion the loop is on-demand: render a few frames to settle the still.
    invalidate(3);
  }, [sceneKey, reduced, invalidate]);

  useFrame((state, delta) => {
    const aspect = state.size.width / Math.max(1, state.size.height);
    stepDirector(state.camera, state.scene, aspect, delta);
  }, -10);

  return null;
}

export interface SceneProps {
  /** Called when the WebGL context is lost or the canvas cannot be created — show the CSS fallback. */
  onFatal?: () => void;
}

/**
 * Route-aware scene director. Keeps every scene the visitor has seen mounted (so revisits are
 * instant), cross-fades between them through the shared `director` store — presence uniforms,
 * scale and a damped camera tween — and never hard-swaps. Quality adapts through drei's
 * PerformanceMonitor; post-processing only runs on desktop.
 */
export default function Scene({ onFatal }: SceneProps) {
  const pathname = usePathname();
  const sceneKey = sceneKeyFromPath(pathname);
  const activeGroup = groupOf(sceneKey);

  const reduced = usePrefersReducedMotion();
  const touch = useIsTouch();
  const small = useIsSmallScreen();
  const visible = usePageVisible();
  const covered = useSceneCovered();
  const desktop = !touch && !small;
  const detail: Detail = desktop ? "high" : "low";
  const maxDpr = desktop ? 1.75 : 1.5;

  // Scenes mount on first visit and then stay mounted (hidden at zero presence).
  const [mounted, setMounted] = useState<Record<SceneGroup, boolean>>(() => ({
    hub: activeGroup === "hub",
    tech: activeGroup === "tech",
    edits: activeGroup === "edits",
  }));
  if (!mounted[activeGroup]) setMounted({ ...mounted, [activeGroup]: true });

  const [perf, setPerf] = useState<PerfState>({ dpr: 1.75, fx: true, locked: false });
  const [ready, setReady] = useState(false);

  const fatal = useRef(onFatal);
  useEffect(() => {
    fatal.current = onFatal;
  }, [onFatal]);

  useEffect(() => installPointerListener(), []);
  useEffect(() => () => resetDirector(), []);

  const onCreated = useCallback((state: RootState) => {
    const canvas = state.gl.domElement;
    canvas.addEventListener(
      "webglcontextlost",
      (event) => {
        event.preventDefault();
        fatal.current?.();
      },
      { once: true },
    );
    setReady(true);
  }, []);

  const onPerfChange = useCallback(({ factor }: PerformanceMonitorApi) => {
    setPerf((p) => (p.locked ? p : { ...p, dpr: Math.round((1 + factor * 0.75) * 100) / 100 }));
  }, []);
  const onIncline = useCallback(() => {
    setPerf((p) => (p.locked || p.fx ? p : { ...p, fx: true }));
  }, []);
  const onDecline = useCallback(() => {
    setPerf((p) => (p.fx ? { ...p, fx: false } : p));
  }, []);
  const onFallback = useCallback(() => {
    setPerf({ dpr: 1, fx: false, locked: true });
  }, []);

  // Stop rendering while the tab is hidden or an opaque overlay (menu, viewer, modal) covers the canvas.
  const frameloop = reduced ? "demand" : visible && !covered ? "always" : "never";
  const dprHigh = Math.min(perf.dpr, maxDpr);
  const dprLow = Math.min(1, dprHigh);
  const fx = desktop && perf.fx;

  return (
    <div
      className="absolute inset-x-0 top-0 h-lvh w-full transition-opacity duration-[1400ms] ease-out"
      style={{ opacity: ready ? 1 : 0 }}
    >
      <Canvas
        dpr={[dprLow, dprHigh]}
        frameloop={frameloop}
        flat
        gl={GL}
        camera={CAMERA}
        onCreated={onCreated}
        fallback={null}
      >
        <color attach="background" args={BG_ARGS} />
        <SceneDirector sceneKey={sceneKey} reduced={reduced} />
        <PerformanceMonitor
          factor={1}
          flipflops={3}
          onChange={onPerfChange}
          onIncline={onIncline}
          onDecline={onDecline}
          onFallback={onFallback}
        />
        <AdaptiveDpr />

        <Suspense fallback={null}>
          {mounted.hub ? (
            <SceneErrorBoundary>
              <HubScene detail={detail} />
            </SceneErrorBoundary>
          ) : null}
          {mounted.tech ? (
            <SceneErrorBoundary>
              <TechGridScene detail={detail} />
            </SceneErrorBoundary>
          ) : null}
          {mounted.edits ? (
            <SceneErrorBoundary>
              <EditsStudioScene detail={detail} />
            </SceneErrorBoundary>
          ) : null}
        </Suspense>

        {fx ? (
          <Suspense fallback={null}>
            <Effects />
          </Suspense>
        ) : null}
      </Canvas>
    </div>
  );
}
