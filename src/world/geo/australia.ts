/**
 * Australia digital-twin index — states, tile grids, built import registry.
 *
 * Each state is subdivided into a coarse lat/lon grid. A grid cell may point
 * at a baked DEM import (`public/import/<id>/`). Only NSW is active in Phase 0.
 */

import type { GeoBounds } from './Geo';
import { containsWgs84 } from './Geo';

export interface AuStateDef {
  id: string;
  label: string;
  bounds: GeoBounds;
  /** tile grid over the state bounds (row 0 = south) */
  grid: { cols: number; rows: number };
  active: boolean;
}

export interface StateTile {
  id: string;
  stateId: string;
  col: number;
  row: number;
  bounds: GeoBounds;
  /** baked import under public/import/, or null if not built yet */
  importId: string | null;
  label: string;
}

/** Approximate state envelopes (WGS84). Finer tiles override at import time. */
export const AU_STATES: readonly AuStateDef[] = [
  {
    id: 'nsw',
    label: 'New South Wales',
    bounds: { west: 141.0, east: 153.64, south: -37.51, north: -28.15 },
    grid: { cols: 16, rows: 12 },
    active: true,
  },
  {
    id: 'vic',
    label: 'Victoria',
    bounds: { west: 140.96, east: 149.98, south: -39.16, north: -33.98 },
    grid: { cols: 12, rows: 8 },
    active: false,
  },
  {
    id: 'qld',
    label: 'Queensland',
    bounds: { west: 137.99, east: 153.55, south: -29.18, north: -9.14 },
    grid: { cols: 20, rows: 24 },
    active: false,
  },
  {
    id: 'wa',
    label: 'Western Australia',
    bounds: { west: 112.92, east: 129.0, south: -35.13, north: -13.69 },
    grid: { cols: 20, rows: 24 },
    active: false,
  },
  {
    id: 'sa',
    label: 'South Australia',
    bounds: { west: 129.0, east: 141.0, south: -38.06, north: -25.99 },
    grid: { cols: 14, rows: 16 },
    active: false,
  },
  {
    id: 'tas',
    label: 'Tasmania',
    bounds: { west: 143.82, east: 148.48, south: -43.64, north: -39.2 },
    grid: { cols: 6, rows: 6 },
    active: false,
  },
  {
    id: 'nt',
    label: 'Northern Territory',
    bounds: { west: 129.0, east: 138.0, south: -26.0, north: -10.97 },
    grid: { cols: 10, rows: 16 },
    active: false,
  },
  {
    id: 'act',
    label: 'Australian Capital Territory',
    bounds: { west: 148.76, east: 149.4, south: -35.92, north: -35.12 },
    grid: { cols: 2, rows: 2 },
    active: false,
  },
];

const STATE_MAP = new Map(AU_STATES.map((s) => [s.id, s]));

/** Built imports keyed by state tile id (e.g. nsw-c11-r04). */
export const BUILT_TILE_IMPORTS: Readonly<Record<string, string>> = {
  'nsw-c11-r04': 'nsw-blue-mountains',
};

export interface SiteImportDef {
  importId: string;
  label: string;
  stateId: string;
  tileId: string;
  bounds: GeoBounds;
  region: 'oceania';
  profile: 'oceania';
  /** NSW macro-zone override; resolved from lat/lon when omitted */
  zoneId?: string;
}

/** High-res site imports with their own bounds (may differ from grid cell). */
export const SITE_IMPORTS: Readonly<Record<string, SiteImportDef>> = {
  'nsw-blue-mountains': {
    importId: 'nsw-blue-mountains',
    label: 'Blue Mountains (Katoomba)',
    stateId: 'nsw',
    tileId: 'nsw-c11-r04',
    bounds: { west: 150.25, east: 150.31, south: -33.78, north: -33.72 },
    region: 'oceania',
    profile: 'oceania',
    zoneId: 'tablelands',
  },
  'nsw-sydney-coast': {
    importId: 'nsw-sydney-coast',
    label: 'Sydney Coast (Bondi)',
    stateId: 'nsw',
    tileId: 'nsw-c13-r04',
    bounds: { west: 151.25, east: 151.31, south: -33.9, north: -33.84 },
    region: 'oceania',
    profile: 'oceania',
    zoneId: 'hunter-sydney',
  },
  'nsw-dubbo-slopes': {
    importId: 'nsw-dubbo-slopes',
    label: 'Western Slopes (Dubbo)',
    stateId: 'nsw',
    tileId: 'nsw-c09-r06',
    bounds: { west: 148.58, east: 148.64, south: -32.28, north: -32.22 },
    region: 'oceania',
    profile: 'oceania',
    zoneId: 'western-slopes',
  },
};

export function getState(id: string): AuStateDef | undefined {
  return STATE_MAP.get(id.toLowerCase());
}

export function stateAt(lat: number, lon: number): AuStateDef | null {
  for (const s of AU_STATES) {
    if (containsWgs84(s.bounds, lat, lon)) return s;
  }
  return null;
}

export function tileBounds(state: AuStateDef, col: number, row: number): GeoBounds {
  const lonSpan = state.bounds.east - state.bounds.west;
  const latSpan = state.bounds.north - state.bounds.south;
  const w = lonSpan / state.grid.cols;
  const h = latSpan / state.grid.rows;
  const west = state.bounds.west + col * w;
  const east = west + w;
  const south = state.bounds.south + row * h;
  const north = south + h;
  return { west, east, south, north };
}

export function tileId(stateId: string, col: number, row: number): string {
  return `${stateId.toLowerCase()}-c${col.toString().padStart(2, '0')}-r${row.toString().padStart(2, '0')}`;
}

export function parseTileId(id: string): { stateId: string; col: number; row: number } | null {
  const m = /^([a-z]+)-c(\d+)-r(\d+)$/i.exec(id);
  if (!m) return null;
  return { stateId: m[1]!.toLowerCase(), col: Number(m[2]), row: Number(m[3]) };
}

export function tileIndex(state: AuStateDef, lat: number, lon: number): { col: number; row: number } | null {
  if (!containsWgs84(state.bounds, lat, lon)) return null;
  const lonSpan = state.bounds.east - state.bounds.west;
  const latSpan = state.bounds.north - state.bounds.south;
  const u = (lon - state.bounds.west) / lonSpan;
  const v = (lat - state.bounds.south) / latSpan;
  const col = Math.min(state.grid.cols - 1, Math.max(0, Math.floor(u * state.grid.cols)));
  const row = Math.min(state.grid.rows - 1, Math.max(0, Math.floor(v * state.grid.rows)));
  return { col, row };
}

export function resolveStateTile(stateId: string, col: number, row: number): StateTile | null {
  const state = getState(stateId);
  if (!state) return null;
  if (col < 0 || row < 0 || col >= state.grid.cols || row >= state.grid.rows) return null;
  const id = tileId(stateId, col, row);
  return {
    id,
    stateId: state.id,
    col,
    row,
    bounds: tileBounds(state, col, row),
    importId: BUILT_TILE_IMPORTS[id] ?? null,
    label: `${state.label} tile c${col} r${row}`,
  };
}

export function tileAt(lat: number, lon: number, stateId?: string): StateTile | null {
  const state = stateId ? getState(stateId) : stateAt(lat, lon);
  if (!state || !state.active) return null;
  const idx = tileIndex(state, lat, lon);
  if (!idx) return null;
  return resolveStateTile(state.id, idx.col, idx.row);
}

export function listStateTiles(stateId: string): StateTile[] {
  const state = getState(stateId);
  if (!state) return [];
  const out: StateTile[] = [];
  for (let row = 0; row < state.grid.rows; row++) {
    for (let col = 0; col < state.grid.cols; col++) {
      out.push(resolveStateTile(stateId, col, row)!);
    }
  }
  return out;
}

export function builtTilesForState(stateId: string): StateTile[] {
  return listStateTiles(stateId).filter((t) => t.importId !== null);
}
