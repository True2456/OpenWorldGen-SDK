/**
 * Douglas Fir (*Pseudotsuga menziesii*) — tall conical Pacific Northwest
 * conifer with soft pendulous needle sprays and thick furrowed bark.
 */

import type { Rng } from '../core/Seed';
import { SPRUCE } from './Species';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

/**
 * Hero-gallery Douglas fir — extends SPRUCE with taller stature, fuller
 * conical crown, softer feathery sprays, and deeply furrowed bark.
 */
export const DOUGLAS_FIR: SpeciesParams = {
  ...SPRUCE,
  id: 'douglas-fir',
  label: 'Douglas Fir (Pseudotsuga menziesii)',
  height: [25, 35],
  trunkRadiusK: 0.019,
  crown: 'cone',
  asym: 0.16,
  levels: [
    {
      ...SPRUCE.levels[0]!,
      segs: 18,
      wander: 0.012,
      gravitropism: 0.04,
      taper: 1.02,
    },
    {
      ...SPRUCE.levels[1]!,
      density: 4.2,
      whorl: 5,
      childStart: 0.14,
      childEnd: 0.99,
      angleBase: 1.65,
      angleTip: 0.48,
      lenRatio: 0.22,
      lenJitter: 0.18,
      radRatio: 0.34,
      segs: 7,
      wander: 0.05,
      gravitropism: -0.02,
      droop: 0.38,
      tipCurl: 0.22,
      taper: 1.02,
    },
    {
      ...SPRUCE.levels[2]!,
      density: 6.2,
      childStart: 0.1,
      childEnd: 0.99,
      angleBase: 1.0,
      angleTip: 0.72,
      lenRatio: 0.28,
      lenJitter: 0.32,
      radRatio: 0.42,
      segs: 4,
      wander: 0.07,
      gravitropism: -0.04,
      droop: 0.52,
      tipCurl: 0.1,
      taper: 0.92,
      planar: 0.85,
    },
  ],
  foliage: SPRUCE.foliage
    ? {
        ...SPRUCE.foliage,
        kind: 'needleSpray',
        anchorLevel: 2,
        spacing: 0.14,
        tStart: 0.04,
        scale: [0.24, 0.38],
        tilt: 0.58,
        clusterSize: [1, 1],
        normalBend: 0.58,
        planarLeaves: true,
        card: { mode: 'lying', sizeK: 2.8 },
        leaf: { len: 0.12, width: 0.022, shapePow: 1, fold: 0, curl: 0, needleCount: 38, brush: 0.25 },
      }
    : null,
  flare: { amp: 0.62, height: 1.05, lobes: 5 },
  barkLayer: 26,
  barkRepeats: 5,
  foliageColor: { r: 0.042, g: 0.105, b: 0.048, hueVar: 0.2 },
  brokenTop: 0,
  stubChance: 0.02,
};

/**
 * Douglas fir — tall conical crown, soft needle sprays, furrowed bark.
 */
export function buildDouglasFir(rng: Rng): BuiltTree {
  return buildTree(DOUGLAS_FIR, rng, { foliageMode: 'cards' });
}
