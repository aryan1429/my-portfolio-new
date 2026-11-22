"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  Object3D,
  Vector2,
  Vector3,
  type Group,
  type InstancedMesh,
} from "three";
import ParticleField from "../ParticleField";
import { director, presenceScale } from "../director";
import { createRandom, damp, lerp } from "../math";
import { BACKGROUND, PALETTE } from "../palette";
import {
  EDGE_FRAGMENT,
  EDGE_VERTEX,
  FLOOR_FRAGMENT,
  FLOOR_VERTEX,
  HORIZON_FRAGMENT,
  HORIZON_VERTEX,
  NODE_FRAGMENT,
  NODE_VERTEX,
} from "../shaders/grid";
import type { Detail, ShaderMat, UniformsOf } from "../types";

interface FieldValues {
  uTime: number;
  uScroll: number;
  uProbe: Vector3;
  uProbeStrength: number;
  uReveal: number;
  uOrigin: Vector2;
}

type NodeUniforms = UniformsOf<FieldValues & { uCool: Color; uCyan: Color; uBg: Color }>;
type EdgeUniforms = UniformsOf<FieldValues & { uOpacity: number; uFlow: number; uCool: Color; uCyan: Color; uHot: Color }>;
type FloorUniforms = UniformsOf<{
  uTime: number;
  uScroll: number;
  uOpacity: number;
  uReveal: number;
  uCell: number;
  uOrigin: Vector2;
  uCool: Color;
  uCyan: Color;
}>;
type HorizonUniforms = UniformsOf<{ uOpacity: number; uTime: number; uCool: Color; uCyan: Color }>;

const PLANE_Y = -1.2;
const FLOOR_Y = -1.62;
const ORIGIN = new Vector2(0, -1.5);
const MAX_REVEAL = 19;
const DUST = [PALETTE.tech, PALETTE.tech2, PALETTE.tech2, PALETTE.paper] as const;
const DUST_EXTENT = [10, 2.6, 8] as const;
const DUST_CENTER = [0, 0.7, -3.5] as const;

interface GridLayout {
  /** Instance transforms (translation + uniform scale) as [x, y, z, s] quadruples. */
  instances: Float32Array;
  seeds: Float32Array;
  count: number;
  edges: { position: Float32Array; t: Float32Array; seed: Float32Array; kind: Float32Array };
  cell: number;
}

function terrain(x: number, z: number): number {
  return PLANE_Y + 0.26 * Math.sin(x * 0.42) * Math.cos(z * 0.37) + 0.1 * Math.sin(x * 1.3 + z * 0.7);
}

/** Builds the jittered lattice, its edges, long links and vertical risers from a fixed seed. */
function buildLayout(detail: Detail): GridLayout {
  const rand = createRandom(1429);
  const cols = detail === "high" ? 36 : 22;
  const rows = detail === "high" ? 26 : 17;
  const cell = detail === "high" ? 0.56 : 0.84;
  const x0 = -((cols - 1) * cell) / 2;
  const z0 = 4.2;

  const nodeCount = cols * rows;
  const px = new Float32Array(nodeCount);
  const py = new Float32Array(nodeCount);
  const pz = new Float32Array(nodeCount);
  const nodeSeed = new Float32Array(nodeCount);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const n = j * cols + i;
      const x = x0 + i * cell + (rand() - 0.5) * cell * 0.28;
      const z = z0 - j * cell + (rand() - 0.5) * cell * 0.28;
      px[n] = x;
      pz[n] = z;
      py[n] = terrain(x, z);
      nodeSeed[n] = rand();
    }
  }

  const seg: number[] = [];
  const segT: number[] = [];
  const segSeed: number[] = [];
  const segKind: number[] = [];
  const pushSeg = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, kind: number) => {
    const s = rand();
    seg.push(ax, ay, az, bx, by, bz);
    segT.push(0, 1);
    segSeed.push(s, s);
    segKind.push(kind, kind);
  };

  const risers: number[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const n = j * cols + i;
      if (i + 1 < cols && rand() < 0.86) pushSeg(px[n], py[n], pz[n], px[n + 1], py[n + 1], pz[n + 1], 0);
      if (j + 1 < rows && rand() < 0.86) {
        const m = n + cols;
        pushSeg(px[n], py[n], pz[n], px[m], py[m], pz[m], 0);
      }
      // Long-range links — the "graph" layer over the lattice.
      if (rand() < 0.07) {
        const di = 2 + Math.floor(rand() * 3);
        const dj = 1 + Math.floor(rand() * 3);
        const ti = i + (rand() < 0.5 ? -di : di);
        const tj = j + dj;
        if (ti >= 0 && ti < cols && tj < rows) {
          const m = tj * cols + ti;
          pushSeg(px[n], py[n], pz[n], px[m], py[m], pz[m], 1);
        }
      }
      // Vertical data risers from hub nodes.
      if (nodeSeed[n] > 0.93) {
        const h = 0.55 + rand() * 1.1;
        pushSeg(px[n], py[n], pz[n], px[n], py[n] + h, pz[n], 2);
        risers.push(px[n], py[n] + h, pz[n]);
      }
    }
  }

  const riserCount = risers.length / 3;
  const count = nodeCount + riserCount;
  const instances = new Float32Array(count * 4);
  const seeds = new Float32Array(count);
  for (let n = 0; n < nodeCount; n++) {
    const s = nodeSeed[n];
    const scale = s > 0.93 ? 1.9 : 0.65 + rand() * 0.55;
    instances.set([px[n], py[n], pz[n], scale], n * 4);
    seeds[n] = s;
  }
  for (let r = 0; r < riserCount; r++) {
    const n = nodeCount + r;
    instances.set([risers[r * 3], risers[r * 3 + 1], risers[r * 3 + 2], 0.85], n * 4);
    seeds[n] = 0.5 + rand() * 0.4;
  }

  return {
    instances,
    seeds,
    count,
    cell,
    edges: {
      position: new Float32Array(seg),
      t: new Float32Array(segT),
      seed: new Float32Array(segSeed),
      kind: new Float32Array(segKind),
    },
  };
}

// Frame-loop scratch.
const rayPoint = new Vector3();
const rayOrigin = new Vector3();
const probe = new Vector3(0, PLANE_Y, 0);
const dummy = new Object3D();

function fieldUniforms(): UniformsOf<FieldValues> {
  return {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uProbe: { value: new Vector3(0, PLANE_Y, 0) },
    uProbeStrength: { value: 0 },
    uReveal: { value: 0 },
    uOrigin: { value: ORIGIN.clone() },
  };
}

export interface TechGridSceneProps {
  detail: Detail;
}

/**
 * /tech: a structured technical space — an instanced node lattice (one draw call), its edges and
 * long-range links (one LineSegments), vertical data risers, a floor grid, a horizon key light and
 * cool dust. A wave and a scan ring travel with time + scroll, data packets run along edges and the
 * pointer lifts / lights the nodes beneath it. The lattice builds outward on entry.
 */
export default function TechGridScene({ detail }: TechGridSceneProps) {
  const root = useRef<Group>(null);
  const nodes = useRef<InstancedMesh>(null);
  const nodeMat = useRef<ShaderMat<NodeUniforms>>(null);
  const edgeMat = useRef<ShaderMat<EdgeUniforms>>(null);
  const floorMat = useRef<ShaderMat<FloorUniforms>>(null);
  const horizonMat = useRef<ShaderMat<HorizonUniforms>>(null);

  const layout = useMemo(() => buildLayout(detail), [detail]);

  const nodeUniforms = useMemo<NodeUniforms>(
    () => ({
      ...fieldUniforms(),
      uCool: { value: new Color(PALETTE.tech) },
      uCyan: { value: new Color(PALETTE.tech2) },
      uBg: { value: new Color(BACKGROUND.tech) },
    }),
    [],
  );
  const edgeUniforms = useMemo<EdgeUniforms>(
    () => ({
      ...fieldUniforms(),
      uOpacity: { value: 0 },
      uFlow: { value: 1 },
      uCool: { value: new Color(PALETTE.tech) },
      uCyan: { value: new Color(PALETTE.tech2) },
      uHot: { value: new Color(PALETTE.tech2).lerp(new Color(PALETTE.paper), 0.35) },
    }),
    [],
  );
  const floorUniforms = useMemo<FloorUniforms>(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uOpacity: { value: 0 },
      uReveal: { value: 0 },
      uCell: { value: layout.cell },
      uOrigin: { value: ORIGIN.clone() },
      uCool: { value: new Color(PALETTE.tech) },
      uCyan: { value: new Color(PALETTE.tech2) },
    }),
    [layout.cell],
  );
  const horizonUniforms = useMemo<HorizonUniforms>(
    () => ({
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uCool: { value: new Color(PALETTE.tech) },
      uCyan: { value: new Color(PALETTE.tech2) },
    }),
    [],
  );

  // Write the static instance transforms once; all motion happens in the vertex shader.
  useLayoutEffect(() => {
    const mesh = nodes.current;
    if (!mesh) return;
    const inst = layout.instances;
    for (let i = 0; i < layout.count; i++) {
      dummy.position.set(inst[i * 4], inst[i * 4 + 1], inst[i * 4 + 2]);
      dummy.scale.setScalar(inst[i * 4 + 3]);
      dummy.rotation.set(0, (layout.seeds[i] ?? 0) * Math.PI, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [layout]);

  useFrame((state, delta) => {
    const g = root.current;
    if (!g) return;
    const p = director.presence.tech;
    g.visible = p > 0.002;
    if (!g.visible) return;

    const dt = Math.min(delta, 1 / 20);
    const t = director.time;
    const leaving = director.target.tech === 0;
    g.scale.setScalar(presenceScale("tech"));
    // Build outward from the origin on entry; on exit it collapses back while flying past the camera.
    const reveal = Math.pow(p, leaving ? 0.8 : 1.4) * MAX_REVEAL;
    const fade = leaving ? p : 1;

    // Pointer probe: intersect the camera ray with the lattice plane in the root's local space.
    const cam = state.camera;
    rayPoint.set(director.pointer.x, director.pointer.y, 0.5).unproject(cam);
    rayOrigin.copy(cam.position);
    g.worldToLocal(rayOrigin);
    g.worldToLocal(rayPoint);
    rayPoint.sub(rayOrigin);
    let strength = 0;
    if (Math.abs(rayPoint.y) > 1e-4) {
      const k = (PLANE_Y - rayOrigin.y) / rayPoint.y;
      if (k > 0) {
        const tx = rayOrigin.x + rayPoint.x * k;
        const tz = rayOrigin.z + rayPoint.z * k;
        const lambda = director.reduced ? 1000 : 6;
        probe.set(damp(probe.x, tx, lambda, dt), PLANE_Y, damp(probe.z, tz, lambda, dt));
        strength = director.reduced ? 0 : 0.9;
      }
    }

    const nm = nodeMat.current;
    if (nm) {
      const u = nm.uniforms;
      u.uTime.value = t;
      u.uScroll.value = director.scroll;
      u.uReveal.value = reveal;
      u.uProbe.value.copy(probe);
      u.uProbeStrength.value = damp(u.uProbeStrength.value, strength, 3, dt);
    }
    const em = edgeMat.current;
    if (em) {
      const u = em.uniforms;
      u.uTime.value = t;
      u.uScroll.value = director.scroll;
      u.uReveal.value = reveal;
      u.uProbe.value.copy(probe);
      u.uProbeStrength.value = damp(u.uProbeStrength.value, strength, 3, dt);
      u.uOpacity.value = fade;
      u.uFlow.value = 1 + director.energy * 1.5;
    }
    const fm = floorMat.current;
    if (fm) {
      fm.uniforms.uTime.value = t;
      fm.uniforms.uScroll.value = director.scroll;
      fm.uniforms.uReveal.value = reveal;
      fm.uniforms.uOpacity.value = fade;
    }
    const hm = horizonMat.current;
    if (hm) {
      hm.uniforms.uTime.value = t;
      hm.uniforms.uOpacity.value = p * lerp(1, 0.75, director.scroll);
    }
  });

  return (
    <group ref={root}>
      <mesh position={[0, 1.2, -16]} renderOrder={0}>
        <planeGeometry args={[46, 14]} />
        <shaderMaterial
          ref={horizonMat}
          uniforms={horizonUniforms}
          vertexShader={HORIZON_VERTEX}
          fragmentShader={HORIZON_FRAGMENT}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>

      <mesh position={[0, FLOOR_Y, -3]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[44, 44]} />
        <shaderMaterial
          ref={floorMat}
          uniforms={floorUniforms}
          vertexShader={FLOOR_VERTEX}
          fragmentShader={FLOOR_FRAGMENT}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>

      <instancedMesh
        key={layout.count}
        ref={nodes}
        args={[undefined, undefined, layout.count]}
        frustumCulled={false}
        renderOrder={2}
      >
        <octahedronGeometry args={[0.05, 0]}>
          <instancedBufferAttribute attach="attributes-aSeed" args={[layout.seeds, 1]} />
        </octahedronGeometry>
        <shaderMaterial
          ref={nodeMat}
          uniforms={nodeUniforms}
          vertexShader={NODE_VERTEX}
          fragmentShader={NODE_FRAGMENT}
        />
      </instancedMesh>

      <lineSegments frustumCulled={false} renderOrder={3}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[layout.edges.position, 3]} />
          <bufferAttribute attach="attributes-aT" args={[layout.edges.t, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[layout.edges.seed, 1]} />
          <bufferAttribute attach="attributes-aKind" args={[layout.edges.kind, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={edgeMat}
          uniforms={edgeUniforms}
          vertexShader={EDGE_VERTEX}
          fragmentShader={EDGE_FRAGMENT}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </lineSegments>

      <ParticleField
        group="tech"
        shape="box"
        count={detail === "high" ? 900 : 360}
        colors={DUST}
        extent={DUST_EXTENT}
        center={DUST_CENTER}
        size={0.8}
        opacity={0.75}
        rise={1.2}
        seed={23}
      />
    </group>
  );
}
