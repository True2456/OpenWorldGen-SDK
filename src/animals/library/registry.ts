/**
 * Animal library registry — query catalog entries across horse + continents.
 */

import { ANIMAL_LIBRARY as HORSE_LIBRARY } from './animals';
import { AFRICA_ANIMAL_LIBRARY } from './africa-animals';
import { ASIA_ANIMAL_LIBRARY } from './asia-animals';
import { EUROPE_ANIMAL_LIBRARY } from './europe-animals';
import { NORTH_AMERICA_ANIMAL_LIBRARY } from './north-america-animals';
import { SOUTH_AMERICA_ANIMAL_LIBRARY } from './south-america-animals';
import { OCEANIA_ANIMAL_LIBRARY } from './oceania-animals';
import type {
  AnimalDefinition,
  AnimalGalleryRow,
  AnimalStage,
  AnimalTier,
  BiomeProfile,
} from './types';

export const ANIMAL_LIBRARY: readonly AnimalDefinition[] = [
  ...HORSE_LIBRARY,
  ...AFRICA_ANIMAL_LIBRARY,
  ...ASIA_ANIMAL_LIBRARY,
  ...EUROPE_ANIMAL_LIBRARY,
  ...NORTH_AMERICA_ANIMAL_LIBRARY,
  ...SOUTH_AMERICA_ANIMAL_LIBRARY,
  ...OCEANIA_ANIMAL_LIBRARY,
];

export { HORSE_LIBRARY };
export {
  AFRICA_ANIMAL_LIBRARY,
  ASIA_ANIMAL_LIBRARY,
  EUROPE_ANIMAL_LIBRARY,
  NORTH_AMERICA_ANIMAL_LIBRARY,
  SOUTH_AMERICA_ANIMAL_LIBRARY,
  OCEANIA_ANIMAL_LIBRARY,
};

export function getAnimal(id: string): AnimalDefinition | undefined {
  return ANIMAL_LIBRARY.find((a) => a.id === id);
}

export function listAnimals(filter?: {
  tier?: AnimalTier;
  stage?: AnimalStage;
  biome?: BiomeProfile;
}): readonly AnimalDefinition[] {
  return ANIMAL_LIBRARY.filter((a) => {
    if (filter?.tier && a.tier !== filter.tier) return false;
    if (filter?.stage && a.stage !== filter.stage && a.stage !== 'both') return false;
    if (filter?.biome && !a.biomes.includes('all') && !a.biomes.includes(filter.biome)) return false;
    return true;
  });
}

export function galleryAnimals(row: AnimalGalleryRow = 'animals'): readonly AnimalDefinition[] {
  return ANIMAL_LIBRARY.filter((a) => a.gallery?.row === row).sort(
    (a, b) => (a.gallery?.colIndex ?? 0) - (b.gallery?.colIndex ?? 0),
  );
}
