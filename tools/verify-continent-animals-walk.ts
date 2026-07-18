#!/usr/bin/env tsx
/**
 * Verify continent animal pack walk/hop/biped locomotion via telemetry + screenshots.
 * Usage: tsx tools/verify-continent-animals-walk.ts africa
 * Requires dev server on :5173.
 */
import { mkdirSync } from 'node:fs';
import { launchWebGPU, laasUrl } from './launch';
import { waitForLaasReady } from './wait-ready';

interface HerdTel {
  horses?: { x: number; z: number; phase: number; legSwing: number; speed: number; id?: string }[];
  animals?: { x: number; z: number; phase: number; legSwing: number; speed: number; id?: string }[];
  moving: boolean;
  continent?: string;
}

const CONTINENTS = ['africa', 'asia', 'europe', 'northAmerica', 'southAmerica', 'oceania'] as const;

async function verifyOne(continent: string): Promise<boolean> {
  const { browser } = await launchWebGPU();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  const url = laasUrl({
    scene: 'herd',
    seed: 1,
    preset: 'high',
    freeze: false,
    extra: { hud: '0', continent },
  });

  const tag = `verify-${continent}-animals-walk`;
  console.log(`[${tag}] ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 300000 });
  await waitForLaasReady(page, { timeoutMs: 120000 });
  await page.waitForTimeout(400);

  const t0 = await page.evaluate(() => (window as unknown as { __laasHerd?: HerdTel }).__laasHerd);
  const shot0 = `shots/profiles/${continent}-animals-walk-t0.png`;
  await page.screenshot({ path: shot0, type: 'png' });

  await page.waitForTimeout(1800);

  const t1 = await page.evaluate(() => (window as unknown as { __laasHerd?: HerdTel }).__laasHerd);
  const shot1 = `shots/profiles/${continent}-animals-walk-t1.png`;
  await page.screenshot({ path: shot1, type: 'png' });

  await browser.close();

  const agents0 = t0?.animals ?? t0?.horses ?? [];
  const agents1 = t1?.animals ?? t1?.horses ?? [];
  if (agents0.length < 1 || agents1.length < 1) {
    console.error(`[${tag}] FAIL: no pack telemetry (count0=${agents0.length})`);
    return false;
  }

  const h0 = agents0[0]!;
  const h1 = agents1[0]!;
  const dist = Math.hypot(h1.x - h0.x, h1.z - h0.z);
  const phaseDelta = Math.abs(h1.phase - h0.phase);
  const legOk = Math.abs(h1.legSwing) > 0.05 || Math.abs(h0.legSwing) > 0.05;
  const moving = !!t1?.moving;

  console.log(
    `[${tag}] n=${agents1.length} dist=${dist.toFixed(2)}m phaseΔ=${phaseDelta.toFixed(2)} legSwing=${h1.legSwing.toFixed(2)} moving=${moving}`,
  );

  const passed = dist > 0.35 && phaseDelta > 0.5 && legOk && moving;
  if (!passed) {
    console.error(`[${tag}] FAIL`);
    return false;
  }
  console.log(`[${tag}] PASS`);
  return true;
}

async function main(): Promise<void> {
  mkdirSync('shots/profiles', { recursive: true });
  const arg = process.argv[2];
  const list = arg && arg !== 'all' ? [arg] : [...CONTINENTS];
  let failed = false;
  for (const c of list) {
    if (!(CONTINENTS as readonly string[]).includes(c)) {
      console.error(`Unknown continent: ${c}`);
      process.exit(1);
    }
    const ok = await verifyOne(c);
    if (!ok) failed = true;
  }
  if (failed) process.exit(1);
  console.log('[verify-continent-animals-walk] all passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
