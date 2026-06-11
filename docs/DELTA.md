# DELTA log — reference-gap tracking (newest phase first)

## Phase 2 close (2026-06-11) — light/atmosphere/clouds/post vs Witcher golden frame

Shots: `shots/wip/gateA4.png` (golden vista), `gate-cmp3.png` (side-by-side),
`cloudart-1-noon.png` (cloud sea wrapping peaks), `contact-on.png` (low-sun
ground level). Reference: `02_Silver_Demo_Wallpaper_3840x2160_EN.png`.

Top-10 deltas (ranked; ~~struck~~ = fixed this phase):
1. Dark conifer slopes dominate the reference's midground value structure —
   our world has zero vegetation. **[Phase 4/5 structural — the single
   biggest remaining gap]**
2. ~~Whole frame washy mid-gray~~ → FIXED: auto-exposure key 0.16→0.125
   (exposure was silently normalizing away every albedo change), golden grade
   split strengthened (cool shadows 0.72/0.91/1.2 @0.58, warm highlights
   1.22/1.03/0.8 @0.5, contrast 1.09).
3. ~~Alpine rock pale cream~~ → FIXED: dark gray-blue base + rust strata
   palette. (Note: albedo changes barely move the final frame until the
   exposure key change — see 2.)
4. Reference sky has bright golden cumulus ABOVE the peaks in addition to
   the valley cloud sea — needs the second (high) cloud layer. **[Phase 6
   weather; spec floor "2-layer" tracked there]**
5. ~~Strata bands read as layer-cake on long smooth walls~~ → FIXED: contrast
   compressed 0.55→0.36 + fine phase jitter octave fragments the bands.
6. ~~Snow indistinct against pale rock~~ → FIXED mostly by (3): white snow on
   dark rock; snowline blend widened. Parallel couloir streaks match the
   reference's own avalanche couloirs.
7. Peaks could be spikier/more serrated at the gate framing — composition
   constraint; the NE massif has sharper crests (gateC). Revisit framing for
   the final two-frame test with foreground anchor (ref uses dark outcrop).
8. Valley depth haze slightly weaker than ref's vast blue recession —
   acceptable now; re-judge with forest cover absorbing light. **[Phase 4+]**
9. Darkest 10% of shadow pixels desaturate toward the AgX toe (measured:
   mean shadow chroma 18.3/255 = PASS no-gray law; crevices ~2–4/255).
   Probe-GI bounce will lift them. **[Phase 3]**
10. God rays absent (ref has subtle beams from upper-left). **[Phase 6
    froxel volumetrics]**

Gate verdicts: golden vista vs ref — value structure, warm/cool split, cloud
sea below summits, aerial recession all PRESENT; overall reads ~70% of the
way to the reference *for a world with no vegetation yet*. Shadow-color test
PASS (16-px sample: chromatic shadows, warm earth bounce + cool rock fill).
Cloud-sea composition verified from above the layer (noon + golden shots).

Extra fixes found during gate work (all verified by ablation A/B):
- GTAO printed black facets on steep ridges (material normals disagree with
  depth — its cones bent into the surface) → depth-derived normals + distance
  fade beyond 700–1800 m.
- Far shell sampled biome/fields/normal textures OUTSIDE their domain →
  clamped edge texels smeared radially as pale streaks → procedural
  fallbacks (snow by elevation, veg by slope/height) cross-faded at the edge.
- Weak-flow gravel rills striped meadow hillsides → gravel gated to strong
  flow on open ground.
- Snow dither sprinkled white pixels on bare rock → dither gated to the
  snowline band.
- Far-detail crag synthesis corrugated smooth vegetated hills → slope-gated.

## Phase 1 close (2026-06-11) — terrain vs refs (geometry/classification scope)

Shots: `shots/phase-1/vista-massif.png`, `erosion-split.png`, `top-down.png`
References: Witcher alpine (lighting/snow/peaks), scene1/3 (karst).

Top-10 deltas (ranked by visual impact):
1. Lighting is flat — no shadows, no GI, white ambient. **[Phase 2/3 structural]**
2. No atmosphere: sky is a debug gradient, zero aerial perspective/haze layering,
   no clouds. **[Phase 2 structural]**
3. ~~Massif faces monotone beige~~ → FIXED: iron-oxide elevation bands, lichen
   splotches, strata contrast retune.
4. ~~Snow too sparse/gray on the massif~~ → FIXED: landform-scale slope hold
   (16/28 m support), couloir accumulation term, perceptual pow boost, brighter
   palette. South hero face still bare-ish — re-judge at Phase 2 golden vista
   (N/NE aspects + low sun are the reference's snowy condition).
5. Zero vegetation/debris — lowlands read as green felt. **[Phase 4/5 structural]**
6. ~~Karst tower walls repeat a uniform scallop~~ → FIXED: two-scale worley mix
   + wall-line wobble noise.
7. River trench shoulders hard-edged; no gravel bars/banks. **[Phase 5/6]**
8. Far shell uniform pale; needs haze + palette work. **[Phase 2]**
9. Ground-level (<10 m) is texture-smooth — needs debris/cobble/grass geometry
   per Pillar A. **[Phase 4/5 structural]**
10. Lowland hills silhouette slightly felt-like at mid distance; revisit with
    vegetation cover + Phase 5 far-detail pass.

Verdicts: silhouette test PASS (serrated massif, craggy karst, no smooth
low-poly outlines in hero shots). Tiling test PASS (multi-scale procedural
breakup, no visible repetition at mid-range). Erosion split view PASS.
Self-score (terrain geology row): 6/10 — same class as refs at vista range,
betrayed up close (by design until Phases 4/5).
