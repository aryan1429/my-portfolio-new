import { Color, PerspectiveCamera, Vector3, type Camera, type Scene as ThreeScene } from "three";
import { pointerState } from "@/lib/pointer";
import { scrollState } from "@/lib/scroll";
import { BACKGROUND } from "./palette";
import { clamp, damp, easeInOutCubic, lerp, smoothstep } from "./math";

/**
 * Scene director — a single mutable store shared by every 3D scene.
 *
 * The React tree only tells the director *which* route is active (`setDirectorRoute`); everything
 * that changes per frame (presence cross-fades, smoothed scroll / pointer, the camera tween) lives
 * here and is advanced once per frame by `stepDirector`, so no React state is touched inside the
 * render loop. Scenes read `director` from their own `useFrame` callbacks.
 */

export type SceneKey = "home" | "tech" | "edits" | "contact";
/** Scenes that own geometry. `home` and `contact` share the hub (contact = calm variant). */
export type SceneGroup = "hub" | "tech" | "edits";

export const SCENE_GROUPS: readonly SceneGroup[] = ["hub", "tech", "edits"];

export function sceneKeyFromPath(pathname: string | null | undefined): SceneKey {
  const first = (pathname ?? "/").split("/").filter(Boolean)[0] ?? "";
  if (first === "tech" || first === "edits" || first === "contact") return first;
  // Only "/" gets the scroll-dollied home hub. Unknown routes (404) are short pages, where the
  // home dolly would blow the core up behind the copy — they get the calm, static contact variant.
  return first === "" ? "home" : "contact";
}

export function groupOf(key: SceneKey): SceneGroup {
  if (key === "tech") return "tech";
  if (key === "edits") return "edits";
  return "hub";
}

export interface DirectorState {
  key: SceneKey;
  reduced: boolean;
  /** Scene clock in seconds (frozen under reduced motion). */
  time: number;
  /** 0..1 visibility of each scene group; cross-fades are driven from here. */
  presence: Record<SceneGroup, number>;
  /** 1 for the active group, 0 for the others. */
  target: Record<SceneGroup, number>;
  /** 0 = home hub, 1 = calm contact hub. */
  calm: number;
  /** Smoothed page scroll progress 0..1. */
  scroll: number;
  /** Smoothed scroll speed 0..1 — used for subtle energy boosts. */
  energy: number;
  /** Damped pointer, -1..1 on both axes, y up. */
  pointer: { x: number; y: number };
  /** Smoothed pointer speed 0..1. */
  pointerSpeed: number;
  /** 0 right after a route change → 1 once the camera tween has settled. */
  settle: number;
  initialised: boolean;
}

export const director: DirectorState = {
  key: "home",
  reduced: false,
  time: 0,
  presence: { hub: 0, tech: 0, edits: 0 },
  target: { hub: 1, tech: 0, edits: 0 },
  calm: 0,
  scroll: 0,
  energy: 0,
  pointer: { x: 0, y: 0 },
  pointerSpeed: 0,
  settle: 1,
  initialised: false,
};

/** Time used for the single still frame rendered under prefers-reduced-motion. */
const STILL_TIME = 7.25;

const bgColors: Record<SceneKey, Color> = {
  home: new Color(BACKGROUND.home),
  contact: new Color(BACKGROUND.contact),
  tech: new Color(BACKGROUND.tech),
  edits: new Color(BACKGROUND.edits),
};

const posTarget = new Vector3();
const lookTarget = new Vector3();
const lookCurrent = new Vector3();

export function setDirectorRoute(key: SceneKey, reduced: boolean): void {
  const changed = key !== director.key;
  director.key = key;
  director.reduced = reduced;
  const active = groupOf(key);
  for (const g of SCENE_GROUPS) director.target[g] = g === active ? 1 : 0;
  if (changed) director.settle = 0;
}

/** Forget transient state so a remounted canvas plays its entrance again. */
export function resetDirector(): void {
  director.initialised = false;
  for (const g of SCENE_GROUPS) director.presence[g] = 0;
  director.settle = 1;
}

/**
 * Camera pose per route. Writes into `pos` / `look`, returns the vertical FOV.
 * `s` is smoothed scroll progress, `fit` pushes the camera back on portrait screens.
 */
function computePose(key: SceneKey, s: number, fit: number, pos: Vector3, look: Vector3): number {
  const px = director.pointer.x;
  const py = director.pointer.y;
  switch (key) {
    case "tech": {
      const k = easeInOutCubic(s);
      pos.set(px * 0.7, lerp(2.75, 1.55, k) + py * 0.35, lerp(7.4, 2.6, k) * fit);
      look.set(px * 0.25, lerp(-1.05, -1.25, k), lerp(-1.6, -8.2, k));
      return 42;
    }
    case "edits": {
      const k = easeInOutCubic(s);
      pos.set(lerp(0.0, -0.95, k) + px * 0.55, lerp(0.45, 0.95, k) + py * 0.3, lerp(7.3, 6.4, k) * fit);
      look.set(lerp(0.25, 0.95, k), lerp(0.05, 0.25, k), lerp(-1.4, -3.2, k));
      return 40;
    }
    case "contact": {
      pos.set(px * 0.3, 0.12 + py * 0.18, 7.9 * fit);
      look.set(0, 0.06, 0);
      return 38;
    }
    case "home":
    default: {
      // Hero dolly happens over the first ~38% of the page; afterwards a slow lateral orbit.
      const h = easeInOutCubic(smoothstep(0, 0.38, s));
      const orbit = Math.sin(s * Math.PI) * 0.65;
      pos.set(orbit + px * 0.45, -0.32 * h + py * 0.28, lerp(6.4, 3.7, h) * fit);
      look.set(orbit * 0.4, -0.12 * h, 0);
      return 40;
    }
  }
}

/** Pushes the camera back on portrait screens so subjects keep a similar share of the width. */
function portraitFit(aspect: number): number {
  if (aspect >= 1) return 1;
  return Math.min(2.1, Math.pow(1 / Math.max(aspect, 0.3), 0.82));
}

/**
 * Advance the shared state by one frame and drive the camera.
 * Called from a single `useFrame` (negative priority, so it runs before every scene).
 */
export function stepDirector(camera: Camera, scene: ThreeScene, aspect: number, delta: number): void {
  const d = director;
  // Clamp: a tab coming back from `frameloop="never"` must not jump the simulation.
  const dt = d.reduced ? 1 : Math.min(Math.max(delta, 0), 1 / 20);

  // Inputs -------------------------------------------------------------------------------
  const rawProgress = Number.isFinite(scrollState.progress) ? clamp(scrollState.progress) : 0;
  const rawVelocity = Number.isFinite(scrollState.velocity) ? Math.abs(scrollState.velocity) : 0;

  if (d.reduced) {
    // One composed still: everything snaps to its resting target.
    d.time = STILL_TIME;
    d.pointer.x = 0;
    d.pointer.y = 0;
    d.pointerSpeed = 0;
    d.energy = 0;
    d.scroll = 0;
    for (const g of SCENE_GROUPS) d.presence[g] = d.target[g];
    d.calm = d.key === "contact" ? 1 : 0;
    d.settle = 1;
  } else {
    d.time += dt;
    const prevX = d.pointer.x;
    const prevY = d.pointer.y;
    d.pointer.x = damp(d.pointer.x, clamp(pointerState.nx, -1, 1), 3.2, dt);
    d.pointer.y = damp(d.pointer.y, clamp(pointerState.ny, -1, 1), 3.2, dt);
    const speed = dt > 0 ? Math.hypot(d.pointer.x - prevX, d.pointer.y - prevY) / dt : 0;
    d.pointerSpeed = damp(d.pointerSpeed, clamp(speed * 0.6), 4, dt);
    d.scroll = damp(d.scroll, rawProgress, 7, dt);
    d.energy = damp(d.energy, clamp(rawVelocity / 40), 5, dt);
    for (const g of SCENE_GROUPS) {
      const target = d.target[g];
      // Outgoing scenes clear a little faster than the incoming one builds.
      const lambda = target > d.presence[g] ? 1.85 : 2.9;
      d.presence[g] = damp(d.presence[g], target, lambda, dt);
      if (Math.abs(d.presence[g] - target) < 0.0005) d.presence[g] = target;
    }
    d.calm = damp(d.calm, d.key === "contact" ? 1 : 0, 2.2, dt);
    d.settle = Math.min(1, d.settle + dt / 1.8);
  }

  // Camera ---------------------------------------------------------------------------------
  const fov = computePose(d.key, d.scroll, portraitFit(aspect), posTarget, lookTarget);
  if (!d.initialised || d.reduced) {
    camera.position.copy(posTarget);
    if (!d.reduced) camera.position.z += 3.2; // entrance: glide in from further back
    lookCurrent.copy(lookTarget);
    d.initialised = true;
  } else {
    // Slow, cinematic glide right after a route change; snappy follow once settled.
    const lambda = lerp(1.5, 5.5, easeInOutCubic(d.settle));
    camera.position.x = damp(camera.position.x, posTarget.x, lambda, dt);
    camera.position.y = damp(camera.position.y, posTarget.y, lambda, dt);
    camera.position.z = damp(camera.position.z, posTarget.z, lambda, dt);
    lookCurrent.x = damp(lookCurrent.x, lookTarget.x, lambda, dt);
    lookCurrent.y = damp(lookCurrent.y, lookTarget.y, lambda, dt);
    lookCurrent.z = damp(lookCurrent.z, lookTarget.z, lambda, dt);
  }
  camera.lookAt(lookCurrent);

  if (camera instanceof PerspectiveCamera) {
    const nextFov = d.reduced ? fov : damp(camera.fov, fov, 2.5, dt);
    if (Math.abs(nextFov - camera.fov) > 1e-4) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }
  }

  // Background tint follows the route.
  if (scene.background instanceof Color) {
    const target = bgColors[d.key];
    if (d.reduced) scene.background.copy(target);
    else scene.background.lerp(target, 1 - Math.exp(-2.5 * dt));
  }
}

/**
 * Cross-fade scale for a scene group: the incoming scene grows into place while the outgoing one
 * pushes past the camera — reads as the camera flying from one space into the next.
 */
export function presenceScale(group: SceneGroup): number {
  const p = director.presence[group];
  if (director.target[group] === 0) return 1 + (1 - p) * 0.38;
  return 0.8 + 0.2 * (1 - Math.pow(1 - p, 3));
}
