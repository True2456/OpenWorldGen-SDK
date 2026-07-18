/**
 * Procedural horse — spine-loft body (watertight torso + neck + tail).
 *
 * Body skin is ONE continuous loft: tail dock → poll.
 * Tail bone is part of the loft (no separate tube). Head overlaps poll.
 */

import { BufferGeometry, Vector3 } from 'three';
import type { Rng } from '../core/Seed';
import { MeshGrower } from '../vegetation/TubeMesh';
import type { CoatPattern } from './AnimalMaterials';
import {
  addEar,
  addEllipsoid,
  addLeg,
  addLegSocket,
  addManeVolume,
  addSpineLoft,
  addTailHair,
  addTubePath,
  subdivideSpine,
  type SpineSection,
} from './AnimalMesh';

export interface HorseParams {
  hue: number;
  scale: number;
  lean: number;
  coat: CoatPattern;
}

export interface BuiltHorse {
  body: BufferGeometry;
  mane: BufferGeometry | null;
  tris: number;
  height: number;
  length: number;
}

export const HORSE_META = {
  id: 'horse',
  label: 'Grey Pony',
  withersM: 1.38,
  lengthM: 2.0,
} as const;

const LOD_CFG = {
  0: { ring: 12, subdiv: 2, headLat: 8, hair: true },
  1: { ring: 8, subdiv: 1, headLat: 6, hair: false },
  2: { ring: 6, subdiv: 0, headLat: 5, hair: false },
} as const;

function horseParams(rng: Rng, coat?: CoatPattern): HorseParams {
  return {
    hue: rng.float() * 2 - 1,
    scale: 0.94 + rng.float() * 0.1,
    lean: (rng.float() - 0.5) * 0.04,
    coat: coat ?? (rng.chance(0.55) ? 'grey_dapple' : 'chestnut'),
  };
}

/** Sparse spine controls — subdivided before lofting for smooth joins. */
function buildSpineControls(s: number, lean: number): SpineSection[] {
  const lx = lean * s;
  const p = (y: number, z: number, rx: number, ry: number) => ({
    pos: new Vector3(lx, y * s, z * s),
    rx: rx * s,
    ry: ry * s,
  });
  return [
    // tail dock → croup (tapered tail is part of the skin)
    p(0.98, -0.78, 0.028, 0.032),
    p(1.0, -0.72, 0.048, 0.052),
    p(1.02, -0.64, 0.082, 0.088),
    p(1.04, -0.50, 0.22, 0.19),
    // barrel
    p(1.06, -0.28, 0.28, 0.24),
    p(1.07, -0.05, 0.30, 0.25),
    p(1.09, 0.18, 0.29, 0.245),
    // chest → withers (smooth rise, no backward kink)
    p(1.10, 0.32, 0.27, 0.225),
    p(1.13, 0.35, 0.24, 0.20),
    p(1.16, 0.38, 0.21, 0.175),
    // neck
    p(1.20, 0.48, 0.175, 0.155),
    p(1.28, 0.62, 0.14, 0.125),
    p(1.38, 0.78, 0.11, 0.10),
    p(1.48, 0.90, 0.092, 0.085),
    p(1.54, 0.97, 0.08, 0.074),
    // poll
    p(1.56, 1.0, 0.072, 0.066),
  ];
}

function neckSlice(spine: SpineSection[]): { pts: Vector3[]; radii: number[] } {
  const i0 = Math.floor(spine.length * 0.52);
  const pts: Vector3[] = [];
  const radii: number[] = [];
  for (let i = i0; i < spine.length; i++) {
    pts.push(spine[i]!.pos.clone());
    radii.push(Math.max(spine[i]!.rx, spine[i]!.ry));
  }
  return { pts, radii };
}

function tailSlice(spine: SpineSection[]): Vector3[] {
  const n = Math.min(8, Math.max(4, Math.floor(spine.length * 0.22)));
  return spine.slice(0, n).map((sec) => sec.pos.clone());
}

export function buildHorse(
  rng: Rng,
  opts?: { lod?: 0 | 1 | 2; params?: HorseParams; coat?: CoatPattern; rigged?: boolean },
): BuiltHorse {
  const lod = opts?.lod ?? 0;
  const cfg = LOD_CFG[lod];
  const p = opts?.params ?? horseParams(rng, opts?.coat);
  const phase = rng.float() * Math.PI * 2;
  const s = p.scale;
  const g = new MeshGrower();
  const gMane = lod === 0 ? new MeshGrower() : null;

  const bodyC = new Vector3(p.lean * s, 1.06 * s, 0.05 * s);
  const spine = subdivideSpine(buildSpineControls(s, p.lean), cfg.subdiv);

  addSpineLoft(g, spine, {
    ringSegs: cfg.ring,
    hue: p.hue,
    part: 0.05,
    phase,
    aoBase: 0.62,
    aoTip: 0.82,
    capStart: true,
    capEnd: true,
  });

  const poll = spine[spine.length - 1]!;
  const prev = spine[spine.length - 2] ?? poll;
  const neckAxis = poll.pos.clone().sub(prev.pos).normalize();
  const headC = poll.pos.clone()
    .add(neckAxis.clone().multiplyScalar(0.05 * s))
    .add(new Vector3(0, 0.015 * s, 0.02 * s));
  addEllipsoid(
    g,
    headC,
    [0.105 * s, 0.095 * s, 0.16 * s],
    {
      latSegs: cfg.headLat,
      lonSegs: cfg.headLat + 2,
      hue: p.hue * 0.9,
      part: 0.12,
      phase,
      ao: 0.78,
    },
  );

  const jaw = headC.clone().add(new Vector3(0, -0.03 * s, 0.1 * s));
  const muzzleTip = jaw.clone().add(new Vector3(0, -0.04 * s, 0.14 * s));
  addTubePath(g, [jaw, muzzleTip], [0.06 * s, 0.046 * s], {
    ringSegs: cfg.ring,
    hue: p.hue * 0.75,
    part: 0.22,
    phase,
    aoBase: 0.62,
    aoTip: 0.7,
    capEnd: true,
  });

  const earL = headC.clone().add(new Vector3(-0.06 * s, 0.08 * s, -0.03 * s));
  const earR = headC.clone().add(new Vector3(0.06 * s, 0.08 * s, -0.03 * s));
  addEar(g, earL, earL.clone().add(new Vector3(-0.016 * s, 0.095 * s, 0.01 * s)), 0.024 * s, cfg.ring, p.hue, phase);
  addEar(g, earR, earR.clone().add(new Vector3(0.016 * s, 0.095 * s, 0.01 * s)), 0.024 * s, cfg.ring, p.hue, phase);

  const sockPart = 0.48;
  const legR = lod === 2 ? 0.052 : 0.062;
  const legs = [
    { hip: new Vector3(-0.21 * s, 1.02 * s, 0.3 * s), knee: new Vector3(-0.21 * s, 0.66 * s, 0.44 * s), fetlock: new Vector3(-0.21 * s, 0.15 * s, 0.38 * s), hoof: new Vector3(-0.21 * s, 0, 0.36 * s) },
    { hip: new Vector3(0.21 * s, 1.02 * s, 0.3 * s), knee: new Vector3(0.21 * s, 0.66 * s, 0.44 * s), fetlock: new Vector3(0.21 * s, 0.15 * s, 0.38 * s), hoof: new Vector3(0.21 * s, 0, 0.36 * s) },
    { hip: new Vector3(-0.23 * s, 0.98 * s, -0.24 * s), knee: new Vector3(-0.25 * s, 0.6 * s, -0.48 * s), fetlock: new Vector3(-0.24 * s, 0.13 * s, -0.42 * s), hoof: new Vector3(-0.23 * s, 0, -0.44 * s) },
    { hip: new Vector3(0.23 * s, 0.98 * s, -0.24 * s), knee: new Vector3(0.25 * s, 0.6 * s, -0.48 * s), fetlock: new Vector3(0.24 * s, 0.13 * s, -0.42 * s), hoof: new Vector3(0.23 * s, 0, -0.44 * s) },
  ];

  for (const leg of legs) {
    if (opts?.rigged) {
      addLegSocket(g, bodyC, leg.hip, legR * s, cfg.ring, p.hue, phase + rng.float() * 0.2);
      continue;
    }
    addLeg(
      g,
      bodyC,
      leg.hip,
      leg.knee,
      leg.fetlock,
      leg.hoof,
      legR * s,
      legR * 0.84 * s,
      legR * 0.66 * s,
      legR * 0.8 * s,
      cfg.ring,
      p.hue,
      phase + rng.float(),
      sockPart,
    );
  }

  const tailPts = tailSlice(spine);

  if (cfg.hair && gMane) {
    const { pts: neckPts, radii: neckRad } = neckSlice(spine);
    addManeVolume(
      gMane,
      neckPts,
      neckRad,
      22,
      0.42 * s,
      0.07 * s,
      p.hue * 0.3,
      phase,
      rng,
    );
    addTailHair(gMane, tailPts, 16, 0.5 * s, 0.08 * s, p.hue * 0.28, phase + 1.4, rng.fork('tail'));
  }

  const body = g.build();
  const mane = gMane ? gMane.build() : null;
  const tris = g.triCount + (gMane?.triCount ?? 0);

  return {
    body,
    mane,
    tris,
    height: HORSE_META.withersM * s,
    length: HORSE_META.lengthM * s,
  };
}
