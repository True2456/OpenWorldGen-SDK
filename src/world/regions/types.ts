/**
 * Reusable macro-zone types for digital-twin continents.
 * Zones patch a base WorldProfile (oceania, etc.) — not full ecoregions.
 */

import type { ClimateParams, LayoutScales, WorldProfile } from '../../contracts/biome';
import type { Biome } from '../WorldConst';

/** Partial climate/layout overrides applied on top of a base profile. */
export interface ZonePatch {
  id: string;
  label: string;
  climate?: Partial<ClimateParams>;
  layout?: Partial<LayoutScales>;
  dominantBiomes?: readonly Biome[];
  /**
   * Relative tree-species weights for oceania pool
   * [eucalyptus, kauri, banksia, wollemi] — omit for base oceania mix.
   */
  treeSpeciesWeights?: readonly [number, number, number, number];
}

export interface RegionZoneSet {
  /** continent / state group id (oceania-nsw, oceania-vic, …) */
  id: string;
  label: string;
  /** base profile id this zone set patches */
  baseProfile: string;
  zones: readonly ZonePatch[];
}

export function mergeZoneProfile(base: WorldProfile, patch: ZonePatch): WorldProfile {
  return {
    id: patch.id ? `${base.id}:${patch.id}` : base.id,
    label: patch.label ? `${base.label} — ${patch.label}` : base.label,
    climate: { ...base.climate, ...patch.climate },
    layout: { ...base.layout, ...patch.layout },
    dominantBiomes: patch.dominantBiomes ?? base.dominantBiomes,
  };
}
