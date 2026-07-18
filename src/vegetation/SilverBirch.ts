/**
 * Silver Birch (*Betula pendula*) — slender European birch with white
 * papery bark, a delicate columnar crown, and fine drooping twig streamers.
 */

import type { Rng } from '../core/Seed';
import { BIRCH } from './Species';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

/**
 * Hero-gallery silver birch — extends BIRCH with taller stature, slimmer trunk,
 * and more pronounced pendulous branching for *Betula pendula*.
 */
export const SILVER_BIRCH: SpeciesParams = {
  ...BIRCH,
  id: 'silver-birch',
  label: 'Silver Birch (Betula pendula)',
  height: [10, 16],
  trunkRadiusK: 0.013,
  crown: 'column',
  asym: 0.22,
  levels: [
    {
      ...BIRCH.levels[0]!,
      segs: 12,
      wander: 0.04,
      taper: 1.08,
    },
    {
      ...BIRCH.levels[1]!,
      density: 2.0,
      childStart: 0.34,
      angleBase: 0.92,
      angleTip: 0.42,
      lenRatio: 0.38,
      radRatio: 0.38,
      droop: 0.48,
      tipCurl: -0.05,
    },
    {
      ...BIRCH.levels[2]!,
      density: 3.4,
      angleBase: 0.76,
      lenRatio: 0.4,
      radRatio: 0.46,
      gravitropism: -0.12,
      droop: 0.58,
      tipCurl: -0.06,
    },
    {
      ...BIRCH.levels[3]!,
      density: 6.6,
      angleBase: 0.66,
      lenRatio: 0.32,
      gravitropism: -0.34,
      droop: 0.78,
      planar: 0.58,
    },
  ],
  foliage: BIRCH.foliage
    ? {
        ...BIRCH.foliage,
        spacing: 0.1,
        scale: [0.09, 0.14],
        clusterSize: [2, 3],
        card: { ...BIRCH.foliage.card, sizeK: 2.15 },
        leaf: { ...BIRCH.foliage.leaf, len: 0.92, width: 0.5, curl: 0.28 },
      }
    : null,
  flare: { amp: 0.28, height: 0.62, lobes: 4 },
  barkLayer: 3,
  barkRepeats: 3,
  foliageColor: { r: 0.08, g: 0.16, b: 0.035, hueVar: 0.32 },
  brokenTop: 0,
  stubChance: 0.03,
};

/**
 * European silver birch — white papery bark, slender trunk, delicate weeping crown.
 */
export function buildSilverBirch(rng: Rng): BuiltTree {
  return buildTree(SILVER_BIRCH, rng, { foliageMode: 'cards' });
}
