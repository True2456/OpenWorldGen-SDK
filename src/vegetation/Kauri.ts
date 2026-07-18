/**
 * Kauri (*Agathis australis*) — massive New Zealand conifer.
 * Towering straight trunk, broad dome crown, thick leathery scale-like leaves.
 */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

/**
 * Hero-gallery kauri — colossal straight bole, flaking grey bark, and a
 * broad dome crown of overlapping scale-like adult foliage.
 */
export const KAURI: SpeciesParams = {
  id: 'kauri',
  label: 'Kauri (Agathis australis)',
  kind: 'conifer',
  height: [12, 18],
  trunkRadiusK: 0.027,
  crown: 'dome',
  asym: 0.12,
  levels: [
    {
      // massive straight column — long bare bole below the dome crown
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 20, wander: 0.01, gravitropism: 0.03, droop: 0, tipCurl: 0, taper: 0.95,
    },
    {
      // sparse whorled primaries — dome crown concentrated high on the trunk
      density: 0.95, whorl: 4, childStart: 0.55, childEnd: 0.95,
      angleBase: 1.7, angleTip: 0.4, lenRatio: 0.4, lenJitter: 0.22, radRatio: 0.35,
      segs: 7, wander: 0.07, gravitropism: 0.04, droop: 0.18, tipCurl: 0.16, taper: 0.9,
    },
    {
      // secondaries — outward dome fill, near-horizontal spread
      density: 1.6, whorl: 0, childStart: 0.28, childEnd: 0.96,
      angleBase: 1.02, angleTip: 0.46, lenRatio: 0.3, lenJitter: 0.26, radRatio: 0.42,
      segs: 4, wander: 0.09, gravitropism: 0.05, droop: 0.12, tipCurl: 0.14, taper: 0.88,
      planar: 0.5,
    },
    {
      // twiglets: scale-rosette anchors at branch tips
      density: 2.8, whorl: 0, childStart: 0.38, childEnd: 1.0,
      angleBase: 0.8, angleTip: 0.44, lenRatio: 0.32, lenJitter: 0.3, radRatio: 0.45,
      segs: 2, wander: 0.1, gravitropism: 0.07, droop: 0.08, tipCurl: 0.1, taper: 0.84,
    },
  ],
  foliage: {
    kind: 'needleSpray',
    anchorLevel: 3,
    spacing: 0.16,
    tStart: 0.34,
    scale: [0.18, 0.3],
    tilt: 0.5,
    clusterSize: [1, 1],
    normalBend: 0.62,
    planarLeaves: false,
    card: { mode: 'cross', sizeK: 2.2 },
    leaf: { len: 0.09, width: 0.042, shapePow: 1.15, fold: 0.08, curl: 0.06, needleCount: 28, brush: 0.92 },
  },
  flare: { amp: 0.64, height: 1.1, lobes: 6 },
  barkLayer: 35,
  barkRepeats: 5,
  foliageColor: { r: 0.03, g: 0.078, b: 0.042, hueVar: 0.16 },
  brokenTop: 0,
  stubChance: 0.02,
};

/**
 * Kauri — massive straight trunk, dome crown, scale-like adult foliage.
 */
export function buildKauri(rng: Rng): BuiltTree {
  return buildTree(KAURI, rng, { foliageMode: 'cards' });
}
