/**
 * Species presets — 14 tree species (alpine conifers/broadleaf, karst gnarl,
 * snag, desert mesquite/joshua, jungle fig/palm, swamp cypress/willow,
 * grassland oak/acacia). Numbers are growth-grammar parameters (Skeleton.ts); foliage geometry params feed LeafMesh.ts.
 *
 * Structure rule (user feedback): foliage NEVER sits on primaries — every
 * species ends in a fine twig/branchlet level (planar lattice for spruce
 * boughs / beech plates) and the needles/leaves attach THERE. The lushness
 * comes from thousands of small sprays on that lattice.
 */

import type { SpeciesParams } from './VegTypes';

export const SPRUCE: SpeciesParams = {
  id: 'spruce',
  label: 'Spruce (conifer)',
  kind: 'conifer',
  height: [19, 27],
  trunkRadiusK: 0.017,
  crown: 'cone',
  asym: 0.22,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 16, wander: 0.015, gravitropism: 0.05, droop: 0, tipCurl: 0, taper: 1.0,
    },
    {
      // primaries: near-horizontal spokes, slight sag, up-hooked tips
      density: 5.0, whorl: 4, childStart: 0.09, childEnd: 0.985,
      angleBase: 1.78, angleTip: 0.55, lenRatio: 0.19, lenJitter: 0.2, radRatio: 0.32,
      segs: 6, wander: 0.06, gravitropism: -0.03, droop: 0.3, tipCurl: 0.28, taper: 1.05,
    },
    {
      // branchlets: two-sided planar lattice filling the bough plane
      density: 5.5, whorl: 0, childStart: 0.12, childEnd: 0.98,
      angleBase: 1.05, angleTip: 0.8, lenRatio: 0.24, lenJitter: 0.35, radRatio: 0.4,
      segs: 3, wander: 0.08, gravitropism: -0.05, droop: 0.45, tipCurl: 0.12, taper: 0.9,
      planar: 1,
    },
  ],
  foliage: {
    kind: 'needleSpray',
    anchorLevel: 2,
    spacing: 0.16,
    tStart: 0.05,
    scale: [0.22, 0.35],
    tilt: 0.5,
    clusterSize: [1, 1],
    normalBend: 0.62,
    planarLeaves: true,
    card: { mode: 'lying', sizeK: 2.6 },
    leaf: { len: 0.1, width: 0.024, shapePow: 1, fold: 0, curl: 0, needleCount: 30, brush: 0 },
  },
  flare: { amp: 0.5, height: 1.0, lobes: 5 },
  barkLayer: 0,
  barkRepeats: 5,
  foliageColor: { r: 0.045, g: 0.10, b: 0.05, hueVar: 0.24 },
  brokenTop: 0,
  stubChance: 0.02,
};

export const PINE: SpeciesParams = {
  id: 'pine',
  label: 'Mountain pine (conifer)',
  kind: 'conifer',
  height: [12, 19],
  trunkRadiusK: 0.021,
  crown: 'dome',
  asym: 0.34,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 12, wander: 0.06, gravitropism: 0.03, droop: 0, tipCurl: 0, taper: 0.92,
    },
    {
      density: 1.8, whorl: 3, childStart: 0.42, childEnd: 0.97,
      angleBase: 1.5, angleTip: 0.55, lenRatio: 0.45, lenJitter: 0.32, radRatio: 0.4,
      segs: 8, wander: 0.14, gravitropism: 0.08, droop: 0.3, tipCurl: 0.32, taper: 0.85,
    },
    {
      density: 2.6, whorl: 0, childStart: 0.35, childEnd: 1.0,
      angleBase: 0.9, angleTip: 0.55, lenRatio: 0.32, lenJitter: 0.34, radRatio: 0.45,
      segs: 4, wander: 0.13, gravitropism: 0.06, droop: 0.16, tipCurl: 0.22, taper: 0.85,
    },
    {
      // twiglets rising at the ends — pine carries needles on these
      density: 4.2, whorl: 0, childStart: 0.4, childEnd: 1.0,
      angleBase: 0.8, angleTip: 0.5, lenRatio: 0.4, lenJitter: 0.4, radRatio: 0.5,
      segs: 2, wander: 0.15, gravitropism: 0.1, droop: 0.1, tipCurl: 0.15, taper: 0.8,
    },
  ],
  foliage: {
    kind: 'needleSpray',
    anchorLevel: 3,
    spacing: 0.11,
    tStart: 0.3,
    scale: [0.26, 0.42],
    tilt: 0.55,
    clusterSize: [1, 1],
    normalBend: 0.66,
    card: { mode: 'cross', sizeK: 2.2 },
    leaf: { len: 0.21, width: 0.018, shapePow: 1, fold: 0, curl: 0, needleCount: 88, brush: 1 },
  },
  flare: { amp: 0.42, height: 0.8, lobes: 4 },
  barkLayer: 1,
  barkRepeats: 4,
  foliageColor: { r: 0.04, g: 0.092, b: 0.048, hueVar: 0.22 },
  brokenTop: 0,
  stubChance: 0.04,
};

export const BEECH: SpeciesParams = {
  id: 'beech',
  label: 'Beech (broadleaf)',
  kind: 'broadleaf',
  height: [13, 20],
  trunkRadiusK: 0.024,
  crown: 'ellipsoid',
  asym: 0.3,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 9, wander: 0.05, gravitropism: 0.04, droop: 0, tipCurl: 0, taper: 1.25,
    },
    {
      density: 1.5, whorl: 0, childStart: 0.32, childEnd: 0.94,
      angleBase: 1.05, angleTip: 0.5, lenRatio: 0.56, lenJitter: 0.26, radRatio: 0.5,
      segs: 8, wander: 0.1, gravitropism: 0.085, droop: 0.22, tipCurl: 0.12, taper: 0.95,
    },
    {
      density: 2.3, whorl: 0, childStart: 0.25, childEnd: 0.97,
      angleBase: 0.92, angleTip: 0.55, lenRatio: 0.46, lenJitter: 0.3, radRatio: 0.52,
      segs: 5, wander: 0.13, gravitropism: 0.05, droop: 0.3, tipCurl: 0.08, taper: 0.9,
    },
    {
      // distichous twig plates — beech's layered horizontal foliage
      density: 8.0, whorl: 0, childStart: 0.15, childEnd: 1.0,
      angleBase: 0.9, angleTip: 0.6, lenRatio: 0.28, lenJitter: 0.35, radRatio: 0.55,
      segs: 3, wander: 0.1, gravitropism: -0.02, droop: 0.15, tipCurl: 0.04, taper: 0.85,
      planar: 1,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.13,
    tStart: 0.1,
    scale: [0.16, 0.24],
    tilt: 1.0,
    clusterSize: [2, 3],
    normalBend: 0.7,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.3 },
    leaf: { len: 1.0, width: 0.42, shapePow: 1.15, fold: 0.32, curl: 0.22, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.55, height: 1.2, lobes: 6 },
  barkLayer: 2,
  barkRepeats: 4,
  foliageColor: { r: 0.06, g: 0.145, b: 0.035, hueVar: 0.3 },
  brokenTop: 0,
  stubChance: 0.02,
};

export const BIRCH: SpeciesParams = {
  id: 'birch',
  label: 'Birch (broadleaf)',
  kind: 'broadleaf',
  height: [9, 15],
  trunkRadiusK: 0.015,
  crown: 'column',
  asym: 0.26,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 11, wander: 0.05, gravitropism: 0.045, droop: 0, tipCurl: 0, taper: 1.1,
    },
    {
      density: 2.2, whorl: 0, childStart: 0.3, childEnd: 0.96,
      angleBase: 0.95, angleTip: 0.45, lenRatio: 0.4, lenJitter: 0.3, radRatio: 0.42,
      segs: 7, wander: 0.11, gravitropism: 0.02, droop: 0.4, tipCurl: -0.04, taper: 0.95,
    },
    {
      density: 3.8, whorl: 0, childStart: 0.3, childEnd: 1.0,
      angleBase: 0.8, angleTip: 0.5, lenRatio: 0.42, lenJitter: 0.34, radRatio: 0.5,
      segs: 4, wander: 0.14, gravitropism: -0.1, droop: 0.5, tipCurl: -0.05, taper: 0.9,
    },
    {
      // weeping twig streamers
      density: 6.0, whorl: 0, childStart: 0.3, childEnd: 1.0,
      angleBase: 0.7, angleTip: 0.45, lenRatio: 0.35, lenJitter: 0.4, radRatio: 0.5,
      segs: 3, wander: 0.12, gravitropism: -0.3, droop: 0.7, tipCurl: -0.05, taper: 0.85,
      planar: 0.5,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.11,
    tStart: 0.15,
    scale: [0.1, 0.16],
    tilt: 0.9,
    clusterSize: [2, 3],
    normalBend: 0.66,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.3 },
    leaf: { len: 1.0, width: 0.55, shapePow: 1.4, fold: 0.22, curl: 0.3, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.32, height: 0.7, lobes: 4 },
  barkLayer: 3,
  barkRepeats: 3,
  foliageColor: { r: 0.075, g: 0.15, b: 0.03, hueVar: 0.34 },
  brokenTop: 0,
  stubChance: 0.03,
};

export const KARST_GNARL: SpeciesParams = {
  id: 'karst',
  label: 'Karst gnarl (cliff broadleaf)',
  kind: 'broadleaf',
  height: [3.5, 6.5],
  trunkRadiusK: 0.045,
  crown: 'irregular',
  asym: 0.5,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 9, wander: 0.34, gravitropism: -0.05, droop: 0, tipCurl: 0.1, taper: 0.8,
    },
    {
      density: 2.6, whorl: 0, childStart: 0.15, childEnd: 0.95,
      angleBase: 1.35, angleTip: 0.7, lenRatio: 0.62, lenJitter: 0.45, radRatio: 0.55,
      segs: 7, wander: 0.3, gravitropism: 0.06, droop: 0.35, tipCurl: 0.18, taper: 0.8,
    },
    {
      density: 3.8, whorl: 0, childStart: 0.2, childEnd: 1.0,
      angleBase: 1.0, angleTip: 0.6, lenRatio: 0.42, lenJitter: 0.4, radRatio: 0.55,
      segs: 4, wander: 0.3, gravitropism: 0.05, droop: 0.25, tipCurl: 0.1, taper: 0.85,
    },
    {
      // gnarled twiglets carrying layered leaf plates
      density: 5.0, whorl: 0, childStart: 0.25, childEnd: 1.0,
      angleBase: 0.85, angleTip: 0.55, lenRatio: 0.4, lenJitter: 0.45, radRatio: 0.5,
      segs: 2, wander: 0.25, gravitropism: 0.04, droop: 0.2, tipCurl: 0.1, taper: 0.85,
      planar: 0.4,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.055,
    tStart: 0.12,
    scale: [0.11, 0.16],
    tilt: 0.9,
    clusterSize: [2, 4],
    normalBend: 0.66,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.2 },
    leaf: { len: 1.0, width: 0.5, shapePow: 1.2, fold: 0.3, curl: 0.24, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.9, height: 0.7, lobes: 6 },
  barkLayer: 4,
  barkRepeats: 3,
  foliageColor: { r: 0.05, g: 0.12, b: 0.04, hueVar: 0.24 },
  brokenTop: 0,
  stubChance: 0.1,
};

export const SNAG: SpeciesParams = {
  id: 'snag',
  label: 'Snag (dead standing)',
  kind: 'snag',
  height: [8, 15],
  trunkRadiusK: 0.022,
  crown: 'cone',
  asym: 0.3,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 13, wander: 0.06, gravitropism: 0.04, droop: 0, tipCurl: 0, taper: 0.9,
    },
    {
      density: 2.4, whorl: 0, childStart: 0.2, childEnd: 0.97,
      angleBase: 1.6, angleTip: 0.85, lenRatio: 0.38, lenJitter: 0.45, radRatio: 0.32,
      segs: 6, wander: 0.14, gravitropism: -0.1, droop: 0.6, tipCurl: 0.05, taper: 0.75,
    },
    {
      density: 1.8, whorl: 0, childStart: 0.2, childEnd: 1.0,
      angleBase: 1.1, angleTip: 0.7, lenRatio: 0.3, lenJitter: 0.5, radRatio: 0.4,
      segs: 3, wander: 0.2, gravitropism: -0.08, droop: 0.4, tipCurl: 0, taper: 0.7,
    },
  ],
  foliage: null,
  flare: { amp: 0.6, height: 0.9, lobes: 5 },
  barkLayer: 5,
  barkRepeats: 4,
  foliageColor: { r: 0.1, g: 0.09, b: 0.07, hueVar: 0.1 },
  brokenTop: 0.62,
  stubChance: 0.28,
};

/** Desert mesquite — twisted multi-trunk scrub, sparse gray-green leaflets. */
export const MESQUITE: SpeciesParams = {
  id: 'mesquite',
  label: 'Mesquite (desert scrub)',
  kind: 'broadleaf',
  height: [3.8, 6.5],
  trunkRadiusK: 0.028,
  crown: 'irregular',
  asym: 0.42,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 7, wander: 0.22, gravitropism: 0.04, droop: 0, tipCurl: 0, taper: 0.95,
    },
    {
      density: 2.8, whorl: 0, childStart: 0.18, childEnd: 0.92,
      angleBase: 1.25, angleTip: 0.65, lenRatio: 0.52, lenJitter: 0.42, radRatio: 0.48,
      segs: 5, wander: 0.24, gravitropism: 0.06, droop: 0.28, tipCurl: 0.12, taper: 0.88,
    },
    {
      density: 4.2, whorl: 0, childStart: 0.2, childEnd: 1.0,
      angleBase: 0.95, angleTip: 0.55, lenRatio: 0.38, lenJitter: 0.45, radRatio: 0.5,
      segs: 3, wander: 0.2, gravitropism: 0.04, droop: 0.2, tipCurl: 0.08, taper: 0.85,
      planar: 0.4,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 2,
    spacing: 0.14,
    tStart: 0.15,
    scale: [0.07, 0.11],
    tilt: 0.85,
    clusterSize: [2, 3],
    normalBend: 0.58,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.0 },
    leaf: { len: 0.55, width: 0.18, shapePow: 1.1, fold: 0.2, curl: 0.15, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.35, height: 0.5, lobes: 4 },
  barkLayer: 6,
  barkRepeats: 3,
  foliageColor: { r: 0.07, g: 0.11, b: 0.045, hueVar: 0.2 },
  brokenTop: 0,
  stubChance: 0.06,
};

/** Joshua tree — stiff column trunk with few up-curving arms and spiky sprays. */
export const JOSHUA: SpeciesParams = {
  id: 'joshua',
  label: 'Joshua tree (desert yucca)',
  kind: 'conifer',
  height: [5.5, 11],
  trunkRadiusK: 0.024,
  crown: 'column',
  asym: 0.18,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 10, wander: 0.04, gravitropism: 0.02, droop: 0, tipCurl: 0, taper: 1.05,
    },
    {
      density: 1.2, whorl: 2, childStart: 0.55, childEnd: 0.98,
      angleBase: 0.55, angleTip: 0.35, lenRatio: 0.48, lenJitter: 0.28, radRatio: 0.38,
      segs: 5, wander: 0.08, gravitropism: -0.12, droop: 0.05, tipCurl: 0.35, taper: 0.9,
    },
    {
      density: 3.5, whorl: 0, childStart: 0.7, childEnd: 1.0,
      angleBase: 0.45, angleTip: 0.3, lenRatio: 0.22, lenJitter: 0.3, radRatio: 0.45,
      segs: 2, wander: 0.1, gravitropism: -0.08, droop: 0, tipCurl: 0.2, taper: 0.85,
    },
  ],
  foliage: {
    kind: 'needleSpray',
    anchorLevel: 2,
    spacing: 0.12,
    tStart: 0.55,
    scale: [0.28, 0.42],
    tilt: 0.4,
    clusterSize: [1, 1],
    normalBend: 0.55,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.4 },
    leaf: { len: 0.14, width: 0.022, shapePow: 1, fold: 0, curl: 0, needleCount: 42, brush: 0.6 },
  },
  flare: { amp: 0.28, height: 0.45, lobes: 3 },
  barkLayer: 7,
  barkRepeats: 3,
  foliageColor: { r: 0.055, g: 0.1, b: 0.04, hueVar: 0.16 },
  brokenTop: 0,
  stubChance: 0.04,
};

/** Tropical fig — massive jungle broadleaf canopy. */
export const TROPICAL_FIG: SpeciesParams = {
  id: 'tropicalFig',
  label: 'Tropical fig (jungle broadleaf)',
  kind: 'broadleaf',
  height: [16, 24],
  trunkRadiusK: 0.022,
  crown: 'ellipsoid',
  asym: 0.28,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 10, wander: 0.06, gravitropism: 0.04, droop: 0, tipCurl: 0, taper: 1.2,
    },
    {
      density: 1.8, whorl: 0, childStart: 0.28, childEnd: 0.95,
      angleBase: 1.1, angleTip: 0.5, lenRatio: 0.58, lenJitter: 0.28, radRatio: 0.48,
      segs: 7, wander: 0.1, gravitropism: 0.06, droop: 0.18, tipCurl: 0.1, taper: 0.92,
    },
    {
      density: 3.2, whorl: 0, childStart: 0.2, childEnd: 0.98,
      angleBase: 0.88, angleTip: 0.55, lenRatio: 0.42, lenJitter: 0.32, radRatio: 0.52,
      segs: 4, wander: 0.12, gravitropism: 0.04, droop: 0.22, tipCurl: 0.06, taper: 0.88,
    },
    {
      density: 7.5, whorl: 0, childStart: 0.12, childEnd: 1.0,
      angleBase: 0.85, angleTip: 0.6, lenRatio: 0.3, lenJitter: 0.35, radRatio: 0.55,
      segs: 3, wander: 0.1, gravitropism: -0.02, droop: 0.12, tipCurl: 0.04, taper: 0.85,
      planar: 0.8,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.1,
    tStart: 0.08,
    scale: [0.18, 0.28],
    tilt: 1.0,
    clusterSize: [2, 4],
    normalBend: 0.72,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.5 },
    leaf: { len: 1.1, width: 0.55, shapePow: 1.2, fold: 0.28, curl: 0.18, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.65, height: 1.1, lobes: 6 },
  barkLayer: 8,
  barkRepeats: 4,
  foliageColor: { r: 0.035, g: 0.12, b: 0.028, hueVar: 0.28 },
  brokenTop: 0,
  stubChance: 0.02,
};

/** Jungle palm — single trunk with radiating frond sprays at the crown. */
export const PALM: SpeciesParams = {
  id: 'palm',
  label: 'Palm (jungle)',
  kind: 'broadleaf',
  height: [8, 14],
  trunkRadiusK: 0.019,
  crown: 'column',
  asym: 0.12,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 12, wander: 0.03, gravitropism: 0.02, droop: 0, tipCurl: 0, taper: 1.08,
    },
    {
      density: 6.5, whorl: 0, childStart: 0.88, childEnd: 1.0,
      angleBase: 1.35, angleTip: 0.7, lenRatio: 0.35, lenJitter: 0.25, radRatio: 0.42,
      segs: 3, wander: 0.06, gravitropism: -0.2, droop: 0.55, tipCurl: -0.08, taper: 0.9,
      planar: 0.3,
    },
  ],
  foliage: {
    kind: 'needleSpray',
    anchorLevel: 1,
    spacing: 0.2,
    tStart: 0.05,
    scale: [0.35, 0.55],
    tilt: 0.7,
    clusterSize: [1, 1],
    normalBend: 0.6,
    planarLeaves: true,
    captureStyle: 'frond',
    card: { mode: 'lying', sizeK: 2.8 },
    leaf: { len: 0.12, width: 0.028, shapePow: 1, fold: 0, curl: 0, needleCount: 24, brush: 0 },
  },
  flare: { amp: 0.22, height: 0.35, lobes: 3 },
  barkLayer: 9,
  barkRepeats: 4,
  foliageColor: { r: 0.04, g: 0.115, b: 0.03, hueVar: 0.22 },
  brokenTop: 0,
  stubChance: 0.01,
};

/** Bald cypress — columnar swamp conifer with feathery sprays. */
export const CYPRESS: SpeciesParams = {
  id: 'cypress',
  label: 'Cypress (swamp conifer)',
  kind: 'conifer',
  height: [14, 20],
  trunkRadiusK: 0.02,
  crown: 'column',
  asym: 0.2,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 11, wander: 0.05, gravitropism: 0.03, droop: 0, tipCurl: 0, taper: 1.1,
    },
    {
      density: 2.2, whorl: 3, childStart: 0.12, childEnd: 0.96,
      angleBase: 1.15, angleTip: 0.45, lenRatio: 0.22, lenJitter: 0.22, radRatio: 0.35,
      segs: 6, wander: 0.08, gravitropism: 0.04, droop: 0.35, tipCurl: 0.15, taper: 1.0,
    },
    {
      density: 4.8, whorl: 0, childStart: 0.1, childEnd: 0.98,
      angleBase: 0.95, angleTip: 0.55, lenRatio: 0.28, lenJitter: 0.3, radRatio: 0.42,
      segs: 3, wander: 0.1, gravitropism: 0.02, droop: 0.4, tipCurl: 0.1, taper: 0.92,
      planar: 0.7,
    },
  ],
  foliage: {
    kind: 'needleSpray',
    anchorLevel: 2,
    spacing: 0.13,
    tStart: 0.08,
    scale: [0.2, 0.32],
    tilt: 0.55,
    clusterSize: [1, 1],
    normalBend: 0.64,
    planarLeaves: true,
    card: { mode: 'lying', sizeK: 2.5 },
    leaf: { len: 0.08, width: 0.02, shapePow: 1, fold: 0, curl: 0, needleCount: 36, brush: 0 },
  },
  flare: { amp: 0.55, height: 0.9, lobes: 5 },
  barkLayer: 10,
  barkRepeats: 4,
  foliageColor: { r: 0.04, g: 0.095, b: 0.042, hueVar: 0.2 },
  brokenTop: 0,
  stubChance: 0.03,
};

/** Weeping willow — drooping branches over wet margins. */
export const WILLOW: SpeciesParams = {
  id: 'willow',
  label: 'Willow (swamp broadleaf)',
  kind: 'broadleaf',
  height: [10, 16],
  trunkRadiusK: 0.022,
  crown: 'irregular',
  asym: 0.32,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 10, wander: 0.06, gravitropism: 0.04, droop: 0, tipCurl: 0, taper: 1.15,
    },
    {
      density: 1.6, whorl: 0, childStart: 0.35, childEnd: 0.96,
      angleBase: 1.0, angleTip: 0.45, lenRatio: 0.5, lenJitter: 0.28, radRatio: 0.45,
      segs: 7, wander: 0.1, gravitropism: 0.02, droop: 0.35, tipCurl: -0.05, taper: 0.92,
    },
    {
      density: 3.5, whorl: 0, childStart: 0.25, childEnd: 1.0,
      angleBase: 0.75, angleTip: 0.4, lenRatio: 0.4, lenJitter: 0.35, radRatio: 0.48,
      segs: 4, wander: 0.12, gravitropism: -0.15, droop: 0.65, tipCurl: -0.08, taper: 0.88,
    },
    {
      density: 5.5, whorl: 0, childStart: 0.3, childEnd: 1.0,
      angleBase: 0.65, angleTip: 0.35, lenRatio: 0.32, lenJitter: 0.4, radRatio: 0.5,
      segs: 3, wander: 0.1, gravitropism: -0.25, droop: 0.75, tipCurl: -0.06, taper: 0.85,
      planar: 0.5,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.09,
    tStart: 0.12,
    scale: [0.09, 0.14],
    tilt: 0.85,
    clusterSize: [2, 3],
    normalBend: 0.65,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.2 },
    leaf: { len: 0.9, width: 0.22, shapePow: 1.3, fold: 0.18, curl: 0.28, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.48, height: 0.85, lobes: 5 },
  barkLayer: 11,
  barkRepeats: 3,
  foliageColor: { r: 0.05, g: 0.13, b: 0.035, hueVar: 0.26 },
  brokenTop: 0,
  stubChance: 0.03,
};

/** Scattered oak — open grassland savanna tree. */
export const OAK: SpeciesParams = {
  id: 'oak',
  label: 'Oak (grassland)',
  kind: 'broadleaf',
  height: [11, 17],
  trunkRadiusK: 0.026,
  crown: 'irregular',
  asym: 0.35,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 9, wander: 0.06, gravitropism: 0.04, droop: 0, tipCurl: 0, taper: 1.2,
    },
    {
      density: 1.4, whorl: 0, childStart: 0.38, childEnd: 0.94,
      angleBase: 1.15, angleTip: 0.55, lenRatio: 0.52, lenJitter: 0.3, radRatio: 0.5,
      segs: 7, wander: 0.12, gravitropism: 0.05, droop: 0.2, tipCurl: 0.1, taper: 0.92,
    },
    {
      density: 2.5, whorl: 0, childStart: 0.28, childEnd: 0.98,
      angleBase: 0.95, angleTip: 0.5, lenRatio: 0.44, lenJitter: 0.32, radRatio: 0.52,
      segs: 4, wander: 0.14, gravitropism: 0.04, droop: 0.25, tipCurl: 0.06, taper: 0.88,
    },
    {
      density: 6.0, whorl: 0, childStart: 0.18, childEnd: 1.0,
      angleBase: 0.9, angleTip: 0.55, lenRatio: 0.3, lenJitter: 0.38, radRatio: 0.55,
      segs: 3, wander: 0.1, gravitropism: 0, droop: 0.15, tipCurl: 0.04, taper: 0.85,
      planar: 0.6,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 3,
    spacing: 0.11,
    tStart: 0.1,
    scale: [0.14, 0.22],
    tilt: 0.95,
    clusterSize: [2, 4],
    normalBend: 0.68,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.4 },
    leaf: { len: 1.0, width: 0.48, shapePow: 1.15, fold: 0.3, curl: 0.2, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.6, height: 1.0, lobes: 6 },
  barkLayer: 12,
  barkRepeats: 4,
  foliageColor: { r: 0.055, g: 0.13, b: 0.032, hueVar: 0.3 },
  brokenTop: 0,
  stubChance: 0.03,
};

/** Acacia — flat umbrella crown on a short trunk. */
export const ACACIA: SpeciesParams = {
  id: 'acacia',
  label: 'Acacia (grassland savanna)',
  kind: 'broadleaf',
  height: [7, 12],
  trunkRadiusK: 0.022,
  crown: 'dome',
  asym: 0.28,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 8, wander: 0.05, gravitropism: 0.03, droop: 0, tipCurl: 0, taper: 1.05,
    },
    {
      density: 2.0, whorl: 0, childStart: 0.55, childEnd: 0.98,
      angleBase: 1.45, angleTip: 0.35, lenRatio: 0.62, lenJitter: 0.32, radRatio: 0.45,
      segs: 6, wander: 0.1, gravitropism: 0.02, droop: 0.15, tipCurl: 0.08, taper: 0.9,
    },
    {
      density: 5.5, whorl: 0, childStart: 0.4, childEnd: 1.0,
      angleBase: 0.85, angleTip: 0.45, lenRatio: 0.35, lenJitter: 0.35, radRatio: 0.5,
      segs: 3, wander: 0.12, gravitropism: -0.05, droop: 0.2, tipCurl: 0.05, taper: 0.85,
      planar: 0.5,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 2,
    spacing: 0.1,
    tStart: 0.2,
    scale: [0.1, 0.16],
    tilt: 0.9,
    clusterSize: [2, 3],
    normalBend: 0.62,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.2 },
    leaf: { len: 0.45, width: 0.08, shapePow: 1.4, fold: 0.15, curl: 0.12, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.4, height: 0.6, lobes: 4 },
  barkLayer: 13,
  barkRepeats: 3,
  foliageColor: { r: 0.06, g: 0.12, b: 0.035, hueVar: 0.24 },
  brokenTop: 0,
  stubChance: 0.04,
};

import { VegetationRegistry } from '../sdk/Registry';

// Define placement parameters for standard trees
(SPRUCE as any).placement = {
  biomeWeights: [0, 0.6, 0.58, 0.07, 0.05, 0.12, 0, 0.02, 0.02, 0.02],
  moistureSlope: 0.5,
  moistureIntercept: 0.75,
};
(PINE as any).placement = {
  biomeWeights: [0, 0.22, 0.27, 0.02, 0.15, 0, 0, 0.02, 0.02, 0.08],
  moistureSlope: -0.9,
  moistureIntercept: 1.45,
};
(BEECH as any).placement = {
  biomeWeights: [0, 0, 0.02, 0.5, 0.42, 0.05, 0, 0.05, 0.05, 0.02],
  moistureSlope: 0.9,
  moistureIntercept: 0.55,
};
(BIRCH as any).placement = {
  biomeWeights: [0, 0.03, 0.08, 0.16, 0.3, 0.55, 0, 0.05, 0.1, 0.05],
  moistureSlope: 0.6,
  moistureIntercept: 0.7,
};
(KARST_GNARL as any).placement = {
  biomeWeights: [0, 0, 0, 0.2, 0, 0, 0, 0.05, 0.02, 0],
  rockSlope: 1.6,
  rockIntercept: 0.4,
};
(SNAG as any).placement = {
  biomeWeights: [0, 0.15, 0.05, 0.05, 0.08, 0.28, 0.12, 0.02, 0.15, 0.08],
};
(MESQUITE as any).placement = {
  biomeWeights: [0, 0, 0, 0, 0.02, 0, 0.55, 0, 0, 0.03],
  moistureSlope: -0.85,
  moistureIntercept: 1.35,
};
(JOSHUA as any).placement = {
  biomeWeights: [0, 0, 0, 0, 0.03, 0, 0.35, 0, 0, 0.01],
  moistureSlope: -0.7,
  moistureIntercept: 1.25,
};
(TROPICAL_FIG as any).placement = {
  biomeWeights: [0, 0, 0, 0.02, 0, 0.02, 0, 0.52, 0.08, 0],
  moistureSlope: 1.0,
  moistureIntercept: 0.45,
};
(PALM as any).placement = {
  biomeWeights: [0, 0, 0, 0, 0, 0.03, 0, 0.28, 0.05, 0],
  moistureSlope: 0.85,
  moistureIntercept: 0.55,
};
(CYPRESS as any).placement = {
  biomeWeights: [0, 0, 0, 0, 0.02, 0.1, 0, 0.05, 0.45, 0],
  moistureSlope: 0.95,
  moistureIntercept: 0.5,
};
(WILLOW as any).placement = {
  biomeWeights: [0, 0, 0, 0, 0, 0.35, 0, 0.08, 0.35, 0],
  moistureSlope: 1.1,
  moistureIntercept: 0.35,
};
(OAK as any).placement = {
  biomeWeights: [0, 0, 0, 0.05, 0.12, 0.08, 0.02, 0.02, 0.05, 0.42],
  moistureSlope: 0.7,
  moistureIntercept: 0.65,
};
(ACACIA as any).placement = {
  biomeWeights: [0, 0, 0, 0, 0.08, 0.05, 0.03, 0.03, 0.02, 0.35],
};

// Register in VegetationRegistry
const standardTrees = [
  SPRUCE,
  PINE,
  BEECH,
  BIRCH,
  KARST_GNARL,
  SNAG,
  MESQUITE,
  JOSHUA,
  TROPICAL_FIG,
  PALM,
  CYPRESS,
  WILLOW,
  OAK,
  ACACIA,
];
standardTrees.forEach((t) => VegetationRegistry.registerTree(t));

export const TREE_SPECIES: readonly SpeciesParams[] = standardTrees;
