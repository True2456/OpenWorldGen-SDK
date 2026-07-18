/**
 * Coast Redwood (*Sequoia sempervirens*) — massive columnar coastal conifer.
 * Straight fibrous red-brown trunk, sparse high crown of flat needle sprays.
 */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

/**
 * Hero-gallery coast redwood — towering columnar silhouette with a long bare
 * bole, fibrous red-brown bark, and sparse feathery needle sprays high in crown.
 */
export const REDWOOD: SpeciesParams = {
  id: 'redwood',
  label: 'Coast Redwood (Sequoia sempervirens)',
  kind: 'conifer',
  height: [30, 45],
  trunkRadiusK: 0.026,
  crown: 'column',
  asym: 0.11,
  levels: [
    {
      // towering straight column — long bare bole below the crown
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 22, wander: 0.014, gravitropism: 0.03, droop: 0, tipCurl: 0, taper: 0.94,
    },
    {
      // sparse whorled primaries — crown concentrated high on the trunk
      density: 0.85, whorl: 3, childStart: 0.6, childEnd: 0.94,
      angleBase: 1.68, angleTip: 0.36, lenRatio: 0.34, lenJitter: 0.24, radRatio: 0.34,
      segs: 7, wander: 0.06, gravitropism: 0.03, droop: 0.3, tipCurl: 0.18, taper: 0.9,
    },
    {
      // sparse secondaries — drooping feathery boughs
      density: 1.5, whorl: 0, childStart: 0.32, childEnd: 0.94,
      angleBase: 0.92, angleTip: 0.44, lenRatio: 0.26, lenJitter: 0.26, radRatio: 0.4,
      segs: 4, wander: 0.08, gravitropism: 0.04, droop: 0.22, tipCurl: 0.14, taper: 0.88,
      planar: 0.6,
    },
    {
      // twiglets: flat needle-spray anchors near the crown tips
      density: 2.4, whorl: 0, childStart: 0.4, childEnd: 1.0,
      angleBase: 0.78, angleTip: 0.42, lenRatio: 0.3, lenJitter: 0.3, radRatio: 0.44,
      segs: 2, wander: 0.09, gravitropism: 0.06, droop: 0.1, tipCurl: 0.1, taper: 0.84,
    },
  ],
  foliage: {
    kind: 'needleSpray',
    anchorLevel: 3,
    spacing: 0.17,
    tStart: 0.38,
    scale: [0.2, 0.32],
    tilt: 0.48,
    clusterSize: [1, 1],
    normalBend: 0.58,
    planarLeaves: true,
    card: { mode: 'lying', sizeK: 2.4 },
    leaf: { len: 0.12, width: 0.018, shapePow: 1, fold: 0, curl: 0, needleCount: 52, brush: 0.15 },
  },
  flare: { amp: 0.58, height: 1.05, lobes: 6 },
  barkLayer: 27,
  barkRepeats: 5,
  foliageColor: { r: 0.032, g: 0.084, b: 0.046, hueVar: 0.18 },
  brokenTop: 0,
  stubChance: 0.02,
};

/**
 * Coast redwood — massive columnar coastal giant with fibrous bark and sparse high needle sprays.
 */
export function buildRedwood(rng: Rng): BuiltTree {
  return buildTree(REDWOOD, rng, { foliageMode: 'cards' });
}
