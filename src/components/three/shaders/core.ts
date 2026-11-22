import { OUTPUT_FRAGMENT, SIMPLEX_3D } from "./noise";

/**
 * Hub "core": noise-displaced icosphere with recomputed normals, fresnel rim, an indigo↔crimson
 * two-tone split whose axis follows the pointer, contour lines, a hot seam on the split and a
 * burning-edge dissolve (scroll + scene cross-fade).
 */
export const CORE_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uFreq;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vDir;
varying vec3 vObj;
varying float vField;

${SIMPLEX_3D}

float field(vec3 d) {
  float n = snoise(d * uFreq + vec3(0.0, uTime * 0.22, uTime * 0.14));
  float m = snoise(d * uFreq * 2.15 + vec3(uTime * 0.17, 0.0, -uTime * 0.11));
  return n * 0.72 + m * 0.28;
}

void main() {
  float r = length(position);
  vec3 d = position / r;
  vec3 helper = abs(d.y) < 0.98 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t = normalize(cross(d, helper));
  vec3 b = normalize(cross(d, t));

  const float e = 0.014;
  vec3 d1 = normalize(d + t * e);
  vec3 d2 = normalize(d + b * e);
  float f0 = field(d);
  vec3 p0 = d * (r + f0 * uAmp);
  vec3 p1 = d1 * (r + field(d1) * uAmp);
  vec3 p2 = d2 * (r + field(d2) * uAmp);
  vec3 n = normalize(cross(p1 - p0, p2 - p0));
  if (dot(n, d) < 0.0) n = -n;

  vec4 wp = modelMatrix * vec4(p0, 1.0);
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * n);
  vDir = normalize(mat3(modelMatrix) * d);
  vObj = p0;
  vField = f0;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const CORE_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uDissolve;
uniform float uGlow;
uniform float uContour;
uniform vec3 uAxis;
uniform vec3 uCool;
uniform vec3 uCool2;
uniform vec3 uWarm;
uniform vec3 uWarm2;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vDir;
varying vec3 vObj;
varying float vField;

${SIMPLEX_3D}

void main() {
  // Dissolve with a burning amber edge.
  float dn = snoise(vObj * 1.9 + vec3(0.0, uTime * 0.07, 0.0)) * 0.5 + 0.5;
  float cut = uDissolve * 1.25 - 0.12;
  if (dn < cut) discard;
  float burn = (1.0 - smoothstep(0.0, 0.075, dn - cut)) * step(0.001, uDissolve);

  vec3 N = normalize(vWorldNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorldPos);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.4);

  // Two-tone split (cool = tech, warm = edits) along the pointer-driven axis.
  float s = dot(vDir, uAxis) + vField * 0.28 + sin(uTime * 0.6 + vDir.y * 3.0) * 0.04;
  float k = smoothstep(-0.16, 0.16, s);
  vec3 cool = mix(uCool, uCool2, fres * 0.85);
  vec3 warm = mix(uWarm, uWarm2, fres * 0.7);
  vec3 tone = mix(cool, warm, k);

  vec3 L = normalize(vec3(-0.45, 0.75, 0.55));
  float diff = clamp(dot(N, L), 0.0, 1.0);
  float back = clamp(dot(N, -L), 0.0, 1.0);
  vec3 col = tone * (0.12 + 0.6 * diff);
  // Coloured bounce from the opposite identity — the two halves light each other.
  col += mix(uWarm, uCool, k) * back * 0.1;
  float spec = pow(clamp(dot(reflect(-L, N), V), 0.0, 1.0), 32.0);
  col += vec3(1.0) * spec * 0.3;

  // Topographic contour lines riding on the displacement field.
  float c = vField * 7.0 + uTime * 0.08;
  float fc = fract(c);
  float dist = min(fc, 1.0 - fc);
  float fw = max(fwidth(c), 1e-4);
  float contour = 1.0 - smoothstep(0.0, fw * 1.4, dist);
  col += tone * contour * uContour;

  // Hot seam where the identities meet.
  float seam = 1.0 - smoothstep(0.0, 0.085, abs(s));
  float flicker = 0.85 + 0.25 * sin(uTime * 2.2 + vDir.y * 9.0);
  col += mix(vec3(1.0, 0.86, 0.94), uWarm2, 0.25) * seam * flicker * uGlow * 0.9;

  col += tone * fres * 1.35 * uGlow;
  col += uWarm2 * burn * 3.2 + vec3(1.0, 0.9, 0.7) * burn * burn * 1.5;

  gl_FragColor = vec4(col, 1.0);
  ${OUTPUT_FRAGMENT}
}
`;

/** Wireframe shell around the core, tinted by the same split axis. */
export const SHELL_VERTEX = /* glsl */ `
varying vec3 vDir;
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vDir = normalize(mat3(modelMatrix) * normalize(position));
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const SHELL_FRAGMENT = /* glsl */ `
uniform vec3 uAxis;
uniform vec3 uCool;
uniform vec3 uWarm;
uniform float uOpacity;
varying vec3 vDir;
varying vec3 vWorldPos;
void main() {
  float k = smoothstep(-0.3, 0.3, dot(vDir, uAxis));
  vec3 col = mix(uCool, uWarm, k);
  vec3 V = normalize(cameraPosition - vWorldPos);
  float facing = abs(dot(vDir, V));
  float a = uOpacity * mix(1.0, 0.35, facing);
  gl_FragColor = vec4(col, a);
  ${OUTPUT_FRAGMENT}
}
`;

/** Camera-facing glow card behind the core (cheap aura that also works without bloom). */
export const HALO_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const HALO_FRAGMENT = /* glsl */ `
uniform vec3 uCool;
uniform vec3 uWarm;
uniform vec2 uAxis2;
uniform float uOpacity;
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float glow = exp(-r * r * 5.5) * 0.55 + exp(-r * r * 18.0) * 0.35;
  float ring = exp(-pow((r - 0.62 - sin(uTime * 0.5) * 0.02) * 22.0, 2.0)) * 0.12;
  float k = smoothstep(-0.55, 0.55, dot(p, uAxis2));
  vec3 col = mix(uCool, uWarm, k);
  float a = (glow + ring) * uOpacity;
  gl_FragColor = vec4(col, a);
  ${OUTPUT_FRAGMENT}
}
`;
