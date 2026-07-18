/**
 * LAAS procedural vegetation library — public API.
 *
 * Usage:
 *   import { PLANT_LIBRARY, getPlant, plantsForBiome } from '../vegetation/library';
 *   import { installNewPlantsGalleryRow, NEW_PLANT_VERIFY_GATES } from '../vegetation/library/gallery';
 */

export type {
  BiomeProfile,
  PlantBuilder,
  PlantDefinition,
  PlantStage,
  PlantTier,
  PlantVerifyGate,
} from './types';

export {
  PLANT_LIBRARY,
  galleryPlants,
  getPlant,
  listPlants,
  plantsForBiome,
  scatteredPlants,
} from './registry';

export { TREE_LIBRARY } from './trees';
export { UNDERSTORY_LIBRARY } from './understory';
export { STANDALONE_PLANT_LIBRARY } from './plants';
export { AFRICA_PLANT_LIBRARY } from './continents';

export { NEW_PLANT_VERIFY_GATES, AFRICA_PLANT_VERIFY_GATES, installNewPlantsGalleryRow, installAfricaPlantsGalleryRow } from './gallery';
export type { GalleryExhibitFn } from './gallery';
