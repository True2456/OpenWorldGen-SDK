/**
 * Biome contract — shared types for classification, scatter, and materials.
 * Agents editing biomes should import ONLY from here + one definition file.
 */

import type { Biome } from '../world/WorldConst';

/** Quantization divisor for biome id in biomeTex.r (supports ids 0..15) */
export const BIOME_TEX_SCALE = 16;

/** Climate knobs baked into the GPU biome classifier */
export interface ClimateParams {
  /** Added to base temperature field (°C-ish) */
  tempOffset: number;
  /** Multiplier on moisture field (0..1+) */
  moistureScale: number;
  /** Added after moisture scale */
  moistureOffset: number;
  /** Snow line altitude offset (m) */
  snowlineOffset: number;
  /** Global vegetation density multiplier */
  vegDensityScale: number;
  /** Near-field grass blade ring scale (0 = bare sand/rock only) */
  groundGrassScale: number;
  /** GPU tree scatter density multiplier */
  treeScale: number;
}

/** Macro layout scale factors applied to zone radii */
export interface LayoutScales {
  alpine: number;
  karst: number;
  lake: number;
  /** Multiplier on mountain ridge amplitude */
  ridgeAmp: number;
  /** Multiplier on base hill amplitude */
  hillsAmp: number;
}

export interface WorldProfile {
  id: string;
  label: string;
  climate: ClimateParams;
  layout: LayoutScales;
  /** Biome ids preferred when classification is ambiguous */
  dominantBiomes: readonly Biome[];
}
