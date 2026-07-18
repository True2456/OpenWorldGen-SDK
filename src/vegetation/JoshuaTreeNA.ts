/**
 * Joshua Tree (*Yucca brevifolia*) — North American desert yucca.
 * Single thick fibrous trunk, few up-curving arms, spiky rosette sprays at tips.
 */

import type { Rng } from '../core/Seed';
import { JOSHUA } from './Species';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

/**
 * Hero-gallery Joshua tree — iconic Mojave silhouette, 5–10 m.
 * Distinct from the base `JOSHUA` scatter species (`id: 'joshua'`).
 */
export const JOSHUA_TREE: SpeciesParams = {
  ...JOSHUA,
  id: 'joshua-tree',
  label: 'Joshua Tree (Yucca brevifolia)',
  height: [5, 10],
  trunkRadiusK: 0.028,
  crown: 'column',
  asym: 0.22,
  levels: [
    {
      ...JOSHUA.levels[0]!,
      segs: 12,
      wander: 0.035,
      gravitropism: 0.015,
      taper: 1.08,
    },
    {
      ...JOSHUA.levels[1]!,
      density: 1.0,
      whorl: 2,
      childStart: 0.52,
      childEnd: 0.96,
      angleBase: 0.62,
      angleTip: 0.32,
      lenRatio: 0.52,
      lenJitter: 0.32,
      radRatio: 0.4,
      segs: 6,
      wander: 0.1,
      gravitropism: -0.14,
      droop: 0.04,
      tipCurl: 0.42,
      taper: 0.88,
    },
    {
      ...JOSHUA.levels[2]!,
      density: 4.2,
      childStart: 0.65,
      childEnd: 1.0,
      angleBase: 0.5,
      angleTip: 0.28,
      lenRatio: 0.24,
      lenJitter: 0.34,
      radRatio: 0.42,
      segs: 2,
      wander: 0.12,
      gravitropism: -0.1,
      tipCurl: 0.28,
      taper: 0.82,
    },
  ],
  foliage: JOSHUA.foliage
    ? {
        ...JOSHUA.foliage,
        spacing: 0.1,
        tStart: 0.5,
        scale: [0.32, 0.48],
        tilt: 0.35,
        clusterSize: [1, 1],
        normalBend: 0.62,
        card: { ...JOSHUA.foliage.card, sizeK: 2.6 },
        leaf: {
          ...JOSHUA.foliage.leaf,
          len: 0.16,
          width: 0.024,
          needleCount: 52,
          brush: 0.72,
        },
      }
    : null,
  flare: { amp: 0.32, height: 0.48, lobes: 4 },
  barkLayer: 7,
  barkRepeats: 3,
  foliageColor: { r: 0.05, g: 0.095, b: 0.038, hueVar: 0.14 },
  brokenTop: 0,
  stubChance: 0.05,
};

/**
 * Hero-gallery Joshua tree — stiff column trunk with spiky yucca rosettes.
 */
export function buildJoshuaTree(rng: Rng): BuiltTree {
  return buildTree(JOSHUA_TREE, rng, { foliageMode: 'cards' });
}
