/**
 * Leadwood (*Combretum imberbe*) — massive gnarled African savanna tree.
 * Dense dark crown on twisted contorted limbs and thick dark bark.
 */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const LEADWOOD: SpeciesParams = {
  id: 'leadwood',
  label: 'Leadwood (African savanna)',
  kind: 'broadleaf',
  height: [10, 15],
  trunkRadiusK: 0.036,
  crown: 'irregular',
  asym: 0.44,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 12, wander: 0.32, gravitropism: 0.04, droop: 0, tipCurl: 0.06, taper: 1.12,
    },
    {
      density: 2.2, whorl: 0, childStart: 0.22, childEnd: 0.95,
      angleBase: 1.32, angleTip: 0.62, lenRatio: 0.58, lenJitter: 0.44, radRatio: 0.56,
      segs: 7, wander: 0.32, gravitropism: 0.05, droop: 0.24, tipCurl: 0.16, taper: 0.88,
    },
    {
      density: 3.6, whorl: 0, childStart: 0.18, childEnd: 1.0,
      angleBase: 1.02, angleTip: 0.52, lenRatio: 0.4, lenJitter: 0.46, radRatio: 0.52,
      segs: 5, wander: 0.3, gravitropism: 0.04, droop: 0.38, tipCurl: 0.12, taper: 0.86,
      planar: 0.35,
    },
    {
      density: 5.4, whorl: 0, childStart: 0.2, childEnd: 1.0,
      angleBase: 0.82, angleTip: 0.48, lenRatio: 0.34, lenJitter: 0.46, radRatio: 0.5,
      segs: 2, wander: 0.28, gravitropism: 0.03, droop: 0.26, tipCurl: 0.1, taper: 0.84,
      planar: 0.42,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.052,
    tStart: 0.1,
    scale: [0.08, 0.13],
    tilt: 0.88,
    clusterSize: [2, 4],
    normalBend: 0.64,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.1 },
    leaf: { len: 0.42, width: 0.14, shapePow: 1.25, fold: 0.2, curl: 0.18, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.78, height: 0.88, lobes: 6 },
  barkLayer: 16,
  barkRepeats: 4,
  foliageColor: { r: 0.04, g: 0.09, b: 0.025, hueVar: 0.12 },
  brokenTop: 0,
  stubChance: 0.08,
};

/**
 * African leadwood — massive gnarled savanna tree with a dense dark crown.
 */
export function buildLeadwood(rng: Rng): BuiltTree {
  return buildTree(LEADWOOD, rng, { foliageMode: 'cards' });
}
