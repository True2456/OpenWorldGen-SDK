/** Wollemi Pine (*Wollemia nobilis*) — prehistoric conifer with bubbly bark. */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const WOLLEMI_PINE: SpeciesParams = {
  id: 'wollemi-pine',
  label: 'Wollemi Pine',
  kind: 'conifer',
  height: [15, 25],
  trunkRadiusK: 0.026,
  crown: 'irregular',
  asym: 0.35,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 12, wander: 0.12, gravitropism: 0.03, droop: 0, tipCurl: 0, taper: 1.02,
    },
    {
      density: 1.6, whorl: 0, childStart: 0.25, childEnd: 0.94,
      angleBase: 1.28, angleTip: 0.48, lenRatio: 0.5, lenJitter: 0.32, radRatio: 0.48,
      segs: 6, wander: 0.14, gravitropism: 0.04, droop: 0.2, tipCurl: 0.12, taper: 0.9,
    },
    {
      density: 2.8, whorl: 0, childStart: 0.22, childEnd: 1.0,
      angleBase: 0.92, angleTip: 0.5, lenRatio: 0.36, lenJitter: 0.34, radRatio: 0.5,
      segs: 4, wander: 0.12, gravitropism: 0.03, droop: 0.15, tipCurl: 0.1, taper: 0.86,
      planar: 0.7,
    },
    {
      density: 4.2, whorl: 0, childStart: 0.3, childEnd: 1.0,
      angleBase: 0.8, angleTip: 0.45, lenRatio: 0.28, lenJitter: 0.36, radRatio: 0.52,
      segs: 2, wander: 0.1, gravitropism: 0.02, droop: 0.1, tipCurl: 0.08, taper: 0.84,
      planar: 0.85,
    },
  ],
  foliage: {
    kind: 'needleSpray',
    anchorLevel: 3,
    spacing: 0.1,
    tStart: 0.18,
    scale: [0.2, 0.32],
    tilt: 0.7,
    clusterSize: [1, 1],
    normalBend: 0.65,
    planarLeaves: true,
    card: { mode: 'lying', sizeK: 2.5 },
    leaf: { len: 0.12, width: 0.04, shapePow: 1, fold: 0, curl: 0, needleCount: 36, brush: 0.6 },
  },
  flare: { amp: 0.45, height: 0.65, lobes: 5 },
  barkLayer: 38,
  barkRepeats: 4,
  foliageColor: { r: 0.04, g: 0.1, b: 0.045, hueVar: 0.2 },
  brokenTop: 0,
  stubChance: 0.07,
};

export function buildWollemiPine(rng: Rng): BuiltTree {
  return buildTree(WOLLEMI_PINE, rng, { foliageMode: 'cards' });
}
