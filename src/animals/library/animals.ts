/**
 * Procedural animal catalog — gallery specimens and future scatter entries.
 */

import { HORSE_META } from '../Horse';
import type { AnimalDefinition } from './types';

const TRI = { lod0: 5000, lod1: 1600, lod2: 900 } as const;

export const ANIMAL_LIBRARY: readonly AnimalDefinition[] = [
  {
    id: 'horse',
    label: HORSE_META.label,
    tier: 'mammal',
    module: 'Horse.ts',
    builder: 'buildHorse',
    stage: 'gallery',
    biomes: ['grassland', 'alpine'],
    animalClass: null,
    tags: ['grazer', 'herbivore', 'quadruped', 'dapple'],
    triBudget: TRI,
    gallery: { row: 'animals', colIndex: 1, subtitle: 'LOD0 · grey dapple', scale: 1.0, lod: 0 },
  },
  {
    id: 'horse-lod1',
    label: 'Horse LOD1',
    tier: 'mammal',
    module: 'Horse.ts',
    builder: 'buildHorse',
    stage: 'gallery',
    biomes: ['grassland'],
    animalClass: null,
    tags: ['grazer', 'lod'],
    triBudget: TRI,
    gallery: { row: 'animals', colIndex: 0, subtitle: 'LOD1 herd tier', scale: 1.0, lod: 1 },
  },
  {
    id: 'horse-lod2',
    label: 'Horse LOD2',
    tier: 'mammal',
    module: 'Horse.ts',
    builder: 'buildHorse',
    stage: 'gallery',
    biomes: ['grassland'],
    animalClass: null,
    tags: ['grazer', 'lod'],
    triBudget: TRI,
    gallery: { row: 'animals', colIndex: 2, subtitle: 'LOD2 distant tier', scale: 1.0, lod: 2 },
  },
  {
    id: 'horse-variant',
    label: 'Horse variant',
    tier: 'mammal',
    module: 'Horse.ts',
    builder: 'buildHorse',
    stage: 'gallery',
    biomes: ['grassland'],
    animalClass: null,
    tags: ['grazer', 'variant'],
    triBudget: TRI,
    gallery: { row: 'animals', colIndex: 3, subtitle: 'Seed variant', scale: 1.0, lod: 0 },
  },
  {
    id: 'horse-variant2',
    label: 'Horse variant 2',
    tier: 'mammal',
    module: 'Horse.ts',
    builder: 'buildHorse',
    stage: 'gallery',
    biomes: ['grassland'],
    animalClass: null,
    tags: ['grazer', 'variant'],
    triBudget: TRI,
    gallery: { row: 'animals', colIndex: 4, subtitle: 'Seed variant', scale: 1.0, lod: 0 },
  },
];
