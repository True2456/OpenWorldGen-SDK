import { Biome } from '../WorldConst';
import type { WorldProfile } from './types';

export const SWAMP_PROFILE: WorldProfile = {
  id: 'swamp',
  label: 'Lowland Swamp',
  climate: {
    tempOffset: 2,
    moistureScale: 1.5,
    moistureOffset: 0.22,
    snowlineOffset: 500,
    vegDensityScale: 0.95,
    groundGrassScale: 0.35,
    treeScale: 0.55,
  },
  layout: {
    alpine: 0.2,
    karst: 0.5,
    lake: 1.35,
    ridgeAmp: 0.35,
    hillsAmp: 0.7,
  },
  dominantBiomes: [Biome.Swamp, Biome.Wetland],
};
