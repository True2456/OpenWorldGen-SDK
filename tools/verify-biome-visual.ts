#!/usr/bin/env tsx
/**
 * Strict biome visual gates — pixel probes on Playwright screenshots.
 * Desert: near-zero green blade pixels in the ground band.
 * Requires dev server on :5173.
 */
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { launchWebGPU, laasUrl } from './launch';
import { laasSettle, waitForLaasReady } from './wait-ready';

interface Gate {
  profile: string;
  seed: number;
  out: string;
  /** max fraction of ground-band pixels that read as live grass green */
  maxGreenFrac: number;
}

const GATES: Gate[] = [
  { profile: 'desert', seed: 1, out: 'shots/profiles/desert-gate.png', maxGreenFrac: 0.012 },
  { profile: 'grassland', seed: 1, out: 'shots/profiles/grassland-gate.png', maxGreenFrac: 0.2 },
];

/** Fraction of pixels in the lower ground band that match blade-green */
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
  mkdirSync('shots/profiles', { recursive: true });
  const { browser } = await launchWebGPU();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  let failed = false;

  for (const gate of GATES) {
    const url = laasUrl({
      scene: 'world',
      seed: gate.seed,
      preset: 'low',
      freeze: true,
      extra: { profile: gate.profile, lite: '1' },
    });
    console.log(`[verify-biome] ${gate.profile} → ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await waitForLaasReady(page, { timeoutMs: 600000 });
    await laasSettle(page, 48);
    await page.screenshot({ path: gate.out, type: 'png' });
    const frac = await grassPixelFrac(gate.out);
    const ok = frac <= gate.maxGreenFrac;
    console.log(
      `[verify-biome] ${gate.profile}: grassPx=${(frac * 100).toFixed(2)}% (max ${(gate.maxGreenFrac * 100).toFixed(1)}%) → ${ok ? 'PASS' : 'FAIL'}`,
    );
    if (!ok) failed = true;
  }

  await browser.close();
  if (failed) process.exit(1);
  console.log('[verify-biome] all gates passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
