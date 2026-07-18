#!/usr/bin/env tsx
/**
 * Strict visual verification for library gallery animals (animals row).
 * Requires dev server on :5173.
 */
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { ANIMAL_VERIFY_GATES } from '../src/animals/library/gallery';
import { launchWebGPU, laasUrl } from './launch';
import { laasSettle, waitForLaasReady } from './wait-ready';

async function main(): Promise<void> {
  mkdirSync('shots/profiles', { recursive: true });
  const { browser } = await launchWebGPU();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  const url = laasUrl({
    scene: 'gallery',
    seed: 1,
    preset: 'high',
    freeze: true,
    extra: { row: 'animals', lite: '1' },
  });

  console.log(`[verify-animals] ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 300000 });
  await waitForLaasReady(page, { timeoutMs: 600000 });
  await laasSettle(page, 48);

  const screenshotPath = 'shots/profiles/animals-gate.png';
  await page.screenshot({ path: screenshotPath, type: 'png' });

  const img = sharp(screenshotPath);
  const { width = 1280, height = 720 } = await img.metadata();
  const top = Math.floor(height * 0.15);
  const rectHeight = Math.floor(height * 0.75);
  const rawBuffer = await img.extract({ left: 0, top, width, height: rectHeight }).raw().toBuffer();

  const colWidth = Math.floor(width / 5);
  let failed = false;

  for (const gate of ANIMAL_VERIFY_GATES) {
    let matchCount = 0;
    const startX = gate.colIndex * colWidth;
    const endX = startX + colWidth;

    for (let y = 0; y < rectHeight; y++) {
      for (let x = startX; x < endX; x++) {
        const idx = (y * width + x) * 3;
        const r = rawBuffer[idx] as number;
        const g = rawBuffer[idx + 1] as number;
        const b = rawBuffer[idx + 2] as number;
        if (gate.validate(r, g, b)) matchCount++;
      }
    }

    const passed = matchCount >= gate.minPxCount;
    console.log(
      `[verify-animals] ${gate.name}: ${matchCount}px (min ${gate.minPxCount}) → ${passed ? 'PASS' : 'FAIL'}`,
    );
    if (!passed) failed = true;
  }

  await browser.close();
  if (failed) process.exit(1);
  console.log('[verify-animals] all gates passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
