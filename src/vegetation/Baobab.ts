/**
 * Procedural African baobab (*Adansonia digitata*).
 * Bottle-shaped pale trunk, sparse crown of tiny leaf sprays at the crown.
 */

import { BufferGeometry, Vector3 } from 'three';
import type { Rng } from '../core/Seed';
import { MeshGrower } from './TubeMesh';

export interface BuiltBaobab {
  bark: BufferGeometry;
  foliage: BufferGeometry;
}

/** Gallery / continent-tree integration metadata. */
export const BAOBAB_META = {
  id: 'baobab',
  label: 'Baobab',
  foliageColor: { r: 0.07, g: 0.16, b: 0.05, hueVar: 0.18 },
  barkLayer: 7,
} as const;

interface BaobabBuildOpts {
  hero: boolean;
}

function addBottleTrunk(
  g: MeshGrower,
  H: number,
  rBase: number,
  rBulge: number,
  sides: number,
  rng: Rng,
  hero: boolean,
): void {
  const segs = hero ? 22 : 18;
  const rings: number[][] = [];
  const leanX = rng.range(-0.04, 0.04);
  const leanZ = rng.range(-0.04, 0.04);
  const phase = rng.float() * Math.PI * 2;
  const bulgeK = hero ? 0.9 : 0.85;

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const y = t * H;
    const profile = Math.sin(t * Math.PI) * bulgeK + Math.pow(1 - t, 2.2) * 0.35;
    const r = rBase + (rBulge - rBase) * profile;
    const px = leanX * t * t;
    const pz = leanZ * t * t;
    const ring: number[] = [];
    const ao = 0.45 + 0.55 * t;
    const wobbleAmp = hero ? 0.028 : 0.02;

    for (let k = 0; k <= sides; k++) {
      const ang = (k / sides) * Math.PI * 2;
      const wobble = 1 + rng.range(-wobbleAmp, wobbleAmp) * Math.sin(ang * 5 + phase);
      const dx = Math.cos(ang) * r * wobble;
      const dz = Math.sin(ang) * r * wobble;
      const nx = Math.cos(ang);
      const nz = Math.sin(ang);
      ring.push(
        g.vertex(
          px + dx, y, pz + dz,
          nx, 0.08, nz,
          k / sides, t * 6,
          0, 0.05, phase, ao,
        ),
      );
    }
    rings.push(ring);
  }

  for (let i = 0; i < segs; i++) {
    const r0 = rings[i]!;
    const r1 = rings[i + 1]!;
    for (let k = 0; k < sides; k++) {
      g.quad(r0[k]!, r0[k + 1]!, r1[k + 1]!, r1[k]!);
    }
  }

  addRootFlare(g, rBase, rng, phase, hero);
}

function addRootFlare(
  g: MeshGrower,
  rBase: number,
  rng: Rng,
  phase: number,
  hero: boolean,
): void {
  const flareCount = hero ? 6 + rng.int(2) : 4 + rng.int(2);
  const lenMul = hero ? [2.0, 3.0] as const : [1.8, 2.6] as const;
  const w0Mul = hero ? 0.68 : 0.55;

  for (let f = 0; f < flareCount; f++) {
    const ang = (f / flareCount) * Math.PI * 2 + rng.range(-0.2, 0.2);
    const dir = new Vector3(Math.cos(ang), hero ? 0.22 : 0.15, Math.sin(ang)).normalize();
    const len = rBase * rng.range(lenMul[0], lenMul[1]);
    const w0 = rBase * w0Mul;
    const w1 = rBase * (hero ? 0.1 : 0.12);
    const p0 = new Vector3(0, 0.02, 0);
    const bend = hero ? rng.range(-0.08, 0.08) : 0;
    const p1 = new Vector3(
      dir.x * len * 0.55 + bend,
      dir.y * len * (hero ? 0.48 : 0.4),
      dir.z * len * 0.55,
    );
    const p2 = new Vector3(
      dir.x * len,
      dir.y * len * (hero ? 0.18 : 0.15),
      dir.z * len,
    );
    const side = new Vector3(-dir.z, 0, dir.x).normalize();
    const v0L = g.vertex(p0.x - side.x * w0, p0.y, p0.z - side.z * w0, 0, 1, 0, 0, 0, 0, 0, phase, 0.4);
    const v0R = g.vertex(p0.x + side.x * w0, p0.y, p0.z + side.z * w0, 0, 1, 0, 1, 0, 0, 0, phase, 0.4);
    const v1L = g.vertex(p1.x - side.x * w0 * 0.7, p1.y, p1.z - side.z * w0 * 0.7, dir.x, 0.3, dir.z, 0, 0.5, 0, 0, phase, 0.5);
    const v1R = g.vertex(p1.x + side.x * w0 * 0.7, p1.y, p1.z + side.z * w0 * 0.7, dir.x, 0.3, dir.z, 1, 0.5, 0, 0, phase, 0.5);
    const v2L = g.vertex(p2.x - side.x * w1, p2.y, p2.z - side.z * w1, dir.x, 0.2, dir.z, 0, 1, 0, 0, phase, 0.55);
    const v2R = g.vertex(p2.x + side.x * w1, p2.y, p2.z + side.z * w1, dir.x, 0.2, dir.z, 1, 1, 0, 0, phase, 0.55);
    g.quad(v0L, v0R, v1R, v1L);
    g.quad(v1L, v1R, v2R, v2L);
  }

  if (hero) {
    const buttressCount = 3 + rng.int(2);
    for (let b = 0; b < buttressCount; b++) {
      const ang = (b / buttressCount) * Math.PI * 2 + rng.range(-0.35, 0.35) + phase * 0.15;
      const dir = new Vector3(Math.cos(ang), 0.08, Math.sin(ang)).normalize();
      const len = rBase * rng.range(1.2, 1.8);
      const w = rBase * rng.range(0.22, 0.32);
      const side = new Vector3(-dir.z, 0, dir.x).normalize();
      const p0 = new Vector3(dir.x * rBase * 0.35, 0.01, dir.z * rBase * 0.35);
      const p1 = new Vector3(dir.x * len * 0.7, dir.y * len * 0.25, dir.z * len * 0.7);
      const v0L = g.vertex(p0.x - side.x * w, p0.y, p0.z - side.z * w, 0, 1, 0, 0, 0, 0, 0, phase, 0.42);
      const v0R = g.vertex(p0.x + side.x * w, p0.y, p0.z + side.z * w, 0, 1, 0, 1, 0, 0, 0, phase, 0.42);
      const v1L = g.vertex(p1.x - side.x * w * 0.45, p1.y, p1.z - side.z * w * 0.45, dir.x, 0.25, dir.z, 0, 0.6, 0, 0, phase, 0.48);
      const v1R = g.vertex(p1.x + side.x * w * 0.45, p1.y, p1.z + side.z * w * 0.45, dir.x, 0.25, dir.z, 1, 0.6, 0, 0, phase, 0.48);
      g.quad(v0L, v0R, v1R, v1L);
    }
  }
}

function addCrownBranch(
  g: MeshGrower,
  origin: Vector3,
  dir: Vector3,
  len: number,
  radius: number,
  sides: number,
  phase: number,
  segs = 4,
): void {
  const rings: number[][] = [];
  const up = Math.abs(dir.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  const n = new Vector3().crossVectors(up, dir).normalize();
  const b = new Vector3().crossVectors(dir, n).normalize();

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = origin.clone().addScaledVector(dir, len * t);
    const r = radius * (1 - t * 0.65);
    const ring: number[] = [];
    for (let k = 0; k <= sides; k++) {
      const ang = (k / sides) * Math.PI * 2;
      const dx = n.x * Math.cos(ang) + b.x * Math.sin(ang);
      const dy = n.y * Math.cos(ang) + b.y * Math.sin(ang);
      const dz = n.z * Math.cos(ang) + b.z * Math.sin(ang);
      ring.push(g.vertex(p.x + dx * r, p.y + dy * r, p.z + dz * r, dx, dy, dz, k / sides, t, 0, 0.2, phase, 0.7 + 0.3 * t));
    }
    rings.push(ring);
  }
  for (let i = 0; i < segs; i++) {
    const r0 = rings[i]!;
    const r1 = rings[i + 1]!;
    for (let k = 0; k < sides; k++) g.quad(r0[k]!, r0[k + 1]!, r1[k + 1]!, r1[k]!);
  }
}

function addCurvedCrownBranch(
  g: MeshGrower,
  origin: Vector3,
  dir: Vector3,
  len: number,
  radius: number,
  sides: number,
  phase: number,
  rng: Rng,
): Vector3 {
  const segs = 6;
  const droop = rng.range(0.08, 0.22);
  const sway = new Vector3(rng.range(-0.15, 0.15), 0, rng.range(-0.15, 0.15));
  const rings: number[][] = [];
  const up = Math.abs(dir.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  const n = new Vector3().crossVectors(up, dir).normalize();
  const b = new Vector3().crossVectors(dir, n).normalize();
  let tip = origin.clone();

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const sag = droop * t * t;
    const p = origin.clone()
      .addScaledVector(dir, len * t)
      .addScaledVector(sway, t * (1 - t) * 2);
    p.y -= sag;
    if (i === segs) tip = p.clone();
    const r = radius * (1 - t * 0.7);
    const ring: number[] = [];
    for (let k = 0; k <= sides; k++) {
      const ang = (k / sides) * Math.PI * 2;
      const dx = n.x * Math.cos(ang) + b.x * Math.sin(ang);
      const dy = n.y * Math.cos(ang) + b.y * Math.sin(ang);
      const dz = n.z * Math.cos(ang) + b.z * Math.sin(ang);
      ring.push(g.vertex(p.x + dx * r, p.y + dy * r, p.z + dz * r, dx, dy, dz, k / sides, t, 0, 0.2, phase, 0.7 + 0.3 * t));
    }
    rings.push(ring);
  }
  for (let i = 0; i < segs; i++) {
    const r0 = rings[i]!;
    const r1 = rings[i + 1]!;
    for (let k = 0; k < sides; k++) g.quad(r0[k]!, r0[k + 1]!, r1[k + 1]!, r1[k]!);
  }
  return tip;
}

function addLeafSpray(
  g: MeshGrower,
  tip: Vector3,
  dir: Vector3,
  size: number,
  hue: number,
  phase: number,
): void {
  const up = Math.abs(dir.y) < 0.85 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  const right = new Vector3().crossVectors(dir, up).normalize();
  const nrm = new Vector3().crossVectors(right, dir).normalize();
  const w = size * 0.55;
  const h = size;

  const v0 = g.vertex(tip.x, tip.y, tip.z, nrm.x, nrm.y, nrm.z, 0.5, 0.5, hue, 0.6, phase, 0.85);
  const v1 = g.vertex(tip.x + right.x * w, tip.y + right.y * w + h * 0.3, tip.z + right.z * w, nrm.x, nrm.y, nrm.z, 0, 1, hue, 0.8, phase, 0.9);
  const v2 = g.vertex(tip.x - right.x * w, tip.y - right.y * w + h * 0.3, tip.z - right.z * w, nrm.x, nrm.y, nrm.z, 1, 1, hue, 0.8, phase, 0.9);
  g.tri(v0, v1, v2);

  const v3 = g.vertex(tip.x + dir.x * w * 0.3, tip.y + dir.y * w * 0.3 + h * 0.2, tip.z + dir.z * w * 0.3, right.x, right.y, right.z, 0.5, 0, hue, 0.6, phase, 0.85);
  const v4 = g.vertex(tip.x + dir.x * w + right.x * w * 0.5, tip.y + dir.y * w + right.y * w * 0.5 + h * 0.35, tip.z + dir.z * w + right.z * w * 0.5, right.x, right.y, right.z, 0, 1, hue, 0.8, phase, 0.9);
  const v5 = g.vertex(tip.x + dir.x * w - right.x * w * 0.5, tip.y + dir.y * w - right.y * w * 0.5 + h * 0.35, tip.z + dir.z * w - right.z * w * 0.5, right.x, right.y, right.z, 1, 1, hue, 0.8, phase, 0.9);
  g.tri(v3, v4, v5);
}

function scatterLeafSprays(
  folG: MeshGrower,
  origin: Vector3,
  tip: Vector3,
  dir: Vector3,
  rng: Rng,
  phase: number,
  hero: boolean,
): void {
  const sprays = hero ? 4 + rng.int(3) : 2 + rng.int(3);
  const sizeRange = hero ? [0.16, 0.28] as const : [0.12, 0.22] as const;

  for (let s = 0; s < sprays; s++) {
    const along = hero ? rng.range(0.55, 1.0) : 1.0;
    const anchor = origin.clone().lerp(tip, along);
    const spread = new Vector3(
      rng.range(-0.35, 0.35),
      rng.range(-0.12, hero ? 0.42 : 0.35),
      rng.range(-0.35, 0.35),
    );
    const sprayDir = dir.clone().add(spread).normalize();
    addLeafSpray(folG, anchor, sprayDir, rng.range(sizeRange[0], sizeRange[1]), rng.range(-0.15, 0.2), phase + s);
  }
}

function buildBaobabInternal(rng: Rng, opts: BaobabBuildOpts): BuiltBaobab {
  const { hero } = opts;
  const barkG = new MeshGrower();
  const folG = new MeshGrower();

  const H = hero ? rng.range(6.0, 9.0) : rng.range(5.5, 8.5);
  const rBase = hero ? rng.range(0.32, 0.42) : rng.range(0.28, 0.38);
  const rBulge = rBase * rng.range(hero ? 1.6 : 1.55, hero ? 1.92 : 1.85);
  const sides = hero ? 16 : 14;
  const phase = rng.float() * Math.PI * 2;

  addBottleTrunk(barkG, H * 0.88, rBase, rBulge, sides, rng, hero);

  const crownY = H * 0.88;
  const crownOrigin = new Vector3(0, crownY, 0);
  const branchCount = hero ? 7 + rng.int(4) : 5 + rng.int(4);

  for (let i = 0; i < branchCount; i++) {
    const az = (i / branchCount) * Math.PI * 2 + rng.range(-0.35, 0.35);
    const pitch = rng.range(hero ? 0.28 : 0.35, hero ? 0.92 : 0.85);
    const len = rng.range(hero ? 0.65 : 0.55, hero ? 1.35 : 1.1);
    const dir = new Vector3(
      Math.cos(az) * Math.cos(pitch),
      Math.sin(pitch),
      Math.sin(az) * Math.cos(pitch),
    ).normalize();
    const radius = rng.range(hero ? 0.03 : 0.025, hero ? 0.048 : 0.04);

    let tip: Vector3;
    if (hero) {
      tip = addCurvedCrownBranch(barkG, crownOrigin, dir, len, radius, 6, phase + i * 0.4, rng);
      if (rng.float() < 0.55) {
        const twigT = rng.range(0.45, 0.72);
        const twigOrigin = crownOrigin.clone().lerp(tip, twigT);
        const twigAz = az + rng.range(-0.6, 0.6);
        const twigPitch = pitch + rng.range(-0.25, 0.35);
        const twigDir = new Vector3(
          Math.cos(twigAz) * Math.cos(twigPitch),
          Math.sin(twigPitch),
          Math.sin(twigAz) * Math.cos(twigPitch),
        ).normalize();
        const twigLen = len * rng.range(0.28, 0.48);
        const twigTip = addCurvedCrownBranch(
          barkG, twigOrigin, twigDir, twigLen, radius * 0.55, 5, phase + i * 0.7, rng,
        );
        scatterLeafSprays(folG, twigOrigin, twigTip, twigDir, rng, phase + i, true);
      }
    } else {
      addCrownBranch(barkG, crownOrigin, dir, len, radius, 6, phase);
      tip = crownOrigin.clone().addScaledVector(dir, len);
    }

    scatterLeafSprays(folG, crownOrigin, tip, dir, rng, phase + i, hero);
  }

  folG.bendNormals(new Vector3(0, crownY + (hero ? 0.45 : 0.3), 0), hero ? 1.35 : 1.2, hero ? 0.42 : 0.35);

  return { bark: barkG.build(), foliage: folG.build() };
}

/** Standard baobab — bottle trunk with sparse crown sprays. */
export function buildBaobab(rng: Rng): BuiltBaobab {
  return buildBaobabInternal(rng, { hero: false });
}

/** UE5 hero-gallery baobab — wider silhouette, richer crown, stronger root flare. */
export function buildBaobabHero(rng: Rng): BuiltBaobab {
  return buildBaobabInternal(rng, { hero: true });
}
