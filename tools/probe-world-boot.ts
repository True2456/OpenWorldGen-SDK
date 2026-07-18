#!/usr/bin/env tsx
import { launchWebGPU } from './launch';
import { waitForLaasReady } from './wait-ready';

async function main(): Promise<void> {
  const q = process.argv[2] ?? '?state=nsw&preset=low';
  const url = q.startsWith('http') ? q : `http://localhost:5173/${q.startsWith('?') ? q : `?${q}`}`;
  const { browser } = await launchWebGPU();
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await waitForLaasReady(page, { timeoutMs: 180000 });
    const hooks = await page.evaluate(() => window.__laas);
    console.log(JSON.stringify({
      ready: hooks.ready,
      importId: hooks.importId,
      world: hooks.world,
      stateId: hooks.stateId,
      tileId: hooks.tileId,
      regionId: hooks.regionId,
      wgs84: hooks.wgs84,
      profile: hooks.profile,
      error: hooks.error,
      maxH: hooks.stats?.counters?.['terrain.maxH'],
      trees: hooks.stats?.counters?.['veg.trees'],
      geo: hooks.getWgs84?.(),
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
