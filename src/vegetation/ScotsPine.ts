/**
 * Scots Pine (*Pinus sylvestris*) — tall straight trunk with orange-plated
 * bark, sparse flat-topped crown, and paired needle sprays on twig tips.
 */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const SCOTS_PINE: SpeciesParams = {
  id: 'scots-pine',
  label: 'Scots Pine (Pinus sylvestris)',
  kind: 'conifer',
  height: [18, 28],
  trunkRadiusK: 0.017,
  crown: 'dome',
  asym: 0.14,
  levels: [
    {
      // tall straight trunk — long bare bole below the crown
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 16, wander: 0.022, gravitropism: 0.025, droop: 0, tipCurl: 0, taper: 0.96,
    },
    {
      // sparse whorled primaries — flat-topped umbrella near the crown
      density: 1.1, whorl: 4, childStart: 0.58, childEnd: 0.94,
      angleBase: 1.72, angleTip: 0.42, lenRatio: 0.38, lenJitter: 0.26, radRatio: 0.36,
      segs: 7, wander: 0.08, gravitropism: 0.04, droop: 0.22, tipCurl: 0.2, taper: 0.88,
    },
    {
      // secondaries: sparse bough fill, near-horizontal spread
      density: 1.8, whorl: 0, childStart: 0.3, childEnd: 0.96,
      angleBase: 1.0, angleTip: 0.48, lenRatio: 0.28, lenJitter: 0.28, radRatio: 0.42,
      segs: 4, wander: 0.1, gravitropism: 0.05, droop: 0.14, tipCurl: 0.16, taper: 0.86,
      planar: 0.55,
    },
    {
      // twiglets: needle sprays anchor on these sparse tips
      density: 3.0, whorl: 0, childStart: 0.42, childEnd: 1.0,
      angleBase: 0.82, angleTip: 0.45, lenRatio: 0.34, lenJitter: 0.32, radRatio: 0.46,
      segs: 2, wander: 0.11, gravitropism: 0.08, droop: 0.08, tipCurl: 0.12, taper: 0.82,
    },
  ],
  foliage: {
    kind: 'needleSpray',
    anchorLevel: 3,
    spacing: 0.14,
    tStart: 0.32,
    scale: [0.22, 0.36],
    tilt: 0.52,
    clusterSize: [1, 1],
    normalBend: 0.6,
    card: { mode: 'cross', sizeK: 2.0 },
    leaf: { len: 0.16, width: 0.016, shapePow: 1, fold: 0, curl: 0, needleCount: 64, brush: 0.8 },
  },
  flare: { amp: 0.38, height: 0.7, lobes: 4 },
  barkLayer: 1,
  barkRepeats: 4,
  foliageColor: { r: 0.038, g: 0.088, b: 0.044, hueVar: 0.2 },
  brokenTop: 0,
  stubChance: 0.03,
};

/**
 * Scots Pine — tall straight bole, orange-plated bark, sparse flat-topped crown.
 */
export function buildScotsPine(rng: Rng): BuiltTree {
  return buildTree(SCOTS_PINE, rng, { foliageMode: 'cards' });
}
