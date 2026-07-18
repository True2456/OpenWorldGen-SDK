/**
 * Parametric terrestrial mammal morph — proportions + coat + locomotion.
 * Species are data; mesh/rig code is shared.
 */

import type { CoatParams } from './AnimalMaterials';

export type LocomotionMode = 'walk' | 'hop' | 'biped';

export type HornStyle = 'none' | 'short' | 'long' | 'antler' | 'twisty';

export interface QuadrupedMorph {
  id: string;
  label: string;
  continent:
    | 'africa'
    | 'asia'
    | 'europe'
    | 'northAmerica'
    | 'southAmerica'
    | 'oceania';
  withersM: number;
  lengthM: number;
  /** lateral barrel scale vs horse baseline */
  barrelRx: number;
  /** vertical barrel scale */
  barrelRy: number;
  /** neck length multiplier (1≈horse, ~2.4 giraffe) */
  neckLen: number;
  /** extra neck height rise */
  neckRise: number;
  headScale: readonly [number, number, number];
  muzzleLen: number;
  earLen: number;
  earSpread: number;
  legThick: number;
  hipSpread: number;
  hipY: number;
  hipZFront: number;
  hipZBack: number;
  coat: CoatParams;
  hasMane?: boolean;
  hasTrunk?: boolean;
  hasHump?: boolean;
  hasStripeHint?: boolean;
  horn?: HornStyle;
  locomotion: LocomotionMode;
  /** walk/hop cadence multiplier */
  strideMul: number;
  swingAmp: number;
  bobAmp: number;
  /** gallery display scale */
  galleryScale: number;
  tags: readonly string[];
  biomes: readonly ('alpine' | 'desert' | 'jungle' | 'swamp' | 'grassland' | 'all')[];
}

export const LOD_RING = {
  0: { ring: 12, subdiv: 2, headLat: 8, detail: true },
  1: { ring: 8, subdiv: 1, headLat: 6, detail: false },
  2: { ring: 6, subdiv: 0, headLat: 5, detail: false },
} as const;
