#!/usr/bin/env tsx
/**
 * Lean streaming smoke — boots NSW with stream=1 at preset=low, ablates heavy
 * FX, settles, screenshots. Pass if ready + maxH + trees + stream chunks >= 1.
 */
import { mkdirSync } from 'node:fs';
import { launchWebGPU } from './launch';
import { laasSettle, waitForLaasReady } from './wait-ready';

const OUT = 'shots/world/nsw-stream-lean-gate.png';
const URL =
  'http://localhost:5173/?state=nsw&world=real&preset=low&stream=1&ablate=froxels,particles&freeze=1&seed=1&hud=0';

async function main(): Promise<void> {
  mkdirSync('shots/world', { recursive: true });
  const { browser } = await launchWebGPU();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  console.log('[verify-stream]', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 300000 });
  await waitForLaasReady(page, { timeoutMs: 600000 });
  await laasSettle(page, 60);
  // allow one ring vegetation plant to finish
  await page.waitForTimeout(8000);
  await laasSettle(page, 24);
  const stats = await page.evaluate(() => ({
    ready: window.__laas.ready,
    error: window.__laas.error,
    maxH: window.__laas.stats?.counters?.['terrain.maxH'] ?? 0,
    trees: window.__laas.stats?.counters?.['veg.trees'] ?? 0,
    chunks: window.__laas.stats?.counters?.['stream.chunks'] ?? 0,
    streamOn: window.__laas.stats?.counters?.['stream.on'] ?? 0,
    profile: window.__laas.profile ?? null,
    fps: window.__laas.stats?.fps ?? 0,
  }));
  await page.screenshot({ path: OUT, type: 'png' });
  console.log('[verify-stream] stats', stats);

  const ok =
    stats.ready &&
    !stats.error &&
    stats.maxH >= 200 &&
    stats.trees >= 600 &&
    stats.streamOn === 1 &&
    stats.chunks >= 1;
  console.log(ok ? '[verify-stream] PASS' : '[verify-stream] FAIL', OUT);
  await browser.close();
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
