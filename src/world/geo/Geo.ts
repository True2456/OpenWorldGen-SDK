/**
 * WGS84 ↔ LAAS world meters within a georeferenced import tile.
 *
 * World axes: x east, z north (matching heightfield texel layout).
 * Origin at tile center; span is `worldSize` (default WORLD_SIZE).
 */

import { WORLD_SIZE } from '../WorldConst';

export interface GeoBounds {
  west: number;
  east: number;
  south: number;
  north: number;
}

export interface Wgs84 {
  lat: number;
  lon: number;
}

export interface WorldXZ {
  x: number;
  z: number;
}

/** Map lon/lat inside bounds to world x/z (meters). */
export function wgs84ToWorld(
  lat: number,
  lon: number,
  bounds: GeoBounds,
  worldSize = WORLD_SIZE,
): WorldXZ {
  const lonSpan = bounds.east - bounds.west;
  const latSpan = bounds.north - bounds.south;
  const u = lonSpan > 0 ? (lon - bounds.west) / lonSpan : 0.5;
  const v = latSpan > 0 ? (lat - bounds.south) / latSpan : 0.5;
  return {
    x: (u - 0.5) * worldSize,
    z: (v - 0.5) * worldSize,
  };
}

/** Inverse of wgs84ToWorld for a tile bounds box. */
export function worldToWgs84(
  x: number,
  z: number,
  bounds: GeoBounds,
  worldSize = WORLD_SIZE,
): Wgs84 {
  const u = x / worldSize + 0.5;
  const v = z / worldSize + 0.5;
  return {
    lon: bounds.west + u * (bounds.east - bounds.west),
    lat: bounds.south + v * (bounds.north - bounds.south),
  };
}

export function boundsCenter(bounds: GeoBounds): Wgs84 {
  return {
    lat: (bounds.south + bounds.north) * 0.5,
    lon: (bounds.west + bounds.east) * 0.5,
  };
}

export function containsWgs84(bounds: GeoBounds, lat: number, lon: number): boolean {
  return lat >= bounds.south && lat <= bounds.north && lon >= bounds.west && lon <= bounds.east;
}

/** Haversine distance in meters (great-circle). */
export function haversineM(a: Wgs84, b: Wgs84): number {
  const R = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
