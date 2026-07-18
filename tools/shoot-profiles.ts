#!/usr/bin/env tsx
/**
 * Capture one screenshot per world profile for visual regression.
 * Requires dev server on :5173 (npm run dev).
 */
import { mkdirSync } from 'node:fs';
import { launchWebGPU, laasUrl } from './launch';
import { laasSettle, waitForLaasReady } from './wait-ready';

const PROFILES = ['alpine', 'desert', 'jungle', 'swamp', 'grassland'] as const;

async function main(): Promise<void> {
  mkdirSync('shots/profiles', { recursive: true });
  const { browser } = await launchWebGPU();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));

  for (const profile of PROFILES) {
    const out = `shots/profiles/${profile}-seed1.png`;
    const url = laasUrl({
      scene: 'world',
      seed: 1,
      preset: 'low',
      freeze: true,
      extra: { profile, lite: '1' },
    });
    console.log(`[shoot-profiles] ${profile} → ${out}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await waitForLaasReady(page, { timeoutMs: 600000 });
    await laasSettle(page, 48);
    const meta = await page.evaluate(() => window.__laas);
    console.log(`[shoot-profiles] ${profile} profile=${(meta as { profile?: string }).profile}`);
    await page.screenshot({ path: out, type: 'png' });
  }

  await browser.close();
  console.log('[shoot-profiles] done —', PROFILES.length, 'captures in shots/profiles/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
