import { BufferGeometry, Vector3 } from 'three';
import type { Rng } from '../core/Seed';
import { MeshGrower } from './TubeMesh';

interface StalkRingSpec {
  y: number;
  radius: number;
  part: number;
}

/**
 * Procedural Cattail wetland plant generator.
 * Creates a wetland reed plant with a clump of tall slender arching leaves
 * and 1-3 vertical stalks topped with brown seed heads.
 *
 * Vertex attributes:
 * - vdata.x:
 *   - 0.0 = leaves and stalk (green)
 *   - 1.0 = brown cylindrical seed head (cattail spike)
 *   - 0.5 = terminal tip
 * - vdata.y: sway flexibility (0 rigid base .. 1 flexible tip)
 * - vdata.z: sway phase
 * - vdata.w: baked AO (0.5 dark base .. 1.0 open top)
 */
export function buildCattail(rng: Rng): BufferGeometry {
  const g = new MeshGrower();

  // Overall plant height (1.0 to 1.6 meters)
  const clumpHeight = rng.range(1.0, 1.6);
  const basePhase = rng.float() * Math.PI * 2;

  // 1. Generate 1-3 stalks
  const numStalks = 1 + rng.int(3);
  const stalkSwayFlexTip = 0.4; // Stalks are stiffer than leaves

  for (let s = 0; s < numStalks; s++) {
    // Distribute stalks near the center of the clump
    const stalkAngle = numStalks === 1
      ? rng.float() * Math.PI * 2
      : (s / numStalks) * Math.PI * 2 + rng.range(-0.3, 0.3);
    const rBase = rng.range(0.005, 0.02);
    const baseX = Math.cos(stalkAngle) * rBase;
    const baseZ = Math.sin(stalkAngle) * rBase;

    const stalkHeight = clumpHeight * rng.range(0.95, 1.1);

    // Stalk parts: green base, brown seed head, thin tip
    const seedH = rng.range(0.30, 0.42);
    const tipH = rng.range(0.12, 0.18);
    const yStart = -0.05; // Anchor slightly below ground level
    const greenH = stalkHeight - seedH - tipH;

    const baseRadius = rng.range(0.015, 0.02);
    const topStalkRadius = rng.range(0.012, 0.015);
    const seedRadius = rng.range(0.045, 0.065);
    const tipRadius = rng.range(0.0025, 0.004);

    // Stalks lean outwards slightly
    const leanX = Math.cos(stalkAngle) * rng.range(0.02, 0.06);
    const leanZ = Math.sin(stalkAngle) * rng.range(0.02, 0.06);
    const stalkPhase = basePhase + rng.range(-0.2, 0.2);

    const rings: StalkRingSpec[] = [];

    // Green stalk section
    const numGreenSegs = 10;
    for (let j = 0; j <= numGreenSegs; j++) {
      const t = j / numGreenSegs;
      rings.push({
        y: yStart + t * (greenH - yStart),
        radius: baseRadius + (topStalkRadius - baseRadius) * t,
        part: 0.0,
      });
    }

    // Seed head section (brown spike)
    // Starts with a duplicate ring at greenH to enforce sharp vertex attribute/color transition
    const numSeedSegs = 10;
    for (let j = 0; j <= numSeedSegs; j++) {
      const t = j / numSeedSegs;
      // Cylinder with tapered ends (bulging spike)
      const profile = t < 0.12
        ? Math.sin((t / 0.12) * Math.PI * 0.5)
        : t > 0.88
          ? Math.sin(((1 - t) / 0.12) * Math.PI * 0.5)
          : 1.0;
      const rStalk = topStalkRadius * (1 - t) + tipRadius * t;
      const r = rStalk + (seedRadius - rStalk) * profile;
      rings.push({
        y: greenH + t * seedH,
        radius: r,
        part: 1.0,
      });
    }

    // Thin terminal tip section
    // Starts with a duplicate ring at greenH + seedH for sharp transition
    const numTipSegs = 5;
    for (let j = 0; j <= numTipSegs; j++) {
      const t = j / numTipSegs;
      rings.push({
        y: greenH + seedH + t * tipH,
        radius: tipRadius * (1 - t),
        part: 0.5,
      });
    }

    // Generate cylindrical mesh vertices for the rings
    const segsAround = 8;
    const ringVerts: number[][] = [];
    const T = new Vector3(leanX, 1.0, leanZ).normalize();
    const ref = Math.abs(T.y) < 0.94 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
    const N = new Vector3().crossVectors(ref, T).normalize();
    const B = new Vector3().crossVectors(T, N).normalize();

    for (let rIndex = 0; rIndex < rings.length; rIndex++) {
      const ring = rings[rIndex];
      const cy = ring.y;
      const cx = baseX + cy * leanX;
      const cz = baseZ + cy * leanZ;
      const r = ring.radius;

      const vertRow: number[] = [];
      const flex = stalkSwayFlexTip * (cy / stalkHeight);
      const ao = 0.5 + 0.5 * (cy / stalkHeight);

      for (let k = 0; k <= segsAround; k++) {
        const a = (k / segsAround) * Math.PI * 2;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);

        const dx = N.x * cosA + B.x * sinA;
        const dy = N.y * cosA + B.y * sinA;
        const dz = N.z * cosA + B.z * sinA;

        // Normal points outwards, except at the tip where it points up
        let nx = dx;
        let ny = dy;
        let nz = dz;
        if (rIndex === rings.length - 1) {
          nx = T.x;
          ny = T.y;
          nz = T.z;
        }

        const px = cx + dx * r;
        const py = cy + dy * r;
        const pz = cz + dz * r;

        const u = k / segsAround;
        const v = cy;

        vertRow.push(
          g.vertex(
            px, py, pz,
            nx, ny, nz,
            u, v,
            ring.part, flex, stalkPhase, ao
          )
        );
      }
      ringVerts.push(vertRow);
    }

    // Construct quads, skipping degenerate rings (transitions)
    for (let rIndex = 0; rIndex < rings.length - 1; rIndex++) {
      if (Math.abs(rings[rIndex].y - rings[rIndex + 1].y) < 1e-5) {
        continue;
      }
      const a = ringVerts[rIndex];
      const b = ringVerts[rIndex + 1];
      for (let k = 0; k < segsAround; k++) {
        g.quad(a[k], b[k], b[k + 1], a[k + 1]);
      }
    }
  }

  // 2. Generate clump of arching green leaves
  const numLeaves = 18 + rng.int(8);
  const leafSegs = 10;

  for (let l = 0; l < numLeaves; l++) {
    // Inner leaves are taller and straight; outer leaves are shorter and arch more
    const isInner = l < numLeaves * 0.35;
    const leafHeight = clumpHeight * (isInner ? rng.range(0.85, 1.0) : rng.range(0.6, 0.85));
    const r0 = isInner ? rng.range(0.005, 0.015) : rng.range(0.015, 0.045);
    const archMax = isInner ? rng.range(0.05, 0.15) : rng.range(0.22, 0.38);
    const maxWidth = isInner ? rng.range(0.012, 0.018) : rng.range(0.018, 0.026);

    const angle = (l / numLeaves) * Math.PI * 2 + rng.range(-0.15, 0.15);
    const leafPhase = basePhase + rng.range(-0.4, 0.4);

    const S = new Vector3(-Math.sin(angle), 0, Math.cos(angle)); // azimuthal vector
    const outward = new Vector3(Math.cos(angle), 0, Math.sin(angle)); // radial vector

    const leftVerts: number[] = [];
    const centerVerts: number[] = [];
    const rightVerts: number[] = [];

    const pts: Vector3[] = [];
    const yStart = -0.05;

    for (let i = 0; i <= leafSegs; i++) {
      const t = i / leafSegs;
      const cy = yStart + t * (leafHeight - yStart);
      const arch = Math.pow(t, 2) * archMax;

      const cx = Math.cos(angle) * (r0 + arch) + (rng.float() - 0.5) * 0.01;
      const cz = Math.sin(angle) * (r0 + arch) + (rng.float() - 0.5) * 0.01;
      // Arching effect pulls the height down slightly at the tip
      const p = new Vector3(cx, cy * (1.0 - t * 0.12), cz);
      pts.push(p);
    }

    for (let i = 0; i <= leafSegs; i++) {
      const t = i / leafSegs;
      const pos = pts[i];

      let T: Vector3;
      if (i < leafSegs) {
        T = new Vector3().subVectors(pts[i + 1], pos).normalize();
      } else {
        T = new Vector3().subVectors(pos, pts[i - 1]).normalize();
      }

      const N = new Vector3().crossVectors(S, T).normalize();
      if (N.dot(outward) < 0) {
        N.negate();
      }

      // Taper profile
      const w = maxWidth * (1 - t) * (0.3 + 0.7 * Math.sin(t * Math.PI * 0.5));
      const foldDepth = w * 0.25;

      const centerPos = new Vector3().copy(pos).addScaledVector(N, -foldDepth);
      const leftPos = new Vector3().copy(pos).addScaledVector(S, -w);
      const rightPos = new Vector3().copy(pos).addScaledVector(S, w);

      // Smooth normals pointing outwards
      const leftSideVec = new Vector3().subVectors(centerPos, leftPos);
      const NLeft = new Vector3().crossVectors(leftSideVec, T).normalize();
      if (NLeft.dot(outward) < 0) NLeft.negate();

      const rightSideVec = new Vector3().subVectors(rightPos, centerPos);
      const NRight = new Vector3().crossVectors(rightSideVec, T).normalize();
      if (NRight.dot(outward) < 0) NRight.negate();

      const NCenter = new Vector3().addVectors(NLeft, NRight).normalize();

      const flex = 0.1 + 0.9 * Math.pow(t, 1.5);
      const ao = 0.5 + 0.5 * t;

      leftVerts.push(
        g.vertex(
          leftPos.x, leftPos.y, leftPos.z,
          NLeft.x, NLeft.y, NLeft.z,
          0.0, t,
          0.0, flex, leafPhase, ao
        )
      );

      centerVerts.push(
        g.vertex(
          centerPos.x, centerPos.y, centerPos.z,
          NCenter.x, NCenter.y, NCenter.z,
          0.5, t,
          0.0, flex, leafPhase, ao
        )
      );

      rightVerts.push(
        g.vertex(
          rightPos.x, rightPos.y, rightPos.z,
          NRight.x, NRight.y, NRight.z,
          1.0, t,
          0.0, flex, leafPhase, ao
        )
      );
    }

    for (let i = 0; i < leafSegs; i++) {
      g.quad(leftVerts[i], centerVerts[i], centerVerts[i + 1], leftVerts[i + 1]);
      g.quad(centerVerts[i], rightVerts[i], rightVerts[i + 1], centerVerts[i + 1]);
    }
  }

  return g.build();
}
