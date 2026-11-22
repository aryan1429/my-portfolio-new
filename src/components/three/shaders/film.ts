import { HASH_2D, OUTPUT_FRAGMENT, SIMPLEX_3D } from "./noise";

/**
 * /edits motion studio: film-strip timeline ribbon + background sprocket strips, film frames
 * (cover-fitted thumbnails or a procedural "exposure" when no texture), light leaks and an
 * anamorphic streak.
 */

/** Ribbon wave — mirrored on the CPU by `ribbonWave()` in EditsStudioScene so frames ride it. */
const RIBBON_WAVE = /* glsl */ `
float ribbonWave(float u, float t) {
  return sin(u * 18.0 - t * 1.2) * 0.07 + sin(u * 7.0 + t * 0.5) * 0.05;
}
`;

export const STRIP_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uWaveAmp;
${RIBBON_WAVE}
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying float vFog;
void main() {
  vUv = uv;
  vec3 p = position + normal * ribbonWave(uv.x, uTime) * uWaveAmp;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorldPos = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 mv = viewMatrix * wp;
  vFog = smoothstep(9.0, 20.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

export const STRIP_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uOffset;
uniform float uLength;
uniform float uWidth;
uniform float uOpacity;
uniform float uReveal;
uniform float uPlayhead;
uniform float uPlayheadGain;
uniform vec3 uBase;
uniform vec3 uWarm;
uniform vec3 uAmber;
uniform vec3 uLightDir;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying float vFog;

float rectMask(vec2 q, vec2 halfSize, float soft) {
  vec2 d = abs(q) - halfSize;
  return 1.0 - smoothstep(0.0, soft, max(d.x, d.y));
}

void main() {
  if (vUv.x > uReveal) discard;
  float tip = smoothstep(uReveal, uReveal - 0.03, vUv.x);
  float ends = smoothstep(0.0, 0.04, vUv.x) * (1.0 - smoothstep(0.94, 1.0, vUv.x));

  float along = vUv.x * uLength + uOffset;
  float fromCenter = abs(vUv.y - 0.5) * uWidth;
  float edgeBand = uWidth * 0.5 - 0.11;
  float edgeZone = step(edgeBand, fromCenter);
  float inner = 1.0 - edgeZone;

  // Perforations.
  const float pitch = 0.19;
  vec2 q = vec2((fract(along / pitch) - 0.5) * pitch, fromCenter - (uWidth * 0.5 - 0.055));
  float hole = rectMask(q, vec2(0.045, 0.024), 0.008);
  float rim = rectMask(q, vec2(0.058, 0.034), 0.01) - hole;

  // Frames, separators and timeline ruler ticks.
  const float frameLen = 1.1;
  float fIdx = floor(along / frameLen);
  float fLocal = fract(along / frameLen);
  float sep = (1.0 - smoothstep(0.0, 0.014, min(fLocal, 1.0 - fLocal) * frameLen)) * inner;
  float tickBand = step(edgeBand - 0.035, fromCenter) * inner;
  float minorTick = step(fract(along / 0.11), 0.14);
  float ticks = tickBand * minorTick;
  float expo = 0.16 + 0.12 * (0.5 + 0.5 * sin(fIdx * 12.9898 + uTime * 1.3)) * (0.6 + 0.4 * sin(fIdx * 4.1 - uTime * 0.7));
  vec3 content = mix(uBase, uWarm, 0.25 + fLocal * 0.5) * expo;

  // Playhead glow (fixed in u; the strip slides beneath it).
  float ph = exp(-abs(vUv.x - uPlayhead) * uLength * 5.0) * uPlayheadGain;

  vec3 N = normalize(vNormalW);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorldPos);
  float fres = pow(1.0 - abs(dot(N, V)), 2.0);
  float key = pow(clamp(dot(N, uLightDir) * 0.5 + 0.5, 0.0, 1.0), 2.0);

  vec3 col = content * inner;
  col += uBase * edgeZone * (1.0 - hole) * 0.4;
  col += uAmber * rim * edgeZone * 1.3;
  col += uAmber * sep * 1.4 + uWarm * ticks * 0.5;
  col += mix(uWarm, uAmber, 0.5) * (fres * 0.55 + key * 0.3);
  col += vec3(1.0, 0.84, 0.62) * ph * 1.6;

  float a = inner * (0.3 + expo) + edgeZone * (1.0 - hole) * 0.62 + rim * edgeZone * 0.55 + sep * 0.8 + ticks * 0.3 + ph * 0.7;
  a = clamp(a, 0.0, 1.0) * uOpacity * tip * ends * (1.0 - vFog * 0.85);
  gl_FragColor = vec4(col, a);
  ${OUTPUT_FRAGMENT}
}
`;

export const FRAME_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormalW;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const FRAME_FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
uniform float uMapMix;
uniform vec2 uCoverScale;
uniform vec2 uCoverOffset;
uniform vec2 uSize;
uniform float uRadius;
uniform float uOpacity;
uniform float uFocus;
uniform float uTime;
uniform float uSeed;
uniform vec3 uWarm;
uniform vec3 uAmber;
uniform vec3 uDeep;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormalW;

${SIMPLEX_3D}
${HASH_2D}

float sdRoundRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 p = (vUv - 0.5) * uSize;
  float d = sdRoundRect(p, uSize * 0.5, uRadius);
  float aa = max(fwidth(d), 1e-4);
  float shape = 1.0 - smoothstep(-aa, aa, d);
  if (shape < 0.002) discard;

  // Procedural "exposure" — the untextured look and the backdrop while a thumbnail streams in.
  float n = snoise(vec3(p * 1.4, uTime * 0.12 + uSeed * 10.0)) * 0.5 + 0.5;
  float n2 = snoise(vec3(p * 3.1 + 7.0, uTime * 0.08 - uSeed * 4.0)) * 0.5 + 0.5;
  vec3 proc = mix(uDeep, uWarm * 0.55, smoothstep(0.25, 0.9, n));
  proc += uAmber * pow(n2, 4.0) * 0.6;
  float bars = step(0.5, fract((p.x + p.y * 0.4) * 3.0 - uTime * 0.15)) * 0.04;
  proc += vec3(bars);

  // Cover-fitted thumbnail (textures use flipY = false, so v is flipped here).
  vec2 st = (vUv - 0.5) * uCoverScale + 0.5 + uCoverOffset;
  vec3 tex = texture2D(uMap, vec2(st.x, 1.0 - st.y)).rgb;
  // Warm cinematic grade: lift shadows toward crimson, gentle contrast, amber highlights.
  float luma = dot(tex, vec3(0.2126, 0.7152, 0.0722));
  vec3 graded = mix(tex, tex * vec3(1.06, 0.96, 0.9), 0.7);
  graded = mix(graded, graded + uWarm * 0.05, 1.0 - smoothstep(0.0, 0.35, luma));
  graded = pow(graded, vec3(1.08));
  vec3 content = mix(proc, graded, uMapMix);

  // In-frame vignette, grain and a light-leak sweep across the glass.
  float vig = smoothstep(1.05, 0.25, length((vUv - 0.5) * vec2(1.1, 1.25)));
  content *= mix(0.55, 1.0, vig);
  content += (hash12(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * 0.035;
  float sweepPos = fract(uTime * 0.07 + uSeed) * 4.0 - 2.0;
  float leak = exp(-pow((p.x + p.y * 0.6) / max(uSize.x, 0.001) * 2.0 - sweepPos, 2.0) * 6.0);
  content += mix(uWarm, uAmber, 0.6) * leak * 0.22;

  // Border stroke + warm rim light (crimson on one side, amber on the other).
  float stroke = 1.0 - smoothstep(0.0, aa * 1.5, abs(d + 0.014) - 0.004);
  float rimSide = dot(normalize(p + 1e-4), normalize(vec2(-0.8, 0.6))) * 0.5 + 0.5;
  vec3 rimCol = mix(uAmber, uWarm, rimSide);
  float rim = exp(-abs(d) * 26.0);

  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vWorldPos);
  float fres = pow(1.0 - abs(dot(N, V)), 3.0);

  vec3 col = content;
  col += rimCol * stroke * (0.65 + uFocus * 1.4);
  col += rimCol * rim * (0.35 + uFocus * 0.6);
  col += uAmber * fres * 0.25;
  if (!gl_FrontFacing) col = uDeep * 0.6 + rimCol * stroke * 0.8;

  gl_FragColor = vec4(col, shape * uOpacity);
  ${OUTPUT_FRAGMENT}
}
`;

export const LEAK_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const LEAK_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform float uSeed;
uniform vec3 uA;
uniform vec3 uB;
varying vec2 vUv;
${SIMPLEX_3D}
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float n = snoise(vec3(p * vec2(1.1, 0.8) + vec2(uTime * 0.03, 0.0), uTime * 0.05 + uSeed)) * 0.5 + 0.5;
  float m = 0.5 + 0.5 * sin(p.x * 2.0 + uTime * 0.1 + uSeed) * cos(p.y * 1.5 - uTime * 0.07);
  float mask = 1.0 - smoothstep(0.25, 1.0, length(p));
  float a = pow(n, 2.4) * mask * uOpacity;
  gl_FragColor = vec4(mix(uA, uB, m), a);
  ${OUTPUT_FRAGMENT}
}
`;

export const STREAK_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColor;
varying vec2 vUv;
void main() {
  float y = vUv.y - 0.5;
  float x = vUv.x - 0.5;
  float line = exp(-abs(y) * 110.0) + exp(-abs(y) * 18.0) * 0.18;
  float span = 1.0 - smoothstep(0.05, 0.5, abs(x + sin(uTime * 0.2) * 0.05));
  float flicker = 0.82 + 0.18 * sin(uTime * 3.1) * sin(uTime * 1.7 + 1.3);
  float a = line * span * flicker * uOpacity;
  gl_FragColor = vec4(uColor, a);
  ${OUTPUT_FRAGMENT}
}
`;

/** CPU mirror of the GLSL ribbon wave. */
export function ribbonWave(u: number, t: number): number {
  return Math.sin(u * 18 - t * 1.2) * 0.07 + Math.sin(u * 7 + t * 0.5) * 0.05;
}
