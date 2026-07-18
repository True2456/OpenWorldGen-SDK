/** URL parameter parsing — every run is fully described by its URL. */

import { parseClimateBoot } from '../atmosphere/ClimateClock';

export type QualityPreset = 'low' | 'high' | 'ultra';

export type WorldMode = 'authored' | 'real';

export interface LaasParams {
  /** world seed — reproduces the entire world */
  seed: number;
  /** scene to boot: world | sanity | terrain | gallery (registry in debug/Scenes.ts) */
  scene: string;
  /** world profile: alpine | desert | jungle | swamp | grassland | oceania */
  profile: string;
  /** authored = procedural MacroMap; real = GPS/DEM digital twin when set */
  world: WorldMode;
  /** WGS84 latitude (digital twin spawn / tile lookup) */
  lat: number | null;
  /** WGS84 longitude */
  lon: number | null;
  /** AU state id for tile lookup (nsw first) */
  state: string | null;
  /** state grid tile id (nsw-c11-r04) */
  tile: string | null;
  /** eye height above ground for GPS spawn (m) */
  spawnAlt: number;
  /** weather preset: clear | rain | snow | fog | dust */
  weather: string;
  /** time of day, hours 0..24 */
  timeOfDay: number;
  /** season phase 0..1 (0/1 winter, 0.25 spring, 0.5 summer, 0.75 autumn) */
  seasonPhase: number;
  /** multiplier on how fast the calendar advances vs worldTime */
  seasonSpeed: number;
  /** quality preset: low (iGPU floor), high (default), ultra (max grids) */
  preset: QualityPreset;
  /** HUD visible at boot */
  hud: boolean;
  /** camera pose: "px,py,pz,yaw,pitch[,fov]" */
  cam: string | null;
  /** bookmark index to start at (1..9) */
  shot: number | null;
  /** freeze world time/motion (deterministic screenshots) */
  freeze: boolean;
  /** device pixel ratio cap override */
  dpr: number | null;
  /** import profile id from public/import/<id>/ */
  importId: string | null;
}

function num(v: string | null, fallback: number): number {
  if (v === null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function parseParams(search: string = window.location.search): LaasParams {
  const q = new URLSearchParams(search);
  const presetRaw = q.get('preset') ?? 'high';
  const preset: QualityPreset =
    presetRaw === 'low' || presetRaw === 'ultra' ? presetRaw : 'high';
  const shotN = num(q.get('shot'), 0);
  const climate = parseClimateBoot(search);
  return {
    seed: Math.floor(num(q.get('seed'), 1)) >>> 0,
    scene: q.get('scene') ?? 'world',
    profile: q.get('profile') ?? 'alpine',
    weather: q.get('weather') ?? 'clear',
    timeOfDay: Math.min(24, Math.max(0, num(q.get('T'), 11))),
    seasonPhase: climate.startPhase,
    seasonSpeed: climate.speed,
    preset,
    // full debug panel hidden by default — F3 toggles it (fps chip always on)
    hud: q.get('hud') === '1',
    cam: q.get('cam'),
    shot: shotN >= 1 && shotN <= 9 ? Math.floor(shotN) : null,
    freeze: q.get('freeze') === '1',
    dpr: q.get('dpr') !== null ? num(q.get('dpr'), 1) : null,
    importId: q.get('import'),
    world: q.get('world') === 'real' ? 'real' : 'authored',
    lat: parseLatLon(q.get('lat')),
    lon: parseLatLon(q.get('lon')),
    state: q.get('state'),
    tile: q.get('tile'),
    spawnAlt: Math.min(500, Math.max(1.5, num(q.get('spawnAlt'), 14))),
  };
}

function parseLatLon(v: string | null): number | null {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Parse a `cam` string into pose components; returns null when malformed. */
export function parseCamString(
  cam: string,
): { p: [number, number, number]; yaw: number; pitch: number; fov?: number } | null {
  const parts = cam.split(',').map(Number);
  if (parts.length < 5 || parts.some((v) => !Number.isFinite(v))) return null;
  const [px, py, pz, yaw, pitch, fov] = parts as [number, number, number, number, number, number?];
  const pose = { p: [px, py, pz] as [number, number, number], yaw, pitch };
  return fov !== undefined && Number.isFinite(fov) ? { ...pose, fov } : pose;
}
