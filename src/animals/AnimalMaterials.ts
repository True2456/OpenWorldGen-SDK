/**
 * Procedural coat / mane materials for fauna.
 * Uses the same `vdata` channel layout as vegetation materials.
 */

import { DoubleSide } from 'three';
import { MeshPhysicalNodeMaterial } from 'three/webgpu';
import {
  attribute,
  clamp,
  float,
  mix,
  positionWorld,
  smoothstep,
  uv,
  varying,
  vec3,
} from 'three/tsl';
import { fbm3, valueNoise3 } from '../gpu/noise/NoiseTSL';
import type { NF, NV3, NV4 } from '../gpu/TSLTypes';

function vdata(): NV4 {
  return attribute('vdata', 'vec4') as unknown as NV4;
}

export type CoatPattern = 'chestnut' | 'grey_dapple';

export interface CoatParams {
  pattern?: CoatPattern;
  color?: { r: number; g: number; b: number };
  darkMul?: number;
  roughness?: number;
}

const CHESTNUT = { r: 0.42, g: 0.26, b: 0.16 };
const GREY_BASE = { r: 0.58, g: 0.59, b: 0.62 };
const MANE_SILVER = { r: 0.82, g: 0.84, b: 0.86 };

function baseColor(p: CoatParams): NV3 {
  const c = p.color ?? (p.pattern === 'grey_dapple' ? GREY_BASE : CHESTNUT);
  return vec3(c.r, c.g, c.b);
}

/** Body coat with markings, dapple, and part-based tone. */
export function coatMaterial(p: CoatParams = {}): MeshPhysicalNodeMaterial {
  const mat = new MeshPhysicalNodeMaterial();
  mat.specularIntensity = 0.42;
  const d = vdata();
  const pattern = p.pattern ?? 'chestnut';
  const base = baseColor(p);

  const hueK = d.x.mul(0.12) as NF;
  const warm = base.mul(vec3(1.08, 1.02, 0.94));
  const cool = base.mul(vec3(0.9, 0.96, 1.06));
  let albedo = mix(cool, warm, clamp(hueK.add(0.5), 0, 1)) as unknown as NV3;

  const part = d.y;

  // muzzle pink
  const muzzlePink = vec3(0.72, 0.52, 0.5);
  albedo = mix(albedo, muzzlePink, smoothstep(0.18, 0.26, part).mul(smoothstep(0.34, 0.26, part))) as unknown as NV3;

  // white blaze / facial marking
  const blaze = smoothstep(0.1, 0.14, part).mul(smoothstep(0.2, 0.16, part)) as NF;
  albedo = mix(albedo, vec3(0.92, 0.91, 0.88), blaze) as unknown as NV3;

  // white leg socks (pony reference)
  const sock = smoothstep(0.44, 0.48, part).mul(smoothstep(0.56, 0.52, part)) as NF;
  albedo = mix(albedo, vec3(0.9, 0.89, 0.86), sock) as unknown as NV3;

  // hooves
  const hoof = vec3(0.32, 0.26, 0.2);
  albedo = mix(albedo, hoof, smoothstep(0.36, 0.42, part)) as unknown as NV3;

  // leg muscle shading
  const legShade = float(p.darkMul ?? 0.78);
  albedo = albedo.mul(
    mix(float(1), legShade, smoothstep(0.24, 0.34, part).mul(float(1).sub(sock))),
  ) as unknown as NV3;

  if (pattern === 'grey_dapple') {
    const wp = positionWorld.mul(2.8);
    const dappleCell = valueNoise3(wp).mul(0.5).add(valueNoise3(wp.mul(2.1)).mul(0.35)) as NF;
    const ring = dappleCell.fract().sub(0.5).abs().mul(2);
    const spot = smoothstep(0.55, 0.25, ring) as NF;
    const dark = vec3(0.38, 0.39, 0.42);
    const light = vec3(0.72, 0.73, 0.76);
    const dappleCol = mix(dark, light, spot) as unknown as NV3;
    const bodyMask = float(1).sub(blaze).sub(sock).sub(smoothstep(0.34, 0.4, part)) as NF;
    albedo = mix(albedo, dappleCol, bodyMask.mul(0.85)) as unknown as NV3;

    // large piebald patches (reference pony rump + flank)
    const patchN = valueNoise3(positionWorld.mul(0.35).add(vec3(2.1, 0, 1.7)));
    const rumpPatch = smoothstep(0.52, 0.62, patchN) as NF;
    const flankPatch = smoothstep(0.48, 0.58, valueNoise3(positionWorld.mul(0.42).add(vec3(-1.3, 0.4, 0.8)))) as NF;
    const patch = rumpPatch.max(flankPatch.mul(0.85)) as NF;
    albedo = mix(albedo, vec3(0.93, 0.92, 0.89), patch.mul(bodyMask).mul(0.9)) as unknown as NV3;
  } else {
    const fleck = fbm3(positionWorld.mul(5.5), 3).mul(0.1).add(0.94) as NF;
    albedo = albedo.mul(fleck) as unknown as NV3;
  }

  albedo = albedo.mul(d.w.mul(0.65).add(0.35)) as unknown as NV3;

  mat.colorNode = varying(albedo as unknown as Parameters<typeof varying>[0]) as unknown as typeof mat.colorNode;
  mat.roughness = p.roughness ?? (pattern === 'grey_dapple' ? 0.74 : 0.76);
  mat.metalness = 0;
  mat.side = DoubleSide;
  return mat;
}

/** Body mesh — front faces only so overlapping joins don't show interior. */
export function coatBodyMaterial(p: CoatParams = {}): MeshPhysicalNodeMaterial {
  const mat = coatMaterial(p);
  mat.side = 0;
  return mat;
}

/** Mane/tail cards — alpha-tested hair with tip fade. */
export function maneCardMaterial(p: CoatParams = {}): MeshPhysicalNodeMaterial {
  const mat = new MeshPhysicalNodeMaterial();
  mat.specularIntensity = 0.28;
  const d = vdata();
  const isGrey = (p.pattern ?? 'chestnut') === 'grey_dapple';
  const hairBase = isGrey ? vec3(MANE_SILVER.r, MANE_SILVER.g, MANE_SILVER.b) : vec3(0.18, 0.12, 0.08);
  const tip = hairBase.mul(vec3(0.75, 0.76, 0.78));
  const uvFade = uv().y as unknown as NF;
  const alpha = smoothstep(0.08, 0.35, uvFade).mul(d.w.mul(0.5).add(0.5)) as NF;
  const albedo = mix(tip, hairBase, uvFade) as unknown as NV3;

  mat.colorNode = varying(albedo as unknown as Parameters<typeof varying>[0]) as unknown as typeof mat.colorNode;
  mat.opacityNode = alpha;
  mat.alphaTest = 0.22;
  mat.transparent = true;
  mat.roughness = 0.9;
  mat.metalness = 0;
  mat.side = DoubleSide;
  return mat;
}

export const CHESTNUT_COAT: CoatParams = { pattern: 'chestnut', darkMul: 0.68 };
export const GREY_DAPPLE_COAT: CoatParams = { pattern: 'grey_dapple', darkMul: 0.82, roughness: 0.72 };
