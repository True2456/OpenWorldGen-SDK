#!/usr/bin/env tsx
/**
 * Generic visual verification for a continent trees gallery row.
 * Usage: tsx tools/verify-continent-tree-row.ts europeTrees
 */
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import {
  AFRICA_TREE_VERIFY_GATES,
  ASIA_TREE_VERIFY_GATES,
  EUROPE_TREE_VERIFY_GATES,
  NORTH_AMERICA_TREE_VERIFY_GATES,
  OCEANIA_TREE_VERIFY_GATES,
  SOUTH_AMERICA_TREE_VERIFY_GATES,
} from '../src/vegetation/library/gallery';
import type { PlantVerifyGate } from '../src/vegetation/library/types';
import { launchWebGPU, laasUrl } from './launch';
import { laasSettle, waitForLaasReady } from './wait-ready';

const ROW_CONFIG: Record<string, { gates: readonly PlantVerifyGate[]; shot: string; label: string }> = {
  africaTrees: { gates: AFRICA_TREE_VERIFY_GATES, shot: 'africa-trees-gate.png', label: 'africa' },
  asiaTrees: { gates: ASIA_TREE_VERIFY_GATES, shot: 'asia-trees-gate.png', label: 'asia' },
  europeTrees: { gates: EUROPE_TREE_VERIFY_GATES, shot: 'europe-trees-gate.png', label: 'europe' },
  northAmericaTrees: { gates: NORTH_AMERICA_TREE_VERIFY_GATES, shot: 'north-america-trees-gate.png', label: 'north-america' },
  southAmericaTrees: { gates: SOUTH_AMERICA_TREE_VERIFY_GATES, shot: 'south-america-trees-gate.png', label: 'south-america' },
  oceaniaTrees: { gates: OCEANIA_TREE_VERIFY_GATES, shot: 'oceania-trees-gate.png', label: 'oceania' },
};

async function main(): Promise<void> {
  const row = process.argv[2] ?? 'europeTrees';
  const cfg = ROW_CONFIG[row];
  if (!cfg) {
    console.error(`Unknown row: ${row}`);
    process.exit(1);
  }

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
    extra: { row, lite: '1' },
  });

  const tag = `verify-${cfg.label}-trees`;
  console.log(`[${tag}] ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 300000 });
  await waitForLaasReady(page, { timeoutMs: 180000 });
  await laasSettle(page, 48);

  const screenshotPath = `shots/profiles/${cfg.shot}`;
  await page.screenshot({ path: screenshotPath, type: 'png' });

  const img = sharp(screenshotPath);
  const { width = 1280, height = 720 } = await img.metadata();
  const top = Math.floor(height * 0.2);
  const rectHeight = Math.floor(height * 0.7);
  const rawBuffer = await img.extract({ left: 0, top, width, height: rectHeight }).raw().toBuffer();

  const colWidth = Math.floor(width / 5);
  let failed = false;

  for (const gate of cfg.gates) {
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
    console.log(`[${tag}] ${gate.name}: ${matchCount}px (min ${gate.minPxCount}) → ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) failed = true;
  }

  await browser.close();
  if (failed) process.exit(1);
  console.log(`[${tag}] all gates passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
