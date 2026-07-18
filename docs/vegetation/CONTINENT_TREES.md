# Continent Trees Catalog

Thirty iconic procedural **trees** (5 per continent, Antarctica excluded). Built in batches per continent with UE5-quality silhouettes, layered branching, bark variation, foliage cards/mesh, procedural `Rng` variation, and gallery pixel-verify gates.

**Status: 6/6 continents verified** (all gallery rows pass pixel gates).

## Africa

| ID | Common | Module | Status |
|----|--------|--------|--------|
| `savanna-acacia` | Umbrella Thorn Acacia | `Acacia.ts` | **done** |
| `baobab` | African Baobab | `Baobab.ts` | **done** |
| `fever-tree` | Fever Tree | `FeverTree.ts` | **done** |
| `marula` | Marula | `Marula.ts` | **done** |
| `leadwood` | Leadwood | `Leadwood.ts` | **done** |

## Asia

| ID | Common | Module | Status |
|----|--------|--------|--------|
| `cherry-blossom` | Cherry Blossom | `CherryBlossom.ts` | **done** |
| `ginkgo` | Ginkgo | `Ginkgo.ts` | **done** |
| `bonsai-pine` | Japanese Black Pine | `BonsaiPine.ts` | **done** |
| `banyan` | Banyan Fig | `Banyan.ts` | **done** |
| `bamboo-grove` | Giant Bamboo | `BambooGrove.ts` | **done** |

## Europe

| ID | Common | Module | Status |
|----|--------|--------|--------|
| `english-oak` | English Oak | `EnglishOak.ts` | **done** |
| `silver-birch` | Silver Birch | `SilverBirch.ts` | **done** |
| `scots-pine` | Scots Pine | `ScotsPine.ts` | **done** |
| `olive` | Olive | `Olive.ts` | **done** |
| `european-beech` | European Beech | `EuropeanBeech.ts` | **done** |

## North America

| ID | Common | Module | Status |
|----|--------|--------|--------|
| `sugar-maple` | Sugar Maple | `SugarMaple.ts` | **done** |
| `douglas-fir` | Douglas Fir | `DouglasFir.ts` | **done** |
| `joshua-tree` | Joshua Tree | `JoshuaTreeNA.ts` | **done** |
| `redwood` | Coast Redwood | `Redwood.ts` | **done** |
| `aspen` | Quaking Aspen | `Aspen.ts` | **done** |

## South America

| ID | Common | Module | Status |
|----|--------|--------|--------|
| `brazil-nut` | Brazil Nut | `BrazilNut.ts` | **done** |
| `kapok` | Kapok | `Kapok.ts` | **done** |
| `jacaranda` | Jacaranda | `Jacaranda.ts` | **done** |
| `rubber-tree` | Rubber Tree | `RubberTree.ts` | **done** |
| `araucaria` | Monkey Puzzle | `Araucaria.ts` | **done** |

## Oceania

| ID | Common | Module | Status |
|----|--------|--------|--------|
| `eucalyptus` | Tasmanian Blue Gum | `Eucalyptus.ts` | **done** |
| `kauri` | Kauri | `Kauri.ts` | **done** |
| `tree-fern` | Tree Fern | `TreeFern.ts` | **done** |
| `banksia` | Banksia | `Banksia.ts` | **done** |
| `wollemi-pine` | Wollemi Pine | `WollemiPine.ts` | **done** |

## Gallery rows

| Row key | Z offset | Verify screenshot |
|---------|----------|-------------------|
| `africaTrees` | 190 | `shots/profiles/africa-trees-gate.png` |
| `asiaTrees` | 220 | `shots/profiles/asia-trees-gate.png` |
| `europeTrees` | 250 | `shots/profiles/europe-trees-gate.png` |
| `northAmericaTrees` | 280 | `shots/profiles/north-america-trees-gate.png` |
| `southAmericaTrees` | 310 | `shots/profiles/south-america-trees-gate.png` |
| `oceaniaTrees` | 340 | `shots/profiles/oceania-trees-gate.png` |

## Build checklist

- [x] Africa — 5 tree modules, `continent-trees.ts`, gallery, verify gates
- [x] Asia — 5 tree modules, gallery `asiaTrees` Z=220, verify gates
- [x] Europe — 5 tree modules, gallery `europeTrees` Z=250, verify gates
- [x] North America — 5 tree modules, gallery `northAmericaTrees` Z=280, verify gates
- [x] South America — 5 tree modules, gallery `southAmericaTrees` Z=310, verify gates
- [x] Oceania — 5 tree modules, gallery `oceaniaTrees` Z=340, verify gates

## Verification

Requires dev server on `:5173`. Use `?lite=1&row={continentTrees}` for fast focused loads.

```bash
npm run verify-africa-trees
npm run verify-asia-trees
npm run verify-europe-trees
npm run verify-north-america-trees
npm run verify-south-america-trees
npm run verify-oceania-trees
npm run verify-all-continent-trees   # all 6 in parallel
```
