import type { WorldProfile } from './types';
import { getEffectiveProfile, parseProfileKey } from '../regions/resolve';
import { ALPINE_PROFILE } from './alpine';
import { DESERT_PROFILE } from './desert';
import { GRASSLAND_PROFILE } from './grassland';
import { JUNGLE_PROFILE } from './jungle';
import { OCEANIA_PROFILE } from './oceania';
import { SWAMP_PROFILE } from './swamp';
import { TerrainRegistry } from '../../sdk/Registry';

// Register standard default profiles
TerrainRegistry.register(ALPINE_PROFILE);
TerrainRegistry.register(DESERT_PROFILE);
TerrainRegistry.register(JUNGLE_PROFILE);
TerrainRegistry.register(SWAMP_PROFILE);
TerrainRegistry.register(GRASSLAND_PROFILE);
TerrainRegistry.register(OCEANIA_PROFILE);

export function listProfiles(): readonly WorldProfile[] {
  return TerrainRegistry.list();
}

export function getProfile(id: string | null | undefined): WorldProfile {
  if (!id) return ALPINE_PROFILE;
  const parsed = parseProfileKey(id);
  if (parsed.zone) return getEffectiveProfile(parsed.base, parsed.zone);
  return TerrainRegistry.get(parsed.base) ?? ALPINE_PROFILE;
}

export { ALPINE_PROFILE };

