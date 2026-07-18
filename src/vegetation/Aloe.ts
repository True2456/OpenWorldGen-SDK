/**
 * Aloe (*Aloe vera*) — succulent rosette with thick spined leaves
 * and an optional tall orange flower spike.
 */

import { BufferGeometry, DoubleSide, Matrix4, Quaternion, Vector3 } from 'three';
import { MeshPhysicalNodeMaterial } from 'three/webgpu';
import { attribute, mix, smoothstep, varying, vec3 } from 'three/tsl';
import type { Rng } from '../core/Seed';
import { MeshGrower } from './TubeMesh';
import type { NV3, NV4 } from '../gpu/TSLTypes';

/** Blue-green succulent aloe with orange flower spike accents. */
export function aloeMaterial(): MeshPhysicalNodeMaterial {
  const mat = new MeshPhysicalNodeMaterial();
  mat.specularIntensity = 0.4;
  const d = attribute('vdata', 'vec4') as unknown as NV4;
  const leaf = vec3(0.04, 0.14, 0.08);
  const flower = vec3(1.4, 0.55, 0.08);
  const petalK = smoothstep(0.88, 0.95, d.x);
  const albedo = mix(leaf, flower, petalK) as unknown as NV3;
  mat.colorNode = varying(
    albedo.mul(d.w.mul(0.7).add(0.3)) as unknown as Parameters<typeof varying>[0],
  ) as unknown as typeof mat.colorNode;
  mat.roughness = 0.65;
  mat.metalness = 0;
  mat.side = DoubleSide;
  return mat;
}

function buildAloeLeaf(
  g: MeshGrower,
  m: Matrix4,
  L: number,
  W: number,
  thickness: number,
  hue: number,
  phase: number,
): void {
  const rows = 10;
  const cols = 8;
  const grid: number[][] = [];

  for (let i = 0; i <= rows; i++) {
    const s = i / rows;
    const row: number[] = [];
    const y = L * s * 0.92;
    const w = W * Math.pow(Math.sin(Math.PI * s), 0.55) * (1 - s * 0.08);
    const cup = thickness * (1 - Math.pow(Math.abs(s - 0.5) * 2, 1.5));

    for (let j = 0; j <= cols; j++) {
      const t = -1 + 2 * (j / cols);
      const p = new Vector3(w * t, y, cup * (1 - Math.abs(t) * 0.6));
      const n = new Vector3(t * 0.35, 0.25, 1).normalize();
      p.applyMatrix4(m);
      n.transformDirection(m).normalize();
      row.push(g.vertex(p.x, p.y, p.z, n.x, n.y, n.z, j / cols, s, hue, 0.15 + 0.55 * s, phase, 0.6 + 0.4 * s));
    }
    grid.push(row);
  }

  for (let i = 0; i < rows; i++) {
    const a = grid[i]!;
    const b = grid[i + 1]!;
    for (let j = 0; j < cols; j++) g.quad(a[j]!, b[j]!, b[j + 1]!, a[j + 1]!);
  }

  // Spine teeth along margins
  const teeth = 5 + Math.floor(W * 40);
  for (let t = 0; t < teeth; t++) {
    const s = 0.15 + (t / teeth) * 0.75;
    const y = L * s;
    const w = W * Math.pow(Math.sin(Math.PI * s), 0.55);
    for (const sign of [-1, 1]) {
      const p = new Vector3(sign * w, y, thickness * 0.3);
      const tip = new Vector3(sign * (w + 0.006), y + 0.008, thickness * 0.5);
      p.applyMatrix4(m);
      tip.applyMatrix4(m);
      const n = new Vector3(0, 0.3, 1).transformDirection(m).normalize();
      const v0 = g.vertex(p.x, p.y, p.z, n.x, n.y, n.z, 0.5, s, hue, 0.2, phase, 0.7);
      const v1 = g.vertex(tip.x, tip.y, tip.z, n.x, n.y, n.z, 0.5, s + 0.02, hue, 0.2, phase, 0.8);
      const side = new Vector3(sign, 0, 0).transformDirection(m).normalize();
      const v2 = g.vertex(p.x + side.x * 0.003, p.y + side.y * 0.003, p.z + side.z * 0.003, n.x, n.y, n.z, 0.5, s, hue, 0.2, phase, 0.7);
      g.tri(v0, v1, v2);
    }
  }
}

function addFlowerSpike(
  g: MeshGrower,
  base: Vector3,
  H: number,
  leanX: number,
  leanZ: number,
  phase: number,
): void {
  const segs = 12;
  const sides = 6;
  const rings: number[][] = [];
  const lean = new Vector3(leanX, 1, leanZ).normalize();

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const y = t * H;
    const r = 0.012 * (1 - t * 0.5);
    const p = base.clone().addScaledVector(lean, y * 0.08);
    p.y = base.y + y;
    const ring: number[] = [];
    for (let k = 0; k <= sides; k++) {
      const ang = (k / sides) * Math.PI * 2;
      ring.push(g.vertex(
        p.x + Math.cos(ang) * r, p.y, p.z + Math.sin(ang) * r,
        Math.cos(ang), 0, Math.sin(ang),
        k / sides, t, t > 0.7 ? 1.0 : 0, 0.3, phase, 0.7 + 0.3 * t,
      ));
    }
    rings.push(ring);
  }
  for (let i = 0; i < segs; i++) {
    const r0 = rings[i]!;
    const r1 = rings[i + 1]!;
    for (let k = 0; k < sides; k++) g.quad(r0[k]!, r0[k + 1]!, r1[k + 1]!, r1[k]!);
  }

  // Tubular flowers along spike
  const flowers = 14;
  for (let f = 0; f < flowers; f++) {
    const t = 0.35 + (f / flowers) * 0.6;
    const y = base.y + H * t;
    const az = f * 2.4;
    const p = new Vector3(base.x + Math.cos(az) * 0.015, y, base.z + Math.sin(az) * 0.015);
    const n = new Vector3(Math.cos(az), 0.2, Math.sin(az)).normalize();
    const sz = 0.012;
    const v0 = g.vertex(p.x, p.y, p.z, n.x, n.y, n.z, 0.5, 0.5, 1.0, 0.5, phase, 0.9);
    const v1 = g.vertex(p.x + n.x * sz, p.y + n.y * sz + sz, p.z + n.z * sz, n.x, n.y, n.z, 0, 1, 1.0, 0.5, phase, 0.95);
    const v2 = g.vertex(p.x - n.z * sz, p.y + sz * 0.5, p.z + n.x * sz, n.x, n.y, n.z, 1, 1, 1.0, 0.5, phase, 0.95);
    g.tri(v0, v1, v2);
  }
}

export function buildAloe(rng: Rng): BufferGeometry {
  const g = new MeshGrower();
  const numLeaves = 18 + rng.int(8);
  const baseRadius = rng.range(0.18, 0.26);
  const phase = rng.float() * Math.PI * 2;

  for (let k = 0; k < numLeaves; k++) {
    const t = k / (numLeaves - 1);
    const phi = k * 137.5 * Math.PI / 180 + rng.range(-0.05, 0.05);
    const r = baseRadius * Math.pow(t, 0.55) * rng.range(0.85, 1.05);
    const pos = new Vector3(Math.cos(phi) * r, rng.range(0, 0.015), Math.sin(phi) * r);

    const pitch = (72 - 48 * Math.pow(t, 0.7) + rng.range(-4, 4)) * Math.PI / 180;
    const yaw = phi + rng.range(-0.08, 0.08);
    const roll = rng.range(-0.06, 0.06);

    const q = new Quaternion();
    q.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw));
    q.multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -pitch));
    q.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), roll));

    const m = new Matrix4().compose(pos, q, new Vector3(1, 1, 1));
    const L = rng.range(0.28, 0.42) * (0.85 + 0.15 * t);
    const W = L * rng.range(0.11, 0.15);
    buildAloeLeaf(g, m, L, W, rng.range(0.012, 0.02), rng.range(-0.25, -0.05), phase + k);
  }

  if (rng.chance(0.75)) {
    addFlowerSpike(
      g,
      new Vector3(0, 0.05, 0),
      rng.range(0.55, 0.85),
      rng.range(-0.06, 0.06),
      rng.range(-0.06, 0.06),
      phase,
    );
  }

  g.crownAO(new Vector3(0, 0.12, 0), baseRadius, 0.55);
  return g.build();
}
