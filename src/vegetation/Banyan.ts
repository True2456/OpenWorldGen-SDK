/**
 * Banyan Fig (*Ficus benghalensis*) — massive spreading Asian strangler fig.
 * Hybrid builder: custom aerial prop-root / pillar-trunk bark mesh plus
 * tree-grammar crown foliage cards from BANYAN species params.
 */

import { BufferGeometry, Matrix4, Vector3 } from 'three';
import type { Rng } from '../core/Seed';
import { TROPICAL_FIG } from './Species';
import { buildTree } from './TreeBuilder';
import { MeshGrower } from './TubeMesh';
import type { SpeciesParams } from './VegTypes';

/** Gallery / continent-tree integration metadata. */
export const BANYAN: SpeciesParams = {
  ...TROPICAL_FIG,
  id: 'banyan',
  label: 'Banyan Fig (Ficus benghalensis)',
  height: [9, 14],
  trunkRadiusK: 0.026,
  crown: 'irregular',
  asym: 0.36,
  levels: [
    {
      ...TROPICAL_FIG.levels[0]!,
      segs: 9,
      wander: 0.09,
      taper: 1.15,
    },
    {
      ...TROPICAL_FIG.levels[1]!,
      density: 1.35,
      childStart: 0.42,
      childEnd: 0.94,
      angleBase: 1.54,
      angleTip: 0.2,
      lenRatio: 0.82,
      lenJitter: 0.32,
      radRatio: 0.5,
      droop: 0.1,
      tipCurl: 0.06,
    },
    {
      ...TROPICAL_FIG.levels[2]!,
      density: 3.6,
      childStart: 0.18,
      childEnd: 0.98,
      angleBase: 0.9,
      lenRatio: 0.46,
      droop: 0.16,
      planar: 0.75,
    },
    {
      ...TROPICAL_FIG.levels[3]!,
      density: 8.8,
      childStart: 0.1,
      childEnd: 1.0,
      lenRatio: 0.32,
      planar: 0.85,
      droop: 0.1,
    },
  ],
  foliage: TROPICAL_FIG.foliage
    ? {
        ...TROPICAL_FIG.foliage,
        spacing: 0.085,
        scale: [0.2, 0.32],
        clusterSize: [3, 5],
        normalBend: 0.74,
        card: { ...TROPICAL_FIG.foliage.card, sizeK: 2.7 },
        leaf: { ...TROPICAL_FIG.foliage.leaf, len: 1.15, width: 0.58, fold: 0.26, curl: 0.16 },
      }
    : null,
  flare: { amp: 0.72, height: 1.05, lobes: 7 },
  barkLayer: 20,
  barkRepeats: 4,
  foliageColor: { r: 0.022, g: 0.095, b: 0.02, hueVar: 0.24 },
  brokenTop: 0,
  stubChance: 0.02,
};

function appendGeometry(g: MeshGrower, src: BufferGeometry, m: Matrix4): void {
  const pos = src.getAttribute('position');
  const nrm = src.getAttribute('normal');
  const uvA = src.getAttribute('uv');
  const dat = src.getAttribute('vdata');
  const idx = src.getIndex();
  const p = new Vector3();
  const n = new Vector3();
  const base = g.vertCount;
  for (let i = 0; i < pos.count; i++) {
    p.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(m);
    n.set(nrm.getX(i), nrm.getY(i), nrm.getZ(i)).transformDirection(m);
    g.vertex(
      p.x, p.y, p.z, n.x, n.y, n.z,
      uvA ? uvA.getX(i) : 0, uvA ? uvA.getY(i) : 0,
      dat ? dat.getX(i) : 0, dat ? dat.getY(i) : 0,
      dat ? dat.getZ(i) : 0, dat ? dat.getW(i) : 1,
    );
  }
  if (idx) {
    for (let i = 0; i < idx.count; i += 3) {
      g.tri(base + idx.getX(i), base + idx.getX(i + 1), base + idx.getX(i + 2));
    }
  }
}

function addCurvedPropRoot(
  g: MeshGrower,
  top: Vector3,
  ground: Vector3,
  rTop: number,
  rBase: number,
  sides: number,
  phase: number,
  rng: Rng,
): void {
  const segs = 10 + rng.int(4);
  const sway = new Vector3(rng.range(-0.35, 0.35), 0, rng.range(-0.35, 0.35));
  const up = new Vector3(0, 1, 0);
  const n = new Vector3().crossVectors(up, new Vector3().subVectors(ground, top).normalize()).normalize();
  if (n.lengthSq() < 0.01) n.set(1, 0, 0);
  const b = new Vector3().crossVectors(up, n).normalize();
  const rings: number[][] = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const sag = t * t * 0.18;
    const p = top.clone().lerp(ground, t).addScaledVector(sway, t * (1 - t) * 2.2);
    p.y -= sag;
    const r = rTop + (rBase - rTop) * Math.pow(t, 0.72);
    const ring: number[] = [];
    const ao = 0.38 + 0.62 * (1 - t);
    for (let k = 0; k <= sides; k++) {
      const ang = (k / sides) * Math.PI * 2;
      const wobble = 1 + rng.range(-0.025, 0.025) * Math.sin(ang * 4 + phase);
      const dx = n.x * Math.cos(ang) + b.x * Math.sin(ang);
      const dz = n.z * Math.cos(ang) + b.z * Math.sin(ang);
      const dy = n.y * Math.cos(ang) + b.y * Math.sin(ang);
      ring.push(g.vertex(p.x + dx * r * wobble, p.y + dy * r * wobble, p.z + dz * r * wobble, dx, dy, dz, k / sides, t * 7, 0, 0.04, phase, ao));
    }
    rings.push(ring);
  }
  for (let i = 0; i < segs; i++) {
    const rA = rings[i]!;
    const rB = rings[i + 1]!;
    for (let k = 0; k < sides; k++) g.quad(rA[k]!, rA[k + 1]!, rB[k + 1]!, rB[k]!);
  }
}

function addCentralTrunk(
  g: MeshGrower,
  H: number,
  rBase: number,
  sides: number,
  rng: Rng,
  phase: number,
): void {
  const segs = 16;
  const rings: number[][] = [];
  const leanX = rng.range(-0.03, 0.03);
  const leanZ = rng.range(-0.03, 0.03);

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const y = t * H;
    const flare = Math.pow(1 - t, 2.4) * 0.42;
    const r = rBase * (0.72 + 0.28 * (1 - t) + flare);
    const px = leanX * t * t * H;
    const pz = leanZ * t * t * H;
    const ring: number[] = [];
    const ao = 0.44 + 0.56 * t;
    for (let k = 0; k <= sides; k++) {
      const ang = (k / sides) * Math.PI * 2;
      const wobble = 1 + rng.range(-0.022, 0.022) * Math.sin(ang * 6 + phase);
      const dx = Math.cos(ang) * r * wobble;
      const dz = Math.sin(ang) * r * wobble;
      ring.push(g.vertex(px + dx, y, pz + dz, Math.cos(ang), 0.06, Math.sin(ang), k / sides, t * 6, 0, 0.05, phase, ao));
    }
    rings.push(ring);
  }
  for (let i = 0; i < segs; i++) {
    const rA = rings[i]!;
    const rB = rings[i + 1]!;
    for (let k = 0; k < sides; k++) g.quad(rA[k]!, rA[k + 1]!, rB[k + 1]!, rB[k]!);
  }

  const flareCount = 6 + rng.int(2);
  for (let f = 0; f < flareCount; f++) {
    const ang = (f / flareCount) * Math.PI * 2 + rng.range(-0.18, 0.18);
    const dir = new Vector3(Math.cos(ang), 0.18, Math.sin(ang)).normalize();
    const len = rBase * rng.range(1.6, 2.4);
    const w0 = rBase * 0.62;
    const w1 = rBase * 0.12;
    const side = new Vector3(-dir.z, 0, dir.x).normalize();
    const p0 = new Vector3(0, 0.02, 0);
    const p1 = new Vector3(dir.x * len * 0.55, dir.y * len * 0.42, dir.z * len * 0.55);
    const p2 = new Vector3(dir.x * len, dir.y * len * 0.14, dir.z * len);
    const v0L = g.vertex(p0.x - side.x * w0, p0.y, p0.z - side.z * w0, 0, 1, 0, 0, 0, 0, 0, phase, 0.4);
    const v0R = g.vertex(p0.x + side.x * w0, p0.y, p0.z + side.z * w0, 0, 1, 0, 1, 0, 0, 0, phase, 0.4);
    const v1L = g.vertex(p1.x - side.x * w0 * 0.68, p1.y, p1.z - side.z * w0 * 0.68, dir.x, 0.28, dir.z, 0, 0.5, 0, 0, phase, 0.5);
    const v1R = g.vertex(p1.x + side.x * w0 * 0.68, p1.y, p1.z + side.z * w0 * 0.68, dir.x, 0.28, dir.z, 1, 0.5, 0, 0, phase, 0.5);
    const v2L = g.vertex(p2.x - side.x * w1, p2.y, p2.z - side.z * w1, dir.x, 0.18, dir.z, 0, 1, 0, 0, phase, 0.55);
    const v2R = g.vertex(p2.x + side.x * w1, p2.y, p2.z + side.z * w1, dir.x, 0.18, dir.z, 1, 1, 0, 0, phase, 0.55);
    g.quad(v0L, v0R, v1R, v1L);
    g.quad(v1L, v1R, v2R, v2L);
  }
}

function addPillarTrunk(
  g: MeshGrower,
  base: Vector3,
  topY: number,
  rBase: number,
  rTop: number,
  sides: number,
  phase: number,
  rng: Rng,
): void {
  const top = new Vector3(base.x + rng.range(-0.15, 0.15), topY, base.z + rng.range(-0.15, 0.15));
  addCurvedPropRoot(g, top, base, rTop * 0.85, rBase, sides, phase + base.x, rng);
}

function addScaffoldBranch(
  g: MeshGrower,
  origin: Vector3,
  dir: Vector3,
  len: number,
  radius: number,
  sides: number,
  phase: number,
  rng: Rng,
): Vector3 {
  const segs = 5;
  const droop = rng.range(0.04, 0.14);
  const sway = new Vector3(rng.range(-0.12, 0.12), 0, rng.range(-0.12, 0.12));
  const up = Math.abs(dir.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  const n = new Vector3().crossVectors(up, dir).normalize();
  const b = new Vector3().crossVectors(dir, n).normalize();
  const rings: number[][] = [];
  let tip = origin.clone();

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = origin.clone()
      .addScaledVector(dir, len * t)
      .addScaledVector(sway, t * (1 - t) * 2);
    p.y -= droop * t * t * len;
    if (i === segs) tip = p.clone();
    const r = radius * (1 - t * 0.55);
    const ring: number[] = [];
    for (let k = 0; k <= sides; k++) {
      const ang = (k / sides) * Math.PI * 2;
      const dx = n.x * Math.cos(ang) + b.x * Math.sin(ang);
      const dy = n.y * Math.cos(ang) + b.y * Math.sin(ang);
      const dz = n.z * Math.cos(ang) + b.z * Math.sin(ang);
      ring.push(g.vertex(p.x + dx * r, p.y + dy * r, p.z + dz * r, dx, dy, dz, k / sides, t, 0, 0.15, phase, 0.65 + 0.35 * t));
    }
    rings.push(ring);
  }
  for (let i = 0; i < segs; i++) {
    const rA = rings[i]!;
    const rB = rings[i + 1]!;
    for (let k = 0; k < sides; k++) g.quad(rA[k]!, rA[k + 1]!, rB[k + 1]!, rB[k]!);
  }
  return tip;
}

function addPropRootMesh(
  barkG: MeshGrower,
  crownY: number,
  spread: number,
  rng: Rng,
  phase: number,
): void {
  const sides = 10;
  const propCount = 7 + rng.int(5);
  const pillarCount = 3 + rng.int(3);

  for (let p = 0; p < pillarCount; p++) {
    const az = (p / pillarCount) * Math.PI * 2 + rng.range(-0.4, 0.4) + phase * 0.2;
    const dist = spread * rng.range(0.55, 0.88);
    const base = new Vector3(Math.cos(az) * dist, 0.02, Math.sin(az) * dist);
    const topY = crownY * rng.range(0.42, 0.72);
    addPillarTrunk(barkG, base, topY, rng.range(0.14, 0.26), rng.range(0.05, 0.1), sides, phase + p, rng);
  }

  for (let i = 0; i < propCount; i++) {
    const az = (i / propCount) * Math.PI * 2 + rng.range(-0.35, 0.35);
    const dist = spread * rng.range(0.5, 0.98);
    const ground = new Vector3(Math.cos(az) * dist, 0.02, Math.sin(az) * dist);
    const along = rng.range(0.35, 0.82);
    const topX = ground.x * along + rng.range(-spread * 0.12, spread * 0.12);
    const topZ = ground.z * along + rng.range(-spread * 0.12, spread * 0.12);
    const topY = crownY + rng.range(-1.8, 2.2);
    const top = new Vector3(topX, topY, topZ);
    const thick = rng.float() < 0.35;
    addCurvedPropRoot(
      barkG,
      top,
      ground,
      thick ? rng.range(0.07, 0.12) : rng.range(0.035, 0.065),
      thick ? rng.range(0.16, 0.24) : rng.range(0.08, 0.14),
      sides,
      phase + i * 0.55,
      rng,
    );
  }
}

function addScaffoldLimbs(
  barkG: MeshGrower,
  trunkTop: Vector3,
  spread: number,
  rng: Rng,
  phase: number,
): void {
  const limbCount = 5 + rng.int(4);
  const sides = 8;
  for (let i = 0; i < limbCount; i++) {
    const az = (i / limbCount) * Math.PI * 2 + rng.range(-0.3, 0.3);
    const pitch = rng.range(0.08, 0.38);
    const len = spread * rng.range(0.55, 0.95);
    const dir = new Vector3(
      Math.cos(az) * Math.cos(pitch),
      Math.sin(pitch),
      Math.sin(az) * Math.cos(pitch),
    ).normalize();
    const radius = rng.range(0.06, 0.11);
    const tip = addScaffoldBranch(barkG, trunkTop, dir, len, radius, sides, phase + i * 0.35, rng);

    if (rng.float() < 0.65) {
      const rootT = rng.range(0.45, 0.88);
      const anchor = trunkTop.clone().lerp(tip, rootT);
      const groundAz = az + rng.range(-0.25, 0.25);
      const groundDist = len * rootT * rng.range(0.85, 1.05);
      const ground = new Vector3(Math.cos(groundAz) * groundDist, 0.02, Math.sin(groundAz) * groundDist);
      addCurvedPropRoot(barkG, anchor, ground, rng.range(0.04, 0.08), rng.range(0.1, 0.18), sides, phase + i, rng);
    }
  }
}

/**
 * Banyan fig — hybrid custom prop-root bark plus tree-grammar crown foliage.
 */
export function buildBanyan(rng: Rng): { bark: BufferGeometry; foliage: BufferGeometry | null } {
  const barkG = new MeshGrower();
  const phase = rng.float() * Math.PI * 2;
  const sides = 12;

  const trunkH = rng.range(4.2, 6.2);
  const rBase = rng.range(0.32, 0.46);
  addCentralTrunk(barkG, trunkH, rBase, sides, rng, phase);

  const trunkTop = new Vector3(0, trunkH, 0);
  const spread = rng.range(5.2, 8.2);
  addScaffoldLimbs(barkG, trunkTop, spread, rng, phase);

  const crown = buildTree(BANYAN, rng.fork('crown'), { foliageMode: 'cards' });
  const crownLift = trunkH * 0.82;
  const m = new Matrix4().makeTranslation(0, crownLift, 0);
  appendGeometry(barkG, crown.bark, m);

  const crownY = crownLift + crown.skeleton.crownCenterY;
  addPropRootMesh(barkG, crownY, spread, rng.fork('props'), phase);

  return { bark: barkG.build(), foliage: crown.foliage };
}
