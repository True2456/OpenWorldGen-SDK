/**
 * Standalone procedural plant modules (gallery + future scatter).
 */

import { RHODODENDRON } from '../Rhododendron';
import type { PlantDefinition } from './types';

export const STANDALONE_PLANT_LIBRARY: readonly PlantDefinition[] = [
  {
    id: 'rhododendron',
    label: 'Rhododendron',
    tier: 'shrub',
    module: 'Rhododendron.ts',
    builder: 'buildRhododendron',
    stage: 'gallery',
    biomes: ['alpine', 'swamp'],
    vegClass: null,
    species: RHODODENDRON,
    tags: ['blossom', 'shade'],
    gallery: { row: 'newPlants', colIndex: 0, subtitle: 'Pink blossoms', scale: 2.2 },
  },
  {
    id: 'lupine',
    label: 'Lupine',
    tier: 'flower',
    module: 'Lupine.ts',
    builder: 'buildLupine',
    stage: 'gallery',
    biomes: ['alpine', 'grassland'],
    vegClass: null,
    tags: ['spike', 'wildflower'],
    gallery: { row: 'newPlants', colIndex: 1, subtitle: 'Blue/purple spike', scale: 5.5 },
  },
  {
    id: 'cattail',
    label: 'Cattail',
    tier: 'reed',
    module: 'Cattail.ts',
    builder: 'buildCattail',
    stage: 'gallery',
    biomes: ['swamp'],
    vegClass: null,
    tags: ['wetland'],
    gallery: { row: 'newPlants', colIndex: 2, subtitle: 'Wetland reed', scale: 5.0 },
  },
  {
    id: 'hosta',
    label: 'Hosta',
    tier: 'fern',
    module: 'Hosta.ts',
    builder: 'buildHosta',
    stage: 'gallery',
    biomes: ['alpine', 'swamp'],
    vegClass: null,
    tags: ['shade', 'variegated'],
    gallery: { row: 'newPlants', colIndex: 3, subtitle: 'Variegated foliage', scale: 5.5 },
  },
  {
    id: 'clover',
    label: 'Clover',
    tier: 'flower',
    module: 'Clover.ts',
    builder: 'buildClover',
    stage: 'gallery',
    biomes: ['grassland', 'alpine'],
    vegClass: null,
    tags: ['groundcover', 'meadow'],
    gallery: { row: 'newPlants', colIndex: 4, subtitle: 'White flower heads', scale: 24.0 },
  },
];
