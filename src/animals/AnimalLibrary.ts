/**
 * AnimalLibrary — boot-time geometry pools for instanced fauna (mirrors VegLibrary).
 *
 * K=4 structural variants per species; three LOD rings:
 *   R0 hero (≤40 m) · R1 herd (≤120 m) · R2 blob (≤350 m)
 *
 * Gallery uses direct builders; world scatter will consume these pools later.
 */

import type { BufferGeometry } from 'three';
import type { MeshStandardNodeMaterial } from 'three/webgpu';
import type { WorldSeed } from '../core/Seed';
import { coatBodyMaterial, GREY_DAPPLE_COAT, maneCardMaterial } from './AnimalMaterials';
import { buildHorse } from './Horse';
import { ANIMAL_LIBRARY, getAnimal } from './library/registry';

export const ANIMAL_VARIANTS = 4;

export interface AnimalPoolPart {
  geo: BufferGeometry;
  tris: number;
  make: () => MeshStandardNodeMaterial;
  castShadow: boolean;
  /** mane cards (separate draw) */
  maneGeo?: BufferGeometry | null;
  maneMake?: () => MeshStandardNodeMaterial;
}

export interface AnimalPool {
  id: string;
  variant: number;
  r0: AnimalPoolPart;
  r1: AnimalPoolPart;
  r2: AnimalPoolPart;
  height: number;
  length: number;
}

export interface AnimalLib {
  pools: AnimalPool[];
  /** per-species index → max draw distance (m) */
  maxDist: number[];
}

const COAT = GREY_DAPPLE_COAT;

function poolPart(
  body: BufferGeometry,
  mane: BufferGeometry | null,
  tris: number,
): AnimalPoolPart {
  return {
    geo: body,
    tris,
    make: () => coatBodyMaterial(COAT),
    castShadow: true,
    maneGeo: mane,
    maneMake: mane ? () => maneCardMaterial(COAT) : undefined,
  };
}

export function buildAnimalLibrary(seed: WorldSeed, onProgress?: (msg: string) => void): AnimalLib {
  const pools: AnimalPool[] = [];
  const horseDef = getAnimal('horse');
  if (!horseDef) return { pools, maxDist: [] };

  for (let v = 0; v < ANIMAL_VARIANTS; v++) {
    onProgress?.(`animals: horse variant ${v}`);
    const rng = seed.rng(`animal/horse/${v}`);
    const r0 = buildHorse(rng, { lod: 0 });
    const r1 = buildHorse(rng.fork('lod1'), { lod: 1 });
    const r2 = buildHorse(rng.fork('lod2'), { lod: 2 });
    pools.push({
      id: 'horse',
      variant: v,
      r0: poolPart(r0.body, r0.mane, r0.tris),
      r1: poolPart(r1.body, null, r1.tris),
      r2: poolPart(r2.body, null, r2.tris),
      height: r0.height,
      length: r0.length,
    });
  }

  return { pools, maxDist: [180] };
}

export function animalSpeciesIds(): string[] {
  return ANIMAL_LIBRARY.filter((a) => a.id === 'horse' || !a.id.includes('lod')).map((a) => a.id);
}
