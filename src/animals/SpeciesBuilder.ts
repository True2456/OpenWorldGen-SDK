/**
 * Parametric species body builder — spine loft + head/ears/horns + optional trunk/hump.
 */

import { BufferGeometry, Vector3 } from 'three';
import type { Rng } from '../core/Seed';
import { MeshGrower } from '../vegetation/TubeMesh';
import {
  addEar,
  addEllipsoid,
  addLeg,
  addLegSocket,
  addSpineLoft,
  addTubePath,
  subdivideSpine,
  type SpineSection,
} from './AnimalMesh';
import { buildStaticLimb } from './LimbParts';
import { LOD_RING, type QuadrupedMorph } from './QuadrupedMorph';

export interface BuiltSpecies {
  body: BufferGeometry;
  mane: BufferGeometry | null;
  tris: number;
  height: number;
  length: number;
  hipLocals: Vector3[];
  legFront: boolean[];
}

function buildSpine(m: QuadrupedMorph, s: number, lean: number): SpineSection[] {
  const lx = lean * s;
  const bx = m.barrelRx;
  const by = m.barrelRy;
  const nl = m.neckLen;
  const nr = m.neckRise;
  const p = (y: number, z: number, rx: number, ry: number) => ({
    pos: new Vector3(lx, y * s, z * s),
    rx: rx * s,
    ry: ry * s,
  });

  const sections: SpineSection[] = [
    p(0.95 * by, -0.72 * m.lengthM / 2.0, 0.04 * bx, 0.04 * by),
    p(1.0 * by, -0.58 * m.lengthM / 2.0, 0.1 * bx, 0.1 * by),
    p(1.03 * by, -0.42 * m.lengthM / 2.0, 0.2 * bx, 0.18 * by),
    p(1.05 * by, -0.22 * m.lengthM / 2.0, 0.28 * bx, 0.24 * by),
    p(1.06 * by, 0.0, 0.3 * bx, 0.25 * by),
    p(1.08 * by, 0.18 * m.lengthM / 2.0, 0.28 * bx, 0.24 * by),
    p(1.1 * by, 0.32 * m.lengthM / 2.0, 0.24 * bx, 0.2 * by),
  ];

  // neck toward poll — giraffe stretches via neckLen/rise
  const neckBaseZ = 0.36 * (m.lengthM / 2.0);
  const pollZ = neckBaseZ + 0.62 * nl;
  const pollY = 1.12 * by + nr;
  sections.push(p(1.14 * by + nr * 0.15, neckBaseZ + 0.12 * nl, 0.16 * bx, 0.14 * by));
  sections.push(p(1.22 * by + nr * 0.35, neckBaseZ + 0.28 * nl, 0.12 * bx, 0.11 * by));
  sections.push(p(1.34 * by + nr * 0.6, neckBaseZ + 0.45 * nl, 0.09 * bx, 0.085 * by));
  sections.push(p(pollY, pollZ, 0.07 * bx, 0.065 * by));

  if (m.hasHump) {
    // inflate mid-back for camel
    const mid = sections[3]!;
    mid.ry *= 1.55;
    mid.pos.y += 0.18 * s;
    const mid2 = sections[4]!;
    mid2.ry *= 1.35;
    mid2.pos.y += 0.12 * s;
  }
  return sections;
}

function hipLocals(m: QuadrupedMorph, s: number): Vector3[] {
  const hs = m.hipSpread * s;
  const hy = m.hipY * s * m.barrelRy;
  const zf = m.hipZFront * s * (m.lengthM / 2);
  const zb = m.hipZBack * s * (m.lengthM / 2);
  if (m.locomotion === 'biped') {
    return [
      new Vector3(-hs * 0.55, hy * 0.92, zb * 0.35),
      new Vector3(hs * 0.55, hy * 0.92, zb * 0.35),
    ];
  }
  if (m.locomotion === 'hop') {
    return [
      new Vector3(-hs * 0.7, hy * 0.95, zf * 0.35),
      new Vector3(hs * 0.7, hy * 0.95, zf * 0.35),
      new Vector3(-hs, hy, zb),
      new Vector3(hs, hy, zb),
    ];
  }
  return [
    new Vector3(-hs, hy, zf),
    new Vector3(hs, hy, zf),
    new Vector3(-hs * 1.05, hy * 0.96, zb),
    new Vector3(hs * 1.05, hy * 0.96, zb),
  ];
}

export function buildSpecies(
  morph: QuadrupedMorph,
  rng: Rng,
  opts?: { lod?: 0 | 1 | 2; rigged?: boolean; scale?: number },
): BuiltSpecies {
  const lod = opts?.lod ?? 0;
  const cfg = LOD_RING[lod];
  const s = (opts?.scale ?? 1) * (0.96 + rng.float() * 0.08);
  const hue = rng.float() * 2 - 1;
  const lean = (rng.float() - 0.5) * 0.03;
  const phase = rng.float() * Math.PI * 2;
  const g = new MeshGrower();

  const controls = buildSpine(morph, s, lean);
  const spine = subdivideSpine(controls, cfg.subdiv);
  addSpineLoft(g, spine, {
    ringSegs: cfg.ring,
    hue,
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
  const hs = morph.headScale;
  const headC = poll.pos
    .clone()
    .add(neckAxis.clone().multiplyScalar(0.04 * s * hs[2]!))
    .add(new Vector3(0, 0.01 * s, 0.015 * s));

  addEllipsoid(g, headC, [hs[0]! * s, hs[1]! * s, hs[2]! * s], {
    latSegs: cfg.headLat,
    lonSegs: cfg.headLat + 2,
    hue: hue * 0.9,
    part: 0.12,
    phase,
    ao: 0.78,
  });

  const jaw = headC.clone().add(new Vector3(0, -0.03 * s * hs[1]!, 0.08 * s * hs[2]!));
  const muzzleTip = jaw.clone().add(new Vector3(0, -0.03 * s, morph.muzzleLen * s));
  addTubePath(g, [jaw, muzzleTip], [0.055 * s * hs[0]!, 0.042 * s * hs[0]!], {
    ringSegs: cfg.ring,
    hue: hue * 0.75,
    part: 0.22,
    phase,
    aoBase: 0.62,
    aoTip: 0.7,
    capEnd: true,
  });

  if (morph.hasTrunk) {
    const tip = muzzleTip.clone().add(new Vector3(0, -0.55 * s * morph.barrelRy, 0.35 * s));
    const mid = muzzleTip.clone().lerp(tip, 0.45).add(new Vector3(0.02 * s, -0.05 * s, 0));
    addTubePath(g, [muzzleTip, mid, tip], [0.08 * s * morph.barrelRx, 0.06 * s, 0.04 * s], {
      ringSegs: Math.max(6, cfg.ring - 1),
      hue: hue * 0.6,
      part: 0.2,
      phase,
      aoBase: 0.55,
      aoTip: 0.68,
      capEnd: true,
    });
  }

  const earL = headC.clone().add(new Vector3(-morph.earSpread * s, 0.07 * s * hs[1]!, -0.02 * s));
  const earR = headC.clone().add(new Vector3(morph.earSpread * s, 0.07 * s * hs[1]!, -0.02 * s));
  const el = morph.earLen * s;
  addEar(g, earL, earL.clone().add(new Vector3(-0.01 * s, el, 0.01 * s)), 0.022 * s, cfg.ring, hue, phase);
  addEar(g, earR, earR.clone().add(new Vector3(0.01 * s, el, 0.01 * s)), 0.022 * s, cfg.ring, hue, phase);

  // horns / antlers
  if (morph.horn && morph.horn !== 'none' && cfg.detail) {
    const hornBase = headC.clone().add(new Vector3(0, 0.08 * s * hs[1]!, -0.02 * s));
    const len =
      morph.horn === 'long' ? 0.55 * s : morph.horn === 'antler' ? 0.42 * s : morph.horn === 'twisty' ? 0.38 * s : 0.18 * s;
    for (const side of [-1, 1]) {
      const root = hornBase.clone().add(new Vector3(side * 0.06 * s, 0, 0));
      const tip = root.clone().add(
        new Vector3(
          side * (morph.horn === 'twisty' ? 0.12 : 0.04) * s,
          len,
          morph.horn === 'antler' ? -0.08 * s : 0.02 * s,
        ),
      );
      addTubePath(g, [root, tip], [0.025 * s, 0.012 * s], {
        ringSegs: 5,
        hue: hue * 0.3,
        part: 0.4,
        phase,
        aoBase: 0.45,
        aoTip: 0.55,
        capEnd: true,
      });
      if (morph.horn === 'antler') {
        const tine = tip.clone().add(new Vector3(side * 0.1 * s, -0.05 * s, 0.05 * s));
        addTubePath(g, [tip.clone().lerp(root, 0.3), tine], [0.014 * s, 0.008 * s], {
          ringSegs: 4,
          hue: hue * 0.3,
          part: 0.4,
          phase,
          aoBase: 0.45,
          aoTip: 0.55,
          capEnd: true,
        });
      }
    }
  }

  // stripe hint bands (zebra / tiger visual cue via darker neck band tubes)
  if (morph.hasStripeHint && lod < 2) {
    const bandY = 1.05 * morph.barrelRy * s;
    for (let i = 0; i < 4; i++) {
      const z = (-0.35 + i * 0.18) * s * (morph.lengthM / 2);
      addEllipsoid(
        g,
        new Vector3(lean * s, bandY, z),
        [morph.barrelRx * 0.31 * s, 0.02 * s, 0.04 * s],
        { latSegs: 4, lonSegs: 6, hue: hue - 0.8, part: 0.08, phase, ao: 0.5 },
      );
    }
  }

  const hips = hipLocals(morph, s);
  const bodyC = new Vector3(lean * s, morph.hipY * s * morph.barrelRy * 0.95, 0.05 * s);
  const kneeDrop = 0.36;
  const hoofDrop = morph.locomotion === 'hop' ? 0.72 : 1.02;
  const thick = morph.legThick;

  const fronts =
    morph.locomotion === 'biped'
      ? [false, false]
      : morph.locomotion === 'hop'
        ? [true, true, false, false]
        : [true, true, false, false];

  for (let i = 0; i < hips.length; i++) {
    const hip = hips[i]!;
    const front = fronts[i] ?? i < 2;
    if (opts?.rigged) {
      addLegSocket(g, bodyC, hip, thick * s * 1.1, cfg.ring, hue, phase + i * 0.2);
      continue;
    }
    const kneeZ = front ? 0.14 : morph.locomotion === 'hop' ? -0.28 : -0.22;
    const hoofZ = front ? 0.08 : morph.locomotion === 'hop' ? -0.2 : -0.16;
    if (lod === 2) {
      const limb = buildStaticLimb(front, s, cfg.ring, hue, phase + i, thick, kneeDrop, hoofDrop, kneeZ, hoofZ);
      // merge static limb at hip via translate — MeshGrower merge: addLeg prefers
      addLeg(
        g,
        bodyC,
        hip,
        hip.clone().add(new Vector3(0, -kneeDrop * s, kneeZ * s)),
        hip.clone().add(new Vector3(0, -hoofDrop * s * 0.84, hoofZ * s * 0.85)),
        hip.clone().add(new Vector3(0, -hoofDrop * s, hoofZ * s)),
        thick * s,
        thick * 0.84 * s,
        thick * 0.66 * s,
        thick * 0.8 * s,
        cfg.ring,
        hue,
        phase + i,
        0.48,
      );
      void limb;
    } else {
      addLeg(
        g,
        bodyC,
        hip,
        hip.clone().add(new Vector3(0, -kneeDrop * s, kneeZ * s)),
        hip.clone().add(new Vector3(0, -hoofDrop * s * 0.84, hoofZ * s * 0.85)),
        hip.clone().add(new Vector3(0, -hoofDrop * s, hoofZ * s)),
        thick * s,
        thick * 0.84 * s,
        thick * 0.66 * s,
        thick * 0.8 * s,
        cfg.ring,
        hue,
        phase + i,
        0.48,
      );
    }
  }

  const body = g.build();
  const tris = g.triCount;
  return {
    body,
    mane: null,
    tris,
    height: morph.withersM * s,
    length: morph.lengthM * s,
    hipLocals: hips,
    legFront: fronts,
  };
}
