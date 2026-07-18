# LAAS Virtual World Creator SDK

Welcome to the LAAS Virtual World Creator SDK! This SDK allows developers and AI agents to programmatically generate high-quality WebGPU-based 3D virtual worlds with custom terrains, trees, foliage, and rocks.

The SDK uses a **dynamic registry-based architecture**. All components, from shaders to pool builders, dynamically query these registries. This makes the system easily expandable.

---

## SDK Architecture Overview

The SDK consists of the following key entry points:

1. **`TerrainRegistry`**: Manages world profiles (climate scales, layout parameters, biomes).
2. **`VegetationRegistry`**: Manages tree species (conifers, broadleafs, snags) and understory plants (shrubs, ferns, flowers, grass).
3. **`RockRegistry`**: Manages rock geometries and presets.
4. **`CategoryRegistry`**: Manages dynamic custom categories and scatter layers.
5. **`WorldGenerator`**: The top-level scriptable bootstrapper that configures and starts the engine.

---

## 1. Adding a New Terrain Profile

Terrain profiles configure the base noise scales, mountain ridge/hill amplitudes, average biomes, and temperature/moisture climate rules.

To add a new terrain profile, register it with the `TerrainRegistry`:

```ts
import { TerrainRegistry } from 'laas-world-sdk';
import { Biome } from '../world/WorldConst';

TerrainRegistry.register({
  id: 'volcanic-wasteland',
  label: 'Volcanic Wasteland',
  climate: {
    tempOffset: 12.0,       // Warm climate offset (°C)
    moistureScale: 0.15,    // Dry climate
    moistureOffset: 0.05,
    snowlineOffset: 400.0,   // High snowline
    vegDensityScale: 0.2,   // Stunted vegetation
    groundGrassScale: 0.0,  // Bare volcanic rock
    treeScale: 0.15,        // Very sparse trees
  },
  layout: {
    alpine: 0.8,
    karst: 0.5,
    lake: 0.3,
    ridgeAmp: 2.2,          // Extremely sharp craggy ridges
    hillsAmp: 1.5,
  },
  dominantBiomes: [Biome.Desert, Biome.Alpine],
});
```

---

## 2. Adding a New Tree Species

A tree species defines the parameters for the procedural branching grammar (Skeleton), leaf configurations, albedo colors, and how it scatters across biomes.

To add a new tree species, register it with the `VegetationRegistry`:

```ts
import { VegetationRegistry } from 'laas-world-sdk';

VegetationRegistry.registerTree({
  id: 'golden-birch',
  label: 'Golden Birch',
  kind: 'broadleaf',
  height: [11.0, 16.0],
  trunkRadiusK: 0.016,
  crown: 'ellipsoid',
  asym: 0.25,
  levels: [
    {
      density: 0, whorl: 0, childStart: 0, childEnd: 0,
      angleBase: 0, angleTip: 0, lenRatio: 0, lenJitter: 0, radRatio: 0,
      segs: 10, wander: 0.05, gravitropism: 0.04, droop: 0, tipCurl: 0, taper: 1.1,
    },
    {
      density: 2.0, whorl: 0, childStart: 0.3, childEnd: 0.95,
      angleBase: 0.95, angleTip: 0.45, lenRatio: 0.45, lenJitter: 0.3, radRatio: 0.45,
      segs: 7, wander: 0.12, gravitropism: 0.03, droop: 0.35, tipCurl: -0.05, taper: 0.95,
    },
    {
      density: 3.5, whorl: 0, childStart: 0.25, childEnd: 1.0,
      angleBase: 0.8, angleTip: 0.5, lenRatio: 0.4, lenJitter: 0.35, radRatio: 0.5,
      segs: 4, wander: 0.15, gravitropism: -0.12, droop: 0.55, tipCurl: -0.06, taper: 0.9,
    },
  ],
  foliage: {
    kind: 'leafCluster',
    anchorLevel: 2,
    spacing: 0.12,
    tStart: 0.2,
    scale: [0.12, 0.18],
    tilt: 0.85,
    clusterSize: [2, 3],
    normalBend: 0.65,
    planarLeaves: true,
    card: { mode: 'cross', sizeK: 2.3 },
    leaf: { len: 0.95, width: 0.5, shapePow: 1.3, fold: 0.2, curl: 0.25, needleCount: 0, brush: 0 },
  },
  flare: { amp: 0.35, height: 0.8, lobes: 4 },
  barkLayer: 3,             // Birch bark layer ID
  barkRepeats: 3,
  foliageColor: { r: 0.72, g: 0.58, b: 0.12, hueVar: 0.2 }, // Golden leaves albedo
  brokenTop: 0,
  stubChance: 0.03,
  placement: {
    // Biome distribution weights: [Alpine, Subalpine, Conifer, Karst, Meadow, Wetland, Desert, Jungle, Swamp, Grassland]
    biomeWeights: [0.0, 0.1, 0.35, 0.12, 0.4, 0.6, 0.0, 0.05, 0.15, 0.25],
    moistureSlope: 0.7,
    moistureIntercept: 0.55,
  },
});
```

---

## 3. Adding a New Understory / Foliage Type

Understory plants can be shrubs (multi-stem meshes) or bespoke custom geometries (flowers, ferns, grass). They are defined by a `buildParts` callback which builds their Three.js `BufferGeometry` and material assignments.

To add a new understory species:

```ts
import { VegetationRegistry, VegClass } from 'laas-world-sdk';
import { foliageMaterial } from '../render/VegMaterials';
import { buildDryGrassTuft } from './Understory'; // import a builder or write custom ones

VegetationRegistry.registerUnderstory({
  id: 'crimson-fern',
  label: 'Crimson Forest Fern',
  cls: VegClass.Fern,       // Map to Fern culling class
  maxDist: 150,             // Render up to 150 meters
  placement: {
    biomeWeights: [0.0, 0.0, 0.3, 0.2, 0.05, 0.4, 0.0, 0.8, 0.5, 0.0],
    moistureSlope: 1.2,
    moistureIntercept: 0.4,
    canopyRelation: 'clump', // Grows under trees
    canopySlope: 1.0,
    canopyIntercept: 0.4,
  },
  buildParts: (rng, atlas) => {
    // Build your custom BufferGeometry here
    const geo = buildDryGrassTuft(rng);
    const tris = geo.index ? geo.index.count / 3 : 0;
    return [
      {
        geo,
        tris,
        make: () => foliageMaterial({ color: { r: 0.58, g: 0.08, b: 0.12, hueVar: 0.15 } }),
        castShadow: false,
      },
    ];
  },
});
```

---

## 4. Adding a New Rock Preset

Rocks are icospheres perturbed by low-frequency noise (macro), strata ledges, ridged creases, and sharp planar fractures.

To add a new rock preset, register it in the `RockRegistry`:

```ts
import { RockRegistry, VegClass } from 'laas-world-sdk';

RockRegistry.register({
  id: 'obsidian-boulder',
  presetName: 'boulder',
  cls: VegClass.Boulder,
  params: {
    radius: 1.4,
    squash: [1.0, 0.88, 0.95],
    macro: 0.32,
    strata: 0.0,            // Smooth glassy volcanic obsidian (no strata)
    strataFreq: 0.0,
    strataTilt: 0.0,
    ridged: 0.22,           // Sharp creases
    cuts: 8,                // Faceted fracture lines
    cutBite: 0.45,
    micro: 0.008,           // Tiny surface grain
  },
  moss: 0.02,               // Almost no moss
  tone: { r: 0.08, g: 0.08, b: 0.09 }, // Glossy charcoal dark color
  maxDist: 700,
});
```

---

## 5. Registering a Custom Category of Assets

A category translates into a custom GPU **Scatter Layer** running on its own candidate grid size and instance capacity.

To register a custom category (e.g. ruins or ruins blocks):

```ts
import { CategoryRegistry } from 'laas-world-sdk';

CategoryRegistry.register({
  id: 'volcanic-vents',
  label: 'Volcanic Geyser Vents',
  cls: 38,                 // Unique dynamic class ID
  cellSize: 18.0,          // Geysers spaced 18m apart
  maxCap: 500,             // Max 500 geysers in the world
  cullKind: 'extras',      // Culling and shadowing behavior like boulders
  placement: {
    biomeWeights: [0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.8, 0.0, 0.0, 0.0], // Desert/volcanic biomes
    rockSlope: 1.2,        // Grows on rocky soils
    rockIntercept: 0.2,
  },
  buildPools: (seed) => {
    // Return pool parts containing geometries and materials
    return [];
  },
});
```

---

## 6. Instantiating and Running Custom Worlds

To initialize the WebGPU world programmatically using the SDK, configure the generator and pass a container element:

```ts
import { WorldGenerator } from 'laas-world-sdk';

const container = document.getElementById('world-viewport')!;

const generator = new WorldGenerator({
  seed: 'desert-storm-102',
  preset: 'ultra',          // low | high | ultra
  weather: 'clear',
  timeOfDay: 14.5,          // Afternoon sun
});

// Build the engine, heightfields, biomes, and scatter meshes
generator.build(container).then((engine) => {
  console.log('LAAS procedural virtual world successfully generated!');
});
```
