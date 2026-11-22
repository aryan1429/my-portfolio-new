"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, type Points } from "three";
import { director, type SceneGroup } from "./director";
import { createRandom, smoothstep } from "./math";
import { PARTICLE_FRAGMENT, PARTICLE_VERTEX } from "./shaders/particles";
import type { ShaderMat, UniformsOf } from "./types";

type ParticleUniforms = UniformsOf<{
  uTime: number;
  uPixelRatio: number;
  uSize: number;
  uOpacity: number;
  uEnergy: number;
  uRise: number;
}>;

export interface ParticleFieldProps {
  /** Scene group whose presence fades the field. */
  group: SceneGroup;
  count: number;
  /** Palette (hex). With `warmColors` this is the cool (left, -x) side. */
  colors: readonly string[];
  /** Optional warm palette for the +x side — the dual identity bleeding across the field. */
  warmColors?: readonly string[];
  shape?: "shell" | "box";
  /** Shell radii (shape = "shell"). */
  inner?: number;
  outer?: number;
  /** Box half-extents and centre (shape = "box"). */
  extent?: readonly [number, number, number];
  center?: readonly [number, number, number];
  size?: number;
  opacity?: number;
  /** Vertical drift (world units) applied across full page scroll. */
  rise?: number;
  seed?: number;
}

const DEFAULT_EXTENT = [10, 5, 10] as const;
const DEFAULT_CENTER = [0, 0, 0] as const;

/**
 * GPU-animated particle field: a single `Points` draw call, no per-frame CPU work beyond uniforms.
 * Pass module-level constants for the array props — they are memo dependencies.
 */
export default function ParticleField({
  group,
  count,
  colors,
  warmColors,
  shape = "shell",
  inner = 2.5,
  outer = 12,
  extent = DEFAULT_EXTENT,
  center = DEFAULT_CENTER,
  size = 1,
  opacity = 1,
  rise = 0,
  seed = 7,
}: ParticleFieldProps) {
  const points = useRef<Points>(null);
  const material = useRef<ShaderMat<ParticleUniforms>>(null);

  const attributes = useMemo(() => {
    const rand = createRandom(seed);
    const positions = new Float32Array(count * 3);
    const tint = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const coolPalette = colors.map((c) => new Color(c));
    const warmPalette = (warmColors ?? []).map((c) => new Color(c));
    const tmp = new Color();

    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      let z: number;
      if (shape === "box") {
        x = center[0] + (rand() * 2 - 1) * extent[0];
        y = center[1] + (rand() * 2 - 1) * extent[1];
        z = center[2] + (rand() * 2 - 1) * extent[2];
      } else {
        // Uniform direction, radius biased toward the inner shell for a denser halo.
        const u = rand() * 2 - 1;
        const phi = rand() * Math.PI * 2;
        const s = Math.sqrt(1 - u * u);
        const r = inner + Math.pow(rand(), 1.6) * (outer - inner);
        x = Math.cos(phi) * s * r;
        y = u * r * 0.7;
        z = Math.sin(phi) * s * r;
      }
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      let palette = coolPalette;
      if (warmPalette.length > 0 && rand() < smoothstep(-5, 5, x)) palette = warmPalette;
      const base = palette[Math.floor(rand() * palette.length) % Math.max(1, palette.length)];
      if (base) tmp.copy(base);
      else tmp.setRGB(1, 1, 1);
      tmp.multiplyScalar(0.55 + rand() * 0.75);
      tint[i * 3] = tmp.r;
      tint[i * 3 + 1] = tmp.g;
      tint[i * 3 + 2] = tmp.b;

      seeds[i] = rand();
      // Mostly fine dust with a few larger bokeh motes.
      sizes[i] = rand() < 0.06 ? 2.2 + rand() * 2.2 : 0.5 + rand() * 0.9;
    }
    return { positions, tint, seeds, sizes };
  }, [count, colors, warmColors, shape, inner, outer, extent, center, seed]);

  const uniforms = useMemo<ParticleUniforms>(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uSize: { value: size },
      uOpacity: { value: 0 },
      uEnergy: { value: 0 },
      uRise: { value: 0 },
    }),
    [size],
  );

  useFrame((state) => {
    const p = director.presence[group];
    const obj = points.current;
    const mat = material.current;
    if (!obj || !mat) return;
    obj.visible = p > 0.002;
    if (!obj.visible) return;
    const u = mat.uniforms;
    u.uTime.value = director.time;
    u.uPixelRatio.value = state.viewport.dpr;
    u.uOpacity.value = opacity * p;
    u.uEnergy.value = director.energy;
    u.uRise.value = director.scroll * rise;
  });

  return (
    <points ref={points} frustumCulled={false} renderOrder={2}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attributes.positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[attributes.tint, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[attributes.seeds, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[attributes.sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={PARTICLE_VERTEX}
        fragmentShader={PARTICLE_FRAGMENT}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
