import type { BufferGeometry } from 'three';
import type { Rng } from '../core/Seed';
import { buildShrub } from './Understory';
import type { SpeciesParams } from './VegTypes';

const rhodoLevels = (gnarl: number): SpeciesParams['levels'] => [
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

export const RHODODENDRON: SpeciesParams = {
  id: 'rhododendron',
  label: 'Rhododendron',
  kind: 'broadleaf',
  height: [1.6, 2.4],
  trunkRadiusK: 0.02,
  crown: 'dome',
  asym: 0.3,
  levels: rhodoLevels(1.1),
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 2,
    spacing: 0.06,
    tStart: 0.15,
    scale: [0.10, 0.16],
    tilt: 0.9,
    clusterSize: [2, 3],
    normalBend: 0.6,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.3 },
    leaf: { len: 1.0, width: 0.42, shapePow: 1.3, fold: 0.32, curl: 0.15, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.2, height: 0.3, lobes: 3 },
  barkLayer: 2,
  barkRepeats: 2,
  foliageColor: { r: 0.04, g: 0.11, b: 0.03, hueVar: 0.2 },
  blossom: { r: 0.95, g: 0.12, b: 0.38, frac: 0.95 },
  brokenTop: 0,
  stubChance: 0.02,
};

/**
 * Procedural Rhododendron shrub: multi-stem shrub grown using the
 * buildShrub generator with custom RHODODENDRON SpeciesParams.
 */
export function buildRhododendron(
  rng: Rng,
): { bark: BufferGeometry; foliage: BufferGeometry | null; tris: number } {
  return buildShrub(RHODODENDRON, rng);
}
