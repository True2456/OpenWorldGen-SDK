/**
 * FPS benchmark — boots LAAS scenarios in headless WebGPU Chromium, samples
 * engine stats over N settled frames, prints a comparison table.
 *
 * Usage:
 *   npx tsx tools/bench-fps.ts
 *   npx tsx tools/bench-fps.ts --frames 90 --preset low
 */

import { launchWebGPU, laasUrl } from './launch';
import { waitForLaasReady, laasSettle } from './wait-ready';

interface Args {
  frames: number;
  warmup: number;
  preset: string;
  seed: number;
}

function parseArgs(): Args {
  const out: Args = { frames: 120, warmup: 24, preset: 'high', seed: 1 };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const n = argv[i + 1];
    if (a === '--frames' && n) out.frames = Number(n);
    if (a === '--warmup' && n) out.warmup = Number(n);
    if (a === '--preset' && n) out.preset = n;
    if (a === '--seed' && n) out.seed = Number(n);
  }
  return out;
}

interface Scenario {
  name: string;
  extra?: Record<string, string>;
}

interface Sample {
  fps: number;
  frameMs: number;
  frameMsP95: number;
  cpuUpdateMs: number;
  cpuSubmitMs: number;
  gpuRenderMs: number;
  gpuComputeMs: number;
  vegTris: number;
  vegHero: number;
  vegR1: number;
  drawCalls: number;
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function mean(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

async function sampleFrames(page: import('playwright').Page, n: number): Promise<Sample[]> {
  return page.evaluate(async (count) => {
    const hk = window.__laas;
    if (!hk?.settle || !hk.stats) throw new Error('hooks missing');
    const out: Sample[] = [];
    for (let i = 0; i < count; i++) {
      await hk.settle(1);
      const s = hk.stats!;
      const c = s.counters;
      out.push({
        fps: s.fps,
        frameMs: s.frameMs,
        frameMsP95: s.frameMsP95,
        cpuUpdateMs: (c['cpu.updateMs100'] ?? 0) / 100,
        cpuSubmitMs: (c['cpu.submitMs100'] ?? 0) / 100,
        gpuRenderMs: s.gpuPasses['render'] ?? 0,
        gpuComputeMs: s.gpuPasses['compute'] ?? 0,
        vegTris: c['veg.tris'] ?? 0,
        vegHero: c['veg.hero'] ?? 0,
        vegR1: c['veg.r1'] ?? 0,
        drawCalls: s.drawCalls,
      });
    }
    return out;
  }, n);
}

function summarize(samples: Sample[]) {
  return {
    fpsMed: median(samples.map((s) => s.fps)),
    fpsMin: Math.min(...samples.map((s) => s.fps)),
    frameMsMean: mean(samples.map((s) => s.frameMs)),
    frameMsP95: median(samples.map((s) => s.frameMsP95)),
    cpuUpdateMean: mean(samples.map((s) => s.cpuUpdateMs)),
    cpuSubmitMean: mean(samples.map((s) => s.cpuSubmitMs)),
    gpuRenderMean: mean(samples.map((s) => s.gpuRenderMs)),
    gpuComputeMean: mean(samples.map((s) => s.gpuComputeMs)),
    vegTris: Math.round(mean(samples.map((s) => s.vegTris))),
    vegHero: Math.round(mean(samples.map((s) => s.vegHero))),
    vegR1: Math.round(mean(samples.map((s) => s.vegR1))),
    drawCalls: Math.round(mean(samples.map((s) => s.drawCalls))),
  };
}

async function runScenario(
  page: import('playwright').Page,
  args: Args,
  scenario: Scenario,
): Promise<{ name: string; summary: ReturnType<typeof summarize>; samples: Sample[] }> {
  const preset = scenario.extra?.preset ?? args.preset;
  const url = laasUrl({
    scene: 'terrain',
    seed: args.seed,
    T: 16.5,
    preset,
    hud: false,
    freeze: true,
    width: 1920,
    height: 1080,
    extra: {
      x: '-380',
      z: '600',
      alt: '14',
      yaw: '0.8',
      pitch: '-0.12',
      walk: '0',
      ...scenario.extra,
    },
  });
  console.log(`\n[bench] ▶ ${scenario.name}\n        ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForLaasReady(page, { timeoutMs: 600000 });
  await laasSettle(page, args.warmup);
  const samples = await sampleFrames(page, args.frames);
  const summary = summarize(samples);
  console.log(
    `[bench] ✓ ${scenario.name}: fps med ${summary.fpsMed.toFixed(1)} (min ${summary.fpsMin.toFixed(0)})` +
      ` · frame ${summary.frameMsMean.toFixed(2)} ms (p95 ${summary.frameMsP95.toFixed(2)})` +
      ` · gpu r ${summary.gpuRenderMean.toFixed(2)} c ${summary.gpuComputeMean.toFixed(2)} ms` +
      ` · veg.tris ${summary.vegTris} hero ${summary.vegHero} r1 ${summary.vegR1}`,
  );
  return { name: scenario.name, summary, samples };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const scenarios: Scenario[] = [
    { name: 'forest-high', extra: { preset: 'high' } },
    { name: 'forest-low', extra: { preset: 'low' } },
    { name: 'forest-ultra', extra: { preset: 'ultra', vegperf: 'ultra' } },
    { name: 'forest-no-casters', extra: { ablate: 'casters' } },
    { name: 'forest-no-veg', extra: { ablate: 'veg' } },
  ];

  console.log(
    `[bench] frames=${args.frames} warmup=${args.warmup} preset=${args.preset} seed=${args.seed}`,
  );
  const { browser } = await launchWebGPU();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', (msg) => {
    const t = msg.text();
    if (msg.type() === 'error' || t.includes('fatal') || t.includes('WebGPU')) {
      console.log(`[page:${msg.type()}] ${t}`);
    }
  });

  const results = [];
  for (const sc of scenarios) {
    results.push(await runScenario(page, args, sc));
  }
  await browser.close();

  console.log('\n[bench] ── summary ─────────────────────────────────────────');
  console.log(
    'scenario'.padEnd(22) +
      'fps'.padStart(8) +
      'frameMs'.padStart(10) +
      'p95'.padStart(8) +
      'gpuR'.padStart(8) +
      'gpuC'.padStart(8) +
      'vegTris'.padStart(10) +
      'hero'.padStart(7),
  );
  for (const r of results) {
    const s = r.summary;
    console.log(
      r.name.padEnd(22) +
        s.fpsMed.toFixed(1).padStart(8) +
        s.frameMsMean.toFixed(2).padStart(10) +
        s.frameMsP95.toFixed(2).padStart(8) +
        s.gpuRenderMean.toFixed(2).padStart(8) +
        s.gpuComputeMean.toFixed(2).padStart(8) +
        String(s.vegTris).padStart(10) +
        String(s.vegHero).padStart(7),
    );
  }

  const full = results.find((r) => r.name === 'forest-high')?.summary;
  const ultra = results.find((r) => r.name === 'forest-ultra')?.summary;
  const noCast = results.find((r) => r.name === 'forest-no-casters')?.summary;
  const noVeg = results.find((r) => r.name === 'forest-no-veg')?.summary;
  if (full && ultra) {
    const delta = ultra.frameMsMean - full.frameMsMean;
    console.log(
      `\n[bench] high vs ultra: ${delta >= 0 ? '+' : ''}${delta.toFixed(2)} ms/frame`,
    );
  }
  if (full && noCast) {
    const delta = full.frameMsMean - noCast.frameMsMean;
    console.log(
      `[bench] shadow casters: +${delta.toFixed(2)} ms/frame (${((delta / noCast.frameMsMean) * 100).toFixed(0)}% of high preset)`,
    );
  }
  if (full && noVeg) {
    const vegCost = full.frameMsMean - noVeg.frameMsMean;
    console.log(
      `[bench] total veg: +${vegCost.toFixed(2)} ms/frame (${((vegCost / noVeg.frameMsMean) * 100).toFixed(0)}% over no-veg)`,
    );
  }
}

void main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
