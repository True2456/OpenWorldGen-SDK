/**
 * Quaking Aspen (*Populus tremuloides*) — tall slender North American
 * poplar with smooth white bark, a narrow golden-green crown, and dense
 * fine twigs carrying small trembling round leaf clusters.
 */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

/**
 * Aspen grove representative — single upright tree with white smooth bark,
 * slender trunk, and a 10–15 m golden-green crown of trembling round leaves.
 */
export const ASPEN: SpeciesParams = {
  id: 'aspen',
  label: 'Quaking Aspen (Populus tremuloides)',
  kind: 'broadleaf',
  height: [10, 15],
  trunkRadiusK: 0.012,
  crown: 'column',
  asym: 0.24,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 14, wander: 0.035, gravitropism: 0.04, droop: 0, tipCurl: 0, taper: 1.05,
    },
    {
      density: 1.7, whorl: 0, childStart: 0.4, childEnd: 0.96,
      angleBase: 0.9, angleTip: 0.4, lenRatio: 0.34, lenJitter: 0.26, radRatio: 0.34,
      segs: 7, wander: 0.1, gravitropism: 0.03, droop: 0.2, tipCurl: 0.04, taper: 0.92,
    },
    {
      density: 3.8, whorl: 0, childStart: 0.26, childEnd: 0.98,
      angleBase: 0.84, angleTip: 0.46, lenRatio: 0.36, lenJitter: 0.3, radRatio: 0.42,
      segs: 4, wander: 0.12, gravitropism: -0.04, droop: 0.26, tipCurl: 0.02, taper: 0.88,
      planar: 0.42,
    },
    {
      density: 8.2, whorl: 0, childStart: 0.2, childEnd: 1.0,
      angleBase: 0.74, angleTip: 0.44, lenRatio: 0.28, lenJitter: 0.34, radRatio: 0.46,
      segs: 3, wander: 0.14, gravitropism: -0.1, droop: 0.32, tipCurl: 0.04, taper: 0.84,
      planar: 0.58,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.08,
    tStart: 0.12,
    scale: [0.07, 0.11],
    tilt: 0.8,
    clusterSize: [3, 5],
    normalBend: 0.63,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.0 },
    leaf: { len: 0.58, width: 0.56, shapePow: 1.58, fold: 0.14, curl: 0.2, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.22, height: 0.52, lobes: 3 },
  barkLayer: 28,
  barkRepeats: 3,
  foliageColor: { r: 0.11, g: 0.155, b: 0.038, hueVar: 0.36 },
  brokenTop: 0,
  stubChance: 0.02,
};

/**
 * Quaking aspen — white smooth bark, tall slender trunk, golden-green
 * trembling round leaf clusters on a high-density twig lattice.
 */
export function buildAspen(rng: Rng): BuiltTree {
  return buildTree(ASPEN, rng, { foliageMode: 'cards' });
}
