/**
 * Procedural giant bamboo grove (*Phyllostachys edulis*).
 * Tree-form culm cluster — hollow ringed stems with feathery crown sprays.
 */

import { BufferGeometry, Vector3 } from 'three';
import type { Rng } from '../core/Seed';
import { MeshGrower } from './TubeMesh';

export interface BuiltBambooGrove {
  bark: BufferGeometry;
  foliage: BufferGeometry;
}

/** Gallery / continent-tree integration metadata. */
export const BAMBOO_GROVE_META = {
  id: 'bamboo-grove',
  label: 'Giant Bamboo',
  foliageColor: { r: 0.06, g: 0.2, b: 0.05, hueVar: 0.28 },
  barkLayer: 21,
} as const;

interface CulmSpec {
  x: number;
  z: number;
  height: number;
  radius: number;
  leanX: number;
  leanZ: number;
  hue: number;
}

function culmPoint(
  baseX: number,
  baseZ: number,
  y: number,
  height: number,
  leanX: number,
  leanZ: number,
): Vector3 {
  const t = y / height;
  return new Vector3(
    baseX + leanX * t * t * height,
    y,
    baseZ + leanZ * t * t * height,
  );
}

/** Single internode tube between two heights on a leaning culm. */
function addInternode(
  g: MeshGrower,
  spec: CulmSpec,
  y0: number,
  y1: number,
  r0: number,
  r1: number,
  sides: number,
  phase: number,
  segCount: number,
): void {
  const rings: number[][] = [];
  for (let i = 0; i <= segCount; i++) {
    const t = i / segCount;
    const y = y0 + (y1 - y0) * t;
    const r = r0 + (r1 - r0) * t;
    const p = culmPoint(spec.x, spec.z, y, spec.height, spec.leanX, spec.leanZ);
    const ring: number[] = [];
    const ao = 0.55 + 0.45 * (y / spec.height);
    const flex = 0.08 + 0.42 * (y / spec.height);

    for (let k = 0; k <= sides; k++) {
      const ang = (k / sides) * Math.PI * 2;
      const wobble = 1 + 0.012 * Math.sin(ang * 3 + phase + y * 2.5);
      const dx = Math.cos(ang) * r * wobble;
      const dz = Math.sin(ang) * r * wobble;
      ring.push(g.vertex(
        p.x + dx, p.y, p.z + dz,
        dx / r, 0.04, dz / r,
        k / sides, y * 1.8,
        spec.hue, flex, phase, ao,
      ));
    }
    rings.push(ring);
  }

  for (let i = 0; i < segCount; i++) {
    const a = rings[i]!;
    const b = rings[i + 1]!;
    for (let k = 0; k < sides; k++) g.quad(a[k]!, a[k + 1]!, b[k + 1]!, b[k]!);
  }
}

/** Bulging nodal ring — characteristic bamboo joint. */
function addNodeRing(
  g: MeshGrower,
  spec: CulmSpec,
  y: number,
  radius: number,
  sides: number,
  phase: number,
): void {
  const band = radius * 0.06;
  const bulge = 1.12 + 0.06 * Math.sin(y * 1.7 + phase);
  addInternode(g, spec, y - band * 0.5, y + band * 0.5, radius * bulge, radius * bulge * 0.98, sides, phase, 2);
}

function addBambooCulm(
  barkG: MeshGrower,
  folG: MeshGrower,
  spec: CulmSpec,
  rng: Rng,
  phase: number,
  sides: number,
): Vector3 {
  const nodeSpacing = rng.range(0.4, 0.6);
  const nodeCount = Math.max(2, Math.floor(spec.height / nodeSpacing));
  const actualSpacing = spec.height / nodeCount;
  let y = 0.02;
  let r = spec.radius;

  for (let n = 0; n < nodeCount; n++) {
    const yNext = n === nodeCount - 1 ? spec.height : y + actualSpacing;
    const taper = 1 - (yNext / spec.height) * 0.22;
    const rNext = spec.radius * taper;
    const segs = Math.max(2, Math.round((yNext - y) / 0.18));

    addInternode(barkG, spec, y, yNext, r, rNext, sides, phase + n * 0.3, segs);
    addNodeRing(barkG, spec, yNext, rNext, sides, phase + n * 0.5);

    if (n > nodeCount * 0.55 && rng.float() < 0.42) {
      const branchY = y + (yNext - y) * rng.range(0.35, 0.85);
      const branchOrigin = culmPoint(spec.x, spec.z, branchY, spec.height, spec.leanX, spec.leanZ);
      const az = rng.float() * Math.PI * 2;
      const pitch = rng.range(0.12, 0.55);
      const branchLen = rng.range(0.7, 1.8);
      const branchDir = new Vector3(
        Math.cos(az) * Math.cos(pitch),
        Math.sin(pitch),
        Math.sin(az) * Math.cos(pitch),
      ).normalize();
      const branchR = spec.radius * rng.range(0.28, 0.38);
      const branchSpec: CulmSpec = {
        x: branchOrigin.x,
        z: branchOrigin.z,
        height: branchLen,
        radius: branchR,
        leanX: branchDir.x * 0.35,
        leanZ: branchDir.z * 0.35,
        hue: spec.hue + rng.range(-0.06, 0.06),
      };
      const branchTip = culmPoint(
        branchSpec.x, branchSpec.z, branchLen, branchLen, branchSpec.leanX, branchSpec.leanZ,
      );
      addInternode(
        barkG, branchSpec, 0.02, branchLen, branchR, branchR * 0.72, 6, phase + n, 4,
      );
      scatterFeatherySprays(folG, branchOrigin, branchTip, branchDir, rng, phase + n, 2, 4);
    }

    y = yNext;
    r = rNext;
  }

  const tip = culmPoint(spec.x, spec.z, spec.height, spec.height, spec.leanX, spec.leanZ);
  const tipDir = new Vector3(spec.leanX * 0.15, 1, spec.leanZ * 0.15).normalize();
  scatterFeatherySprays(folG, tip, tip, tipDir, rng, phase, 4, 7);
  return tip;
}

function addLeafFrond(
  g: MeshGrower,
  base: Vector3,
  dir: Vector3,
  right: Vector3,
  len: number,
  width: number,
  droop: number,
  hue: number,
  phase: number,
): void {
  const nrm = new Vector3().crossVectors(right, dir).normalize();
  const tip = base.clone()
    .addScaledVector(dir, len * 0.55)
    .addScaledVector(right, width * 0.15)
    .add(new Vector3(0, -droop, 0));
  const midL = base.clone().addScaledVector(right, -width).addScaledVector(dir, len * 0.25);
  const midR = base.clone().addScaledVector(right, width).addScaledVector(dir, len * 0.25);
  const tail = base.clone().addScaledVector(dir, len).add(new Vector3(0, -droop * 1.2, 0));

  const v0 = g.vertex(base.x, base.y, base.z, nrm.x, nrm.y, nrm.z, 0.5, 0, hue, 0.55, phase, 0.82);
  const v1 = g.vertex(midL.x, midL.y, midL.z, nrm.x, nrm.y, nrm.z, 0, 0.5, hue, 0.72, phase, 0.88);
  const v2 = g.vertex(tip.x, tip.y, tip.z, nrm.x, nrm.y, nrm.z, 0.5, 1, hue, 0.85, phase, 0.92);
  g.tri(v0, v1, v2);

  const v3 = g.vertex(base.x, base.y, base.z, nrm.x, nrm.y, nrm.z, 0.5, 0, hue, 0.55, phase, 0.82);
  const v4 = g.vertex(midR.x, midR.y, midR.z, nrm.x, nrm.y, nrm.z, 1, 0.5, hue, 0.72, phase, 0.88);
  const v5 = g.vertex(tip.x, tip.y, tip.z, nrm.x, nrm.y, nrm.z, 0.5, 1, hue, 0.85, phase, 0.92);
  g.tri(v3, v5, v4);

  const v6 = g.vertex(tip.x, tip.y, tip.z, nrm.x, nrm.y, nrm.z, 0.5, 1, hue, 0.85, phase, 0.92);
  const v7 = g.vertex(tail.x, tail.y, tail.z, nrm.x, nrm.y, nrm.z, 0.5, 1.2, hue, 0.9, phase, 0.9);
  const v8 = g.vertex(midR.x, midR.y, midR.z, nrm.x, nrm.y, nrm.z, 1, 0.5, hue, 0.72, phase, 0.88);
  g.tri(v6, v7, v8);
}

function scatterFeatherySprays(
  folG: MeshGrower,
  origin: Vector3,
  tip: Vector3,
  dir: Vector3,
  rng: Rng,
  phase: number,
  minSprays: number,
  maxSprays: number,
): void {
  const sprays = minSprays + rng.int(maxSprays - minSprays + 1);
  const up = Math.abs(dir.y) < 0.85 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  const baseRight = new Vector3().crossVectors(dir, up).normalize();

  for (let s = 0; s < sprays; s++) {
    const along = rng.range(0.65, 1.0);
    const anchor = origin.clone().lerp(tip, along);
    const yaw = rng.range(0, Math.PI * 2);
    const pitchSpread = rng.range(-0.35, 0.55);
    const sprayDir = dir.clone()
      .applyAxisAngle(new Vector3(0, 1, 0), yaw)
      .add(new Vector3(0, pitchSpread, 0))
      .normalize();
    const right = baseRight.clone().applyAxisAngle(dir, yaw).normalize();
    const fronds = 2 + rng.int(3);
    const hue = rng.range(0.08, 0.32);

    for (let f = 0; f < fronds; f++) {
      const fan = (f / Math.max(1, fronds - 1) - 0.5) * 1.4;
      const frondDir = sprayDir.clone()
        .addScaledVector(right, fan * 0.35)
        .normalize();
      const len = rng.range(0.35, 0.72);
      const width = rng.range(0.06, 0.14);
      const droop = rng.range(0.08, 0.22);
      addLeafFrond(folG, anchor, frondDir, right, len, width, droop, hue, phase + s + f * 0.2);
    }
  }
}

/**
 * Giant bamboo culm cluster — 5–9 ringed stems with layered crown foliage.
 */
export function buildBambooGrove(rng: Rng): BuiltBambooGrove {
  const barkG = new MeshGrower();
  const folG = new MeshGrower();
  const phase = rng.float() * Math.PI * 2;
  const culmCount = 5 + rng.int(5);
  const sides = 10;
  const tips: Vector3[] = [];

  for (let c = 0; c < culmCount; c++) {
    const clusterR = rng.range(0.0, 1.6);
    const clusterAng = (c / culmCount) * Math.PI * 2 + rng.range(-0.4, 0.4);
    const height = rng.range(8.0, 14.0);
    const spec: CulmSpec = {
      x: Math.cos(clusterAng) * clusterR,
      z: Math.sin(clusterAng) * clusterR,
      height,
      radius: rng.range(0.055, 0.095) * (0.85 + height / 14 * 0.2),
      leanX: rng.range(-0.06, 0.06),
      leanZ: rng.range(-0.06, 0.06),
      hue: rng.range(0.12, 0.38),
    };
    tips.push(addBambooCulm(barkG, folG, spec, rng, phase + c * 0.9, sides));
  }

  if (tips.length > 0) {
    const center = new Vector3();
    let maxY = 0;
    for (const t of tips) {
      center.add(t);
      maxY = Math.max(maxY, t.y);
    }
    center.multiplyScalar(1 / tips.length);
    folG.bendNormals(center, maxY - center.y + 1.8, 0.48);
    folG.crownAO(center, maxY - center.y + 2.2, 0.35);
  }

  return { bark: barkG.build(), foliage: folG.build() };
}
