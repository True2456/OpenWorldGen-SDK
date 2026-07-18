/**
 * Gallery installation + visual verification gates for library plants.
 */

import { Mesh } from 'three';
import type { DataTexture } from 'three';
import type { BarkTextures } from '../../gpu/passes/BarkSynth';
import type { WorldSeed } from '../../core/Seed';
import type { Engine } from '../../core/Engine';
import {
  barkTexturedMaterial,
  flowerMaterial,
  foliageCardMaterial,
  foliageMaterial,
} from '../../render/VegMaterials';
import { buildAcacia, buildSavannaAcacia, ACACIA, SAVANNA_ACACIA } from '../Acacia';
import { buildAloe, aloeMaterial } from '../Aloe';
import { buildBaobab, buildBaobabHero, BAOBAB_META } from '../Baobab';
import { buildBambooGrove, BAMBOO_GROVE_META } from '../BambooGrove';
import { buildBanyan, BANYAN } from '../Banyan';
import { buildBonsaiPine, BONSAI_PINE } from '../BonsaiPine';
import { buildCattail } from '../Cattail';
import { buildCherryBlossom, CHERRY_BLOSSOM } from '../CherryBlossom';
import { buildClover } from '../Clover';
import { buildAspen, ASPEN } from '../Aspen';
import { buildAraucaria, ARAUCARIA } from '../Araucaria';
import { buildBanksia, BANKSIA } from '../Banksia';
import { buildBrazilNut, BRAZIL_NUT } from '../BrazilNut';
import { buildDouglasFir, DOUGLAS_FIR } from '../DouglasFir';
import { buildEnglishOak, ENGLISH_OAK } from '../EnglishOak';
import { buildEucalyptus, EUCALYPTUS } from '../Eucalyptus';
import { buildEuropeanBeech, EUROPEAN_BEECH } from '../EuropeanBeech';
import { buildFeverTree, FEVER_TREE } from '../FeverTree';
import { buildGinkgo, GINKGO } from '../Ginkgo';
import { buildHosta, hostaMaterial } from '../Hosta';
import { buildJacaranda, JACARANDA } from '../Jacaranda';
import { buildJoshuaTree, JOSHUA_TREE } from '../JoshuaTreeNA';
import { buildKapok, KAPOK } from '../Kapok';
import { buildKauri, KAURI } from '../Kauri';
import { buildLeadwood, LEADWOOD } from '../Leadwood';
import { buildLupine } from '../Lupine';
import { buildMarula, MARULA } from '../Marula';
import { buildOlive, OLIVE } from '../Olive';
import { buildProtea } from '../Protea';
import { buildRedwood, REDWOOD } from '../Redwood';
import { buildRhododendron, RHODODENDRON } from '../Rhododendron';
import { buildRubberTree, RUBBER_TREE } from '../RubberTree';
import { buildScotsPine, SCOTS_PINE } from '../ScotsPine';
import { buildSilverBirch, SILVER_BIRCH } from '../SilverBirch';
import { buildSpekboom, spekboomMaterial } from '../Spekboom';
import { buildSugarMaple, SUGAR_MAPLE } from '../SugarMaple';
import { buildTreeFern, TREE_FERN_META } from '../TreeFern';
import { buildWollemiPine, WOLLEMI_PINE } from '../WollemiPine';
import { galleryPlants } from './registry';
import type { PlantVerifyGate } from './types';

/** Pixel gates for `shots/profiles/new-plants-gate.png` — colIndex matches gallery pedestals */
export const NEW_PLANT_VERIFY_GATES: readonly PlantVerifyGate[] = [
  {
    plantId: 'rhododendron',
    name: 'Rhododendron',
    colIndex: 0,
    validate: (r, g, b) => r > 110 && b > 80 && g < r * 0.7 && g < b * 1.2,
    minPxCount: 150,
    description: 'Vibrant pink/magenta flowers',
  },
  {
    plantId: 'lupine',
    name: 'Lupine',
    colIndex: 1,
    validate: (r, g, b) => b > 80 && b > g * 1.2 && r > 40 && r < b * 1.3,
    minPxCount: 100,
    description: 'Blue/purple spike petals',
  },
  {
    plantId: 'cattail',
    name: 'Cattail',
    colIndex: 2,
    validate: (r, g, b) => r > 50 && r < 140 && g > 30 && g < r * 0.9 && b < g * 0.8 && b < 60,
    minPxCount: 80,
    description: 'Velvety dark brown seed heads',
  },
  {
    plantId: 'hosta',
    name: 'Hosta',
    colIndex: 3,
    validate: (r, g, b) => r > 170 && g > 165 && b > 140 && Math.abs(r - g) < 25 && Math.abs(g - b) < 35,
    minPxCount: 200,
    description: 'Creamy white leaf margins',
  },
  {
    plantId: 'clover',
    name: 'Clover',
    colIndex: 4,
    validate: (r, g, b) => r > 160 && g > 140 && b > 140 && r > g && g > b * 0.95,
    minPxCount: 80,
    description: 'White clover flower heads',
  },
];

const GALLERY_X = [-40, -20, 0, 20, 40] as const;

export interface GalleryExhibitFn {
  (x: number, z: number, title: string, sub: string, opts?: { pedestal?: boolean }): void;
}

/** Install the `newPlants` gallery row from the plant library catalog. */
export function installNewPlantsGalleryRow(
  engine: Engine,
  seed: WorldSeed,
  barks: Map<number, BarkTextures>,
  atlases: Map<string, DataTexture>,
  exhibit: GalleryExhibitFn,
  rowZ: number,
): void {
  const plants = galleryPlants('newPlants');

  for (const plant of plants) {
    const g = plant.gallery;
    if (!g) continue;
    const x = GALLERY_X[g.colIndex] ?? 0;
    const rng = seed.rng(`new/${plant.id}`);

    switch (plant.id) {
      case 'rhododendron': {
        const built = buildRhododendron(rng);
        const mesh = new Mesh(
          built.bark,
          barkTexturedMaterial(barks.get(RHODODENDRON.barkLayer) as BarkTextures),
        );
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        const atlas = atlases.get('rhododendron');
        if (built.foliage && atlas) {
          const fm = new Mesh(built.foliage, foliageCardMaterial(atlas, { color: RHODODENDRON.foliageColor }));
          fm.position.copy(mesh.position);
          fm.scale.copy(mesh.scale);
          fm.castShadow = true;
          fm.receiveShadow = true;
          engine.scene.add(fm);
        }
        break;
      }
      case 'lupine': {
        const geo = buildLupine(rng);
        const mesh = new Mesh(geo, flowerMaterial({ r: 0.28, g: 0.14, b: 0.65 }));
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        break;
      }
      case 'cattail': {
        const geo = buildCattail(rng);
        const mesh = new Mesh(geo, flowerMaterial({ r: 0.38, g: 0.22, b: 0.1 }));
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        break;
      }
      case 'hosta': {
        const geo = buildHosta(rng);
        const mesh = new Mesh(geo, hostaMaterial());
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        break;
      }
      case 'clover': {
        const geo = buildClover(rng);
        const mesh = new Mesh(geo, flowerMaterial({ r: 2.8, g: 1.8, b: 1.6 }));
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        break;
      }
      default:
        break;
    }

    exhibit(x, rowZ, plant.label, g.subtitle);
  }
}

/** Pixel gates for `shots/profiles/africa-plants-gate.png` */
export const AFRICA_PLANT_VERIFY_GATES: readonly PlantVerifyGate[] = [
  {
    plantId: 'savanna-acacia',
    name: 'Acacia',
    colIndex: 0,
    validate: (r, g, b) => g > 55 && g > r * 0.75 && g > b * 0.9 && r < 120,
    minPxCount: 120,
    description: 'Savanna green umbrella foliage',
  },
  {
    plantId: 'baobab',
    name: 'Baobab',
    colIndex: 1,
    validate: (r, g, b) => r > 70 && r < 175 && g > 45 && Math.abs(r - g) < 55 && b < g * 1.1,
    minPxCount: 150,
    description: 'Pale bottle trunk with crown foliage',
  },
  {
    plantId: 'king-protea',
    name: 'King Protea',
    colIndex: 2,
    validate: (r, g, b) => r > 100 && r > g * 1.05 && b > 45 && b < r * 1.1,
    minPxCount: 90,
    description: 'Pink protea bracts',
  },
  {
    plantId: 'aloe-vera',
    name: 'Aloe',
    colIndex: 3,
    validate: (r, g, b) => g > 50 && g > r * 1.05 && b > 25 && r < 95,
    minPxCount: 140,
    description: 'Blue-green succulent rosette',
  },
  {
    plantId: 'spekboom',
    name: 'Spekboom',
    colIndex: 4,
    validate: (r, g, b) => g > 45 && g > r * 0.85 && r < 130 && b < g * 1.05,
    minPxCount: 80,
    description: 'Jade succulent leaves',
  },
];

/** Install the `africaPlants` gallery row. */
export function installAfricaPlantsGalleryRow(
  engine: Engine,
  seed: WorldSeed,
  barks: Map<number, BarkTextures>,
  atlases: Map<string, DataTexture>,
  exhibit: GalleryExhibitFn,
  rowZ: number,
): void {
  const plants = galleryPlants('africaPlants');
  const baobabBarkLayer = 7; // joshua pale fibrous desert bark

  for (const plant of plants) {
    const g = plant.gallery;
    if (!g) continue;
    const x = GALLERY_X[g.colIndex] ?? 0;
    const rng = seed.rng(`africa/${plant.id}`);

    switch (plant.id) {
      case 'savanna-acacia': {
        const built = buildAcacia(rng);
        const barkTex = barks.get(ACACIA.barkLayer) as BarkTextures;
        const mesh = new Mesh(built.bark, barkTexturedMaterial(barkTex));
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        const atlas = atlases.get('acacia');
        if (built.foliage && atlas) {
          const fm = new Mesh(built.foliage, foliageCardMaterial(atlas, { color: ACACIA.foliageColor }));
          fm.position.copy(mesh.position);
          fm.scale.copy(mesh.scale);
          fm.castShadow = true;
          fm.receiveShadow = true;
          engine.scene.add(fm);
        }
        break;
      }
      case 'baobab': {
        const built = buildBaobab(rng);
        const barkTex = barks.get(baobabBarkLayer) as BarkTextures;
        const barkMesh = new Mesh(built.bark, barkTexturedMaterial(barkTex));
        barkMesh.position.set(x, 0.42, rowZ);
        barkMesh.scale.setScalar(g.scale);
        barkMesh.castShadow = true;
        barkMesh.receiveShadow = true;
        engine.scene.add(barkMesh);
        const folMesh = new Mesh(
          built.foliage,
          foliageMaterial({ color: { r: 0.07, g: 0.16, b: 0.05, hueVar: 0.18 } }),
        );
        folMesh.position.copy(barkMesh.position);
        folMesh.scale.copy(barkMesh.scale);
        folMesh.castShadow = true;
        folMesh.receiveShadow = true;
        engine.scene.add(folMesh);
        break;
      }
      case 'king-protea': {
        const geo = buildProtea(rng);
        const mesh = new Mesh(geo, flowerMaterial({ r: 1.35, g: 0.28, b: 0.55 }));
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        break;
      }
      case 'aloe-vera': {
        const geo = buildAloe(rng);
        const mesh = new Mesh(geo, aloeMaterial());
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        break;
      }
      case 'spekboom': {
        const geo = buildSpekboom(rng);
        const mesh = new Mesh(geo, spekboomMaterial());
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        break;
      }
      default:
        break;
    }

    exhibit(x, rowZ, plant.label, g.subtitle);
  }
}

/** Pixel gates for `shots/profiles/africa-trees-gate.png` */
export const AFRICA_TREE_VERIFY_GATES: readonly PlantVerifyGate[] = [
  {
    plantId: 'savanna-acacia',
    name: 'Umbrella Thorn',
    colIndex: 0,
    validate: (r, g, b) => g > 55 && g > r * 0.75 && g > b * 0.9 && r < 120,
    minPxCount: 120,
    description: 'Savanna green umbrella foliage',
  },
  {
    plantId: 'baobab',
    name: 'Baobab',
    colIndex: 1,
    validate: (r, g, b) => r > 70 && r < 175 && g > 45 && Math.abs(r - g) < 55 && b < g * 1.1,
    minPxCount: 150,
    description: 'Pale bottle trunk with crown foliage',
  },
  {
    plantId: 'fever-tree',
    name: 'Fever Tree',
    colIndex: 2,
    validate: (r, g, b) => g > 60 && g > r * 0.85 && r > 50 && b < g * 0.95,
    minPxCount: 100,
    description: 'Yellow-green bark and sparse crown',
  },
  {
    plantId: 'marula',
    name: 'Marula',
    colIndex: 3,
    validate: (r, g, b) => g > 50 && g > r * 0.8 && g > b && r < 110,
    minPxCount: 130,
    description: 'Olive-green round spreading crown',
  },
  {
    plantId: 'leadwood',
    name: 'Leadwood',
    colIndex: 4,
    validate: (r, g, b) => g > 35 && g > r * 0.7 && r < 90 && b < g,
    minPxCount: 110,
    description: 'Dense dark gnarled crown',
  },
];

/** Install the `africaTrees` gallery row — iconic African trees. */
export function installAfricaTreesGalleryRow(
  engine: Engine,
  seed: WorldSeed,
  barks: Map<number, BarkTextures>,
  atlases: Map<string, DataTexture>,
  exhibit: GalleryExhibitFn,
  rowZ: number,
): void {
  const plants = galleryPlants('africaTrees');

  for (const plant of plants) {
    const g = plant.gallery;
    if (!g) continue;
    const x = GALLERY_X[g.colIndex] ?? 0;
    const rng = seed.rng(`africa-tree/${plant.id}`);

    switch (plant.id) {
      case 'savanna-acacia': {
        const built = buildSavannaAcacia(rng);
        const barkTex = barks.get(SAVANNA_ACACIA.barkLayer) as BarkTextures;
        const mesh = new Mesh(built.bark, barkTexturedMaterial(barkTex));
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        const atlas = atlases.get('savanna-acacia');
        if (built.foliage && atlas) {
          const fm = new Mesh(
            built.foliage,
            foliageCardMaterial(atlas, { color: SAVANNA_ACACIA.foliageColor }),
          );
          fm.position.copy(mesh.position);
          fm.scale.copy(mesh.scale);
          fm.castShadow = true;
          fm.receiveShadow = true;
          engine.scene.add(fm);
        }
        break;
      }
      case 'baobab': {
        const built = buildBaobabHero(rng);
        const barkTex = barks.get(BAOBAB_META.barkLayer) as BarkTextures;
        const barkMesh = new Mesh(built.bark, barkTexturedMaterial(barkTex));
        barkMesh.position.set(x, 0.42, rowZ);
        barkMesh.scale.setScalar(g.scale);
        barkMesh.castShadow = true;
        barkMesh.receiveShadow = true;
        engine.scene.add(barkMesh);
        const folMesh = new Mesh(
          built.foliage,
          foliageMaterial({ color: BAOBAB_META.foliageColor }),
        );
        folMesh.position.copy(barkMesh.position);
        folMesh.scale.copy(barkMesh.scale);
        folMesh.castShadow = true;
        folMesh.receiveShadow = true;
        engine.scene.add(folMesh);
        break;
      }
      case 'fever-tree': {
        const built = buildFeverTree(rng);
        const barkTex = barks.get(FEVER_TREE.barkLayer) as BarkTextures;
        const mesh = new Mesh(built.bark, barkTexturedMaterial(barkTex));
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        const atlas = atlases.get('fever-tree');
        if (built.foliage && atlas) {
          const fm = new Mesh(
            built.foliage,
            foliageCardMaterial(atlas, { color: FEVER_TREE.foliageColor }),
          );
          fm.position.copy(mesh.position);
          fm.scale.copy(mesh.scale);
          fm.castShadow = true;
          fm.receiveShadow = true;
          engine.scene.add(fm);
        }
        break;
      }
      case 'marula': {
        const built = buildMarula(rng);
        const barkTex = barks.get(MARULA.barkLayer) as BarkTextures;
        const mesh = new Mesh(built.bark, barkTexturedMaterial(barkTex));
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        const atlas = atlases.get('marula');
        if (built.foliage && atlas) {
          const fm = new Mesh(
            built.foliage,
            foliageCardMaterial(atlas, { color: MARULA.foliageColor }),
          );
          fm.position.copy(mesh.position);
          fm.scale.copy(mesh.scale);
          fm.castShadow = true;
          fm.receiveShadow = true;
          engine.scene.add(fm);
        }
        break;
      }
      case 'leadwood': {
        const built = buildLeadwood(rng);
        const barkTex = barks.get(LEADWOOD.barkLayer) as BarkTextures;
        const mesh = new Mesh(built.bark, barkTexturedMaterial(barkTex));
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        const atlas = atlases.get('leadwood');
        if (built.foliage && atlas) {
          const fm = new Mesh(
            built.foliage,
            foliageCardMaterial(atlas, { color: LEADWOOD.foliageColor }),
          );
          fm.position.copy(mesh.position);
          fm.scale.copy(mesh.scale);
          fm.castShadow = true;
          fm.receiveShadow = true;
          engine.scene.add(fm);
        }
        break;
      }
      default:
        break;
    }

    exhibit(x, rowZ, plant.label, g.subtitle);
  }
}

/** Pixel gates for `shots/profiles/asia-trees-gate.png` */
export const ASIA_TREE_VERIFY_GATES: readonly PlantVerifyGate[] = [
  {
    plantId: 'cherry-blossom',
    name: 'Cherry Blossom',
    colIndex: 0,
    validate: (r, g, b) => r > 100 && r > g * 0.9 && b > 70 && g > 50,
    minPxCount: 100,
    description: 'Pink blossom crown',
  },
  {
    plantId: 'ginkgo',
    name: 'Ginkgo',
    colIndex: 1,
    validate: (r, g, b) => g > 50 && g > r * 0.75 && r > 40 && b < g,
    minPxCount: 110,
    description: 'Golden-green fan leaves',
  },
  {
    plantId: 'bonsai-pine',
    name: 'Bonsai Pine',
    colIndex: 2,
    validate: (r, g, b) => g > 40 && g > r * 0.8 && r < 100 && b < g,
    minPxCount: 100,
    description: 'Dark needle branch pads',
  },
  {
    plantId: 'banyan',
    name: 'Banyan',
    colIndex: 3,
    validate: (r, g, b) => g > 45 && g > r * 0.75 && r < 110 && b < g * 1.1,
    minPxCount: 120,
    description: 'Dark green spreading crown',
  },
  {
    plantId: 'bamboo-grove',
    name: 'Giant Bamboo',
    colIndex: 4,
    validate: (r, g, b) => g > 55 && g > r * 1.05 && r < 100 && b < g,
    minPxCount: 130,
    description: 'Bright green culm cluster',
  },
];

/** Install the `asiaTrees` gallery row — iconic Asian trees. */
export function installAsiaTreesGalleryRow(
  engine: Engine,
  seed: WorldSeed,
  barks: Map<number, BarkTextures>,
  atlases: Map<string, DataTexture>,
  exhibit: GalleryExhibitFn,
  rowZ: number,
): void {
  const plants = galleryPlants('asiaTrees');

  for (const plant of plants) {
    const g = plant.gallery;
    if (!g) continue;
    const x = GALLERY_X[g.colIndex] ?? 0;
    const rng = seed.rng(`asia-tree/${plant.id}`);

    switch (plant.id) {
      case 'cherry-blossom': {
        const built = buildCherryBlossom(rng);
        const barkTex = barks.get(CHERRY_BLOSSOM.barkLayer) as BarkTextures;
        const mesh = new Mesh(built.bark, barkTexturedMaterial(barkTex));
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        const atlas = atlases.get('cherry-blossom');
        if (built.foliage && atlas) {
          const fm = new Mesh(
            built.foliage,
            foliageCardMaterial(atlas, { color: CHERRY_BLOSSOM.foliageColor }),
          );
          fm.position.copy(mesh.position);
          fm.scale.copy(mesh.scale);
          fm.castShadow = true;
          fm.receiveShadow = true;
          engine.scene.add(fm);
        }
        break;
      }
      case 'ginkgo': {
        const built = buildGinkgo(rng);
        const barkTex = barks.get(GINKGO.barkLayer) as BarkTextures;
        const mesh = new Mesh(built.bark, barkTexturedMaterial(barkTex));
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        const atlas = atlases.get('ginkgo');
        if (built.foliage && atlas) {
          const fm = new Mesh(
            built.foliage,
            foliageCardMaterial(atlas, { color: GINKGO.foliageColor }),
          );
          fm.position.copy(mesh.position);
          fm.scale.copy(mesh.scale);
          fm.castShadow = true;
          fm.receiveShadow = true;
          engine.scene.add(fm);
        }
        break;
      }
      case 'bonsai-pine': {
        const built = buildBonsaiPine(rng);
        const barkTex = barks.get(BONSAI_PINE.barkLayer) as BarkTextures;
        const mesh = new Mesh(built.bark, barkTexturedMaterial(barkTex));
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        const atlas = atlases.get('bonsai-pine');
        if (built.foliage && atlas) {
          const fm = new Mesh(
            built.foliage,
            foliageCardMaterial(atlas, { color: BONSAI_PINE.foliageColor }),
          );
          fm.position.copy(mesh.position);
          fm.scale.copy(mesh.scale);
          fm.castShadow = true;
          fm.receiveShadow = true;
          engine.scene.add(fm);
        }
        break;
      }
      case 'banyan': {
        const built = buildBanyan(rng);
        const barkTex = barks.get(BANYAN.barkLayer) as BarkTextures;
        const mesh = new Mesh(built.bark, barkTexturedMaterial(barkTex));
        mesh.position.set(x, 0.42, rowZ);
        mesh.scale.setScalar(g.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        engine.scene.add(mesh);
        const atlas = atlases.get('banyan');
        if (built.foliage && atlas) {
          const fm = new Mesh(
            built.foliage,
            foliageCardMaterial(atlas, { color: BANYAN.foliageColor }),
          );
          fm.position.copy(mesh.position);
          fm.scale.copy(mesh.scale);
          fm.castShadow = true;
          fm.receiveShadow = true;
          engine.scene.add(fm);
        }
        break;
      }
      case 'bamboo-grove': {
        const built = buildBambooGrove(rng);
        const barkTex = barks.get(BAMBOO_GROVE_META.barkLayer) as BarkTextures;
        const barkMesh = new Mesh(built.bark, barkTexturedMaterial(barkTex));
        barkMesh.position.set(x, 0.42, rowZ);
        barkMesh.scale.setScalar(g.scale);
        barkMesh.castShadow = true;
        barkMesh.receiveShadow = true;
        engine.scene.add(barkMesh);
        const folMesh = new Mesh(
          built.foliage,
          foliageMaterial({ color: BAMBOO_GROVE_META.foliageColor }),
        );
        folMesh.position.copy(barkMesh.position);
        folMesh.scale.copy(barkMesh.scale);
        folMesh.castShadow = true;
        folMesh.receiveShadow = true;
        engine.scene.add(folMesh);
        break;
      }
      default:
        break;
    }

    exhibit(x, rowZ, plant.label, g.subtitle);
  }
}

/** Pixel gates for `shots/profiles/europe-trees-gate.png` */
export const EUROPE_TREE_VERIFY_GATES: readonly PlantVerifyGate[] = [
  {
    plantId: 'english-oak',
    name: 'English Oak',
    colIndex: 0,
    validate: (r, g, b) => g > 45 && g > r * 0.75 && r < 110 && b < g,
    minPxCount: 120,
    description: 'Broad green oak crown',
  },
  {
    plantId: 'silver-birch',
    name: 'Silver Birch',
    colIndex: 1,
    validate: (r, g, b) => r > 120 && g > 115 && b > 100 && Math.abs(r - g) < 30,
    minPxCount: 80,
    description: 'White bark slender crown',
  },
  {
    plantId: 'scots-pine',
    name: 'Scots Pine',
    colIndex: 2,
    validate: (r, g, b) => g > 40 && g > r * 0.8 && r < 100 && b < g,
    minPxCount: 100,
    description: 'Dark green pine needles',
  },
  {
    plantId: 'olive',
    name: 'Olive',
    colIndex: 3,
    validate: (r, g, b) => g > 45 && g > r * 0.85 && r < 105 && b < g,
    minPxCount: 90,
    description: 'Silvery-green olive foliage',
  },
  {
    plantId: 'european-beech',
    name: 'European Beech',
    colIndex: 4,
    validate: (r, g, b) => g > 50 && g > r * 0.8 && r < 115 && b < g,
    minPxCount: 130,
    description: 'Dense dome beech crown',
  },
];

/** Install the `europeTrees` gallery row — iconic European trees. */
export function installEuropeTreesGalleryRow(
  engine: Engine,
  seed: WorldSeed,
  barks: Map<number, BarkTextures>,
  atlases: Map<string, DataTexture>,
  exhibit: GalleryExhibitFn,
  rowZ: number,
): void {
  const plants = galleryPlants('europeTrees');
  const treeBuilders = [
    { id: 'english-oak', build: buildEnglishOak, sp: ENGLISH_OAK },
    { id: 'silver-birch', build: buildSilverBirch, sp: SILVER_BIRCH },
    { id: 'scots-pine', build: buildScotsPine, sp: SCOTS_PINE },
    { id: 'olive', build: buildOlive, sp: OLIVE },
    { id: 'european-beech', build: buildEuropeanBeech, sp: EUROPEAN_BEECH },
  ] as const;

  for (const plant of plants) {
    const g = plant.gallery;
    if (!g) continue;
    const x = GALLERY_X[g.colIndex] ?? 0;
    const rng = seed.rng(`europe-tree/${plant.id}`);
    const entry = treeBuilders.find((t) => t.id === plant.id);
    if (!entry) continue;

    const built = entry.build(rng);
    const barkTex = barks.get(entry.sp.barkLayer) as BarkTextures;
    const mesh = new Mesh(built.bark, barkTexturedMaterial(barkTex));
    mesh.position.set(x, 0.42, rowZ);
    mesh.scale.setScalar(g.scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    engine.scene.add(mesh);
    const atlas = atlases.get(entry.sp.id);
    if (built.foliage && atlas) {
      const fm = new Mesh(
        built.foliage,
        foliageCardMaterial(atlas, { color: entry.sp.foliageColor }),
      );
      fm.position.copy(mesh.position);
      fm.scale.copy(mesh.scale);
      fm.castShadow = true;
      fm.receiveShadow = true;
      engine.scene.add(fm);
    }

    exhibit(x, rowZ, plant.label, g.subtitle);
  }
}

type CardTreeEntry = {
  id: string;
  build: (rng: import('../../core/Seed').Rng) => { bark: import('three').BufferGeometry; foliage: import('three').BufferGeometry | null };
  sp: import('../VegTypes').SpeciesParams;
};

function installCardTreeRow(
  engine: Engine,
  seed: WorldSeed,
  barks: Map<number, BarkTextures>,
  atlases: Map<string, DataTexture>,
  exhibit: GalleryExhibitFn,
  rowZ: number,
  rowKey: 'northAmericaTrees' | 'southAmericaTrees' | 'oceaniaTrees',
  builders: readonly CardTreeEntry[],
  custom?: Record<string, (rng: import('../../core/Seed').Rng, x: number, g: { scale: number }) => void>,
): void {
  const plants = galleryPlants(rowKey);
  for (const plant of plants) {
    const g = plant.gallery;
    if (!g) continue;
    const x = GALLERY_X[g.colIndex] ?? 0;
    const rng = seed.rng(`${rowKey}/${plant.id}`);
    if (custom?.[plant.id]) {
      custom[plant.id]!(rng, x, g);
      exhibit(x, rowZ, plant.label, g.subtitle);
      continue;
    }
    const entry = builders.find((t) => t.id === plant.id);
    if (!entry) continue;
    const built = entry.build(rng);
    const mesh = new Mesh(built.bark, barkTexturedMaterial(barks.get(entry.sp.barkLayer) as BarkTextures));
    mesh.position.set(x, 0.42, rowZ);
    mesh.scale.setScalar(g.scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    engine.scene.add(mesh);
    const atlas = atlases.get(entry.sp.id);
    if (built.foliage && atlas) {
      const fm = new Mesh(built.foliage, foliageCardMaterial(atlas, { color: entry.sp.foliageColor }));
      fm.position.copy(mesh.position);
      fm.scale.copy(mesh.scale);
      fm.castShadow = true;
      fm.receiveShadow = true;
      engine.scene.add(fm);
    }
    exhibit(x, rowZ, plant.label, g.subtitle);
  }
}

export const NORTH_AMERICA_TREE_VERIFY_GATES: readonly PlantVerifyGate[] = [
  { plantId: 'sugar-maple', name: 'Sugar Maple', colIndex: 0, validate: (r, g, b) => g > 50 && g > r * 0.8 && r < 115 && b < g, minPxCount: 110, description: 'Green dome maple crown' },
  { plantId: 'douglas-fir', name: 'Douglas Fir', colIndex: 1, validate: (r, g, b) => g > 40 && g > r * 0.8 && r < 100 && b < g, minPxCount: 100, description: 'Soft needle fir crown' },
  { plantId: 'joshua-tree', name: 'Joshua Tree', colIndex: 2, validate: (r, g, b) => g > 45 && g > r * 0.85 && r < 110 && b < g, minPxCount: 90, description: 'Desert yucca spikes' },
  { plantId: 'redwood', name: 'Redwood', colIndex: 3, validate: (r, g, b) => g > 35 && g > r * 0.75 && r < 100 && b < g, minPxCount: 80, description: 'High sparse redwood crown' },
  { plantId: 'aspen', name: 'Aspen', colIndex: 4, validate: (r, g, b) => g > 50 && g > r * 0.85 && r < 120 && b < g, minPxCount: 100, description: 'Golden quaking leaves' },
];

export function installNorthAmericaTreesGalleryRow(
  engine: Engine, seed: WorldSeed, barks: Map<number, BarkTextures>, atlases: Map<string, DataTexture>, exhibit: GalleryExhibitFn, rowZ: number,
): void {
  installCardTreeRow(engine, seed, barks, atlases, exhibit, rowZ, 'northAmericaTrees', [
    { id: 'sugar-maple', build: buildSugarMaple, sp: SUGAR_MAPLE },
    { id: 'douglas-fir', build: buildDouglasFir, sp: DOUGLAS_FIR },
    { id: 'joshua-tree', build: buildJoshuaTree, sp: JOSHUA_TREE },
    { id: 'redwood', build: buildRedwood, sp: REDWOOD },
    { id: 'aspen', build: buildAspen, sp: ASPEN },
  ]);
}

export const SOUTH_AMERICA_TREE_VERIFY_GATES: readonly PlantVerifyGate[] = [
  { plantId: 'brazil-nut', name: 'Brazil Nut', colIndex: 0, validate: (r, g, b) => g > 45 && g > r * 0.75 && r < 110 && b < g, minPxCount: 100, description: 'Jungle emergent crown' },
  { plantId: 'kapok', name: 'Kapok', colIndex: 1, validate: (r, g, b) => g > 40 && g > r * 0.75 && r < 105 && b < g, minPxCount: 100, description: 'Massive jungle canopy' },
  { plantId: 'jacaranda', name: 'Jacaranda', colIndex: 2, validate: (r, g, b) => b > 60 && b > g * 0.9 && r > 40, minPxCount: 80, description: 'Violet blossom crown' },
  { plantId: 'rubber-tree', name: 'Rubber Tree', colIndex: 3, validate: (r, g, b) => g > 45 && g > r * 0.8 && r < 110 && b < g, minPxCount: 100, description: 'Glossy jungle oval crown' },
  { plantId: 'araucaria', name: 'Araucaria', colIndex: 4, validate: (r, g, b) => g > 40 && g > r * 0.8 && r < 100 && b < g, minPxCount: 100, description: 'Tiered conifer silhouette' },
];

export function installSouthAmericaTreesGalleryRow(
  engine: Engine, seed: WorldSeed, barks: Map<number, BarkTextures>, atlases: Map<string, DataTexture>, exhibit: GalleryExhibitFn, rowZ: number,
): void {
  installCardTreeRow(engine, seed, barks, atlases, exhibit, rowZ, 'southAmericaTrees', [
    { id: 'brazil-nut', build: buildBrazilNut, sp: BRAZIL_NUT },
    { id: 'kapok', build: buildKapok, sp: KAPOK },
    { id: 'jacaranda', build: buildJacaranda, sp: JACARANDA },
    { id: 'rubber-tree', build: buildRubberTree, sp: RUBBER_TREE },
    { id: 'araucaria', build: buildAraucaria, sp: ARAUCARIA },
  ]);
}

export const OCEANIA_TREE_VERIFY_GATES: readonly PlantVerifyGate[] = [
  { plantId: 'eucalyptus', name: 'Eucalyptus', colIndex: 0, validate: (r, g, b) => g > 45 && g > r * 0.85 && r < 105 && b < g, minPxCount: 100, description: 'Blue-gum dangling crown' },
  { plantId: 'kauri', name: 'Kauri', colIndex: 1, validate: (r, g, b) => g > 40 && g > r * 0.8 && r < 100 && b < g, minPxCount: 90, description: 'Dome conifer crown' },
  { plantId: 'tree-fern', name: 'Tree Fern', colIndex: 2, validate: (r, g, b) => g > 50 && g > r * 1.0 && r < 95 && b < g, minPxCount: 80, description: 'Radiating green fronds' },
  { plantId: 'banksia', name: 'Banksia', colIndex: 3, validate: (r, g, b) => r > 80 && r > g * 0.9 && g > 40 && b < r, minPxCount: 70, description: 'Orange cone spikes' },
  { plantId: 'wollemi-pine', name: 'Wollemi Pine', colIndex: 4, validate: (r, g, b) => g > 40 && g > r * 0.8 && r < 100 && b < g, minPxCount: 90, description: 'Prehistoric flat sprays' },
];

export function installOceaniaTreesGalleryRow(
  engine: Engine, seed: WorldSeed, barks: Map<number, BarkTextures>, atlases: Map<string, DataTexture>, exhibit: GalleryExhibitFn, rowZ: number,
): void {
  installCardTreeRow(engine, seed, barks, atlases, exhibit, rowZ, 'oceaniaTrees', [
    { id: 'eucalyptus', build: buildEucalyptus, sp: EUCALYPTUS },
    { id: 'kauri', build: buildKauri, sp: KAURI },
    { id: 'banksia', build: buildBanksia, sp: BANKSIA },
    { id: 'wollemi-pine', build: buildWollemiPine, sp: WOLLEMI_PINE },
  ], {
    'tree-fern': (rng, x, g) => {
      const built = buildTreeFern(rng);
      const barkMesh = new Mesh(built.bark, barkTexturedMaterial(barks.get(TREE_FERN_META.barkLayer) as BarkTextures));
      barkMesh.position.set(x, 0.42, rowZ);
      barkMesh.scale.setScalar(g.scale);
      barkMesh.castShadow = true;
      barkMesh.receiveShadow = true;
      engine.scene.add(barkMesh);
      const folMesh = new Mesh(built.foliage, foliageMaterial({ color: TREE_FERN_META.foliageColor }));
      folMesh.position.copy(barkMesh.position);
      folMesh.scale.copy(barkMesh.scale);
      folMesh.castShadow = true;
      folMesh.receiveShadow = true;
      engine.scene.add(folMesh);
    },
  });
}
