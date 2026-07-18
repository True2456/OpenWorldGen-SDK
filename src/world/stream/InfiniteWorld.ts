/**
 * Procedural infinite-world test pipeline.
 *
 * - Terrain: fast procedural chunks in a moving 3×3 window.
 * - Vegetation: ONE Forests on the camera chunk, radial scatter (~1.8 km bubble).
 * - Replant only when crossing a 4 km chunk boundary (not on periodic walk).
 *
 * Enable: `?world=infinite` or `?infinite=1` (procedural — no DEM import).
 * Tune bubble: `?vegR=2200` (meters, 400–3500).
 */

import type { Scene } from 'three';
import type { PerspectiveCamera, Renderer } from 'three/webgpu';
import type { StorageTexture } from 'three/webgpu';
import { bakeNoiseTextures } from '../../gpu/passes/NoiseBake';
import type { LaasParams } from '../../core/Params';
import type { WorldSeed } from '../../core/Seed';
import type { VegLib } from '../../vegetation/VegLibrary';
import { getVegPerf } from '../../vegetation/VegPerf';
import type { Heightfield, ProgressFn } from '../Heightfield';
import {
  chunkKey,
  neighborChunks,
  worldToChunk,
  type ChunkIndex,
} from './ChunkCoords';
import { TileChunk } from './TileChunk';

/** Loaded terrain radius around camera chunk (1 → 3×3 window). */
const TERRAIN_RADIUS = 1;
/** Scatter density vs preset when planting the camera chunk. */
const VEG_DENSITY = 0.38;

export function infiniteEnabled(search = window.location.search): boolean {
  const q = new URLSearchParams(search);
  if (q.get('world') === 'infinite') return true;
  if (q.get('infinite') === '1') return true;
  return false;
}

export function vegBubbleRadius(search = window.location.search): number {
  const q = new URLSearchParams(search);
  const r = Number(q.get('vegR') ?? q.get('vegradius') ?? 1800);
  if (!Number.isFinite(r)) return 1800;
  return Math.min(3500, Math.max(400, r));
}

export class InfiniteWorld {
  centerHf: Heightfield;
  private readonly chunks = new Map<string, TileChunk>();
  private readonly loadingPromises = new Map<string, Promise<void>>();
  private readonly renderer: Renderer;
  private readonly params: LaasParams;
  private readonly seed: WorldSeed;
  private readonly progress: ProgressFn;
  private readonly profile: string;
  private readonly regionId: string | null;
  private readonly scene: Scene;
  private readonly noiseA: StorageTexture;
  private readonly noiseB: StorageTexture;
  private readonly debugView: string | null;
  private readonly vegRadius: number;
  private vegLib: VegLib | null = null;
  private terrainCx = 0;
  private terrainCy = 0;
  private vegCx = 0;
  private vegCy = 0;
  private vegScatterX = 0;
  private vegScatterZ = 0;
  private terrainLoading = false;
  private vegLoading = false;
  private lastCamera: PerspectiveCamera | null = null;

  private constructor(
    renderer: Renderer,
    params: LaasParams,
    seed: WorldSeed,
    progress: ProgressFn,
    scene: Scene,
    centerHf: Heightfield,
    centerChunk: TileChunk,
    noiseA: StorageTexture,
    noiseB: StorageTexture,
    profile: string,
    regionId: string | null,
    debugView: string | null,
    vegRadius: number,
  ) {
    this.renderer = renderer;
    this.params = params;
    this.seed = seed;
    this.progress = progress;
    this.scene = scene;
    this.centerHf = centerHf;
    this.noiseA = noiseA;
    this.noiseB = noiseB;
    this.profile = profile;
    this.regionId = regionId;
    this.debugView = debugView;
    this.vegRadius = vegRadius;
    this.chunks.set(chunkKey(0, 0), centerChunk);
  }

  static async boot(
    renderer: Renderer,
    params: LaasParams,
    seed: WorldSeed,
    progress: ProgressFn,
    scene: Scene,
    opts: {
      profile: string;
      regionId?: string | null;
      debugView?: string | null;
      startChunk?: ChunkIndex;
    },
  ): Promise<InfiniteWorld> {
    progress(0.02, 'infinite: baking noise');
    const noise = await bakeNoiseTextures(renderer);
    const start = opts.startChunk ?? { cx: 0, cy: 0 };
    const vegR = vegBubbleRadius();

    progress(0.06, `infinite: terrain (${start.cx},${start.cy})`);
    const centerChunk = await TileChunk.load(renderer, params, seed, progress, {
      cx: start.cx,
      cy: start.cy,
      mode: 'fast',
      importId: null,
      profile: opts.profile,
      noiseA: noise.texA,
      noiseB: noise.texB,
      gi: null,
      canopyTex: null,
      debugView: opts.debugView ?? null,
    });
    scene.add(centerChunk.group);
    centerChunk.setFarShellVisible(true);

    const world = new InfiniteWorld(
      renderer,
      params,
      seed,
      progress,
      scene,
      centerChunk.hf,
      centerChunk,
      noise.texA,
      noise.texB,
      opts.profile,
      opts.regionId ?? null,
      opts.debugView ?? null,
      vegR,
    );
    world.terrainCx = start.cx;
    world.terrainCy = start.cy;
    world.vegCx = start.cx;
    world.vegCy = start.cy;

    progress(0.35, 'infinite: loading terrain window');
    await world.ensureTerrainWindow(start.cx, start.cy);
    progress(0.55, 'infinite: terrain window ready');
    return world;
  }

  async attachVegLibrary(lib: VegLib, camera: PerspectiveCamera): Promise<void> {
    this.vegLib = lib;
    this.lastCamera = camera;
    this.vegScatterX = camera.position.x;
    this.vegScatterZ = camera.position.z;
    await this.plantVegBubble(this.vegCx, this.vegCy, this.vegScatterX, this.vegScatterZ);
  }

  residentCount(): number {
    return this.chunks.size;
  }

  residentChunks(): Iterable<TileChunk> {
    return this.chunks.values();
  }

  vegChunkIndex(): ChunkIndex {
    return { cx: this.vegCx, cy: this.vegCy };
  }

  vegBubbleRadiusM(): number {
    return this.vegRadius;
  }

  isBusy(): boolean {
    return this.terrainLoading || this.vegLoading;
  }

  getChunk(cx: number, cy: number): TileChunk | undefined {
    return this.chunks.get(chunkKey(cx, cy));
  }

  heightAtCpu(x: number, z: number): number {
    return this.chunkAt(x, z)?.hf.heightAtCpu(x, z) ?? 0;
  }

  waterYAtCpu(x: number, z: number): number {
    return this.chunkAt(x, z)?.hf.waterYAtCpu(x, z) ?? -1e4;
  }

  groundProbe(x: number, z: number): { ground: number; water: number } {
    return { ground: this.heightAtCpu(x, z), water: this.waterYAtCpu(x, z) };
  }

  update(camera: PerspectiveCamera): void {
    this.lastCamera = camera;
    const cam = worldToChunk(camera.position.x, camera.position.z);

    if (cam.cx !== this.terrainCx || cam.cy !== this.terrainCy) {
      if (!this.terrainLoading) void this.recenterTerrain(cam.cx, cam.cy);
    }

    if (this.vegLib && !this.vegLoading && !this.terrainLoading) {
      if (cam.cx !== this.vegCx || cam.cy !== this.vegCy) {
        void this.plantVegBubble(cam.cx, cam.cy, camera.position.x, camera.position.z);
      }
    }

    for (const chunk of this.chunks.values()) {
      const manh = Math.abs(chunk.cx - cam.cx) + Math.abs(chunk.cy - cam.cy);
      const isVeg = chunk.cx === this.vegCx && chunk.cy === this.vegCy;
      const updateTerrain = manh <= 1;
      const updateForests = isVeg && Boolean(chunk.forests) && !this.vegLoading;
      chunk.update(camera, this.renderer, { updateForests, updateTerrain });
    }
  }

  /** Fired after forests/canopy move to a new camera chunk or bubble recenters. */
  onVegChunkChange: ((chunk: TileChunk) => void) | null = null;

  private chunkAt(x: number, z: number): TileChunk | undefined {
    const { cx, cy } = worldToChunk(x, z);
    return this.chunks.get(chunkKey(cx, cy));
  }

  private neededTerrainKeys(cx: number, cy: number): Set<string> {
    return new Set(
      neighborChunks(cx, cy, TERRAIN_RADIUS).map((c) => chunkKey(c.cx, c.cy)),
    );
  }

  private async recenterTerrain(cx: number, cy: number): Promise<void> {
    this.terrainLoading = true;
    try {
      this.terrainCx = cx;
      this.terrainCy = cy;
      await this.ensureTerrainWindow(cx, cy);
      this.evictOutside(cx, cy);
      for (const chunk of this.chunks.values()) {
        chunk.setFarShellVisible(chunk.cx === cx && chunk.cy === cy);
      }
    } finally {
      this.terrainLoading = false;
    }
  }

  private async ensureTerrainWindow(cx: number, cy: number): Promise<void> {
    for (const { cx: ncx, cy: ncy } of neighborChunks(cx, cy, TERRAIN_RADIUS)) {
      const key = chunkKey(ncx, ncy);
      if (this.chunks.has(key)) continue;

      let promise = this.loadingPromises.get(key);
      if (!promise) {
        promise = (async () => {
          try {
            const chunk = await TileChunk.load(this.renderer, this.params, this.seed, this.progress, {
              cx: ncx,
              cy: ncy,
              mode: 'fast',
              importId: null,
              profile: this.profile,
              noiseA: this.noiseA,
              noiseB: this.noiseB,
              gi: null,
              canopyTex: null,
              debugView: this.debugView,
            });
            this.chunks.set(key, chunk);
            this.scene.add(chunk.group);
          } finally {
            this.loadingPromises.delete(key);
          }
        })();
        this.loadingPromises.set(key, promise);
      }
      // serial loads — parallel 9× heightfields hitch mid-tier GPUs
      await promise;
    }
  }

  private async plantVegBubble(
    cx: number,
    cy: number,
    scatterX: number,
    scatterZ: number,
  ): Promise<void> {
    if (!this.vegLib) return;
    this.vegLoading = true;
    try {
      await this.ensureTerrainWindow(cx, cy);
      const chunk = this.chunks.get(chunkKey(cx, cy));
      if (!chunk) return;

      if (cx !== this.vegCx || cy !== this.vegCy) {
        await this.stripVeg(this.vegCx, this.vegCy);
        this.vegCx = cx;
        this.vegCy = cy;
      }

      this.vegScatterX = scatterX;
      this.vegScatterZ = scatterZ;

      const dens = Math.max(0.12, Math.min(1, getVegPerf().scatterDensity * VEG_DENSITY));
      await chunk.attachVeg(
        this.renderer,
        this.seed,
        this.vegLib,
        this.profile,
        this.regionId,
        null,
        dens,
        {
          treesOnly: true,
          streamRing: true,
          radialCenter: { x: scatterX, z: scatterZ },
          radialRadius: this.vegRadius,
        },
      );
      if (this.lastCamera) chunk.primeCull(this.renderer, this.lastCamera);

      this.centerHf = chunk.hf;
      this.onVegChunkChange?.(chunk);
    } finally {
      this.vegLoading = false;
    }
  }

  private async stripVeg(cx: number, cy: number): Promise<void> {
    const chunk = this.chunks.get(chunkKey(cx, cy));
    if (!chunk?.forests) return;
    chunk.group.remove(chunk.forests.group);
    chunk.forests = null;
    chunk.scatter = null;
    chunk.canopyTex = null;
  }

  private evictOutside(cx: number, cy: number): void {
    const keep = this.neededTerrainKeys(cx, cy);
    for (const [key, chunk] of this.chunks) {
      if (keep.has(key)) continue;
      if (chunk.cx === this.vegCx && chunk.cy === this.vegCy) continue;
      this.scene.remove(chunk.group);
      chunk.dispose();
      this.chunks.delete(key);
    }
  }
}
