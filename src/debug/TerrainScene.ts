/**
 * ?scene=terrain — terrain inspection scene (also currently ?scene=world).
 * Real CDLOD tiles + far shell + PBR terrain material, temporary sun/sky
 * lighting (replaced by the Phase-2 atmosphere stack).
 *
 * Views: ?view=hydro paints hydrology diagnostics on a preview grid.
 * ?alt=N puts the camera N meters above ground (ground-clamped spawn).
 */

import { BOOKMARKS, bookmarkPoseY, installBookmarks, profileSpawnBookmark } from './Bookmarks';
import { Froxels } from '../gpu/passes/Froxels';
import { PARTICLE_COUNT, Particles } from '../gpu/passes/Particles';
import { ProbeGI } from '../gpu/passes/ProbeGI';
import { buildCanopyMap, runScatter } from '../gpu/passes/Scatter';
import { addScatterDebug } from './ScatterDebug';
import { initVegPerf, getVegPerf } from '../vegetation/VegPerf';
import { Forests } from '../vegetation/Forests';
import { GroundRing } from '../vegetation/GroundRing';
import { buildVegLibrary } from '../vegetation/VegLibrary';
import { CausticsBake, setCausticContext } from '../render/Caustics';
import { setWindContext, windU } from '../render/Wind';
import { sunU, updateSunUniforms } from '../render/VegMaterials';
import { buildCanopyShell } from '../world/CanopyShell';
import { Heightfield } from '../world/Heightfield';
import { buildTerrainShadowProxy } from '../world/ShadowProxy';
import { TerrainTiles } from '../world/TerrainTiles';
import { WaterSurface } from '../world/WaterSurface';
import { PostStack } from '../render/PostStack';
import { setupSunShadows } from '../render/ShadowSetup';
import { Clouds } from '../sky/Clouds';
import { SunSky } from '../sky/SunSky';
import { WeatherController, parseWeatherPreset } from '../atmosphere/WeatherController';
import {
  CLIMATE_TICK_S,
  ClimateClock,
  climateU,
  parseClimateBoot,
  seasonLabel,
  setClimateContext,
} from '../atmosphere/ClimateClock';
import { installHerdOnTerrain } from '../animals/AnimalHerd';
import { regionIdFromBoot } from '../vegetation/RegionVeg';
import { worldToWgs84 } from '../world/geo/Geo';
import { resolveWorldBoot } from '../world/WorldModel';
import { streamEnabled, TileStreamer } from '../world/stream/TileStreamer';
import { infiniteEnabled, InfiniteWorld } from '../world/stream/InfiniteWorld';
import { worldToChunk } from '../world/stream/ChunkCoords';
import type { ScatterResult } from '../gpu/passes/Scatter';
import type { WorldContext } from './Scenes';

export async function buildTerrainScene(ctx: WorldContext): Promise<void> {
  const { engine, params, seed } = ctx;

  const worldBoot = resolveWorldBoot(params);
  const bootParams = {
    ...params,
    importId: worldBoot.importId ?? params.importId,
    profile: worldBoot.importId ? worldBoot.profile : params.profile,
    world: worldBoot.mode,
  };

  const ablate = new Set(
    (new URLSearchParams(window.location.search).get('ablate') ?? '').split(','),
  );
  const climateOn = !ablate.has('climate');
  initVegPerf(params.preset);
  engine.stats.counters['veg.perf'] =
    params.preset === 'ultra' ? 2 : params.preset === 'low' ? 0 : 1;

  const useInfinite = infiniteEnabled();
  const useStream = !useInfinite && streamEnabled(bootParams, worldBoot);
  const streamVegScale = useStream ? 0.52 : 1;
  let streamer: TileStreamer | null = null;
  let infinite: InfiniteWorld | null = null;

  let hf: Heightfield;
  if (useInfinite) {
    infinite = await InfiniteWorld.boot(
      engine.renderer,
      bootParams,
      seed,
      (p, m) => ctx.progress(p * 0.55, m),
      engine.scene,
      { profile: bootParams.profile, regionId: null, debugView: null },
    );
    hf = infinite.centerHf;
  } else if (useStream) {
    const tile = worldBoot.tile;
    const anchorCol = tile?.col ?? 11;
    const anchorRow = tile?.row ?? 4;
    const stateId = worldBoot.stateId ?? 'nsw';
    const centerImport = TileStreamer.importForOffset(anchorCol, anchorRow, stateId, 0, 0);
    hf = await Heightfield.generateChunk(
      engine.renderer,
      bootParams,
      seed,
      (p, m) => ctx.progress(p * 0.5, m),
      {
        cx: 0,
        cy: 0,
        mode: 'full',
        importId: centerImport ?? worldBoot.importId,
        profile: bootParams.profile,
      },
    );
  } else {
    hf = await Heightfield.generate(
      engine.renderer,
      bootParams,
      seed,
      (p, m) => ctx.progress(p * 0.92, m),
    );
  }
  (engine as unknown as { heightfield?: Heightfield }).heightfield = hf;

  if (hf.cpuHeights) {
    let maxH = -Infinity;
    for (let i = 0; i < hf.cpuHeights.length; i += 7) {
      const v = hf.cpuHeights[i] as number;
      if (v > maxH) maxH = v;
    }
    engine.stats.counters['terrain.maxH'] = Math.round(maxH);
  }

  engine.stats.counters['world.mode'] = worldBoot.mode === 'real' ? 1 : 0;
  if (useInfinite) engine.stats.counters['infinite.on'] = 1;
  if (useStream) engine.stats.counters['stream.on'] = 1;
  if (worldBoot.stateId) engine.stats.counters['world.state'] = worldBoot.stateId.length;
  if (worldBoot.tile) engine.stats.counters['world.tileCol'] = worldBoot.tile.col;
  if (worldBoot.zoneId) engine.stats.counters['world.zoneLen'] = worldBoot.zoneId.length;
  if (worldBoot.wgs84) {
    engine.stats.counters['geo.lat'] = Math.round(worldBoot.wgs84.lat * 1e4);
    engine.stats.counters['geo.lon'] = Math.round(worldBoot.wgs84.lon * 1e4);
  }

  // physical sky first: probe gathering needs the atmosphere LUTs.
  const effectiveProfile =
    worldBoot.mode === 'real' ? worldBoot.profile : (hf.importManifest?.baseProfile ?? bootParams.profile);
  const regionId = regionIdFromBoot(
    hf.importManifest?.geo?.regionId,
    worldBoot.region,
    effectiveProfile,
  );
  // ?shot=N boots straight into a composed bookmark; non-alpine profiles get a
  // composed default spawn when no explicit pose (?alt/?cam/?shot)
  const bootBm =
    params.shot !== null
      ? BOOKMARKS[params.shot - 1]
      : profileSpawnBookmark(effectiveProfile);
  const bootTod =
    hf.importManifest?.camera?.tod ?? bootBm?.tod ?? params.timeOfDay;
  ctx.progress(0.93, 'sky: baking atmosphere LUTs');
  const sunSky = new SunSky(engine, bootTod);
  await sunSky.init(engine.renderer);
  (engine as unknown as { sunSky?: SunSky }).sunSky = sunSky;

  if (climateOn) setClimateContext(true);
  const climate = new ClimateClock(parseClimateBoot());
  if (climateOn) {
    climate.installKeys();
    let climateAcc = 0;
    engine.onUpdate((dt, wt) => {
      climateAcc += dt;
      if (climateAcc < CLIMATE_TICK_S) return;
      climateAcc = 0;
      climate.tick(wt);
      engine.stats.counters['climate.day'] = Math.round(climateU.dayOfYear.value);
      engine.stats.counters['climate.cold'] = Math.round(climateU.coldK.value * 100);
    });
  }
  // tooling probe handle (tools/probe-state.ts) — light/scene state triage
  (window as unknown as { __laasDbg?: unknown }).__laasDbg = { engine, sunSky };

  // vegetation/rock placement (Phase 5) — skipped in infinite mode (per-chunk veg)
  let scatter: ScatterResult | null = null;
  let canopyTex: import('three/webgpu').StorageTexture | null = null;
  let gi: ProbeGI | null = null;

  if (!useInfinite) {
    ctx.progress(0.94, 'vegetation: scattering instances');
    scatter = await runScatter(engine.renderer, hf, seed, effectiveProfile, regionId, {
      densityScale: getVegPerf().scatterDensity * streamVegScale,
    });
    canopyTex = await buildCanopyMap(engine.renderer, scatter.trees, {
      x: hf.worldOffsetX,
      z: hf.worldOffsetZ,
    });
    engine.stats.counters['veg.trees'] = scatter.trees.count;
    engine.stats.counters['veg.under'] = scatter.understory.count;
    engine.stats.counters['veg.extras'] = scatter.extras.count;
    engine.stats.counters['veg.stones'] = scatter.stones.count;

    ctx.progress(0.95, 'gi: gathering irradiance probes');
    gi = new ProbeGI(
      hf,
      sunSky.atmosphere,
      ablate.has('canopygi') ? null : canopyTex,
    );
    await gi.init(engine.renderer);
    sunSky.dimAmbientForGI();
    engine.onUpdate(() => gi!.tick(engine.renderer));
  }

  // Phase 6 caustics: per-frame analytic bake + module context — MUST be
  // set before any material factory runs (terrain tiles, rocks, debris all
  // self-apply at build time). ?ablate=caustics to A/B, ?caustk=N to tune.
  if (!ablate.has('caustics')) {
    const bake = new CausticsBake();
    const ck = Number(new URLSearchParams(window.location.search).get('caustk') ?? NaN);
    if (Number.isFinite(ck)) bake.focusK.value = ck;
    setCausticContext({ hf, bake, sunDir: sunU.dir });
    engine.onUpdate(() => bake.update(engine.renderer));
  }

  // Phase 6 wind: global gust field for all vegetation (?wind=N strength,
  // ?winddir=deg, ?ablate=wind to A/B) — context before veg materials build
  if (!ablate.has('wind') && hf.noiseA) {
    setWindContext({ noiseA: hf.noiseA, canopyTex });
    const q0 = new URLSearchParams(window.location.search);
    const ws = Number(q0.get('wind') ?? NaN);
    if (Number.isFinite(ws)) windU.strength.value = ws;
    const wdeg = Number(q0.get('winddir') ?? NaN);
    if (Number.isFinite(wdeg)) {
      windU.dir.value.set(Math.cos((wdeg * Math.PI) / 180), Math.sin((wdeg * Math.PI) / 180));
    }
  }

  ctx.progress(0.958, 'terrain: building tiles');
  const view = new URLSearchParams(window.location.search).get('view');
  if (view === 'scatter' && scatter) addScatterDebug(engine.scene, scatter);

  // Phase 5: build veg library before streamer so ring chunks can plant trees
  let forestsRef: Forests | null = null;
  let vegLib: Awaited<ReturnType<typeof buildVegLibrary>> | null = null;
  let grassRing: GroundRing | null = null;
  if (view !== 'scatter' && !ablate.has('veg')) {
    vegLib = await buildVegLibrary(
      engine.renderer,
      seed,
      (p, m) => ctx.progress(0.96 + p * 0.004, m),
      regionId,
      worldBoot.zoneId,
      worldBoot.stateId,
    );
    if (!useInfinite && scatter) {
      forestsRef = new Forests(
        hf,
        scatter,
        vegLib,
        ablate.has('gi') ? null : gi,
        canopyTex,
      );
      forestsRef.init(engine.renderer);
      updateSunUniforms(sunSky.sun);
    }
  }

  if (view === 'split' && hf.preErosion) {
    // erosion before/after: pre-erosion clay on the left, eroded on the right
    const pre = new TerrainTiles(hf, null, {
      heightBuf: hf.preErosion,
      neutral: true,
      screenHalf: 'left',
    });
    const post = new TerrainTiles(hf, null, { neutral: true, screenHalf: 'right' });
    engine.scene.add(pre.mesh, post.mesh);
    engine.onUpdate(() => {
      pre.update(engine.camera);
      post.update(engine.camera);
    });
  } else if (useInfinite && infinite) {
    if (vegLib) {
      ctx.progress(0.96, 'infinite: planting camera-chunk forest');
      await infinite.attachVegLibrary(vegLib, engine.camera);
      const vegIdx = infinite.vegChunkIndex();
      const vegChunk = infinite.getChunk(vegIdx.cx, vegIdx.cy);
      if (vegChunk?.forests) {
        vegChunk.primeCull(engine.renderer, engine.camera);
        Object.assign(engine.stats.counters, vegChunk.forests.counterSnapshot());
      }
      hf = infinite.centerHf;
      (engine as unknown as { heightfield?: Heightfield }).heightfield = hf;
    }
    if (!ablate.has('proxy')) engine.scene.add(buildTerrainShadowProxy(hf));
    engine.onUpdate(() => {
      infinite!.update(engine.camera);
      const n = infinite!.residentCount();
      const veg = infinite!.vegChunkIndex();
      engine.stats.counters['terrain.tiles'] = n;
      engine.stats.counters['infinite.chunks'] = n;
      engine.stats.counters['infinite.vegCx'] = veg.cx;
      engine.stats.counters['infinite.vegCy'] = veg.cy;
      engine.stats.counters['infinite.vegR'] = infinite!.vegBubbleRadiusM();
      engine.stats.counters['infinite.busy'] = infinite!.isBusy() ? 1 : 0;
      const vegChunk = infinite!.getChunk(veg.cx, veg.cy);
      engine.stats.counters['veg.trees'] = vegChunk?.scatter?.trees.count ?? 0;
      if (vegChunk?.forests) {
        Object.assign(engine.stats.counters, vegChunk.forests.counterSnapshot());
      }
    });
  } else if (useStream) {
    streamer = await TileStreamer.boot(
      engine.renderer,
      bootParams,
      seed,
      worldBoot,
      (p, m) => ctx.progress(0.965 + p * 0.01, m),
      engine.scene,
      {
        centerHf: hf,
        gi,
        canopyTex,
        debugView: view,
        centerForests: forestsRef,
        centerScatter: scatter,
        regionId,
      },
    );
    if (vegLib) {
      ctx.progress(0.976, 'stream: planting ring forests');
      await streamer.attachVegLibrary(vegLib);
      for (const ch of streamer.residentChunks()) {
        if (ch.forests) ch.primeCull(engine.renderer, engine.camera);
      }
    }
    if (!ablate.has('proxy')) engine.scene.add(buildTerrainShadowProxy(hf));
    let grassCamKey = '';
    engine.onUpdate(() => {
      streamer!.update(engine.camera);
      const n = streamer!.residentCount();
      engine.stats.counters['terrain.tiles'] = n;
      engine.stats.counters['stream.chunks'] = n;
      if (grassRing) {
        const cam = worldToChunk(engine.camera.position.x, engine.camera.position.z);
        const key = `${cam.cx},${cam.cy}`;
        if (key !== grassCamKey) {
          const ch = streamer!.getChunk(cam.cx, cam.cy);
          if (ch) {
          const c = ch.canopyTex ?? canopyTex;
          if (c) {
            grassRing.rebind(ch.hf, c);
            grassCamKey = key;
          }
          }
        }
      }
      let trees = 0;
      let activeForest: Forests | null = null;
      const camChunk = worldToChunk(engine.camera.position.x, engine.camera.position.z);
      for (const ch of streamer!.residentChunks()) {
        trees += ch.scatter?.trees.count ?? 0;
        if (ch.cx === camChunk.cx && ch.cy === camChunk.cy) activeForest = ch.forests;
      }
      engine.stats.counters['veg.trees'] = trees;
      if (activeForest) Object.assign(engine.stats.counters, activeForest.counterSnapshot());
    });
  } else {
    const tiles = new TerrainTiles(hf, view, {
      gi: gi ?? undefined,
      canopyTex: canopyTex ?? undefined,
    });
    engine.scene.add(tiles.mesh);
    engine.scene.add(tiles.farShell);
    // ?ablate=proxy — drop the terrain shadow caster (shadow-debug bisect)
    if (!ablate.has('proxy')) engine.scene.add(buildTerrainShadowProxy(hf));
    engine.onUpdate(() => {
      tiles.update(engine.camera);
      engine.stats.counters['terrain.tiles'] = tiles.activeTiles;
    });
    if (forestsRef) {
      engine.scene.add(forestsRef.group);
      engine.onUpdate(() => {
        forestsRef!.update(engine.renderer, engine.camera);
        Object.assign(engine.stats.counters, forestsRef!.counterSnapshot());
      });
    }
  }

  // Phase 6: stream/lake water clipmap (?ablate=water to A/B)
  if (view !== 'split' && !ablate.has('water') && !useInfinite) {
    const water = new WaterSurface(
      hf,
      sunSky.atmosphere,
      canopyTex!,
      ablate.has('gi') ? null : gi,
    );
    engine.scene.add(water.group);
    engine.onUpdate(() => water.update(engine.camera));
  }

  // Grass ring + canopy shell — rebuild ring when stream residency changes
  if (vegLib && !ablate.has('veg')) {
    if (!ablate.has('grass')) {
      const bootGrass = (ringHf: Heightfield, ringCanopy: import('three/webgpu').StorageTexture): GroundRing => {
        const ring = new GroundRing(
          ringHf,
          ringCanopy,
          seed,
          ablate.has('gi') ? null : gi,
          effectiveProfile,
        );
        ring.init(vegLib!.atlases.get('beech') ?? null);
        return ring;
      };
      let grassCanopy = canopyTex;
      if (useInfinite && infinite) {
        const v = infinite.vegChunkIndex();
        grassCanopy = infinite.getChunk(v.cx, v.cy)?.canopyTex ?? null;
      }
      if (grassCanopy) {
        grassRing = bootGrass(infinite?.centerHf ?? hf, grassCanopy);
        engine.scene.add(grassRing.group);
        engine.onUpdate(() => {
          if (!grassRing) return;
          grassRing.update(engine.renderer, engine.camera);
          Object.assign(engine.stats.counters, grassRing.counterSnapshot());
        });
      }
    }
    if (!ablate.has('shell') && !useStream && !useInfinite && canopyTex) {
      engine.scene.add(buildCanopyShell(hf, canopyTex));
    }
  }

  // volumetric clouds (noise bake + sun-shadow map)
  ctx.progress(0.97, 'sky: baking cloud noise');
  const clouds = new Clouds(sunSky.atmosphere);
  await clouds.init(engine.renderer);
  // weather motion (Pillar F): drift on WORLD time so ?freeze=1 shots stay
  // deterministic; the drifted shadow map re-bakes itself every ~2.5 s
  let lastWt = 0;
  engine.onUpdate((_dt, wt) => {
    clouds.tick(engine.renderer, wt - lastWt);
    lastWt = wt;
  });

  // 4-cascade CSM + PCSS contact hardening; cloud shadows gate the sun term
  const shadowRig = setupSunShadows(sunSky.sun, engine.camera, (wxz) =>
    clouds.shadowAt(wxz),
  );
  // cascade cameras drive the per-cascade caster cull in Forests
  forestsRef?.setCSM(shadowRig.csm ?? null);
  if (streamer || infinite) {
    const wireCsm = () => {
      const mgr = streamer ?? infinite;
      if (!mgr) return;
      for (const ch of mgr.residentChunks()) {
        ch.forests?.setCSM(shadowRig.csm ?? null);
      }
    };
    wireCsm();
    if (streamer) {
      streamer.onResidencyChange = (chunk) => {
        if (grassRing && !ablate.has('grass')) {
          const c = chunk.canopyTex ?? canopyTex;
          if (c) grassRing.rebind(chunk.hf, c);
        }
        chunk.forests?.setCSM(shadowRig.csm ?? null);
        wireCsm();
      };
    }
    if (infinite) {
      infinite.onVegChunkChange = (chunk) => {
        if (grassRing && !ablate.has('grass')) {
          const c = chunk.canopyTex ?? canopyTex;
          if (c) grassRing.rebind(chunk.hf, c);
        }
        if (!ablate.has('wind') && chunk.hf.noiseA && chunk.canopyTex) {
          setWindContext({ noiseA: chunk.hf.noiseA, canopyTex: chunk.canopyTex });
        }
        chunk.forests?.setCSM(shadowRig.csm ?? null);
        wireCsm();
        updateSunUniforms(sunSky.sun);
      };
    }
  }
  (window as unknown as { __laasDbg?: Record<string, unknown> }).__laasDbg = {
    engine,
    sunSky,
    shadowRig,
    streamer,
    infinite,
  };

  // GPU particles: snow/pollen/leaves riding the wind (?ablate=particles)
  let parts: Particles | null = null;
  if (view !== 'split' && !ablate.has('particles') && canopyTex) {
    parts = new Particles(hf, canopyTex, ablate.has('gi') ? null : gi);
    engine.scene.add(parts.mesh);
    engine.onUpdate((dt) => parts!.update(engine.renderer, engine.camera, dt));
    engine.stats.counters['particles'] = PARTICLE_COUNT;
  }

  // froxel volumetrics: canopy shafts + valley fog (?ablate=froxels, ?fog=N)
  let froxels: Froxels | null = null;
  if (!ablate.has('froxels') && canopyTex) {
    froxels = new Froxels(hf, sunSky.atmosphere, canopyTex, clouds);
    const fq = Number(new URLSearchParams(window.location.search).get('fog') ?? NaN);
    if (Number.isFinite(fq)) froxels.fogK.value = fq;
    froxels.captureBaseFog();
    const fx = froxels;
    engine.onUpdate(() => fx.update(engine.renderer, engine.camera));
  }

  const weatherCtrl = new WeatherController(parseWeatherPreset(params.weather));
  weatherCtrl.applyBoot({ clouds, froxels, particles: parts }, windU.strength.value);
  Object.assign(ctx.hooks, {
    profile: effectiveProfile,
    weather: params.weather,
    seed: params.seed,
    importId: bootParams.importId,
    world: worldBoot.mode,
    stateId: worldBoot.stateId,
    tileId: worldBoot.tile?.id ?? null,
    regionId,
    wgs84: worldBoot.wgs84,
    getWgs84: () => {
      const bounds = hf.importManifest?.bounds ?? worldBoot.geoBounds;
      if (!bounds) return worldBoot.wgs84;
      const p = engine.camera.position;
      return worldToWgs84(p.x, p.z, bounds);
    },
    getSeason: () => ({
      phase: climateU.seasonPhase.value,
      day: climateU.dayOfYear.value,
      label: seasonLabel(climateU.seasonPhase.value),
      coldK: climateU.coldK.value,
      growthK: climateU.growthK.value,
    }),
    setSeasonPhase: (phase: number) => climate.setPhase(phase),
  });

  // HDR post stack: aerial perspective, clouds, GTAO, TRAA, bloom, exposure, grade
  ctx.progress(0.98, 'post: building pipeline');
  const post = new PostStack(engine, sunSky.atmosphere, bootTod, clouds, froxels);
  engine.post = post;

  ctx.hooks.setTimeOfDay = (t: number) => {
    void (async () => {
      await sunSky.setTimeOfDay(t);
      await clouds.refreshShadow(engine.renderer);
      gi?.invalidate();
      post.setTimeOfDay(t);
    })();
  };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'BracketLeft' || e.code === 'BracketRight') {
      void clouds.refreshShadow(engine.renderer);
      post.setTimeOfDay(sunSky.timeOfDay);
    }
  });

  // terrain/water probe for the camera rig: walk-mode ground physics + the
  // fly-mode soft collision / underwater guard both live in FlyCamera now
  ctx.hooks.groundProbe = (x, z) =>
    infinite
      ? infinite.groundProbe(x, z)
      : streamer
        ? streamer.groundProbe(x, z)
        : { ground: hf.heightAtCpu(x, z), water: hf.waterYAtCpu(x, z) };

  // camera spawn: ground-clamped (?alt/x/z → fly) or the DEFAULT WALK SPAWN
  // at the map center — first dry, reasonably flat spot on a spiral out
  // from (0,0), eye at head height, facing the NE massif
  const q = new URLSearchParams(window.location.search);
  const alt = Number(q.get('alt') ?? NaN);
  const importCam = hf.importManifest?.camera;
  if (params.cam === null) {
    if (worldBoot.spawn && params.shot === null && !Number.isFinite(alt)) {
      const { x, z, alt: spawnAlt } = worldBoot.spawn;
      const y = hf.heightAtCpu(x, z) + spawnAlt;
      ctx.hooks.initialPose = { p: [x, y, z], yaw: 0.35, pitch: -0.08 };
      ctx.hooks.initialPoseMode = 'fly';
      engine.camera.position.set(x, y, z);
    } else if (importCam && params.shot === null && !Number.isFinite(alt) && !worldBoot.spawn) {
      const y = hf.heightAtCpu(importCam.x, importCam.z) + importCam.alt;
      ctx.hooks.initialPose = {
        p: [importCam.x, y, importCam.z],
        yaw: importCam.yaw,
        pitch: importCam.pitch,
      };
      ctx.hooks.initialPoseMode = 'fly';
      engine.camera.position.set(importCam.x, y, importCam.z);
    } else if (Number.isFinite(alt)) {
      const x = Number(q.get('x') ?? 600);
      const z = Number(q.get('z') ?? 900);
      const yaw = Number(q.get('yaw') ?? 2.4); // rad; 0 = looking −z (north)
      const pitch = Number(q.get('pitch') ?? -0.04); // rad; negative = down
      const y = hf.heightAtCpu(x, z) + alt;
      // the fly camera doesn't exist yet — main applies this after rigging
      ctx.hooks.initialPose = { p: [x, y, z], yaw, pitch };
      ctx.hooks.initialPoseMode = 'fly';
      engine.camera.position.set(x, y, z);
    } else if (params.shot === null) {
      const profileBm = profileSpawnBookmark(effectiveProfile);
      if (profileBm) {
        const y = bookmarkPoseY(hf, profileBm);
        ctx.hooks.initialPose = {
          p: [profileBm.x, y, profileBm.z],
          yaw: profileBm.yaw,
          pitch: profileBm.pitch,
        };
        ctx.hooks.initialPoseMode = 'fly';
        engine.camera.position.set(profileBm.x, y, profileBm.z);
      } else {
        const spawn = findWalkSpawn(hf);
        ctx.hooks.initialPose = {
          p: [spawn.x, hf.heightAtCpu(spawn.x, spawn.z) + 1.7, spawn.z],
          yaw: -0.78, // face NE — the serrated massif anchors the first frame
          pitch: -0.02,
        };
        ctx.hooks.initialPoseMode = 'walk';
        engine.camera.position.set(spawn.x, ctx.hooks.initialPose.p[1], spawn.z);
      }
    }
    // when ?shot=N, installBookmarks sets initialPose below
  }

  // composed bookmarks (keys 1-9, ?shot=N) + 92 s flythrough (?fly=1 / F)
  installBookmarks(engine, hf, ctx.hooks, params);

  const herdQ = new URLSearchParams(window.location.search);
  if (herdQ.get('herd') === '1' || effectiveProfile === 'grassland') {
    ctx.progress(0.99, 'herd: grazing horses');
    const spawnPt = ctx.hooks.initialPose
      ? { x: ctx.hooks.initialPose.p[0], z: ctx.hooks.initialPose.p[2] }
      : { x: 0, z: 0 };
    installHerdOnTerrain(engine, seed, hf, spawnPt);
  }

  ctx.progress(1, 'terrain ready');
}

/**
 * Default walk spawn: first dry, reasonably flat spot on a coarse spiral
 * out from the map center (dry = waterY sits below the bed there; flat =
 * central-difference slope under ~19°).
 */
function findWalkSpawn(hf: Heightfield): { x: number; z: number } {
  for (let r = 0; r <= 240; r += 12) {
    const steps = Math.max(1, Math.round((2 * Math.PI * r) / 18));
    for (let k = 0; k < steps; k++) {
      const a = (k / steps) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = hf.heightAtCpu(x, z);
      if (hf.waterYAtCpu(x, z) > h - 0.05) continue; // wet or waterline
      const sx = hf.heightAtCpu(x + 6, z) - hf.heightAtCpu(x - 6, z);
      const sz = hf.heightAtCpu(x, z + 6) - hf.heightAtCpu(x, z - 6);
      if (Math.hypot(sx, sz) / 12 > 0.35) continue; // too steep
      return { x, z };
    }
  }
  return { x: 0, z: 0 };
}
