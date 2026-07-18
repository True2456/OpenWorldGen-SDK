/**
 * Spekboom / Elephant Bush (*Portulacaria afra*).
 * Woody succulent shrub with reddish stems and thick jade-green rounded leaves.
 */

import { BufferGeometry, DoubleSide, Vector3 } from 'three';
import { MeshPhysicalNodeMaterial } from 'three/webgpu';
import { attribute, mix, smoothstep, varying, vec3 } from 'three/tsl';
import type { Rng } from '../core/Seed';
import { MeshGrower } from './TubeMesh';
import type { NV3, NV4 } from '../gpu/TSLTypes';

/** Jade leaves with reddish succulent stems. */
export function spekboomMaterial(): MeshPhysicalNodeMaterial {
  const mat = new MeshPhysicalNodeMaterial();
  mat.specularIntensity = 0.32;
  const d = attribute('vdata', 'vec4') as unknown as NV4;
  const stem = vec3(0.28, 0.08, 0.05);
  const leaf = vec3(0.06, 0.22, 0.09);
  const stemK = smoothstep(0.22, 0.08, d.x);
  const albedo = mix(leaf, stem, stemK) as unknown as NV3;
  mat.colorNode = varying(
    albedo.mul(d.w.mul(0.75).add(0.25)) as unknown as Parameters<typeof varying>[0],
  ) as unknown as typeof mat.colorNode;
  mat.roughness = 0.7;
  mat.metalness = 0;
  mat.side = DoubleSide;
  return mat;
}

function addBranch(
  g: MeshGrower,
  from: Vector3,
  to: Vector3,
  r0: number,
  r1: number,
  part: number,
  phase: number,
): void {
  const dir = new Vector3().subVectors(to, from).normalize();
  const ref = Math.abs(dir.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  const n = new Vector3().crossVectors(ref, dir).normalize();
  const b = new Vector3().crossVectors(dir, n).normalize();
  const sides = 5;
  const segs = 3;
  const rings: number[][] = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = from.clone().lerp(to, t);
    const r = r0 + (r1 - r0) * t;
    const ring: number[] = [];
    for (let k = 0; k <= sides; k++) {
      const ang = (k / sides) * Math.PI * 2;
      const dx = n.x * Math.cos(ang) + b.x * Math.sin(ang);
      const dy = n.y * Math.cos(ang) + b.y * Math.sin(ang);
      const dz = n.z * Math.cos(ang) + b.z * Math.sin(ang);
      ring.push(g.vertex(p.x + dx * r, p.y + dy * r, p.z + dz * r, dx, dy, dz, k / sides, t, part, 0.2, phase, 0.55 + 0.45 * t));
    }
    rings.push(ring);
  }
  for (let i = 0; i < segs; i++) {
    const rA = rings[i]!;
    const rB = rings[i + 1]!;
    for (let k = 0; k < sides; k++) g.quad(rA[k]!, rA[k + 1]!, rB[k + 1]!, rB[k]!);
  }
}

function addRoundedLeaf(
  g: MeshGrower,
  attach: Vector3,
  dir: Vector3,
  size: number,
  hue: number,
  phase: number,
): void {
  const up = Math.abs(dir.y) < 0.85 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  const right = new Vector3().crossVectors(dir, up).normalize();
  const nrm = new Vector3().crossVectors(right, dir).normalize();
  const w = size * 0.65;
  const h = size * 0.5;
  const thick = size * 0.18;

  const center = attach.clone().addScaledVector(dir, size * 0.35).add(new Vector3(0, h * 0.15, 0));
  const rows = 4;
  const cols = 5;
  const grid: number[][] = [];

  for (let i = 0; i <= rows; i++) {
    const s = i / rows;
    const row: number[] = [];
    const pMid = attach.clone().lerp(center, s);
    const rw = w * Math.sin(Math.PI * s);
    for (let j = 0; j <= cols; j++) {
      const t = -1 + 2 * (j / cols);
      const p = pMid.clone()
        .addScaledVector(right, rw * t)
        .addScaledVector(nrm, thick * (1 - Math.abs(t) * 0.5) * Math.sin(Math.PI * s));
      row.push(g.vertex(p.x, p.y, p.z, nrm.x, nrm.y, nrm.z, j / cols, s, hue, 0.35 + 0.45 * s, phase, 0.7 + 0.3 * s));
    }
    grid.push(row);
  }
  for (let i = 0; i < rows; i++) {
    const a = grid[i]!;
    const b = grid[i + 1]!;
    for (let j = 0; j < cols; j++) g.quad(a[j]!, b[j]!, b[j + 1]!, a[j + 1]!);
  }
}

function growShrub(
  g: MeshGrower,
  origin: Vector3,
  dir: Vector3,
  len: number,
  depth: number,
  maxDepth: number,
  rng: Rng,
  phase: number,
): void {
  const tip = origin.clone().addScaledVector(dir, len);
  const stemPart = depth === 0 ? 0.15 : 0.1;
  addBranch(g, origin, tip, len * 0.04, len * 0.018, stemPart, phase + depth);

  const leafPairs = 3 + rng.int(3);
  for (let i = 0; i < leafPairs; i++) {
    const t = 0.25 + (i / leafPairs) * 0.65;
    const p = origin.clone().lerp(tip, t);
    const az = rng.float() * Math.PI * 2;
    const leafDir = new Vector3(Math.cos(az), rng.range(0.1, 0.45), Math.sin(az)).normalize();
    addRoundedLeaf(g, p, leafDir, rng.range(0.022, 0.035), rng.range(0.38, 0.55), phase + i);
  }

  if (depth >= maxDepth) return;
  const children = depth === 0 ? 3 + rng.int(2) : 2 + rng.int(2);
  for (let c = 0; c < children; c++) {
    const az = (c / children) * Math.PI * 2 + rng.range(-0.4, 0.4);
    const pitch = rng.range(0.35, 0.95);
    const childDir = new Vector3(
      Math.cos(az) * Math.cos(pitch),
      Math.sin(pitch),
      Math.sin(az) * Math.cos(pitch),
    ).normalize();
    const startT = rng.range(0.45, 0.85);
    const childOrigin = origin.clone().lerp(tip, startT);
    growShrub(g, childOrigin, childDir, len * rng.range(0.45, 0.7), depth + 1, maxDepth, rng, phase + c);
  }
}

export function buildSpekboom(rng: Rng): BufferGeometry {
  const g = new MeshGrower();
  const phase = rng.float() * Math.PI * 2;
  const stems = 2 + rng.int(2);

  for (let s = 0; s < stems; s++) {
    const az = (s / stems) * Math.PI * 2 + rng.range(-0.3, 0.3);
    const pitch = rng.range(0.55, 0.95);
    const dir = new Vector3(
      Math.cos(az) * Math.cos(pitch) * 0.3,
      Math.sin(pitch),
      Math.sin(az) * Math.cos(pitch) * 0.3,
    ).normalize();
    const origin = new Vector3(
      Math.cos(az) * rng.range(0.02, 0.06),
      rng.range(0, 0.03),
      Math.sin(az) * rng.range(0.02, 0.06),
    );
    growShrub(g, origin, dir, rng.range(0.35, 0.55), 0, 2, rng.fork(`stem/${s}`), phase + s);
  }

  g.crownAO(new Vector3(0, 0.2, 0), 0.35, 0.52);
  return g.build();
}
