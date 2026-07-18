/**
 * World ↔ chunk index mapping for 4 km terrain tiles.
 *
 * Chunk (0,0) is centered at world origin; each chunk spans WORLD_SIZE meters.
 * Unbounded integer indices (cx, cy) — no world edge clamp.
 */

import { WORLD_HALF, WORLD_SIZE } from '../WorldConst';

export const CHUNK_SIZE = WORLD_SIZE;

export interface ChunkIndex {
  cx: number;
  cy: number;
}

/** World meters → chunk containing the point. */
export function worldToChunk(x: number, z: number): ChunkIndex {
  return {
    cx: Math.floor((x + WORLD_HALF) / CHUNK_SIZE),
    cy: Math.floor((z + WORLD_HALF) / CHUNK_SIZE),
  };
}

/** Chunk center in world meters. */
export function chunkCenter(cx: number, cy: number): { x: number; z: number } {
  return { x: cx * CHUNK_SIZE, z: cy * CHUNK_SIZE };
}

/** World position → local coords within a chunk ([-WORLD_HALF, WORLD_HALF]). */
export function worldToLocal(
  x: number,
  z: number,
  cx: number,
  cy: number,
): { lx: number; lz: number } {
  const c = chunkCenter(cx, cy);
  return { lx: x - c.x, lz: z - c.z };
}

export function chunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

export function parseChunkKey(key: string): ChunkIndex | null {
  const m = /^(-?\d+),(-?\d+)$/.exec(key);
  if (!m) return null;
  return { cx: Number(m[1]), cy: Number(m[2]) };
}

/** 3×3 neighborhood chunk indices around (cx, cy). */
export function neighborChunks(cx: number, cy: number, radius = 1): ChunkIndex[] {
  const out: ChunkIndex[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      out.push({ cx: cx + dx, cy: cy + dy });
    }
  }
  return out;
}
