/**
 * Digital-twin boot resolution — maps URL/GPS/state/tile to import + profile.
 */

import type { LaasParams } from '../core/Params';
import type { ImportManifest } from '../contracts/import';
import { wgs84ToWorld, type GeoBounds, type Wgs84 } from './geo/Geo';
import {
  SITE_IMPORTS,
  getState,
  parseTileId,
  resolveStateTile,
  tileAt,
  type StateTile,
} from './geo/australia';
import { profileKey, resolveZone } from './regions';

export type WorldMode = 'authored' | 'real';

export interface WorldBootPlan {
  mode: WorldMode;
  importId: string | null;
  profile: string;
  region: string | null;
  zoneId: string | null;
  stateId: string | null;
  tile: StateTile | null;
  /** GPS pin when lat/lon supplied */
  wgs84: Wgs84 | null;
  /** spawn in world meters when GPS/tile resolved */
  spawn: { x: number; z: number; alt: number } | null;
  /** bounds used for GPS mapping (import site or tile cell) */
  geoBounds: GeoBounds | null;
  label: string | null;
}

function siteForImport(importId: string) {
  return SITE_IMPORTS[importId] ?? null;
}

function resolveBootZone(opts: {
  stateId?: string | null;
  siteZoneId?: string | null;
  lat?: number | null;
  lon?: number | null;
  col?: number | null;
  row?: number | null;
}): string | null {
  return resolveZone({
    stateId: opts.stateId,
    zoneId: opts.siteZoneId,
    lat: opts.lat,
    lon: opts.lon,
    col: opts.col,
    row: opts.row,
  });
}

function withZoneProfile(
  baseProfile: string,
  region: string | null,
  zoneId: string | null,
): { profile: string; region: string | null } {
  const regionOut = region ?? (baseProfile === 'oceania' ? 'oceania' : null);
  const profile =
    zoneId && (baseProfile === 'oceania' || regionOut === 'oceania')
      ? profileKey(baseProfile, zoneId)
      : baseProfile;
  return { profile, region: regionOut };
}

export function resolveWorldBoot(params: LaasParams): WorldBootPlan {
  const mode: WorldMode =
    params.world === 'real' ||
    params.lat !== null ||
    params.lon !== null ||
    params.state ||
    params.tile ||
    (params.importId && siteForImport(params.importId))
      ? 'real'
      : 'authored';

  if (mode === 'authored' && !params.importId) {
    return {
      mode: 'authored',
      importId: null,
      profile: params.profile,
      region: null,
      zoneId: null,
      stateId: null,
      tile: null,
      wgs84: null,
      spawn: null,
      geoBounds: null,
      label: null,
    };
  }

  // Explicit import (?import=nsw-blue-mountains)
  if (params.importId) {
    const site = siteForImport(params.importId);
    const wgs84 =
      params.lat !== null && params.lon !== null
        ? { lat: params.lat, lon: params.lon }
        : site
          ? { lat: (site.bounds.south + site.bounds.north) * 0.5, lon: (site.bounds.west + site.bounds.east) * 0.5 }
          : null;
    const bounds = site?.bounds ?? null;
    const spawn =
      wgs84 && bounds
        ? { ...wgs84ToWorld(wgs84.lat, wgs84.lon, bounds), alt: params.spawnAlt }
        : null;
    const parsedTile = site ? parseTileId(site.tileId) : null;
    const tile =
      site && parsedTile
        ? resolveStateTile(site.stateId, parsedTile.col, parsedTile.row)
        : null;
    const zoneId = resolveBootZone({
      stateId: site?.stateId,
      siteZoneId: site?.zoneId,
      lat: wgs84?.lat,
      lon: wgs84?.lon,
      col: parsedTile?.col,
      row: parsedTile?.row,
    });
    const prof = withZoneProfile(site?.profile ?? params.profile, site?.region ?? null, zoneId);
    return {
      mode: 'real',
      importId: params.importId,
      profile: prof.profile,
      region: prof.region,
      zoneId,
      stateId: site?.stateId ?? params.state,
      tile,
      wgs84,
      spawn,
      geoBounds: bounds,
      label: site?.label ?? params.importId,
    };
  }

  // Tile id (?tile=nsw-c11-r04)
  if (params.tile) {
    const parsed = parseTileId(params.tile);
    if (parsed) {
      const tile = resolveStateTile(parsed.stateId, parsed.col, parsed.row);
      if (tile?.importId) {
        const site = siteForImport(tile.importId);
        const bounds = site?.bounds ?? tile.bounds;
        const wgs84 =
          params.lat !== null && params.lon !== null
            ? { lat: params.lat, lon: params.lon }
            : { lat: (bounds.south + bounds.north) * 0.5, lon: (bounds.west + bounds.east) * 0.5 };
        const zoneId = resolveBootZone({
          stateId: tile.stateId,
          siteZoneId: site?.zoneId,
          lat: wgs84.lat,
          lon: wgs84.lon,
          col: parsed.col,
          row: parsed.row,
        });
        const prof = withZoneProfile(site?.profile ?? 'oceania', site?.region ?? 'oceania', zoneId);
        return {
          mode: 'real',
          importId: tile.importId,
          profile: prof.profile,
          region: prof.region,
          zoneId,
          stateId: tile.stateId,
          tile,
          wgs84,
          spawn: { ...wgs84ToWorld(wgs84.lat, wgs84.lon, bounds), alt: params.spawnAlt },
          geoBounds: bounds,
          label: site?.label ?? tile.label,
        };
      }
      const tb = tile?.bounds;
      const zoneId = resolveBootZone({
        stateId: tile?.stateId ?? parsed.stateId,
        lat: tb ? (tb.south + tb.north) * 0.5 : null,
        lon: tb ? (tb.west + tb.east) * 0.5 : null,
        col: parsed.col,
        row: parsed.row,
      });
      const prof = withZoneProfile(
        params.state === 'nsw' || tile?.stateId === 'nsw' ? 'oceania' : params.profile,
        tile?.stateId === 'nsw' ? 'oceania' : null,
        zoneId,
      );
      return {
        mode: 'real',
        importId: null,
        profile: prof.profile,
        region: prof.region,
        zoneId,
        stateId: tile?.stateId ?? parsed.stateId,
        tile,
        wgs84: null,
        spawn: null,
        geoBounds: tile?.bounds ?? null,
        label: tile?.label ?? params.tile,
      };
    }
  }

  // GPS (?lat=&lon=) with optional ?state=nsw
  if (params.lat !== null && params.lon !== null) {
    const tile = tileAt(params.lat, params.lon, params.state ?? undefined);
    if (tile?.importId) {
      const site = siteForImport(tile.importId);
      const bounds = site?.bounds ?? tile.bounds;
      const zoneId = resolveBootZone({
        stateId: tile.stateId,
        siteZoneId: site?.zoneId,
        lat: params.lat,
        lon: params.lon,
        col: tile.col,
        row: tile.row,
      });
      const prof = withZoneProfile(site?.profile ?? 'oceania', site?.region ?? 'oceania', zoneId);
      return {
        mode: 'real',
        importId: tile.importId,
        profile: prof.profile,
        region: prof.region,
        zoneId,
        stateId: tile.stateId,
        tile,
        wgs84: { lat: params.lat, lon: params.lon },
        spawn: { ...wgs84ToWorld(params.lat, params.lon, bounds), alt: params.spawnAlt },
        geoBounds: bounds,
        label: site?.label ?? tile.label,
      };
    }
    const state = params.state ? getState(params.state) : null;
    const zoneId = resolveBootZone({
      stateId: state?.id ?? tile?.stateId,
      lat: params.lat,
      lon: params.lon,
      col: tile?.col,
      row: tile?.row,
    });
    const prof = withZoneProfile(
      state?.id === 'nsw' ? 'oceania' : params.profile,
      state?.id === 'nsw' ? 'oceania' : null,
      zoneId,
    );
    return {
      mode: 'real',
      importId: null,
      profile: prof.profile,
      region: prof.region,
      zoneId,
      stateId: state?.id ?? tile?.stateId ?? null,
      tile,
      wgs84: { lat: params.lat, lon: params.lon },
      spawn: null,
      geoBounds: tile?.bounds ?? state?.bounds ?? null,
      label: tile?.label ?? state?.label ?? null,
    };
  }

  // State-only (?state=nsw) — boot first built site import for that state
  if (params.state) {
    const state = getState(params.state);
    if (state?.active) {
      for (const site of Object.values(SITE_IMPORTS)) {
        if (site.stateId !== state.id) continue;
        const bounds = site.bounds;
        const wgs84 = {
          lat: (bounds.south + bounds.north) * 0.5,
          lon: (bounds.west + bounds.east) * 0.5,
        };
        const parsed = parseTileId(site.tileId);
        const tile = parsed ? resolveStateTile(parsed.stateId, parsed.col, parsed.row) : null;
        const zoneId = resolveBootZone({
          stateId: state.id,
          siteZoneId: site.zoneId,
          lat: wgs84.lat,
          lon: wgs84.lon,
          col: parsed?.col,
          row: parsed?.row,
        });
        const prof = withZoneProfile(site.profile, site.region, zoneId);
        return {
          mode: 'real',
          importId: site.importId,
          profile: prof.profile,
          region: prof.region,
          zoneId,
          stateId: state.id,
          tile,
          wgs84,
          spawn: { ...wgs84ToWorld(wgs84.lat, wgs84.lon, bounds), alt: params.spawnAlt },
          geoBounds: bounds,
          label: site.label,
        };
      }
    }
  }

  return {
    mode: 'authored',
    importId: params.importId,
    profile: params.profile,
    region: null,
    zoneId: null,
    stateId: params.state,
    tile: null,
    wgs84: null,
    spawn: null,
    geoBounds: null,
    label: null,
  };
}

export function enrichImportManifest(manifest: ImportManifest, plan: WorldBootPlan): ImportManifest {
  if (!plan.stateId && !plan.region && !plan.tile && !plan.zoneId) return manifest;
  return {
    ...manifest,
    geo: {
      ...manifest.geo,
      stateId: plan.stateId ?? manifest.geo?.stateId,
      regionId: plan.region ?? manifest.geo?.regionId,
      zoneId: plan.zoneId ?? manifest.geo?.zoneId,
      tileId: plan.tile?.id ?? manifest.geo?.tileId,
      center:
        plan.wgs84 ??
        manifest.geo?.center ??
        (plan.geoBounds
          ? {
              lat: (plan.geoBounds.south + plan.geoBounds.north) * 0.5,
              lon: (plan.geoBounds.west + plan.geoBounds.east) * 0.5,
            }
          : undefined),
    },
  };
}
