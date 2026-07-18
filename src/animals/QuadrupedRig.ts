/**
 * Animated quadruped / biped / hop rig — CPU locomotion (≤16 instances).
 */

import { BufferGeometry, Group, Mesh, Object3D, Vector3 } from 'three';
import type { Rng } from '../core/Seed';
import type { CoatParams } from './AnimalMaterials';
import { coatBodyMaterial } from './AnimalMaterials';
import { buildLimbParts } from './LimbParts';
import type { LocomotionMode, QuadrupedMorph } from './QuadrupedMorph';
import { buildSpecies } from './SpeciesBuilder';

export interface WalkTelemetry {
  id: string;
  x: number;
  z: number;
  yaw: number;
  phase: number;
  legSwing: number;
  speed: number;
}

interface LegChain {
  hip: Object3D;
  knee: Object3D;
}

const QUAD_PHASE = [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5] as const;

export class QuadrupedRig {
  readonly root = new Group();
  readonly id: string;
  private bodyMesh: Mesh;
  private legs: LegChain[];
  private mode: LocomotionMode;
  private strideMul: number;
  private swingAmp: number;
  private bobAmp: number;
  phase = 0;
  legSwing = 0;

  private constructor(
    id: string,
    bodyMesh: Mesh,
    legs: LegChain[],
    mode: LocomotionMode,
    strideMul: number,
    swingAmp: number,
    bobAmp: number,
  ) {
    this.id = id;
    this.bodyMesh = bodyMesh;
    this.legs = legs;
    this.mode = mode;
    this.strideMul = strideMul;
    this.swingAmp = swingAmp;
    this.bobAmp = bobAmp;
    this.root.add(bodyMesh);
    for (const leg of legs) this.root.add(leg.hip);
  }

  static create(
    morph: QuadrupedMorph,
    body: BufferGeometry,
    legParts: readonly { upper: BufferGeometry; lower: BufferGeometry; kneeLocal: Vector3 }[],
    coat: CoatParams,
    hipLocals: readonly Vector3[],
  ): QuadrupedRig {
    const bodyMat = coatBodyMaterial(coat);
    const bodyMesh = new Mesh(body, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;

    const legs: LegChain[] = [];
    for (let i = 0; i < legParts.length; i++) {
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

    return new QuadrupedRig(
      morph.id,
      bodyMesh,
      legs,
      morph.locomotion,
      morph.strideMul,
      morph.swingAmp,
      morph.bobAmp,
    );
  }

  setPose(x: number, y: number, z: number, yaw: number, pitch = 0, roll = 0): void {
    this.root.position.set(x, y, z);
    this.root.rotation.set(pitch, yaw, roll, 'YXZ');
  }

  tick(dt: number, speed: number): void {
    const moving = speed > 0.05;
    const stride = moving ? speed * 5.2 * this.strideMul : 0.55 * this.strideMul;
    this.phase += dt * stride;
    const t = this.phase;
    this.legSwing = Math.sin(t);

    if (this.mode === 'hop') {
      const hop = moving ? Math.max(0, Math.sin(t)) * this.bobAmp * 3.2 : Math.sin(t * 0.7) * 0.01;
      this.bodyMesh.position.y = hop;
      const swing = moving ? this.swingAmp : 0.05;
      for (let i = 0; i < this.legs.length; i++) {
        const { hip, knee } = this.legs[i]!;
        const rear = i >= 2;
        const legT = t + (rear ? 0 : Math.PI);
        const sinT = Math.sin(legT);
        hip.rotation.x = sinT * swing * (rear ? 1.35 : 0.55);
        knee.rotation.x = -Math.max(0, -sinT) * swing * 1.2 - 0.08;
      }
      return;
    }

    if (this.mode === 'biped') {
      const bob = moving ? Math.abs(Math.sin(t * 2)) * this.bobAmp : Math.sin(t * 0.8) * 0.004;
      this.bodyMesh.position.y = bob;
      const swing = moving ? this.swingAmp : 0.04;
      for (let i = 0; i < this.legs.length; i++) {
        const { hip, knee } = this.legs[i]!;
        const legT = t + (i === 0 ? 0 : Math.PI);
        const sinT = Math.sin(legT);
        hip.rotation.x = sinT * swing;
        knee.rotation.x = -Math.max(0, -sinT) * swing * 1.1 - 0.05;
      }
      return;
    }

    const bob = moving ? Math.abs(Math.sin(t * 2)) * this.bobAmp : Math.sin(t * 0.8) * 0.006;
    this.bodyMesh.position.y = bob;
    const swingAmp = moving ? this.swingAmp : 0.04;
    const kneeAmp = moving ? this.swingAmp * 1.35 : 0.06;
    for (let i = 0; i < this.legs.length; i++) {
      const { hip, knee } = this.legs[i]!;
      const legT = t + (QUAD_PHASE[i % 4] ?? 0);
      const sinT = Math.sin(legT);
      hip.rotation.x = sinT * swingAmp;
      hip.rotation.z = Math.cos(legT) * swingAmp * 0.1;
      knee.rotation.x = -(Math.max(0, -sinT) * kneeAmp + 0.06);
    }
  }

  telemetry(speed: number): WalkTelemetry {
    return {
      id: this.id,
      x: this.root.position.x,
      z: this.root.position.z,
      yaw: this.root.rotation.y,
      phase: this.phase,
      legSwing: this.legSwing,
      speed,
    };
  }
}

export function buildAnimatedSpeciesRig(
  morph: QuadrupedMorph,
  rng: Rng,
  lod: 0 | 1 | 2,
): QuadrupedRig {
  const built = buildSpecies(morph, rng, { lod, rigged: true });
  const s = built.height / morph.withersM;
  const ring = lod === 0 ? 10 : lod === 1 ? 7 : 5;
  const hue = rng.float() * 2 - 1;
  const phase = rng.float() * Math.PI * 2;
  const kneeDrop = 0.36;
  const hoofDrop = morph.locomotion === 'hop' ? 0.72 : 1.02;
  const legParts = built.legFront.map((front, i) =>
    buildLimbParts({
      front,
      s,
      ringSegs: ring,
      hue,
      phase: phase + i * 0.3,
      thick: morph.legThick,
      kneeDrop,
      hoofDrop,
      kneeZ: front ? 0.14 : morph.locomotion === 'hop' ? -0.28 : -0.22,
      hoofZ: front ? 0.08 : morph.locomotion === 'hop' ? -0.2 : -0.16,
    }),
  );
  return QuadrupedRig.create(morph, built.body, legParts, morph.coat, built.hipLocals);
}
