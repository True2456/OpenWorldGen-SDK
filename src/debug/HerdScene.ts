/**
 * ?scene=herd — walking pack meadow (horses by default; ?continent= for packs).
 */

import { CircleGeometry, Mesh, Vector3 } from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { vec3 } from 'three/tsl';
import { AnimalHerd } from '../animals/AnimalHerd';
import { spawnContinentPack, type PackTelemetry } from '../animals/AnimalPack';
import type { AnimalContinentId } from '../animals/library/continent-animals';
import { meadowHeight, meadowNormal } from '../animals/meadowGround';
import { PostStack } from '../render/PostStack';
import { setupSunShadows } from '../render/ShadowSetup';
import { updateSunUniforms } from '../render/VegMaterials';
import { SunSky } from '../sky/SunSky';
import type { WorldContext } from './Scenes';

const CONTINENTS = new Set<AnimalContinentId>([
  'africa',
  'asia',
  'europe',
  'northAmerica',
  'southAmerica',
  'oceania',
]);

function buildMeadowMesh(seed: number): Mesh {
  const segs = 56;
  const radius = 180;
  const geo = new CircleGeometry(radius, segs);
  const pos = geo.attributes.position!;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getY(i);
    pos.setZ(i, meadowHeight(x, z, seed));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const groundMat = new MeshStandardNodeMaterial();
  groundMat.colorNode = vec3(0.14, 0.17, 0.1);
  groundMat.roughness = 0.94;
  const ground = new Mesh(geo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  return ground;
}

function publishHerdAlias(tel: PackTelemetry): void {
  const horses = tel.animals;
  (window as unknown as { __laasHerd?: PackTelemetry & { horses: typeof horses } }).__laasHerd = {
    ...tel,
    horses,
  };
}

export async function buildHerdScene(ctx: WorldContext): Promise<void> {
  const { engine, params, seed } = ctx;
  const meadowSeed = seed.sub('meadow');
  const q = new URLSearchParams(window.location.search);
  const continentRaw = q.get('continent') ?? '';
  const continent = CONTINENTS.has(continentRaw as AnimalContinentId)
    ? (continentRaw as AnimalContinentId)
    : null;

  ctx.progress(0.1, 'herd: sky');
  const sunSky = new SunSky(engine, params.timeOfDay);
  await sunSky.init(engine.renderer);
  updateSunUniforms(sunSky.sun);
  setupSunShadows(sunSky.sun, engine.camera, undefined, { maxFar: 120, lightMargin: 40 });

  engine.scene.add(buildMeadowMesh(meadowSeed));

  const groundY = (x: number, z: number) => meadowHeight(x, z, meadowSeed);
  const groundTilt = (x: number, z: number) => meadowNormal(x, z, meadowSeed);

  if (continent) {
    ctx.progress(0.5, `herd: ${continent} pack`);
    const pack = spawnContinentPack(engine, seed, continent, 0, 0, 24);
    engine.onUpdate((dt) => {
      pack.update(dt, groundY, groundTilt);
      const tel = pack.telemetry();
      publishHerdAlias(tel);
      engine.stats.counters['herd.count'] = tel.animals.length;
      engine.stats.counters['herd.moving'] = tel.moving ? 1 : 0;
    });
  } else {
    ctx.progress(0.5, 'herd: spawning horses');
    const herd = AnimalHerd.spawn(engine, seed, 3, 0, 0, 22);
    engine.onUpdate((dt) => {
      herd.update(dt, groundY, groundTilt);
      const tel = herd.telemetry();
      (window as unknown as { __laasHerd?: typeof tel }).__laasHerd = tel;
      engine.stats.counters['herd.count'] = tel.horses.length;
      engine.stats.counters['herd.moving'] = tel.moving ? 1 : 0;
    });
  }

  ctx.progress(0.85, 'herd: post');
  const post = new PostStack(engine, sunSky.atmosphere, params.timeOfDay, null);
  engine.post = post;

  engine.camera.position.set(0, continent ? 12 : 8, continent ? 48 : 38);
  engine.camera.lookAt(new Vector3(0, continent ? 2.4 : 1.8, 0));

  ctx.hooks.groundProbe = (x, z) => ({ ground: groundY(x, z), water: -1000 });
  ctx.progress(1, 'ready');
}
