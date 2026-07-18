/**
 * VegPerf — quality-tier vegetation performance budgets.
 *
 * `preset=low|high|ultra` scales draw caps, shadow-caster reach, cull dispatch
 * width, and hero mesh density. Override with `?vegperf=low|high|ultra`.
 *
 * Targets (1080p forest bookmark):
 *   ultra — max quality (pre-Phase-8 caps)
 *   high  — ~60 fps class GPUs (M-series Max, 4070+)
 *   low   — ~45–60 fps class GPUs (RTX 3060 tier)
 */

import type { QualityPreset } from '../core/Params';

export interface VegPerfConfig {
  capHero: number;
  capTreeR1: number;
  capTreeR2: number;
  capImpostor: number;
  capUnder: number;
  capExR1: number;
  capExR2: number;
  /** impostor-band crown-proxy caster cap (per cls per cascade) */
  capCasterImpProxy: number;
  treeCap: number;
  underCap: number;
  extraCap: number;
  stoneCap: number;
  /** crown-proxy shadow fade start / hard cutoff (m) */
  impCastFade0: number;
  impCastFar: number;
  /** real geometry casters: ring-1 bark/cards (0..N) */
  treeCasterCascadeMax: number;
  /** crown-proxy meshes + cull appends (0..N) */
  crownProxyCascadeMax: number;
  /** impostor-band proxy casters (0..N) */
  impostorProxyCascadeMax: number;
  /** extras/stone caster cull + draws (0..N) */
  extraCasterCascadeMax: number;
  /** scales runScatter densityScale at boot (trees placed ∝ density²-ish) */
  scatterDensity: number;
  /** terrain occlusion march starts beyond this distance (m) */
  occMarchDist: number;
  /** samples along camera→crown ray */
  occMarchSteps: number;
  /** scales HERO_DIETS meshAnchorTarget at library build */
  heroMeshScale: number;
}

const ULTRA: VegPerfConfig = {
  capHero: 48,
  capTreeR1: 6144,
  capTreeR2: 8192,
  capImpostor: 49152,
  capUnder: 4096,
  capExR1: 1024,
  capExR2: 2048,
  capCasterImpProxy: 8192,
  treeCap: 600_000,
  underCap: 700_000,
  extraCap: 180_000,
  stoneCap: 1_500_000,
  impCastFade0: 620,
  impCastFar: 1100,
  treeCasterCascadeMax: 2,
  crownProxyCascadeMax: 4,
  impostorProxyCascadeMax: 4,
  extraCasterCascadeMax: 4,
  occMarchDist: 140,
  occMarchSteps: 7,
  heroMeshScale: 1,
  scatterDensity: 1,
};

/** Default play preset — tuned for ~60 fps on high-end GPUs at 1080p */
const HIGH: VegPerfConfig = {
  capHero: 22,
  capTreeR1: 4096,
  capTreeR2: 4608,
  capImpostor: 24576,
  capUnder: 3200,
  capExR1: 768,
  capExR2: 1536,
  capCasterImpProxy: 3072,
  treeCap: 400_000,
  underCap: 450_000,
  extraCap: 125_000,
  stoneCap: 700_000,
  impCastFade0: 480,
  impCastFar: 700,
  treeCasterCascadeMax: 2,
  crownProxyCascadeMax: 2,
  impostorProxyCascadeMax: 2,
  extraCasterCascadeMax: 2,
  occMarchDist: 200,
  occMarchSteps: 4,
  heroMeshScale: 0.7,
  scatterDensity: 0.68,
};

/** Floor preset — 45–60 fps on mid-tier discrete GPUs (RTX 3060 class) */
const LOW: VegPerfConfig = {
  capHero: 12,
  capTreeR1: 2048,
  capTreeR2: 2560,
  capImpostor: 12288,
  capUnder: 2048,
  capExR1: 512,
  capExR2: 1024,
  capCasterImpProxy: 1536,
  treeCap: 200_000,
  underCap: 240_000,
  extraCap: 70_000,
  stoneCap: 350_000,
  impCastFade0: 380,
  impCastFar: 520,
  treeCasterCascadeMax: 1,
  crownProxyCascadeMax: 1,
  impostorProxyCascadeMax: 1,
  extraCasterCascadeMax: 1,
  occMarchDist: 260,
  occMarchSteps: 2,
  heroMeshScale: 0.5,
  scatterDensity: 0.38,
};

let active: VegPerfConfig = HIGH;

export function vegPerfConfig(preset: QualityPreset): VegPerfConfig {
  switch (preset) {
    case 'ultra':
      return ULTRA;
    case 'low':
      return LOW;
    case 'high':
    default:
      return HIGH;
  }
}

export function initVegPerf(preset: QualityPreset, search = window.location.search): VegPerfConfig {
  const q = new URLSearchParams(search);
  const raw = q.get('vegperf') ?? preset;
  const tier: QualityPreset =
    raw === 'ultra' || raw === 'low' || raw === 'high' ? raw : preset;
  active = vegPerfConfig(tier);
  return active;
}

export function getVegPerf(): VegPerfConfig {
  return active;
}
