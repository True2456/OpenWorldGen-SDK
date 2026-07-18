/** Tasmanian Blue Gum (*Eucalyptus globulus*) — tall straight peeling-bark gum. */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const EUCALYPTUS: SpeciesParams = {
  id: 'eucalyptus',
  label: 'Eucalyptus (Tasmanian blue gum)',
  kind: 'broadleaf',
  height: [12, 18],
  trunkRadiusK: 0.022,
  crown: 'column',
  asym: 0.2,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 16, wander: 0.03, gravitropism: 0.02, droop: 0, tipCurl: 0, taper: 0.98,
    },
    {
      density: 0.9, whorl: 0, childStart: 0.62, childEnd: 0.96,
      angleBase: 1.48, angleTip: 0.32, lenRatio: 0.48, lenJitter: 0.24, radRatio: 0.4,
      segs: 6, wander: 0.1, gravitropism: 0.02, droop: 0.28, tipCurl: 0.1, taper: 0.88,
    },
    {
      density: 2.2, whorl: 0, childStart: 0.35, childEnd: 1.0,
      angleBase: 0.9, angleTip: 0.42, lenRatio: 0.32, lenJitter: 0.28, radRatio: 0.44,
      segs: 3, wander: 0.12, gravitropism: -0.02, droop: 0.35, tipCurl: 0.08, taper: 0.84,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 2,
    spacing: 0.12,
    tStart: 0.2,
    scale: [0.14, 0.22],
    tilt: 0.75,
    clusterSize: [2, 3],
    normalBend: 0.66,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.3 },
    leaf: { len: 0.72, width: 0.18, shapePow: 1.1, fold: 0.12, curl: 0.15, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.38, height: 0.6, lobes: 4 },
  barkLayer: 34,
  barkRepeats: 3,
  foliageColor: { r: 0.05, g: 0.13, b: 0.08, hueVar: 0.28 },
  brokenTop: 0,
  stubChance: 0.02,
};

export function buildEucalyptus(rng: Rng): BuiltTree {
  return buildTree(EUCALYPTUS, rng, { foliageMode: 'cards' });
}
