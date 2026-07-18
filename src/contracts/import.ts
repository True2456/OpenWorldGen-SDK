/**
 * Import profile contract — orthophoto + DEM driven worlds.
 */

export interface ImportBounds {
  west: number;
  east: number;
  south: number;
  north: number;
}

export interface ImportGeo {
  /** AU state id (nsw, vic, …) */
  stateId?: string;
  /** state grid tile (nsw-c11-r04) */
  tileId?: string;
  /** continent vegetation region (oceania, …) */
  regionId?: string;
  /** macro-zone within state (tablelands, western-plains, …) */
  zoneId?: string;
  /** pin / tile center */
  center?: { lat: number; lon: number };
}

export interface ImportManifest {
  id: string;
  label: string;
  bounds: ImportBounds;
  /** meters — mapped to LAAS WORLD_SIZE */
  worldSize: number;
  res: number;
  /** 0 = procedural only, 1 = DEM only */
  demWeight: number;
  baseProfile: string;
  maps: {
    height: string;
    moisture: string;
    biomePrior: string;
  };
  geo?: ImportGeo;
  camera?: {
    x: number;
    z: number;
    alt: number;
    yaw: number;
    pitch: number;
    tod: number;
  };
  stats?: {
    elevMin: number;
    elevMax: number;
    sourceDem: string;
    sourceOrtho: string;
  };
}

export interface ImportMapsCpu {
  manifest: ImportManifest;
  height: Float32Array;
  moisture: Float32Array;
  biomePrior: Uint8Array;
}
