import * as THREE from 'three';
import type { WorldContext } from './Scenes';
import { buildVegLibrary } from '../vegetation/VegLibrary';
import { VegClass } from '../gpu/passes/Scatter';

// ----------------------------------------------------------------------------
// 3D Perlin Noise Implementation
// ----------------------------------------------------------------------------
class PerlinNoise {
  private p: number[] = new Array(512);

  constructor(seed: number = 0) {
    const permutation = Array.from({ length: 256 }, (_, i) => i);
    let r = seed;
    const rng = () => {
      r = (r * 1664525 + 1013904223) | 0;
      return Math.abs(r) / 2147483647;
    };
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = permutation[i]!;
      permutation[i] = permutation[j]!;
      permutation[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.p[i] = permutation[i & 255]!;
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.p[X]! + Y;
    const AA = this.p[A & 512]! + Z;
    const AB = this.p[(A + 1) & 512]! + Z;
    const B = this.p[(X + 1) & 512]! + Y;
    const BA = this.p[B & 512]! + Z;
    const BB = this.p[(B + 1) & 512]! + Z;

    return this.lerp(w,
      this.lerp(v,
        this.lerp(u,
          this.grad(this.p[AA & 512]!, x, y, z),
          this.grad(this.p[BA & 512]!, x - 1, y, z)
        ),
        this.lerp(u,
          this.grad(this.p[AB & 512]!, x, y - 1, z),
          this.grad(this.p[BB & 512]!, x - 1, y - 1, z)
        )
      ),
      this.lerp(v,
        this.lerp(u,
          this.grad(this.p[(AA + 1) & 512]!, x, y, z - 1),
          this.grad(this.p[(BA + 1) & 512]!, x - 1, y, z - 1)
        ),
        this.lerp(u,
          this.grad(this.p[(AB + 1) & 512]!, x, y - 1, z - 1),
          this.grad(this.p[(BB + 1) & 512]!, x - 1, y - 1, z - 1)
        )
      )
    );
  }

  fbm(x: number, y: number, z: number, octaves: number = 4): number {
    let value = 0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value / maxValue;
  }
}

// ----------------------------------------------------------------------------
// Scene Builder
// ----------------------------------------------------------------------------
export async function buildPlanetScene(ctx: WorldContext): Promise<void> {
  const { engine, seed } = ctx;
  const scene = engine.scene;

  // 1. Deep space setup
  engine.renderer.setClearColor(0x010103, 1);
  
  // Starfield particle system
  const starCount = 6000;
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    // Distribute stars on a large sphere radius 3000
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 2500 + Math.random() * 1000;

    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = r * Math.cos(phi);

    // Give stars slightly different white/yellow/blue temperatures
    const c = 0.7 + Math.random() * 0.3;
    starColors[i * 3] = c;
    starColors[i * 3 + 1] = c + (Math.random() - 0.5) * 0.1;
    starColors[i * 3 + 2] = c + Math.random() * 0.2;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMaterial = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // 2. Lighting setup
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
  sunLight.position.set(1200, 1000, 800);
  scene.add(sunLight);

  const ambientLight = new THREE.AmbientLight(0x0c0d12);
  scene.add(ambientLight);

  // 3. Build SDK vegetation library for geometry pools
  ctx.progress(0.1, 'Baking SDK vegetation models');
  const vegLib = await buildVegLibrary(engine.renderer, seed, (p, m) => ctx.progress(0.1 + p * 0.4, m));

  // Helper to create InstancedMeshes for a planet
  const createPlanetAssetGroup = (planetCenter: THREE.Vector3, maxInstances: number = 3000) => {
    const group = new THREE.Group();
    group.position.copy(planetCenter);
    scene.add(group);

    // Map to store InstancedMeshes by `class_variant_part`
    const instancedMeshes = new Map<string, { mesh: THREE.InstancedMesh, count: number }>();

    const addInstance = (cls: number, variant: number, matrix: THREE.Matrix4) => {
      const pool = vegLib.pools.find(p => p.cls === cls && p.variant === variant);
      if (!pool || !pool.r1) return;

      pool.r1.forEach((part, partIdx) => {
        const key = `${cls}_${variant}_${partIdx}`;
        let record = instancedMeshes.get(key);
        if (!record) {
          const instMesh = new THREE.InstancedMesh(part.geo, part.make(), maxInstances);
          instMesh.castShadow = part.castShadow;
          instMesh.receiveShadow = true;
          group.add(instMesh);
          record = { mesh: instMesh, count: 0 };
          instancedMeshes.set(key, record);
        }
        if (record.count < maxInstances) {
          record.mesh.setMatrixAt(record.count, matrix);
          record.count++;
        }
      });
    };

    const finalize = () => {
      instancedMeshes.forEach(record => {
        record.mesh.instanceMatrix.needsUpdate = true;
      });
    };

    return { addInstance, finalize };
  };

  // 4. Planet generator configurations
  const noiseGen = new PerlinNoise(seed.seed);
  
  const planetsConfig = [
    {
      name: 'Lush Planet',
      center: new THREE.Vector3(0, 0, 0),
      radius: 140,
      scale: 24, // height scale
      freq: 0.012,
      biomes: ['lush'],
      allowedTrees: [VegClass.Beech, VegClass.Birch, VegClass.Oak],
      allowedFoliage: [VegClass.Fern, VegClass.FlowerUmbel, VegClass.FlowerDaisy],
      colors: {
        oceanBed: new THREE.Color(0x101b12),
        beach: new THREE.Color(0xdad0a5),
        grass: new THREE.Color(0x408040),
        rock: new THREE.Color(0x606560),
        snow: new THREE.Color(0xf0f0f5),
        water: 0x1f5f8f
      }
    },
    {
      name: 'Desert Outpost',
      center: new THREE.Vector3(1000, 300, 700),
      radius: 100,
      scale: 18,
      freq: 0.018,
      biomes: ['desert'],
      allowedTrees: [VegClass.Joshua, VegClass.Acacia, VegClass.Mesquite],
      allowedFoliage: [VegClass.DryGrassTuft, VegClass.Creosote],
      colors: {
        oceanBed: new THREE.Color(0x3d2012),
        beach: new THREE.Color(0xe6af6e),
        grass: new THREE.Color(0xd28f46), // reddish/orange grasslands
        rock: new THREE.Color(0x9a4b32), // red sandstone
        snow: new THREE.Color(0xebdcc3),
        water: 0x8a4b2a // dusty brackish water
      }
    },
    {
      name: 'Frozen Tundra',
      center: new THREE.Vector3(-800, -200, -800),
      radius: 120,
      scale: 22,
      freq: 0.015,
      biomes: ['frozen'],
      allowedTrees: [VegClass.Spruce, VegClass.Pine, VegClass.Willow],
      allowedFoliage: [VegClass.Fern, VegClass.SwampReed],
      colors: {
        oceanBed: new THREE.Color(0x0e1c29),
        beach: new THREE.Color(0xaed7e0),
        grass: new THREE.Color(0x487d7b), // icy cyan vegetation
        rock: new THREE.Color(0x4a5d6a),
        snow: new THREE.Color(0xffffff),
        water: 0x3f9faf
      }
    }
  ];

  ctx.progress(0.6, 'Generating space planets');

  planetsConfig.forEach((pConfig, pIdx) => {
    const detail = 80; // geometry segment detail (toned down for high perf)
    const sphereGeo = new THREE.SphereGeometry(pConfig.radius, detail, detail);
    
    // Deform vertices on CPU
    const posAttr = sphereGeo.attributes.position;
    const vertexColors = new Float32Array(posAttr.count * 3);
    const localPositions: THREE.Vector3[] = [];

    // Temporary variables for deformation and coloring
    const v = new THREE.Vector3();
    const radial = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i);
      radial.copy(v).normalize();

      // Read noise using absolute 3D position to deform
      const noiseVal = noiseGen.fbm(
        (v.x + pConfig.center.x) * pConfig.freq,
        (v.y + pConfig.center.y) * pConfig.freq,
        (v.z + pConfig.center.z) * pConfig.freq,
        4
      );

      // Height displacement
      const height = noiseVal * pConfig.scale;
      v.addScaledVector(radial, height);
      posAttr.setXYZ(i, v.x, v.y, v.z);
      localPositions.push(v.clone());
    }

    sphereGeo.computeVertexNormals();
    const normAttr = sphereGeo.attributes.normal;

    // Apply vertex coloring based on height and slope
    const n = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      v.copy(localPositions[i]!);
      n.fromBufferAttribute(normAttr, i);
      radial.copy(v).normalize();

      const height = v.length() - pConfig.radius;
      const slope = 1.0 - n.dot(radial);

      let color = pConfig.colors.grass;

      if (height < 0.5) {
        color = pConfig.colors.oceanBed;
      } else if (height < pConfig.scale * 0.12) {
        color = pConfig.colors.beach;
      } else if (slope > 0.28) {
        color = pConfig.colors.rock;
      } else if (height > pConfig.scale * 0.55) {
        color = pConfig.colors.snow;
      }

      vertexColors[i * 3] = color.r;
      vertexColors[i * 3 + 1] = color.g;
      vertexColors[i * 3 + 2] = color.b;
    }

    sphereGeo.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));

    const planetMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05
    });

    const planetMesh = new THREE.Mesh(sphereGeo, planetMat);
    planetMesh.position.copy(pConfig.center);
    planetMesh.castShadow = true;
    planetMesh.receiveShadow = true;
    scene.add(planetMesh);

    // Faint atmosphere glow shell
    const glowGeo = new THREE.SphereGeometry(pConfig.radius * 1.06, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: pConfig.colors.water,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.copy(pConfig.center);
    scene.add(glowMesh);

    // Ocean transparent sphere
    const waterGeo = new THREE.SphereGeometry(pConfig.radius + 0.5, 64, 64);
    const waterMat = new THREE.MeshStandardMaterial({
      color: pConfig.colors.water,
      transparent: true,
      opacity: 0.65,
      roughness: 0.2,
      metalness: 0.1
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.copy(pConfig.center);
    scene.add(waterMesh);

    // Asset placement
    const assetGroup = createPlanetAssetGroup(pConfig.center, 1200);
    const rng = seed.rng(`planet-scatter-${pIdx}`);

    const sampleCount = 450;
    const instMatrix = new THREE.Matrix4();
    const instPos = new THREE.Vector3();
    const instQuat = new THREE.Quaternion();
    const instScale = new THREE.Vector3();

    const alignY = new THREE.Vector3(0, 1, 0);

    for (let sIdx = 0; sIdx < sampleCount; sIdx++) {
      // Pick a random point on unit sphere
      const u = rng.float();
      const wVal = rng.float();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * wVal - 1.0);

      const rx = Math.sin(phi) * Math.cos(theta);
      const ry = Math.sin(phi) * Math.sin(theta);
      const rz = Math.cos(phi);

      const normDir = new THREE.Vector3(rx, ry, rz);

      // Noise height at this point
      const ptNoise = noiseGen.fbm(
        (rx * pConfig.radius + pConfig.center.x) * pConfig.freq,
        (ry * pConfig.radius + pConfig.center.y) * pConfig.freq,
        (rz * pConfig.radius + pConfig.center.z) * pConfig.freq,
        4
      );

      const height = ptNoise * pConfig.scale;

      // Only place assets on dry land (above ocean level)
      if (height > pConfig.scale * 0.15 && height < pConfig.scale * 0.55) {
        // Compute position on deformed sphere surface
        instPos.copy(normDir).multiplyScalar(pConfig.radius + height);

        // Align asset rotation with the spherical normal
        instQuat.setFromUnitVectors(alignY, normDir);

        // Add random yaw rotation around its local normal axis
        const yawQ = new THREE.Quaternion();
        yawQ.setFromAxisAngle(normDir, rng.float() * Math.PI * 2);
        instQuat.premultiply(yawQ);

        // Random scaling
        const sc = 0.6 + rng.float() * 0.5;
        instScale.set(sc, sc, sc);

        instMatrix.compose(instPos, instQuat, instScale);

        // Choose between tree or rock
        const isTree = rng.float() < 0.65;
        if (isTree && pConfig.allowedTrees.length > 0) {
          const cls = pConfig.allowedTrees[Math.floor(rng.float() * pConfig.allowedTrees.length)]!;
          const variant = Math.floor(rng.float() * 4);
          assetGroup.addInstance(cls, variant, instMatrix);
        } else if (pConfig.allowedFoliage.length > 0) {
          const cls = pConfig.allowedFoliage[Math.floor(rng.float() * pConfig.allowedFoliage.length)]!;
          const variant = Math.floor(rng.float() * 4);
          assetGroup.addInstance(cls, variant, instMatrix);
        }
      }
    }

    assetGroup.finalize();
  });

  ctx.hooks.initialPose = {
    p: [0, 0, 320],
    yaw: 0,
    pitch: 0
  };
  ctx.hooks.initialPoseMode = 'fly';

  // Explicitly configure fly mode
  ctx.hooks.disableFlyCam = false;
  ctx.hooks.flyCamEnabled?.(true);

  // F3 HUD status hooks
  ctx.hooks.getSeason = () => ({
    label: 'Space',
    day: 0,
    coldK: 0,
    growthK: 0,
    phase: 0
  });

  ctx.progress(1.0, 'ready');
}
