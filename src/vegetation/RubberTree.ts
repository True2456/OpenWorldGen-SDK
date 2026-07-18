/**
 * Rubber Tree (*Hevea brasiliensis*) — tall Amazonian latex producer.
 * Straight columnar trunk, oval glossy crown, large elliptic leaves.
 */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const RUBBER_TREE: SpeciesParams = {
  id: 'rubber-tree',
  label: 'Rubber Tree (Hevea brasiliensis)',
  kind: 'broadleaf',
  height: [18, 28],
  trunkRadiusK: 0.02,
  crown: 'ellipsoid',
  asym: 0.2,
  levels: [
    {
      // tall straight jungle trunk — long bare bole below the oval crown
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 18, wander: 0.016, gravitropism: 0.04, droop: 0, tipCurl: 0, taper: 1.1,
    },
    {
      density: 1.35, whorl: 0, childStart: 0.5, childEnd: 0.93,
      angleBase: 1.2, angleTip: 0.4, lenRatio: 0.5, lenJitter: 0.22, radRatio: 0.44,
      segs: 7, wander: 0.07, gravitropism: 0.05, droop: 0.12, tipCurl: 0.08, taper: 0.92,
    },
    {
      density: 2.8, whorl: 0, childStart: 0.26, childEnd: 0.96,
      angleBase: 0.9, angleTip: 0.48, lenRatio: 0.38, lenJitter: 0.28, radRatio: 0.5,
      segs: 4, wander: 0.1, gravitropism: 0.03, droop: 0.16, tipCurl: 0.06, taper: 0.88,
    },
    {
      density: 6.2, whorl: 0, childStart: 0.14, childEnd: 1.0,
      angleBase: 0.84, angleTip: 0.54, lenRatio: 0.3, lenJitter: 0.3, radRatio: 0.52,
      segs: 3, wander: 0.09, gravitropism: -0.02, droop: 0.12, tipCurl: 0.05, taper: 0.84,
      planar: 0.65,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.09,
    tStart: 0.1,
    scale: [0.14, 0.22],
    tilt: 0.92,
    clusterSize: [3, 5],
    normalBend: 0.7,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.6 },
    leaf: { len: 0.85, width: 0.22, shapePow: 1.4, fold: 0.12, curl: 0.08, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.38, height: 0.72, lobes: 4 },
  barkLayer: 32,
  barkRepeats: 4,
  foliageColor: { r: 0.028, g: 0.11, b: 0.032, hueVar: 0.2 },
  brokenTop: 0,
  stubChance: 0.02,
};

/**
 * Rubber tree — tall straight Amazonian trunk with an oval glossy crown
 * of large elliptic leaf clusters.
 */
export function buildRubberTree(rng: Rng): BuiltTree {
  return buildTree(RUBBER_TREE, rng, { foliageMode: 'cards' });
}
