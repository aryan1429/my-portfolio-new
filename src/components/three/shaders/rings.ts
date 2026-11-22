import { OUTPUT_FRAGMENT } from "./noise";

/**
 * Orbit ring bands around the hub core.
 * Variant 0 — cool "data" ring: dashed ruler, major ticks and travelling data pulses.
 * Variant 1 — warm film-strip ring: perforations, frame bars, an exposure flicker and a light sweep.
 */
export const RING_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uWobble;
varying vec2 vUv;
varying float vDepth;
void main() {
  vUv = uv;
  vec3 p = position;
  float a = uv.x * 6.28318530718;
  p.z += sin(a * 3.0 + uTime * 0.8) * uWobble;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

export const RING_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform float uVariant;
uniform float uPulseSpeed;
uniform float uFocus;
uniform vec3 uColA;
uniform vec3 uColB;
varying vec2 vUv;
varying float vDepth;

float rectMask(vec2 q, vec2 halfSize, float soft) {
  vec2 d = abs(q) - halfSize;
  return 1.0 - smoothstep(0.0, soft, max(d.x, d.y));
}

float trail(float u, float head, float k) {
  float dd = fract(head - u);
  return exp(-dd * k);
}

void main() {
  float u = vUv.x;
  float v = vUv.y;
  // Back half of the orbit sits behind the core: dim it for depth.
  float depthFade = mix(0.3, 1.0, smoothstep(uFocus + 1.4, uFocus - 1.4, vDepth));
  vec3 col;
  float alpha;

  if (uVariant < 0.5) {
    float across = 1.0 - abs(v * 2.0 - 1.0);
    float dash = step(fract(u * 160.0), 0.5) * smoothstep(0.05, 0.45, across);
    float major = step(fract(u * 16.0), 0.01);
    float pulses = 0.0;
    pulses += trail(u, fract(uTime * uPulseSpeed), 34.0);
    pulses += trail(u, fract(uTime * uPulseSpeed * 0.8 + 0.37), 48.0) * 0.8;
    pulses += trail(u, fract(uTime * uPulseSpeed * 1.25 + 0.71), 26.0) * 0.6;
    pulses *= smoothstep(0.0, 0.55, across);
    col = uColA * (dash * 0.7 + major * 1.1) + uColB * pulses * 2.6;
    alpha = clamp(dash * 0.45 + major * 0.75 + pulses * 1.1, 0.0, 1.0);
  } else {
    float perfY = abs(v - 0.5);
    // Perforations along both edges.
    vec2 q = vec2((fract(u * 220.0) - 0.5), (perfY - 0.39) / 0.09 * 0.5);
    float hole = rectMask(q, vec2(0.22, 0.32), 0.06);
    float holeRim = rectMask(q, vec2(0.3, 0.42), 0.06) - hole;
    float edge = smoothstep(0.3, 0.32, perfY) * (1.0 - smoothstep(0.485, 0.5, perfY));
    // Frame area with separators and per-frame exposure flicker.
    float inner = 1.0 - smoothstep(0.27, 0.29, perfY);
    float frameIdx = floor(u * 44.0);
    float sep = step(fract(u * 44.0), 0.012) * inner;
    float exposure = 0.22 + 0.14 * sin(frameIdx * 7.31 + uTime * 1.6) * sin(frameIdx * 1.7 + uTime * 0.7);
    float sweep = trail(u, fract(uTime * uPulseSpeed), 10.0) + trail(u, fract(uTime * uPulseSpeed + 0.5), 16.0) * 0.6;

    float base = edge * (1.0 - hole) * 0.55 + inner * exposure;
    col = uColA * base + uColB * (holeRim * edge * 0.9 + sep * 1.6) + mix(uColB, vec3(1.0, 0.9, 0.8), 0.35) * sweep * inner * 1.4;
    alpha = clamp(base + holeRim * edge * 0.6 + sep + sweep * inner * 0.8, 0.0, 1.0);
  }

  float a = alpha * uOpacity * depthFade;
  gl_FragColor = vec4(col, a);
  ${OUTPUT_FRAGMENT}
}
`;
