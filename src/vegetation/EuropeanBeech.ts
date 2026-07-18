/**
 * European Beech (*Fagus sylvatica*) — tall broadleaf with a dense dome crown,
 * smooth grey bark, and distichous horizontal branch plates.
 */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const EUROPEAN_BEECH: SpeciesParams = {
  id: 'european-beech',
  label: 'European Beech (Fagus sylvatica)',
  kind: 'broadleaf',
  height: [18, 25],
  trunkRadiusK: 0.026,
  crown: 'dome',
  asym: 0.26,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 11, wander: 0.04, gravitropism: 0.04, droop: 0, tipCurl: 0, taper: 1.22,
    },
    {
      density: 1.7, whorl: 0, childStart: 0.3, childEnd: 0.94,
      angleBase: 1.02, angleTip: 0.48, lenRatio: 0.54, lenJitter: 0.24, radRatio: 0.5,
      segs: 8, wander: 0.09, gravitropism: 0.08, droop: 0.2, tipCurl: 0.1, taper: 0.94,
    },
    {
      density: 2.6, whorl: 0, childStart: 0.22, childEnd: 0.97,
      angleBase: 0.9, angleTip: 0.52, lenRatio: 0.44, lenJitter: 0.28, radRatio: 0.52,
      segs: 5, wander: 0.12, gravitropism: 0.05, droop: 0.28, tipCurl: 0.08, taper: 0.9,
      planar: 0.55,
    },
    {
      // distichous twig plates — layered horizontal foliage
      density: 8.8, whorl: 0, childStart: 0.12, childEnd: 1.0,
      angleBase: 0.88, angleTip: 0.58, lenRatio: 0.26, lenJitter: 0.32, radRatio: 0.55,
      segs: 3, wander: 0.09, gravitropism: -0.02, droop: 0.14, tipCurl: 0.04, taper: 0.85,
      planar: 1,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.11,
    tStart: 0.08,
    scale: [0.17, 0.26],
    tilt: 1.0,
    clusterSize: [2, 4],
    normalBend: 0.72,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.4 },
    leaf: { len: 1.0, width: 0.42, shapePow: 1.15, fold: 0.32, curl: 0.22, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.58, height: 1.25, lobes: 6 },
  barkLayer: 2,
  barkRepeats: 4,
  foliageColor: { r: 0.06, g: 0.145, b: 0.035, hueVar: 0.3 },
  brokenTop: 0,
  stubChance: 0.02,
};

/**
 * European beech — tall dome-crowned broadleaf with smooth grey bark and
 * dense distichous horizontal branch plates.
 */
export function buildEuropeanBeech(rng: Rng): BuiltTree {
  return buildTree(EUROPEAN_BEECH, rng, { foliageMode: 'cards' });
}
