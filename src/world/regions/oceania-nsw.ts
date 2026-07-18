/**
 * NSW macro-zones — simplified geographic bands for digital-twin boot.
 *
 * Research basis: NSW IBRA bioregions collapsed into 7 traversable zones
 * (coast → tablelands → slopes → plains → alpine). Lookup is rule-based on
 * WGS84; reusable pattern for other AU states.
 */

import type { GeoBounds } from '../geo/Geo';
import { containsWgs84 } from '../geo/Geo';
import { AU_STATES } from '../geo/australia';
import { Biome } from '../WorldConst';
import type { RegionZoneSet, ZonePatch } from './types';

/** NSW macro-zone ids (stable URL/manifest tokens). */
export type NswZoneId =
  | 'north-coast'
  | 'hunter-sydney'
  | 'tablelands'
  | 'south-coast'
  | 'western-slopes'
  | 'western-plains'
  | 'alpine-south';

export const NSW_ZONE_SET: RegionZoneSet = {
  id: 'oceania-nsw',
  label: 'NSW macro-zones',
  baseProfile: 'oceania',
  zones: [
    {
      id: 'north-coast',
      label: 'North Coast',
      climate: {
        tempOffset: 1.0,
        moistureScale: 1.08,
        moistureOffset: 0.08,
        vegDensityScale: 0.85,
        groundGrassScale: 1.2,
        treeScale: 0.75,
      },
      layout: { karst: 0.55, lake: 0.95, hillsAmp: 0.88 },
      dominantBiomes: [Biome.Jungle, Biome.Grassland, Biome.Wetland],
      treeSpeciesWeights: [0.35, 0.25, 0.2, 0.2],
    },
    {
      id: 'hunter-sydney',
      label: 'Hunter / Sydney Basin',
      climate: {
        tempOffset: 0.3,
        moistureScale: 0.9,
        moistureOffset: 0.0,
        vegDensityScale: 0.68,
        groundGrassScale: 1.05,
        treeScale: 0.55,
      },
      layout: { karst: 0.4, lake: 0.75, hillsAmp: 0.82 },
      dominantBiomes: [Biome.Grassland, Biome.Jungle, Biome.Meadow],
      treeSpeciesWeights: [0.5, 0.15, 0.25, 0.1],
    },
    {
      id: 'tablelands',
      label: 'Central Tablelands / Blue Mountains',
      climate: {
        tempOffset: -0.5,
        moistureScale: 0.95,
        moistureOffset: 0.05,
        snowlineOffset: 200,
        vegDensityScale: 0.75,
        groundGrassScale: 1.0,
        treeScale: 0.65,
      },
      layout: { alpine: 0.6, karst: 0.5, ridgeAmp: 0.68, hillsAmp: 0.92 },
      dominantBiomes: [Biome.Grassland, Biome.Conifer, Biome.Meadow],
      treeSpeciesWeights: [0.55, 0.15, 0.15, 0.15],
    },
    {
      id: 'south-coast',
      label: 'South Coast / Illawarra',
      climate: {
        tempOffset: 0.2,
        moistureScale: 1.0,
        moistureOffset: 0.04,
        vegDensityScale: 0.72,
        groundGrassScale: 1.1,
        treeScale: 0.6,
      },
      layout: { karst: 0.42, lake: 0.8, hillsAmp: 0.9 },
      dominantBiomes: [Biome.Grassland, Biome.Jungle, Biome.Meadow],
      treeSpeciesWeights: [0.48, 0.18, 0.22, 0.12],
    },
    {
      id: 'western-slopes',
      label: 'Western Slopes',
      climate: {
        tempOffset: 0.8,
        moistureScale: 0.65,
        moistureOffset: -0.05,
        vegDensityScale: 0.55,
        groundGrassScale: 0.85,
        treeScale: 0.45,
      },
      layout: { karst: 0.35, lake: 0.6, hillsAmp: 0.78, ridgeAmp: 0.55 },
      dominantBiomes: [Biome.Grassland, Biome.Meadow, Biome.Desert],
      treeSpeciesWeights: [0.45, 0.1, 0.35, 0.1],
    },
    {
      id: 'western-plains',
      label: 'Western Plains / Murray-Darling',
      climate: {
        tempOffset: 1.5,
        moistureScale: 0.45,
        moistureOffset: -0.1,
        snowlineOffset: 400,
        vegDensityScale: 0.35,
        groundGrassScale: 0.6,
        treeScale: 0.28,
      },
      layout: { alpine: 0.35, karst: 0.25, lake: 0.45, hillsAmp: 0.65, ridgeAmp: 0.45 },
      dominantBiomes: [Biome.Desert, Biome.Grassland, Biome.Meadow],
      treeSpeciesWeights: [0.3, 0.05, 0.55, 0.1],
    },
    {
      id: 'alpine-south',
      label: 'Snowy Mountains',
      climate: {
        tempOffset: -2.0,
        moistureScale: 0.85,
        moistureOffset: 0.02,
        snowlineOffset: -80,
        vegDensityScale: 0.5,
        groundGrassScale: 0.7,
        treeScale: 0.35,
      },
      layout: { alpine: 0.85, karst: 0.35, lake: 0.7, ridgeAmp: 0.75, hillsAmp: 0.88 },
      dominantBiomes: [Biome.Alpine, Biome.Subalpine, Biome.Meadow],
      treeSpeciesWeights: [0.2, 0.15, 0.1, 0.55],
    },
  ],
};

const NSW_BOUNDS: GeoBounds = AU_STATES.find((s) => s.id === 'nsw')!.bounds;

const ZONE_MAP = new Map<string, ZonePatch>(
  NSW_ZONE_SET.zones.map((z) => [z.id, z]),
);

export function nswZonePatch(id: NswZoneId): ZonePatch | undefined {
  return ZONE_MAP.get(id);
}

export function listNswZones(): readonly ZonePatch[] {
  return NSW_ZONE_SET.zones;
}

/**
 * Classify a WGS84 point into an NSW macro-zone.
 * Priority: alpine → north coast → south coast → sydney → plains → slopes → tablelands.
 */
export function nswZoneAt(lat: number, lon: number): NswZoneId {
  if (!containsWgs84(NSW_BOUNDS, lat, lon)) return 'tablelands';

  if (lat < -35.5 && lon > 148.0 && lon < 149.6) return 'alpine-south';
  if (lon > 152.2 && lat > -32.5) return 'north-coast';
  if (lon > 149.8 && lat < -34.8) return 'south-coast';
  if (lon > 150.3 && lat > -34.5 && lat < -32.8) return 'hunter-sydney';
  if (lon < 145.5 || (lon < 147.0 && lat > -33.0)) return 'western-plains';
  if (lon < 149.0) return 'western-slopes';
  return 'tablelands';
}

/** Zone from state grid cell — coarse fallback when lat/lon unknown. */
export function nswZoneFromTile(col: number, row: number): NswZoneId {
  if (row <= 1 && col >= 12) return 'alpine-south';
  if (row >= 9 && col >= 13) return 'north-coast';
  if (row <= 3 && col >= 11) return 'south-coast';
  if (row >= 5 && row <= 7 && col >= 12) return 'hunter-sydney';
  if (col <= 4) return 'western-plains';
  if (col <= 10 && row >= 3 && row <= 8) return 'western-slopes';
  if (row <= 2 && col >= 9) return 'alpine-south';
  return 'tablelands';
}

export function resolveNswZone(opts: {
  lat?: number | null;
  lon?: number | null;
  col?: number | null;
  row?: number | null;
}): NswZoneId {
  if (opts.lat != null && opts.lon != null) return nswZoneAt(opts.lat, opts.lon);
  if (opts.col != null && opts.row != null) return nswZoneFromTile(opts.col, opts.row);
  return 'tablelands';
}
