/**
 * Sugar Maple (*Acer saccharum*) — round dense dome crown, brilliant
 * yellow-green fall foliage, and furrowed grey bark on a straight trunk.
 */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const SUGAR_MAPLE: SpeciesParams = {
  id: 'sugar-maple',
  label: 'Sugar Maple (Acer saccharum)',
  kind: 'broadleaf',
  height: [12, 18],
  trunkRadiusK: 0.024,
  crown: 'dome',
  asym: 0.28,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 11, wander: 0.04, gravitropism: 0.03, droop: 0, tipCurl: 0, taper: 1.12,
    },
    {
      density: 1.4, whorl: 0, childStart: 0.38, childEnd: 0.94,
      angleBase: 1.14, angleTip: 0.44, lenRatio: 0.56, lenJitter: 0.26, radRatio: 0.46,
      segs: 8, wander: 0.1, gravitropism: 0.04, droop: 0.18, tipCurl: 0.08, taper: 0.92,
    },
    {
      density: 3.2, whorl: 0, childStart: 0.24, childEnd: 0.98,
      angleBase: 0.94, angleTip: 0.5, lenRatio: 0.44, lenJitter: 0.3, radRatio: 0.5,
      segs: 5, wander: 0.12, gravitropism: 0.03, droop: 0.24, tipCurl: 0.06, taper: 0.88,
      planar: 0.5,
    },
    {
      density: 8.2, whorl: 0, childStart: 0.14, childEnd: 1.0,
      angleBase: 0.86, angleTip: 0.56, lenRatio: 0.28, lenJitter: 0.34, radRatio: 0.52,
      segs: 3, wander: 0.1, gravitropism: -0.02, droop: 0.26, tipCurl: 0.05, taper: 0.84,
      planar: 0.62,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.09,
    tStart: 0.1,
    scale: [0.13, 0.21],
    tilt: 0.9,
    clusterSize: [4, 5],
    normalBend: 0.68,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.6 },
    leaf: { len: 0.58, width: 0.56, shapePow: 0.78, fold: 0.14, curl: 0.1, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.48, height: 0.85, lobes: 5 },
  barkLayer: 25,
  barkRepeats: 4,
  foliageColor: { r: 0.1, g: 0.18, b: 0.028, hueVar: 0.34 },
  brokenTop: 0,
  stubChance: 0.02,
};

/**
 * Sugar maple — round dense dome crown with brilliant yellow-green foliage
 * and furrowed grey bark on a straight medium trunk.
 */
export function buildSugarMaple(rng: Rng): BuiltTree {
  return buildTree(SUGAR_MAPLE, rng, { foliageMode: 'cards' });
}
