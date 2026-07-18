/** Coastal Banksia (*Banksia integrifolia*) — gnarled coastal tree with cone spikes. */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const BANKSIA: SpeciesParams = {
  id: 'banksia',
  label: 'Banksia (coastal)',
  kind: 'broadleaf',
  height: [5, 8],
  trunkRadiusK: 0.028,
  crown: 'irregular',
  asym: 0.42,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 8, wander: 0.22, gravitropism: 0.04, droop: 0, tipCurl: 0.06, taper: 1.05,
    },
    {
      density: 2.4, whorl: 0, childStart: 0.28, childEnd: 0.98,
      angleBase: 1.2, angleTip: 0.5, lenRatio: 0.52, lenJitter: 0.36, radRatio: 0.5,
      segs: 5, wander: 0.2, gravitropism: 0.04, droop: 0.22, tipCurl: 0.1, taper: 0.88,
    },
    {
      density: 4.8, whorl: 0, childStart: 0.2, childEnd: 1.0,
      angleBase: 0.88, angleTip: 0.52, lenRatio: 0.34, lenJitter: 0.38, radRatio: 0.52,
      segs: 3, wander: 0.18, gravitropism: 0.02, droop: 0.18, tipCurl: 0.06, taper: 0.85,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 2,
    spacing: 0.09,
    tStart: 0.12,
    scale: [0.1, 0.16],
    tilt: 0.88,
    clusterSize: [3, 4],
    normalBend: 0.64,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.2 },
    leaf: { len: 0.52, width: 0.1, shapePow: 1.3, fold: 0.2, curl: 0.12, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.35, height: 0.45, lobes: 4 },
  barkLayer: 37,
  barkRepeats: 3,
  foliageColor: { r: 0.055, g: 0.12, b: 0.04, hueVar: 0.24 },
  blossom: { r: 0.92, g: 0.55, b: 0.18, frac: 0.55 },
  brokenTop: 0,
  stubChance: 0.06,
};

export function buildBanksia(rng: Rng): BuiltTree {
  return buildTree(BANKSIA, rng, { foliageMode: 'cards' });
}
