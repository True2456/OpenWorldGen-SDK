# Continent Plants Catalog

Thirty iconic procedural plants (5 per continent, Antarctica excluded). Built in batches per `/loop` tick with UE5-quality silhouettes, layered foliage, procedural `Rng` variation, and gallery pixel-verify gates.

## Africa (batch 1 — this iteration)

| ID | Common | Scientific | Tier | Target biomes |
|----|--------|------------|------|---------------|
| `savanna-acacia` | Acacia / Umbrella Thorn | *Vachellia tortilis* | tree | grassland, desert |
| `baobab` | Baobab | *Adansonia digitata* | tree | grassland, desert |
| `king-protea` | King Protea | *Protea cynaroides* | flower | grassland |
| `aloe-vera` | Aloe | *Aloe vera* | shrub | desert |
| `spekboom` | Spekboom / Elephant Bush | *Portulacaria afra* | shrub | grassland, desert |

## Asia (batch 2)

| ID | Common | Scientific | Tier | Target biomes |
|----|--------|------------|------|---------------|
| `bamboo` | Bamboo | *Phyllostachys edulis* | grass | jungle, grassland |
| `cherry-blossom` | Cherry Blossom | *Prunus serrulata* | tree | grassland |
| `lotus` | Lotus | *Nelumbo nucifera* | flower | swamp |
| `ginkgo` | Ginkgo | *Ginkgo biloba* | tree | grassland |
| `bonsai-pine` | Japanese Black Pine | *Pinus thunbergii* | tree | alpine, grassland |

## Europe (batch 3)

| ID | Common | Scientific | Tier | Target biomes |
|----|--------|------------|------|---------------|
| `english-oak` | English Oak | *Quercus robur* | tree | grassland |
| `lavender` | Lavender | *Lavandula angustifolia* | flower | grassland, desert |
| `olive` | Olive | *Olea europaea* | tree | grassland, desert |
| `heather` | Heather | *Calluna vulgaris* | shrub | alpine, grassland |
| `edelweiss` | Edelweiss | *Leontopodium alpinum* | flower | alpine |

## North America (batch 4)

| ID | Common | Scientific | Tier | Target biomes |
|----|--------|------------|------|---------------|
| `redwood` | Coast Redwood | *Sequoia sempervirens* | tree | jungle, alpine |
| `saguaro` | Saguaro Cactus | *Carnegiea gigantea* | shrub | desert |
| `sunflower` | Sunflower | *Helianthus annuus* | flower | grassland |
| `maple` | Sugar Maple | *Acer saccharum* | tree | alpine, grassland |
| `cattail-na` | Cattail (native) | *Typha latifolia* | reed | swamp |

## South America (batch 5)

| ID | Common | Scientific | Tier | Target biomes |
|----|--------|------------|------|---------------|
| `ceiba` | Ceiba / Kapok | *Ceiba pentandra* | tree | jungle |
| `bromeliad` | Bromeliad | *Aechmea fasciata* | flower | jungle |
| `passionflower` | Passionflower | *Passiflora caerulea* | flower | jungle, grassland |
| `pampas-grass` | Pampas Grass | *Cortaderia selloana* | grass | grassland |
| `cacao` | Cacao | *Theobroma cacao* | tree | jungle |

## Oceania (batch 6)

| ID | Common | Scientific | Tier | Target biomes |
|----|--------|------------|------|---------------|
| `eucalyptus` | Eucalyptus | *Eucalyptus globulus* | tree | grassland |
| `tree-fern` | Tree Fern | *Cyathea medullaris* | fern | jungle |
| `kangaroo-paw` | Kangaroo Paw | *Anigozanthos manglesii* | flower | grassland, desert |
| `waratah` | Waratah | *Telopea speciosissima* | flower | grassland |
| `ti-tree` | Tea Tree | *Leptospermum scoparium* | shrub | grassland, swamp |

## Gallery rows

| Row key | Z offset | Verify screenshot |
|---------|----------|-------------------|
| `africaPlants` | 160 | `shots/profiles/africa-plants-gate.png` |
| `asiaPlants` | 190 | `shots/profiles/asia-plants-gate.png` |
| *(future)* | +30 per continent | |

## Build checklist

- [x] Africa — 5 modules, library, gallery, verify gates
- [ ] Asia
- [ ] Europe
- [ ] North America
- [ ] South America
- [ ] Oceania
