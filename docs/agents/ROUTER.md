# Agent router

Pick **one zone** per task. Never load the full `src/` tree.

| Task mentions | Read first | Edit only |
|---------------|------------|-----------|
| biome, desert, jungle, swamp | [BIOMES.md](./BIOMES.md) | `src/world/profiles/*.ts`, `src/gpu/passes/BiomeSnow.ts` |
| terrain height, erosion, rivers | [TERRAIN.md](./TERRAIN.md) | `src/world/MacroMap.ts`, `src/gpu/passes/HeightSynthesis.ts`, `Erosion.ts`, `FlowRivers.ts` |
| trees, grass, scatter | [VEGETATION.md](./VEGETATION.md) | `src/vegetation/*`, `src/gpu/passes/Scatter.ts` |
| sky, weather, time | [ATMOSPHERE.md](./ATMOSPHERE.md) | `src/atmosphere/*`, `src/sky/*`, `src/render/Wind.ts` |
| materials, terrain color | `src/render/TerrainMaterial.ts` | same file only |
| verify visual change | run `npm run shoot-profiles` | `tools/shoot.ts` |

After edits: `npm run typecheck` then screenshot the affected profile.
