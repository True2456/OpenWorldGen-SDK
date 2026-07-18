# LaasGenerator Deviations

## Multi-biome world profiles (2026-07-08)

**Spec:** Single art-directed alpine valley layout (PROJECT_LAAS_v2.md).

**Change:** Added `?profile=` presets (`alpine`, `desert`, `jungle`, `swamp`, `grassland`) that adjust macro layout scales, climate classification, terrain palettes, and scatter density tables.

**Reason:** User goal to generate distinct biomes beyond the upstream alpine-centric world while keeping procedural-only assets.

## Extended biome enum (2026-07-08)

**Spec:** ≥5 biomes including alpine + snow.

**Change:** Expanded to 10 biome IDs; `biomeTex.r` encoding changed from `id/8` to `id/16`.

**Reason:** Distinct desert, jungle, swamp, and grassland classification for scatter and materials.

## Weather URL preset (2026-07-08)

**Spec:** Tier-3 rain fronts after verification battery.

**Change:** Boot-time `?weather=clear|rain|snow|fog|dust` scales clouds, fog, and wind.

**Reason:** Incremental weather hooks for biome showcase; full precipitation response deferred.
