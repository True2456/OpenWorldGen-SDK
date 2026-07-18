# Vegetation Library — Walkthrough & Results

## Goal

Organize five new procedural plant modules plus existing trees/understory into one expandable library callable from gallery, scatter tooling, and Playwright verification.

## What was added (user modules)

| Plant | File | Role |
|-------|------|------|
| Rhododendron shrub | `src/vegetation/Rhododendron.ts` | Bark + foliage cards, pink blossoms |
| Lupine flower | `src/vegetation/Lupine.ts` | Spike wildflower geometry |
| Cattail reed | `src/vegetation/Cattail.ts` | Wetland reed + seed head |
| Hosta shade plant | `src/vegetation/Hosta.ts` | Variegated leaf clump + `hostaMaterial()` |
| Clover patch | `src/vegetation/Clover.ts` | Ground-cover flower heads |

## Library structure (result)

- **`src/vegetation/library/types.ts`** — `PlantDefinition`, tiers, stages, verify gates
- **`src/vegetation/library/trees.ts`** — 14 tree species from `TREE_SPECIES`
- **`src/vegetation/library/understory.ts`** — creosote, reeds, ferns, flowers, etc.
- **`src/vegetation/library/plants.ts`** — five standalone modules
- **`src/vegetation/library/registry.ts`** — merged `PLANT_LIBRARY` + query helpers
- **`src/vegetation/library/gallery.ts`** — shared install + pixel gates
- **`src/vegetation/library/index.ts`** — public exports

## Integration points

### Gallery (`GalleryScene.ts`)

The `newPlants` row at `ROW_Z.newPlants = 130` now calls:

```ts
installNewPlantsGalleryRow(engine, seed, barks, atlases, exhibit, ROW_Z.newPlants);
```

Pedestals: x = −40, −20, 0, 20, 40. Camera frame: `?scene=gallery&row=newPlants`.

### Verification (`tools/verify-plants-visual.ts`)

Imports `NEW_PLANT_VERIFY_GATES` from the library (single source of truth for column indices and RGB thresholds). Writes `shots/profiles/new-plants-gate.png`.

```bash
npm run verify-plants
```

### Existing vegetation

Trees and understory remain implemented in `Species.ts`, `Understory.ts`, `VegLibrary.ts`, and `Scatter.ts`. The library **catalogs** them with biome tags and `VegClass` ids; scatter wiring is unchanged.

## Results

- One import path for agents and scripts: `vegetation/library`
- Gallery and verify gates cannot drift (shared `gallery.ts`)
- New plants registered with biome hints for future scatter work
- `npm run verify-plants` added to `package.json`

## Not yet wired

- Standalone plants still `vegClass: null` — gallery-only until Scatter/VegLibrary pools are extended
- Lupine ground patches on the `ground` row still use `buildLupine` directly (separate from `newPlants` row)

## Africa continent batch (2026-07-08)

Five iconic African plants at `ROW_Z.africaPlants = 160`:

| Plant | File | Gallery scale |
|-------|------|---------------|
| Acacia | `Acacia.ts` | 0.38 (tree + foliage cards) |
| Baobab | `Baobab.ts` | 0.28 (bottle trunk + crown sprays) |
| King Protea | `Protea.ts` | 5.5 (pink bract flower) |
| Aloe | `Aloe.ts` | 4.5 (`aloeMaterial`) |
| Spekboom | `Spekboom.ts` | 6.0 (`spekboomMaterial`) |

Catalog: `docs/vegetation/CONTINENT_PLANTS.md`. Library: `library/continents.ts`.

```bash
# Gallery: http://localhost:5173/?scene=gallery&row=africaPlants&seed=1&lite=1
npm run verify-africa-plants
```

Screenshot: `shots/profiles/africa-plants-gate.png`

## Commands

```bash
npm run dev
# Gallery: http://localhost:5173/?scene=gallery&row=newPlants&seed=1&lite=1
npm run verify-plants
npm run typecheck
```
