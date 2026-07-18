/**
 * Master vegetation library — query trees, understory, and standalone plants.
 */

import { STANDALONE_PLANT_LIBRARY } from './plants';
import { AFRICA_PLANT_LIBRARY } from './continents';
import { AFRICA_TREE_LIBRARY, ASIA_TREE_LIBRARY, EUROPE_TREE_LIBRARY, NORTH_AMERICA_TREE_LIBRARY, OCEANIA_TREE_LIBRARY, SOUTH_AMERICA_TREE_LIBRARY } from './continent-trees';
import { TREE_LIBRARY } from './trees';
import { UNDERSTORY_LIBRARY } from './understory';
import type { BiomeProfile, PlantDefinition, PlantStage, PlantTier } from './types';

export const PLANT_LIBRARY: readonly PlantDefinition[] = [
  ...TREE_LIBRARY,
  ...UNDERSTORY_LIBRARY,
  ...STANDALONE_PLANT_LIBRARY,
  ...AFRICA_PLANT_LIBRARY,
  ...AFRICA_TREE_LIBRARY,
  ...ASIA_TREE_LIBRARY,
  ...EUROPE_TREE_LIBRARY,
  ...NORTH_AMERICA_TREE_LIBRARY,
  ...SOUTH_AMERICA_TREE_LIBRARY,
  ...OCEANIA_TREE_LIBRARY,
];

export function getPlant(id: string): PlantDefinition | undefined {
  return PLANT_LIBRARY.find((p) => p.id === id);
}

export function listPlants(filter?: {
  tier?: PlantTier;
  stage?: PlantStage;
  biome?: BiomeProfile;
}): readonly PlantDefinition[] {
  return PLANT_LIBRARY.filter((p) => {
    if (filter?.tier && p.tier !== filter.tier) return false;
    if (filter?.stage && p.stage !== filter.stage && p.stage !== 'both') return false;
    if (filter?.biome && !p.biomes.includes('all') && !p.biomes.includes(filter.biome)) return false;
    return true;
  });
}

export function plantsForBiome(profileId: string): readonly PlantDefinition[] {
  const biome = profileId as BiomeProfile;
  return listPlants({ biome });
}

export function galleryPlants(
  row:
    | 'newPlants'
    | 'trees'
    | 'ground'
    | 'africaPlants'
    | 'africaTrees'
    | 'asiaPlants'
    | 'asiaTrees'
    | 'europePlants'
    | 'europeTrees'
    | 'northAmericaPlants'
    | 'northAmericaTrees'
    | 'southAmericaPlants'
    | 'southAmericaTrees'
    | 'oceaniaPlants'
    | 'oceaniaTrees' = 'newPlants',
): readonly PlantDefinition[] {
  return PLANT_LIBRARY.filter((p) => p.gallery?.row === row).sort(
    (a, b) => (a.gallery?.colIndex ?? 0) - (b.gallery?.colIndex ?? 0),
  );
}

export function scatteredPlants(): readonly PlantDefinition[] {
  return PLANT_LIBRARY.filter((p) => p.stage === 'scatter' || p.stage === 'both');
}
