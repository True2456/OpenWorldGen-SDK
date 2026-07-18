# Vegetation Library

Single catalog for procedural plants in LaasGenerator. Import from `src/vegetation/library` instead of wiring gallery, scatter, and verification separately.

## Layout

```
src/vegetation/
├── library/
│   ├── index.ts          # public API
│   ├── types.ts          # PlantDefinition, PlantVerifyGate, …
│   ├── registry.ts       # PLANT_LIBRARY, getPlant, plantsForBiome, …
│   ├── trees.ts          # TREE_LIBRARY (VegClass 0–13)
│   ├── understory.ts     # UNDERSTORY_LIBRARY (VegClass 14–24)
│   ├── plants.ts         # STANDALONE_PLANT_LIBRARY (gallery modules)
│   └── gallery.ts        # installNewPlantsGalleryRow, NEW_PLANT_VERIFY_GATES
├── Rhododendron.ts       # buildRhododendron
├── Lupine.ts             # buildLupine
├── Cattail.ts            # buildCattail
├── Hosta.ts              # buildHosta, hostaMaterial
├── Clover.ts             # buildClover
└── … (Species, Understory, TreeBuilder, …)
```

## Quick API

```ts
import {
  PLANT_LIBRARY,
  getPlant,
  listPlants,
  plantsForBiome,
  galleryPlants,
  scatteredPlants,
  installNewPlantsGalleryRow,
  NEW_PLANT_VERIFY_GATES,
} from '../vegetation/library';
```

| Function | Purpose |
|----------|---------|
| `getPlant(id)` | Lookup by stable id (`rhododendron`, `mesquite`, …) |
| `plantsForBiome('swamp')` | Plants tagged for a profile |
| `galleryPlants('newPlants')` | Sorted gallery row entries |
| `scatteredPlants()` | Entries with `stage: 'scatter' \| 'both'` |
| `installNewPlantsGalleryRow(…)` | Mount `newPlants` row in gallery scene |
| `NEW_PLANT_VERIFY_GATES` | Pixel gates for Playwright verification |

## Standalone plant modules (gallery stage)

| Id | Module | Builder | Biomes | Gallery col |
|----|--------|---------|--------|-------------|
| `rhododendron` | `Rhododendron.ts` | `buildRhododendron` | alpine, swamp | 0 |
| `lupine` | `Lupine.ts` | `buildLupine` | alpine, grassland | 1 |
| `cattail` | `Cattail.ts` | `buildCattail` | swamp | 2 |
| `hosta` | `Hosta.ts` | `buildHosta` | alpine, swamp | 3 |
| `clover` | `Clover.ts` | `buildClover` | grassland, alpine | 4 |

All five are `stage: 'gallery'` with `vegClass: null` until scatter pools are assigned.

## Integration & verification

| Artifact | Path |
|----------|------|
| Gallery row | `src/debug/GalleryScene.ts` → `installNewPlantsGalleryRow` |
| Visual gate script | `tools/verify-plants-visual.ts` |
| Gate screenshot | `shots/profiles/new-plants-gate.png` |
| npm script | `npm run verify-plants` |

Gallery URL: `?scene=gallery&row=newPlants&seed=1&lite=1`

## Adding a new plant

1. Add `src/vegetation/MyPlant.ts` with `export function buildMyPlant(rng: Rng)`.
2. Register in `library/plants.ts` (or `understory.ts` / `trees.ts` as appropriate).
3. If gallery-mounted: add a `gallery` block and extend `installNewPlantsGalleryRow` in `gallery.ts`.
4. Add a `PlantVerifyGate` to `NEW_PLANT_VERIFY_GATES` (or a new gate array).
5. Run `npm run verify-plants`.

## Related docs

- [walkthrough.md](./walkthrough.md) — how the library was integrated
- [task.md](./task.md) — checklist and status
- [implementation_plan.md](./implementation_plan.md) — approved plan
