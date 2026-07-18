/** Kapok / Ceiba (*Ceiba pentandra*) — massive jungle emergent with buttressed trunk. */

import type { Rng } from '../core/Seed';
import { TROPICAL_FIG } from './Species';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const KAPOK: SpeciesParams = {
  ...TROPICAL_FIG,
  id: 'kapok',
  label: 'Kapok (Ceiba pentandra)',
  height: [28, 40],
  trunkRadiusK: 0.032,
  crown: 'irregular',
  asym: 0.22,
  levels: [
    { ...TROPICAL_FIG.levels[0]!, segs: 14, wander: 0.04, taper: 1.25 },
    {
      ...TROPICAL_FIG.levels[1]!,
      density: 1.2, whorl: 3, childStart: 0.48, childEnd: 0.92,
      angleBase: 1.35, lenRatio: 0.52, droop: 0.12,
    },
    { ...TROPICAL_FIG.levels[2]!, density: 2.4, droop: 0.15 },
    { ...TROPICAL_FIG.levels[3]!, density: 5.5 },
  ],
  foliage: TROPICAL_FIG.foliage
    ? { ...TROPICAL_FIG.foliage, scale: [0.2, 0.32], card: { ...TROPICAL_FIG.foliage.card, sizeK: 2.7 } }
    : null,
  flare: { amp: 0.85, height: 1.2, lobes: 8 },
  barkLayer: 30,
  barkRepeats: 5,
  foliageColor: { r: 0.04, g: 0.11, b: 0.03, hueVar: 0.22 },
};

export function buildKapok(rng: Rng): BuiltTree {
  return buildTree(KAPOK, rng, { foliageMode: 'cards' });
}
