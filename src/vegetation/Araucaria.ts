/** Monkey Puzzle (*Araucaria araucana*) — tiered whorled triangular silhouette. */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const ARAUCARIA: SpeciesParams = {
  id: 'araucaria',
  label: 'Monkey Puzzle (Araucaria araucana)',
  kind: 'conifer',
  height: [15, 25],
  trunkRadiusK: 0.024,
  crown: 'cone',
  asym: 0.18,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 14, wander: 0.05, gravitropism: 0.03, droop: 0, tipCurl: 0, taper: 1.0,
    },
    {
      density: 1.1, whorl: 5, childStart: 0.2, childEnd: 0.95,
      angleBase: 1.62, angleTip: 0.35, lenRatio: 0.38, lenJitter: 0.2, radRatio: 0.38,
      segs: 5, wander: 0.08, gravitropism: 0.02, droop: 0.08, tipCurl: 0.2, taper: 0.9,
    },
    {
      density: 2.0, whorl: 0, childStart: 0.3, childEnd: 1.0,
      angleBase: 1.1, angleTip: 0.4, lenRatio: 0.28, lenJitter: 0.22, radRatio: 0.42,
      segs: 3, wander: 0.1, gravitropism: 0.04, droop: 0.05, tipCurl: 0.15, taper: 0.85,
    },
    {
      density: 3.5, whorl: 0, childStart: 0.4, childEnd: 1.0,
      angleBase: 0.75, angleTip: 0.45, lenRatio: 0.22, lenJitter: 0.25, radRatio: 0.45,
      segs: 2, wander: 0.12, gravitropism: 0.06, droop: 0.04, tipCurl: 0.12, taper: 0.82,
    },
  ],
  foliage: {
    kind: 'needleSpray',
    anchorLevel: 3,
    spacing: 0.14,
    tStart: 0.25,
    scale: [0.22, 0.36],
    tilt: 0.65,
    clusterSize: [1, 1],
    normalBend: 0.7,
    card: { mode: 'cross', sizeK: 2.4 },
    leaf: { len: 0.14, width: 0.032, shapePow: 1.2, fold: 0, curl: 0, needleCount: 42, brush: 0.85 },
  },
  flare: { amp: 0.5, height: 0.7, lobes: 5 },
  barkLayer: 33,
  barkRepeats: 4,
  foliageColor: { r: 0.035, g: 0.09, b: 0.04, hueVar: 0.18 },
  brokenTop: 0,
  stubChance: 0.05,
};

export function buildAraucaria(rng: Rng): BuiltTree {
  return buildTree(ARAUCARIA, rng, { foliageMode: 'cards' });
}
