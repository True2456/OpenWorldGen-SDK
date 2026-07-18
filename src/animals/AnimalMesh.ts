/**
 * Procedural animal mesh helpers — spine loft bodies, tubes, hair volume.
 */

import { Vector3 } from 'three';
import type { Rng } from '../core/Seed';
import { MeshGrower } from '../vegetation/TubeMesh';

const _N = new Vector3();
const _B = new Vector3();
const _T = new Vector3();

export interface TubePathOpts {
  ringSegs: number;
  hue: number;
  part: number;
  phase: number;
  aoBase?: number;
  aoTip?: number;
  capStart?: boolean;
  capEnd?: boolean;
}

export interface SpineSection {
  pos: Vector3;
  /** lateral half-width (left-right in cross-section) */
  rx: number;
  /** vertical half-height in cross-section */
  ry: number;
}

export interface LoftOpts {
  ringSegs: number;
  hue: number;
  part: number;
  phase: number;
  aoBase?: number;
  aoTip?: number;
  capStart?: boolean;
  capEnd?: boolean;
}

/** Smoothstep for radius/position interpolation between control points. */
function smoothT(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Densify sparse spine controls — eliminates kinks at withers and tail root.
 * `steps` = extra rings inserted between each control pair (0 = use controls as-is).
 */
export function subdivideSpine(sections: readonly SpineSection[], steps: number): SpineSection[] {
  if (steps <= 0) {
    return sections.map((s) => ({ pos: s.pos.clone(), rx: s.rx, ry: s.ry }));
  }
  const out: SpineSection[] = [];
  for (let i = 0; i < sections.length - 1; i++) {
    const a = sections[i]!;
    const b = sections[i + 1]!;
    for (let j = 0; j < steps; j++) {
      const t = smoothT(j / steps);
      out.push({
        pos: a.pos.clone().lerp(b.pos, t),
        rx: a.rx + (b.rx - a.rx) * t,
        ry: a.ry + (b.ry - a.ry) * t,
      });
    }
  }
  const last = sections[sections.length - 1]!;
  out.push({ pos: last.pos.clone(), rx: last.rx, ry: last.ry });
  return out;
}

/**
 * Watertight lofted body along a spine — one continuous skin from tail to poll.
 * Each section is an elliptical ring; rings are parallel-transport connected.
 */
export function addSpineLoft(
  g: MeshGrower,
  sections: readonly SpineSection[],
  opts: LoftOpts,
): void {
  const n = sections.length;
  if (n < 2) return;
  const segs = Math.max(6, opts.ringSegs);
  const rings: number[][] = [];

  _T.copy(sections[1]!.pos).sub(sections[0]!.pos).normalize();
  const ref = Math.abs(_T.y) < 0.94 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  _N.crossVectors(ref, _T).normalize();
  _B.crossVectors(_T, _N).normalize();

  for (let i = 0; i < n; i++) {
    const sec = sections[i]!;
    if (i > 0) {
      const tPrev = _T.clone();
      _T.copy(sections[i]!.pos).sub(sections[i - 1]!.pos).normalize();
      const axis = new Vector3().crossVectors(tPrev, _T);
      const s = axis.length();
      if (s > 1e-6) {
        axis.multiplyScalar(1 / s);
        const ang = Math.asin(Math.min(1, s));
        _N.applyAxisAngle(axis, ang).normalize();
        _B.applyAxisAngle(axis, ang).normalize();
      }
    }
    const tt = i / (n - 1);
    const ao = (opts.aoBase ?? 0.6) + ((opts.aoTip ?? 0.85) - (opts.aoBase ?? 0.6)) * tt;
    const ring: number[] = [];
    for (let k = 0; k <= segs; k++) {
      const a = (k / segs) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const dx = _N.x * ca * sec.rx + _B.x * sa * sec.ry;
      const dy = _N.y * ca * sec.rx + _B.y * sa * sec.ry;
      const dz = _N.z * ca * sec.rx + _B.z * sa * sec.ry;
      const nl = Math.hypot(dx, dy, dz) || 1;
      ring.push(
        g.vertex(
          sec.pos.x + dx, sec.pos.y + dy, sec.pos.z + dz,
          dx / nl, dy / nl, dz / nl,
          k / segs, tt,
          opts.hue, opts.part, opts.phase, ao,
        ),
      );
    }
    rings.push(ring);
  }

  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i]!;
    const b = rings[i + 1]!;
    for (let k = 0; k < segs; k++) {
      g.quad(a[k]!, a[k + 1]!, b[k + 1]!, b[k]!);
    }
  }

  if (opts.capStart) {
    capRing(g, sections[0]!.pos, sections[1]!.pos.clone().sub(sections[0]!.pos).normalize().negate(), rings[0]!, segs, opts, -1);
  }
  if (opts.capEnd) {
    capRing(
      g,
      sections[n - 1]!.pos,
      sections[n - 1]!.pos.clone().sub(sections[n - 2]!.pos).normalize(),
      rings[n - 1]!,
      segs,
      opts,
      1,
    );
  }
}

function capRing(
  g: MeshGrower,
  center: Vector3,
  normal: Vector3,
  ring: number[],
  segs: number,
  opts: LoftOpts,
  sign: number,
): void {
  const hub = g.vertex(
    center.x + normal.x * 0.01 * sign,
    center.y + normal.y * 0.01 * sign,
    center.z + normal.z * 0.01 * sign,
    normal.x, normal.y, normal.z,
    0.5, sign > 0 ? 1 : 0, opts.hue, opts.part, opts.phase, opts.aoTip ?? 0.75,
  );
  for (let k = 0; k < segs; k++) {
    if (sign > 0) g.tri(ring[k] as number, ring[k + 1] as number, hub);
    else g.tri(ring[k + 1] as number, ring[k] as number, hub);
  }
}

/** Generalized cylinder along a polyline (parallel-transport rings). */
export function addTubePath(
  g: MeshGrower,
  points: readonly Vector3[],
  radii: readonly number[],
  opts: TubePathOpts,
): void {
  const n = points.length;
  if (n < 2) return;
  const segsAround = Math.max(4, opts.ringSegs);
  const rings: number[][] = [];

  _T.copy(points[1]!).sub(points[0]!).normalize();
  const ref = Math.abs(_T.y) < 0.94 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  _N.crossVectors(ref, _T).normalize();
  _B.crossVectors(_T, _N).normalize();

  for (let i = 0; i < n; i++) {
    const p = points[i]!;
    const r = radii[i] ?? radii[radii.length - 1] ?? 0.05;
    if (i > 0) {
      const tPrev = _T.clone();
      _T.copy(points[i]!).sub(points[i - 1]!).normalize();
      const axis = new Vector3().crossVectors(tPrev, _T);
      const s = axis.length();
      if (s > 1e-6) {
        axis.multiplyScalar(1 / s);
        const ang = Math.asin(Math.min(1, s));
        _N.applyAxisAngle(axis, ang).normalize();
        _B.applyAxisAngle(axis, ang).normalize();
      }
    }
    const tt = i / (n - 1);
    const ao = (opts.aoBase ?? 0.55) + ((opts.aoTip ?? 0.95) - (opts.aoBase ?? 0.55)) * tt;
    const ring: number[] = [];
    for (let k = 0; k <= segsAround; k++) {
      const a = (k / segsAround) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const dx = _N.x * ca + _B.x * sa;
      const dy = _N.y * ca + _B.y * sa;
      const dz = _N.z * ca + _B.z * sa;
      ring.push(
        g.vertex(
          p.x + dx * r, p.y + dy * r, p.z + dz * r,
          dx, dy, dz,
          k / segsAround, tt,
          opts.hue, opts.part, opts.phase, ao,
        ),
      );
    }
    rings.push(ring);
  }

  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i]!;
    const b = rings[i + 1]!;
    for (let k = 0; k < segsAround; k++) {
      g.quad(a[k]!, a[k + 1]!, b[k + 1]!, b[k]!);
    }
  }

  if (opts.capEnd) {
    capTube(g, points[n - 1]!, _T, radii[n - 1] ?? 0.04, rings[rings.length - 1]!, segsAround, opts, 1);
  }
  if (opts.capStart) {
    const t0 = points[1]!.clone().sub(points[0]!).normalize().negate();
    capTube(g, points[0]!, t0, radii[0] ?? 0.04, rings[0]!, segsAround, opts, -1);
  }
}

function capTube(
  g: MeshGrower,
  center: Vector3,
  normal: Vector3,
  radius: number,
  ring: number[],
  segs: number,
  opts: TubePathOpts,
  sign: number,
): void {
  const hub = g.vertex(
    center.x + normal.x * radius * 0.12 * sign,
    center.y + normal.y * radius * 0.12 * sign,
    center.z + normal.z * radius * 0.12 * sign,
    normal.x, normal.y, normal.z,
    0.5, 1, opts.hue, opts.part, opts.phase, opts.aoTip ?? 0.7,
  );
  for (let k = 0; k < segs; k++) {
    if (sign > 0) g.tri(ring[k] as number, ring[k + 1] as number, hub);
    else g.tri(ring[k + 1] as number, ring[k] as number, hub);
  }
}

export interface EllipsoidOpts {
  latSegs: number;
  lonSegs: number;
  hue: number;
  part: number;
  phase: number;
  ao?: number;
}

/** Closed ellipsoid — welded onto loft by overlapping center (head, joints). */
export function addEllipsoid(
  g: MeshGrower,
  center: Vector3,
  radii: [number, number, number],
  opts: EllipsoidOpts,
): void {
  const grid: number[][] = [];
  const ao = opts.ao ?? 0.72;
  for (let lat = 0; lat <= opts.latSegs; lat++) {
    const v = lat / opts.latSegs;
    const phi = v * Math.PI;
    const sinP = Math.sin(phi);
    const cosP = Math.cos(phi);
    const row: number[] = [];
    for (let lon = 0; lon <= opts.lonSegs; lon++) {
      const u = lon / opts.lonSegs;
      const theta = u * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const nx = sinP * cosT;
      const ny = cosP;
      const nz = sinP * sinT;
      const px = center.x + nx * radii[0];
      const py = center.y + ny * radii[1];
      const pz = center.z + nz * radii[2];
      row.push(
        g.vertex(px, py, pz, nx, ny, nz, u, v, opts.hue, opts.part, opts.phase, ao),
      );
    }
    grid.push(row);
  }
  for (let lat = 0; lat < opts.latSegs; lat++) {
    const a = grid[lat]!;
    const b = grid[lat + 1]!;
    for (let lon = 0; lon < opts.lonSegs; lon++) {
      g.quad(a[lon]!, a[lon + 1]!, b[lon + 1]!, b[lon]!);
    }
  }
}

/** Shoulder/hip socket bulge where a rigged leg attaches (no leg tubes). */
export function addLegSocket(
  g: MeshGrower,
  bodyCenter: Vector3,
  hip: Vector3,
  rUpper: number,
  ringSegs: number,
  hue: number,
  phase: number,
): void {
  const embed = bodyCenter.clone().sub(hip).normalize().multiplyScalar(rUpper * 0.9);
  const socket = hip.clone().add(embed);
  addTubePath(g, [socket, hip], [rUpper * 1.35, rUpper * 1.12], {
    ringSegs: Math.max(5, ringSegs - 1),
    hue,
    part: 0.22,
    phase,
    aoBase: 0.54,
    aoTip: 0.62,
    capStart: true,
  });
}

/** Leg emerging from body — shoulder embed then articulated segments. */
export function addLeg(
  g: MeshGrower,
  bodyCenter: Vector3,
  hip: Vector3,
  knee: Vector3,
  fetlock: Vector3,
  hoof: Vector3,
  rUpper: number,
  rKnee: number,
  rFetlock: number,
  rHoof: number,
  ringSegs: number,
  hue: number,
  phase: number,
  sockPart: number,
): void {
  const embed = bodyCenter.clone().sub(hip).normalize().multiplyScalar(rUpper * 0.9);
  const socket = hip.clone().add(embed);
  addTubePath(
    g,
    [socket, hip, knee, fetlock],
    [rUpper * 1.35, rUpper * 1.15, rKnee, rFetlock],
    { ringSegs, hue, part: 0.28, phase, aoBase: 0.5, aoTip: 0.64 },
  );
  addTubePath(
    g,
    [fetlock, hoof.clone().add(new Vector3(0, rHoof * 0.2, 0))],
    [rFetlock * 0.88, rFetlock * 0.72],
    { ringSegs: Math.max(5, ringSegs - 1), hue, part: sockPart, phase, aoBase: 0.58, aoTip: 0.72 },
  );
  addTubePath(
    g,
    [hoof.clone().add(new Vector3(0, rHoof * 0.2, 0)), hoof],
    [rFetlock * 0.7, rHoof],
    { ringSegs: Math.max(5, ringSegs - 2), hue: hue * 0.4, part: 0.42, phase, aoBase: 0.38, aoTip: 0.42, capEnd: true },
  );
}

/** Volumetric mane: crest fall + cross-strands + forelock. */
export function addManeVolume(
  g: MeshGrower,
  neck: readonly Vector3[],
  radii: readonly number[],
  strandCount: number,
  strandLen: number,
  strandW: number,
  hue: number,
  phase: number,
  rng: Rng,
): void {
  if (neck.length < 2) return;
  const grav = new Vector3(0, -1, 0);

  for (let si = 0; si < strandCount; si++) {
    const t = strandCount <= 1 ? 0.5 : si / (strandCount - 1);
    const idx = Math.min(neck.length - 2, Math.floor(t * (neck.length - 1)));
    const localT = t * (neck.length - 1) - idx;
    const p0 = neck[idx]!;
    const p1 = neck[idx + 1]!;
    const center = p0.clone().lerp(p1, localT);
    const tangent = p1.clone().sub(p0).normalize();
    const up = new Vector3(0, 1, 0);
    const side = new Vector3().crossVectors(tangent, up).normalize();
    const crest = center.clone().add(up.clone().multiplyScalar((radii[idx] ?? 0.08) * 0.75));
    const fallDir = grav.clone()
      .multiplyScalar(0.55)
      .add(side.clone().multiplyScalar(-0.35))
      .add(tangent.clone().multiplyScalar(-0.15))
      .normalize();
    const len = strandLen * (0.75 + rng.float() * 0.45);
    const w = strandW * (0.65 + rng.float() * 0.5);

    for (let cross = 0; cross < 2; cross++) {
      const angle = cross * Math.PI * 0.5 + rng.float() * 0.25;
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      const wDir = side.clone().multiplyScalar(ca * w).add(up.clone().multiplyScalar(sa * w * 0.35));
      const root = crest.clone().add(side.clone().multiplyScalar((rng.float() - 0.5) * w * 0.3));
      const tip = root.clone().add(fallDir.clone().multiplyScalar(len));
      addHairQuad(g, root, tip, wDir, hue, phase, rng);
    }
  }

  // forelock between ears
  const poll = neck[neck.length - 1]!;
  const prev = neck[neck.length - 2] ?? poll;
  const tan = poll.clone().sub(prev).normalize();
  const foreBase = poll.clone().add(new Vector3(0, 0.06, 0.06));
  for (let i = 0; i < 5; i++) {
    const spread = (i - 2) * strandW * 0.35;
    const root = foreBase.clone().add(new Vector3(spread, 0, 0.02 * i));
    const tip = root.clone().add(new Vector3(spread * 0.3, -0.02, strandLen * 0.55)).add(tan.clone().multiplyScalar(strandLen * 0.2));
    const wDir = new Vector3(strandW * 0.4, 0, spread * 0.1 + 0.01);
    addHairQuad(g, root, tip, wDir, hue, phase + 0.5, rng.fork(`fore${i}`));
  }
}

/** Tail hair cascade along tail curve. */
export function addTailHair(
  g: MeshGrower,
  points: readonly Vector3[],
  count: number,
  length: number,
  width: number,
  hue: number,
  phase: number,
  rng: Rng,
): void {
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const idx = Math.min(points.length - 2, Math.floor(t * (points.length - 1)));
    const localT = t * (points.length - 1) - idx;
    const p0 = points[idx]!;
    const p1 = points[idx + 1]!;
    const root = p0.clone().lerp(p1, localT);
    const tangent = p1.clone().sub(p0).normalize();
    const side = new Vector3().crossVectors(tangent, new Vector3(0, 1, 0)).normalize();
    const hang = new Vector3(0, -1, 0).multiplyScalar(0.7).add(tangent.clone().multiplyScalar(-0.35)).normalize();
    const spread = side.clone().multiplyScalar((rng.float() - 0.5) * width * 1.6);
    root.add(spread);
    const w = width * (0.45 + rng.float() * 0.55);
    const wDir = side.clone().multiplyScalar(w * (0.5 + rng.float() * 0.5));
    const tip = root.clone().add(hang.clone().multiplyScalar(length * (0.65 + rng.float() * 0.55)));
    addHairQuad(g, root, tip, wDir, hue, phase, rng);
    if (i % 2 === 0) {
      const wDir2 = new Vector3().crossVectors(hang, wDir).normalize().multiplyScalar(w * 0.45);
      addHairQuad(g, root, tip.clone().add(wDir2.clone().multiplyScalar(0.15)), wDir2, hue, phase, rng.fork(`t${i}`));
    }
  }
}

function addHairQuad(
  g: MeshGrower,
  base: Vector3,
  tip: Vector3,
  side: Vector3,
  hue: number,
  phase: number,
  rng: Rng,
): void {
  const s = side.clone().multiplyScalar(0.55 + rng.float() * 0.25);
  const n = new Vector3().crossVectors(tip.clone().sub(base), s).normalize();
  const v0 = g.vertex(base.x - s.x, base.y - s.y, base.z - s.z, n.x, n.y, n.z, 0, 0, hue, 0.82, phase, 0.55);
  const v1 = g.vertex(base.x + s.x, base.y + s.y, base.z + s.z, n.x, n.y, n.z, 1, 0, hue, 0.82, phase, 0.55);
  const v2 = g.vertex(tip.x + s.x, tip.y + s.y, tip.z + s.z, n.x, n.y, n.z, 1, 1, hue, 0.9, phase, 0.78);
  const v3 = g.vertex(tip.x - s.x, tip.y - s.y, tip.z - s.z, n.x, n.y, n.z, 0, 1, hue, 0.9, phase, 0.78);
  g.quad(v0, v1, v2, v3);
}

/** Small ear cone from a pivot. */
export function addEar(
  g: MeshGrower,
  base: Vector3,
  tip: Vector3,
  radius: number,
  ringSegs: number,
  hue: number,
  phase: number,
): void {
  addTubePath(g, [base, tip], [radius, radius * 0.12], {
    ringSegs,
    hue,
    part: 0.12,
    phase,
    aoBase: 0.62,
    aoTip: 0.78,
    capEnd: true,
  });
}
