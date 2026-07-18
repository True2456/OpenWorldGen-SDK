/**
 * Continent tree catalog — iconic trees grouped by region (gallery + scatter).
 */

import { SAVANNA_ACACIA } from '../Acacia';
import { BAOBAB_META } from '../Baobab';
import { BAMBOO_GROVE_META } from '../BambooGrove';
import { BANYAN } from '../Banyan';
import { BONSAI_PINE } from '../BonsaiPine';
import { CHERRY_BLOSSOM } from '../CherryBlossom';
import { ENGLISH_OAK } from '../EnglishOak';
import { EUROPEAN_BEECH } from '../EuropeanBeech';
import { FEVER_TREE } from '../FeverTree';
import { GINKGO } from '../Ginkgo';
import { LEADWOOD } from '../Leadwood';
import { MARULA } from '../Marula';
import { OLIVE } from '../Olive';
import { SCOTS_PINE } from '../ScotsPine';
import { SILVER_BIRCH } from '../SilverBirch';
import { ASPEN } from '../Aspen';
import { ARAUCARIA } from '../Araucaria';
import { BANKSIA } from '../Banksia';
import { BRAZIL_NUT } from '../BrazilNut';
import { DOUGLAS_FIR } from '../DouglasFir';
import { EUCALYPTUS } from '../Eucalyptus';
import { JACARANDA } from '../Jacaranda';
import { JOSHUA_TREE } from '../JoshuaTreeNA';
import { KAPOK } from '../Kapok';
import { KAURI } from '../Kauri';
import { REDWOOD } from '../Redwood';
import { RUBBER_TREE } from '../RubberTree';
import { SUGAR_MAPLE } from '../SugarMaple';
import { WOLLEMI_PINE } from '../WollemiPine';
import { TREE_FERN_META } from '../TreeFern';
import type { PlantDefinition } from './types';
import type { SpeciesParams } from '../VegTypes';

/** Species params for atlas/bark capture in gallery (excludes custom-mesh baobab). */
export const AFRICA_TREE_SPECIES: readonly SpeciesParams[] = [
  SAVANNA_ACACIA,
  FEVER_TREE,
  MARULA,
  LEADWOOD,
];

export const AFRICA_TREE_LIBRARY: readonly PlantDefinition[] = [
  {
    id: 'savanna-acacia',
    label: 'Umbrella Thorn',
    tier: 'tree',
    module: 'Acacia.ts',
    builder: 'buildSavannaAcacia',
    stage: 'gallery',
    biomes: ['grassland', 'desert'],
    vegClass: null,
    species: SAVANNA_ACACIA,
    tags: ['africa', 'savanna', 'umbrella'],
    gallery: { row: 'africaTrees', colIndex: 0, subtitle: 'Flat umbrella savanna crown', scale: 0.38 },
  },
  {
    id: 'baobab',
    label: 'Baobab',
    tier: 'tree',
    module: 'Baobab.ts',
    builder: 'buildBaobabHero',
    stage: 'gallery',
    biomes: ['grassland', 'desert'],
    vegClass: null,
    tags: ['africa', 'iconic', 'bottle-trunk'],
    gallery: { row: 'africaTrees', colIndex: 1, subtitle: 'Bottle trunk giant', scale: 0.28 },
  },
  {
    id: 'fever-tree',
    label: 'Fever Tree',
    tier: 'tree',
    module: 'FeverTree.ts',
    builder: 'buildFeverTree',
    stage: 'gallery',
    biomes: ['grassland', 'swamp'],
    vegClass: null,
    species: FEVER_TREE,
    tags: ['africa', 'yellow-bark', 'savanna'],
    gallery: { row: 'africaTrees', colIndex: 2, subtitle: 'Yellow-barked acacia', scale: 0.34 },
  },
  {
    id: 'marula',
    label: 'Marula',
    tier: 'tree',
    module: 'Marula.ts',
    builder: 'buildMarula',
    stage: 'gallery',
    biomes: ['grassland'],
    vegClass: null,
    species: MARULA,
    tags: ['africa', 'deciduous', 'fruit'],
    gallery: { row: 'africaTrees', colIndex: 3, subtitle: 'Round spreading crown', scale: 0.32 },
  },
  {
    id: 'leadwood',
    label: 'Leadwood',
    tier: 'tree',
    module: 'Leadwood.ts',
    builder: 'buildLeadwood',
    stage: 'gallery',
    biomes: ['grassland', 'desert'],
    vegClass: null,
    species: LEADWOOD,
    tags: ['africa', 'gnarled', 'dense-crown'],
    gallery: { row: 'africaTrees', colIndex: 4, subtitle: 'Gnarled dark savanna giant', scale: 0.34 },
  },
];

/** Bark layers used by Africa continent trees (for gallery pre-bake). */
export const AFRICA_TREE_BARK_LAYERS = [7, 13, 14, 15, 16] as const;

/** Species params for atlas/bark capture in gallery (excludes custom-mesh builders). */
export const ASIA_TREE_SPECIES: readonly SpeciesParams[] = [
  CHERRY_BLOSSOM,
  GINKGO,
  BONSAI_PINE,
  BANYAN,
];

export const ASIA_TREE_LIBRARY: readonly PlantDefinition[] = [
  {
    id: 'cherry-blossom',
    label: 'Cherry Blossom',
    tier: 'tree',
    module: 'CherryBlossom.ts',
    builder: 'buildCherryBlossom',
    stage: 'gallery',
    biomes: ['grassland'],
    vegClass: null,
    species: CHERRY_BLOSSOM,
    tags: ['asia', 'ornamental', 'blossom'],
    gallery: { row: 'asiaTrees', colIndex: 0, subtitle: 'Pink spring blossom crown', scale: 0.36 },
  },
  {
    id: 'ginkgo',
    label: 'Ginkgo',
    tier: 'tree',
    module: 'Ginkgo.ts',
    builder: 'buildGinkgo',
    stage: 'gallery',
    biomes: ['grassland'],
    vegClass: null,
    species: GINKGO,
    tags: ['asia', 'living-fossil', 'fan-leaf'],
    gallery: { row: 'asiaTrees', colIndex: 1, subtitle: 'Golden fan-shaped leaves', scale: 0.34 },
  },
  {
    id: 'bonsai-pine',
    label: 'Japanese Black Pine',
    tier: 'tree',
    module: 'BonsaiPine.ts',
    builder: 'buildBonsaiPine',
    stage: 'gallery',
    biomes: ['grassland', 'alpine'],
    vegClass: null,
    species: BONSAI_PINE,
    tags: ['asia', 'conifer', 'bonsai'],
    gallery: { row: 'asiaTrees', colIndex: 2, subtitle: 'Windswept branch-pad pine', scale: 0.42 },
  },
  {
    id: 'banyan',
    label: 'Banyan Fig',
    tier: 'tree',
    module: 'Banyan.ts',
    builder: 'buildBanyan',
    stage: 'gallery',
    biomes: ['jungle'],
    vegClass: null,
    species: BANYAN,
    tags: ['asia', 'strangler', 'prop-roots'],
    gallery: { row: 'asiaTrees', colIndex: 3, subtitle: 'Aerial prop-root giant', scale: 0.3 },
  },
  {
    id: 'bamboo-grove',
    label: 'Giant Bamboo',
    tier: 'tree',
    module: 'BambooGrove.ts',
    builder: 'buildBambooGrove',
    stage: 'gallery',
    biomes: ['jungle', 'grassland'],
    vegClass: null,
    tags: ['asia', 'culm', 'grove'],
    gallery: { row: 'asiaTrees', colIndex: 4, subtitle: 'Ringed culm cluster', scale: 0.32 },
  },
];

/** Bark layers used by Asia continent trees (for gallery pre-bake). */
export const ASIA_TREE_BARK_LAYERS = [17, 18, 19, 20, 21] as const;

export const EUROPE_TREE_SPECIES: readonly SpeciesParams[] = [
  ENGLISH_OAK,
  SILVER_BIRCH,
  SCOTS_PINE,
  OLIVE,
  EUROPEAN_BEECH,
];

export const EUROPE_TREE_LIBRARY: readonly PlantDefinition[] = [
  {
    id: 'english-oak',
    label: 'English Oak',
    tier: 'tree',
    module: 'EnglishOak.ts',
    builder: 'buildEnglishOak',
    stage: 'gallery',
    biomes: ['grassland'],
    vegClass: null,
    species: ENGLISH_OAK,
    tags: ['europe', 'broadleaf', 'oak'],
    gallery: { row: 'europeTrees', colIndex: 0, subtitle: 'Wide spreading rugged crown', scale: 0.32 },
  },
  {
    id: 'silver-birch',
    label: 'Silver Birch',
    tier: 'tree',
    module: 'SilverBirch.ts',
    builder: 'buildSilverBirch',
    stage: 'gallery',
    biomes: ['grassland', 'alpine'],
    vegClass: null,
    species: SILVER_BIRCH,
    tags: ['europe', 'birch', 'pendulous'],
    gallery: { row: 'europeTrees', colIndex: 1, subtitle: 'White bark delicate crown', scale: 0.36 },
  },
  {
    id: 'scots-pine',
    label: 'Scots Pine',
    tier: 'tree',
    module: 'ScotsPine.ts',
    builder: 'buildScotsPine',
    stage: 'gallery',
    biomes: ['alpine', 'grassland'],
    vegClass: null,
    species: SCOTS_PINE,
    tags: ['europe', 'conifer', 'pine'],
    gallery: { row: 'europeTrees', colIndex: 2, subtitle: 'Tall flat-topped pine', scale: 0.34 },
  },
  {
    id: 'olive',
    label: 'Olive',
    tier: 'tree',
    module: 'Olive.ts',
    builder: 'buildOlive',
    stage: 'gallery',
    biomes: ['grassland', 'desert'],
    vegClass: null,
    species: OLIVE,
    tags: ['europe', 'mediterranean', 'gnarled'],
    gallery: { row: 'europeTrees', colIndex: 3, subtitle: 'Gnarled silvery-green crown', scale: 0.4 },
  },
  {
    id: 'european-beech',
    label: 'European Beech',
    tier: 'tree',
    module: 'EuropeanBeech.ts',
    builder: 'buildEuropeanBeech',
    stage: 'gallery',
    biomes: ['grassland', 'alpine'],
    vegClass: null,
    species: EUROPEAN_BEECH,
    tags: ['europe', 'beech', 'dome-crown'],
    gallery: { row: 'europeTrees', colIndex: 4, subtitle: 'Dense smooth-bark dome', scale: 0.3 },
  },
];

export const EUROPE_TREE_BARK_LAYERS = [1, 2, 3, 22, 24] as const;

export const NORTH_AMERICA_TREE_SPECIES: readonly SpeciesParams[] = [
  SUGAR_MAPLE, DOUGLAS_FIR, JOSHUA_TREE, REDWOOD, ASPEN,
];

export const NORTH_AMERICA_TREE_LIBRARY: readonly PlantDefinition[] = [
  { id: 'sugar-maple', label: 'Sugar Maple', tier: 'tree', module: 'SugarMaple.ts', builder: 'buildSugarMaple', stage: 'gallery', biomes: ['grassland', 'alpine'], vegClass: null, species: SUGAR_MAPLE, tags: ['north-america'], gallery: { row: 'northAmericaTrees', colIndex: 0, subtitle: 'Brilliant fall dome crown', scale: 0.34 } },
  { id: 'douglas-fir', label: 'Douglas Fir', tier: 'tree', module: 'DouglasFir.ts', builder: 'buildDouglasFir', stage: 'gallery', biomes: ['alpine', 'jungle'], vegClass: null, species: DOUGLAS_FIR, tags: ['north-america', 'conifer'], gallery: { row: 'northAmericaTrees', colIndex: 1, subtitle: 'Towering soft-needle fir', scale: 0.28 } },
  { id: 'joshua-tree', label: 'Joshua Tree', tier: 'tree', module: 'JoshuaTreeNA.ts', builder: 'buildJoshuaTree', stage: 'gallery', biomes: ['desert'], vegClass: null, species: JOSHUA_TREE, tags: ['north-america', 'desert'], gallery: { row: 'northAmericaTrees', colIndex: 2, subtitle: 'Spiky desert yucca', scale: 0.4 } },
  { id: 'redwood', label: 'Coast Redwood', tier: 'tree', module: 'Redwood.ts', builder: 'buildRedwood', stage: 'gallery', biomes: ['jungle', 'alpine'], vegClass: null, species: REDWOOD, tags: ['north-america'], gallery: { row: 'northAmericaTrees', colIndex: 3, subtitle: 'Colossal columnar giant', scale: 0.22 } },
  { id: 'aspen', label: 'Quaking Aspen', tier: 'tree', module: 'Aspen.ts', builder: 'buildAspen', stage: 'gallery', biomes: ['alpine', 'grassland'], vegClass: null, species: ASPEN, tags: ['north-america'], gallery: { row: 'northAmericaTrees', colIndex: 4, subtitle: 'White bark golden leaves', scale: 0.36 } },
];
export const NORTH_AMERICA_TREE_BARK_LAYERS = [7, 25, 26, 27, 28] as const;

export const SOUTH_AMERICA_TREE_SPECIES: readonly SpeciesParams[] = [
  BRAZIL_NUT, KAPOK, JACARANDA, RUBBER_TREE, ARAUCARIA,
];
export const SOUTH_AMERICA_TREE_LIBRARY: readonly PlantDefinition[] = [
  { id: 'brazil-nut', label: 'Brazil Nut', tier: 'tree', module: 'BrazilNut.ts', builder: 'buildBrazilNut', stage: 'gallery', biomes: ['jungle'], vegClass: null, species: BRAZIL_NUT, tags: ['south-america'], gallery: { row: 'southAmericaTrees', colIndex: 0, subtitle: 'Amazon emergent umbrella', scale: 0.24 } },
  { id: 'kapok', label: 'Kapok', tier: 'tree', module: 'Kapok.ts', builder: 'buildKapok', stage: 'gallery', biomes: ['jungle'], vegClass: null, species: KAPOK, tags: ['south-america'], gallery: { row: 'southAmericaTrees', colIndex: 1, subtitle: 'Buttressed jungle giant', scale: 0.22 } },
  { id: 'jacaranda', label: 'Jacaranda', tier: 'tree', module: 'Jacaranda.ts', builder: 'buildJacaranda', stage: 'gallery', biomes: ['grassland'], vegClass: null, species: JACARANDA, tags: ['south-america'], gallery: { row: 'southAmericaTrees', colIndex: 2, subtitle: 'Violet blossom umbrella', scale: 0.34 } },
  { id: 'rubber-tree', label: 'Rubber Tree', tier: 'tree', module: 'RubberTree.ts', builder: 'buildRubberTree', stage: 'gallery', biomes: ['jungle'], vegClass: null, species: RUBBER_TREE, tags: ['south-america'], gallery: { row: 'southAmericaTrees', colIndex: 3, subtitle: 'Glossy oval jungle crown', scale: 0.32 } },
  { id: 'araucaria', label: 'Monkey Puzzle', tier: 'tree', module: 'Araucaria.ts', builder: 'buildAraucaria', stage: 'gallery', biomes: ['alpine', 'grassland'], vegClass: null, species: ARAUCARIA, tags: ['south-america', 'conifer'], gallery: { row: 'southAmericaTrees', colIndex: 4, subtitle: 'Tiered triangular conifer', scale: 0.32 } },
];
export const SOUTH_AMERICA_TREE_BARK_LAYERS = [29, 30, 31, 32, 33] as const;

export const OCEANIA_TREE_SPECIES: readonly SpeciesParams[] = [
  EUCALYPTUS, KAURI, BANKSIA, WOLLEMI_PINE,
];
export const OCEANIA_TREE_LIBRARY: readonly PlantDefinition[] = [
  { id: 'eucalyptus', label: 'Eucalyptus', tier: 'tree', module: 'Eucalyptus.ts', builder: 'buildEucalyptus', stage: 'gallery', biomes: ['grassland'], vegClass: null, species: EUCALYPTUS, tags: ['oceania'], gallery: { row: 'oceaniaTrees', colIndex: 0, subtitle: 'Peeling blue-gum trunk', scale: 0.28 } },
  { id: 'kauri', label: 'Kauri', tier: 'tree', module: 'Kauri.ts', builder: 'buildKauri', stage: 'gallery', biomes: ['jungle', 'grassland'], vegClass: null, species: KAURI, tags: ['oceania', 'conifer'], gallery: { row: 'oceaniaTrees', colIndex: 1, subtitle: 'Colossal dome conifer', scale: 0.24 } },
  { id: 'tree-fern', label: 'Tree Fern', tier: 'tree', module: 'TreeFern.ts', builder: 'buildTreeFern', stage: 'gallery', biomes: ['jungle'], vegClass: null, tags: ['oceania', 'fern'], gallery: { row: 'oceaniaTrees', colIndex: 2, subtitle: 'Giant radiating fronds', scale: 0.38 } },
  { id: 'banksia', label: 'Banksia', tier: 'tree', module: 'Banksia.ts', builder: 'buildBanksia', stage: 'gallery', biomes: ['grassland', 'desert'], vegClass: null, species: BANKSIA, tags: ['oceania'], gallery: { row: 'oceaniaTrees', colIndex: 3, subtitle: 'Coastal cone spikes', scale: 0.42 } },
  { id: 'wollemi-pine', label: 'Wollemi Pine', tier: 'tree', module: 'WollemiPine.ts', builder: 'buildWollemiPine', stage: 'gallery', biomes: ['alpine', 'jungle'], vegClass: null, species: WOLLEMI_PINE, tags: ['oceania', 'conifer'], gallery: { row: 'oceaniaTrees', colIndex: 4, subtitle: 'Prehistoric flat sprays', scale: 0.32 } },
];
export const OCEANIA_TREE_BARK_LAYERS = [34, 35, 36, 37, 38] as const;

export const CONTINENT_TREE_ROW_SPECIES: Record<string, readonly SpeciesParams[]> = {
  africaTrees: AFRICA_TREE_SPECIES,
  asiaTrees: ASIA_TREE_SPECIES,
  europeTrees: EUROPE_TREE_SPECIES,
  northAmericaTrees: NORTH_AMERICA_TREE_SPECIES,
  southAmericaTrees: SOUTH_AMERICA_TREE_SPECIES,
  oceaniaTrees: OCEANIA_TREE_SPECIES,
};

export const CONTINENT_TREE_ROW_BARK: Record<string, readonly number[]> = {
  africaTrees: AFRICA_TREE_BARK_LAYERS,
  asiaTrees: ASIA_TREE_BARK_LAYERS,
  europeTrees: EUROPE_TREE_BARK_LAYERS,
  northAmericaTrees: NORTH_AMERICA_TREE_BARK_LAYERS,
  southAmericaTrees: SOUTH_AMERICA_TREE_BARK_LAYERS,
  oceaniaTrees: OCEANIA_TREE_BARK_LAYERS,
};

export { BAOBAB_META, BAMBOO_GROVE_META, TREE_FERN_META };
