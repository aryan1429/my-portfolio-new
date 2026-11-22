import { OUTPUT_FRAGMENT } from "./noise";

/**
 * /tech spatial grid. Nodes (instanced), edges (one LineSegments) and the floor share the same
 * GPU displacement so everything rides one travelling wave, one expanding scan ring and the
 * pointer "probe" in lock-step without CPU work.
 */
const GRID_FIELD = /* glsl */ `
uniform float uTime;
uniform float uScroll;
uniform vec3 uProbe;
uniform float uProbeStrength;
uniform float uReveal;
uniform vec2 uOrigin;

float gridWave(vec3 b) {
  float d = length(b.xz - uOrigin);
  float w = sin(d * 0.85 - uTime * 1.3 - uScroll * 16.0) * 0.15;
  w += sin(b.x * 0.55 + uTime * 0.6) * cos(b.z * 0.45 - uTime * 0.4) * 0.07;
  return w;
}

float gridScan(vec3 b) {
  float d = length(b.xz - uOrigin);
  float r = fract(uTime * 0.085 + uScroll * 0.65) * 19.0;
  return exp(-pow((d - r) * 1.35, 2.0)) * (1.0 - smoothstep(12.0, 19.0, r));
}

float gridProbe(vec3 b) {
  vec2 q = b.xz - uProbe.xz;
  return exp(-dot(q, q) * 0.5) * uProbeStrength;
}

float gridReveal(vec3 b) {
  float d = length(b.xz - uOrigin);
  return smoothstep(uReveal, uReveal - 2.5, d);
}

vec3 gridDisplace(vec3 b) {
  return vec3(b.x, b.y + gridWave(b) + gridProbe(b) * 0.55 + gridScan(b) * 0.14, b.z);
}
`;

export const NODE_VERTEX = /* glsl */ `
attribute float aSeed;
${GRID_FIELD}
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying float vScan;
varying float vProbe;
varying float vSeed;
varying float vFog;

void main() {
  vec3 base = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  float reveal = gridReveal(base);
  float scan = gridScan(base);
  float probe = gridProbe(base);
  vec3 offset = gridDisplace(base) - base;
  float grow = reveal * (1.0 + scan * 0.9 + probe * 0.9);
  vec4 ip = instanceMatrix * vec4(position * grow, 1.0);
  ip.xyz += offset;
  vec4 wp = modelMatrix * ip;
  vWorldPos = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vScan = scan;
  vProbe = probe;
  vSeed = aSeed;
  vec4 mv = viewMatrix * wp;
  vFog = smoothstep(7.0, 20.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const NODE_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uCool;
uniform vec3 uCyan;
uniform vec3 uBg;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying float vScan;
varying float vProbe;
varying float vSeed;
varying float vFog;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(vec3(0.3, 1.0, 0.45));
  float diff = clamp(dot(N, L), 0.0, 1.0);
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);
  float hub = step(0.93, vSeed);
  float blink = 0.6 + 0.4 * sin(uTime * (1.5 + vSeed * 2.0) + vSeed * 50.0);

  vec3 col = uCool * (0.22 + 0.7 * diff) + uCyan * fres * 0.8;
  col += uCyan * (vScan * 1.9 + vProbe * 1.5);
  col += mix(uCool, uCyan, 0.55) * hub * 1.4 * blink;
  col = mix(col, uBg, vFog);
  gl_FragColor = vec4(col, 1.0);
  ${OUTPUT_FRAGMENT}
}
`;

export const EDGE_VERTEX = /* glsl */ `
attribute float aT;
attribute float aSeed;
attribute float aKind;
${GRID_FIELD}
varying float vT;
varying float vSeed;
varying float vKind;
varying float vScan;
varying float vProbe;
varying float vReveal;
varying float vFog;

void main() {
  vec3 p = gridDisplace(position);
  vT = aT;
  vSeed = aSeed;
  vKind = aKind;
  vScan = gridScan(position);
  vProbe = gridProbe(position);
  vReveal = gridReveal(position);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vFog = smoothstep(6.0, 20.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const EDGE_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform float uFlow;
uniform vec3 uCool;
uniform vec3 uCyan;
uniform vec3 uHot;
varying float vT;
varying float vSeed;
varying float vKind;
varying float vScan;
varying float vProbe;
varying float vReveal;
varying float vFog;

void main() {
  float base = vKind > 1.5 ? 0.34 : (vKind > 0.5 ? 0.2 : 0.3);

  // Data pulses: a subset of edges carries a bright packet with a sharp head and soft tail.
  float carrier = step(0.58, fract(vSeed * 7.13)) + step(1.5, vKind);
  float speed = 0.3 + fract(vSeed * 3.7) * 0.7;
  float head = fract(uTime * speed * uFlow + vSeed * 9.0) * 1.3 - 0.15;
  float tt = mix(vT, 1.0 - vT, step(0.5, fract(vSeed * 5.3)));
  float dd = head - tt;
  float pulse = min(carrier, 1.0) * (dd >= 0.0 ? exp(-dd * 12.0) : exp(dd * 90.0));

  vec3 col = uCool * base + uCyan * (vScan * 0.9 + vProbe * 0.8) * 0.6 + uHot * pulse * 1.9;
  float a = (base + vScan * 0.35 + vProbe * 0.35 + pulse * 0.9) * vReveal * (1.0 - vFog) * uOpacity;
  gl_FragColor = vec4(col, a);
  ${OUTPUT_FRAGMENT}
}
`;

export const FLOOR_VERTEX = /* glsl */ `
varying vec2 vXZ;
varying float vFog;
void main() {
  vXZ = vec2(position.x, -position.y);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFog = smoothstep(6.0, 22.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const FLOOR_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uScroll;
uniform float uOpacity;
uniform float uReveal;
uniform float uCell;
uniform vec2 uOrigin;
uniform vec3 uCool;
uniform vec3 uCyan;
varying vec2 vXZ;
varying float vFog;

float gridLine(vec2 p, float cell) {
  vec2 q = p / cell;
  vec2 g = abs(fract(q - 0.5) - 0.5) / max(fwidth(q), vec2(1e-4));
  return 1.0 - min(min(g.x, g.y), 1.0);
}

void main() {
  float d = length(vXZ - uOrigin);
  float minor = gridLine(vXZ, uCell);
  float major = gridLine(vXZ, uCell * 5.0);
  float r = fract(uTime * 0.085 + uScroll * 0.65) * 19.0;
  float scan = exp(-pow((d - r) * 1.1, 2.0)) * (1.0 - smoothstep(12.0, 19.0, r));
  float reveal = smoothstep(uReveal, uReveal - 3.0, d);
  float fade = (1.0 - smoothstep(5.0, 16.0, d)) * (1.0 - vFog);
  vec3 col = uCool * (minor * 0.3 + major * 0.55) + uCyan * scan * (0.15 + minor + major);
  float a = (minor * 0.12 + major * 0.3 + scan * (0.06 + minor * 0.6)) * fade * reveal * uOpacity;
  gl_FragColor = vec4(col, a);
  ${OUTPUT_FRAGMENT}
}
`;

/** Wide horizon glow far behind the grid — cool key light. */
export const HORIZON_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const HORIZON_FRAGMENT = /* glsl */ `
uniform float uOpacity;
uniform float uTime;
uniform vec3 uCool;
uniform vec3 uCyan;
varying vec2 vUv;
void main() {
  vec2 p = vUv - vec2(0.5, 0.42);
  float band = exp(-p.y * p.y * 28.0) * (1.0 - smoothstep(0.0, 0.55, abs(p.x)));
  float core = exp(-dot(p * vec2(1.6, 6.0), p * vec2(1.6, 6.0)) * 6.0);
  float breathe = 0.85 + 0.15 * sin(uTime * 0.4);
  vec3 col = mix(uCool, uCyan, core * 0.6);
  float a = (band * 0.32 + core * 0.35) * breathe * uOpacity;
  gl_FragColor = vec4(col, a);
  ${OUTPUT_FRAGMENT}
}
`;
