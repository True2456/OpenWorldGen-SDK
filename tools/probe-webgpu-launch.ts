#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function tryOne(label: string, opts: Parameters<typeof chromium.launch>[0]) {
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    browser = await chromium.launch(opts);
    const page = await browser.newPage();
    await page.goto('http://localhost:5173/__webgpu_probe__', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    const r = await page.evaluate(async () => {
      const gpu = (navigator as { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
      if (!gpu) return { hasGpu: false, adapter: false };
      const a = await gpu.requestAdapter();
      return { hasGpu: true, adapter: a !== null };
    });
    console.log(label, 'OK', JSON.stringify(r));
    await browser.close();
    return r.adapter;
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 240) : String(e);
    console.log(label, 'FAIL', msg);
    if (browser) await browser.close().catch(() => undefined);
    return false;
  }
}

async function main() {
  await tryOne('chromium-headless', { headless: true, channel: 'chromium' });
  await tryOne('chromium-unsafe', {
    headless: true,
    channel: 'chromium',
    args: ['--enable-unsafe-webgpu'],
  });
  await tryOne('chrome-headless', { headless: true, channel: 'chrome' });
  await tryOne('chrome-headed', { headless: false, channel: 'chrome' });
  await tryOne('default-headed', { headless: false });
  await tryOne('default-headless', { headless: true });
}

main();
