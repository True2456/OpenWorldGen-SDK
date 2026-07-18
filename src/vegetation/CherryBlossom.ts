/**
 * Cherry Blossom (*Prunus serrulata*) — medium spreading vase crown,
 * dense pink-white blossom clusters on fine planar twig plates,
 * dark reddish-brown bark.
 */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const CHERRY_BLOSSOM: SpeciesParams = {
  id: 'cherry-blossom',
  label: 'Cherry Blossom (Prunus serrulata)',
  kind: 'broadleaf',
  height: [8, 12],
  trunkRadiusK: 0.022,
  crown: 'ellipsoid',
  asym: 0.35,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 10, wander: 0.04, gravitropism: 0.03, droop: 0, tipCurl: 0, taper: 1.06,
    },
    {
      density: 1.3, whorl: 0, childStart: 0.48, childEnd: 0.96,
      angleBase: 1.28, angleTip: 0.42, lenRatio: 0.54, lenJitter: 0.3, radRatio: 0.44,
      segs: 7, wander: 0.13, gravitropism: 0.03, droop: 0.16, tipCurl: 0.08, taper: 0.9,
    },
    {
      density: 2.6, whorl: 0, childStart: 0.32, childEnd: 0.98,
      angleBase: 1.0, angleTip: 0.48, lenRatio: 0.42, lenJitter: 0.32, radRatio: 0.48,
      segs: 5, wander: 0.14, gravitropism: 0.02, droop: 0.2, tipCurl: 0.06, taper: 0.87,
      planar: 0.45,
    },
    {
      density: 4.8, whorl: 0, childStart: 0.22, childEnd: 1.0,
      angleBase: 0.88, angleTip: 0.52, lenRatio: 0.34, lenJitter: 0.34, radRatio: 0.5,
      segs: 3, wander: 0.12, gravitropism: -0.02, droop: 0.22, tipCurl: 0.05, taper: 0.84,
      planar: 0.62,
    },
    {
      density: 7.2, whorl: 0, childStart: 0.18, childEnd: 1.0,
      angleBase: 0.82, angleTip: 0.55, lenRatio: 0.26, lenJitter: 0.36, radRatio: 0.52,
      segs: 2, wander: 0.1, gravitropism: -0.03, droop: 0.18, tipCurl: 0.04, taper: 0.8,
      planar: 0.78,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 4,
    spacing: 0.055,
    tStart: 0.12,
    scale: [0.08, 0.13],
    tilt: 0.88,
    clusterSize: [3, 5],
    normalBend: 0.64,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.4 },
    leaf: { len: 0.52, width: 0.16, shapePow: 1.25, fold: 0.18, curl: 0.12, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.38, height: 0.58, lobes: 4 },
  barkLayer: 17,
  barkRepeats: 3,
  foliageColor: { r: 0.14, g: 0.2, b: 0.1, hueVar: 0.24 },
  blossom: { r: 0.98, g: 0.78, b: 0.86, frac: 0.85 },
  brokenTop: 0,
  stubChance: 0.03,
};

/**
 * Japanese cherry blossom — medium vase-shaped crown with dense pink-white
 * blossom clusters on fine planar twig plates and dark reddish-brown bark.
 */
export function buildCherryBlossom(rng: Rng): BuiltTree {
  return buildTree(CHERRY_BLOSSOM, rng, { foliageMode: 'cards' });
}
