/**
 * Gallery installation + visual verification gates for the animal library.
 */

import { Mesh } from 'three';
import type { Engine } from '../../core/Engine';
import type { WorldSeed } from '../../core/Seed';
import {
  CHESTNUT_COAT,
  coatBodyMaterial,
  GREY_DAPPLE_COAT,
  maneCardMaterial,
  type CoatParams,
} from '../AnimalMaterials';
import { buildHorse } from '../Horse';
import { getMorph } from './continent-animals';
import { galleryAnimals } from './registry';
import { buildSpecies } from '../SpeciesBuilder';
import type { AnimalGalleryRow, AnimalVerifyGate } from './types';

const GALLERY_X = [-40, -20, 0, 20, 40] as const;

const horseBrown = (r: number, g: number, b: number): boolean =>
  r > g * 1.05 && g > 28 && r > 55 && r < 165 && b < g;

const horseGrey = (r: number, g: number, b: number): boolean =>
  r > 68 && g > 68 && b > 72 && Math.abs(r - g) < 22 && b >= g * 0.98;

/** Mammal silhouette vs sky/ground (beige pedestal + green grass rejected). */
const mammalCoat = (r: number, g: number, b: number): boolean => {
  if (r < 18 && g < 18 && b < 18) return false;
  // sky
  if (b > r + 18 && b > g + 12 && b > 80) return false;
  // green grass
  if (g > r + 12 && g > b + 8 && g > 70) return false;
  // pale beige pedestal / sand ground
  if (r > 140 && g > 130 && b > 100 && Math.abs(r - g) < 28 && b < g) return false;
  if (r > 180 && g > 175 && b > 165) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  // coat: mid-dark OR chromatic leisure
  return (max > 35 && max < 200 && max - min > 6) || (max > 40 && max < 160);
};

/** Pixel gates for `shots/profiles/animals-gate.png` */
export const ANIMAL_VERIFY_GATES: readonly AnimalVerifyGate[] = [
  {
    animalId: 'horse-lod1',
    name: 'Horse LOD1',
    colIndex: 0,
    validate: horseBrown,
    minPxCount: 100,
    description: 'Brown equine silhouette (herd LOD)',
  },
  {
    animalId: 'horse',
    name: 'Grey Pony LOD0',
    colIndex: 1,
    validate: horseGrey,
    minPxCount: 120,
    description: 'Hero grey dapple pony',
  },
  {
    animalId: 'horse-lod2',
    name: 'Horse LOD2',
    colIndex: 2,
    validate: (r, g, b) => horseBrown(r, g, b) || horseGrey(r, g, b),
    minPxCount: 80,
    description: 'Distant LOD horse blob',
  },
  {
    animalId: 'horse-variant',
    name: 'Horse variant',
    colIndex: 3,
    validate: (r, g, b) => horseBrown(r, g, b) || horseGrey(r, g, b),
    minPxCount: 80,
    description: 'Second seed variant',
  },
  {
    animalId: 'horse-variant2',
    name: 'Horse variant 2',
    colIndex: 4,
    validate: (r, g, b) => horseBrown(r, g, b) || horseGrey(r, g, b),
    minPxCount: 80,
    description: 'Third seed variant',
  },
];

function continentGates(
  row: AnimalGalleryRow,
  names: readonly string[],
): readonly AnimalVerifyGate[] {
  return names.map((name, colIndex) => ({
    animalId: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    colIndex,
    validate: mammalCoat,
    minPxCount: 60,
    description: `${row} specimen`,
  }));
}

export const AFRICA_ANIMAL_VERIFY_GATES = continentGates('africaAnimals', [
  'Lion',
  'Zebra',
  'African Elephant',
  'Giraffe',
  'Wildebeest',
]);
export const ASIA_ANIMAL_VERIFY_GATES = continentGates('asiaAnimals', [
  'Tiger',
  'Camel',
  'Sika Deer',
  'Water Buffalo',
  'Asian Elephant',
]);
export const EUROPE_ANIMAL_VERIFY_GATES = continentGates('europeAnimals', [
  'Red Deer',
  'Wild Boar',
  'Wolf',
  'Red Fox',
  'Brown Bear',
]);
export const NORTH_AMERICA_ANIMAL_VERIFY_GATES = continentGates('northAmericaAnimals', [
  'Bison',
  'Moose',
  'Elk',
  'Coyote',
  'Black Bear',
]);
export const SOUTH_AMERICA_ANIMAL_VERIFY_GATES = continentGates('southAmericaAnimals', [
  'Llama',
  'Jaguar',
  'Capybara',
  'Tapir',
  'Guanaco',
]);
export const OCEANIA_ANIMAL_VERIFY_GATES = continentGates('oceaniaAnimals', [
  'Kangaroo',
  'Wallaby',
  'Dingo',
  'Emu',
  'Wombat',
]);

export interface GalleryExhibitFn {
  (x: number, z: number, title: string, sub: string, opts?: { pedestal?: boolean }): { x: number; z: number };
}

function coatForAnimal(id: string): CoatParams {
  if (id === 'horse') return GREY_DAPPLE_COAT;
  return CHESTNUT_COAT;
}

function installHorse(
  engine: Engine,
  seed: WorldSeed,
  exhibit: GalleryExhibitFn,
  rowZ: number,
  colIndex: number,
  lod: 0 | 1 | 2,
  label: string,
  subtitle: string,
  seedTag: string,
  scale: number,
): void {
  const x = GALLERY_X[colIndex] ?? 0;
  const coatParams = coatForAnimal(seedTag);
  const built = buildHorse(seed.rng(`animals/${seedTag}`), {
    lod,
    coat: coatParams.pattern,
  });
  const at = exhibit(x, rowZ, label, `${subtitle} · ${(built.tris / 1000).toFixed(1)}k tris`);
  const coat = coatBodyMaterial(coatParams);
  const body = new Mesh(built.body, coat);
  body.position.set(at.x, 0.42, at.z);
  body.scale.setScalar(scale);
  body.rotation.y = Math.PI * 0.92;
  body.castShadow = true;
  body.receiveShadow = true;
  engine.scene.add(body);
  if (built.mane) {
    const mane = new Mesh(built.mane, maneCardMaterial(coatParams));
    mane.position.copy(body.position);
    mane.rotation.copy(body.rotation);
    mane.scale.copy(body.scale);
    mane.castShadow = true;
    engine.scene.add(mane);
  }
}

function installSpecies(
  engine: Engine,
  seed: WorldSeed,
  exhibit: GalleryExhibitFn,
  rowZ: number,
  animalId: string,
  colIndex: number,
  lod: 0 | 1 | 2,
  label: string,
  subtitle: string,
  scale: number,
): void {
  const morph = getMorph(animalId);
  if (!morph) return;
  const x = GALLERY_X[colIndex] ?? 0;
  const built = buildSpecies(morph, seed.rng(`animals/${animalId}`), { lod });
  const at = exhibit(x, rowZ, label, `${subtitle} · ${(built.tris / 1000).toFixed(1)}k tris`);
  const body = new Mesh(built.body, coatBodyMaterial(morph.coat));
  body.position.set(at.x, 0.42, at.z);
  body.scale.setScalar(scale);
  body.rotation.y = Math.PI * 0.92;
  body.castShadow = true;
  body.receiveShadow = true;
  engine.scene.add(body);
}

/** Install the `animals` gallery row from the animal library catalog. */
export function installAnimalsGalleryRow(
  engine: Engine,
  seed: WorldSeed,
  exhibit: GalleryExhibitFn,
  rowZ: number,
): void {
  for (const animal of galleryAnimals('animals')) {
    const g = animal.gallery;
    if (!g) continue;
    installHorse(
      engine,
      seed,
      exhibit,
      rowZ,
      g.colIndex,
      g.lod,
      animal.label,
      g.subtitle,
      animal.id,
      g.scale,
    );
  }
}

function installContinentRow(
  row: AnimalGalleryRow,
  engine: Engine,
  seed: WorldSeed,
  exhibit: GalleryExhibitFn,
  rowZ: number,
): void {
  for (const animal of galleryAnimals(row)) {
    const g = animal.gallery;
    if (!g) continue;
    installSpecies(
      engine,
      seed,
      exhibit,
      rowZ,
      animal.id,
      g.colIndex,
      g.lod,
      animal.label,
      g.subtitle,
      g.scale,
    );
  }
}

export const installAfricaAnimalsGalleryRow = (
  e: Engine,
  s: WorldSeed,
  ex: GalleryExhibitFn,
  z: number,
): void => installContinentRow('africaAnimals', e, s, ex, z);
export const installAsiaAnimalsGalleryRow = (
  e: Engine,
  s: WorldSeed,
  ex: GalleryExhibitFn,
  z: number,
): void => installContinentRow('asiaAnimals', e, s, ex, z);
export const installEuropeAnimalsGalleryRow = (
  e: Engine,
  s: WorldSeed,
  ex: GalleryExhibitFn,
  z: number,
): void => installContinentRow('europeAnimals', e, s, ex, z);
export const installNorthAmericaAnimalsGalleryRow = (
  e: Engine,
  s: WorldSeed,
  ex: GalleryExhibitFn,
  z: number,
): void => installContinentRow('northAmericaAnimals', e, s, ex, z);
export const installSouthAmericaAnimalsGalleryRow = (
  e: Engine,
  s: WorldSeed,
  ex: GalleryExhibitFn,
  z: number,
): void => installContinentRow('southAmericaAnimals', e, s, ex, z);
export const installOceaniaAnimalsGalleryRow = (
  e: Engine,
  s: WorldSeed,
  ex: GalleryExhibitFn,
  z: number,
): void => installContinentRow('oceaniaAnimals', e, s, ex, z);
