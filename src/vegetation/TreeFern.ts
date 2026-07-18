/** Tree Fern (*Cyathea medullaris*) — giant radiating fronds on fibrous trunk. */

import { BufferGeometry, Vector3 } from 'three';
import type { Rng } from '../core/Seed';
import { MeshGrower } from './TubeMesh';

export interface BuiltTreeFern {
  bark: BufferGeometry;
  foliage: BufferGeometry;
}

export const TREE_FERN_META = {
  id: 'tree-fern',
  label: 'Tree Fern',
  foliageColor: { r: 0.04, g: 0.14, b: 0.05, hueVar: 0.22 },
  barkLayer: 36,
} as const;

function addFrond(
  g: MeshGrower,
  base: Vector3,
  dir: Vector3,
  len: number,
  width: number,
  hue: number,
  phase: number,
): void {
  const right = new Vector3().crossVectors(dir, new Vector3(0, 1, 0)).normalize();
  const tip = base.clone().addScaledVector(dir, len);
  const mid = base.clone().addScaledVector(dir, len * 0.55).addScaledVector(right, width * 0.3);
  const v0 = g.vertex(base.x, base.y, base.z, dir.x, dir.y, dir.z, 0.5, 0, hue, 0.5, phase, 0.8);
  const v1 = g.vertex(mid.x + right.x * width, mid.y, mid.z + right.z * width, dir.x, dir.y, dir.z, 0, 0.5, hue, 0.7, phase, 0.9);
  const v2 = g.vertex(mid.x - right.x * width, mid.y, mid.z - right.z * width, dir.x, dir.y, dir.z, 1, 0.5, hue, 0.7, phase, 0.9);
  const v3 = g.vertex(tip.x, tip.y, tip.z, dir.x, dir.y, dir.z, 0.5, 1, hue, 0.6, phase, 0.85);
  g.tri(v0, v1, v3);
  g.tri(v0, v3, v2);
}

export function buildTreeFern(rng: Rng): BuiltTreeFern {
  const barkG = new MeshGrower();
  const folG = new MeshGrower();
  const H = rng.range(6, 10);
  const r = rng.range(0.12, 0.18);
  const sides = 12;
  const phase = rng.float() * Math.PI * 2;

  const rings: number[][] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const y = t * H;
    const ring: number[] = [];
    for (let k = 0; k <= sides; k++) {
      const ang = (k / sides) * Math.PI * 2;
      const wobble = 1 + 0.04 * Math.sin(ang * 4 + phase);
      ring.push(barkG.vertex(
        Math.cos(ang) * r * wobble, y, Math.sin(ang) * r * wobble,
        Math.cos(ang), 0.05, Math.sin(ang),
        k / sides, t * 8, 0.08, 0.3, phase, 0.5 + t * 0.4,
      ));
    }
    rings.push(ring);
  }
  for (let i = 0; i < 16; i++) {
    const r0 = rings[i]!;
    const r1 = rings[i + 1]!;
    for (let k = 0; k < sides; k++) barkG.quad(r0[k]!, r0[k + 1]!, r1[k + 1]!, r1[k]!);
  }

  const crown = new Vector3(0, H, 0);
  const frondCount = 10 + rng.int(6);
  for (let f = 0; f < frondCount; f++) {
    const az = (f / frondCount) * Math.PI * 2 + rng.range(-0.15, 0.15);
    const pitch = rng.range(0.45, 1.05);
    const dir = new Vector3(Math.cos(az) * Math.cos(pitch), Math.sin(pitch), Math.sin(az) * Math.cos(pitch)).normalize();
    addFrond(folG, crown, dir, rng.range(1.8, 3.2), rng.range(0.35, 0.55), rng.range(-0.1, 0.15), phase + f);
  }
  folG.bendNormals(crown, 1.5, 0.3);

  return { bark: barkG.build(), foliage: folG.build() };
}
