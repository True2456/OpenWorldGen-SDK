import { Biome } from '../WorldConst';
import type { WorldProfile } from './types';

/** Australian sclerophyll / eucalyptus woodland — NSW default for digital twin. */
export const OCEANIA_PROFILE: WorldProfile = {
  id: 'oceania',
  label: 'Oceania (AU woodland)',
  climate: {
    tempOffset: 0.5,
    moistureScale: 0.82,
    moistureOffset: -0.02,
    snowlineOffset: 280,
    vegDensityScale: 0.72,
    groundGrassScale: 1.1,
    treeScale: 0.62,
  },
  layout: {
    alpine: 0.55,
    karst: 0.45,
    lake: 0.85,
    ridgeAmp: 0.62,
    hillsAmp: 0.95,
  },
  dominantBiomes: [Biome.Grassland, Biome.Jungle, Biome.Meadow],
};
