/**
 * Japanese Black Pine (*Pinus thunbergii*) — bonsai / niwaki ornamental form.
 * Twisted trunk, layered horizontal branch pads, dark needle sprays on twig tips.
 */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const BONSAI_PINE: SpeciesParams = {
  id: 'bonsai-pine',
  label: 'Japanese Black Pine (bonsai)',
  kind: 'conifer',
  height: [4, 7],
  trunkRadiusK: 0.034,
  crown: 'irregular',
  asym: 0.54,
  levels: [
    {
      // twisted trunk — windswept lean, visible jin-ready silhouette
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 14, wander: 0.24, gravitropism: 0.02, droop: 0, tipCurl: 0.04, taper: 0.86,
    },
    {
      // primaries: dramatic horizontal branch pads, strong gravitropism hook at tips
      density: 1.5, whorl: 2, childStart: 0.16, childEnd: 0.9,
      angleBase: 1.76, angleTip: 0.38, lenRatio: 0.54, lenJitter: 0.36, radRatio: 0.44,
      segs: 8, wander: 0.2, gravitropism: 0.14, droop: 0.36, tipCurl: 0.28, taper: 0.82,
    },
    {
      // secondaries: fill the bough plane, extend pad clouds outward
      density: 2.9, whorl: 0, childStart: 0.22, childEnd: 0.98,
      angleBase: 1.05, angleTip: 0.48, lenRatio: 0.34, lenJitter: 0.34, radRatio: 0.46,
      segs: 4, wander: 0.14, gravitropism: 0.1, droop: 0.2, tipCurl: 0.18, taper: 0.84,
      planar: 0.72,
    },
    {
      // twiglets: planar lattice pads — dark needle sprays anchor here
      density: 4.6, whorl: 0, childStart: 0.3, childEnd: 1.0,
      angleBase: 0.82, angleTip: 0.42, lenRatio: 0.36, lenJitter: 0.38, radRatio: 0.48,
      segs: 2, wander: 0.12, gravitropism: 0.08, droop: 0.1, tipCurl: 0.12, taper: 0.8,
      planar: 1,
    },
  ],
  foliage: {
    kind: 'needleSpray',
    anchorLevel: 3,
    spacing: 0.1,
    tStart: 0.28,
    scale: [0.24, 0.4],
    tilt: 0.58,
    clusterSize: [1, 1],
    normalBend: 0.68,
    planarLeaves: true,
    card: { mode: 'lying', sizeK: 2.8 },
    leaf: { len: 0.19, width: 0.016, shapePow: 1, fold: 0, curl: 0, needleCount: 92, brush: 0.15 },
  },
  flare: { amp: 0.72, height: 0.75, lobes: 5 },
  barkLayer: 19,
  barkRepeats: 4,
  foliageColor: { r: 0.025, g: 0.062, b: 0.032, hueVar: 0.16 },
  brokenTop: 0,
  stubChance: 0.11,
};

/**
 * Japanese Black Pine bonsai — windswept layered branch clouds on a twisted trunk.
 */
export function buildBonsaiPine(rng: Rng): BuiltTree {
  return buildTree(BONSAI_PINE, rng, { foliageMode: 'cards' });
}
