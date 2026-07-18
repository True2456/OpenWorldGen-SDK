/**
 * Zone-aware profile resolution — patches base profiles for macro-zones.
 */

import type { WorldProfile } from '../../contracts/biome';
import { ALPINE_PROFILE } from '../profiles/alpine';
import { DESERT_PROFILE } from '../profiles/desert';
import { GRASSLAND_PROFILE } from '../profiles/grassland';
import { JUNGLE_PROFILE } from '../profiles/jungle';
import { OCEANIA_PROFILE } from '../profiles/oceania';
import { SWAMP_PROFILE } from '../profiles/swamp';
import { nswZonePatch, type NswZoneId } from './oceania-nsw';
import { mergeZoneProfile, type ZonePatch } from './types';

const BASE_PROFILES: ReadonlyMap<string, WorldProfile> = new Map([
  [ALPINE_PROFILE.id, ALPINE_PROFILE],
  [DESERT_PROFILE.id, DESERT_PROFILE],
  [JUNGLE_PROFILE.id, JUNGLE_PROFILE],
  [SWAMP_PROFILE.id, SWAMP_PROFILE],
  [GRASSLAND_PROFILE.id, GRASSLAND_PROFILE],
  [OCEANIA_PROFILE.id, OCEANIA_PROFILE],
]);

const MERGED_CACHE = new Map<string, WorldProfile>();

function baseProfile(id: string): WorldProfile {
  return BASE_PROFILES.get(id.toLowerCase()) ?? ALPINE_PROFILE;
}

function zonePatchFor(stateId: string | null, zoneId: string): ZonePatch | undefined {
  if (stateId === 'nsw' || !stateId) {
    return nswZonePatch(zoneId as NswZoneId);
  }
  return nswZonePatch(zoneId as NswZoneId);
}

/** Composite profile key for logging / stats. */
export function profileKey(baseId: string, zoneId?: string | null): string {
  return zoneId ? `${baseId}:${zoneId}` : baseId;
}

/** Parse composite key "oceania:tablelands" → { base, zone }. */
export function parseProfileKey(key: string): { base: string; zone: string | null } {
  const i = key.indexOf(':');
  if (i < 0) return { base: key, zone: null };
  return { base: key.slice(0, i), zone: key.slice(i + 1) };
}

/**
 * Effective world profile — merges zone patch into base when zone is known.
 */
export function getEffectiveProfile(
  baseId: string | null | undefined,
  zoneId?: string | null,
  stateId?: string | null,
): WorldProfile {
  const parsed = parseProfileKey(baseId ?? 'alpine');
  const base = parsed.base;
  const zone = zoneId ?? parsed.zone;
  if (!zone) return baseProfile(base);

  const cacheKey = `${base}:${zone}`;
  const hit = MERGED_CACHE.get(cacheKey);
  if (hit) return hit;

  const patch = zonePatchFor(stateId ?? null, zone);
  if (!patch) return baseProfile(base);

  const merged = mergeZoneProfile(baseProfile(base), patch);
  MERGED_CACHE.set(cacheKey, merged);
  return merged;
}

export function treeSpeciesWeightsForZone(
  zoneId: string | null,
  stateId?: string | null,
): readonly [number, number, number, number] | null {
  if (!zoneId) return null;
  const patch = zonePatchFor(stateId ?? 'nsw', zoneId);
  return patch?.treeSpeciesWeights ?? null;
}
