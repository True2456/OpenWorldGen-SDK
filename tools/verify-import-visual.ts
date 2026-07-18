#!/usr/bin/env tsx
/**
 * Import visual gate — Mojave DEM+orthophoto import must boot and read as desert.
 * Requires dev server on :5173 and public/import/mojave/ built.
 */
import { existsSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { launchWebGPU, laasUrl } from './launch';
import { laasSettle, waitForLaasImportReady } from './wait-ready';

const OUT = 'shots/import/mojave-gate.png';
const MANIFEST = 'public/import/mojave/manifest.json';

async function sandPixelFrac(path: string): Promise<number> {
  const meta = await sharp(path).metadata();
  const w = meta.width ?? 1280;
  const h = meta.height ?? 720;
  const band = await sharp(path)
    .extract({ left: 0, top: Math.floor(h * 0.3), width: w, height: Math.floor(h * 0.6) })
    .raw()
    .toBuffer();
  let sand = 0;
  const px = band.length / 3;
  for (let i = 0; i < px; i++) {
    const r = band[i * 3] as number;
    const g = band[i * 3 + 1] as number;
    const b = band[i * 3 + 2] as number;
    if (r > 70 && r > g * 1.05 && g > b * 0.85) sand++;
  }
  return sand / px;
}

async function grassPixelFrac(path: string): Promise<number> {
  const meta = await sharp(path).metadata();
  const w = meta.width ?? 1280;
  const h = meta.height ?? 720;
  const band = await sharp(path)
    .extract({ left: 0, top: Math.floor(h * 0.35), width: w, height: Math.floor(h * 0.55) })
    .raw()
    .toBuffer();
  let green = 0;
  const px = band.length / 3;
  for (let i = 0; i < px; i++) {
    const r = band[i * 3] as number;
    const g = band[i * 3 + 1] as number;
    const b = band[i * 3 + 2] as number;
    if (g > 56 && g > r * 1.35 && g > b * 1.2) green++;
  }
  return green / px;
}

async function main(): Promise<void> {
  if (!existsSync(MANIFEST)) {
    throw new Error(`missing ${MANIFEST} — run: npm run import:mojave`);
  }
  mkdirSync('shots/import', { recursive: true });
  const { browser } = await launchWebGPU();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  const url = laasUrl({
    scene: 'world',
    seed: 1,
    preset: 'low',
    freeze: true,
    extra: { import: 'mojave', profile: 'desert', lite: '1' },
  });
  console.log(`[verify-import] mojave → ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 300000 });
  const stats = await waitForLaasImportReady(page, {
    timeoutMs: 600000,
    importId: 'mojave',
    minMaxH: 120,
  });
  console.log('[verify-import] boot stats', stats);
  await laasSettle(page, 48);
  await page.screenshot({ path: OUT, type: 'png' });
  const grass = await grassPixelFrac(OUT);
  const sand = await sandPixelFrac(OUT);
  const grassOk = grass <= 0.015;
  const sandOk = sand >= 0.08;
  console.log(
    `[verify-import] grassPx=${(grass * 100).toFixed(2)}% (max 1.5%) → ${grassOk ? 'PASS' : 'FAIL'}`,
  );
  console.log(
    `[verify-import] sandPx=${(sand * 100).toFixed(2)}% (min 8%) → ${sandOk ? 'PASS' : 'FAIL'}`,
  );
  console.log(`[verify-import] terrain.maxH=${stats.maxH}`);
  await browser.close();
  if (!grassOk || !sandOk) process.exit(1);
  console.log('[verify-import] PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
