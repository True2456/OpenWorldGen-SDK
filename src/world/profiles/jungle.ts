import { Biome } from '../WorldConst';
import type { WorldProfile } from './types';

export const JUNGLE_PROFILE: WorldProfile = {
  id: 'jungle',
  label: 'Tropical Jungle',
  climate: {
    tempOffset: 4,
    moistureScale: 1.35,
    moistureOffset: 0.18,
    snowlineOffset: 600,
    vegDensityScale: 1.45,
    groundGrassScale: 1.15,
    treeScale: 1.35,
  },
  layout: {
    alpine: 0.15,
    karst: 0.75,
    lake: 0.9,
    ridgeAmp: 0.4,
    hillsAmp: 1.15,
  },
  dominantBiomes: [Biome.Jungle, Biome.Swamp],
};
