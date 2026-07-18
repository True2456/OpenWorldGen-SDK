/**
 * English Oak (*Quercus robur*) — massive broad-spreading parkland oak.
 * Wider spreading crown, heavier limbs, and deeply rugged fissured bark
 * on a thick trunk — hero-gallery variant extending the base OAK grammar.
 */

import type { Rng } from '../core/Seed';
import { OAK } from './Species';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

/**
 * English oak — broad spreading silhouette on a massive gnarled trunk.
 * Extends OAK with wider crown spread, heavier limb radii, and rugged bark.
 */
export const ENGLISH_OAK: SpeciesParams = {
  ...OAK,
  id: 'english-oak',
  label: 'English Oak (Quercus robur)',
  height: [14, 22],
  trunkRadiusK: 0.034,
  crown: 'irregular',
  asym: 0.42,
  levels: [
    {
      ...OAK.levels[0]!,
      segs: 10,
      wander: 0.08,
      taper: 1.22,
    },
    {
      ...OAK.levels[1]!,
      density: 1.6,
      childStart: 0.32,
      childEnd: 0.96,
      angleBase: 1.32,
      angleTip: 0.48,
      lenRatio: 0.62,
      lenJitter: 0.28,
      radRatio: 0.58,
      droop: 0.16,
      tipCurl: 0.12,
    },
    {
      ...OAK.levels[2]!,
      density: 2.9,
      childStart: 0.22,
      childEnd: 0.99,
      angleBase: 1.08,
      angleTip: 0.46,
      lenRatio: 0.52,
      lenJitter: 0.3,
      radRatio: 0.58,
      droop: 0.2,
      planar: 0.55,
    },
    {
      ...OAK.levels[3]!,
      density: 6.8,
      childStart: 0.14,
      childEnd: 1.0,
      angleBase: 0.98,
      angleTip: 0.5,
      lenRatio: 0.34,
      lenJitter: 0.34,
      radRatio: 0.6,
      droop: 0.12,
      planar: 0.68,
    },
  ],
  foliage: OAK.foliage
    ? {
        ...OAK.foliage,
        spacing: 0.1,
        scale: [0.16, 0.26],
        clusterSize: [3, 5],
        card: { ...OAK.foliage.card, sizeK: 2.6 },
        leaf: { ...OAK.foliage.leaf, len: 1.05, width: 0.52, fold: 0.32 },
      }
    : null,
  flare: { amp: 0.78, height: 1.15, lobes: 7 },
  barkLayer: 22,
  barkRepeats: 6,
  foliageColor: { r: 0.048, g: 0.12, b: 0.028, hueVar: 0.28 },
  stubChance: 0.05,
};

/**
 * English oak — massive broad-spreading parkland tree with rugged bark.
 */
export function buildEnglishOak(rng: Rng): BuiltTree {
  return buildTree(ENGLISH_OAK, rng, { foliageMode: 'cards' });
}
