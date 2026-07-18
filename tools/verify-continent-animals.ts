#!/usr/bin/env tsx
/**
 * Run all continent animal visual + walk gates sequentially.
 */
import { spawnSync } from 'node:child_process';

const ROWS = [
  'africaAnimals',
  'asiaAnimals',
  'europeAnimals',
  'northAmericaAnimals',
  'southAmericaAnimals',
  'oceaniaAnimals',
] as const;

function run(cmd: string, args: string[]): boolean {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
  return r.status === 0;
}

let failed = false;
for (const row of ROWS) {
  if (!run('npx', ['tsx', 'tools/verify-continent-animals-visual.ts', row])) failed = true;
}
if (!run('npx', ['tsx', 'tools/verify-continent-animals-walk.ts', 'all'])) failed = true;

if (failed) {
  console.error('[verify-continent-animals] FAIL');
  process.exit(1);
}
console.log('[verify-continent-animals] PASS');
