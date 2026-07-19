import * as THREE from 'three';
import { MeshBasicNodeMaterial, MeshStandardNodeMaterial } from 'three/webgpu';
import {
  cameraPosition,
  float,
  normalWorld,
  positionWorld,
  vec3,
  vec4,
  time,
  mix,
  smoothstep,
  normalLocal,
  transformNormalToView,
  positionLocal
} from 'three/tsl';
import type { WorldContext } from './Scenes';
import { buildVegLibrary } from '../vegetation/VegLibrary';
import { VegClass } from '../gpu/passes/Scatter';
import { fbm3 } from '../gpu/noise/NoiseTSL';

// ----------------------------------------------------------------------------
// 3D Perlin Noise Implementation (CPU side for deformation + asset scattering)
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
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value / maxValue;
  }
}

// ----------------------------------------------------------------------------
// Custom Atmosphere Shader (Fresnel Limb Glow in TSL)
// ----------------------------------------------------------------------------
const buildAtmosphereMaterial = (color: THREE.Color) => {
  const viewDir = cameraPosition.sub(positionWorld).normalize();
  const dVal = normalWorld.dot(viewDir).clamp(0, 1);
  const intensity = float(1.0).sub(dVal).pow(4.0); // Soft Fresnel limb glow

  const glowNode = vec4(vec3(color.r, color.g, color.b), intensity.mul(0.88));

  return new MeshBasicNodeMaterial({
    colorNode: glowNode,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });
};

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

  const planetLODs: THREE.LOD[] = [];

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
        record.mesh.count = record.count; // Crucial performance fix: only render actual placed instances!
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
        oceanBed: new THREE.Color(0x0a120d),
        beach: new THREE.Color(0xdad0a5),
        grass: new THREE.Color(0x326e32),
        rock: new THREE.Color(0x565c56),
        snow: new THREE.Color(0xf5f5fa),
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
        oceanBed: new THREE.Color(0x2d170b),
        beach: new THREE.Color(0xe6aa68),
        grass: new THREE.Color(0xc27732),
        rock: new THREE.Color(0x8a331c),
        snow: new THREE.Color(0xdfcbb0),
        water: new THREE.Color(0x753a1a),
        atmosphere: new THREE.Color(0xd98452)
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
        oceanBed: new THREE.Color(0x09141f),
        beach: new THREE.Color(0x99cbda),
        grass: new THREE.Color(0x3b6e6c),
        rock: new THREE.Color(0x3e5260),
        snow: new THREE.Color(0xffffff),
        water: new THREE.Color(0x318796),
        atmosphere: new THREE.Color(0x6dd0e6)
      }
    }
  ];

  ctx.progress(0.5, 'Generating planets LOD models');

  // Deform geometry CPU helper
  const deformSphere = (pConfig: typeof planetsConfig[number], detail: number) => {
    const geo = new THREE.SphereGeometry(pConfig.radius, detail, detail);
    const posAttr = geo.attributes.position;
    const localPos = new THREE.Vector3();
    const radial = new THREE.Vector3();

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
    return geo;
  };

  planetsConfig.forEach((pConfig, pIdx) => {
    // A. Create Three.js LOD geometry swapping
    const lod = new THREE.LOD();
    
    // Deform geometries at different detail resolutions (LOD 0 = 240 subdivisions for massive close-up details!)
    const geoHigh = deformSphere(pConfig, 240); // LOD 0 (High)
    const geoMed = deformSphere(pConfig, 64);   // LOD 1 (Medium)
    const geoLow = deformSphere(pConfig, 24);   // LOD 2 (Low)

    // B. Custom TSL Node Material for Planet Terrain Shading (pixel-perfect blending + bump map)
    const height = positionLocal.length().sub(pConfig.radius);
    const radialDir = positionLocal.normalize();
    
    // 1. Procedural normal mapping/bumpiness (adds craggy rock texture details)
    const worldPos = positionLocal.add(vec3(pConfig.center.x, pConfig.center.y, pConfig.center.z));
    const bumpNoise = fbm3(worldPos.mul(0.04), 3); // High frequency noise
    const perturbedNormal = normalLocal.add(bumpNoise.mul(0.12)).normalize();
    const viewSpaceNormal = transformNormalToView(perturbedNormal);

    const slope = float(1.0).sub(perturbedNormal.dot(radialDir)).clamp(0, 1);

    // Color definitions in TSL
    const oceanBedColor = vec3(pConfig.colors.oceanBed.r, pConfig.colors.oceanBed.g, pConfig.colors.oceanBed.b);
    const beachColor = vec3(pConfig.colors.beach.r, pConfig.colors.beach.g, pConfig.colors.beach.b);
    const grassColor = vec3(pConfig.colors.grass.r, pConfig.colors.grass.g, pConfig.colors.grass.b);
    const rockColor = vec3(pConfig.colors.rock.r, pConfig.colors.rock.g, pConfig.colors.rock.b);
    const snowColor = vec3(pConfig.colors.snow.r, pConfig.colors.snow.g, pConfig.colors.snow.b);

    // 2. Pixel-perfect color blending
    // Blend beach sand and grass vegetation
    const tBeach = smoothstep(float(0.0), float(pConfig.scale * 0.12), height);
    let baseColor = mix(beachColor, grassColor, tBeach);

    // Blend rocky textures on steep slopes
    const tSlope = smoothstep(float(0.20), float(0.35), slope);
    baseColor = mix(baseColor, rockColor, tSlope);

    // Blend white snow caps on high altitude peaks
    const tSnow = smoothstep(float(pConfig.scale * 0.50), float(pConfig.scale * 0.65), height);
    baseColor = mix(baseColor, snowColor, tSnow);

    // Blend ocean bed mud under the water line
    const tOcean = smoothstep(float(-5.0), float(1.0), height);
    const terrainAlbedo = mix(oceanBedColor, baseColor, tOcean);

    const planetMat = new MeshStandardNodeMaterial({
      colorNode: terrainAlbedo,
      normalNode: viewSpaceNormal,
      roughness: 0.88,
      metalness: 0.04
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
    planetLODs.push(lod);

    // C. Atmosphere Fresnel glow shell
    const atmosphereMat = buildAtmosphereMaterial(pConfig.colors.atmosphere);
    const atmosphereGeo = new THREE.SphereGeometry(pConfig.radius * 1.08, 48, 48);
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    atmosphereMesh.position.copy(pConfig.center);
    scene.add(atmosphereMesh);

    // D. Upgraded Ocean Water Material (depth-based opacity + animated wave normals)
    // 1. Animated wave normals in view space
    const waveTime = time.mul(0.14);
    const wavePos = positionLocal.mul(0.08).add(vec3(waveTime, 0, waveTime.mul(0.5)));
    const waveNoise = fbm3(wavePos, 2);
    const waterNormal = normalLocal.add(waveNoise.mul(0.08)).normalize();
    const waterViewNormal = transformNormalToView(waterNormal);

    // 2. Depth calculation
    const normDir = positionLocal.normalize();
    const noisePos = normDir.mul(pConfig.radius).add(vec3(pConfig.center.x, pConfig.center.y, pConfig.center.z));
    const landHeight = fbm3(noisePos.mul(pConfig.freq), 3).mul(pConfig.scale);
    
    // Water depth above deformed land surface
    const depth = float(pConfig.radius + 1.0).sub(float(pConfig.radius).add(landHeight));

    // Deep water color fade (shallow teal/cyan -> deep dark ocean blue)
    const shallowWater = vec3(pConfig.colors.water.r, pConfig.colors.water.g, pConfig.colors.water.b);
    const deepWater = vec3(0.03, 0.09, 0.22); // Deep dark navy blue
    const waterAlbedo = mix(shallowWater, deepWater, smoothstep(float(0.0), float(30.0), depth));

    // Opacity fade (shallow margins are transparent, deep margins are opaque)
    const waterOpacity = smoothstep(float(0.0), float(25.0), depth).mul(0.68).add(0.22);
    const waterColorNode = vec4(waterAlbedo, waterOpacity);

    const waterGeo = new THREE.SphereGeometry(pConfig.radius + 1.0, 64, 64);
    const waterMat = new MeshStandardNodeMaterial({
      colorNode: waterColorNode,
      normalNode: waterViewNormal,
      roughness: 0.12, // Highly shiny, catches sun glare
      metalness: 0.1,
      transparent: true
    });
    
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.copy(pConfig.center);
    scene.add(waterMesh);

    // E. Procedural Asset Placement
    const assetGroup = createPlanetAssetGroup(pConfig.center, 3000);
    const rng = seed.rng(`planet-scatter-${pIdx}`);

    const sampleCount = 1200;
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

      const sNormDir = new THREE.Vector3(rx, ry, rz);

      const ptNoise = noiseGen.fbm(
        (rx * pConfig.radius + pConfig.center.x) * pConfig.freq,
        (ry * pConfig.radius + pConfig.center.y) * pConfig.freq,
        (rz * pConfig.radius + pConfig.center.z) * pConfig.freq,
        4
      );

      const heightVal = ptNoise * pConfig.scale;

      // Restrict vegetation placement to dry land areas
      if (heightVal > pConfig.scale * 0.14 && heightVal < pConfig.scale * 0.55) {
        instPos.copy(sNormDir).multiplyScalar(pConfig.radius + heightVal);

        instQuat.setFromUnitVectors(alignY, sNormDir);
        const yawQ = new THREE.Quaternion();
        yawQ.setFromAxisAngle(sNormDir, rng.float() * Math.PI * 2);
        instQuat.premultiply(yawQ);

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

  // 5. Distance Culling + Manual LOD Update Loop (WebGPURenderer compatibility)
  engine.onUpdate(() => {
    const cam = engine.camera;
    const camPos = cam.position;

    // A. Perform distance-based asset visibility culling
    planetAssets.forEach(planet => {
      const dist = camPos.distanceTo(planet.center);
      const isVisible = dist < planet.radius * 3.5;
      planet.meshes.forEach(m => {
        m.visible = isVisible;
      });
    });

    // B. Force LOD updates manually on WebGPURenderer (crucial for swapping levels!)
    planetLODs.forEach(lod => {
      lod.update(cam);
    });
  });

  // 6. Initial camera pose
  ctx.hooks.initialPose = {
    p: [0, 0, 2200],
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
