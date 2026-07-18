/**
 * Animated horse rig — body mesh + 4 two-bone leg chains (CPU walk cycle, ≤16 instances).
 */

import { BufferGeometry, Group, Mesh, Object3D, Vector3 } from 'three';
import type { Rng } from '../core/Seed';
import type { CoatParams } from './AnimalMaterials';
import { coatBodyMaterial, maneCardMaterial } from './AnimalMaterials';
import { buildHorse } from './Horse';
import { buildHorseLegParts } from './HorseLeg';

export interface HorseWalkTelemetry {
  x: number;
  z: number;
  yaw: number;
  phase: number;
  legSwing: number;
  speed: number;
}

const LEG_PHASE = [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5] as const;
const LEG_FRONT = [true, true, false, false] as const;

interface LegChain {
  hip: Object3D;
  knee: Object3D;
}

export class HorseRig {
  readonly root = new Group();
  private bodyMesh: Mesh;
  private maneMesh: Mesh | null;
  private legs: LegChain[];
  phase = 0;
  legSwing = 0;

  private constructor(bodyMesh: Mesh, maneMesh: Mesh | null, legs: LegChain[]) {
    this.bodyMesh = bodyMesh;
    this.maneMesh = maneMesh;
    this.legs = legs;
    this.root.add(bodyMesh);
    if (maneMesh) this.root.add(maneMesh);
    for (const leg of legs) this.root.add(leg.hip);
  }

  static create(
    body: BufferGeometry,
    mane: BufferGeometry | null,
    legParts: readonly { upper: BufferGeometry; lower: BufferGeometry; kneeLocal: Vector3 }[],
    coat: CoatParams,
    hipLocals: readonly Vector3[],
  ): HorseRig {
    const bodyMat = coatBodyMaterial(coat);
    const bodyMesh = new Mesh(body, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;

    let maneMesh: Mesh | null = null;
    if (mane) {
      maneMesh = new Mesh(mane, maneCardMaterial(coat));
      maneMesh.castShadow = true;
    }

    const legs: LegChain[] = [];
    for (let i = 0; i < 4; i++) {
      const part = legParts[i]!;
      const hip = new Object3D();
      hip.position.copy(hipLocals[i]!);
      const upper = new Mesh(part.upper, bodyMat);
      upper.castShadow = true;
      hip.add(upper);

      const knee = new Object3D();
      knee.position.copy(part.kneeLocal);
      const lower = new Mesh(part.lower, bodyMat);
      lower.castShadow = true;
      knee.add(lower);
      hip.add(knee);
      legs.push({ hip, knee });
    }

    return new HorseRig(bodyMesh, maneMesh, legs);
  }

  setPose(x: number, y: number, z: number, yaw: number, pitch = 0, roll = 0): void {
    this.root.position.set(x, y, z);
    this.root.rotation.set(pitch, yaw, roll, 'YXZ');
  }

  tick(dt: number, speed: number): void {
    const stride = speed > 0.05 ? speed * 5.2 : 0.6;
    this.phase += dt * stride;
    const t = this.phase;
    this.legSwing = Math.sin(t);

    const bob = speed > 0.05 ? Math.abs(Math.sin(t * 2)) * 0.028 : Math.sin(t * 0.8) * 0.006;
    this.bodyMesh.position.y = bob;
    if (this.maneMesh) this.maneMesh.position.y = bob;

    const swingAmp = speed > 0.05 ? 0.38 : 0.04;
    const kneeAmp = speed > 0.05 ? 0.52 : 0.06;
    for (let i = 0; i < 4; i++) {
      const { hip, knee } = this.legs[i]!;
      const legT = t + LEG_PHASE[i]!;
      const sinT = Math.sin(legT);
      hip.rotation.x = sinT * swingAmp;
      hip.rotation.z = Math.cos(legT) * swingAmp * 0.1;
      // knee flexes on back-swing / lift phase
      const lift = Math.max(0, -sinT);
      knee.rotation.x = -(lift * kneeAmp + 0.06);
    }
  }

  telemetry(speed: number): HorseWalkTelemetry {
    return {
      x: this.root.position.x,
      z: this.root.position.z,
      yaw: this.root.rotation.y,
      phase: this.phase,
      legSwing: this.legSwing,
      speed,
    };
  }
}

export const HORSE_HIP_LOCALS = (s: number): Vector3[] => [
  new Vector3(-0.21 * s, 1.02 * s, 0.3 * s),
  new Vector3(0.21 * s, 1.02 * s, 0.3 * s),
  new Vector3(-0.23 * s, 0.98 * s, -0.24 * s),
  new Vector3(0.23 * s, 0.98 * s, -0.24 * s),
];

export function buildAnimatedHorseRig(
  rng: Rng,
  coat: CoatParams,
  lod: 0 | 1 | 2,
): HorseRig {
  const built = buildHorse(rng, { lod, coat: coat.pattern, rigged: true });
  const s = built.height / 1.38;
  const ring = lod === 0 ? 10 : lod === 1 ? 7 : 5;
  const hue = rng.float() * 2 - 1;
  const phase = rng.float() * Math.PI * 2;
  const legParts = LEG_FRONT.map((front, i) =>
    buildHorseLegParts(front, s, ring, hue, phase + i * 0.3, 0.48),
  );
  return HorseRig.create(built.body, built.mane, legParts, coat, HORSE_HIP_LOCALS(s));
}
