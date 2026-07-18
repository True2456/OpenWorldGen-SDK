/**
 * Small wandering herd — CPU walk cycle on animated rigs (≤12 horses).
 */

import type { Heightfield } from '../world/Heightfield';
import type { Engine } from '../core/Engine';
import type { WorldSeed } from '../core/Seed';
import { CHESTNUT_COAT, GREY_DAPPLE_COAT } from './AnimalMaterials';
import { buildAnimatedHorseRig, type HorseRig, type HorseWalkTelemetry } from './HorseRig';

export interface HerdTelemetry {
  horses: HorseWalkTelemetry[];
  moving: boolean;
}

interface HerdAgent {
  rig: HorseRig;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  turn: number;
  wanderT: number;
}

export class AnimalHerd {
  private agents: HerdAgent[] = [];

  static spawn(
    engine: Engine,
    seed: WorldSeed,
    count: number,
    centerX: number,
    centerZ: number,
    radius: number,
  ): AnimalHerd {
    const herd = new AnimalHerd();
    for (let i = 0; i < count; i++) {
      const rng = seed.rng(`herd/horse/${i}`);
      const coat = i === 0 ? GREY_DAPPLE_COAT : CHESTNUT_COAT;
      const rig = buildAnimatedHorseRig(rng, coat, 1);
      const a = rng.float() * Math.PI * 2;
      const r = radius * (0.35 + rng.float() * 0.55);
      const agent: HerdAgent = {
        rig,
        x: centerX + Math.cos(a) * r,
        z: centerZ + Math.sin(a) * r,
        yaw: a + Math.PI * 0.5,
        speed: 1.2 + rng.float() * 0.5,
        turn: 0,
        wanderT: rng.float() * 10,
      };
      herd.agents.push(agent);
      engine.scene.add(rig.root);
    }
    return herd;
  }

  update(dt: number, groundY: (x: number, z: number) => number, groundTilt?: (x: number, z: number) => { pitch: number; roll: number }): void {
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

  telemetry(): HerdTelemetry {
    const horses = this.agents.map((a) => a.rig.telemetry(a.speed));
    const moving = horses.some((h) => h.speed > 0.5 && Math.abs(h.legSwing) > 0.05);
    return { horses, moving };
  }
}

export function installHerdOnTerrain(
  engine: Engine,
  seed: WorldSeed,
  hf: Heightfield,
  center?: { x: number; z: number },
): AnimalHerd {
  const cx = center?.x ?? 0;
  const cz = center?.z ?? 0;
  const herd = AnimalHerd.spawn(engine, seed, 4, cx, cz, 28);
  engine.onUpdate((dt) => {
    herd.update(dt, (x, z) => hf.heightAtCpu(x, z), (x, z) => {
      const eps = 1.4;
      const sx = hf.heightAtCpu(x + eps, z) - hf.heightAtCpu(x - eps, z);
      const sz = hf.heightAtCpu(x, z + eps) - hf.heightAtCpu(x, z - eps);
      return { pitch: Math.atan2(-sx, eps * 2), roll: Math.atan2(sz, eps * 2) };
    });
    const tel = herd.telemetry();
    (window as unknown as { __laasHerd?: HerdTelemetry }).__laasHerd = tel;
    engine.stats.counters['herd.count'] = tel.horses.length;
    engine.stats.counters['herd.moving'] = tel.moving ? 1 : 0;
  });
  return herd;
}
