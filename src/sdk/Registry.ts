import type { WorldProfile } from '../contracts/biome';
import type { SpeciesParams } from '../vegetation/VegTypes';
import type { RockParams } from '../vegetation/RockBuilder';
import { VegClass } from '../gpu/passes/Scatter';
import type { BufferGeometry } from 'three';
import type { MeshStandardNodeMaterial } from 'three/webgpu';

export interface PoolPart {
  geo: BufferGeometry;
  tris: number;
  make: () => MeshStandardNodeMaterial;
  castShadow: boolean;
}

/** Placement configuration for dynamically scattered assets */
export interface PlacementConfig {
  biomeWeights: number[];
  moistureSlope?: number;
  moistureIntercept?: number;
  rockSlope?: number;
  rockIntercept?: number;
  canopyRelation?: 'none' | 'clump' | 'gap' | 'edge';
  canopySlope?: number;
  canopyIntercept?: number;
}

export interface TreeSpeciesConfig extends SpeciesParams {
  placement?: PlacementConfig;
  regionId?: string;
}

export interface UnderstorySpeciesConfig {
  id: string;
  label: string;
  cls: VegClass;
  maxDist: number;
  placement: PlacementConfig;
  buildParts: (rng: any, atlas: any, barkOf: (layer: number) => any) => PoolPart[];
  captureParams?: SpeciesParams;
}

export interface RockConfig {
  id: string;
  presetName: 'boulder' | 'slab' | 'talus' | 'cobble' | 'angular' | 'hero' | 'cliffFace';
  cls: VegClass;
  params: RockParams;
  moss?: number;
  tone?: { r: number; g: number; b: number };
  maxDist?: number;
}

export interface CustomCategoryConfig {
  id: string;
  label: string;
  cls: number;
  cellSize: number;
  maxCap: number;
  cullKind: 'trees' | 'under' | 'extras';
  placement: PlacementConfig;
  buildPools: (seed: any) => any[];
}

class TerrainRegistryImpl {
  private profiles = new Map<string, WorldProfile>();

  register(profile: WorldProfile): void {
    this.profiles.set(profile.id.toLowerCase(), profile);
  }

  get(id: string): WorldProfile | undefined {
    return this.profiles.get(id.toLowerCase());
  }

  list(): WorldProfile[] {
    return Array.from(this.profiles.values());
  }
}

class VegetationRegistryImpl {
  private trees = new Map<string, TreeSpeciesConfig>();
  private understory = new Map<string, UnderstorySpeciesConfig>();

  registerTree(tree: TreeSpeciesConfig): void {
    this.trees.set(tree.id, tree);
  }

  registerUnderstory(item: UnderstorySpeciesConfig): void {
    this.understory.set(item.id, item);
  }

  getTree(id: string): TreeSpeciesConfig | undefined {
    return this.trees.get(id);
  }

  listTrees(): TreeSpeciesConfig[] {
    return Array.from(this.trees.values());
  }

  getUnderstory(id: string): UnderstorySpeciesConfig | undefined {
    return this.understory.get(id);
  }

  listUnderstory(): UnderstorySpeciesConfig[] {
    return Array.from(this.understory.values());
  }
}

class RockRegistryImpl {
  private rocks = new Map<string, RockConfig>();

  register(rock: RockConfig): void {
    this.rocks.set(rock.id, rock);
  }

  get(id: string): RockConfig | undefined {
    return this.rocks.get(id);
  }

  list(): RockConfig[] {
    return Array.from(this.rocks.values());
  }
}

class CategoryRegistryImpl {
  private categories = new Map<string, CustomCategoryConfig>();

  register(category: CustomCategoryConfig): void {
    this.categories.set(category.id, category);
  }

  get(id: string): CustomCategoryConfig | undefined {
    return this.categories.get(id);
  }

  list(): CustomCategoryConfig[] {
    return Array.from(this.categories.values());
  }
}

export const TerrainRegistry = new TerrainRegistryImpl();
export const VegetationRegistry = new VegetationRegistryImpl();
export const RockRegistry = new RockRegistryImpl();
export const CategoryRegistry = new CategoryRegistryImpl();
