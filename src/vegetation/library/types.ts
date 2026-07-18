/**
 * Vegetation library contracts — single catalog for trees, shrubs, ground plants,
 * and gallery specimens. Agents and tooling should import from `library/` first.
 */

import type { BufferGeometry } from 'three';
import type { Rng } from '../../core/Seed';
import type { VegClass } from '../../gpu/passes/Scatter';
import type { SpeciesParams } from '../VegTypes';

/** Where a plant is wired into the engine today */
export type PlantStage = 'gallery' | 'scatter' | 'both';

/** Structural role in a biome */
export type PlantTier = 'tree' | 'shrub' | 'fern' | 'flower' | 'grass' | 'reed' | 'ground' | 'rock' | 'debris';

export type BiomeProfile = 'alpine' | 'desert' | 'jungle' | 'swamp' | 'grassland' | 'all';

export interface PlantBuilderResult {
  bark?: BufferGeometry;
  foliage?: BufferGeometry | null;
  geometry?: BufferGeometry;
  tris?: number;
}

export type PlantBuilder = (rng: Rng) => PlantBuilderResult | BufferGeometry;

export interface PlantDefinition {
  id: string;
  label: string;
  tier: PlantTier;
  /** source module (relative to src/vegetation/) */
  module: string;
  builder: string;
  stage: PlantStage;
  biomes: readonly BiomeProfile[];
  /** GPU scatter class when placed in-world; null = gallery-only for now */
  vegClass: VegClass | null;
  /** tree/shrub growth grammar when applicable */
  species?: SpeciesParams;
  tags?: readonly string[];
  gallery?: {
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
      | 'oceaniaTrees';
    colIndex: number;
    subtitle: string;
    scale: number;
  };
}

export interface PlantVerifyGate {
  plantId: string;
  name: string;
  colIndex: number;
  minPxCount: number;
  description: string;
  validate: (r: number, g: number, b: number) => boolean;
}
