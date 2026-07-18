/**
 * Tree catalog entries — mirrors TREE_SPECIES / VegClass 0..13.
 */

import { VegClass } from '../../gpu/passes/Scatter';
import { TREE_SPECIES } from '../Species';
import type { BiomeProfile, PlantDefinition } from './types';

const TREE_BIOMES: Record<string, readonly BiomeProfile[]> = {
  spruce: ['alpine'],
  pine: ['alpine'],
  beech: ['alpine', 'jungle'],
  birch: ['alpine', 'swamp'],
  karst: ['alpine'],
  snag: ['alpine', 'desert', 'grassland'],
  mesquite: ['desert'],
  joshua: ['desert'],
  tropicalFig: ['jungle'],
  palm: ['jungle'],
  cypress: ['swamp'],
  willow: ['swamp'],
  oak: ['grassland'],
  acacia: ['grassland', 'desert'],
};

const TREE_VEG: VegClass[] = [
  VegClass.Spruce,
  VegClass.Pine,
  VegClass.Beech,
  VegClass.Birch,
  VegClass.KarstGnarl,
  VegClass.Snag,
  VegClass.Mesquite,
  VegClass.Joshua,
  VegClass.TropicalFig,
  VegClass.Palm,
  VegClass.Cypress,
  VegClass.Willow,
  VegClass.Oak,
  VegClass.Acacia,
];

export const TREE_LIBRARY: readonly PlantDefinition[] = TREE_SPECIES.map((sp, i) => ({
  id: sp.id,
  label: sp.label,
  tier: 'tree' as const,
  module: 'Species.ts',
  builder: 'buildTree',
  stage: 'scatter' as const,
  biomes: TREE_BIOMES[sp.id] ?? ['all'],
  vegClass: TREE_VEG[i] ?? null,
  species: sp,
  tags: ['conifer', 'broadleaf', 'hero'].filter(() => false),
}));
