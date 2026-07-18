export { mergeZoneProfile, type RegionZoneSet, type ZonePatch } from './types';
export {
  NSW_ZONE_SET,
  listNswZones,
  nswZoneAt,
  nswZoneFromTile,
  nswZonePatch,
  resolveNswZone,
  type NswZoneId,
} from './oceania-nsw';
import { resolveNswZone } from './oceania-nsw';
export {
  getEffectiveProfile,
  parseProfileKey,
  profileKey,
  treeSpeciesWeightsForZone,
} from './resolve';

/** Resolve macro-zone for AU digital-twin boot. */
export function resolveZone(opts: {
  stateId?: string | null;
  lat?: number | null;
  lon?: number | null;
  col?: number | null;
  row?: number | null;
  zoneId?: string | null;
}): string | null {
  if (opts.zoneId) return opts.zoneId;
  if (opts.stateId === 'nsw') {
    return resolveNswZone({
      lat: opts.lat,
      lon: opts.lon,
      col: opts.col,
      row: opts.row,
    });
  }
  return null;
}
