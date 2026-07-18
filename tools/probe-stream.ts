/**
 * Verify streamed terrain: camera crosses a chunk boundary and groundProbe
 * stays continuous across resident tiles.
 *
 *   npx tsx tools/probe-stream.ts
 */

import { launchWebGPU, laasUrl } from './launch';
import { waitForLaasReady } from './wait-ready';

async function main(): Promise<void> {
  const { browser } = await launchWebGPU();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const url = laasUrl({
    scene: 'terrain',
    preset: 'low',
    extra: {
      stream: '1',
      state: 'nsw',
      world: 'real',
      ablate: 'veg,grass,shell,particles,froxels,water',
    },
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForLaasReady(page, { timeoutMs: 600000 });

  const boot = await page.evaluate(() => ({
    streamChunks: window.__laas.stats?.counters?.['stream.chunks'] ?? -1,
    streamOn: window.__laas.stats?.counters?.['stream.on'] ?? 0,
    importId: window.__laas.importId,
  }));
  console.log('boot:', boot);

  const samples = await page.evaluate(async () => {
    const gp = window.__laas.groundProbe;
    const setPose = window.__laas.setPose;
    const getPose = window.__laas.getPose;
    if (!gp || !setPose || !getPose) throw new Error('missing hooks');

    const pose0 = getPose();
    const x0 = pose0.p[0];
    const z0 = pose0.p[2];
    const h0 = gp(x0, z0).ground;

    // stride east ~2.1 km — crosses chunk (0,0) → (1,0) boundary near x=2048
    const targetX = 2200;
    const steps = 24;
    const rows: { x: number; z: number; ground: number; chunks: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (targetX - x0) * t;
      const z = z0;
      setPose({ p: [x, pose0.p[1], z], yaw: pose0.yaw, pitch: pose0.pitch });
      await window.__laas.settle?.(2);
      const g = gp(x, z).ground;
      rows.push({
        x,
        z,
        ground: g,
        chunks: window.__laas.stats?.counters?.['stream.chunks'] ?? -1,
      });
    }
    return { h0, rows };
  });

  console.log(`start ground @ (${samples.rows[0]?.x.toFixed(0)}, ${samples.rows[0]?.z.toFixed(0)}): ${samples.h0.toFixed(1)} m`);
  for (const r of samples.rows) {
    console.log(
      `  x=${r.x.toFixed(0).padStart(5)}  h=${r.ground.toFixed(1).padStart(7)}  chunks=${r.chunks}`,
    );
  }

  const mid = samples.rows[Math.floor(samples.rows.length / 2)]!;
  const end = samples.rows[samples.rows.length - 1]!;
  const jump = Math.abs(end.ground - samples.h0);
  const okChunks = boot.streamChunks >= 9 || end.chunks >= 9;
  const okHeight = jump < 800 && end.ground > 50;
  const okStream = boot.streamOn === 1;

  console.log('\nresult:', {
    ok: okChunks && okHeight && okStream,
    okChunks,
    okHeight,
    okStream,
    heightDelta: jump.toFixed(1),
    midChunkCount: mid.chunks,
    endChunkCount: end.chunks,
  });

  await browser.close();
  if (!okChunks || !okHeight || !okStream) process.exit(1);
}

void main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
