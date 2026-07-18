# Vegetation Library — Task Checklist

## Completed

- [x] Create `src/vegetation/library/` with types, registry, trees, understory, plants
- [x] Register Rhododendron, Lupine, Cattail, Hosta, Clover in `plants.ts`
- [x] Extract `installNewPlantsGalleryRow` + `NEW_PLANT_VERIFY_GATES` to `gallery.ts`
- [x] Refactor `GalleryScene.ts` to use library installer for `newPlants` row
- [x] Refactor `verify-plants-visual.ts` to import gates from library
- [x] Add `npm run verify-plants` script
- [x] Document library in `docs/vegetation/LIBRARY.md`
- [x] Add walkthrough, task, and implementation plan under `docs/vegetation/`
- [x] Create `docs/vegetation/CONTINENT_PLANTS.md` (30-plant catalog)
- [x] **Africa plants batch**: Acacia, Baobab, King Protea, Aloe, Spekboom modules + `continents.ts` + gallery row + verify gates
- [x] Create `docs/vegetation/CONTINENT_TREES.md` (30-tree catalog)
- [x] **Africa trees batch**: Umbrella Thorn, Baobab, Fever Tree, Marula, Leadwood + `continent-trees.ts` + `africaTrees` gallery row + verify gates
- [x] **Asia continent trees batch** (5 trees) — `asiaTrees` Z=220
- [x] **Europe continent trees batch** — `europeTrees` Z=250
- [x] **North America continent trees batch** — `northAmericaTrees` Z=280
- [x] **South America continent trees batch** — `southAmericaTrees` Z=310
- [x] **Oceania continent trees batch** — `oceaniaTrees` Z=340

## Pending (follow-up)

- [ ] Asia continent plants batch (5 plants)
- [ ] Europe continent plants batch
- [ ] North America continent plants batch
- [ ] South America continent plants batch
- [ ] Oceania continent plants batch

- [ ] Assign `VegClass` values for standalone plants (15+)
- [ ] Add scatter weights in `Scatter.ts` per biome
- [ ] Add hero/diet pools in `VegLibrary.ts` for new plants
- [ ] Run `npm run verify-plants` in CI / `/loop`
- [ ] Extend verify gates for jungle/swamp profile shots if needed
- [ ] Refactor ground-row lupine patches to use library catalog colors/scales

## Verification

```bash
npm run typecheck
npm run verify-plants          # newPlants row — requires dev server on :5173
npm run verify-africa-plants   # africaPlants row
npm run verify-africa-trees    # africaTrees row
npm run verify-all-continent-trees  # all 6 continent tree rows in parallel
```

Expected artifacts:
- `shots/profiles/new-plants-gate.png` — five column gates PASS
- `shots/profiles/africa-plants-gate.png` — Africa continent plant gates PASS
- `shots/profiles/africa-trees-gate.png` — Africa continent tree gates PASS
- `shots/profiles/asia-trees-gate.png` — Asia continent tree gates PASS
- `shots/profiles/europe-trees-gate.png` — Europe continent tree gates PASS
- `shots/profiles/north-america-trees-gate.png` — North America continent tree gates PASS
- `shots/profiles/south-america-trees-gate.png` — South America continent tree gates PASS
- `shots/profiles/oceania-trees-gate.png` — Oceania continent tree gates PASS
