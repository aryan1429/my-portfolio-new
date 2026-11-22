"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Vector2,
  Vector3,
  type Group,
  type Mesh,
} from "three";
import ParticleField from "../ParticleField";
import { director, presenceScale } from "../director";
import { createBandGeometry } from "../geometry";
import { clamp, damp, easeOutCubic, lerp, smoothstep } from "../math";
import { PALETTE } from "../palette";
import {
  CORE_FRAGMENT,
  CORE_VERTEX,
  HALO_FRAGMENT,
  HALO_VERTEX,
  SHELL_FRAGMENT,
  SHELL_VERTEX,
} from "../shaders/core";
import { RING_FRAGMENT, RING_VERTEX } from "../shaders/rings";
import type { Detail, ShaderMat, UniformsOf } from "../types";

type CoreUniforms = UniformsOf<{
  uTime: number;
  uAmp: number;
  uFreq: number;
  uDissolve: number;
  uGlow: number;
  uContour: number;
  uAxis: Vector3;
  uCool: Color;
  uCool2: Color;
  uWarm: Color;
  uWarm2: Color;
}>;

type ShellUniforms = UniformsOf<{ uAxis: Vector3; uCool: Color; uWarm: Color; uOpacity: number }>;

type HaloUniforms = UniformsOf<{ uCool: Color; uWarm: Color; uAxis2: Vector2; uOpacity: number; uTime: number }>;

type RingUniforms = UniformsOf<{
  uTime: number;
  uWobble: number;
  uOpacity: number;
  uVariant: number;
  uPulseSpeed: number;
  uFocus: number;
  uColA: Color;
  uColB: Color;
}>;

const COOL_DUST = [PALETTE.tech, PALETTE.tech2, PALETTE.tech, PALETTE.paper] as const;
const WARM_DUST = [PALETTE.edit, PALETTE.edit2, PALETTE.edit, PALETTE.paper] as const;

const SAT_COOL = new Color(PALETTE.tech2).multiplyScalar(4);
const SAT_WARM = new Color(PALETTE.edit2).multiplyScalar(4);

const CORE_RADIUS = 1.05;
const COOL_RING = { radius: 1.78, width: 0.05 } as const;
const WARM_RING = { radius: 2.12, width: 0.19 } as const;

// Frame-loop scratch (one hub instance at a time; never allocated per frame).
const axis2 = new Vector2(1, 0);
const axis3 = new Vector3(1, 0, 0);
const split = { angle: 0, shift: 0 };

export interface HubSceneProps {
  detail: Detail;
}

/**
 * Home / contact hub: the dual-identity core (indigo tech ↔ crimson edits), a cool data ring and a
 * warm film ring in orbit, a wireframe shell, an aura card and a depth particle field.
 * Pointer tilts the rig and steers the colour split; scroll dollies the camera (director) while the
 * core shrinks and burns away. `director.calm` morphs it into the small, quiet contact variant.
 */
export default function HubScene({ detail }: HubSceneProps) {
  const root = useRef<Group>(null);
  const rig = useRef<Group>(null);
  const core = useRef<Mesh>(null);
  const shell = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const coolRing = useRef<Group>(null);
  const coolSpin = useRef<Group>(null);
  const warmRing = useRef<Group>(null);
  const warmSpin = useRef<Group>(null);
  const satCool = useRef<Mesh>(null);
  const satWarm = useRef<Mesh>(null);
  const coreMat = useRef<ShaderMat<CoreUniforms>>(null);
  const shellMat = useRef<ShaderMat<ShellUniforms>>(null);
  const haloMat = useRef<ShaderMat<HaloUniforms>>(null);
  const coolMat = useRef<ShaderMat<RingUniforms>>(null);
  const warmMat = useRef<ShaderMat<RingUniforms>>(null);
  const clock = useRef(0);

  const high = detail === "high";

  const coolBand = useMemo(() => createBandGeometry(COOL_RING.radius, COOL_RING.width, high ? 384 : 192), [high]);
  const warmBand = useMemo(() => createBandGeometry(WARM_RING.radius, WARM_RING.width, high ? 384 : 192), [high]);
  useEffect(() => () => coolBand.dispose(), [coolBand]);
  useEffect(() => () => warmBand.dispose(), [warmBand]);

  const coreUniforms = useMemo<CoreUniforms>(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.16 },
      uFreq: { value: 1.35 },
      uDissolve: { value: 1 },
      uGlow: { value: 1 },
      uContour: { value: 0.28 },
      uAxis: { value: new Vector3(1, 0, 0.3).normalize() },
      uCool: { value: new Color(PALETTE.tech) },
      uCool2: { value: new Color(PALETTE.tech2) },
      uWarm: { value: new Color(PALETTE.edit) },
      uWarm2: { value: new Color(PALETTE.edit2) },
    }),
    [],
  );

  const shellUniforms = useMemo<ShellUniforms>(
    () => ({
      uAxis: { value: new Vector3(1, 0, 0.3).normalize() },
      uCool: { value: new Color(PALETTE.tech) },
      uWarm: { value: new Color(PALETTE.edit) },
      uOpacity: { value: 0 },
    }),
    [],
  );

  const haloUniforms = useMemo<HaloUniforms>(
    () => ({
      uCool: { value: new Color(PALETTE.tech) },
      uWarm: { value: new Color(PALETTE.edit) },
      uAxis2: { value: new Vector2(1, 0) },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    }),
    [],
  );

  const coolUniforms = useMemo<RingUniforms>(
    () => ({
      uTime: { value: 0 },
      uWobble: { value: 0.04 },
      uOpacity: { value: 0 },
      uVariant: { value: 0 },
      uPulseSpeed: { value: 0.11 },
      uFocus: { value: 6 },
      uColA: { value: new Color(PALETTE.tech) },
      uColB: { value: new Color(PALETTE.tech2) },
    }),
    [],
  );

  const warmUniforms = useMemo<RingUniforms>(
    () => ({
      uTime: { value: 0 },
      uWobble: { value: 0.06 },
      uOpacity: { value: 0 },
      uVariant: { value: 1 },
      uPulseSpeed: { value: 0.05 },
      uFocus: { value: 6 },
      uColA: { value: new Color(PALETTE.edit) },
      uColB: { value: new Color(PALETTE.edit2) },
    }),
    [],
  );

  useFrame((state, delta) => {
    const g = root.current;
    if (!g) return;
    const p = director.presence.hub;
    g.visible = p > 0.002;
    if (!g.visible) return;

    const dt = Math.min(delta, 1 / 20);
    const calm = director.calm;
    const home = 1 - calm;
    const reduced = director.reduced;

    // Local clock so the calm variant can slow down without phase jumps.
    clock.current = reduced ? director.time : clock.current + dt * lerp(1, 0.45, calm);
    const t = clock.current;

    const s = director.scroll * home;
    const hero = smoothstep(0.02, 0.4, s);
    const enter = easeOutCubic(p);

    // Root: cross-fade scale + calm (contact) morph.
    g.scale.setScalar(presenceScale("hub") * lerp(1, 0.58, calm));
    g.position.y = lerp(0, 0.18, calm);

    // Pointer tilt.
    const r = rig.current;
    if (r) {
      const px = director.pointer.x;
      const py = director.pointer.y;
      const k = reduced ? 1 : 1 - Math.exp(-3 * dt);
      r.rotation.x = lerp(r.rotation.x, -py * 0.22 * lerp(1, 0.5, calm), k);
      r.rotation.y = lerp(r.rotation.y, px * 0.34 * lerp(1, 0.5, calm), k);
    }

    // The seam between the identities tracks the cursor: it slides horizontally to sit under the
    // pointer (cool to its left, warm to its right) and tilts with the pointer's height.
    const angleTarget = director.pointer.y * 0.55;
    const shiftTarget = -director.pointer.x * 1.05;
    split.angle = reduced ? angleTarget : damp(split.angle, angleTarget, 2.6, dt);
    split.shift = reduced ? shiftTarget : damp(split.shift, shiftTarget, 2.6, dt);
    axis2.set(Math.cos(split.angle), Math.sin(split.angle));
    axis3.set(axis2.x, axis2.y, split.shift).normalize();

    const c = core.current;
    if (c) {
      c.rotation.y = t * 0.07;
      c.rotation.x = Math.sin(t * 0.11) * 0.18;
      c.scale.setScalar(1 - hero * 0.32);
    }

    const cm = coreMat.current;
    if (cm) {
      const u = cm.uniforms;
      u.uTime.value = t;
      u.uAmp.value = lerp(0.17, 0.1, calm) + director.pointerSpeed * 0.1 + director.energy * 0.08;
      // Materialise on entry, burn away with scroll (leaving glowing fragments) and on exit.
      u.uDissolve.value = Math.max(1 - enter, smoothstep(0.08, 0.55, s) * 0.8);
      u.uGlow.value = 1 + director.energy * 0.35;
      u.uContour.value = 0.28 * lerp(1, 0.55, calm);
      u.uAxis.value.copy(axis3);
    }

    const sh = shell.current;
    if (sh) {
      sh.rotation.y = -t * 0.045;
      sh.rotation.z = t * 0.03;
      sh.scale.setScalar(1 + hero * 0.5);
    }
    const shm = shellMat.current;
    if (shm) {
      shm.uniforms.uOpacity.value = 0.09 * p * (1 - hero * 0.6) * lerp(1, 0.6, calm);
      shm.uniforms.uAxis.value.copy(axis3);
    }

    const h = halo.current;
    if (h) h.quaternion.copy(state.camera.quaternion);
    const hm = haloMat.current;
    if (hm) {
      hm.uniforms.uOpacity.value = 0.55 * p * (1 - hero * 0.55) * lerp(1, 0.7, calm);
      hm.uniforms.uTime.value = t;
      hm.uniforms.uAxis2.value.copy(axis2);
    }

    // Orbit rings — expand and thin out as the hero scrolls away.
    const focus = state.camera.position.length();
    const ringScale = 1 + hero * 0.55;
    const ringFade = p * (1 - hero * 0.45) * lerp(1, 0.75, calm);
    if (coolRing.current) coolRing.current.scale.setScalar(ringScale * lerp(0.9, 1, enter));
    if (warmRing.current) warmRing.current.scale.setScalar(ringScale * lerp(1.12, 1, enter));
    if (satCool.current) satCool.current.scale.setScalar(enter);
    if (satWarm.current) satWarm.current.scale.setScalar(enter);
    if (coolSpin.current) coolSpin.current.rotation.z = t * 0.16;
    if (warmSpin.current) warmSpin.current.rotation.z = -t * 0.09;
    const cr = coolMat.current;
    if (cr) {
      cr.uniforms.uTime.value = t;
      cr.uniforms.uOpacity.value = ringFade;
      cr.uniforms.uFocus.value = focus;
      cr.uniforms.uWobble.value = 0.04 + director.energy * 0.06;
    }
    const wr = warmMat.current;
    if (wr) {
      wr.uniforms.uTime.value = t;
      wr.uniforms.uOpacity.value = ringFade * 0.95;
      wr.uniforms.uFocus.value = focus;
      wr.uniforms.uWobble.value = 0.06 + director.energy * 0.08;
    }

    // Keep the whole hub slightly lifted while the page scrolls (core sits behind headings).
    if (r) r.position.y = clamp(hero * 0.15, 0, 0.15);
  });

  return (
    <group ref={root}>
      <mesh ref={halo} position={[0, 0, -0.6]} renderOrder={0}>
        <planeGeometry args={[7, 7]} />
        <shaderMaterial
          ref={haloMat}
          uniforms={haloUniforms}
          vertexShader={HALO_VERTEX}
          fragmentShader={HALO_FRAGMENT}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>

      <group ref={rig}>
        <mesh ref={core} renderOrder={1}>
          <icosahedronGeometry args={[CORE_RADIUS, high ? 32 : 16]} />
          <shaderMaterial
            ref={coreMat}
            uniforms={coreUniforms}
            vertexShader={CORE_VERTEX}
            fragmentShader={CORE_FRAGMENT}
            side={DoubleSide}
          />
        </mesh>

        <mesh ref={shell} renderOrder={2}>
          <icosahedronGeometry args={[1.6, 2]} />
          <shaderMaterial
            ref={shellMat}
            uniforms={shellUniforms}
            vertexShader={SHELL_VERTEX}
            fragmentShader={SHELL_FRAGMENT}
            wireframe
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>

        {/* Cool tech orbit */}
        <group ref={coolRing} rotation={[1.2, 0.2, 0.34]}>
          <group ref={coolSpin}>
            <mesh geometry={coolBand} renderOrder={3}>
              <shaderMaterial
                ref={coolMat}
                uniforms={coolUniforms}
                vertexShader={RING_VERTEX}
                fragmentShader={RING_FRAGMENT}
                transparent
                depthWrite={false}
                side={DoubleSide}
                blending={AdditiveBlending}
              />
            </mesh>
            <mesh ref={satCool} position={[COOL_RING.radius, 0, 0]}>
              <sphereGeometry args={[0.032, 16, 16]} />
              <meshBasicMaterial color={SAT_COOL} toneMapped={false} />
            </mesh>
          </group>
        </group>

        {/* Warm edits orbit (film strip) */}
        <group ref={warmRing} rotation={[1.02, -0.38, -0.52]}>
          <group ref={warmSpin}>
            <mesh geometry={warmBand} renderOrder={3}>
              <shaderMaterial
                ref={warmMat}
                uniforms={warmUniforms}
                vertexShader={RING_VERTEX}
                fragmentShader={RING_FRAGMENT}
                transparent
                depthWrite={false}
                side={DoubleSide}
                blending={AdditiveBlending}
              />
            </mesh>
            <mesh ref={satWarm} position={[-WARM_RING.radius, 0, 0]}>
              <sphereGeometry args={[0.036, 16, 16]} />
              <meshBasicMaterial color={SAT_WARM} toneMapped={false} />
            </mesh>
          </group>
        </group>
      </group>

      <ParticleField
        group="hub"
        count={high ? 2600 : 1000}
        colors={COOL_DUST}
        warmColors={WARM_DUST}
        inner={2.6}
        outer={13}
        size={1}
        opacity={0.9}
        rise={2.4}
        seed={11}
      />
    </group>
  );
}
