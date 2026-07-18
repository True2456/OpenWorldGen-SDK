import { BufferGeometry, Vector3 } from 'three';
import type { Rng } from '../core/Seed';
import { MeshGrower } from './TubeMesh';

/**
 * Procedural Lupine flower builder.
 * Produces a tall, elegant spike flower (0.5 to 0.8 meters).
 * 
 * Vertex Attributes (vdata.x):
 *   - 0.0 = stem/leaf (green)
 *   - 0.5 = flower center (yellowish/cyan)
 *   - 1.0 = petal (blue/purple)
 */
export function buildLupine(rng: Rng): BufferGeometry {
  const g = new MeshGrower();

  // 1. Core Dimensions
  const H = rng.range(0.5, 0.8);
  const rBase = rng.range(0.007, 0.009);
  const rTip = rng.range(0.002, 0.003);
  const segs = 15;
  const sides = 8;
  const swayPhase = rng.float() * Math.PI * 2;

  // Generate main stem points curving slightly for organic variety
  const pts: Vector3[] = [];
  const dirs: Vector3[] = [];
  const bendAngle = rng.float() * Math.PI * 2;
  const bendAmt = rng.range(0.012, 0.022);

  for (let i = 0; i < segs; i++) {
    const t = i / (segs - 1);
    const y = t * H;
    const px = Math.sin(t * Math.PI) * bendAmt * Math.cos(bendAngle);
    const pz = Math.sin(t * Math.PI) * bendAmt * Math.sin(bendAngle);
    pts.push(new Vector3(px, y, pz));
  }

  for (let i = 0; i < segs; i++) {
    const nextPt = pts[Math.min(segs - 1, i + 1)]!;
    const prevPt = pts[Math.max(0, i - 1)]!;
    dirs.push(new Vector3().subVectors(nextPt, prevPt).normalize());
  }

  // 2. Central Erect Stem Cylinder
  const rings: number[][] = [];
  const T0 = dirs[0]!;
  const ref = Math.abs(T0.y) < 0.94 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  const N = new Vector3().crossVectors(ref, T0).normalize();
  const B = new Vector3().crossVectors(T0, N).normalize();

  for (let i = 0; i < segs; i++) {
    const p = pts[i]!;
    const r = rBase + (rTip - rBase) * (i / (segs - 1));
    const T = dirs[i]!;
    
    if (i > 0) {
      const tPrev = dirs[i - 1]!;
      const axis = new Vector3().crossVectors(tPrev, T);
      const s = axis.length();
      if (s > 1e-6) {
        axis.multiplyScalar(1 / s);
        const ang = Math.asin(Math.min(1, s));
        N.applyAxisAngle(axis, ang).normalize();
        B.applyAxisAngle(axis, ang).normalize();
      }
    }

    const ring: number[] = [];
    const t = i / (segs - 1);
    const flex = t * 0.4; // stem is relatively rigid, tip moves a bit
    const ao = 0.4 + 0.6 * t;

    for (let k = 0; k <= sides; k++) {
      const angle = (k / sides) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const dx = N.x * cosA + B.x * sinA;
      const dy = N.y * cosA + B.y * sinA;
      const dz = N.z * cosA + B.z * sinA;

      const slope = (rTip - rBase) / H;
      const nx = dx + T.x * slope;
      const ny = dy + T.y * slope;
      const nz = dz + T.z * slope;
      const len = Math.hypot(nx, ny, nz) || 1;

      const vx = p.x + dx * r;
      const vy = p.y + dy * r;
      const vz = p.z + dz * r;

      ring.push(
        g.vertex(
          vx, vy, vz,
          nx / len, ny / len, nz / len,
          k / sides, t * 8, // uv
          0.0, // stem/leaf (green)
          flex, swayPhase, ao
        )
      );
    }
    rings.push(ring);
  }

  // Connect stem rings
  for (let i = 0; i < segs - 1; i++) {
    const r0 = rings[i]!;
    const r1 = rings[i + 1]!;
    for (let k = 0; k < sides; k++) {
      g.quad(r0[k]!, r0[k + 1]!, r1[k + 1]!, r1[k]!);
    }
  }

  // Base cap
  const firstRing = rings[0]!;
  const baseP = pts[0]!;
  const baseD = dirs[0]!;
  const baseCenter = g.vertex(
    baseP.x - baseD.x * rBase * 0.5,
    baseP.y - baseD.y * rBase * 0.5,
    baseP.z - baseD.z * rBase * 0.5,
    -baseD.x, -baseD.y, -baseD.z,
    0.5, 0.5, 0.0, 0, swayPhase, 0.3
  );
  for (let k = 0; k < sides; k++) {
    g.tri(firstRing[k]!, baseCenter, firstRing[k + 1]!);
  }

  // Tip cap
  const lastRing = rings[segs - 1]!;
  const tipP = pts[segs - 1]!;
  const tipD = dirs[segs - 1]!;
  const tipCenter = g.vertex(
    tipP.x + tipD.x * rTip * 0.5,
    tipP.y + tipD.y * rTip * 0.5,
    tipP.z + tipD.z * rTip * 0.5,
    tipD.x, tipD.y, tipD.z,
    0.5, 0.5, 0.0, 0.4, swayPhase, 1.0
  );
  for (let k = 0; k < sides; k++) {
    g.tri(lastRing[k + 1]!, tipCenter, lastRing[k]!);
  }

  // Helper to find a position along the stem
  const getStemPoint = (yVal: number): { pos: Vector3; dir: Vector3 } => {
    let idx = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      if (pts[i + 1]!.y >= yVal) {
        idx = i;
        break;
      }
    }
    const pA = pts[idx]!;
    const pB = pts[idx + 1]!;
    const t = (yVal - pA.y) / (pB.y - pA.y);
    const pos = new Vector3().lerpVectors(pA, pB, t);
    const dir = dirs[idx]!;
    return { pos, dir };
  };

  // 3. Rosette Leaves (Palmately compound at the base)
  const numRosetteLeaves = 6 + rng.int(3);
  for (let j = 0; j < numRosetteLeaves; j++) {
    const leafAz = (j / numRosetteLeaves) * Math.PI * 2 + rng.range(-0.15, 0.15);
    const y0 = rng.range(0.03, 0.07);
    
    const p_base = new Vector3(Math.cos(leafAz) * rBase, y0, Math.sin(leafAz) * rBase);
    const L_petiole = rng.range(0.12, 0.18);
    const dir_h = new Vector3(Math.cos(leafAz), 0, Math.sin(leafAz));
    
    const p0 = p_base;
    const p1 = new Vector3().addVectors(p0, dir_h.clone().multiplyScalar(L_petiole * 0.5)).add(new Vector3(0, L_petiole * 0.28, 0));
    const p2 = new Vector3().addVectors(p0, dir_h.clone().multiplyScalar(L_petiole)).add(new Vector3(0, -L_petiole * 0.08, 0));
    
    const pw0 = 0.0024;
    const pw1 = 0.002;
    const pw2 = 0.0014;
    
    buildCrossStrip(g, p0, p1, p2, pw0, pw1, pw2, 0.0, 0.1, swayPhase, 0.6);
    
    // Generate leaflets at the end of petiole (p2)
    const d_tip = new Vector3().subVectors(p2, p1).normalize();
    const n_tip = new Vector3(0, 1, 0);
    n_tip.addScaledVector(d_tip, -n_tip.dot(d_tip)).normalize();
    const b_tip = new Vector3().crossVectors(d_tip, n_tip).normalize();
    
    const numLeaflets = 7 + rng.int(5);
    for (let k = 0; k < numLeaflets; k++) {
      const a_leaf = (k / numLeaflets) * Math.PI * 2 + rng.range(-0.08, 0.08);
      const d_leaflet = new Vector3()
        .addScaledVector(d_tip, Math.cos(a_leaf))
        .addScaledVector(b_tip, Math.sin(a_leaf))
        .normalize();
      d_leaflet.addScaledVector(n_tip, 0.14).normalize();
      
      const L_leaflet = rng.range(0.045, 0.07);
      const w_leaflet = L_leaflet * rng.range(0.09, 0.13);
      
      const q0 = p2;
      const q1 = new Vector3().addVectors(q0, d_leaflet.clone().multiplyScalar(L_leaflet * 0.5)).addScaledVector(n_tip, -L_leaflet * 0.03);
      const q2 = new Vector3().addVectors(q0, d_leaflet.clone().multiplyScalar(L_leaflet)).addScaledVector(n_tip, -L_leaflet * 0.12);
      
      const side_leaflet = new Vector3().crossVectors(d_leaflet, n_tip).normalize();
      const norm_leaflet = new Vector3().crossVectors(side_leaflet, d_leaflet).normalize();
      
      const v0 = g.vertex(q0.x, q0.y, q0.z, norm_leaflet.x, norm_leaflet.y, norm_leaflet.z, 0.5, 0, 0.0, 0.15, swayPhase, 0.65);
      const v1_L = g.vertex(q1.x - side_leaflet.x * w_leaflet, q1.y - side_leaflet.y * w_leaflet, q1.z - side_leaflet.z * w_leaflet, norm_leaflet.x, norm_leaflet.y, norm_leaflet.z, 0, 0.5, 0.0, 0.15, swayPhase, 0.75);
      const v1_R = g.vertex(q1.x + side_leaflet.x * w_leaflet, q1.y + side_leaflet.y * w_leaflet, q1.z + side_leaflet.z * w_leaflet, norm_leaflet.x, norm_leaflet.y, norm_leaflet.z, 1, 0.5, 0.0, 0.15, swayPhase, 0.75);
      const v2 = g.vertex(q2.x, q2.y, q2.z, norm_leaflet.x, norm_leaflet.y, norm_leaflet.z, 0.5, 1, 0.0, 0.15, swayPhase, 0.8);
      
      g.tri(v0, v1_L, v1_R);
      g.tri(v1_L, v2, v1_R);
    }
  }

  // 4. Flower Spike (Golden Spiral Phyllotaxis on the upper half)
  const Y_spike_start = H * 0.42;
  const Y_spike_end = H * 0.96;
  const numFlowers = 95 + rng.int(25);

  for (let j = 0; j < numFlowers; j++) {
    const t_flow = j / (numFlowers - 1);
    const y = Y_spike_start + t_flow * (Y_spike_end - Y_spike_start);
    
    const { pos: p_stem, dir: d_stem } = getStemPoint(y);
    const r_stem = rBase + (rTip - rBase) * (y / H);

    // Frame on the stem
    const ref_s = Math.abs(d_stem.y) < 0.94 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
    const n_stem = new Vector3().crossVectors(ref_s, d_stem).normalize();
    const b_stem = new Vector3().crossVectors(d_stem, n_stem).normalize();

    // Radial direction along golden spiral
    const theta = j * 137.5 * Math.PI / 180;
    const ped_dir = new Vector3()
      .addScaledVector(n_stem, Math.cos(theta))
      .addScaledVector(b_stem, Math.sin(theta))
      .normalize();
    ped_dir.addScaledVector(d_stem, 0.15).normalize(); // tilt slightly upwards

    const L_ped = 0.016 * (1.0 - t_flow * 0.4);
    const F_scale = 0.024 * (1.0 - t_flow * 0.55);

    const p_ped_base = p_stem.clone().addScaledVector(ped_dir, r_stem);
    const p_flow = p_stem.clone().addScaledVector(ped_dir, r_stem + L_ped);

    const w_ped = 0.0012 * (1.0 - t_flow * 0.4);
    const swayFlex = y / H;
    const ao = 0.65 + 0.35 * t_flow;

    // Green pedicel (stalk)
    buildPedicel(g, p_ped_base, p_flow, w_ped, swayFlex, swayPhase, ao);

    // Flower local frame
    const fwd = ped_dir.clone().normalize();
    const up = d_stem.clone().addScaledVector(fwd, -d_stem.dot(fwd)).normalize();
    const right = new Vector3().crossVectors(fwd, up).normalize();

    if (t_flow > 0.88) {
      // Unopened bud: simple 3D diamond
      const baseVal = g.vertex(p_flow.x - fwd.x * F_scale * 0.4, p_flow.y - fwd.y * F_scale * 0.4, p_flow.z - fwd.z * F_scale * 0.4, right.x, right.y, right.z, 0.5, 0, 0.0, swayFlex, swayPhase, ao);
      const mid_U = g.vertex(p_flow.x + up.x * F_scale * 0.25, p_flow.y + up.y * F_scale * 0.25, p_flow.z + up.z * F_scale * 0.25, right.x, right.y, right.z, 1.0, 0.5, 0.25, swayFlex, swayPhase, ao);
      const mid_D = g.vertex(p_flow.x - up.x * F_scale * 0.25, p_flow.y - up.y * F_scale * 0.25, p_flow.z - up.z * F_scale * 0.25, right.x, right.y, right.z, 0.0, 0.5, 0.25, swayFlex, swayPhase, ao);
      const tip = g.vertex(p_flow.x + fwd.x * F_scale * 0.6, p_flow.y + fwd.y * F_scale * 0.6, p_flow.z + fwd.z * F_scale * 0.6, right.x, right.y, right.z, 0.5, 1, 0.5, swayFlex, swayPhase, ao);
      
      g.tri(baseVal, mid_U, mid_D);
      g.tri(mid_D, mid_U, tip);

      const mid_R = g.vertex(p_flow.x + right.x * F_scale * 0.25, p_flow.y + right.y * F_scale * 0.25, p_flow.z + right.z * F_scale * 0.25, -up.x, -up.y, -up.z, 1.0, 0.5, 0.25, swayFlex, swayPhase, ao);
      const mid_L = g.vertex(p_flow.x - right.x * F_scale * 0.25, p_flow.y - right.y * F_scale * 0.25, p_flow.z - right.z * F_scale * 0.25, -up.x, -up.y, -up.z, 0.0, 0.5, 0.25, swayFlex, swayPhase, ao);
      
      g.tri(baseVal, mid_R, mid_L);
      g.tri(mid_L, mid_R, tip);
    } else {
      // Open Pea Flower

      // A. Banner (Standard) Petal: curved backwards (vdata.x = 1.0)
      const w_banner = F_scale * 0.7;
      const h_banner = F_scale * 0.95;
      const pB0 = p_flow;
      const pB1 = new Vector3().addVectors(p_flow, up.clone().multiplyScalar(h_banner * 0.5)).addScaledVector(fwd, -h_banner * 0.08);
      const pB2 = new Vector3().addVectors(p_flow, up.clone().multiplyScalar(h_banner)).addScaledVector(fwd, -h_banner * 0.25);

      const vB0_L = g.vertex(pB0.x - right.x * w_banner * 0.05, pB0.y - right.y * w_banner * 0.05, pB0.z - right.z * w_banner * 0.05, fwd.x, fwd.y, fwd.z, 0.45, 0, 1.0, swayFlex, swayPhase, ao);
      const vB0_R = g.vertex(pB0.x + right.x * w_banner * 0.05, pB0.y + right.y * w_banner * 0.05, pB0.z + right.z * w_banner * 0.05, fwd.x, fwd.y, fwd.z, 0.55, 0, 1.0, swayFlex, swayPhase, ao);
      const vB1_L = g.vertex(pB1.x - right.x * w_banner * 0.45, pB1.y - right.y * w_banner * 0.45, pB1.z - right.z * w_banner * 0.45, fwd.x, fwd.y, fwd.z, 0.1, 0.5, 1.0, swayFlex, swayPhase, ao);
      const vB1_R = g.vertex(pB1.x + right.x * w_banner * 0.45, pB1.y + right.y * w_banner * 0.45, pB1.z + right.z * w_banner * 0.45, fwd.x, fwd.y, fwd.z, 0.9, 0.5, 1.0, swayFlex, swayPhase, ao);
      const vB2_L = g.vertex(pB2.x - right.x * w_banner * 0.1, pB2.y - right.y * w_banner * 0.1, pB2.z - right.z * w_banner * 0.1, fwd.x, fwd.y, fwd.z, 0.4, 1.0, 1.0, swayFlex, swayPhase, ao);
      const vB2_R = g.vertex(pB2.x + right.x * w_banner * 0.1, pB2.y + right.y * w_banner * 0.1, pB2.z + right.z * w_banner * 0.1, fwd.x, fwd.y, fwd.z, 0.6, 1.0, 1.0, swayFlex, swayPhase, ao);
      
      g.quad(vB0_L, vB0_R, vB1_R, vB1_L);
      g.quad(vB1_L, vB1_R, vB2_R, vB2_L);

      // B. Left and Right Wing Petals: flank sides (vdata.x = 1.0)
      const l_wing = F_scale * 0.8;
      const w_wing = F_scale * 0.45;

      // Left Wing
      const vWL0 = g.vertex(p_flow.x, p_flow.y, p_flow.z, -right.x, -right.y, -right.z, 0.5, 0, 1.0, swayFlex, swayPhase, ao);
      const vWL1 = g.vertex(p_flow.x - right.x * w_wing * 0.3, p_flow.y - right.y * w_wing * 0.3, p_flow.z - right.z * w_wing * 0.3, -right.x, -right.y, -right.z, 0, 0, 1.0, swayFlex, swayPhase, ao);
      const vWL2 = g.vertex(p_flow.x + fwd.x * l_wing - right.x * w_wing * 0.8 - up.x * l_wing * 0.15, p_flow.y + fwd.y * l_wing - right.y * w_wing * 0.8 - up.y * l_wing * 0.15, p_flow.z + fwd.z * l_wing - right.z * w_wing * 0.8 - up.z * l_wing * 0.15, -right.x, -right.y, -right.z, 0, 1, 1.0, swayFlex, swayPhase, ao);
      const vWL3 = g.vertex(p_flow.x + fwd.x * l_wing * 0.75 - right.x * w_wing * 0.4, p_flow.y + fwd.y * l_wing * 0.75 - right.y * w_wing * 0.4, p_flow.z + fwd.z * l_wing * 0.75 - right.z * w_wing * 0.4, -right.x, -right.y, -right.z, 0.5, 1, 1.0, swayFlex, swayPhase, ao);
      g.quad(vWL0, vWL1, vWL2, vWL3);

      // Right Wing
      const vWR0 = g.vertex(p_flow.x, p_flow.y, p_flow.z, right.x, right.y, right.z, 0.5, 0, 1.0, swayFlex, swayPhase, ao);
      const vWR1 = g.vertex(p_flow.x + right.x * w_wing * 0.3, p_flow.y + right.y * w_wing * 0.3, p_flow.z + right.z * w_wing * 0.3, right.x, right.y, right.z, 0, 0, 1.0, swayFlex, swayPhase, ao);
      const vWR2 = g.vertex(p_flow.x + fwd.x * l_wing + right.x * w_wing * 0.8 - up.x * l_wing * 0.15, p_flow.y + fwd.y * l_wing + right.y * w_wing * 0.8 - up.y * l_wing * 0.15, p_flow.z + fwd.z * l_wing + right.z * w_wing * 0.8 - up.z * l_wing * 0.15, right.x, right.y, right.z, 0, 1, 1.0, swayFlex, swayPhase, ao);
      const vWR3 = g.vertex(p_flow.x + fwd.x * l_wing * 0.75 + right.x * w_wing * 0.4, p_flow.y + fwd.y * l_wing * 0.75 + right.y * w_wing * 0.4, p_flow.z + fwd.z * l_wing * 0.75 + right.z * w_wing * 0.4, right.x, right.y, right.z, 0.5, 1, 1.0, swayFlex, swayPhase, ao);
      g.quad(vWR0, vWR3, vWR2, vWR1);

      // C. Keel (Center fused boat shape): (vdata.x = 0.5)
      const vK_base = g.vertex(p_flow.x - up.x * F_scale * 0.1, p_flow.y - up.y * F_scale * 0.1, p_flow.z - up.z * F_scale * 0.1, 0, -1, 0, 0.5, 0, 0.5, swayFlex, swayPhase, ao);
      const vK_L = g.vertex(p_flow.x + fwd.x * F_scale * 0.45 - right.x * F_scale * 0.15, p_flow.y + fwd.y * F_scale * 0.45 - right.y * F_scale * 0.15, p_flow.z + fwd.z * F_scale * 0.45 - right.z * F_scale * 0.15, -right.x, -right.y, -right.z, 0, 0.5, 0.5, swayFlex, swayPhase, ao);
      const vK_R = g.vertex(p_flow.x + fwd.x * F_scale * 0.45 + right.x * F_scale * 0.15, p_flow.y + fwd.y * F_scale * 0.45 + right.y * F_scale * 0.15, p_flow.z + fwd.z * F_scale * 0.45 + right.z * F_scale * 0.15, right.x, right.y, right.z, 1, 0.5, 0.5, swayFlex, swayPhase, ao);
      const vK_tip = g.vertex(p_flow.x + fwd.x * F_scale * 0.82 + up.x * F_scale * 0.12, p_flow.y + fwd.y * F_scale * 0.82 + up.y * F_scale * 0.12, p_flow.z + fwd.z * F_scale * 0.82 + up.z * F_scale * 0.12, fwd.x, fwd.y, fwd.z, 0.5, 1, 0.5, swayFlex, swayPhase, ao);
      
      g.tri(vK_base, vK_L, vK_tip);
      g.tri(vK_base, vK_tip, vK_R);
    }
  }

  return g.build();
}

/**
 * Helper to build a petiole or small leaf stem as a cross of two orthogonal cards
 */
function buildCrossStrip(
  g: MeshGrower,
  p0: Vector3, p1: Vector3, p2: Vector3,
  w0: number, w1: number, w2: number,
  vdataX: number, swayFlex: number, swayPhase: number, ao: number
): void {
  const d0 = new Vector3().subVectors(p1, p0).normalize();
  const d1 = new Vector3().subVectors(p2, p1).normalize();
  
  const ref = Math.abs(d0.y) < 0.94 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  const n0 = new Vector3().crossVectors(ref, d0).normalize();
  const b0 = new Vector3().crossVectors(d0, n0).normalize();
  
  const dMid = new Vector3().addVectors(d0, d1).normalize();
  const n1 = new Vector3().crossVectors(ref, dMid).normalize();
  const b1 = new Vector3().crossVectors(dMid, n1).normalize();
  
  const n2 = new Vector3().crossVectors(ref, d1).normalize();
  const b2 = new Vector3().crossVectors(d1, n2).normalize();
  
  // Card A
  const a0_L = g.vertex(p0.x - n0.x*w0, p0.y - n0.y*w0, p0.z - n0.z*w0, b0.x, b0.y, b0.z, 0, 0, vdataX, swayFlex*0.3, swayPhase, ao*0.8);
  const a0_R = g.vertex(p0.x + n0.x*w0, p0.y + n0.y*w0, p0.z + n0.z*w0, b0.x, b0.y, b0.z, 1, 0, vdataX, swayFlex*0.3, swayPhase, ao*0.8);
  const a1_L = g.vertex(p1.x - n1.x*w1, p1.y - n1.y*w1, p1.z - n1.z*w1, b1.x, b1.y, b1.z, 0, 0.5, vdataX, swayFlex*0.6, swayPhase, ao*0.9);
  const a1_R = g.vertex(p1.x + n1.x*w1, p1.y + n1.y*w1, p1.z + n1.z*w1, b1.x, b1.y, b1.z, 1, 0.5, vdataX, swayFlex*0.6, swayPhase, ao*0.9);
  const a2_L = g.vertex(p2.x - n2.x*w2, p2.y - n2.y*w2, p2.z - n2.z*w2, b2.x, b2.y, b2.z, 0, 1, vdataX, swayFlex, swayPhase, ao);
  const a2_R = g.vertex(p2.x + n2.x*w2, p2.y + n2.y*w2, p2.z + n2.z*w2, b2.x, b2.y, b2.z, 1, 1, vdataX, swayFlex, swayPhase, ao);
  
  g.quad(a0_L, a0_R, a1_R, a1_L);
  g.quad(a1_L, a1_R, a2_R, a2_L);
  
  // Card B
  const b0_L = g.vertex(p0.x - b0.x*w0, p0.y - b0.y*w0, p0.z - b0.z*w0, -n0.x, -n0.y, -n0.z, 0, 0, vdataX, swayFlex*0.3, swayPhase, ao*0.8);
  const b0_R = g.vertex(p0.x + b0.x*w0, p0.y + b0.y*w0, p0.z + b0.z*w0, -n0.x, -n0.y, -n0.z, 1, 0, vdataX, swayFlex*0.3, swayPhase, ao*0.8);
  const b1_L = g.vertex(p1.x - b1.x*w1, p1.y - b1.y*w1, p1.z - b1.z*w1, -n1.x, -n1.y, -n1.z, 0, 0.5, vdataX, swayFlex*0.6, swayPhase, ao*0.9);
  const b1_R = g.vertex(p1.x + b1.x*w1, p1.y + b1.y*w1, p1.z + b1.z*w1, -n1.x, -n1.y, -n1.z, 1, 0.5, vdataX, swayFlex*0.6, swayPhase, ao*0.9);
  const b2_L = g.vertex(p2.x - b2.x*w2, p2.y - b2.y*w2, p2.z - b2.z*w2, -n2.x, -n2.y, -n2.z, 0, 1, vdataX, swayFlex, swayPhase, ao);
  const b2_R = g.vertex(p2.x + b2.x*w2, p2.y + b2.y*w2, p2.z + b2.z*w2, -n2.x, -n2.y, -n2.z, 1, 1, vdataX, swayFlex, swayPhase, ao);
  
  g.quad(b0_L, b0_R, b1_R, b1_L);
  g.quad(b1_L, b1_R, b2_R, b2_L);
}

/**
 * Helper to build a flower pedicel (stalk) as a cross of two orthogonal cards
 */
function buildPedicel(
  g: MeshGrower,
  from: Vector3, to: Vector3,
  w: number,
  swayFlex: number, swayPhase: number,
  ao: number
): void {
  const d = new Vector3().subVectors(to, from).normalize();
  const ref = Math.abs(d.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  const n = new Vector3().crossVectors(ref, d).normalize();
  const b = new Vector3().crossVectors(d, n).normalize();
  
  // Card A
  const a0_L = g.vertex(from.x - n.x*w, from.y - n.y*w, from.z - n.z*w, b.x, b.y, b.z, 0, 0, 0.0, swayFlex, swayPhase, ao);
  const a0_R = g.vertex(from.x + n.x*w, from.y + n.y*w, from.z + n.z*w, b.x, b.y, b.z, 1, 0, 0.0, swayFlex, swayPhase, ao);
  const a1_L = g.vertex(to.x - n.x*w, to.y - n.y*w, to.z - n.z*w, b.x, b.y, b.z, 0, 1, 0.0, swayFlex, swayPhase, ao);
  const a1_R = g.vertex(to.x + n.x*w, to.y + n.y*w, to.z + n.z*w, b.x, b.y, b.z, 1, 1, 0.0, swayFlex, swayPhase, ao);
  g.quad(a0_L, a0_R, a1_R, a1_L);
  
  // Card B
  const b0_L = g.vertex(from.x - b.x*w, from.y - b.y*w, from.z - b.z*w, -n.x, -n.y, -n.z, 0, 0, 0.0, swayFlex, swayPhase, ao);
  const b0_R = g.vertex(from.x + b.x*w, from.y + b.y*w, from.z + b.z*w, -n.x, -n.y, -n.z, 1, 0, 0.0, swayFlex, swayPhase, ao);
  const b1_L = g.vertex(to.x - b.x*w, to.y - b.y*w, to.z - b.z*w, -n.x, -n.y, -n.z, 0, 1, 0.0, swayFlex, swayPhase, ao);
  const b1_R = g.vertex(to.x + b.x*w, to.y + b.y*w, to.z + b.z*w, -n.x, -n.y, -n.z, 1, 1, 0.0, swayFlex, swayPhase, ao);
  g.quad(b0_L, b0_R, b1_R, b1_L);
}
