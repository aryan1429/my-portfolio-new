/**
 * Small allocation-free math helpers shared by the scenes.
 * All damping is frame-rate independent (exponential decay with a `lambda` rate in 1/s).
 */

export const clamp = (v: number, min = 0, max = 1): number => (v < min ? min : v > max ? max : v);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Exponential damping toward `target`. Higher `lambda` = snappier. */
export const damp = (current: number, target: number, lambda: number, dt: number): number =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp(t), 3);

export const easeInOutCubic = (t: number): number => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** Positive modulo (wraps negatives into 0..m). */
export const wrap = (v: number, m = 1): number => ((v % m) + m) % m;

/**
 * Deterministic PRNG (mulberry32). Scenes build their layouts from a fixed seed so geometry is
 * stable across mounts and render passes (and stays pure for the React compiler).
 */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
