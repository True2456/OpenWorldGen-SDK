/**
 * Jacaranda (*Jacaranda mimosifolia*) — South American street tree.
 * Spreading umbrella crown, fern-like bipinnate compound leaves,
 * violet spring blossom, grey-brown scaly bark.
 */

import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const JACARANDA: SpeciesParams = {
  id: 'jacaranda',
  label: 'Jacaranda (Jacaranda mimosifolia)',
  kind: 'broadleaf',
  height: [10, 15],
  trunkRadiusK: 0.021,
  crown: 'dome',
  asym: 0.3,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 10, wander: 0.04, gravitropism: 0.03, droop: 0, tipCurl: 0, taper: 1.1,
    },
    {
      density: 1.5, whorl: 0, childStart: 0.58, childEnd: 0.96,
      angleBase: 1.54, angleTip: 0.24, lenRatio: 0.66, lenJitter: 0.28, radRatio: 0.44,
      segs: 7, wander: 0.12, gravitropism: 0.02, droop: 0.2, tipCurl: 0.08, taper: 0.9,
    },
    {
      density: 3.4, whorl: 0, childStart: 0.32, childEnd: 1.0,
      angleBase: 0.94, angleTip: 0.44, lenRatio: 0.42, lenJitter: 0.32, radRatio: 0.48,
      segs: 5, wander: 0.14, gravitropism: -0.02, droop: 0.24, tipCurl: 0.06, taper: 0.86,
      planar: 0.58,
    },
    {
      density: 5.8, whorl: 0, childStart: 0.22, childEnd: 1.0,
      angleBase: 0.82, angleTip: 0.5, lenRatio: 0.3, lenJitter: 0.34, radRatio: 0.5,
      segs: 3, wander: 0.12, gravitropism: -0.03, droop: 0.2, tipCurl: 0.05, taper: 0.84,
      planar: 0.68,
    },
  ],
  foliage: {
    kind: 'needleSpray',
    anchorLevel: 3,
    spacing: 0.11,
    tStart: 0.14,
    scale: [0.28, 0.42],
    tilt: 0.78,
    clusterSize: [1, 1],
    normalBend: 0.62,
    planarLeaves: true,
    captureStyle: 'frond',
    card: { mode: 'cross', sizeK: 2.5 },
    leaf: { len: 0.1, width: 0.026, shapePow: 1, fold: 0, curl: 0, needleCount: 26, brush: 0 },
  },
  flare: { amp: 0.4, height: 0.58, lobes: 4 },
  barkLayer: 31,
  barkRepeats: 3,
  foliageColor: { r: 0.055, g: 0.13, b: 0.042, hueVar: 0.26 },
  blossom: { r: 0.54, g: 0.34, b: 0.88, frac: 0.7 },
  brokenTop: 0,
  stubChance: 0.03,
};

/**
 * Jacaranda mimosifolia — tall umbrella crown on a straight grey trunk,
 * fern-like bipinnate frond sprays, and violet spring blossom clusters.
 */
export function buildJacaranda(rng: Rng): BuiltTree {
  return buildTree(JACARANDA, rng, { foliageMode: 'cards' });
}
