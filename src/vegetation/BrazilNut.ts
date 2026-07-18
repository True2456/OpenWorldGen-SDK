/**
 * Brazil Nut (*Bertholletia excelsa*) — Amazon emergent with a towering
 * straight trunk, flat umbrella crown, and large oblong evergreen leaves.
 */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

/**
 * Hero-gallery Brazil nut — emergent canopy giant with a long bare bole,
 * spreading umbrella crown, and large glossy leaf clusters.
 */
export const BRAZIL_NUT: SpeciesParams = {
  id: 'brazil-nut',
  label: 'Brazil Nut (Bertholletia excelsa)',
  kind: 'broadleaf',
  height: [30, 40],
  trunkRadiusK: 0.025,
  crown: 'dome',
  asym: 0.2,
  levels: [
    {
      // towering straight column — long bare bole below the umbrella crown
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 22, wander: 0.012, gravitropism: 0.04, droop: 0, tipCurl: 0, taper: 0.96,
    },
    {
      // wide umbrella primaries — crown concentrated high on the trunk
      density: 1.1, whorl: 0, childStart: 0.68, childEnd: 0.96,
      angleBase: 1.58, angleTip: 0.22, lenRatio: 0.72, lenJitter: 0.26, radRatio: 0.44,
      segs: 8, wander: 0.08, gravitropism: 0.02, droop: 0.2, tipCurl: 0.08, taper: 0.9,
    },
    {
      // umbrella secondaries — horizontal spreading boughs
      density: 3.2, whorl: 0, childStart: 0.28, childEnd: 0.98,
      angleBase: 0.95, angleTip: 0.38, lenRatio: 0.48, lenJitter: 0.3, radRatio: 0.48,
      segs: 5, wander: 0.1, gravitropism: -0.02, droop: 0.24, tipCurl: 0.06, taper: 0.88,
      planar: 0.65,
    },
    {
      // twiglets: large leaf-cluster anchors across the umbrella crown
      density: 6.8, whorl: 0, childStart: 0.15, childEnd: 1.0,
      angleBase: 0.82, angleTip: 0.5, lenRatio: 0.32, lenJitter: 0.32, radRatio: 0.52,
      segs: 3, wander: 0.1, gravitropism: -0.04, droop: 0.18, tipCurl: 0.05, taper: 0.84,
      planar: 0.72,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.11,
    tStart: 0.1,
    scale: [0.22, 0.34],
    tilt: 0.95,
    clusterSize: [3, 5],
    normalBend: 0.7,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.8 },
    leaf: { len: 1.05, width: 0.42, shapePow: 1.15, fold: 0.24, curl: 0.16, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.68, height: 1.1, lobes: 6 },
  barkLayer: 29,
  barkRepeats: 4,
  foliageColor: { r: 0.028, g: 0.11, b: 0.024, hueVar: 0.26 },
  brokenTop: 0,
  stubChance: 0.02,
};

/**
 * Brazil nut — Amazon emergent with straight trunk and umbrella crown.
 */
export function buildBrazilNut(rng: Rng): BuiltTree {
  return buildTree(BRAZIL_NUT, rng, { foliageMode: 'cards' });
}
