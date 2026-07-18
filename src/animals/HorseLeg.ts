/**
 * Horse leg meshes in hip-local space (hip pivot at origin).
 * Split upper (thigh) / lower (cannon + hoof) for 2-bone knee pivots.
 */

import { BufferGeometry, Vector3 } from 'three';
import { MeshGrower } from '../vegetation/TubeMesh';
import { addTubePath } from './AnimalMesh';

export interface HorseLegParts {
  upper: BufferGeometry;
  lower: BufferGeometry;
  kneeLocal: Vector3;
  hoofDrop: number;
}

export function horseKneeLocal(front: boolean, s: number): Vector3 {
  return new Vector3(0, -0.36 * s, (front ? 0.14 : -0.22) * s);
}

export function buildHorseLegParts(
  front: boolean,
  s: number,
  ringSegs: number,
  hue: number,
  phase: number,
  sockPart: number,
): HorseLegParts {
  const hip = new Vector3(0, 0, 0);
  const knee = horseKneeLocal(front, s);
  const fetlock = new Vector3(0, -0.86 * s, (front ? 0.08 : -0.16) * s);
  const hoof = new Vector3(0, -1.02 * s, (front ? 0.06 : -0.14) * s);
  const legR = 0.062 * s;
  const rHoof = legR * 0.8;

  const upperG = new MeshGrower();
  addTubePath(upperG, [hip, knee], [legR, legR * 0.85], {
    ringSegs,
    hue,
    part: 0.28,
    phase,
    aoBase: 0.5,
    aoTip: 0.6,
    capStart: true,
  });

  const lowerG = new MeshGrower();
  addTubePath(lowerG, [new Vector3(0, 0, 0), fetlock.clone().sub(knee)], [legR * 0.85, legR * 0.66], {
    ringSegs,
    hue,
    part: 0.28,
    phase,
    aoBase: 0.52,
    aoTip: 0.64,
  });
  const fetLocal = fetlock.clone().sub(knee);
  const hoofPad = hoof.clone().sub(knee).add(new Vector3(0, rHoof * 0.2, 0));
  addTubePath(lowerG, [fetLocal, hoofPad], [legR * 0.66, legR * 0.55], {
    ringSegs: Math.max(5, ringSegs - 1),
    hue,
    part: sockPart,
    phase,
    aoBase: 0.58,
    aoTip: 0.72,
  });
  addTubePath(
    lowerG,
    [hoofPad, hoof.clone().sub(knee)],
    [legR * 0.55, rHoof],
    { ringSegs: Math.max(5, ringSegs - 2), hue: hue * 0.4, part: 0.42, phase, aoBase: 0.38, aoTip: 0.42, capEnd: true },
  );

  return {
    upper: upperG.build(),
    lower: lowerG.build(),
    kneeLocal: knee.clone(),
    hoofDrop: -hoof.y,
  };
}

/** Static gallery leg (single mesh, no knee pivot). */
export function buildHorseLegLocal(
  front: boolean,
  s: number,
  ringSegs: number,
  hue: number,
  phase: number,
  sockPart: number,
): BufferGeometry {
  const g = new MeshGrower();
  const hip = new Vector3(0, 0, 0);
  const knee = horseKneeLocal(front, s);
  const fetlock = new Vector3(0, -0.86 * s, (front ? 0.08 : -0.16) * s);
  const hoof = new Vector3(0, -1.02 * s, (front ? 0.06 : -0.14) * s);
  const legR = 0.062 * s;
  const rHoof = legR * 0.8;

  addTubePath(g, [hip, knee, fetlock], [legR, legR * 0.85, legR * 0.66], {
    ringSegs,
    hue,
    part: 0.28,
    phase,
    aoBase: 0.5,
    aoTip: 0.64,
  });
  addTubePath(
    g,
    [fetlock, hoof.clone().add(new Vector3(0, rHoof * 0.2, 0))],
    [legR * 0.66, legR * 0.55],
    { ringSegs: Math.max(5, ringSegs - 1), hue, part: sockPart, phase, aoBase: 0.58, aoTip: 0.72 },
  );
  addTubePath(
    g,
    [hoof.clone().add(new Vector3(0, rHoof * 0.2, 0)), hoof],
    [legR * 0.55, rHoof],
    { ringSegs: Math.max(5, ringSegs - 2), hue: hue * 0.4, part: 0.42, phase, aoBase: 0.38, aoTip: 0.42, capEnd: true },
  );
  return g.build();
}
