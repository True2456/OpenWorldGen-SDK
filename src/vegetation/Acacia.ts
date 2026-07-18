import type { Rng } from '../core/Seed';
import { ACACIA } from './Species';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export { ACACIA };

/**
 * Umbrella Thorn Acacia — hero-gallery savanna variant.
 * Wider flat crown, denser twig layer, richer card foliage than the base ACACIA species.
 */
export const SAVANNA_ACACIA: SpeciesParams = {
  ...ACACIA,
  id: 'savanna-acacia',
  label: 'Umbrella Thorn Acacia',
  height: [7.5, 12.5],
  asym: 0.32,
  levels: [
    ACACIA.levels[0]!,
    {
      ...ACACIA.levels[1]!,
      density: 2.6,
      angleBase: 1.55,
      angleTip: 0.28,
      lenRatio: 0.72,
      lenJitter: 0.28,
      droop: 0.22,
      tipCurl: 0.1,
    },
    {
      ...ACACIA.levels[2]!,
      density: 7.2,
      angleBase: 0.92,
      angleTip: 0.52,
      lenRatio: 0.38,
      planar: 0.72,
      droop: 0.25,
    },
  ],
  foliage: ACACIA.foliage
    ? {
        ...ACACIA.foliage,
        spacing: 0.08,
        scale: [0.11, 0.18],
        clusterSize: [3, 4],
        card: { ...ACACIA.foliage.card, sizeK: 2.5 },
        leaf: { ...ACACIA.foliage.leaf, len: 0.48, width: 0.085 },
      }
    : null,
  flare: { amp: 0.45, height: 0.65, lobes: 5 },
  foliageColor: { r: 0.065, g: 0.13, b: 0.038, hueVar: 0.26 },
};

/**
 * African savanna acacia — flat umbrella crown on a short trunk.
 * Wraps the shared ACACIA species grammar with gallery-scale card foliage.
 */
export function buildAcacia(rng: Rng): BuiltTree {
  return buildTree(ACACIA, rng, { foliageMode: 'cards' });
}

/**
 * Hero-gallery Umbrella Thorn Acacia — wider crown and denser branchlets.
 */
export function buildSavannaAcacia(rng: Rng): BuiltTree {
  return buildTree(SAVANNA_ACACIA, rng, { foliageMode: 'cards' });
}
