import * as THREE from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { cameraPosition, float, normalWorld, positionWorld, vec3, vec4 } from 'three/tsl';
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

  // Fractional Brownian Motion
  fbm(x: number, y: number, z: number, octaves: number = 4): number {
    let value = 0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
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
  const starCount = 8000;
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 12000 + Math.random() * 8000;

    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = r * Math.cos(phi);

    const c = 0.65 + Math.random() * 0.35;
    starColors[i * 3] = c;
    starColors[i * 3 + 1] = c + (Math.random() - 0.5) * 0.08;
    starColors[i * 3 + 2] = c + Math.random() * 0.18;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMaterial = new THREE.PointsMaterial({
    size: 3.5,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // 2. Lighting setup
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
  sunLight.position.set(4000, 3000, 3000);
  scene.add(sunLight);

  const ambientLight = new THREE.AmbientLight(0x0a0c10);
  scene.add(ambientLight);

  // 3. Build SDK vegetation library for geometry pools
  ctx.progress(0.1, 'Baking SDK vegetation models');
  const vegLib = await buildVegLibrary(engine.renderer, seed, (p, m) => ctx.progress(0.1 + p * 0.3, m));

  // Registry tracking for distance culling
  const planetAssets: {
    center: THREE.Vector3;
    radius: number;
    meshes: THREE.InstancedMesh[];
  }[] = [];

  // Helper to create InstancedMeshes for a planet
  const createPlanetAssetGroup = (planetCenter: THREE.Vector3, maxInstances: number = 4000) => {
    const group = new THREE.Group();
    group.position.copy(planetCenter);
    scene.add(group);

    const instancedMeshes = new Map<string, { mesh: THREE.InstancedMesh, count: number }>();
    const meshList: THREE.InstancedMesh[] = [];

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
          meshList.push(instMesh);
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

    return { addInstance, finalize, meshList };
  };

  // 4. Planet generator configurations (properly scaled to ~1000m)
  const noiseGen = new PerlinNoise(seed.seed);
  
  const planetsConfig = [
    {
      name: 'Lush Planet',
      center: new THREE.Vector3(0, 0, 0),
      radius: 1000,
      scale: 120, // height scale (12% of radius)
      freq: 0.0018,
      biomes: ['lush'],
      allowedTrees: [VegClass.Beech, VegClass.Birch, VegClass.Oak],
      allowedFoliage: [VegClass.Fern, VegClass.FlowerUmbel, VegClass.FlowerDaisy],
      colors: {
        oceanBed: new THREE.Color(0x0e1814),
        beach: new THREE.Color(0xded6a9),
        grass: new THREE.Color(0x3c783c),
        rock: new THREE.Color(0x5a5f5a),
        snow: new THREE.Color(0xf0f0f5),
        water: new THREE.Color(0x194b75),
        atmosphere: new THREE.Color(0x4ca3e0)
      }
    },
    {
      name: 'Desert Outpost',
      center: new THREE.Vector3(6000, 1500, 5000),
      radius: 800,
      scale: 90,
      freq: 0.0022,
      biomes: ['desert'],
      allowedTrees: [VegClass.Joshua, VegClass.Acacia, VegClass.Mesquite],
      allowedFoliage: [VegClass.DryGrassTuft, VegClass.Creosote],
      colors: {
        oceanBed: new THREE.Color(0x351b0f),
        beach: new THREE.Color(0xebb373),
        grass: new THREE.Color(0xcc8139),
        rock: new THREE.Color(0x943d24),
        snow: new THREE.Color(0xe0cdb4),
        water: new THREE.Color(0x7c3f1e),
        atmosphere: new THREE.Color(0xe08f5c)
      }
    },
    {
      name: 'Frozen Tundra',
      center: new THREE.Vector3(-5000, -800, -6000),
      radius: 900,
      scale: 100,
      freq: 0.0020,
      biomes: ['frozen'],
      allowedTrees: [VegClass.Spruce, VegClass.Pine, VegClass.Willow],
      allowedFoliage: [VegClass.Fern, VegClass.SwampReed],
      colors: {
        oceanBed: new THREE.Color(0x0b1724),
        beach: new THREE.Color(0xa3d1db),
        grass: new THREE.Color(0x427674),
        rock: new THREE.Color(0x445866),
        snow: new THREE.Color(0xffffff),
        water: new THREE.Color(0x358e9e),
        atmosphere: new THREE.Color(0x73d3e6)
      }
    }
  ];

  ctx.progress(0.5, 'Generating planets LOD models');

  // Deform geometry CPU helper
  const deformSphere = (pConfig: typeof planetsConfig[number], detail: number) => {
    const geo = new THREE.SphereGeometry(pConfig.radius, detail, detail);
    const posAttr = geo.attributes.position;
    const vertexColors = new Float32Array(posAttr.count * 3);
    const localPos = new THREE.Vector3();
    const radial = new THREE.Vector3();
    const n = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      localPos.fromBufferAttribute(posAttr, i);
      radial.copy(localPos).normalize();

      const noiseVal = noiseGen.fbm(
        (localPos.x + pConfig.center.x) * pConfig.freq,
        (localPos.y + pConfig.center.y) * pConfig.freq,
        (localPos.z + pConfig.center.z) * pConfig.freq,
        4
      );

      const height = noiseVal * pConfig.scale;
      localPos.addScaledVector(radial, height);
      posAttr.setXYZ(i, localPos.x, localPos.y, localPos.z);
    }

    geo.computeVertexNormals();
    const normAttr = geo.attributes.normal;

    for (let i = 0; i < posAttr.count; i++) {
      localPos.fromBufferAttribute(posAttr, i);
      n.fromBufferAttribute(normAttr, i);
      radial.copy(localPos).normalize();

      const height = localPos.length() - pConfig.radius;
      const slope = 1.0 - n.dot(radial);

      let color = pConfig.colors.grass;

      if (height < 1.5) {
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

    geo.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));
    return geo;
  };

  planetsConfig.forEach((pConfig, pIdx) => {
    // A. Create Three.js LOD geometry swapping
    const lod = new THREE.LOD();
    
    // Deform geometries at different detail resolutions
    const geoHigh = deformSphere(pConfig, 160); // LOD 0 (High)
    const geoMed = deformSphere(pConfig, 64);   // LOD 1 (Medium)
    const geoLow = deformSphere(pConfig, 24);   // LOD 2 (Low)

    const planetMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05
    });

    const meshHigh = new THREE.Mesh(geoHigh, planetMat);
    meshHigh.castShadow = true;
    meshHigh.receiveShadow = true;
    lod.addLevel(meshHigh, 0);

    const meshMed = new THREE.Mesh(geoMed, planetMat);
    meshMed.castShadow = true;
    meshMed.receiveShadow = true;
    lod.addLevel(meshMed, 1800);

    const meshLow = new THREE.Mesh(geoLow, planetMat);
    meshLow.castShadow = true;
    meshLow.receiveShadow = true;
    lod.addLevel(meshLow, 4000);

    lod.position.copy(pConfig.center);
    scene.add(lod);

    // B. Custom Atmosphere Fresnel Glow Shader via native TSL nodes
    const atmosphereGeo = new THREE.SphereGeometry(pConfig.radius * 1.08, 48, 48);
    const viewDir = cameraPosition.sub(positionWorld).normalize();
    const dVal = normalWorld.dot(viewDir).clamp(0, 1);
    const intensity = float(1.0).sub(dVal).pow(4.0); // Fresnel power
    
    const glowNode = vec4(vec3(pConfig.colors.atmosphere.r, pConfig.colors.atmosphere.g, pConfig.colors.atmosphere.b), intensity.mul(0.85)); // Fresnel power

    const atmosphereMat = new MeshBasicNodeMaterial({
      colorNode: glowNode,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });

    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    atmosphereMesh.position.copy(pConfig.center);
    scene.add(atmosphereMesh);

    // C. Ocean sphere
    const waterGeo = new THREE.SphereGeometry(pConfig.radius + 1.0, 64, 64);
    const waterMat = new THREE.MeshStandardMaterial({
      color: pConfig.colors.water,
      transparent: true,
      opacity: 0.65,
      roughness: 0.15,
      metalness: 0.1
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.copy(pConfig.center);
    scene.add(waterMesh);

    // D. Procedural Asset Placement
    const assetGroup = createPlanetAssetGroup(pConfig.center, 3000);
    const rng = seed.rng(`planet-scatter-${pIdx}`);

    // Generate vegetation instances on the deformed high-resolution surface
    const sampleCount = 1200; // Increased to cover larger radius
    const instMatrix = new THREE.Matrix4();
    const instPos = new THREE.Vector3();
    const instQuat = new THREE.Quaternion();
    const instScale = new THREE.Vector3();
    const alignY = new THREE.Vector3(0, 1, 0);

    for (let sIdx = 0; sIdx < sampleCount; sIdx++) {
      const u = rng.float();
      const wVal = rng.float();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * wVal - 1.0);

      const rx = Math.sin(phi) * Math.cos(theta);
      const ry = Math.sin(phi) * Math.sin(theta);
      const rz = Math.cos(phi);

      const normDir = new THREE.Vector3(rx, ry, rz);

      const ptNoise = noiseGen.fbm(
        (rx * pConfig.radius + pConfig.center.x) * pConfig.freq,
        (ry * pConfig.radius + pConfig.center.y) * pConfig.freq,
        (rz * pConfig.radius + pConfig.center.z) * pConfig.freq,
        4
      );

      const height = ptNoise * pConfig.scale;

      // Restrict vegetation placement to land (above water line, below snow caps)
      if (height > pConfig.scale * 0.14 && height < pConfig.scale * 0.55) {
        instPos.copy(normDir).multiplyScalar(pConfig.radius + height);

        // Align rotation with spherical normal
        instQuat.setFromUnitVectors(alignY, normDir);
        const yawQ = new THREE.Quaternion();
        yawQ.setFromAxisAngle(normDir, rng.float() * Math.PI * 2);
        instQuat.premultiply(yawQ);

        // Tree scaling (proportionate relative to planet radius)
        const sc = 0.55 + rng.float() * 0.45;
        instScale.set(sc, sc, sc);

        instMatrix.compose(instPos, instQuat, instScale);

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

    // Register meshes for distance culling
    planetAssets.push({
      center: pConfig.center,
      radius: pConfig.radius,
      meshes: assetGroup.meshList
    });
  });

  // 5. Distance Culling Hook Loop
  engine.onUpdate(() => {
    const camPos = engine.camera.position;
    planetAssets.forEach(planet => {
      const dist = camPos.distanceTo(planet.center);
      // Completely hide asset meshes if the planet is far away
      const isVisible = dist < planet.radius * 3.5;
      planet.meshes.forEach(m => {
        m.visible = isVisible;
      });
    });
  });

  // 6. Initial camera pose (looking at first planet)
  ctx.hooks.initialPose = {
    p: [0, 0, 2200], // Start 2200m away (properly scaled distance)
    yaw: 0,
    pitch: 0
  };
  ctx.hooks.initialPoseMode = 'fly';

  ctx.hooks.disableFlyCam = false;
  ctx.hooks.flyCamEnabled?.(true);

  ctx.hooks.getSeason = () => ({
    label: 'Space',
    day: 0,
    coldK: 0,
    growthK: 0,
    phase: 0
  });

  ctx.progress(1.0, 'ready');
}
