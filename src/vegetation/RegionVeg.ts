/**
 * Region vegetation — swap tree species pools for digital-twin continents.
 */

import { treeSpeciesWeightsForZone } from '../world/regions/resolve';
import { OCEANIA_TREE_SPECIES } from './library/continent-trees';
import { SNAG } from './Species';
import type { SpeciesParams } from './VegTypes';
import { VegetationRegistry } from '../sdk/Registry';

// Define placement parameters for Oceania trees and register them
const [eucalyptus, kauri, banksia, wollemi] = OCEANIA_TREE_SPECIES;
if (eucalyptus) {
  (eucalyptus as any).placement = {
    biomeWeights: [0, 0.04, 0.1, 0.08, 0.42, 0.12, 0.18, 0.62, 0.22, 0.38],
    moistureSlope: 0.45,
    moistureIntercept: 0.8,
  };
  (eucalyptus as any).regionId = 'oceania';
  VegetationRegistry.registerTree(eucalyptus);
}
if (kauri) {
  (kauri as any).placement = {
    biomeWeights: [0, 0.02, 0.05, 0.04, 0.08, 0.05, 0.04, 0.35, 0.12, 0.1],
    moistureSlope: 0.7,
    moistureIntercept: 0.55,
  };
  (kauri as any).regionId = 'oceania';
  VegetationRegistry.registerTree(kauri);
}
if (banksia) {
  (banksia as any).placement = {
    biomeWeights: [0, 0.08, 0.06, 0.05, 0.28, 0.1, 0.35, 0.08, 0.05, 0.22],
    moistureSlope: -0.35,
    moistureIntercept: 1.2,
  };
  (banksia as any).regionId = 'oceania';
  VegetationRegistry.registerTree(banksia);
}
if (wollemi) {
  (wollemi as any).placement = {
    biomeWeights: [0, 0.12, 0.18, 0.1, 0.15, 0.08, 0.05, 0.28, 0.08, 0.12],
    moistureSlope: 0.55,
    moistureIntercept: 0.65,
  };
  (wollemi as any).regionId = 'oceania';
  VegetationRegistry.registerTree(wollemi);
}

const TREE_POOL_LEN = 14;

function padTreePool(primary: readonly SpeciesParams[]): readonly SpeciesParams[] {
  const out: SpeciesParams[] = [...primary];
  while (out.length < TREE_POOL_LEN) {
    out.push(SNAG);
  }
  return out.slice(0, TREE_POOL_LEN);
}

/** 14-slot tree pool aligned with VegClass 0..13 for scatter. */
export const OCEANIA_TREE_POOL: readonly SpeciesParams[] = padTreePool(OCEANIA_TREE_SPECIES);

export function regionIdFromBoot(
  manifestRegion?: string | null,
  planRegion?: string | null,
  profileId?: string,
): string | null {
  if (planRegion) return planRegion;
  if (manifestRegion) return manifestRegion;
  if (profileId?.startsWith('oceania')) return 'oceania';
  return null;
}

export function treeSpeciesForRegion(
  regionId: string | null,
  zoneId?: string | null,
  stateId?: string | null,
): readonly SpeciesParams[] {
  if (regionId !== 'oceania') {
    return VegetationRegistry.listTrees().filter((t) => t.regionId !== 'oceania');
  }
  const weights = treeSpeciesWeightsForZone(zoneId ?? null, stateId);
  const oceaniaTrees = VegetationRegistry.listTrees().filter((t) => t.regionId === 'oceania');
  if (!weights) return padTreePool(oceaniaTrees);
  // Reorder oceania primary four by zone weights (indices 0..3 in scatter shader)
  const order = [0, 1, 2, 3].sort((a, b) => weights[b]! - weights[a]!);
  const primary = order.map((i) => oceaniaTrees[i]!);
  return padTreePool(primary);
}

export function isOceaniaRegion(regionId: string | null): boolean {
  return regionId === 'oceania';
}

