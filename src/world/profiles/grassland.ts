import { Biome } from '../WorldConst';
import type { WorldProfile } from './types';

export const GRASSLAND_PROFILE: WorldProfile = {
  id: 'grassland',
  label: 'Open Grassland',
  climate: {
    tempOffset: 1,
    moistureScale: 0.75,
    moistureOffset: -0.05,
    snowlineOffset: 200,
    vegDensityScale: 0.55,
    groundGrassScale: 1.45,
    treeScale: 0.35,
  },
  layout: {
    alpine: 0.45,
    karst: 0.55,
    lake: 0.75,
    ridgeAmp: 0.5,
    hillsAmp: 1.05,
  },
  dominantBiomes: [Biome.Grassland, Biome.Meadow],
};
