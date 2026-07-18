#!/usr/bin/env tsx
/**
 * NSW visual gates — oceania zone imports must boot with eucalyptus woodland.
 *
 * Pass criteria (documented):
 *  - Profile resolves to oceania:<zone> (not alpine/desert)
 *  - terrain.maxH > 200 for DEM imports; > 400 procedural
 *  - veg.trees >= 600 (oceania scatter active)
 *  - greenPx >= 0.1% in ground band (sclerophyll / grass visible)
 *  - sandPx <= 42% on Blue Mountains (sandstone cliffs read as tan/sand)
 *  - sandPx <= 15% on western-slopes procedural (drier but not desert)
 *
 * Requires dev server on :5173 and public/import/nsw-blue-mountains/.
 */
import { existsSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { launchWebGPU, laasUrl } from './launch';
import { laasSettle, waitForLaasImportReady, waitForLaasReady } from './wait-ready';

interface Gate {
  label: string;
  out: string;
  urlExtra: Record<string, string>;
  importId?: string;
  minGreen: number;
  maxSand: number;
  minTrees: number;
  minMaxH: number;
  profilePrefix: string;
}

const GATES: Gate[] = [
  {
    label: 'nsw-blue-mountains',
    out: 'shots/world/nsw-blue-mountains-gate.png',
    urlExtra: { import: 'nsw-blue-mountains', profile: 'oceania', lite: '1' },
    importId: 'nsw-blue-mountains',
    minGreen: 0.001,
    maxSand: 0.42,
    minTrees: 600,
    minMaxH: 200,
    profilePrefix: 'oceania:tablelands',
  },
  {
    label: 'nsw-state-boot',
    out: 'shots/world/nsw-state-gate.png',
    urlExtra: { state: 'nsw', world: 'real', preset: 'low', stream: '0', lite: '1' },
    importId: 'nsw-blue-mountains',
    minGreen: 0.001,
    maxSand: 0.42,
    minTrees: 600,
    minMaxH: 200,
    profilePrefix: 'oceania:',
  },
  {
    label: 'nsw-western-slopes-procedural',
    out: 'shots/world/nsw-western-slopes-gate.png',
    urlExtra: {
      tile: 'nsw-c09-r06',
      world: 'real',
      profile: 'oceania',
      state: 'nsw',
      lite: '1',
    },
    minGreen: 0.01,
    maxSand: 0.15,
    minTrees: 400,
    minMaxH: 400,
    profilePrefix: 'oceania:western-slopes',
  },
];

async function grassPixelFrac(path: string): Promise<number> {
  const meta = await sharp(path).metadata();
  const w = meta.width ?? 1280;
  const h = meta.height ?? 720;
  const band = await sharp(path)
    .extract({ left: 0, top: Math.floor(h * 0.35), width: w, height: Math.floor(h * 0.55) })
    .raw()
    .toBuffer();
  let green = 0;
  const px = band.length / 3;
  for (let i = 0; i < px; i++) {
    const r = band[i * 3] as number;
    const g = band[i * 3 + 1] as number;
    const b = band[i * 3 + 2] as number;
    if (g > 48 && g > r * 1.2 && g > b * 1.05) green++;
  }
  return green / px;
}

async function sandPixelFrac(path: string): Promise<number> {
  const meta = await sharp(path).metadata();
  const w = meta.width ?? 1280;
  const h = meta.height ?? 720;
  const band = await sharp(path)
    .extract({ left: 0, top: Math.floor(h * 0.3), width: w, height: Math.floor(h * 0.6) })
    .raw()
    .toBuffer();
  let sand = 0;
  const px = band.length / 3;
  for (let i = 0; i < px; i++) {
    const r = band[i * 3] as number;
    const g = band[i * 3 + 1] as number;
    const b = band[i * 3 + 2] as number;
    if (r > 70 && r > g * 1.05 && g > b * 0.85) sand++;
  }
  return sand / px;
}

async function readBootStats(
  page: import('playwright').Page,
  gate: Gate,
): Promise<{ maxH: number; trees: number; profile: string | null }> {
  if (gate.importId) {
    const stats = await waitForLaasImportReady(page, {
      timeoutMs: 600000,
      importId: gate.importId,
      minMaxH: gate.minMaxH,
    });
    const counters = await page.evaluate(() => window.__laas.stats?.counters ?? {});
    return {
      maxH: stats.maxH,
      trees: counters['veg.trees'] ?? 0,
      profile: stats.profile,
    };
  }
  await waitForLaasReady(page, { timeoutMs: 600000 });
  return page.evaluate(() => ({
    maxH: window.__laas.stats?.counters?.['terrain.maxH'] ?? 0,
    trees: window.__laas.stats?.counters?.['veg.trees'] ?? 0,
    profile: window.__laas.profile ?? null,
  }));
}

async function main(): Promise<void> {
  const manifest = 'public/import/nsw-blue-mountains/manifest.json';
  if (!existsSync(manifest)) {
    throw new Error(`missing ${manifest} — run: npm run import:nsw-blue-mountains`);
  }
  mkdirSync('shots/world', { recursive: true });

  const { browser } = await launchWebGPU();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  let failed = false;

  for (const gate of GATES) {
    const url = laasUrl({
      scene: 'world',
      seed: 1,
      preset: 'low',
      freeze: true,
      extra: gate.urlExtra,
    });
    console.log(`[verify-nsw] ${gate.label} → ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 300000 });

    const boot = await readBootStats(page, gate);
    console.log('[verify-nsw] boot stats', boot);

    await laasSettle(page, 48);
    await page.screenshot({ path: gate.out, type: 'png' });

    const green = await grassPixelFrac(gate.out);
    const sand = await sandPixelFrac(gate.out);
    const profileOk = (boot.profile ?? '').startsWith(gate.profilePrefix);
    const greenOk = green >= gate.minGreen;
    const sandOk = sand <= gate.maxSand;
    const treesOk = boot.trees >= gate.minTrees;
    const hOk = boot.maxH >= gate.minMaxH;

    console.log(
      `[verify-nsw] ${gate.label}: greenPx=${(green * 100).toFixed(2)}% sandPx=${(sand * 100).toFixed(2)}% trees=${boot.trees} profile=${boot.profile}`,
    );
    console.log(
      `[verify-nsw] ${gate.label}: profile=${profileOk ? 'PASS' : 'FAIL'} green=${greenOk ? 'PASS' : 'FAIL'} sand=${sandOk ? 'PASS' : 'FAIL'} trees=${treesOk ? 'PASS' : 'FAIL'} maxH=${hOk ? 'PASS' : 'FAIL'}`,
    );
    if (!profileOk || !greenOk || !sandOk || !treesOk || !hOk) failed = true;
  }

  await browser.close();
  if (failed) process.exit(1);
  console.log('[verify-nsw] all gates passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
