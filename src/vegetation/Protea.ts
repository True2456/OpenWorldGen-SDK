/**
 * King Protea (*Protea cynaroides*) — South Africa's national flower.
 * Woody stem, leathery basal leaves, large bowl of pink pointed bracts
 * surrounding a dark central cone.
 */

import { BufferGeometry, Vector3 } from 'three';
import type { Rng } from '../core/Seed';
import { MeshGrower } from './TubeMesh';

function addStem(
  g: MeshGrower,
  base: Vector3,
  top: Vector3,
  r0: number,
  r1: number,
  phase: number,
): void {
  const dir = new Vector3().subVectors(top, base).normalize();
  const ref = Math.abs(dir.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  const n = new Vector3().crossVectors(ref, dir).normalize();
  const b = new Vector3().crossVectors(dir, n).normalize();
  const sides = 6;
  const segs = 5;
  const rings: number[][] = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = base.clone().lerp(top, t);
    const r = r0 + (r1 - r0) * t;
    const ring: number[] = [];
    for (let k = 0; k <= sides; k++) {
      const ang = (k / sides) * Math.PI * 2;
      const dx = n.x * Math.cos(ang) + b.x * Math.sin(ang);
      const dy = n.y * Math.cos(ang) + b.y * Math.sin(ang);
      const dz = n.z * Math.cos(ang) + b.z * Math.sin(ang);
      ring.push(g.vertex(p.x + dx * r, p.y + dy * r, p.z + dz * r, dx, dy, dz, k / sides, t, 0, 0.15, phase, 0.55 + 0.45 * t));
    }
    rings.push(ring);
  }
  for (let i = 0; i < segs; i++) {
    const rA = rings[i]!;
    const rB = rings[i + 1]!;
    for (let k = 0; k < sides; k++) g.quad(rA[k]!, rA[k + 1]!, rB[k + 1]!, rB[k]!);
  }
}

function addBasalLeaf(
  g: MeshGrower,
  origin: Vector3,
  yaw: number,
  L: number,
  W: number,
  phase: number,
): void {
  const dir = new Vector3(Math.cos(yaw), 0.12, Math.sin(yaw)).normalize();
  const up = new Vector3(0, 1, 0);
  const side = new Vector3().crossVectors(dir, up).normalize();
  const rows = 6;
  const cols = 5;
  const grid: number[][] = [];

  for (let i = 0; i <= rows; i++) {
    const s = i / rows;
    const row: number[] = [];
    const pMid = origin.clone().addScaledVector(dir, L * s);
    const w = W * Math.sin(Math.PI * s) * (1 - s * 0.15);
    for (let j = 0; j <= cols; j++) {
      const t = -1 + 2 * (j / cols);
      const cup = 0.08 * W * Math.pow(Math.abs(t), 1.4) * s;
      const p = pMid.clone().addScaledVector(side, w * t).add(new Vector3(0, cup, 0));
      const n = new Vector3(0, 1, 0).addScaledVector(dir, -0.2).normalize();
      row.push(g.vertex(p.x, p.y, p.z, n.x, n.y, n.z, j / cols, s, 0, 0.25 + 0.4 * s, phase, 0.65 + 0.35 * s));
    }
    grid.push(row);
  }
  for (let i = 0; i < rows; i++) {
    const a = grid[i]!;
    const b = grid[i + 1]!;
    for (let j = 0; j < cols; j++) g.quad(a[j]!, b[j]!, b[j + 1]!, a[j + 1]!);
  }
}

function addBract(
  g: MeshGrower,
  base: Vector3,
  dir: Vector3,
  len: number,
  width: number,
  part: number,
  phase: number,
): void {
  const up = Math.abs(dir.y) < 0.85 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  const right = new Vector3().crossVectors(dir, up).normalize();
  const tip = base.clone().addScaledVector(dir, len);
  const mid = base.clone().addScaledVector(dir, len * 0.55).addScaledVector(up, len * 0.08);

  const v0 = g.vertex(base.x, base.y, base.z, up.x, up.y, up.z, 0.5, 0, part, 0.3, phase, 0.7);
  const vL = g.vertex(mid.x - right.x * width, mid.y - right.y * width, mid.z - right.z * width, up.x, up.y, up.z, 0, 0.5, part, 0.5, phase, 0.85);
  const vR = g.vertex(mid.x + right.x * width, mid.y + right.y * width, mid.z + right.z * width, up.x, up.y, up.z, 1, 0.5, part, 0.5, phase, 0.85);
  const vT = g.vertex(tip.x, tip.y + width * 0.15, tip.z, dir.x, dir.y, dir.z, 0.5, 1, part, 0.7, phase, 0.95);
  g.tri(v0, vL, vT);
  g.tri(v0, vT, vR);
}

export function buildProtea(rng: Rng): BufferGeometry {
  const g = new MeshGrower();
  const phase = rng.float() * Math.PI * 2;
  const H = rng.range(0.55, 0.85);
  const headR = rng.range(0.14, 0.2);

  const stemBase = new Vector3(0, 0, 0);
  const stemTop = new Vector3(rng.range(-0.02, 0.02), H * 0.55, rng.range(-0.02, 0.02));
  addStem(g, stemBase, stemTop, rng.range(0.012, 0.018), rng.range(0.008, 0.012), phase);

  const leafCount = 5 + rng.int(3);
  for (let i = 0; i < leafCount; i++) {
    const yaw = (i / leafCount) * Math.PI * 2 + rng.range(-0.2, 0.2);
    addBasalLeaf(g, new Vector3(0, rng.range(0.02, 0.08), 0), yaw, rng.range(0.22, 0.32), rng.range(0.05, 0.08), phase + i);
  }

  const headCenter = stemTop.clone().add(new Vector3(0, headR * 0.35, 0));
  const bractCount = 28 + rng.int(12);

  for (let i = 0; i < bractCount; i++) {
    const az = (i / bractCount) * Math.PI * 2 + rng.range(-0.08, 0.08);
    const tilt = rng.range(0.55, 1.05);
    const dir = new Vector3(
      Math.cos(az) * Math.cos(tilt),
      Math.sin(tilt),
      Math.sin(az) * Math.cos(tilt),
    ).normalize();
    const base = headCenter.clone().addScaledVector(dir, headR * 0.15);
    addBract(g, base, dir, rng.range(0.1, 0.16), rng.range(0.018, 0.028), 1.0, phase + i * 0.1);
  }

  // Inner dark cone (vdata 0.5)
  const coneSegs = 10;
  const coneH = headR * 0.55;
  for (let i = 0; i < coneSegs; i++) {
    const az = (i / coneSegs) * Math.PI * 2;
    const dir = new Vector3(Math.cos(az) * 0.35, 1, Math.sin(az) * 0.35).normalize();
    const base = headCenter.clone().add(new Vector3(Math.cos(az) * headR * 0.08, -coneH * 0.1, Math.sin(az) * headR * 0.08));
    addBract(g, base, dir, coneH, headR * 0.06, 0.5, phase);
  }

  g.crownAO(headCenter, headR * 1.4, 0.5);
  return g.build();
}
