# NSW macro-zones and biomes

NSW is modelled as **7 macro-zones** (not 50 IBRA ecoregions). Each zone patches the shared `oceania` `WorldProfile` with climate/layout overrides and maps to LAAS procedural biomes + oceania tree weights.

## Zones

| Zone ID | Region | Dominant LAAS biomes | Tree mix (euc / kauri / banksia / wollemi) |
|---------|--------|----------------------|---------------------------------------------|
| `north-coast` | Humid subtropical coast (Byron–Port Macquarie) | jungle, grassland, wetland | 0.35 / 0.25 / 0.20 / 0.20 |
| `hunter-sydney` | Sydney Basin / Hunter lowlands | grassland, jungle, meadow | 0.50 / 0.15 / 0.25 / 0.10 |
| `tablelands` | Great Dividing Range / Blue Mountains | grassland, conifer, meadow | 0.55 / 0.15 / 0.15 / 0.15 |
| `south-coast` | Illawarra / far south coast | grassland, jungle, meadow | 0.48 / 0.18 / 0.22 / 0.12 |
| `western-slopes` | Inland temperate (Dubbo belt) | grassland, meadow, desert | 0.45 / 0.10 / 0.35 / 0.10 |
| `western-plains` | Semi-arid west / Murray-Darling | desert, grassland, meadow | 0.30 / 0.05 / 0.55 / 0.10 |
| `alpine-south` | Snowy Mountains | alpine, subalpine, meadow | 0.20 / 0.15 / 0.10 / 0.55 |

Lookup: `nswZoneAt(lat, lon)` in `src/world/regions/oceania-nsw.ts`. Grid fallback: `nswZoneFromTile(col, row)`.

## Boot URLs

- `?state=nsw&world=real` — first built NSW import (Blue Mountains)
- `?import=nsw-blue-mountains` — Katoomba DEM (zone `tablelands`)
- `?tile=nsw-c09-r06&state=nsw&world=real` — procedural western slopes (no DEM yet)
- Profile key becomes `oceania:<zone>` e.g. `oceania:tablelands`

## Built imports

| Import ID | Tile | Zone |
|-----------|------|------|
| `nsw-blue-mountains` | `nsw-c11-r04` | tablelands |
| `nsw-sydney-coast` | `nsw-c13-r04` | hunter-sydney (fetch script only) |
| `nsw-dubbo-slopes` | `nsw-c09-r06` | western-slopes (fetch script only) |

## Verification

```bash
npm run verify-nsw
```

Gates under `shots/world/nsw-*.png`. See `tools/verify-nsw-visual.ts` for pixel thresholds.

## Reuse

The `RegionZoneSet` / `ZonePatch` pattern in `src/world/regions/types.ts` is intended for VIC, QLD, etc. Add `oceania-vic.ts` with the same shape and extend `resolveZone()`.
