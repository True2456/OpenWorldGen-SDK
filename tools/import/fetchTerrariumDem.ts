#!/usr/bin/env tsx
/**
 * Fetch DEM heights from AWS Terrain Tiles (Terrarium encoding).
 * Writes a raw float32 row-major grid for tools/import/build.ts --demBin.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import sharp from 'sharp';

export interface DemBounds {
  west: number;
  east: number;
  south: number;
  north: number;
}

function tileXY(lon: number, lat: number, z: number): { x: number; y: number } {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) };
}

function decodeTerrarium(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768;
}

async function fetchTile(z: number, x: number, y: number): Promise<Uint8Array> {
  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`terrarium ${z}/${x}/${y}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { data } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

export async function fetchTerrariumDem(bounds: DemBounds, res: number, zoom = 12): Promise<Float32Array> {
  const z = zoom;
  const corners = [
    tileXY(bounds.west, bounds.north, z),
    tileXY(bounds.east, bounds.north, z),
    tileXY(bounds.west, bounds.south, z),
    tileXY(bounds.east, bounds.south, z),
  ];
  const minX = Math.min(...corners.map((c) => c.x));
  const maxX = Math.max(...corners.map((c) => c.x));
  const minY = Math.min(...corners.map((c) => c.y));
  const maxY = Math.max(...corners.map((c) => c.y));

  const tiles = new Map<string, Uint8Array>();
  for (let ty = minY; ty <= maxY; ty++) {
    for (let tx = minX; tx <= maxX; tx++) {
      tiles.set(`${tx},${ty}`, await fetchTile(z, tx, ty));
    }
  }

  const out = new Float32Array(res * res);
  for (let j = 0; j < res; j++) {
    const lat = bounds.south + ((res - 1 - j) / (res - 1)) * (bounds.north - bounds.south);
    for (let i = 0; i < res; i++) {
      const lon = bounds.west + (i / (res - 1)) * (bounds.east - bounds.west);
      const { x, y } = tileXY(lon, lat, z);
      const px = Math.min(255, Math.max(0, Math.floor(((lon + 180) / 360) * 2 ** z * 256 - x * 256)));
      const py = Math.min(
        255,
        Math.max(
          0,
          Math.floor(
            ((1 -
              Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) /
              2) *
              2 ** z *
              256 -
              y * 256,
          ),
        ),
      );
      const tile = tiles.get(`${x},${y}`);
      if (!tile) {
        out[j * res + i] = 0;
        continue;
      }
      const idx = (py * 256 + px) * 4;
      out[j * res + i] = decodeTerrarium(tile[idx]!, tile[idx + 1]!, tile[idx + 2]!);
    }
    if (j % 64 === 0) process.stderr.write(`[terrarium] row ${j}/${res}\n`);
  }
  return out;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const outPath = argv[0] ?? 'reference/import/nsw-blue-mountains-dem.bin';
  const bounds: DemBounds = {
    west: Number(argv[1] ?? 150.25),
    south: Number(argv[2] ?? -33.78),
    east: Number(argv[3] ?? 150.31),
    north: Number(argv[4] ?? -33.72),
  };
  const res = Number(argv[5] ?? 512);
  const dem = await fetchTerrariumDem(bounds, res, 12);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, Buffer.from(dem.buffer));
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < dem.length; i++) {
    const v = dem[i] as number;
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  console.log(`[fetch-terrarium-dem] ${outPath} res=${res} elev ${min.toFixed(1)}..${max.toFixed(1)} m`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
