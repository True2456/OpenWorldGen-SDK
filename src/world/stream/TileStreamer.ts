/**
 * 3×3 chunk residency manager — load/evict on camera chunk crossing.
 *
 * Terrain for the full window; forests plant serially in the background and
 * ring culls are throttled so streaming does not thrash the GPU.
 */

import type { Scene } from 'three';
import type { PerspectiveCamera, Renderer } from 'three/webgpu';
import type { StorageTexture } from 'three/webgpu';
import { bakeNoiseTextures } from '../../gpu/passes/NoiseBake';
import type { ProbeGI } from '../../gpu/passes/ProbeGI';
import type { LaasParams } from '../../core/Params';
import type { WorldSeed } from '../../core/Seed';
import type { VegLib } from '../../vegetation/VegLibrary';
import { getVegPerf } from '../../vegetation/VegPerf';
import { resolveStateTile } from '../geo/australia';
import type { WorldBootPlan } from '../WorldModel';
import type { Heightfield, ProgressFn } from '../Heightfield';
import {
  chunkKey,
  neighborChunks,
  worldToChunk,
  type ChunkIndex,
} from './ChunkCoords';
import { TileChunk } from './TileChunk';

const RADIUS = 1;
/** Ring chunks: woodland continues from DEM neighbor via vegContext */
const RING_VEG_DENSITY = 0.72;
/** Frames between Forests.cull for non-camera chunks */
const RING_FOREST_CADENCE = 3;
/** Frames between CDLOD refresh for corner ring tiles */
const RING_TERRAIN_CADENCE = 6;

export function streamEnabled(
  _params: LaasParams,
  _worldBoot?: WorldBootPlan,
  search = window.location.search,
): boolean {
  const q = new URLSearchParams(search);
  if (q.get('stream') === '1') return true;
  if (q.get('stream') === '0') return false;
  return false;
}

export class TileStreamer {
  centerHf: Heightfield;
  private readonly chunks = new Map<string, TileChunk>();
  private readonly renderer: Renderer;
  private readonly params: LaasParams;
  private readonly seed: WorldSeed;
  private readonly progress: ProgressFn;
  private readonly anchorCol: number;
  private readonly anchorRow: number;
  private readonly stateId: string;
  private readonly profile: string;
  private readonly regionId: string | null;
  private readonly scene: Scene;
  private readonly noiseA: StorageTexture;
  private readonly noiseB: StorageTexture;
  private readonly gi: ProbeGI | null;
  private readonly debugView: string | null;
  private vegLib: VegLib | null = null;
  private centerCx = 0;
  private centerCy = 0;
  private loading = false;
  private forestTick = 0;
  private vegQueue: TileChunk[] = [];
  private planting = false;
  private lastCamera: PerspectiveCamera | null = null;

  private constructor(
    renderer: Renderer,
    params: LaasParams,
    seed: WorldSeed,
    progress: ProgressFn,
    scene: Scene,
    centerHf: Heightfield,
    noiseA: StorageTexture,
    noiseB: StorageTexture,
    anchor: {
      col: number;
      row: number;
      stateId: string;
      profile: string;
      regionId: string | null;
    },
    gi: ProbeGI | null,
    _canopyTex: StorageTexture | null,
    debugView: string | null,
  ) {
    this.renderer = renderer;
    this.params = params;
    this.seed = seed;
    this.progress = progress;
    this.scene = scene;
    this.centerHf = centerHf;
    this.noiseA = noiseA;
    this.noiseB = noiseB;
    this.anchorCol = anchor.col;
    this.anchorRow = anchor.row;
    this.stateId = anchor.stateId;
    this.profile = anchor.profile;
    this.regionId = anchor.regionId;
    this.gi = gi;
    this.debugView = debugView;
  }

  static async boot(
    renderer: Renderer,
    params: LaasParams,
    seed: WorldSeed,
    worldBoot: WorldBootPlan,
    progress: ProgressFn,
    scene: Scene,
    opts: {
      gi?: ProbeGI | null;
      canopyTex?: StorageTexture | null;
      debugView?: string | null;
      initialChunk?: ChunkIndex;
      centerHf?: Heightfield;
      centerForests?: import('../../vegetation/Forests').Forests | null;
      centerScatter?: import('../../gpu/passes/Scatter').ScatterResult | null;
      centerCx?: number;
      centerCy?: number;
      regionId?: string | null;
    } = {},
  ): Promise<TileStreamer> {
    progress(0.02, 'stream: baking shared noise');
    const noise = await bakeNoiseTextures(renderer);

    const tile = worldBoot.tile;
    const anchorCol = tile?.col ?? 11;
    const anchorRow = tile?.row ?? 4;
    const stateId = worldBoot.stateId ?? 'nsw';
    const profile = worldBoot.importId
      ? (worldBoot.profile ?? params.profile)
      : params.profile;

    const start = opts.initialChunk ?? { cx: opts.centerCx ?? 0, cy: opts.centerCy ?? 0 };
    let centerChunk: TileChunk;

    if (opts.centerHf) {
      centerChunk = TileChunk.fromHeightfield(opts.centerHf, start.cx, start.cy, {
        isCenter: true,
        gi: opts.gi ?? null,
        canopyTex: opts.canopyTex ?? null,
        debugView: opts.debugView ?? null,
      });
      if (opts.centerForests) {
        centerChunk.forests = opts.centerForests;
        centerChunk.scatter = opts.centerScatter ?? null;
        centerChunk.canopyTex = opts.canopyTex ?? null;
        centerChunk.group.add(opts.centerForests.group);
      }
    } else {
      const centerImport = TileStreamer.importForOffset(
        anchorCol,
        anchorRow,
        stateId,
        start.cx,
        start.cy,
      );
      progress(0.04, 'stream: loading center chunk');
      centerChunk = await TileChunk.load(renderer, params, seed, progress, {
        cx: start.cx,
        cy: start.cy,
        mode: 'full',
        importId: centerImport,
        profile,
        noiseA: noise.texA,
        noiseB: noise.texB,
        gi: opts.gi ?? null,
        canopyTex: opts.canopyTex ?? null,
        debugView: opts.debugView ?? null,
      });
    }
    scene.add(centerChunk.group);

    const streamer = new TileStreamer(
      renderer,
      params,
      seed,
      progress,
      scene,
      centerChunk.hf,
      noise.texA,
      noise.texB,
      {
        col: anchorCol,
        row: anchorRow,
        stateId,
        profile,
        regionId: opts.regionId ?? worldBoot.region ?? null,
      },
      opts.gi ?? null,
      opts.canopyTex ?? null,
      opts.debugView ?? null,
    );
    streamer.centerCx = start.cx;
    streamer.centerCy = start.cy;
    streamer.chunks.set(chunkKey(start.cx, start.cy), centerChunk);
    centerChunk.setFarShellVisible(true);

    progress(0.55, 'stream: loading ring terrain');
    await streamer.ensureRing(start.cx, start.cy);
    progress(0.9, 'stream: chunks resident');
    return streamer;
  }

  /**
   * Register veg pools. Center forests already exist; ring planting is queued
   * and drains serially so boot doesn't spike 8× scatter+cull.
   */
  async attachVegLibrary(lib: VegLib): Promise<void> {
    this.vegLib = lib;
    for (const chunk of this.chunks.values()) {
      if (chunk.forests) continue;
      this.enqueueVeg(chunk);
    }
    // plant all ring neighbors before first frame so horizons aren't bare
    await this.drainVegQueue(8);
  }

  static importForOffset(
    anchorCol: number,
    anchorRow: number,
    stateId: string,
    dcx: number,
    dcy: number,
  ): string | null {
    const col = anchorCol + dcx;
    const row = anchorRow + dcy;
    const tile = resolveStateTile(stateId, col, row);
    return tile?.importId ?? null;
  }

  residentCount(): number {
    return this.chunks.size;
  }

  residentChunks(): Iterable<TileChunk> {
    return this.chunks.values();
  }

  centerChunkIndex(): ChunkIndex {
    return { cx: this.centerCx, cy: this.centerCy };
  }

  activeHeightfield(x: number, z: number): Heightfield {
    return this.chunkAt(x, z)?.hf ?? this.centerHf;
  }

  heightAtCpu(x: number, z: number): number {
    const chunk = this.chunkAt(x, z);
    return chunk?.hf.heightAtCpu(x, z) ?? 0;
  }

  waterYAtCpu(x: number, z: number): number {
    const chunk = this.chunkAt(x, z);
    return chunk?.hf.waterYAtCpu(x, z) ?? -1e4;
  }

  groundProbe(x: number, z: number): { ground: number; water: number } {
    return { ground: this.heightAtCpu(x, z), water: this.waterYAtCpu(x, z) };
  }

  getChunk(cx: number, cy: number): TileChunk | undefined {
    return this.chunks.get(chunkKey(cx, cy));
  }

  update(camera: PerspectiveCamera): void {
    this.lastCamera = camera;
    this.forestTick++;
    const cam = worldToChunk(camera.position.x, camera.position.z);
    for (const chunk of this.chunks.values()) {
      const manh = Math.abs(chunk.cx - cam.cx) + Math.abs(chunk.cy - cam.cy);
      const isCam = manh === 0;
      const updateTerrain =
        isCam ||
        manh === 1 ||
        (manh === 2 &&
          (this.forestTick + chunk.cx * 5 + chunk.cy * 3) % RING_TERRAIN_CADENCE === 0);
      const updateForests =
        Boolean(chunk.forests) &&
        (isCam ||
          (manh <= 1 &&
            (this.forestTick + chunk.cx * 7 + chunk.cy * 11) % RING_FOREST_CADENCE === 0));
      chunk.update(camera, this.renderer, { updateForests, updateTerrain });
    }

    // keep draining ring veg without blocking the frame
    void this.drainVegQueue(1);

    const { cx, cy } = cam;
    if (cx === this.centerCx && cy === this.centerCy) return;
    if (this.loading) return;
    void this.recenter(cx, cy);
  }

  private chunkAt(x: number, z: number): TileChunk | undefined {
    const { cx, cy } = worldToChunk(x, z);
    return this.chunks.get(chunkKey(cx, cy));
  }

  private enqueueVeg(chunk: TileChunk): void {
    if (!this.vegLib || chunk.forests) return;
    if (this.vegQueue.includes(chunk)) return;
    this.vegQueue.push(chunk);
  }

  /** Plant up to `budget` queued chunks (serial). */
  private async drainVegQueue(budget = 1): Promise<void> {
    if (this.planting || !this.vegLib || this.vegQueue.length === 0) return;
    this.planting = true;
    try {
      let left = budget;
      while (left > 0 && this.vegQueue.length) {
        const chunk = this.vegQueue.shift()!;
        if (!this.chunks.has(chunkKey(chunk.cx, chunk.cy))) continue;
        if (chunk.forests) continue;
        const presetDens = getVegPerf().scatterDensity;
        const isResidencyCenter =
          chunk.cx === this.centerCx && chunk.cy === this.centerCy;
        const base = isResidencyCenter ? 1 : RING_VEG_DENSITY;
        const dens = Math.max(0.12, Math.min(1, base * presetDens));
        const isRing = !isResidencyCenter;
        await chunk.attachVeg(
          this.renderer,
          this.seed,
          this.vegLib,
          this.profile,
          this.regionId,
          dens >= 0.99 ? this.gi : null,
          dens,
          { treesOnly: isRing, streamRing: isRing },
        );
        if (this.lastCamera) chunk.primeCull(this.renderer, this.lastCamera);
        left--;
      }
    } finally {
      this.planting = false;
    }
  }

  private async recenter(cx: number, cy: number): Promise<void> {
    this.loading = true;
    try {
      this.centerCx = cx;
      this.centerCy = cy;
      await this.ensureRing(cx, cy);
      this.evictOutside(cx, cy);
      for (const chunk of this.chunks.values()) {
        chunk.setFarShellVisible(chunk.cx === cx && chunk.cy === cy);
      }
      const active = this.chunks.get(chunkKey(cx, cy));
      if (active) {
        this.centerHf = active.hf;
        this.onResidencyChange?.(active);
      }
    } finally {
      this.loading = false;
    }
  }

  onResidencyChange: ((chunk: TileChunk) => void) | null = null;

  private neededKeys(cx: number, cy: number): Set<string> {
    return new Set(neighborChunks(cx, cy, RADIUS).map((c) => chunkKey(c.cx, c.cy)));
  }

  private async ensureRing(cx: number, cy: number): Promise<void> {
    const needed = neighborChunks(cx, cy, RADIUS);
    for (const { cx: ncx, cy: ncy } of needed) {
      const key = chunkKey(ncx, ncy);
      if (this.chunks.has(key)) continue;
      // serial terrain loads — parallel 9× heightfields OOMs mid-tier GPUs
      await this.loadChunk(ncx, ncy);
    }
  }

  private async loadChunk(cx: number, cy: number): Promise<void> {
    const importId = TileStreamer.importForOffset(
      this.anchorCol,
      this.anchorRow,
      this.stateId,
      cx,
      cy,
    );
    const hasImport = importId !== null;
    const mode = hasImport ? 'full' : 'fast';
    const chunk = await TileChunk.load(this.renderer, this.params, this.seed, this.progress, {
      cx,
      cy,
      mode,
      importId,
      profile: this.profile,
      noiseA: this.noiseA,
      noiseB: this.noiseB,
      gi: null,
      canopyTex: null,
      debugView: this.debugView,
    });
    this.chunks.set(chunkKey(cx, cy), chunk);
    this.scene.add(chunk.group);
    const donor = this.findVegDonor(cx, cy);
    if (donor) chunk.hf.vegContext = donor;
    // veg deferred — don't block travel on scatter
    this.enqueueVeg(chunk);
  }

  /** Neighbor DEM/full chunk donates biome+moisture for ring scatter continuity. */
  private findVegDonor(cx: number, cy: number): Heightfield | null {
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      const n = this.getChunk(cx + dx, cy + dy);
      if (!n) continue;
      if (n.hf.importManifest || n.forests) return n.hf;
    }
    const center = this.getChunk(this.centerCx, this.centerCy);
    if (this.centerHf.importManifest || center?.forests) return this.centerHf;
    return null;
  }

  private evictOutside(cx: number, cy: number): void {
    const keep = this.neededKeys(cx, cy);
    for (const [key, chunk] of this.chunks) {
      if (keep.has(key)) continue;
      this.vegQueue = this.vegQueue.filter((c) => c !== chunk);
      this.scene.remove(chunk.group);
      chunk.dispose();
      this.chunks.delete(key);
    }
  }
}
