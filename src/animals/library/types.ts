/**
 * Animal library contracts — catalog for procedural fauna (gallery + future scatter).
 */

import type { BufferGeometry } from 'three';
import type { Rng } from '../../core/Seed';

export type AnimalStage = 'gallery' | 'scatter' | 'both';
export type AnimalTier = 'mammal' | 'bird' | 'fish' | 'insect';

export type BiomeProfile = 'alpine' | 'desert' | 'jungle' | 'swamp' | 'grassland' | 'all';

export interface AnimalBuilderResult {
  body: BufferGeometry;
  mane?: BufferGeometry | null;
  tris: number;
  height: number;
  length: number;
}

export type AnimalBuilder = (
  rng: Rng,
  opts?: { lod?: 0 | 1 | 2 },
) => AnimalBuilderResult;

export interface AnimalDefinition {
  id: string;
  label: string;
  tier: AnimalTier;
  module: string;
  builder: string;
  stage: AnimalStage;
  biomes: readonly BiomeProfile[];
  /** future GPU scatter class; null = gallery-only */
  animalClass: number | null;
  tags?: readonly string[];
  /** per-species tri budget guidance for instancing */
  triBudget: { lod0: number; lod1: number; lod2: number };
  gallery?: {
    row:
      | 'animals'
      | 'africaAnimals'
      | 'asiaAnimals'
      | 'europeAnimals'
      | 'northAmericaAnimals'
      | 'southAmericaAnimals'
      | 'oceaniaAnimals';
    colIndex: number;
    subtitle: string;
    scale: number;
    /** which LOD ring to exhibit at this pedestal */
    lod: 0 | 1 | 2;
  };
}

export type AnimalGalleryRow =
  | 'animals'
  | 'africaAnimals'
  | 'asiaAnimals'
  | 'europeAnimals'
  | 'northAmericaAnimals'
  | 'southAmericaAnimals'
  | 'oceaniaAnimals';

export interface AnimalVerifyGate {
  animalId: string;
  name: string;
  colIndex: number;
  minPxCount: number;
  description: string;
  validate: (r: number, g: number, b: number) => boolean;
}
