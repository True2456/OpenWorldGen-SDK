import type { Rng } from '../core/Seed';
import { buildTree } from './TreeBuilder';
import type { BuiltTree } from './TreeBuilder';
import type { SpeciesParams } from './VegTypes';

export const GINKGO: SpeciesParams = {
  id: 'ginkgo',
  label: 'Ginkgo (Ginkgo biloba)',
  kind: 'broadleaf',
  height: [12, 18],
  trunkRadiusK: 0.02,
  crown: 'irregular',
  asym: 0.3,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 12, wander: 0.04, gravitropism: 0.03, droop: 0, tipCurl: 0, taper: 1.08,
    },
    {
      density: 0.95, whorl: 0, childStart: 0.58, childEnd: 0.94,
      angleBase: 1.18, angleTip: 0.38, lenRatio: 0.52, lenJitter: 0.26, radRatio: 0.4,
      segs: 7, wander: 0.12, gravitropism: 0.04, droop: 0.14, tipCurl: 0.06, taper: 0.9,
    },
    {
      density: 2.0, whorl: 0, childStart: 0.42, childEnd: 0.98,
      angleBase: 0.92, angleTip: 0.44, lenRatio: 0.38, lenJitter: 0.3, radRatio: 0.46,
      segs: 4, wander: 0.14, gravitropism: 0.02, droop: 0.18, tipCurl: 0.05, taper: 0.86,
      planar: 0.6,
    },
    {
      density: 6.2, whorl: 0, childStart: 0.55, childEnd: 1.0,
      angleBase: 0.78, angleTip: 0.5, lenRatio: 0.28, lenJitter: 0.34, radRatio: 0.5,
      segs: 2, wander: 0.1, gravitropism: -0.02, droop: 0.2, tipCurl: 0.04, taper: 0.82,
      planar: 0.72,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.07,
    tStart: 0.38,
    scale: [0.14, 0.22],
    tilt: 0.86,
    clusterSize: [4, 6],
    normalBend: 0.62,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.9 },
    leaf: { len: 0.44, width: 0.62, shapePow: 0.8, fold: 0.08, curl: 0.06, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.36, height: 0.62, lobes: 4 },
  barkLayer: 18,
  barkRepeats: 3,
  foliageColor: { r: 0.1, g: 0.14, b: 0.04, hueVar: 0.3 },
  brokenTop: 0,
  stubChance: 0.03,
};

/**
 * Ginkgo biloba — tall columnar to pyramidal crown with sparse branching,
 * dense fan-shaped leaf clusters at twig tips, and pale grey smooth bark.
 */
export function buildGinkgo(rng: Rng): BuiltTree {
  return buildTree(GINKGO, rng, { foliageMode: 'cards' });
}
