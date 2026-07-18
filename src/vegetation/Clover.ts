import { Matrix4, Quaternion, Vector3 } from 'three';
import type { BufferGeometry } from 'three';
import type { Rng } from '../core/Seed';
import { MeshGrower } from './TubeMesh';

const _p = new Vector3();
const _n = new Vector3();

function pushXf(
  g: MeshGrower,
  m: Matrix4,
  px: number, py: number, pz: number,
  nx: number, ny: number, nz: number,
  u: number, v: number,
  d0: number, d1: number, d2: number, d3: number,
): number {
  _p.set(px, py, pz).applyMatrix4(m);
  _n.set(nx, ny, nz).transformDirection(m);
  return g.vertex(_p.x, _p.y, _p.z, _n.x, _n.y, _n.z, u, v, d0, d1, d2, d3);
}

/**
 * Builds a procedural clover patch (diameter 0.5 to 0.8 meters, height 0.1 to 0.15 meters).
 * Dense cluster of trifoliate (three-lobed, occasionally four-lobed) clover leaves and spherical flower heads.
 * vdata.x (d0): 0.0 = stem/leaves (green), 1.0 = flower heads (white/pink)
 */
export function buildClover(rng: Rng): BufferGeometry {
  const g = new MeshGrower();

  const diameter = rng.range(0.5, 0.8);
  const height = rng.range(0.1, 0.15);
  const patchRadius = diameter / 2;

  // 1. Generate leaves (stems + leaflets)
  const numLeaves = 150 + rng.int(80);
  for (let i = 0; i < numLeaves; i++) {
    // Distribute densely towards center, sparser towards edges
    const r = Math.pow(rng.float(), 1.2) * patchRadius;
    const theta = rng.float() * Math.PI * 2;
    const x0 = Math.cos(theta) * r;
    const z0 = Math.sin(theta) * r;

    // Height scales down slightly near the edges
    const d = r / patchRadius;
    const h = height * (1.0 - 0.3 * d * d) * rng.range(0.85, 1.15);

    // Outward lean for realistic dome shape
    const lean = d * 0.04 * rng.range(0.5, 1.5);
    const x1 = x0 + Math.cos(theta) * lean + rng.range(-0.01, 0.01);
    const z1 = z0 + Math.sin(theta) * lean + rng.range(-0.01, 0.01);
    const y1 = h;

    // Stem midpoint for curved stems
    const xMid = (x0 + x1) * 0.5 + rng.range(-0.01, 0.01);
    const zMid = (z0 + z1) * 0.5 + rng.range(-0.01, 0.01);
    const yMid = h * 0.5;

    const p0 = new Vector3(x0, 0, z0);
    const p1 = new Vector3(xMid, yMid, zMid);
    const p2 = new Vector3(x1, y1, z1);

    // Cross-card stem setup
    const stemAngle = rng.float() * Math.PI * 2;
    const cosA = Math.cos(stemAngle);
    const sinA = Math.sin(stemAngle);
    const dir1 = new Vector3(cosA, 0, sinA);
    const dir2 = new Vector3(-sinA, 0, cosA);

    const w0 = 0.002;
    const w1 = 0.0017;
    const w2 = 0.0013;

    const swayPhase = rng.float() * Math.PI * 2;

    // Stem - Plane 1 (facing dir2 normal)
    const p1_b0 = g.vertex(p0.x - dir1.x * w0, p0.y, p0.z - dir1.z * w0, dir2.x, 0, dir2.z, 0.0, 0.0, 0.0, 0.0, swayPhase, 0.5);
    const p1_b1 = g.vertex(p0.x + dir1.x * w0, p0.y, p0.z + dir1.z * w0, dir2.x, 0, dir2.z, 1.0, 0.0, 0.0, 0.0, swayPhase, 0.5);
    const p1_m0 = g.vertex(p1.x - dir1.x * w1, p1.y, p1.z - dir1.z * w1, dir2.x, 0, dir2.z, 0.0, 0.5, 0.0, 0.35, swayPhase, 0.8);
    const p1_m1 = g.vertex(p1.x + dir1.x * w1, p1.y, p1.z + dir1.z * w1, dir2.x, 0, dir2.z, 1.0, 0.5, 0.0, 0.35, swayPhase, 0.8);
    const p1_t0 = g.vertex(p2.x - dir1.x * w2, p2.y, p2.z - dir1.z * w2, dir2.x, 0, dir2.z, 0.0, 1.0, 0.0, 0.7, swayPhase, 1.0);
    const p1_t1 = g.vertex(p2.x + dir1.x * w2, p2.y, p2.z + dir1.z * w2, dir2.x, 0, dir2.z, 1.0, 1.0, 0.0, 0.7, swayPhase, 1.0);

    g.quad(p1_b0, p1_b1, p1_m1, p1_m0);
    g.quad(p1_m0, p1_m1, p1_t1, p1_t0);

    // Stem - Plane 2 (facing dir1 normal)
    const p2_b0 = g.vertex(p0.x - dir2.x * w0, p0.y, p0.z - dir2.z * w0, dir1.x, 0, dir1.z, 0.0, 0.0, 0.0, 0.0, swayPhase, 0.5);
    const p2_b1 = g.vertex(p0.x + dir2.x * w0, p0.y, p0.z + dir2.z * w0, dir1.x, 0, dir1.z, 1.0, 0.0, 0.0, 0.0, swayPhase, 0.5);
    const p2_m0 = g.vertex(p1.x - dir2.x * w1, p1.y, p1.z - dir2.z * w1, dir1.x, 0, dir1.z, 0.0, 0.5, 0.0, 0.35, swayPhase, 0.8);
    const p2_m1 = g.vertex(p1.x + dir2.x * w1, p1.y, p1.z + dir2.z * w1, dir1.x, 0, dir1.z, 1.0, 0.5, 0.0, 0.35, swayPhase, 0.8);
    const p2_t0 = g.vertex(p2.x - dir2.x * w2, p2.y, p2.z - dir2.z * w2, dir1.x, 0, dir1.z, 0.0, 1.0, 0.0, 0.7, swayPhase, 1.0);
    const p2_t1 = g.vertex(p2.x + dir2.x * w2, p2.y, p2.z + dir2.z * w2, dir1.x, 0, dir1.z, 1.0, 1.0, 0.0, 0.7, swayPhase, 1.0);

    g.quad(p2_b0, p2_b1, p2_m1, p2_m0);
    g.quad(p2_m0, p2_m1, p2_t1, p2_t0);

    // Leaflets (trifoliate or rare four-leaf)
    const isFourLeaf = rng.chance(0.015); // Easter egg: 1.5% chance for 4-leaf clover
    const numLeaflets = isFourLeaf ? 4 : 3;
    const leafRot = rng.float() * Math.PI * 2;

    const L = rng.range(0.016, 0.025);
    const W = L * rng.range(0.75, 0.95);

    for (let k = 0; k < numLeaflets; k++) {
      const thetaK = leafRot + k * (Math.PI * 2 / numLeaflets) + rng.range(-0.06, 0.06);
      const pitchK = rng.range(0.15, 0.32); // droop down from horizontal
      const rollK = rng.range(-0.08, 0.08);

      const qLeaflet = new Quaternion();
      const qRotY = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), thetaK);
      const qPitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitchK);
      const qRoll = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), rollK);
      qLeaflet.multiplyQuaternions(qRotY, qPitch).multiply(qRoll);

      const mLeaflet = new Matrix4().compose(p2, qLeaflet, new Vector3(1, 1, 1));

      // Leaflet vertices in local coordinate space (along +Z)
      // V-shaped fold: center mid V2 and notch V5 are slightly raised in local Y
      const idx0 = pushXf(g, mLeaflet, 0, 0, 0, 0, 1, 0, 0.5, 0.0, 0.0, 0.8, swayPhase, 0.8);
      const idx1 = pushXf(g, mLeaflet, -W, -0.15 * L, L * 0.5, 0, 1, 0, 0.0, 0.5, 0.0, 0.8, swayPhase, 0.9);
      const idx2 = pushXf(g, mLeaflet, 0, 0.05 * L, L * 0.5, 0, 1, 0, 0.5, 0.5, 0.0, 0.8, swayPhase, 0.9);
      const idx3 = pushXf(g, mLeaflet, W, -0.15 * L, L * 0.5, 0, 1, 0, 1.0, 0.5, 0.0, 0.8, swayPhase, 0.9);
      const idx4 = pushXf(g, mLeaflet, -W * 0.4, -0.08 * L, L, 0, 1, 0, 0.1, 1.0, 0.0, 0.85, swayPhase, 1.0);
      const idx5 = pushXf(g, mLeaflet, 0, 0.1 * L, L * 0.82, 0, 1, 0, 0.5, 0.82, 0.0, 0.85, swayPhase, 1.0);
      const idx6 = pushXf(g, mLeaflet, W * 0.4, -0.08 * L, L, 0, 1, 0, 0.9, 1.0, 0.0, 0.85, swayPhase, 1.0);

      // CCW winding:
      g.tri(idx0, idx2, idx1);
      g.tri(idx0, idx3, idx2);
      g.quad(idx1, idx2, idx5, idx4);
      g.quad(idx2, idx3, idx6, idx5);
    }
  }

  // Bend normals of leaves and stems towards a central dome
  g.bendNormals(new Vector3(0, 0.05, 0), patchRadius * 1.3, 0.7, 0);

  // 2. Generate flowers (stems + heads)
  const numFlowers = 15 + rng.int(15);
  for (let i = 0; i < numFlowers; i++) {
    const rf = Math.pow(rng.float(), 1.0) * patchRadius * 0.85;
    const thetaf = rng.float() * Math.PI * 2;
    const xf0 = Math.cos(thetaf) * rf;
    const zf0 = Math.sin(thetaf) * rf;

    const df = rf / patchRadius;
    const hf = height * (1.05 - 0.2 * df * df) * rng.range(0.9, 1.25);

    const leanf = df * 0.03 * rng.range(0.5, 1.5);
    const xf1 = xf0 + Math.cos(thetaf) * leanf + rng.range(-0.01, 0.01);
    const zf1 = zf0 + Math.sin(thetaf) * leanf + rng.range(-0.01, 0.01);
    const yf1 = hf;

    const xfMid = (xf0 + xf1) * 0.5 + rng.range(-0.01, 0.01);
    const zfMid = (zf0 + zf1) * 0.5 + rng.range(-0.01, 0.01);
    const yfMid = hf * 0.5;

    const pf0 = new Vector3(xf0, 0, zf0);
    const pf1 = new Vector3(xfMid, yfMid, zfMid);
    const pf2 = new Vector3(xf1, yf1, zf1);

    const fStemAngle = rng.float() * Math.PI * 2;
    const fCosA = Math.cos(fStemAngle);
    const fSinA = Math.sin(fStemAngle);
    const fDir1 = new Vector3(fCosA, 0, fSinA);
    const fDir2 = new Vector3(-fSinA, 0, fCosA);

    const fw0 = 0.0018;
    const fw1 = 0.0015;
    const fw2 = 0.0012;

    const fSwayPhase = rng.float() * Math.PI * 2;

    // Flower Stem - Plane 1 (facing fDir2 normal)
    const f1_b0 = g.vertex(pf0.x - fDir1.x * fw0, pf0.y, pf0.z - fDir1.z * fw0, fDir2.x, 0, fDir2.z, 0.0, 0.0, 0.0, 0.0, fSwayPhase, 0.5);
    const f1_b1 = g.vertex(pf0.x + fDir1.x * fw0, pf0.y, pf0.z + fDir1.z * fw0, fDir2.x, 0, fDir2.z, 1.0, 0.0, 0.0, 0.0, fSwayPhase, 0.5);
    const f1_m0 = g.vertex(pf1.x - fDir1.x * fw1, pf1.y, pf1.z - fDir1.z * fw1, fDir2.x, 0, fDir2.z, 0.0, 0.5, 0.0, 0.35, fSwayPhase, 0.8);
    const f1_m1 = g.vertex(pf1.x + fDir1.x * fw1, pf1.y, pf1.z + fDir1.z * fw1, fDir2.x, 0, fDir2.z, 1.0, 0.5, 0.0, 0.35, fSwayPhase, 0.8);
    const f1_t0 = g.vertex(pf2.x - fDir1.x * fw2, pf2.y, pf2.z - fDir1.z * fw2, fDir2.x, 0, fDir2.z, 0.0, 1.0, 0.0, 0.7, fSwayPhase, 1.0);
    const f1_t1 = g.vertex(pf2.x + fDir1.x * fw2, pf2.y, pf2.z + fDir1.z * fw2, fDir2.x, 0, fDir2.z, 1.0, 1.0, 0.0, 0.7, fSwayPhase, 1.0);

    g.quad(f1_b0, f1_b1, f1_m1, f1_m0);
    g.quad(f1_m0, f1_m1, f1_t1, f1_t0);

    // Flower Stem - Plane 2 (facing fDir1 normal)
    const f2_b0 = g.vertex(pf0.x - fDir2.x * fw0, pf0.y, pf0.z - fDir2.z * fw0, fDir1.x, 0, fDir1.z, 0.0, 0.0, 0.0, 0.0, fSwayPhase, 0.5);
    const f2_b1 = g.vertex(pf0.x + fDir2.x * fw0, pf0.y, pf0.z + fDir2.z * fw0, fDir1.x, 0, fDir1.z, 1.0, 0.0, 0.0, 0.0, fSwayPhase, 0.5);
    const f2_m0 = g.vertex(pf1.x - fDir2.x * fw1, pf1.y, pf1.z - fDir2.z * fw1, fDir1.x, 0, fDir1.z, 0.0, 0.5, 0.0, 0.35, fSwayPhase, 0.8);
    const f2_m1 = g.vertex(pf1.x + fDir2.x * fw1, pf1.y, pf1.z + fDir2.z * fw1, fDir1.x, 0, fDir1.z, 1.0, 0.5, 0.0, 0.35, fSwayPhase, 0.8);
    const f2_t0 = g.vertex(pf2.x - fDir2.x * fw2, pf2.y, pf2.z - fDir2.z * fw2, fDir1.x, 0, fDir1.z, 0.0, 1.0, 0.0, 0.7, fSwayPhase, 1.0);
    const f2_t1 = g.vertex(pf2.x + fDir2.x * fw2, pf2.y, pf2.z + fDir2.z * fw2, fDir1.x, 0, fDir1.z, 1.0, 1.0, 0.0, 0.7, fSwayPhase, 1.0);

    g.quad(f2_b0, f2_b1, f2_m1, f2_m0);
    g.quad(f2_m0, f2_m1, f2_t1, f2_t0);

    // Flower Head
    const R_head = rng.range(0.012, 0.018);
    buildFlowerHead(g, pf2.x, pf2.y + R_head * 0.5, pf2.z, R_head, rng, fSwayPhase, 0.85);
  }

  return g.build();
}

/**
 * Builds a spiky/fluffy spherical clover flower head.
 * Bottom florets (calyx) are green (vdata.x = 0.0), upper ones are white/pink (vdata.x = 1.0).
 */
function buildFlowerHead(
  g: MeshGrower,
  cx: number, cy: number, cz: number,
  radius: number,
  rng: Rng,
  swayPhase: number,
  flex: number,
): void {
  // 1. Build small solid core
  const coreLATS = 3;
  const coreLONS = 5;
  const coreGrid: number[][] = [];
  for (let lat = 0; lat <= coreLATS; lat++) {
    const theta = (lat / coreLATS) * Math.PI;
    const row: number[] = [];
    for (let lon = 0; lon <= coreLONS; lon++) {
      const phi = (lon / coreLONS) * 2 * Math.PI;
      const dx = Math.sin(theta) * Math.cos(phi);
      const dy = Math.cos(theta);
      const dz = Math.sin(theta) * Math.sin(phi);
      const r = radius * 0.35;

      const vdataX = lat >= coreLATS - 1 ? 0.0 : 1.0;
      const idx = g.vertex(
        cx + dx * r, cy + dy * r, cz + dz * r,
        dx, dy, dz,
        lon / coreLONS, lat / coreLATS,
        vdataX, flex, swayPhase, 0.7,
      );
      row.push(idx);
    }
    coreGrid.push(row);
  }
  for (let lat = 0; lat < coreLATS; lat++) {
    const rowA = coreGrid[lat] as number[];
    const rowB = coreGrid[lat + 1] as number[];
    for (let lon = 0; lon < coreLONS; lon++) {
      g.quad(rowB[lon] as number, rowB[lon + 1] as number, rowA[lon + 1] as number, rowA[lon] as number);
    }
  }

  // 2. Build outward-pointing florets
  const LATS = 5;
  const LONS = 8;
  for (let lat = 1; lat < LATS; lat++) {
    const theta = (lat / LATS) * Math.PI;
    const isBottom = lat >= LATS - 1; // bottom row is green calyx

    for (let lon = 0; lon < LONS; lon++) {
      const phi = (lon / LONS) * 2 * Math.PI + (lat % 2) * (Math.PI / LONS); // stagger rows

      const dx = Math.sin(theta) * Math.cos(phi);
      const dy = Math.cos(theta);
      const dz = Math.sin(theta) * Math.sin(phi);

      const dir = new Vector3(dx, dy, dz);

      const R_inner = radius * 0.35;
      const R_outer = radius * (0.95 + rng.float() * 0.25);

      const pInner = new Vector3(cx, cy, cz).addScaledVector(dir, R_inner);
      // Bend florets slightly downwards
      const fDir = dir.clone().add(new Vector3(0, -0.15, 0)).normalize();
      const pOuter = new Vector3(cx, cy, cz).addScaledVector(fDir, R_outer);

      const width = radius * 0.18;
      const temp = Math.abs(dir.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
      const right = new Vector3().crossVectors(dir, temp).normalize().multiplyScalar(width);

      const vdataX = isBottom ? 0.0 : 1.0;

      const a0 = g.vertex(pInner.x - right.x, pInner.y - right.y, pInner.z - right.z, dir.x, dir.y, dir.z, 0, 0, vdataX, flex, swayPhase, 0.8);
      const a1 = g.vertex(pInner.x + right.x, pInner.y + right.y, pInner.z + right.z, dir.x, dir.y, dir.z, 1, 0, vdataX, flex, swayPhase, 0.8);
      const b1 = g.vertex(pOuter.x + right.x * 0.4, pOuter.y + right.y * 0.4, pOuter.z + right.z * 0.4, dir.x, dir.y, dir.z, 1, 1, vdataX, flex, swayPhase, 1.0);
      const b0 = g.vertex(pOuter.x - right.x * 0.4, pOuter.y - right.y * 0.4, pOuter.z - right.z * 0.4, dir.x, dir.y, dir.z, 0, 1, vdataX, flex, swayPhase, 1.0);

      g.quad(a0, a1, b1, b0);
    }
  }
}
