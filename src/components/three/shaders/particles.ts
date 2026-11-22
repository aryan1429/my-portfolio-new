import { OUTPUT_FRAGMENT } from "./noise";

/** Drifting depth particles (soft discs with a hot centre, twinkle, near/far fades). */
export const PARTICLE_VERTEX = /* glsl */ `
attribute float aSeed;
attribute float aSize;
attribute vec3 aColor;
uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform float uOpacity;
uniform float uEnergy;
uniform float uRise;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 p = position;
  float t = uTime;
  p.x += sin(t * 0.21 + aSeed * 31.0) * 0.32;
  p.y += cos(t * 0.17 + aSeed * 17.0) * 0.32 + uRise * (0.4 + aSeed);
  p.z += sin(t * 0.13 + aSeed * 11.0) * 0.32;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float depth = -mv.z;
  float size = uSize * aSize * uPixelRatio * (8.0 / max(depth, 0.25)) * (1.0 + uEnergy * 0.35);
  gl_PointSize = min(size, 56.0 * uPixelRatio);

  float twinkle = 0.55 + 0.45 * sin(t * (0.8 + aSeed * 2.4) + aSeed * 40.0);
  float far = 1.0 - smoothstep(11.0, 24.0, depth);
  float near = smoothstep(0.35, 1.8, depth);
  vAlpha = twinkle * far * near * uOpacity * (0.8 + uEnergy * 0.5);
  vColor = aColor;
  gl_Position = projectionMatrix * mv;
}
`;

export const PARTICLE_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float soft = 1.0 - smoothstep(0.0, 0.5, d);
  float core = 1.0 - smoothstep(0.0, 0.16, d);
  float a = (soft * soft * 0.6 + core * 0.75) * vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor * (1.0 + core * 0.9), a);
  ${OUTPUT_FRAGMENT}
}
`;
