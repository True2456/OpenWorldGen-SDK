#!/usr/bin/env tsx
/**
 * Run all 6 continent tree visual verifications in parallel (single dev server).
 */
import { spawn } from 'node:child_process';

const ROWS = [
  'africaTrees',
  'asiaTrees',
  'europeTrees',
  'northAmericaTrees',
  'southAmericaTrees',
  'oceaniaTrees',
] as const;

async function runRow(row: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', 'tools/verify-continent-tree-row.ts', row], {
      stdio: 'inherit',
      shell: true,
    });
    child.on('close', (code) => resolve(code === 0));
  });
}

async function main(): Promise<void> {
  console.log('[verify-all-continent-trees] launching 6 verifies in parallel…');
  const results = await Promise.all(ROWS.map(async (row) => ({ row, ok: await runRow(row) })));
  const failed = results.filter((r) => !r.ok);
  for (const { row, ok } of results) {
    console.log(`  ${row}: ${ok ? 'PASS' : 'FAIL'}`);
  }
  if (failed.length > 0) {
    console.error(`[verify-all-continent-trees] ${failed.length} continent(s) failed`);
    process.exit(1);
  }
  console.log('\n[verify-all-continent-trees] all 6 continents passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
