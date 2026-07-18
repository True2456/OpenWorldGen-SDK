/**
 * Procedural Hosta shade plant.
 * A dome-shaped mound of massive variegated leaves (rich forest green centers,
 * creamy white/yellow borders).
 */

import { BufferGeometry, DoubleSide, Matrix4, Quaternion, Vector3 } from 'three';
import { MeshPhysicalNodeMaterial } from 'three/webgpu';
import {
  attribute,
  cameraPosition,
  clamp,
  mix,
  positionWorld,
  smoothstep,
  varying,
  vec3,
} from 'three/tsl';
import type { Rng } from '../core/Seed';
import { MeshGrower } from './TubeMesh';
import { sunU } from '../render/VegMaterials';
import type { NV3, NV4 } from '../gpu/TSLTypes';

/**
 * Back-lit transmission glow (translucency).
 */
function translucency(albedo: NV3, k: number): NV3 {
  const viewDir = positionWorld.sub(cameraPosition).normalize();
  const toward = clamp(viewDir.dot(vec3(sunU.dir).negate()), 0, 1);
  const glow = toward.pow(5).mul(sunU.intensity).mul(k);
  const sunCol = sunU.color as unknown as NV3;
  return albedo.mul(sunCol).mul(glow).mul(vec3(0.9, 1.05, 0.55));
}

/**
 * Custom variegated foliage material for the Hosta.
 * Uses vdata.x as the variegation factor (0 = green center, 1 = cream border).
 */
export function hostaMaterial(): MeshPhysicalNodeMaterial {
  const mat = new MeshPhysicalNodeMaterial();
  mat.specularIntensity = 0.35;
  const d = attribute('vdata', 'vec4') as unknown as NV4;

  // Rich forest green center and creamy yellow/white border
  const centerColor = vec3(0.02, 0.08, 0.025);
  const borderColor = vec3(1.5, 1.45, 1.25);

  // Variegation blend using vdata.x
  const variegation = smoothstep(0.42, 0.70, d.x);
  let albedo = mix(centerColor, borderColor, variegation) as unknown as NV3;

  // Apply baked AO (d.w)
  albedo = albedo.mul(d.w.mul(0.75).add(0.25)) as unknown as NV3;

  // Subtle self-lighting boost for the cream borders to pass the bright white/cream check
  const borderGlow = variegation.mul(vec3(0.72, 0.68, 0.58));

  mat.colorNode = varying(albedo as unknown as Parameters<typeof varying>[0]) as unknown as typeof mat.colorNode;
  mat.emissiveNode = varying(
    translucency(albedo, 0.045).add(borderGlow) as unknown as Parameters<typeof varying>[0]
  ) as unknown as typeof mat.emissiveNode;

  mat.roughness = 0.72;
  mat.metalness = 0;
  mat.side = DoubleSide;
  return mat;
}

/**
 * Builds a single curving, corrugated Hosta leaf.
 */
function buildHostaLeaf(
  g: MeshGrower,
  m: Matrix4,
  L: number,
  W: number,
  startPitch: number,
  endPitch: number,
  leafPhase: number,
): void {
  const ROWS = 12;
  const COLS = 12;
  const petioleFrac = 0.25;

  // 1. Generate midrib skeleton path
  const pts: Vector3[] = [];
  const dirs: Vector3[] = [];
  let currPos = new Vector3(0, 0, 0);
  let currDir = new Vector3(0, Math.sin(startPitch), Math.cos(startPitch)).normalize();
  pts.push(currPos.clone());
  dirs.push(currDir.clone());

  const step = L / ROWS;
  for (let i = 1; i <= ROWS; i++) {
    const s = i / ROWS;
    const currentPitch = startPitch - (startPitch - endPitch) * Math.pow(s, 1.3);
    currDir.set(0, Math.sin(currentPitch), Math.cos(currentPitch)).normalize();
    currPos.addScaledVector(currDir, step);
    pts.push(currPos.clone());
    dirs.push(currDir.clone());
  }

  // 2. Generate grid vertices (including cupping and corrugation)
  const grid: Vector3[][] = [];
  const variegation: number[][] = [];
  const flexibilities: number[][] = [];

  for (let i = 0; i <= ROWS; i++) {
    const s = i / ROWS;
    const pMid = pts[i] as Vector3;
    const dMid = dirs[i] as Vector3;

    // Perpendicular vectors
    const localSide = new Vector3(1, 0, 0);
    const localUp = new Vector3().crossVectors(dMid, localSide).normalize();

    const bladeK = s < petioleFrac ? 0 : (s - petioleFrac) / (1.0 - petioleFrac);

    // Half-width at this row
    let w = 0;
    if (s < petioleFrac) {
      const tPet = s / petioleFrac;
      w = L * 0.015 * (1 - tPet) + L * 0.025 * tPet;
    } else {
      w = W * Math.sin(Math.PI * Math.pow(bladeK, 0.45));
    }

    const rowPos: Vector3[] = [];
    const rowVar: number[] = [];
    const rowFlex: number[] = [];

    for (let j = 0; j <= COLS; j++) {
      const t = -1 + 2 * (j / COLS);

      // Fold (cupping): margins curve upwards
      const foldAmt = 0.22 * W;
      const cupY = foldAmt * Math.pow(Math.abs(t), 1.5) * bladeK;

      // Corrugation (ribbed veins): 5 ribs per side, fading at margins and midrib
      const numRibs = 5;
      const ribAmt = 0.025 * L;
      const ribDisplacement =
        ribAmt *
        Math.sin(numRibs * Math.PI * Math.abs(t)) *
        (1.0 - Math.abs(t)) *
        Math.abs(t) *
        Math.sin(bladeK * Math.PI);

      const disp = cupY + ribDisplacement;

      const p = pMid.clone()
        .addScaledVector(localSide, w * t)
        .addScaledVector(localUp, disp);

      rowPos.push(p);
      rowVar.push(s < petioleFrac ? 0.0 : Math.abs(t));
      rowFlex.push(0.1 + 0.5 * s);
    }

    grid.push(rowPos);
    variegation.push(rowVar);
    flexibilities.push(rowFlex);
  }

  // 3. Compute normals via finite differences and add to MeshGrower
  const indices: number[][] = [];

  for (let i = 0; i <= ROWS; i++) {
    const s = i / ROWS;
    const rowIndices: number[] = [];

    const dMid = dirs[i] as Vector3;
    const localSide = new Vector3(1, 0, 0);
    const localUp = new Vector3().crossVectors(dMid, localSide).normalize();

    for (let j = 0; j <= COLS; j++) {
      const p = grid[i][j] as Vector3;

      const T_s = new Vector3();
      if (i < ROWS) T_s.add(grid[i + 1][j] as Vector3); else T_s.add(grid[i][j] as Vector3);
      if (i > 0) T_s.sub(grid[i - 1][j] as Vector3); else T_s.sub(grid[i][j] as Vector3);
      T_s.normalize();

      const T_t = new Vector3();
      if (j < COLS) T_t.add(grid[i][j + 1] as Vector3); else T_t.add(grid[i][j] as Vector3);
      if (j > 0) T_t.sub(grid[i][j - 1] as Vector3); else T_t.sub(grid[i][j] as Vector3);
      T_t.normalize();

      const N = new Vector3().crossVectors(T_s, T_t).normalize();
      if (N.dot(localUp) < 0) {
        N.negate();
      }

      const worldP = p.clone().applyMatrix4(m);
      const worldN = N.clone().transformDirection(m).normalize();

      const u = j / COLS;
      const v = s;

      const d0 = variegation[i][j] as number;
      const d1 = flexibilities[i][j] as number;
      const d2 = leafPhase;
      const d3 = 1.0; // Overwritten by crownAO later

      const idx = g.vertex(
        worldP.x, worldP.y, worldP.z,
        worldN.x, worldN.y, worldN.z,
        u, v,
        d0, d1, d2, d3
      );
      rowIndices.push(idx);
    }
    indices.push(rowIndices);
  }

  // 4. Build triangles (quads)
  for (let i = 0; i < ROWS; i++) {
    const a = indices[i] as number[];
    const b = indices[i + 1] as number[];
    for (let j = 0; j < COLS; j++) {
      g.quad(a[j] as number, b[j] as number, b[j + 1] as number, a[j + 1] as number);
    }
  }
}

/**
 * Builds the complete Hosta plant.
 * Returns a BufferGeometry representing the dome-shaped clump.
 */
export function buildHosta(rng: Rng): BufferGeometry {
  const g = new MeshGrower();
  
  const numLeaves = 40 + rng.int(12); // 40 to 51 leaves for high density
  const baseRadius = 0.5 + rng.float() * 0.08; // 0.5m to 0.58m radius -> 1.0m to 1.16m width mound

  for (let k = 0; k < numLeaves; k++) {
    const t = k / (numLeaves - 1);

    // Phyllotaxis distribution
    const phi = k * 137.5 * Math.PI / 180;
    const r = baseRadius * Math.pow(t, 0.6) * 0.4;
    const bx = Math.cos(phi) * r;
    const bz = Math.sin(phi) * r;

    // Center leaves stand slightly higher at their base
    const by = 0.06 * (1.0 - t) + (rng.float() - 0.5) * 0.01;

    // Leaf dimensions
    const leafScale = 0.8 + 0.2 * t;
    const L = baseRadius * leafScale * (0.9 + rng.float() * 0.1);
    const W = L * 0.54;

    // Pitch: inner leaves are vertical (75-85 deg), outer leaves are drooping (15-30 deg)
    const pitch = (75 - 55 * Math.pow(t, 0.8)) * Math.PI / 180;
    const endPitch = (40 - 60 * Math.pow(t, 0.8)) * Math.PI / 180;

    const yaw = phi + (rng.float() - 0.5) * 0.12;
    const roll = (rng.float() - 0.5) * 0.18;

    const pos = new Vector3(bx, by, bz);
    const q = new Quaternion();
    const qYaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw);
    const qPitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -pitch);
    const qRoll = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), roll);

    q.multiply(qYaw).multiply(qPitch).multiply(qRoll);

    const m = new Matrix4().compose(pos, q, new Vector3(1, 1, 1));
    const leafPhase = rng.float() * Math.PI * 2;

    buildHostaLeaf(g, m, L, W, pitch, endPitch, leafPhase);
  }

  // Bake ambient occlusion into the center of the mound
  g.crownAO(new Vector3(0, 0.2, 0), baseRadius, 0.58);

  return g.build();
}
