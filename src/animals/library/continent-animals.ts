/**
 * Continent animal morph index — all 30 terrestrial starters.
 */

import type { QuadrupedMorph } from '../QuadrupedMorph';
import { AFRICA_ANIMAL_MORPHS } from './africa-animals';
import { ASIA_ANIMAL_MORPHS } from './asia-animals';
import { EUROPE_ANIMAL_MORPHS } from './europe-animals';
import { NORTH_AMERICA_ANIMAL_MORPHS } from './north-america-animals';
import { OCEANIA_ANIMAL_MORPHS } from './oceania-animals';
import { SOUTH_AMERICA_ANIMAL_MORPHS } from './south-america-animals';

export type AnimalContinentId =
  | 'africa'
  | 'asia'
  | 'europe'
  | 'northAmerica'
  | 'southAmerica'
  | 'oceania';

export const CONTINENT_ANIMAL_MORPHS: Record<AnimalContinentId, readonly QuadrupedMorph[]> = {
  africa: AFRICA_ANIMAL_MORPHS,
  asia: ASIA_ANIMAL_MORPHS,
  europe: EUROPE_ANIMAL_MORPHS,
  northAmerica: NORTH_AMERICA_ANIMAL_MORPHS,
  southAmerica: SOUTH_AMERICA_ANIMAL_MORPHS,
  oceania: OCEANIA_ANIMAL_MORPHS,
};

export const ALL_CONTINENT_ANIMAL_MORPHS: readonly QuadrupedMorph[] = [
  ...AFRICA_ANIMAL_MORPHS,
  ...ASIA_ANIMAL_MORPHS,
  ...EUROPE_ANIMAL_MORPHS,
  ...NORTH_AMERICA_ANIMAL_MORPHS,
  ...SOUTH_AMERICA_ANIMAL_MORPHS,
  ...OCEANIA_ANIMAL_MORPHS,
];

export function getMorph(id: string): QuadrupedMorph | undefined {
  return ALL_CONTINENT_ANIMAL_MORPHS.find((m) => m.id === id);
}

export {
  AFRICA_ANIMAL_MORPHS,
  ASIA_ANIMAL_MORPHS,
  EUROPE_ANIMAL_MORPHS,
  NORTH_AMERICA_ANIMAL_MORPHS,
  SOUTH_AMERICA_ANIMAL_MORPHS,
  OCEANIA_ANIMAL_MORPHS,
};
