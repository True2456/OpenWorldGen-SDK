/**
 * Understory: shrubs ×3 (incl. the reference's pink flowering shrub),
 * ferns (frond rosettes from a captured pinnate frond), flowers ×4.
 * Shrubs are multi-stem trees grown from bush-tuned species params and
 * merged; ferns/flowers are bespoke small builders on MeshGrower.
 */

import { Matrix4, Quaternion, Vector3 } from 'three';
import type { BufferGeometry } from 'three';
import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import { MeshGrower } from './TubeMesh';
import type { LeafAnchor, SpeciesParams } from './VegTypes';
import { buildFoliageCards } from './FoliageCards';

// ---------------------------------------------------------------------------
// Shrub species (bush-tuned growth params; same grammar)
// ---------------------------------------------------------------------------

const bushLevels = (gnarl: number): SpeciesParams['levels'] => [
  {
    density: 0, whorl: 0, childStart: 0, childEnd: 0,
    angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
    segs: 5, wander: 0.18 * gnarl, gravitropism: 0.06, droop: 0, tipCurl: 0, taper: 0.9,
  },
  {
    density: 4.5, whorl: 0, childStart: 0.2, childEnd: 1.0,
    angleBase: 1.0, angleTip: 0.5, lenRatio: 0.62, lenJitter: 0.4, radRatio: 0.55,
    segs: 4, wander: 0.16 * gnarl, gravitropism: 0.1, droop: 0.2, tipCurl: 0.1, taper: 0.85,
  },
  {
    density: 7.0, whorl: 0, childStart: 0.2, childEnd: 1.0,
    angleBase: 0.85, angleTip: 0.5, lenRatio: 0.45, lenJitter: 0.4, radRatio: 0.55,
    segs: 2, wander: 0.2 * gnarl, gravitropism: 0.05, droop: 0.15, tipCurl: 0.05, taper: 0.85,
    planar: 0.5,
  },
];

export const BUSH_HAZEL: SpeciesParams = {
  id: 'bushHazel',
  label: 'Hazel shrub',
  kind: 'broadleaf',
  height: [1.9, 2.9],
  trunkRadiusK: 0.02,
  crown: 'dome',
  asym: 0.35,
  levels: bushLevels(1),
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 2,
    spacing: 0.09,
    tStart: 0.15,
    scale: [0.08, 0.13],
    tilt: 0.9,
    clusterSize: [2, 3],
    normalBend: 0.6,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.3 },
    leaf: { len: 1.0, width: 0.6, shapePow: 1.2, fold: 0.3, curl: 0.2, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.2, height: 0.3, lobes: 3 },
  barkLayer: 2,
  barkRepeats: 2,
  foliageColor: { r: 0.055, g: 0.125, b: 0.03, hueVar: 0.24 },
  brokenTop: 0,
  stubChance: 0.02,
};

export const BUSH_PINKFLOWER: SpeciesParams = {
  id: 'bushPink',
  label: 'Pink flowering shrub',
  kind: 'broadleaf',
  height: [1.5, 2.4],
  trunkRadiusK: 0.018,
  crown: 'dome',
  asym: 0.3,
  levels: bushLevels(1.2),
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 2,
    spacing: 0.055,
    tStart: 0.12,
    scale: [0.09, 0.14],
    tilt: 0.95,
    clusterSize: [2, 3],
    normalBend: 0.62,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.3 },
    leaf: { len: 1.0, width: 0.5, shapePow: 1.25, fold: 0.28, curl: 0.18, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.2, height: 0.3, lobes: 3 },
  barkLayer: 2,
  barkRepeats: 2,
  foliageColor: { r: 0.05, g: 0.115, b: 0.032, hueVar: 0.2 },
  blossom: { r: 0.58, g: 0.16, b: 0.24, frac: 0.56 },
  brokenTop: 0,
  stubChance: 0.02,
};

export const BUSH_JUNIPER: SpeciesParams = {
  id: 'bushJuniper',
  label: 'Juniper mound',
  kind: 'conifer',
  height: [0.9, 1.5],
  trunkRadiusK: 0.03,
  crown: 'dome',
  asym: 0.4,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 4, wander: 0.3, gravitropism: -0.12, droop: 0, tipCurl: 0.05, taper: 0.8,
    },
    {
      density: 7, whorl: 0, childStart: 0.05, childEnd: 1.0,
      angleBase: 1.5, angleTip: 0.7, lenRatio: 0.85, lenJitter: 0.4, radRatio: 0.6,
      segs: 4, wander: 0.22, gravitropism: 0.12, droop: 0.25, tipCurl: 0.18, taper: 0.85,
    },
    {
      density: 8, whorl: 0, childStart: 0.2, childEnd: 1.0,
      angleBase: 0.9, angleTip: 0.5, lenRatio: 0.4, lenJitter: 0.4, radRatio: 0.55,
      segs: 2, wander: 0.2, gravitropism: 0.08, droop: 0.1, tipCurl: 0.1, taper: 0.85,
      planar: 0.6,
    },
  ],
  foliage: {
    kind: 'needleSpray',
    anchorLevel: 2,
    spacing: 0.07,
    tStart: 0.1,
    scale: [0.12, 0.2],
    tilt: 0.55,
    clusterSize: [1, 1],
    normalBend: 0.6,
    planarLeaves: true,
    card: { mode: 'lying', sizeK: 2.5 },
    leaf: { len: 0.05, width: 0.012, shapePow: 1, fold: 0, curl: 0, needleCount: 26, brush: 0 },
  },
  flare: { amp: 0.25, height: 0.25, lobes: 3 },
  barkLayer: 4,
  barkRepeats: 2,
  foliageColor: { r: 0.05, g: 0.095, b: 0.055, hueVar: 0.18 },
  brokenTop: 0,
  stubChance: 0.05,
};

export const BUSH_CREOSOTE: SpeciesParams = {
  id: 'creosote',
  label: 'Creosote bush (desert)',
  kind: 'broadleaf',
  height: [1.0, 1.8],
  trunkRadiusK: 0.035,
  crown: 'dome',
  asym: 0.38,
  levels: bushLevels(1.4),
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 2,
    spacing: 0.07,
    tStart: 0.12,
    scale: [0.06, 0.1],
    tilt: 0.85,
    clusterSize: [2, 3],
    normalBend: 0.58,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.0 },
    leaf: { len: 0.35, width: 0.12, shapePow: 1.1, fold: 0.2, curl: 0.12, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.15, height: 0.2, lobes: 3 },
  barkLayer: 4,
  barkRepeats: 2,
  foliageColor: { r: 0.065, g: 0.1, b: 0.04, hueVar: 0.18 },
  brokenTop: 0,
  stubChance: 0.04,
};

export const UNDERSTORY_SPECIES: readonly SpeciesParams[] = [
  BUSH_HAZEL,
  BUSH_PINKFLOWER,
  BUSH_JUNIPER,
  BUSH_CREOSOTE,
];

/** multi-stem shrub: 3–5 leaning stems merged into one bark+foliage pair */
export function buildShrub(
  sp: SpeciesParams,
  rng: Rng,
): { bark: BufferGeometry; foliage: BufferGeometry | null; tris: number } {
  const stems = 3 + rng.int(3);
  const barkG = new MeshGrower();
  const folG = new MeshGrower();
  const m = new Matrix4();
  const q = new Quaternion();
  const p = new Vector3();
  let any = false;
  for (let i = 0; i < stems; i++) {
    const a = (i / stems) * Math.PI * 2 + rng.float();
    const lean = 0.12 + rng.float() * 0.22;
    const tree = buildTree(sp, rng.fork(`stem${i}`), {
      inst: {
        leanX: Math.cos(a) * lean,
        leanZ: Math.sin(a) * lean,
        age: 0.4 + rng.float() * 0.5,
      },
    });
    p.set(Math.cos(a) * 0.09, 0, Math.sin(a) * 0.09);
    q.identity();
    m.compose(p, q, new Vector3(1, 1, 1));
    appendGeometry(barkG, tree.bark, m);
    if (tree.foliage) {
      appendGeometry(folG, tree.foliage, m);
      any = true;
    }
  }
  const bark = barkG.build();
  const foliage = any ? folG.build() : null;
  return { bark, foliage, tris: barkG.triCount + folG.triCount };
}

/** append a built BufferGeometry into a grower (positions/normals/uv/vdata) */
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

// ---------------------------------------------------------------------------
// Ferns
// ---------------------------------------------------------------------------

/** capture species for the fern frond atlas (pinnate comb spray) */
export const FERN_CAPTURE: SpeciesParams = {
  ...BUSH_HAZEL,
  id: 'fern',
  label: 'Fern',
  foliage: {
    kind: 'needleSpray',
    anchorLevel: 2,
    spacing: 0.1,
    tStart: 0.1,
    scale: [0.3, 0.45],
    tilt: 0.6,
    clusterSize: [1, 1],
    normalBend: 0.55,
    planarLeaves: true,
    captureStyle: 'frond',
    card: { mode: 'cross', sizeK: 2.2 },
    leaf: { len: 0.1, width: 0.032, shapePow: 1, fold: 0, curl: 0, needleCount: 30, brush: 0 },
  },
  foliageColor: { r: 0.045, g: 0.14, b: 0.028, hueVar: 0.22 },
};

/** jungle understory fern — darker, larger fronds */
export const JUNGLE_FERN_CAPTURE: SpeciesParams = {
  ...FERN_CAPTURE,
  id: 'jungleFern',
  label: 'Jungle fern',
  foliage: {
    ...FERN_CAPTURE.foliage!,
    scale: [0.38, 0.55],
    leaf: { len: 0.12, width: 0.036, shapePow: 1, fold: 0, curl: 0, needleCount: 36, brush: 0 },
  },
  foliageColor: { r: 0.03, g: 0.125, b: 0.022, hueVar: 0.2 },
};

/** fern plant: rosette of 6–10 frond cards rising from a center */
export function buildFern(rng: Rng): BufferGeometry {
  const g = new MeshGrower();
  const fronds = 6 + rng.int(5);
  const anchors: LeafAnchor[] = [];
  const q = new Quaternion();
  const qt = new Quaternion();
  const Y = new Vector3(0, 1, 0);
  const X = new Vector3(1, 0, 0);
  for (let i = 0; i < fronds; i++) {
    const az = (i / fronds) * Math.PI * 2 + rng.float() * 0.6;
    const pitch = 0.75 + rng.float() * 0.4; // steep at the base, arches over
    q.setFromAxisAngle(Y, az);
    qt.setFromAxisAngle(X, -(Math.PI / 2 - pitch));
    q.multiply(qt);
    anchors.push({
      pos: new Vector3(Math.cos(az) * 0.03, 0.02, Math.sin(az) * 0.03),
      quat: q.clone(),
      scale: 0.2 + rng.float() * 0.14,
      hue: rng.float() * 2 - 1,
      age: rng.float() * 0.4,
    });
  }
  buildFoliageCards(g, anchors, { mode: 'lying', sizeK: 2.4, bend: 1.0 }, rng);
  return g.build();
}

/** dry prairie/desert grass tuft — crossed straw-colored blades */
export function buildDryGrassTuft(rng: Rng): BufferGeometry {
  const g = new MeshGrower();
  const blades = 4 + rng.int(3);
  const q = new Quaternion();
  const Y = new Vector3(0, 1, 0);
  for (let i = 0; i < blades; i++) {
    const az = (i / blades) * Math.PI * 2 + rng.float() * 0.5;
    const h = 0.22 + rng.float() * 0.18;
    const lean = 0.25 + rng.float() * 0.35;
    q.setFromAxisAngle(Y, az);
    const dx = Math.cos(az) * lean;
    const dz = Math.sin(az) * lean;
    const w = 0.008;
    const a0 = g.vertex(-w, 0, 0, 0, 1, 0, 0, 0, 0.85, 0, 0, 0.9);
    const a1 = g.vertex(w, 0, 0, 0, 1, 0, 1, 0, 0.85, 0, 0, 0.9);
    const b0 = g.vertex(-w + dx * h * 0.5, h * 0.55, dz * h * 0.5, dx, 0.5, dz, 0, 0.5, 0.9, 0, 0, 1);
    const b1 = g.vertex(w + dx * h * 0.5, h * 0.55, dz * h * 0.5, dx, 0.5, dz, 1, 0.5, 0.9, 0, 0, 1);
    const c0 = g.vertex(dx * h, h, dz * h, dx, 0.3, dz, 0, 1, 1, 0, 0, 1);
    const c1 = g.vertex(dx * h + w, h, dz * h, dx, 0.3, dz, 1, 1, 1, 0, 0, 1);
    g.quad(a0, a1, b1, b0);
    g.quad(b0, b1, c1, c0);
    void q;
  }
  return g.build();
}

/** swamp reed cluster — tall thin crossed stems */
export function buildSwampReed(rng: Rng): BufferGeometry {
  const g = new MeshGrower();
  const reeds = 5 + rng.int(4);
  for (let i = 0; i < reeds; i++) {
    const az = rng.float() * Math.PI * 2;
    const ox = Math.cos(az) * 0.04;
    const oz = Math.sin(az) * 0.04;
    const h = 0.9 + rng.float() * 0.8;
    const lean = (rng.float() - 0.5) * 0.2;
    const w = 0.005;
    for (let pl = 0; pl < 2; pl++) {
      const px = pl === 0 ? w : 0;
      const pz = pl === 0 ? 0 : w;
      const a0 = g.vertex(ox - px, 0.02, oz - pz, 0, 1, 0, 0, 0, 0.7, 0, 0, 0.85);
      const a1 = g.vertex(ox + px, 0.02, oz + pz, 0, 1, 0, 1, 0, 0.7, 0, 0, 0.85);
      const b0 = g.vertex(ox - px + lean * h * 0.5, h * 0.5, oz - pz, lean, 0.5, 0, 0, 0.5, 0.85, 0, 0, 0.95);
      const b1 = g.vertex(ox + px + lean * h * 0.5, h * 0.5, oz + pz, lean, 0.5, 0, 1, 0.5, 0.85, 0, 0, 0.95);
      const c0 = g.vertex(ox - px + lean * h, h, oz - pz, lean, 0.2, 0, 0, 1, 1, 0, 0, 1);
      const c1 = g.vertex(ox + px + lean * h, h, oz + pz, lean, 0.2, 0, 1, 1, 1, 0, 0, 1);
      g.quad(a0, a1, b1, b0);
      g.quad(b0, b1, c1, c0);
    }
  }
  return g.build();
}

/** larger jungle-floor fern rosette */
export function buildJungleFern(rng: Rng): BufferGeometry {
  const g = new MeshGrower();
  const fronds = 8 + rng.int(6);
  const anchors: LeafAnchor[] = [];
  const q = new Quaternion();
  const qt = new Quaternion();
  const Y = new Vector3(0, 1, 0);
  const X = new Vector3(1, 0, 0);
  for (let i = 0; i < fronds; i++) {
    const az = (i / fronds) * Math.PI * 2 + rng.float() * 0.5;
    const pitch = 0.65 + rng.float() * 0.35;
    q.setFromAxisAngle(Y, az);
    qt.setFromAxisAngle(X, -(Math.PI / 2 - pitch));
    q.multiply(qt);
    anchors.push({
      pos: new Vector3(Math.cos(az) * 0.04, 0.02, Math.sin(az) * 0.04),
      quat: q.clone(),
      scale: 0.28 + rng.float() * 0.18,
      hue: rng.float() * 2 - 1,
      age: rng.float() * 0.3,
    });
  }
  buildFoliageCards(g, anchors, { mode: 'lying', sizeK: 2.6, bend: 1.1 }, rng);
  return g.build();
}

// ---------------------------------------------------------------------------
// Flowers
// ---------------------------------------------------------------------------

export type FlowerKind = 'umbel' | 'bell' | 'daisy';

/**
 * Small flowering plant: thin stem + leaves + REAL petal geometry.
 * vdata.x: 0 = stem/leaf (green), 1 = petal, 0.5 = flower center.
 */
export function buildFlower(kind: FlowerKind, rng: Rng): BufferGeometry {
  const g = new MeshGrower();
  const H = kind === 'umbel' ? 0.55 + rng.float() * 0.3 : 0.28 + rng.float() * 0.2;
  const sway = (rng.float() - 0.5) * 0.25;
  // stem: 2-segment thin strip pair (cross)
  const top = new Vector3(sway * H, H, sway * H * 0.6);
  const mid = new Vector3(sway * H * 0.4, H * 0.55, 0);
  for (let pl = 0; pl < 2; pl++) {
    const w = 0.006;
    const ox = pl === 0 ? w : 0;
    const oz = pl === 0 ? 0 : w;
    const a0 = g.vertex(-ox, 0, -oz, 0, 0, 1, 0, 0, 0, 0, 0, 0.8);
    const a1 = g.vertex(ox, 0, oz, 0, 0, 1, 1, 0, 0, 0, 0, 0.8);
    const b0 = g.vertex(mid.x - ox, mid.y, mid.z - oz, 0, 0, 1, 0, 0.5, 0, 0, 0, 0.9);
    const b1 = g.vertex(mid.x + ox, mid.y, mid.z + oz, 0, 0, 1, 1, 0.5, 0, 0, 0, 0.9);
    const c0 = g.vertex(top.x - ox * 0.6, top.y, top.z - oz * 0.6, 0, 0, 1, 0, 1, 0, 0, 0, 1);
    const c1 = g.vertex(top.x + ox * 0.6, top.y, top.z + oz * 0.6, 0, 0, 1, 1, 1, 0, 0, 0, 1);
    g.quad(a0, a1, b1, b0);
    g.quad(b0, b1, c1, c0);
  }
  // 2-3 basal leaves: small bent quads
  const leaves = 2 + rng.int(2);
  for (let i = 0; i < leaves; i++) {
    const az = rng.float() * Math.PI * 2;
    const ll = 0.07 + rng.float() * 0.06;
    const lx = Math.cos(az);
    const lz = Math.sin(az);
    const y0 = 0.02 + rng.float() * H * 0.3;
    const a0 = g.vertex(lx * 0.01, y0, lz * 0.01, 0, 1, 0, 0, 0, 0, 0, 0, 0.85);
    const a1 = g.vertex(lx * 0.01 - lz * 0.012, y0 + 0.005, lz * 0.01 + lx * 0.012, 0, 1, 0, 1, 0, 0, 0, 0, 0.85);
    const b0 = g.vertex(lx * ll, y0 + ll * 0.5, lz * ll, 0, 1, 0, 0, 1, 0, 0, 0, 1);
    const b1 = g.vertex(lx * ll - lz * 0.01, y0 + ll * 0.5 + 0.005, lz * ll + lx * 0.01, 0, 1, 0, 1, 1, 0, 0, 0, 1);
    g.quad(a0, a1, b1, b0);
  }
  // head(s)
  const head = (cx: number, cy: number, cz: number, s: number): void => {
    if (kind === 'daisy') {
      const petals = 8 + rng.int(5);
      for (let i = 0; i < petals; i++) {
        const az = (i / petals) * Math.PI * 2;
        const dx = Math.cos(az);
        const dz = Math.sin(az);
        const pw = s * 0.3;
        const plen = s;
        const a0 = g.vertex(cx + dx * s * 0.18 - dz * pw * 0.5, cy, cz + dz * s * 0.18 + dx * pw * 0.5, 0, 1, 0.2, 0, 0, 1, 0, 0, 1);
        const a1 = g.vertex(cx + dx * s * 0.18 + dz * pw * 0.5, cy, cz + dz * s * 0.18 - dx * pw * 0.5, 0, 1, 0.2, 1, 0, 1, 0, 0, 1);
        const b0 = g.vertex(cx + dx * plen - dz * pw * 0.25, cy + s * 0.16, cz + dz * plen + dx * pw * 0.25, 0, 1, 0.2, 0.4, 1, 1, 0, 0, 1);
        const b1 = g.vertex(cx + dx * plen + dz * pw * 0.25, cy + s * 0.16, cz + dz * plen - dx * pw * 0.25, 0, 1, 0.2, 0.6, 1, 1, 0, 0, 1);
        g.quad(a0, a1, b1, b0);
      }
      // center disc: small fan
      const c = g.vertex(cx, cy + s * 0.08, cz, 0, 1, 0, 0.5, 0.5, 0.5, 0, 0, 1);
      const ringN = 6;
      const ring: number[] = [];
      for (let i = 0; i <= ringN; i++) {
        const az = (i / ringN) * Math.PI * 2;
        ring.push(
          g.vertex(cx + Math.cos(az) * s * 0.2, cy + s * 0.03, cz + Math.sin(az) * s * 0.2, 0, 1, 0, 0.5, 0.5, 0.5, 0, 0, 1),
        );
      }
      for (let i = 0; i < ringN; i++) g.tri(c, ring[i + 1] as number, ring[i] as number);
    } else if (kind === 'bell') {
      // drooping bell: cone of petals pointing down
      const petals = 5;
      for (let i = 0; i < petals; i++) {
        const az = (i / petals) * Math.PI * 2;
        const dx = Math.cos(az);
        const dz = Math.sin(az);
        const a0 = g.vertex(cx + dx * s * 0.12, cy, cz + dz * s * 0.12, dx, 0.3, dz, 0.4, 0, 1, 0, 0, 1);
        const a1 = g.vertex(cx + Math.cos(az + 1.25) * s * 0.12, cy, cz + Math.sin(az + 1.25) * s * 0.12, dx, 0.3, dz, 0.6, 0, 1, 0, 0, 1);
        const b0 = g.vertex(cx + dx * s * 0.3, cy - s * 0.5, cz + dz * s * 0.3, dx, 0, dz, 0.4, 1, 1, 0, 0, 1);
        const b1 = g.vertex(cx + Math.cos(az + 1.25) * s * 0.3, cy - s * 0.5, cz + Math.sin(az + 1.25) * s * 0.3, dx, 0, dz, 0.6, 1, 1, 0, 0, 1);
        g.quad(a0, a1, b1, b0);
      }
    } else {
      // umbel: cluster of tiny 4-petal florets on a dome
      const florets = 12 + rng.int(8);
      for (let i = 0; i < florets; i++) {
        const az = rng.float() * Math.PI * 2;
        const rr = Math.sqrt(rng.float()) * s;
        const fx = cx + Math.cos(az) * rr;
        const fz = cz + Math.sin(az) * rr;
        const fy = cy + (1 - (rr / s) * (rr / s)) * s * 0.35;
        const fs = s * 0.16;
        const a0 = g.vertex(fx - fs, fy, fz - fs, 0, 1, 0, 0, 0, 1, 0, 0, 1);
        const a1 = g.vertex(fx + fs, fy, fz - fs, 0, 1, 0, 1, 0, 1, 0, 0, 1);
        const b1 = g.vertex(fx + fs, fy + fs * 0.2, fz + fs, 0, 1, 0, 1, 1, 1, 0, 0, 1);
        const b0 = g.vertex(fx - fs, fy + fs * 0.2, fz + fs, 0, 1, 0, 0, 1, 1, 0, 0, 1);
        g.quad(a0, a1, b1, b0);
      }
    }
  };
  if (kind === 'bell') {
    // several bells hanging along the stem top
    const bells = 2 + rng.int(3);
    for (let i = 0; i < bells; i++) {
      const t = 0.6 + (i / bells) * 0.4;
      head(top.x * t + 0.02 * i, H * t, top.z * t, 0.05 + rng.float() * 0.02);
    }
  } else {
    head(top.x, H + 0.02, top.z, kind === 'umbel' ? 0.09 + rng.float() * 0.04 : 0.045 + rng.float() * 0.02);
  }
  return g.build();
}

// ---------------------------------------------------------------------------
// Registry registration for all standard understory plants
// ---------------------------------------------------------------------------
import { VegetationRegistry, type PoolPart } from '../sdk/Registry';
import { VegClass } from '../gpu/passes/Scatter';
import {
  barkTexturedMaterial,
  flowerMaterial,
  foliageCardMaterial,
  foliageMaterial,
} from '../render/VegMaterials';

// 1. Shrubs
const shrubSpecies = [
  { cls: VegClass.BushHazel, sp: BUSH_HAZEL, maxDist: 170, weights: [0, 0.05, 0.15, 0.3, 0.04, 0.1, 0.02, 0.08, 0.05, 0.06], relation: 'none' as const },
  { cls: VegClass.BushPink, sp: BUSH_PINKFLOWER, maxDist: 170, weights: [0, 0, 0.02, 0.12, 0.1, 0.02, 0.01, 0.05, 0.03, 0.12], relation: 'edge' as const },
  { cls: VegClass.Juniper, sp: BUSH_JUNIPER, maxDist: 170, weights: [0, 0.55, 0.3, 0.02, 0.03, 0, 0.25, 0.05, 0.08, 0.02], relation: 'none' as const, mSlope: -0.8, mInt: 1.3 },
  { cls: VegClass.Creosote, sp: BUSH_CREOSOTE, maxDist: 170, weights: [0, 0, 0.02, 0, 0.04, 0, 0.55, 0, 0, 0.06], relation: 'none' as const, mSlope: -0.9, mInt: 1.4 },
];

shrubSpecies.forEach(({ cls, sp, maxDist, weights, relation, mSlope, mInt }) => {
  VegetationRegistry.registerUnderstory({
    id: sp.id,
    label: sp.label,
    cls,
    maxDist,
    captureParams: sp,
    placement: {
      biomeWeights: weights,
      moistureSlope: mSlope,
      moistureIntercept: mInt,
      canopyRelation: relation,
    },
    buildParts: (rng, atlas, barkOf) => {
      const shrub = buildShrub(sp, rng);
      const parts: PoolPart[] = [
        {
          geo: shrub.bark,
          tris: shrub.bark.index ? shrub.bark.index.count / 3 : 0,
          make: () => barkTexturedMaterial(barkOf(2)),
          castShadow: true,
        },
      ];
      if (shrub.foliage && atlas) {
        parts.push({
          geo: shrub.foliage,
          tris: shrub.foliage.index ? shrub.foliage.index.count / 3 : 0,
          make: () => foliageCardMaterial(atlas, { color: sp.foliageColor }),
          castShadow: true,
        });
      }
      return parts;
    },
  });
});

// 2. Ferns
VegetationRegistry.registerUnderstory({
  id: 'fern',
  label: 'Fern',
  cls: VegClass.Fern,
  maxDist: 140,
  captureParams: FERN_CAPTURE,
  placement: {
    biomeWeights: [0, 0.1, 0.4, 0.38, 0.03, 0.5, 0.02, 0.35, 0.35, 0.08],
    moistureSlope: 1.1,
    moistureIntercept: 0.3,
    canopyRelation: 'clump',
    canopySlope: 1.1,
    canopyIntercept: 0.35,
  },
  buildParts: (rng, atlas) => {
    const geo = buildFern(rng);
    const tris = geo.index ? geo.index.count / 3 : 0;
    return atlas
      ? [
          {
            geo,
            tris,
            make: () => foliageCardMaterial(atlas, { color: FERN_CAPTURE.foliageColor }),
            castShadow: false,
          },
        ]
      : [];
  },
});

// 3. Dry grass
const dryGrassColor = { r: 0.14, g: 0.12, b: 0.05, hueVar: 0.15 };
VegetationRegistry.registerUnderstory({
  id: 'dryGrass',
  label: 'Dry Grass Tuft',
  cls: VegClass.DryGrassTuft,
  maxDist: 120,
  placement: {
    biomeWeights: [0, 0.05, 0.02, 0.02, 0.15, 0.08, 0.35, 0.02, 0.05, 0.28],
    moistureSlope: -0.75,
    moistureIntercept: 1.3,
  },
  buildParts: (rng) => {
    const geo = buildDryGrassTuft(rng);
    const tris = geo.index ? geo.index.count / 3 : 0;
    return [
      {
        geo,
        tris,
        make: () => foliageMaterial({ color: dryGrassColor }),
        castShadow: false,
      },
    ];
  },
});

// 4. Swamp reeds
const reedColor = { r: 0.05, g: 0.11, b: 0.04, hueVar: 0.18 };
VegetationRegistry.registerUnderstory({
  id: 'swampReed',
  label: 'Swamp Reed',
  cls: VegClass.SwampReed,
  maxDist: 160,
  placement: {
    biomeWeights: [0, 0, 0.05, 0.08, 0.04, 0.45, 0, 0.12, 0.55, 0.04],
    moistureSlope: 1.15,
    moistureIntercept: 0.35,
  },
  buildParts: (rng) => {
    const geo = buildSwampReed(rng);
    const tris = geo.index ? geo.index.count / 3 : 0;
    return [
      {
        geo,
        tris,
        make: () => foliageMaterial({ color: reedColor }),
        castShadow: false,
      },
    ];
  },
});

// 5. Jungle Fern
VegetationRegistry.registerUnderstory({
  id: 'jungleFern',
  label: 'Jungle Fern',
  cls: VegClass.JungleFern,
  maxDist: 150,
  captureParams: JUNGLE_FERN_CAPTURE,
  placement: {
    biomeWeights: [0, 0, 0.08, 0.05, 0.02, 0.05, 0, 0.55, 0.15, 0.02],
    moistureSlope: 1.05,
    moistureIntercept: 0.4,
    canopyRelation: 'clump',
    canopySlope: 0.9,
    canopyIntercept: 0.45,
  },
  buildParts: (rng, atlas) => {
    const geo = buildJungleFern(rng);
    const tris = geo.index ? geo.index.count / 3 : 0;
    return atlas
      ? [
          {
            geo,
            tris,
            make: () => foliageCardMaterial(atlas, { color: JUNGLE_FERN_CAPTURE.foliageColor }),
            castShadow: false,
          },
        ]
      : [];
  },
});

// 6. Flowers
const FLOWER_COLOR: Record<string, { r: number; g: number; b: number }> = {
  umbel: { r: 0.75, g: 0.75, b: 0.7 },
  bell: { r: 0.28, g: 0.14, b: 0.5 },
  daisy: { r: 0.85, g: 0.72, b: 0.12 },
};

const flowerKinds: { cls: VegClass; kind: 'umbel' | 'bell' | 'daisy'; weights: number[] }[] = [
  { cls: VegClass.FlowerUmbel, kind: 'umbel', weights: [0, 0.1, 0.05, 0.06, 0.3, 0.2, 0.01, 0.08, 0.06, 0.32] },
  { cls: VegClass.FlowerBell, kind: 'bell', weights: [0, 0.08, 0.04, 0.06, 0.22, 0.1, 0.01, 0.06, 0.05, 0.22] },
  { cls: VegClass.FlowerDaisy, kind: 'daisy', weights: [0, 0.12, 0.04, 0.06, 0.28, 0.08, 0.01, 0.05, 0.04, 0.28] },
];

flowerKinds.forEach(({ cls, kind, weights }) => {
  VegetationRegistry.registerUnderstory({
    id: `flower_${kind}`,
    label: `${kind.charAt(0).toUpperCase() + kind.slice(1)} Flower`,
    cls,
    maxDist: 90,
    placement: {
      biomeWeights: weights,
      canopyRelation: 'gap',
    },
    buildParts: (rng) => {
      const geo = buildFlower(kind, rng);
      const tris = geo.index ? geo.index.count / 3 : 0;
      return [
        {
          geo,
          tris,
          make: () => flowerMaterial(FLOWER_COLOR[kind]!),
          castShadow: false,
        },
      ];
    },
  });
});

