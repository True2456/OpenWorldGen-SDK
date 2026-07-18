/**
 * Multi-species wandering pack — CPU locomotion on QuadrupedRigs (≤16).
 */

import type { Engine } from '../core/Engine';
import type { WorldSeed } from '../core/Seed';
import type { Heightfield } from '../world/Heightfield';
import {
  ALL_CONTINENT_ANIMAL_MORPHS,
  CONTINENT_ANIMAL_MORPHS,
  type AnimalContinentId,
} from './library/continent-animals';
import type { QuadrupedMorph } from './QuadrupedMorph';
import { buildAnimatedSpeciesRig, type QuadrupedRig, type WalkTelemetry } from './QuadrupedRig';

export interface PackTelemetry {
  animals: WalkTelemetry[];
  moving: boolean;
  continent: string;
}

interface PackAgent {
  rig: QuadrupedRig;
  morph: QuadrupedMorph;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  turn: number;
  wanderT: number;
}

export class AnimalPack {
  private agents: PackAgent[] = [];
  readonly continent: string;

  private constructor(continent: string) {
    this.continent = continent;
  }

  static spawn(
    engine: Engine,
    seed: WorldSeed,
    morphs: readonly QuadrupedMorph[],
    centerX: number,
    centerZ: number,
    radius: number,
    continentLabel: string,
  ): AnimalPack {
    const pack = new AnimalPack(continentLabel);
    const n = Math.min(morphs.length, 16);
    for (let i = 0; i < n; i++) {
      const morph = morphs[i]!;
      const rng = seed.rng(`pack/${continentLabel}/${morph.id}/${i}`);
      const rig = buildAnimatedSpeciesRig(morph, rng, 1);
      const a = rng.float() * Math.PI * 2;
      const r = radius * (0.3 + rng.float() * 0.6);
      const agent: PackAgent = {
        rig,
        morph,
        x: centerX + Math.cos(a) * r,
        z: centerZ + Math.sin(a) * r,
        yaw: a + Math.PI * 0.5,
        speed: (1.0 + rng.float() * 0.55) * (morph.locomotion === 'hop' ? 1.25 : 1),
        turn: 0,
        wanderT: rng.float() * 10,
      };
      // stagger vertical scale for mega fauna so they don't clip camera
      const sc = morph.withersM > 2.2 ? 0.85 : 1;
      agent.rig.root.scale.setScalar(sc);
      pack.agents.push(agent);
      engine.scene.add(rig.root);
    }
    return pack;
  }

  update(
    dt: number,
    groundY: (x: number, z: number) => number,
    groundTilt?: (x: number, z: number) => { pitch: number; roll: number },
  ): void {
    for (const a of this.agents) {
      a.wanderT += dt;
      a.turn += (Math.sin(a.wanderT * 0.7) * 0.4 - a.turn) * dt * 2.2;
      a.yaw += a.turn * dt;
      const vx = Math.sin(a.yaw) * a.speed;
      const vz = Math.cos(a.yaw) * a.speed;
      a.x += vx * dt;
      a.z += vz * dt;
      const gy = groundY(a.x, a.z);
      const tilt = groundTilt?.(a.x, a.z) ?? { pitch: 0, roll: 0 };
      a.rig.setPose(a.x, gy, a.z, a.yaw, tilt.pitch, tilt.roll);
      a.rig.tick(dt, a.speed);
    }
  }

  telemetry(): PackTelemetry {
    const animals = this.agents.map((a) => a.rig.telemetry(a.speed));
    const moving = animals.some((h) => h.speed > 0.5 && Math.abs(h.legSwing) > 0.05);
    return { animals, moving, continent: this.continent };
  }
}

export function spawnContinentPack(
  engine: Engine,
  seed: WorldSeed,
  continent: AnimalContinentId | 'all',
  centerX = 0,
  centerZ = 0,
  radius = 26,
): AnimalPack {
  const morphs =
    continent === 'all' ? ALL_CONTINENT_ANIMAL_MORPHS.slice(0, 12) : CONTINENT_ANIMAL_MORPHS[continent];
  return AnimalPack.spawn(engine, seed, morphs, centerX, centerZ, radius, continent);
}

export function installPackTelemetry(engine: Engine, pack: AnimalPack): void {
  engine.onUpdate(() => {
    const tel = pack.telemetry();
    (window as unknown as { __laasHerd?: PackTelemetry }).__laasHerd = tel;
    engine.stats.counters['herd.count'] = tel.animals.length;
    engine.stats.counters['herd.moving'] = tel.moving ? 1 : 0;
  });
}

export function installPackOnTerrain(
  engine: Engine,
  seed: WorldSeed,
  hf: Heightfield,
  continent: AnimalContinentId | 'all' = 'africa',
  center?: { x: number; z: number },
): AnimalPack {
  const cx = center?.x ?? 0;
  const cz = center?.z ?? 0;
  const pack = spawnContinentPack(engine, seed, continent, cx, cz, 28);
  engine.onUpdate((dt) => {
    pack.update(
      dt,
      (x, z) => hf.heightAtCpu(x, z),
      (x, z) => {
        const eps = 1.4;
        const sx = hf.heightAtCpu(x + eps, z) - hf.heightAtCpu(x - eps, z);
        const sz = hf.heightAtCpu(x, z + eps) - hf.heightAtCpu(x, z - eps);
        return { pitch: Math.atan2(-sx, eps * 2), roll: Math.atan2(sz, eps * 2) };
      },
    );
    const tel = pack.telemetry();
    (window as unknown as { __laasHerd?: PackTelemetry }).__laasHerd = tel;
    engine.stats.counters['herd.count'] = tel.animals.length;
    engine.stats.counters['herd.moving'] = tel.moving ? 1 : 0;
  });
  return pack;
}
