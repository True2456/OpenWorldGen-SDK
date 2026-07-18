#!/usr/bin/env tsx
/**
 * Build an import profile from georeferenced DEM + orthophoto.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fromFile } from 'geotiff';
import sharp from 'sharp';
import type { ImportManifest } from '../../src/contracts/import';

function arg(name: string, argv: string[]): string | undefined {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return undefined;
  return argv[i + 1];
}

function parseBounds(s: string): ImportManifest['bounds'] {
  const [west, south, east, north] = s.split(',').map(Number);
  if ([west, south, east, north].some((v) => !Number.isFinite(v))) {
    throw new Error(`invalid --bounds "${s}" (west,south,east,north)`);
  }
  return { west, east, south, north };
}

async function readDem(path: string, targetRes: number): Promise<Float32Array> {
  if (path.endsWith('.bin')) {
    const buf = readFileSync(path);
    const raw = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
    if (raw.length === targetRes * targetRes) return raw;
    const w = Math.round(Math.sqrt(raw.length));
    const h = w;
    const out = new Float32Array(targetRes * targetRes);
    for (let y = 0; y < targetRes; y++) {
      for (let x = 0; x < targetRes; x++) {
        const sx = Math.floor((x / targetRes) * w);
        const sy = Math.floor((y / targetRes) * h);
        out[y * targetRes + x] = raw[sy * w + sx] ?? 0;
      }
    }
    return out;
  }
  const tiff = await fromFile(path);
  const img = await tiff.getImage();
  const w = img.getWidth();
  const h = img.getHeight();
  const raster = (await img.readRasters({ interleave: true })) as Float32Array | Float64Array | Int16Array;
  const raw = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) raw[i] = Number(raster[i]);
  if (w === targetRes && h === targetRes) return raw;
  const out = new Float32Array(targetRes * targetRes);
  for (let y = 0; y < targetRes; y++) {
    for (let x = 0; x < targetRes; x++) {
      const sx = Math.floor((x / targetRes) * w);
      const sy = Math.floor((y / targetRes) * h);
      out[y * targetRes + x] = raw[sy * w + sx] ?? 0;
    }
  }
  return out;
}

async function readOrthoRgb(path: string, res: number): Promise<Uint8Array> {
  const { data, info } = await sharp(path).resize(res, res).raw().toBuffer({ resolveWithObject: true });
  if (info.channels < 3) throw new Error('orthophoto must be RGB');
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

function classifyPixelDefault(r: number, g: number, b: number): [number, number, number, number] {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const sat = mx > 8 ? (mx - mn) / mx : 0;
  const moisture = Math.min(1, Math.max(0, (g * 0.55 + b * 0.45 - r * 0.35) / 128));
  const desert = Math.min(1, Math.max(0, (r - g * 0.85 - b * 0.35) / 110 + sat * 0.15));
  const veg = Math.min(1, Math.max(0, (g - r * 0.75 - b * 0.2) / 100));
  const rock = Math.min(1, Math.max(0, 1 - moisture - desert - veg * 0.5));
  return [desert, veg, moisture, rock];
}

/** NSW sclerophyll / eucalyptus orthophoto — greener canopy, less desert false-positive. */
function classifyPixelOceania(r: number, g: number, b: number): [number, number, number, number] {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const sat = mx > 8 ? (mx - mn) / mx : 0;
  const moisture = Math.min(1, Math.max(0, (g * 0.62 + b * 0.38 - r * 0.28) / 115));
  const desert = Math.min(1, Math.max(0, (r - g * 0.92 - b * 0.4) / 125 + sat * 0.08));
  const veg = Math.min(1, Math.max(0, (g - r * 0.68 - b * 0.15) / 88 + sat * 0.06));
  const rock = Math.min(1, Math.max(0, 1 - moisture - desert - veg * 0.55));
  return [desert, veg, moisture, rock];
}

function classifyPixel(
  r: number,
  g: number,
  b: number,
  profile: string,
): [number, number, number, number] {
  return profile === 'oceania' ? classifyPixelOceania(r, g, b) : classifyPixelDefault(r, g, b);
}

/** Separable box blur — removes orthophoto per-pixel salt-and-pepper in moisture/biome priors. */
function boxBlurF32(src: Float32Array, res: number, radius: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const diam = radius * 2 + 1;
  for (let y = 0; y < res; y++) {
    const row = y * res;
    for (let x = 0; x < res; x++) {
      let sum = 0;
      for (let dx = -radius; dx <= radius; dx++) {
        sum += src[row + Math.min(res - 1, Math.max(0, x + dx))] as number;
      }
      tmp[row + x] = sum / diam;
    }
  }
  for (let y = 0; y < res; y++) {
    for (let x = 0; x < res; x++) {
      let sum = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        sum += tmp[Math.min(res - 1, Math.max(0, y + dy)) * res + x] as number;
      }
      out[y * res + x] = sum / diam;
    }
  }
  return out;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const id = arg('id', argv) ?? 'site';
  const demPath = arg('dem', argv);
  const orthoPath = arg('ortho', argv);
  const bounds = parseBounds(arg('bounds', argv) ?? '-116.52,36.48,-116.48,36.52');
  const profile = arg('profile', argv) ?? 'desert';
  const zoneId = arg('zone', argv);
  const label = arg('label', argv) ?? `Import: ${id}`;
  const stateId = arg('state', argv);
  const tileId = arg('tile', argv);
  const regionId = arg('region', argv);
  const res = Number(arg('res', argv) ?? 512);
  const demWeight = Number(arg('demWeight', argv) ?? 0.92);
  if (!demPath || !orthoPath) throw new Error('need --dem and --ortho');

  const dem = await readDem(demPath, res);
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < dem.length; i++) {
    const v = dem[i] as number;
    if (!Number.isFinite(v) || v < -500) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = Math.max(1, max - min);
  const height = new Float32Array(res * res);
  const moisture = new Float32Array(res * res);
  const biomePrior = new Uint8Array(res * res * 4);
  const desertF = new Float32Array(res * res);
  const vegF = new Float32Array(res * res);
  const moistF = new Float32Array(res * res);
  const rockF = new Float32Array(res * res);
  const rgb = await readOrthoRgb(orthoPath, res);

  for (let i = 0; i < res * res; i++) {
    const elev = dem[i] as number;
    height[i] = 165 + ((elev - min) / span) * 420;
    const r = rgb[i * 3] as number;
    const g = rgb[i * 3 + 1] as number;
    const b = rgb[i * 3 + 2] as number;
    const [desert, veg, moist, rock] = classifyPixel(r, g, b, profile);
    desertF[i] = desert;
    vegF[i] = veg;
    moistF[i] = moist;
    rockF[i] = rock;
  }

  // Orthophoto classifyPixel is per-pixel → salt-and-pepper at the desert moisture
  // threshold (0.32). Blur priors before export so BiomeSnow sees coherent regions.
  const blurR = 5;
  const desertS = boxBlurF32(desertF, res, blurR);
  const vegS = boxBlurF32(vegF, res, blurR);
  const moistS = boxBlurF32(moistF, res, blurR);
  const rockS = boxBlurF32(rockF, res, blurR);
  for (let i = 0; i < res * res; i++) {
    moisture[i] = moistS[i] as number;
    biomePrior[i * 4] = Math.round((desertS[i] as number) * 255);
    biomePrior[i * 4 + 1] = Math.round((vegS[i] as number) * 255);
    biomePrior[i * 4 + 2] = Math.round((moistS[i] as number) * 255);
    biomePrior[i * 4 + 3] = Math.round((rockS[i] as number) * 255);
  }

  const outDir = join('public', 'import', id);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'height.bin'), Buffer.from(height.buffer));
  writeFileSync(join(outDir, 'moisture.bin'), Buffer.from(moisture.buffer));
  writeFileSync(join(outDir, 'biomePrior.bin'), Buffer.from(biomePrior.buffer));

  const manifest: ImportManifest = {
    id,
    label,
    bounds,
    worldSize: 4096,
    res,
    demWeight,
    baseProfile: profile,
    maps: {
      height: `/import/${id}/height.bin`,
      moisture: `/import/${id}/moisture.bin`,
      biomePrior: `/import/${id}/biomePrior.bin`,
    },
    geo: {
      stateId: stateId ?? undefined,
      tileId: tileId ?? undefined,
      regionId: regionId ?? undefined,
      zoneId: zoneId ?? undefined,
      center: {
        lat: (bounds.south + bounds.north) * 0.5,
        lon: (bounds.west + bounds.east) * 0.5,
      },
    },
    camera: { x: 0, z: 0, alt: 120, yaw: 0.4, pitch: -0.35, tod: 16 },
    stats: { elevMin: min, elevMax: max, sourceDem: demPath, sourceOrtho: orthoPath },
  };
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`[import/build] ${id} res=${res} elev ${min.toFixed(1)}..${max.toFixed(1)} m → ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
