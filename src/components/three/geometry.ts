import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Vector3 } from "three";

/**
 * Flat annulus band in the XY plane. `uv.x` runs 0..1 around the ring, `uv.y` 0..1 across it.
 * The seam vertex is duplicated so `uv.x` stays continuous for shader patterns.
 */
export function createBandGeometry(radius: number, width: number, segments: number): BufferGeometry {
  const verts = (segments + 1) * 2;
  const position = new Float32Array(verts * 3);
  const uv = new Float32Array(verts * 2);
  const index = new Uint32Array(segments * 6);
  const r0 = radius - width / 2;
  const r1 = radius + width / 2;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = t * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const o = i * 2;
    position.set([c * r0, s * r0, 0, c * r1, s * r1, 0], o * 3);
    uv.set([t, 0, t, 1], o * 2);
    if (i < segments) {
      index.set([o, o + 2, o + 1, o + 1, o + 2, o + 3], i * 6);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(position, 3));
  geo.setAttribute("uv", new BufferAttribute(uv, 2));
  geo.setIndex(new BufferAttribute(index, 1));
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Pre-sampled curve frames (point, tangent, side, normal) in flat typed arrays so per-frame
 * lookups along a spline never allocate (three's `Curve.getTangentAt` creates vectors).
 */
export interface CurveTable {
  samples: number;
  length: number;
  point: Float32Array;
  tangent: Float32Array;
  side: Float32Array;
  normal: Float32Array;
}

/**
 * Samples a centripetal Catmull-Rom spline. The ribbon side vector is `tangent × up`, so `up` controls
 * which way the strip faces (tilt it toward the camera to show the strip face-on).
 */
export function sampleCurve(
  points: readonly (readonly [number, number, number])[],
  samples: number,
  twist = 0,
  upVector: readonly [number, number, number] = [0, 1, 0],
): CurveTable {
  const curve = new CatmullRomCurve3(
    points.map(([x, y, z]) => new Vector3(x, y, z)),
    false,
    "centripetal",
  );
  const point = new Float32Array(samples * 3);
  const tangent = new Float32Array(samples * 3);
  const side = new Float32Array(samples * 3);
  const normal = new Float32Array(samples * 3);
  const p = new Vector3();
  const t = new Vector3();
  const s = new Vector3();
  const n = new Vector3();
  const up = new Vector3(upVector[0], upVector[1], upVector[2]).normalize();
  for (let i = 0; i < samples; i++) {
    const u = i / (samples - 1);
    curve.getPointAt(u, p);
    curve.getTangentAt(u, t).normalize();
    s.crossVectors(t, up).normalize();
    n.crossVectors(s, t).normalize();
    if (twist !== 0) {
      // Gentle twist around the tangent so the ribbon catches the light differently along its length.
      const a = Math.sin(u * Math.PI * 2) * twist;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const sx = s.x * c + n.x * sn;
      const sy = s.y * c + n.y * sn;
      const sz = s.z * c + n.z * sn;
      n.set(n.x * c - s.x * sn, n.y * c - s.y * sn, n.z * c - s.z * sn);
      s.set(sx, sy, sz);
    }
    p.toArray(point, i * 3);
    t.toArray(tangent, i * 3);
    s.toArray(side, i * 3);
    n.toArray(normal, i * 3);
  }
  return { samples, length: curve.getLength(), point, tangent, side, normal };
}

/** Linear lookup into a curve table at `u` (0..1). Writes into `out`. */
export function readCurve(table: CurveTable, key: "point" | "tangent" | "side" | "normal", u: number, out: Vector3): Vector3 {
  const arr = table[key];
  const f = Math.min(Math.max(u, 0), 1) * (table.samples - 1);
  const i0 = Math.floor(f);
  const i1 = Math.min(i0 + 1, table.samples - 1);
  const k = f - i0;
  const a = i0 * 3;
  const b = i1 * 3;
  out.set(
    arr[a] + (arr[b] - arr[a]) * k,
    arr[a + 1] + (arr[b + 1] - arr[a + 1]) * k,
    arr[a + 2] + (arr[b + 2] - arr[a + 2]) * k,
  );
  return out;
}

/** Ribbon strip along a sampled curve. `uv.x` = arc-length fraction, `uv.y` across. */
export function createRibbonGeometry(table: CurveTable, width: number): BufferGeometry {
  const n = table.samples;
  const position = new Float32Array(n * 2 * 3);
  const uv = new Float32Array(n * 2 * 2);
  const normal = new Float32Array(n * 2 * 3);
  const index = new Uint32Array((n - 1) * 6);
  const h = width / 2;
  for (let i = 0; i < n; i++) {
    const o = i * 3;
    const px = table.point[o];
    const py = table.point[o + 1];
    const pz = table.point[o + 2];
    const sx = table.side[o] * h;
    const sy = table.side[o + 1] * h;
    const sz = table.side[o + 2] * h;
    position.set([px - sx, py - sy, pz - sz, px + sx, py + sy, pz + sz], i * 6);
    normal.set([table.normal[o], table.normal[o + 1], table.normal[o + 2], table.normal[o], table.normal[o + 1], table.normal[o + 2]], i * 6);
    const u = i / (n - 1);
    uv.set([u, 0, u, 1], i * 4);
    if (i < n - 1) {
      const v = i * 2;
      index.set([v, v + 1, v + 2, v + 1, v + 3, v + 2], i * 6);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(position, 3));
  geo.setAttribute("normal", new BufferAttribute(normal, 3));
  geo.setAttribute("uv", new BufferAttribute(uv, 2));
  geo.setIndex(new BufferAttribute(index, 1));
  geo.computeBoundingSphere();
  return geo;
}
