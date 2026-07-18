# Biome editing guide

## Contract

Types live in [`src/contracts/biome.ts`](../../src/contracts/biome.ts).

## Profile presets

Each file under [`src/world/profiles/`](../../src/world/profiles/) defines:

- `climate` — offsets passed to `BiomeSnow.ts` GPU classifier
- `layout` — scales alpine/karst/lake radii and ridge/hill amplitude in `MacroMap.ts`

URL: `?profile=desert&seed=42`

## Biome IDs

See `Biome` enum in [`src/world/WorldConst.ts`](../../src/world/WorldConst.ts).

Classification kernel: [`src/gpu/passes/BiomeSnow.ts`](../../src/gpu/passes/BiomeSnow.ts).

Scatter density tables: [`src/gpu/passes/Scatter.ts`](../../src/gpu/passes/Scatter.ts) — each `byBiome()` array has **10** entries (one per biome id).

Terrain palettes: [`src/render/TerrainMaterial.ts`](../../src/render/TerrainMaterial.ts) — `bandAt(id)` weights.

## Verification

```bash
npm run shoot -- --scene world --preset low --seed 1 --profile desert --out shots/desert.png
npm run verify-biome   # pixel gate: desert grassPx < 1.2%, grassland > 0
```

Desert uses `groundGrassScale: 0` in the profile — no blade ring. `GroundRing` also uses `BIOME_TEX_SCALE` (16) when decoding biome ids.

Compare against alpine baseline with the same seed.
