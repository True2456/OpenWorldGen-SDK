# Vegetation Library — Approved Implementation Plan

## Problem

New procedural plants (Rhododendron, Lupine, Cattail, Hosta, Clover) were added with gallery placement and Playwright gates duplicated across `GalleryScene.ts` and `verify-plants-visual.ts`. Existing trees and understory lived in separate modules without a unified catalog.

## Approach

Introduce `src/vegetation/library/` as the **single registry** for all plant definitions. Keep builders in their existing files; the library holds metadata and shared integration code only.

## Phases

### Phase 1 — Catalog (done)

- Define `PlantDefinition` with id, tier, module, builder, biomes, stage, vegClass, optional gallery slot
- Mirror trees → `trees.ts`, understory → `understory.ts`
- Register standalone modules → `plants.ts`
- Expose `PLANT_LIBRARY`, `getPlant`, `plantsForBiome`, `galleryPlants`, `scatteredPlants`

### Phase 2 — Gallery + verify dedupe (done)

- Move `newPlants` row install logic to `gallery.ts`
- Move pixel gates to `NEW_PLANT_VERIFY_GATES` in same file
- Thin `GalleryScene.ts` to one `installNewPlantsGalleryRow` call
- Point `verify-plants-visual.ts` at library gates
- Add `npm run verify-plants`

### Phase 3 — World scatter (future)

- Allocate `VegClass` ids 25+ for standalone plants
- Add biome weights in `Scatter.ts`
- Register pools/materials in `VegLibrary.ts`
- Promote plant `stage` from `gallery` → `both`

### Phase 4 — Docs & agent routing (done)

- `docs/vegetation/LIBRARY.md` — API reference
- `docs/vegetation/walkthrough.md` — integration narrative
- `docs/vegetation/task.md` — checklist
- This file — plan record

## Design constraints

- **Minimal diff** on scatter/GPU paths until scatter phase
- **No behavior change** to gallery layout or gate thresholds
- **Expandable**: new plant = one module file + one `PlantDefinition` entry + optional gallery switch case

## Success criteria

1. `import { getPlant, installNewPlantsGalleryRow } from '…/library'` works
2. `npm run typecheck` passes
3. `npm run verify-plants` passes with existing gate screenshot semantics
4. Agents have one doc entry point: `docs/vegetation/LIBRARY.md`
