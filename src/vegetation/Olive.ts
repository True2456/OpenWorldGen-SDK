/**
 * Olive (*Olea europaea*) — gnarled Mediterranean broadleaf.
 * Twisted grey trunk, silvery-green narrow lanceolate leaves,
 * irregular wind-sculpted crown.
 */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const OLIVE: SpeciesParams = {
  id: 'olive',
  label: 'Olive (Olea europaea)',
  kind: 'broadleaf',
  height: [6, 10],
  trunkRadiusK: 0.034,
  crown: 'irregular',
  asym: 0.46,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 12, wander: 0.34, gravitropism: 0.02, droop: 0, tipCurl: 0.08, taper: 1.05,
    },
    {
      density: 2.4, whorl: 0, childStart: 0.2, childEnd: 0.94,
      angleBase: 1.38, angleTip: 0.68, lenRatio: 0.55, lenJitter: 0.42, radRatio: 0.52,
      segs: 7, wander: 0.3, gravitropism: 0.04, droop: 0.26, tipCurl: 0.14, taper: 0.86,
    },
    {
      density: 3.8, whorl: 0, childStart: 0.18, childEnd: 1.0,
      angleBase: 1.02, angleTip: 0.56, lenRatio: 0.4, lenJitter: 0.44, radRatio: 0.5,
      segs: 4, wander: 0.28, gravitropism: 0.03, droop: 0.22, tipCurl: 0.1, taper: 0.84,
      planar: 0.5,
    },
    {
      density: 6.2, whorl: 0, childStart: 0.22, childEnd: 1.0,
      angleBase: 0.86, angleTip: 0.52, lenRatio: 0.32, lenJitter: 0.42, radRatio: 0.52,
      segs: 2, wander: 0.24, gravitropism: 0.02, droop: 0.18, tipCurl: 0.08, taper: 0.82,
      planar: 0.68,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.075,
    tStart: 0.12,
    scale: [0.09, 0.14],
    tilt: 0.9,
    clusterSize: [2, 4],
    normalBend: 0.62,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.3 },
    leaf: { len: 0.58, width: 0.11, shapePow: 1.42, fold: 0.14, curl: 0.1, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.72, height: 0.75, lobes: 5 },
  barkLayer: 24,
  barkRepeats: 4,
  foliageColor: { r: 0.075, g: 0.115, b: 0.052, hueVar: 0.22 },
  brokenTop: 0,
  stubChance: 0.06,
};

/**
 * Mediterranean olive — gnarled twisted trunk, silvery-green narrow leaves,
 * and an irregular wind-sculpted crown on grey Mediterranean bark.
 */
export function buildOlive(rng: Rng): BuiltTree {
  return buildTree(OLIVE, rng, { foliageMode: 'cards' });
}
