#!/usr/bin/env tsx
/**
 * Verify animated walking horses — telemetry + motion screenshots.
 * Requires dev server on :5173.
 */
import { mkdirSync } from 'node:fs';
import { launchWebGPU, laasUrl } from './launch';
import { waitForLaasReady } from './wait-ready';

interface HerdTel {
  horses: { x: number; z: number; phase: number; legSwing: number; speed: number }[];
  moving: boolean;
}

async function main(): Promise<void> {
  mkdirSync('shots/profiles', { recursive: true });
  const { browser } = await launchWebGPU();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  const url = laasUrl({
    scene: 'herd',
    seed: 1,
    preset: 'high',
    freeze: false,
    extra: { hud: '0' },
  });

  console.log(`[verify-animals-walk] ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 300000 });
  await waitForLaasReady(page, { timeoutMs: 120000 });
  await page.waitForTimeout(400);

  const t0 = await page.evaluate(() => (window as unknown as { __laasHerd?: HerdTel }).__laasHerd);
  await page.screenshot({ path: 'shots/profiles/herd-walk-t0.png', type: 'png' });

  await page.waitForTimeout(1800);

  const t1 = await page.evaluate(() => (window as unknown as { __laasHerd?: HerdTel }).__laasHerd);
  await page.screenshot({ path: 'shots/profiles/herd-walk-t1.png', type: 'png' });

  await browser.close();

  if (!t0 || !t1 || t0.horses.length < 1) {
    console.error('[verify-animals-walk] FAIL: no herd telemetry');
    process.exit(1);
  }

  const h0 = t0.horses[0]!;
  const h1 = t1.horses[0]!;
  const dist = Math.hypot(h1.x - h0.x, h1.z - h0.z);
  const phaseDelta = Math.abs(h1.phase - h0.phase);
  const legOk = Math.abs(h1.legSwing) > 0.05 || Math.abs(h0.legSwing) > 0.05;

  console.log(`[verify-animals-walk] dist=${dist.toFixed(2)}m phaseΔ=${phaseDelta.toFixed(2)} legSwing=${h1.legSwing.toFixed(2)} moving=${t1.moving}`);

  const passed = dist > 0.4 && phaseDelta > 0.5 && legOk && t1.moving;
  if (!passed) {
    console.error('[verify-animals-walk] FAIL');
    process.exit(1);
  }
  console.log('[verify-animals-walk] PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
