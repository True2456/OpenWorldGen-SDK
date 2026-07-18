import { Biome } from '../WorldConst';
import type { WorldProfile } from './types';

/** Default LAAS art-directed alpine valley world (upstream layout). */
export const ALPINE_PROFILE: WorldProfile = {
  id: 'alpine',
  label: 'Alpine Valley',
  climate: {
    tempOffset: 0,
    moistureScale: 1,
    moistureOffset: 0,
    snowlineOffset: 0,
    vegDensityScale: 1,
    groundGrassScale: 1,
    treeScale: 1,
  },
  layout: {
    alpine: 1,
    karst: 1,
    lake: 1,
    ridgeAmp: 1,
    hillsAmp: 1,
  },
  dominantBiomes: [Biome.Conifer, Biome.KarstForest, Biome.Alpine],
};
