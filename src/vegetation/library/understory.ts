/**
 * Understory + scatter-ground plants wired through Scatter.ts / VegLibrary.
 */

import { VegClass } from '../../gpu/passes/Scatter';
import { UNDERSTORY_SPECIES } from '../Understory';
import type { BiomeProfile, PlantDefinition } from './types';

const UNDERSTORY_META: Record<
  string,
  { tier: PlantDefinition['tier']; biomes: readonly BiomeProfile[]; vegClass: VegClass; builder: string }
> = {
  bushHazel: { tier: 'shrub', biomes: ['alpine'], vegClass: VegClass.BushHazel, builder: 'buildShrub' },
  bushPink: { tier: 'shrub', biomes: ['alpine', 'grassland'], vegClass: VegClass.BushPink, builder: 'buildShrub' },
  juniper: { tier: 'shrub', biomes: ['alpine', 'desert'], vegClass: VegClass.Juniper, builder: 'buildShrub' },
  creosote: { tier: 'shrub', biomes: ['desert'], vegClass: VegClass.Creosote, builder: 'buildShrub' },
};

const GROUND_BUILDERS: PlantDefinition[] = [
  {
    id: 'fern',
    label: 'Forest fern',
    tier: 'fern',
    module: 'Understory.ts',
    builder: 'buildFern',
    stage: 'scatter',
    biomes: ['alpine', 'jungle'],
    vegClass: VegClass.Fern,
  },
  {
    id: 'jungleFern',
    label: 'Jungle fern',
    tier: 'fern',
    module: 'Understory.ts',
    builder: 'buildJungleFern',
    stage: 'scatter',
    biomes: ['jungle'],
    vegClass: VegClass.JungleFern,
  },
  {
    id: 'dryGrassTuft',
    label: 'Dry grass tuft',
    tier: 'grass',
    module: 'Understory.ts',
    builder: 'buildDryGrassTuft',
    stage: 'scatter',
    biomes: ['desert', 'grassland'],
    vegClass: VegClass.DryGrassTuft,
  },
  {
    id: 'swampReed',
    label: 'Swamp reed',
    tier: 'reed',
    module: 'Understory.ts',
    builder: 'buildSwampReed',
    stage: 'scatter',
    biomes: ['swamp'],
    vegClass: VegClass.SwampReed,
  },
  {
    id: 'flowerUmbel',
    label: 'Umbel wildflower',
    tier: 'flower',
    module: 'Understory.ts',
    builder: 'buildFlower',
    stage: 'scatter',
    biomes: ['grassland', 'alpine'],
    vegClass: VegClass.FlowerUmbel,
  },
  {
    id: 'flowerBell',
    label: 'Bell wildflower',
    tier: 'flower',
    module: 'Understory.ts',
    builder: 'buildFlower',
    stage: 'scatter',
    biomes: ['grassland', 'swamp'],
    vegClass: VegClass.FlowerBell,
  },
  {
    id: 'flowerDaisy',
    label: 'Daisy wildflower',
    tier: 'flower',
    module: 'Understory.ts',
    builder: 'buildFlower',
    stage: 'scatter',
    biomes: ['grassland'],
    vegClass: VegClass.FlowerDaisy,
  },
];

export const UNDERSTORY_LIBRARY: readonly PlantDefinition[] = [
  ...UNDERSTORY_SPECIES.map((sp) => {
    const meta = UNDERSTORY_META[sp.id] ?? {
      tier: 'shrub' as const,
      biomes: ['all'] as const,
      vegClass: VegClass.BushHazel,
      builder: 'buildShrub',
    };
    return {
      id: sp.id,
      label: sp.label,
      tier: meta.tier,
      module: 'Understory.ts',
      builder: meta.builder,
      stage: 'scatter' as const,
      biomes: meta.biomes,
      vegClass: meta.vegClass,
      species: sp,
    };
  }),
  ...GROUND_BUILDERS,
];
