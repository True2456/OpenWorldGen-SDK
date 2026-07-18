/**
 * Continent plant catalog — gallery specimens grouped by region.
 */

import { ACACIA } from '../Acacia';
import type { PlantDefinition } from './types';

export const AFRICA_PLANT_LIBRARY: readonly PlantDefinition[] = [
  {
    id: 'savanna-acacia',
    label: 'Acacia',
    tier: 'tree',
    module: 'Acacia.ts',
    builder: 'buildAcacia',
    stage: 'gallery',
    biomes: ['grassland', 'desert'],
    vegClass: null,
    species: ACACIA,
    tags: ['savanna', 'umbrella'],
    gallery: { row: 'africaPlants', colIndex: 0, subtitle: 'Savanna umbrella crown', scale: 0.38 },
  },
  {
    id: 'baobab',
    label: 'Baobab',
    tier: 'tree',
    module: 'Baobab.ts',
    builder: 'buildBaobab',
    stage: 'gallery',
    biomes: ['grassland', 'desert'],
    vegClass: null,
    tags: ['iconic', 'bottle-trunk'],
    gallery: { row: 'africaPlants', colIndex: 1, subtitle: 'Bottle trunk giant', scale: 0.28 },
  },
  {
    id: 'king-protea',
    label: 'King Protea',
    tier: 'flower',
    module: 'Protea.ts',
    builder: 'buildProtea',
    stage: 'gallery',
    biomes: ['grassland'],
    vegClass: null,
    tags: ['fynbos', 'national-flower'],
    gallery: { row: 'africaPlants', colIndex: 2, subtitle: 'Pink bract crown', scale: 5.5 },
  },
  {
    id: 'aloe-vera',
    label: 'Aloe',
    tier: 'shrub',
    module: 'Aloe.ts',
    builder: 'buildAloe',
    stage: 'gallery',
    biomes: ['desert'],
    vegClass: null,
    tags: ['succulent', 'spiny'],
    gallery: { row: 'africaPlants', colIndex: 3, subtitle: 'Blue-green rosette', scale: 4.5 },
  },
  {
    id: 'spekboom',
    label: 'Spekboom',
    tier: 'shrub',
    module: 'Spekboom.ts',
    builder: 'buildSpekboom',
    stage: 'gallery',
    biomes: ['grassland', 'desert'],
    vegClass: null,
    tags: ['succulent', 'carbon-sink'],
    gallery: { row: 'africaPlants', colIndex: 4, subtitle: 'Jade succulent shrub', scale: 8.0 },
  },
];
