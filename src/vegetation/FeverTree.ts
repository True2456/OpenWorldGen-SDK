import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const FEVER_TREE: SpeciesParams = {
  id: 'fever-tree',
  label: 'Fever Tree (Vachellia xanthophloea)',
  kind: 'broadleaf',
  height: [10, 16],
  trunkRadiusK: 0.019,
  crown: 'dome',
  asym: 0.26,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 10, wander: 0.03, gravitropism: 0.02, droop: 0, tipCurl: 0, taper: 1.05,
    },
    {
      density: 1.4, whorl: 0, childStart: 0.62, childEnd: 0.96,
      angleBase: 1.52, angleTip: 0.28, lenRatio: 0.58, lenJitter: 0.28, radRatio: 0.42,
      segs: 7, wander: 0.16, gravitropism: 0.02, droop: 0.18, tipCurl: 0.06, taper: 0.88,
    },
    {
      density: 4.0, whorl: 0, childStart: 0.35, childEnd: 1.0,
      angleBase: 0.8, angleTip: 0.4, lenRatio: 0.32, lenJitter: 0.3, radRatio: 0.48,
      segs: 3, wander: 0.18, gravitropism: -0.04, droop: 0.22, tipCurl: 0.05, taper: 0.82,
      planar: 0.55,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 2,
    spacing: 0.08,
    tStart: 0.18,
    scale: [0.09, 0.14],
    tilt: 0.88,
    clusterSize: [3, 4],
    normalBend: 0.64,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.1 },
    leaf: { len: 0.38, width: 0.07, shapePow: 1.35, fold: 0.14, curl: 0.1, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.42, height: 0.55, lobes: 5 },
  barkLayer: 14,
  barkRepeats: 3,
  foliageColor: { r: 0.08, g: 0.14, b: 0.04, hueVar: 0.22 },
  brokenTop: 0,
  stubChance: 0.03,
};

/**
 * African fever tree — tall straight yellow-barked trunk with a sparse
 * flat umbrella crown of small compound leaf clusters.
 */
export function buildFeverTree(rng: Rng): BuiltTree {
  return buildTree(FEVER_TREE, rng, { foliageMode: 'cards' });
}
