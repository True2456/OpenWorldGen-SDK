/**
 * Wait for LAAS boot to complete in Playwright.
 */
import type { Page } from 'playwright';

export interface LaasReadyOpts {
  timeoutMs?: number;
}

/** Boot complete only when hooks report full progress — never trust console `[laas] ready`. */
export async function waitForLaasReady(page: Page, opts: LaasReadyOpts = {}): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? 600000;
  await page.waitForFunction(
    () => {
      const laas = window.__laas;
      return (
        laas?.progressMsg === 'ready' &&
        (laas.progress ?? 0) >= 0.99 &&
        laas.ready === true
      );
    },
    undefined,
    { timeout: timeoutMs, polling: 500 },
  );
  const err = await page.evaluate(() => window.__laas?.error ?? null);
  if (err) throw new Error(String(err));
}

export interface LaasImportReadyOpts extends LaasReadyOpts {
  importId: string;
  minMaxH?: number;
}

/** After boot, wait until import wiring and DEM height are live on hooks. */
export async function waitForLaasImportReady(
  page: Page,
  opts: LaasImportReadyOpts,
): Promise<{ maxH: number; importId: string; profile: string | null; msg: string }> {
  const timeoutMs = opts.timeoutMs ?? 600000;
  const minMaxH = opts.minMaxH ?? 120;
  await waitForLaasReady(page, { timeoutMs });
  await page.waitForFunction(
    ({ importId, minMaxH: minH }) => {
      const laas = window.__laas;
      if (!laas?.ready) return false;
      const maxH = laas.stats?.counters?.['terrain.maxH'] ?? -1;
      return laas.importId === importId && maxH > minH;
    },
    { importId: opts.importId, minMaxH },
    { timeout: timeoutMs, polling: 500 },
  );
  return page.evaluate(() => ({
    maxH: window.__laas.stats?.counters?.['terrain.maxH'] ?? -1,
    importId: window.__laas.importId ?? 'unknown',
    profile: window.__laas.profile ?? null,
    msg: window.__laas.progressMsg,
  }));
}

export async function laasSettle(page: Page, frames = 48): Promise<void> {
  await page.evaluate(async (n) => {
    if (window.__laas?.settle) await window.__laas.settle(n);
    else await new Promise((r) => setTimeout(r, Math.max(200, n * 16)));
  }, frames);
}
