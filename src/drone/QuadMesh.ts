/**
 * Procedural quadcopter mesh — carbon frame, arms, motors, props.
 */

import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  SphereGeometry,
} from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color } from 'three/tsl';

export interface BuiltQuad {
  root: Group;
  props: Mesh[];
  tris: number;
}

function mat(hex: string, rough = 0.55, metal = 0.25): MeshStandardNodeMaterial {
  const m = new MeshStandardNodeMaterial();
  m.colorNode = color(hex);
  m.roughness = rough;
  m.metalness = metal;
  return m;
}

function addMesh(
  root: Group,
  geo: BoxGeometry | CylinderGeometry | SphereGeometry,
  material: MeshStandardNodeMaterial,
  x = 0,
  y = 0,
  z = 0,
): Mesh {
  const mesh = new Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

/**
 * Build a ~0.55 m diagonal racing/cinema style quad at local origin,
 * +Z forward, +Y up (matches LAAS world / camera convention).
 */
export function buildQuadcopter(): BuiltQuad {
  const root = new Group();
  root.name = 'quadcopter';

  const bodyMat = mat('#1a1c20', 0.45, 0.55);
  const accentMat = mat('#c45a2a', 0.4, 0.3);
  const motorMat = mat('#111111', 0.35, 0.7);
  const propMat = mat('#2a3340', 0.55, 0.15);
  propMat.transparent = true;
  propMat.opacity = 0.72;
  const skidMat = mat('#3a3f48', 0.6, 0.35);
  const domeMat = mat('#d8dde8', 0.2, 0.05);

  addMesh(root, new BoxGeometry(0.18, 0.07, 0.26), bodyMat);
  addMesh(root, new BoxGeometry(0.1, 0.045, 0.08), bodyMat, 0, 0.01, 0.15);

  const dome = addMesh(root, new SphereGeometry(0.035, 12, 8), domeMat, 0, 0.055, -0.02);
  dome.scale.set(1, 0.55, 1);

  const cam = addMesh(root, new CylinderGeometry(0.022, 0.028, 0.04, 10), motorMat, 0, -0.02, 0.18);
  cam.rotation.x = Math.PI / 2;

  const armLen = 0.22;
  const armSpread = 0.72;
  const props: Mesh[] = [];

  for (let i = 0; i < 4; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const fore = i < 2 ? 1 : -1;
    const yaw = Math.atan2(side * Math.sin(armSpread), fore * Math.cos(armSpread));
    const ex = Math.sin(yaw) * armLen;
    const ez = Math.cos(yaw) * armLen;

    const arm = addMesh(root, new BoxGeometry(0.028, 0.018, armLen), bodyMat);
    arm.position.set(ex * 0.5, 0, ez * 0.5);
    arm.rotation.y = yaw;

    addMesh(root, new BoxGeometry(0.03, 0.012, 0.03), accentMat, ex, 0.012, ez);
    addMesh(root, new CylinderGeometry(0.028, 0.028, 0.032, 12), motorMat, ex, 0.02, ez);

    const prop = addMesh(root, new BoxGeometry(0.22, 0.004, 0.022), propMat, ex, 0.042, ez);
    prop.castShadow = false;
    props.push(prop);
  }

  for (const sx of [-0.07, 0.07]) {
    addMesh(root, new BoxGeometry(0.012, 0.012, 0.28), skidMat, sx, -0.055, 0);
    addMesh(root, new BoxGeometry(0.01, 0.05, 0.01), skidMat, sx, -0.03, 0.1);
    addMesh(root, new BoxGeometry(0.01, 0.05, 0.01), skidMat, sx, -0.03, -0.1);
  }

  let tris = 0;
  root.traverse((o) => {
    const m = o as Mesh;
    if (m.isMesh && m.geometry) {
      const idx = m.geometry.index;
      tris += idx ? idx.count / 3 : m.geometry.attributes.position!.count / 3;
    }
  });

  return { root, props, tris: Math.round(tris) };
}
