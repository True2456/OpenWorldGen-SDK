#!/usr/bin/env tsx
/**
 * Infinite-world pipeline smoke test.
 *
 * Boots ?world=infinite, walks east ~5 km (crosses chunk boundary),
 * checks terrain window grows and veg chunk index updates.
 *
 *   npm run probe-infinite
 */
import { launchWebGPU, laasUrl } from './launch';
import { laasSettle, waitForLaasReady } from './wait-ready';

async function main(): Promise<void> {
  const { browser } = await launchWebGPU();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const url = laasUrl({
    scene: 'world',
    seed: 42,
    preset: 'low',
    freeze: false,
    extra: {
      world: 'infinite',
      profile: 'alpine',
      lite: '1',
      ablate: 'particles,froxels,water',
      hud: '0',
    },
  });
  console.log('[probe-infinite]', url);
  page.on('console', (msg) => {
    console.log(`[browser console] ${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.error(`[browser error] ${err.message}`);
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 300000 });
  await waitForLaasReady(page, { timeoutMs: 600000 });
  await laasSettle(page, 48);

  const boot = await page.evaluate(() => ({
    infiniteOn: window.__laas.stats?.counters?.['infinite.on'] ?? 0,
    chunks: window.__laas.stats?.counters?.['infinite.chunks'] ?? 0,
    vegCx: window.__laas.stats?.counters?.['infinite.vegCx'] ?? 0,
    trees: window.__laas.stats?.counters?.['veg.trees'] ?? 0,
    fps: window.__laas.stats?.fps ?? 0,
  }));
  console.log('[probe-infinite] boot', boot);

  const walk = await page.evaluate(async () => {
    const gp = window.__laas.groundProbe;
    const setPose = window.__laas.setPose;
    const getPose = window.__laas.getPose;
    if (!gp || !setPose || !getPose) throw new Error('missing hooks');
    const pose0 = getPose();
    const targetX = pose0.p[0] + 5200;
    const rows: {
      x: number;
      ground: number;
      chunks: number;
      vegCx: number;
      fps: number;
    }[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const x = pose0.p[0] + (targetX - pose0.p[0]) * t;
      const z = pose0.p[2];
      const y = gp(x, z).ground + 120;
      setPose({ p: [x, y, z], yaw: 0, pitch: -0.2 });
      await window.__laas.settle?.(3);
      rows.push({
        x,
        ground: gp(x, z).ground,
        chunks: window.__laas.stats?.counters?.['infinite.chunks'] ?? 0,
        vegCx: window.__laas.stats?.counters?.['infinite.vegCx'] ?? 0,
        fps: window.__laas.stats?.fps ?? 0,
      });
    }

    // Wait for background chunk generation to catch up and update vegCx
    for (let j = 0; j < 60; j++) {
      const currentVegCx = window.__laas.stats?.counters?.['infinite.vegCx'] ?? 0;
      if (currentVegCx > 0) {
        const last = rows[rows.length - 1]!;
        last.vegCx = currentVegCx;
        last.chunks = window.__laas.stats?.counters?.['infinite.chunks'] ?? 0;
        break;
      }
      await window.__laas.settle?.(12);
    }

    return { startX: pose0.p[0], rows };
  });

  for (const r of walk.rows) {
    console.log(
      `  x=${r.x.toFixed(0).padStart(6)} h=${r.ground.toFixed(0).padStart(5)} chunks=${r.chunks} vegCx=${r.vegCx} fps=${r.fps.toFixed(0)}`,
    );
  }

  const end = walk.rows[walk.rows.length - 1]!;
  const crossed = end.vegCx > boot.vegCx;
  const okChunks = boot.chunks >= 9 && end.chunks >= 9;
  const okTrees = boot.trees >= 400;
  const okFps = end.fps >= 24;
  const okInfinite = boot.infiniteOn === 1;

  console.log('\n[probe-infinite] result', {
    ok: okInfinite && okChunks && okTrees && crossed && okFps,
    okInfinite,
    okChunks,
    okTrees,
    crossed,
    okFps,
    endFps: end.fps.toFixed(1),
    endVegCx: end.vegCx,
  });

  await browser.close();
  if (!okInfinite || !okChunks || !okTrees || !crossed || !okFps) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
