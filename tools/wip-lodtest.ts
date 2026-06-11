/** one-off: does the tile quadtree re-upload live when the camera moves? */
import { launchWebGPU, laasUrl } from './launch';

async function main(): Promise<void> {
  const { browser } = await launchWebGPU();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('[page:error]', m.text());
  });
  const url = laasUrl({
    scene: 'terrain', width: 1920, height: 1080, seed: 1, T: 12, hud: false, freeze: true,
    cam: '600,2400,900,2.4,-1.2,70', extra: { view: 'lod' },
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__laas && (window.__laas.ready || window.__laas.error !== null), undefined, { timeout: 120000, polling: 250 });
  await page.evaluate(async () => window.__laas.settle && (await window.__laas.settle(10)));
  // fly to position 2 WITHOUT reloading
  await page.evaluate(() =>
    window.__laas.setPose &&
    window.__laas.setPose({ p: [-1200, 2400, -600], yaw: 2.4, pitch: -1.2, fov: 70 }),
  );
  await page.evaluate(async () => window.__laas.settle && (await window.__laas.settle(30)));
  await page.screenshot({ path: 'shots/wip/lod-live-moved.png' });
  const tiles = await page.evaluate(() => window.__laas.stats?.counters['terrain.tiles']);
  console.log('[lodtest] tiles after move:', tiles);
  await browser.close();
}

main().catch((e: unknown) => {
  console.error('[lodtest] FAILED:', e instanceof Error ? e.message : e);
  process.exit(1);
});
