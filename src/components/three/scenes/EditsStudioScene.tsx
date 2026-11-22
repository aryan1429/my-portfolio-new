"use client";

import { Suspense, use, useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Vector2,
  Vector3,
  type Group,
  type Texture,
} from "three";
import { videoEdits } from "@/data/portfolio";
import type { VideoEdit } from "@/data/types";
import ParticleField from "../ParticleField";
import SceneErrorBoundary from "../SceneErrorBoundary";
import { director, presenceScale } from "../director";
import { createRibbonGeometry, readCurve, sampleCurve, type CurveTable } from "../geometry";
import { damp, easeOutCubic, smoothstep, wrap } from "../math";
import { PALETTE } from "../palette";
import {
  FRAME_FRAGMENT,
  FRAME_VERTEX,
  LEAK_FRAGMENT,
  LEAK_VERTEX,
  STREAK_FRAGMENT,
  STRIP_FRAGMENT,
  STRIP_VERTEX,
  ribbonWave,
} from "../shaders/film";
import { loadThumbnail, disposeThumbnails } from "../textures";
import type { Detail, ShaderMat, UniformsOf } from "../types";

type StripUniforms = UniformsOf<{
  uTime: number;
  uWaveAmp: number;
  uOffset: number;
  uLength: number;
  uWidth: number;
  uOpacity: number;
  uReveal: number;
  uPlayhead: number;
  uPlayheadGain: number;
  uBase: Color;
  uWarm: Color;
  uAmber: Color;
  uLightDir: Vector3;
}>;

type FrameUniforms = UniformsOf<{
  uMap: Texture | null;
  uMapMix: number;
  uCoverScale: Vector2;
  uCoverOffset: Vector2;
  uSize: Vector2;
  uRadius: number;
  uOpacity: number;
  uFocus: number;
  uTime: number;
  uSeed: number;
  uWarm: Color;
  uAmber: Color;
  uDeep: Color;
}>;

type LeakUniforms = UniformsOf<{ uTime: number; uOpacity: number; uSeed: number; uA: Color; uB: Color }>;
type StreakUniforms = UniformsOf<{ uTime: number; uOpacity: number; uColor: Color }>;

/** Timeline spline: sweeps in from the lower left, crosses the frame and curls away into depth. */
const TIMELINE: readonly (readonly [number, number, number])[] = [
  [-9.5, -2.5, 2.4],
  [-5.6, -1.7, 0.9],
  [-2.3, -1.1, -0.15],
  [1.1, -0.8, -0.6],
  [4.1, -0.62, -1.8],
  [5.6, -0.2, -4.6],
  [3.7, 0.4, -8.0],
  [-0.8, 0.9, -10.4],
  [-5.6, 1.3, -11.6],
];
const RIBBON_WIDTH = 0.62;
/** Ribbon "up": tilted toward the camera so the strip reads face-on where it crosses the frame. */
const RIBBON_UP = [0, 0.62, 0.78] as const;
/** u along the timeline that reads as "now" (roughly screen centre). */
const PLAYHEAD = 0.31;
const FRAME_LIFT = 1.05;
const DUST = [PALETTE.edit, PALETTE.edit2, PALETTE.edit2, PALETTE.paper] as const;
const DUST_EXTENT = [9, 4, 7] as const;
const DUST_CENTER = [0, 0.5, -3] as const;
const LIGHT_DIR = new Vector3(-0.4, 0.8, 0.45).normalize();

// Frame-loop scratch.
const tmpPoint = new Vector3();
const tmpNormal = new Vector3();

interface FrameSpec {
  id: string;
  src: string | null;
  aspect: number;
  /** Alignment of the visible crop, 0..1 in uv space (x: left→right, y: bottom→top). */
  align: readonly [number, number];
  seed: number;
}

function aspectOf(edit: VideoEdit | undefined): number {
  switch (edit?.aspect) {
    case "9:16":
      return 9 / 16;
    case "1:1":
      return 1;
    case "4:5":
      return 4 / 5;
    default:
      return 16 / 9;
  }
}

const POSITION_KEYWORDS: Record<string, number> = { left: 0, top: 0, center: 0.5, right: 1, bottom: 1 };

function positionValue(token: string | undefined): number | null {
  if (!token) return null;
  if (token in POSITION_KEYWORDS) return POSITION_KEYWORDS[token];
  if (token.endsWith("%")) {
    const n = Number.parseFloat(token);
    if (Number.isFinite(n)) return Math.min(Math.max(n / 100, 0), 1);
  }
  return null;
}

/**
 * Parses a CSS object-position ("center top", "26% center", "center 20%", "left") into uv-space
 * alignment: x 0 = left, y 0 = bottom (the image's top edge maps to y = 1).
 */
function parsePosition(value: string | undefined): readonly [number, number] {
  let x = 0.5;
  let yImage = 0.5; // CSS convention: 0 = top
  const tokens = (value ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 1) {
    const [tok] = tokens;
    const v = positionValue(tok);
    if (v !== null) {
      if (tok === "top" || tok === "bottom") yImage = v;
      else x = v;
    }
  } else if (tokens.length >= 2) {
    let [a, b] = tokens;
    // Keyword pairs may come in either order ("top left").
    if (a === "top" || a === "bottom" || b === "left" || b === "right") [a, b] = [b, a];
    x = positionValue(a) ?? 0.5;
    yImage = positionValue(b) ?? 0.5;
  }
  return [x, 1 - yImage];
}

function buildFrames(count: number): FrameSpec[] {
  const list: VideoEdit[] = Array.isArray(videoEdits) ? [...videoEdits] : [];
  list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  const frames: FrameSpec[] = [];
  for (let i = 0; i < count; i++) {
    const edit = list.length > 0 ? list[i % list.length] : undefined;
    frames.push({
      id: `${edit?.slug ?? "frame"}-${i}`,
      // 512 px JPEG texture renditions live in /images/edits/tex/<basename>.jpg.
      src: edit?.thumbnail ? edit.thumbnail.replace(/^\/images\/edits\/([^/]+?)(\.[^./]+)?$/, "/images/edits/tex/$1.jpg") : null,
      aspect: aspectOf(edit),
      align: parsePosition(edit?.thumbnailPosition),
      seed: ((i * 0.618034) % 1) + 0.05,
    });
  }
  return frames;
}

/** Suspends on the thumbnail, then hands the texture to its frame (renders nothing itself). */
function ThumbnailBinder({ src, onReady }: { src: string; onReady: (texture: Texture, aspect: number) => void }) {
  const thumb = use(loadThumbnail(src));
  useEffect(() => {
    onReady(thumb.texture, thumb.aspect);
  }, [thumb, onReady]);
  return null;
}

interface FilmFrameProps {
  spec: FrameSpec;
  index: number;
  count: number;
  table: CurveTable;
}

function FilmFrame({ spec, index, count, table }: FilmFrameProps) {
  const group = useRef<Group>(null);
  const material = useRef<ShaderMat<FrameUniforms>>(null);
  const hasMap = useRef(false);
  const invalidate = useThree((s) => s.invalidate);

  const height = spec.aspect >= 1 ? 0.95 : 1.25;
  const width = height * spec.aspect;

  const uniforms = useMemo<FrameUniforms>(
    () => ({
      uMap: { value: null },
      uMapMix: { value: 0 },
      uCoverScale: { value: new Vector2(1, 1) },
      uCoverOffset: { value: new Vector2(0, 0) },
      uSize: { value: new Vector2(width, height) },
      uRadius: { value: 0.06 },
      uOpacity: { value: 0 },
      uFocus: { value: 0 },
      uTime: { value: 0 },
      uSeed: { value: spec.seed },
      uWarm: { value: new Color(PALETTE.edit) },
      uAmber: { value: new Color(PALETTE.edit2) },
      uDeep: { value: new Color("#1A0609") },
    }),
    [width, height, spec.seed],
  );

  // Cover-fit the texture inside the frame (CSS object-fit: cover + object-position).
  const onReady = useCallback(
    (texture: Texture, imageAspect: number) => {
      const m = material.current;
      if (!m) return;
      const frameAspect = width / height;
      const sx = imageAspect > frameAspect ? frameAspect / imageAspect : 1;
      const sy = imageAspect > frameAspect ? 1 : imageAspect / frameAspect;
      m.uniforms.uMap.value = texture;
      m.uniforms.uCoverScale.value.set(sx, sy);
      m.uniforms.uCoverOffset.value.set((spec.align[0] - 0.5) * (1 - sx), (spec.align[1] - 0.5) * (1 - sy));
      hasMap.current = true;
      // On-demand loop (reduced motion): make sure the textured still gets drawn.
      invalidate(2);
    },
    [width, height, spec.align, invalidate],
  );

  useFrame((state, delta) => {
    const g = group.current;
    const m = material.current;
    if (!g || !m) return;
    const dt = Math.min(delta, 1 / 20);
    const t = director.time;
    const p = director.presence.edits;
    const leaving = director.target.edits === 0;

    const flow = director.scroll * 0.42 + t * 0.006;
    const u = wrap(index / count + flow);
    const ends = smoothstep(0.0, 0.07, u) * (1 - smoothstep(0.86, 0.97, u));
    // Frames appear in timeline order on entry; everything fades together on exit.
    const reveal = leaving ? 1.1 : easeOutCubic(p) * 1.1;
    const shown = ends * smoothstep(reveal, reveal - 0.08, u) * (leaving ? p : 1);
    g.visible = shown > 0.003;
    if (!g.visible) return;

    readCurve(table, "point", u, tmpPoint);
    readCurve(table, "normal", u, tmpNormal);
    const bob = Math.sin(t * 0.8 + spec.seed * 12) * 0.1;
    // Float above the strip, riding the same wave the ribbon vertex shader applies.
    tmpPoint.addScaledVector(tmpNormal, ribbonWave(u, t));
    tmpPoint.y += FRAME_LIFT + bob;
    g.position.copy(tmpPoint);
    g.lookAt(state.camera.position);
    g.rotateY((spec.seed - 0.5) * 0.55 + Math.sin(t * 0.35 + spec.seed * 9) * 0.06);
    g.rotateZ(Math.sin(t * 0.5 + spec.seed * 10) * 0.05);

    const focus = Math.exp(-Math.pow((u - PLAYHEAD) / 0.07, 2));
    g.scale.setScalar(Math.max(shown, 0.001) * (1 + focus * 0.14));

    const uf = m.uniforms;
    uf.uOpacity.value = shown;
    uf.uFocus.value = director.reduced ? focus : damp(uf.uFocus.value, focus, 6, dt);
    uf.uTime.value = t;
    const mixTarget = hasMap.current ? 1 : 0;
    uf.uMapMix.value = director.reduced ? mixTarget : damp(uf.uMapMix.value, mixTarget, 2.5, dt);
  });

  return (
    <group ref={group} visible={false}>
      <mesh renderOrder={4}>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={FRAME_VERTEX}
          fragmentShader={FRAME_FRAGMENT}
          transparent
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      {spec.src ? (
        <SceneErrorBoundary>
          <Suspense fallback={null}>
            <ThumbnailBinder src={spec.src} onReady={onReady} />
          </Suspense>
        </SceneErrorBoundary>
      ) : null}
    </group>
  );
}

function stripUniforms(length: number, width: number, waveAmp: number, playheadGain: number): StripUniforms {
  return {
    uTime: { value: 0 },
    uWaveAmp: { value: waveAmp },
    uOffset: { value: 0 },
    uLength: { value: length },
    uWidth: { value: width },
    uOpacity: { value: 0 },
    uReveal: { value: 0 },
    uPlayhead: { value: PLAYHEAD },
    uPlayheadGain: { value: playheadGain },
    uBase: { value: new Color("#3A0A14") },
    uWarm: { value: new Color(PALETTE.edit) },
    uAmber: { value: new Color(PALETTE.edit2) },
    uLightDir: { value: LIGHT_DIR.clone() },
  };
}

export interface EditsStudioSceneProps {
  detail: Detail;
}

/**
 * /edits: a cinematic motion studio. Film frames (thumbnails from `videoEdits`, streamed lazily)
 * ride a curved film-strip timeline that slides with scroll, under a playhead that highlights the
 * "current" frame. Background sprocket strips, drifting light leaks, an anamorphic streak and warm
 * dust complete the grade. On entry the timeline draws on and frames pop in along it.
 */
export default function EditsStudioScene({ detail }: EditsStudioSceneProps) {
  const root = useRef<Group>(null);
  const ribbonMat = useRef<ShaderMat<StripUniforms>>(null);
  const stripA = useRef<ShaderMat<StripUniforms>>(null);
  const stripB = useRef<ShaderMat<StripUniforms>>(null);
  const leakMats = useRef<(ShaderMat<LeakUniforms> | null)[]>([]);
  const streakMat = useRef<ShaderMat<StreakUniforms>>(null);

  const high = detail === "high";
  const table = useMemo(() => sampleCurve(TIMELINE, high ? 480 : 240, 0.3, RIBBON_UP), [high]);
  const ribbon = useMemo(() => createRibbonGeometry(table, RIBBON_WIDTH), [table]);
  useEffect(() => () => ribbon.dispose(), [ribbon]);
  useEffect(() => () => disposeThumbnails(), []);

  const frames = useMemo(() => buildFrames(high ? 10 : 6), [high]);

  const ribbonUniforms = useMemo(() => stripUniforms(table.length, RIBBON_WIDTH, 1, 1), [table.length]);
  const stripAUniforms = useMemo(() => stripUniforms(34, 0.55, 0.6, 0), []);
  const stripBUniforms = useMemo(() => stripUniforms(34, 0.45, 0.6, 0), []);

  const leaks = useMemo(
    () =>
      [
        { pos: [-5.5, 2.2, -9.5] as const, size: [13, 9] as const, a: PALETTE.edit, b: "#FF4FA0", seed: 1.3, gain: 0.55 },
        { pos: [6.2, -1.2, -8.5] as const, size: [12, 8] as const, a: PALETTE.edit2, b: PALETTE.edit, seed: 4.1, gain: 0.5 },
        { pos: [0.5, 3.8, -13] as const, size: [18, 9] as const, a: PALETTE.edit, b: PALETTE.edit2, seed: 7.7, gain: 0.4 },
      ].map((l) => ({
        ...l,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uSeed: { value: l.seed },
          uA: { value: new Color(l.a) },
          uB: { value: new Color(l.b) },
        } satisfies LeakUniforms,
      })),
    [],
  );

  const streakUniforms = useMemo<StreakUniforms>(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColor: { value: new Color(PALETTE.edit2).lerp(new Color(PALETTE.paper), 0.2) },
    }),
    [],
  );

  useFrame((_, delta) => {
    const g = root.current;
    if (!g) return;
    const p = director.presence.edits;
    g.visible = p > 0.002;
    if (!g.visible) return;

    const t = director.time;
    const leaving = director.target.edits === 0;
    const fade = leaving ? p : 1;
    g.scale.setScalar(presenceScale("edits"));
    g.rotation.y = damp(g.rotation.y, director.pointer.x * 0.05, 4, Math.min(delta, 1 / 20));

    const flow = director.scroll * 0.42 + t * 0.006;
    const rm = ribbonMat.current;
    if (rm) {
      rm.uniforms.uTime.value = t;
      rm.uniforms.uOffset.value = -flow * table.length;
      rm.uniforms.uReveal.value = leaving ? 1.05 : easeOutCubic(p) * 1.05;
      rm.uniforms.uOpacity.value = fade;
      rm.uniforms.uPlayheadGain.value = 0.8 + director.energy * 0.6;
    }
    const a = stripA.current;
    if (a) {
      a.uniforms.uTime.value = t;
      a.uniforms.uOffset.value = t * 0.35 + director.scroll * 6;
      a.uniforms.uReveal.value = 1.05;
      a.uniforms.uOpacity.value = 0.42 * p;
    }
    const b = stripB.current;
    if (b) {
      b.uniforms.uTime.value = t;
      b.uniforms.uOffset.value = -t * 0.28 - director.scroll * 5;
      b.uniforms.uReveal.value = 1.05;
      b.uniforms.uOpacity.value = 0.32 * p;
    }
    for (let i = 0; i < leaks.length; i++) {
      const lm = leakMats.current[i];
      if (!lm) continue;
      lm.uniforms.uTime.value = t;
      lm.uniforms.uOpacity.value = leaks[i].gain * p * (1 + director.energy * 0.4);
    }
    const sm = streakMat.current;
    if (sm) {
      sm.uniforms.uTime.value = t;
      sm.uniforms.uOpacity.value = 0.55 * p;
    }
  });

  return (
    <group ref={root}>
      {leaks.map((l, i) => (
        <mesh key={l.seed} position={l.pos} renderOrder={0}>
          <planeGeometry args={[l.size[0], l.size[1]]} />
          <shaderMaterial
            ref={(m: ShaderMat<LeakUniforms> | null) => {
              leakMats.current[i] = m;
            }}
            uniforms={l.uniforms}
            vertexShader={LEAK_VERTEX}
            fragmentShader={LEAK_FRAGMENT}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}

      <mesh position={[0, 0.15, -6.5]} renderOrder={1}>
        <planeGeometry args={[30, 1.4]} />
        <shaderMaterial
          ref={streakMat}
          uniforms={streakUniforms}
          vertexShader={LEAK_VERTEX}
          fragmentShader={STREAK_FRAGMENT}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Background sprocket strips */}
      <mesh position={[0, 2.9, -7.2]} rotation={[0, 0, 0.12]} renderOrder={1}>
        <planeGeometry args={[34, 0.55, 1, 1]} />
        <shaderMaterial
          ref={stripA}
          uniforms={stripAUniforms}
          vertexShader={STRIP_VERTEX}
          fragmentShader={STRIP_FRAGMENT}
          transparent
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, -3.3, -5.2]} rotation={[0, 0, -0.08]} renderOrder={1}>
        <planeGeometry args={[34, 0.45, 1, 1]} />
        <shaderMaterial
          ref={stripB}
          uniforms={stripBUniforms}
          vertexShader={STRIP_VERTEX}
          fragmentShader={STRIP_FRAGMENT}
          transparent
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      {/* Timeline ribbon */}
      <mesh geometry={ribbon} frustumCulled={false} renderOrder={2}>
        <shaderMaterial
          ref={ribbonMat}
          uniforms={ribbonUniforms}
          vertexShader={STRIP_VERTEX}
          fragmentShader={STRIP_FRAGMENT}
          transparent
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      {frames.map((spec, i) => (
        <FilmFrame key={spec.id} spec={spec} index={i} count={frames.length} table={table} />
      ))}

      <ParticleField
        group="edits"
        shape="box"
        count={high ? 700 : 300}
        colors={DUST}
        extent={DUST_EXTENT}
        center={DUST_CENTER}
        size={0.9}
        opacity={0.8}
        rise={1.6}
        seed={31}
      />
    </group>
  );
}
