/**
 * ?scene=drone — soft-vehicle quad on a meadow, optional pymavlink bridge.
 *
 * Bridge:
 *   tools/mavlink/.venv/bin/python tools/mavlink/soft_vehicle.py
 * Then:
 *   ?scene=drone&mav=1
 * Connect Mission Planner / QGC to UDP 14550.
 *
 * Keyboard RC (browser): I/K pitch, J/L roll, U/O yaw, R/F throttle,
 * B arm, M mode, T takeoff, G land. Click to look (pointer lock).
 */

import { CircleGeometry, Mesh, Vector3 } from 'three';
import { meadowHeight } from '../animals/meadowGround';
import type { Engine } from '../core/Engine';
import { KeyboardRc } from '../drone/KeyboardRc';
import { MavlinkClient } from '../drone/MavlinkClient';
import { QuadFlight } from '../drone/QuadFlight';
import { buildQuadcopter } from '../drone/QuadMesh';
import { PostStack } from '../render/PostStack';
import { setupSunShadows } from '../render/ShadowSetup';
import { updateSunUniforms } from '../render/VegMaterials';
import { SunSky } from '../sky/SunSky';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { vec3 } from 'three/tsl';
import type { WorldContext } from './Scenes';

function buildMeadowMesh(seed: number): Mesh {
  const segs = 64;
  const radius = 220;
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
  groundMat.colorNode = vec3(0.13, 0.16, 0.09);
  groundMat.roughness = 0.94;
  const ground = new Mesh(geo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  return ground;
}

function mavUrlFromQuery(): string | null {
  const q = new URLSearchParams(window.location.search);
  if (q.get('mav') !== '1' && !q.get('mavUrl')) return null;
  return q.get('mavUrl') ?? 'ws://127.0.0.1:8765';
}

function followCam(engine: Engine, flight: QuadFlight, dt: number): void {
  const f = flight;
  const back = 6.5;
  const up = 2.4;
  const fx = Math.sin(f.yaw);
  const fz = Math.cos(f.yaw);
  const tx = f.pos.x - fx * back;
  const ty = f.pos.y + up;
  const tz = f.pos.z - fz * back;
  const cam = engine.camera.position;
  const k = 1 - Math.exp(-3.2 * dt);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
  cam.z += (tz - cam.z) * k;
  engine.camera.lookAt(f.pos.x, f.pos.y + 0.2, f.pos.z);
}

export async function buildDroneScene(ctx: WorldContext): Promise<void> {
  const { engine, params, seed, hooks } = ctx;
  const meadowSeed = seed.sub('drone-meadow');

  ctx.progress(0.1, 'drone: sky');
  const sunSky = new SunSky(engine, params.timeOfDay);
  await sunSky.init(engine.renderer);
  updateSunUniforms(sunSky.sun);
  setupSunShadows(sunSky.sun, engine.camera, undefined, { maxFar: 140, lightMargin: 50 });

  engine.scene.add(buildMeadowMesh(meadowSeed));

  const groundY = (x: number, z: number) => meadowHeight(x, z, meadowSeed);

  ctx.progress(0.45, 'drone: building quad');
  const built = buildQuadcopter();
  engine.scene.add(built.root);

  // Blue Mountains–ish default home (matches soft_vehicle.py defaults)
  const q = new URLSearchParams(window.location.search);
  const homeLat = Number(q.get('lat') ?? -33.732);
  const homeLon = Number(q.get('lon') ?? 150.28);
  const homeAlt = Number(q.get('alt') ?? 980);

  const flight = new QuadFlight(built.root, built.props, {
    lat: homeLat,
    lon: homeLon,
    altAmsl: homeAlt,
  });
  flight.groundY = groundY;
  const gy0 = groundY(0, 0);
  flight.setPose(0, gy0 + 0.12, 0, 0);

  const kb = new KeyboardRc(flight);
  const mavUrl = mavUrlFromQuery();
  let mav: MavlinkClient | null = null;
  let mavStatus = mavUrl ? 'waiting for bridge' : 'keyboard only';
  let telemAcc = 0;

  if (mavUrl) {
    mav = new MavlinkClient({
      url: mavUrl,
      onCommand: (cmd) => flight.applyCommand(cmd),
      onStatus: (s) => {
        mavStatus = s.detail;
      },
    });
    mav.start();
    // publish home once connected via state packets
    mav.sendState({ ...flight.telemetry(), set_home: true });
  }

  engine.onUpdate((dt) => {
    kb.poll();
    flight.update(dt);
    followCam(engine, flight, dt);

    telemAcc += dt;
    if (mav && telemAcc >= 0.05) {
      telemAcc = 0;
      mav.sendState(flight.telemetry() as unknown as Record<string, unknown>);
    }

    const tel = flight.telemetry();
    (window as unknown as { __laasDrone?: typeof tel & { mav: string; tris: number } }).__laasDrone = {
      ...tel,
      mav: mavStatus,
      tris: built.tris,
    };
    engine.stats.counters['drone.armed'] = tel.armed ? 1 : 0;
    engine.stats.counters['drone.alt'] = Math.round(tel.alt_rel * 10) / 10;
    engine.stats.counters['drone.tris'] = built.tris;
  });

  const help = document.createElement('div');
  help.style.cssText = [
    'position:fixed',
    'bottom:12px',
    'left:12px',
    'z-index:900',
    'color:#d9e8e0',
    'background:rgba(8,12,10,0.55)',
    'padding:8px 10px',
    'font:11px/1.45 ui-monospace,Menlo,monospace',
    'border-radius:4px',
    'pointer-events:none',
    'max-width:440px',
  ].join(';');
  document.body.appendChild(help);
  engine.onUpdate(() => {
    const d = (window as unknown as { __laasDrone?: { armed: boolean; mode: string; alt_rel: number; mav: string } })
      .__laasDrone;
    if (!d) return;
    help.textContent =
      `DRONE  ${d.armed ? 'ARMED' : 'disarmed'}  ${d.mode}  AGL ${d.alt_rel.toFixed(1)}m  [${d.mav}]\n` +
      'B arm · T takeoff · G land · M mode · I/K pitch · J/L roll · U/O yaw · R/F throttle';
  });

  ctx.progress(0.85, 'drone: post');
  const post = new PostStack(engine, sunSky.atmosphere, params.timeOfDay, null);
  engine.post = post;

  engine.camera.position.set(0, gy0 + 4, 10);
  engine.camera.lookAt(new Vector3(0, gy0 + 0.5, 0));

  hooks.groundProbe = (x, z) => ({ ground: groundY(x, z), water: -1000 });
  hooks.disableFlyCam = true;

  ctx.progress(1, 'drone ready');
}
