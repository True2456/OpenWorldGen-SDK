import type { Rng } from '../core/Seed';
import type { SpeciesParams } from './VegTypes';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';

/** African marula — round spreading crown on a thick grey fissured trunk. */
export const MARULA: SpeciesParams = {
  id: 'marula',
  label: 'Marula (African savanna)',
  kind: 'broadleaf',
  height: [12, 18],
  trunkRadiusK: 0.03,
  crown: 'dome',
  asym: 0.38,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 10, wander: 0.05, gravitropism: 0.04, droop: 0, tipCurl: 0, taper: 1.18,
    },
    {
      density: 1.2, whorl: 0, childStart: 0.32, childEnd: 0.92,
      angleBase: 1.28, angleTip: 0.5, lenRatio: 0.58, lenJitter: 0.28, radRatio: 0.48,
      segs: 7, wander: 0.11, gravitropism: 0.04, droop: 0.22, tipCurl: 0.08, taper: 0.9,
    },
    {
      density: 2.8, whorl: 0, childStart: 0.22, childEnd: 0.98,
      angleBase: 1.0, angleTip: 0.52, lenRatio: 0.46, lenJitter: 0.32, radRatio: 0.5,
      segs: 5, wander: 0.13, gravitropism: 0.03, droop: 0.28, tipCurl: 0.06, taper: 0.88,
    },
    {
      density: 7.5, whorl: 0, childStart: 0.15, childEnd: 1.0,
      angleBase: 0.88, angleTip: 0.58, lenRatio: 0.3, lenJitter: 0.36, radRatio: 0.54,
      segs: 3, wander: 0.11, gravitropism: -0.02, droop: 0.32, tipCurl: 0.05, taper: 0.84,
      planar: 0.55,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.1,
    tStart: 0.1,
    scale: [0.12, 0.2],
    tilt: 0.92,
    clusterSize: [3, 5],
    normalBend: 0.66,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.5 },
    leaf: { len: 0.62, width: 0.14, shapePow: 1.2, fold: 0.22, curl: 0.18, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.55, height: 1.05, lobes: 5 },
  barkLayer: 15,
  barkRepeats: 5,
  foliageColor: { r: 0.05, g: 0.12, b: 0.03, hueVar: 0.28 },
  brokenTop: 0,
  stubChance: 0.03,
};

/**
 * African marula (*Sclerocarya birrea*) — medium-large deciduous savanna tree
 * with a round spreading crown, thick fissured trunk, and dense compound
 * olive-green leaf clusters.
 */
export function buildMarula(rng: Rng): BuiltTree {
  return buildTree(MARULA, rng, { foliageMode: 'cards' });
}
