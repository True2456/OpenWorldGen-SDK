/**
 * One streamed terrain chunk — Heightfield + CDLOD tiles (+ optional Forests).
 */

import { Group } from 'three';
import type { PerspectiveCamera, Renderer } from 'three/webgpu';
import type { StorageTexture } from 'three/webgpu';
import type { LaasParams } from '../../core/Params';
import type { WorldSeed } from '../../core/Seed';
import type { ProbeGI } from '../../gpu/passes/ProbeGI';
import { buildCanopyMap, runScatter, type ScatterResult } from '../../gpu/passes/Scatter';
import { Forests } from '../../vegetation/Forests';
import type { VegLib } from '../../vegetation/VegLibrary';
import { Heightfield, type ProgressFn } from '../Heightfield';
import { TerrainTiles } from '../TerrainTiles';
import { WORLD_HALF } from '../WorldConst';
import { chunkCenter } from './ChunkCoords';

export interface TileChunkOpts {
  cx: number;
  cy: number;
  mode: 'fast' | 'full';
  importId?: string | null;
  profile?: string;
  noiseA?: StorageTexture | null;
  noiseB?: StorageTexture | null;
  gi?: ProbeGI | null;
  canopyTex?: StorageTexture | null;
  debugView?: string | null;
}

export class TileChunk {
  readonly cx: number;
  readonly cy: number;
  readonly hf: Heightfield;
  readonly tiles: TerrainTiles;
  readonly group: Group;
  readonly isCenter: boolean;
  forests: Forests | null = null;
  scatter: ScatterResult | null = null;
  canopyTex: StorageTexture | null = null;

  private constructor(
    cx: number,
    cy: number,
    hf: Heightfield,
    tiles: TerrainTiles,
    isCenter: boolean,
  ) {
    this.cx = cx;
    this.cy = cy;
    this.hf = hf;
    this.tiles = tiles;
    this.isCenter = isCenter;
    this.group = new Group();
    this.group.name = `chunk-${cx},${cy}`;
    this.group.add(tiles.mesh);
    this.group.add(tiles.farShell);
  }

  static async load(
    renderer: Renderer,
    params: LaasParams,
    seed: WorldSeed,
    progress: ProgressFn,
    opts: TileChunkOpts,
  ): Promise<TileChunk> {
    const { cx, cy } = opts;
    const center = chunkCenter(cx, cy);
    const hf = await Heightfield.generateChunk(renderer, params, seed, progress, {
      cx,
      cy,
      mode: opts.mode,
      importId: opts.importId,
      profile: opts.profile,
      noiseA: opts.noiseA,
      noiseB: opts.noiseB,
    });
    // Keep far shell only around the residency center (updated by streamer)
    const tiles = new TerrainTiles(hf, opts.debugView ?? null, {
      worldOrigin: center,
      skipFarShell: true,
      gi: opts.gi ?? undefined,
      canopyTex: opts.canopyTex ?? undefined,
    });
    return new TileChunk(cx, cy, hf, tiles, Boolean(opts.importId) || opts.mode === 'full');
  }

  /** Wrap an already-generated heightfield (center chunk after scatter/GI). */
  static fromHeightfield(
    hf: Heightfield,
    cx: number,
    cy: number,
    opts: {
      isCenter?: boolean;
      gi?: ProbeGI | null;
      canopyTex?: StorageTexture | null;
      debugView?: string | null;
    } = {},
  ): TileChunk {
    const center = chunkCenter(cx, cy);
    const isCenter = opts.isCenter ?? true;
    const tiles = new TerrainTiles(hf, opts.debugView ?? null, {
      worldOrigin: center,
      // Center keeps the far vista for continuous horizon
      skipFarShell: !isCenter,
      gi: opts.gi ?? undefined,
      canopyTex: opts.canopyTex ?? undefined,
    });
    return new TileChunk(cx, cy, hf, tiles, isCenter);
  }

  async attachVeg(
    renderer: Renderer,
    seed: WorldSeed,
    lib: VegLib,
    profileId: string,
    regionId: string | null,
    gi: ProbeGI | null,
    densityScale = 1,
    scatterOpts: {
      treesOnly?: boolean;
      streamRing?: boolean;
      radialCenter?: { x: number; z: number };
      radialRadius?: number;
    } = {},
  ): Promise<void> {
    if (this.forests) return;
    const scatter = await runScatter(renderer, this.hf, seed, profileId, regionId, {
      densityScale,
      treesOnly: scatterOpts.treesOnly,
      streamRing: scatterOpts.streamRing,
      radialCenter: scatterOpts.radialCenter,
      radialRadius: scatterOpts.radialRadius,
    });
    const canopy = await buildCanopyMap(renderer, scatter.trees, {
      x: this.hf.worldOffsetX,
      z: this.hf.worldOffsetZ,
    });
    const forests = new Forests(this.hf, scatter, lib, gi, canopy);
    forests.init(renderer);
    this.scatter = scatter;
    this.canopyTex = canopy;
    this.forests = forests;
    this.group.add(forests.group);
  }

  setFarShellVisible(on: boolean): void {
    this.tiles.farShell.visible = on;
  }

  update(
    camera: PerspectiveCamera,
    renderer?: Renderer,
    opts: { updateForests?: boolean; updateTerrain?: boolean } = {},
  ): void {
    if (opts.updateTerrain !== false) this.tiles.update(camera);
    if (opts.updateForests !== false && this.forests && renderer) {
      this.forests.update(renderer, camera);
    }
  }

  /** Run one cull pass immediately after scatter so ring tiles aren't blank. */
  primeCull(renderer: Renderer, camera: PerspectiveCamera): void {
    if (this.forests) this.forests.update(renderer, camera);
  }

  containsWorld(x: number, z: number): boolean {
    const c = chunkCenter(this.cx, this.cy);
    return (
      x >= c.x - WORLD_HALF &&
      x < c.x + WORLD_HALF &&
      z >= c.z - WORLD_HALF &&
      z < c.z + WORLD_HALF
    );
  }

  dispose(): void {
    if (this.forests) {
      this.group.remove(this.forests.group);
      this.forests = null;
    }
    this.group.remove(this.tiles.mesh, this.tiles.farShell);
  }
}
