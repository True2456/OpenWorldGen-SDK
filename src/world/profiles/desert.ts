import { Biome } from '../WorldConst';
import type { WorldProfile } from './types';

export const DESERT_PROFILE: WorldProfile = {
  id: 'desert',
  label: 'Desert Basin',
  climate: {
    tempOffset: 7,
    moistureScale: 0.45,
    moistureOffset: -0.12,
    snowlineOffset: 400,
    vegDensityScale: 0.35,
    groundGrassScale: 0,
    treeScale: 0.18,
  },
  layout: {
    alpine: 0.25,
    karst: 0.35,
    lake: 0.4,
    ridgeAmp: 0.55,
    hillsAmp: 0.85,
  },
  dominantBiomes: [Biome.Desert, Biome.Grassland],
};
