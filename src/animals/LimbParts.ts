/**
 * Split upper/lower limb meshes for 2-bone quadruped / biped kneepivots.
 */

import { BufferGeometry, Vector3 } from 'three';
import { MeshGrower } from '../vegetation/TubeMesh';
import { addTubePath } from './AnimalMesh';

export interface LimbParts {
  upper: BufferGeometry;
  lower: BufferGeometry;
  kneeLocal: Vector3;
}

export function buildLimbParts(opts: {
  front: boolean;
  s: number;
  ringSegs: number;
  hue: number;
  phase: number;
  thick: number;
  kneeDrop: number;
  hoofDrop: number;
  kneeZ: number;
  hoofZ: number;
  partSock?: number;
}): LimbParts {
  const {
    s,
    ringSegs,
    hue,
    phase,
    thick,
    kneeDrop,
    hoofDrop,
    kneeZ,
    hoofZ,
    partSock = 0.48,
  } = opts;
  void opts.front;
  const hip = new Vector3(0, 0, 0);
  const knee = new Vector3(0, -kneeDrop * s, kneeZ * s);
  const fetlock = new Vector3(0, -hoofDrop * s * 0.84, hoofZ * s * 0.85);
  const hoof = new Vector3(0, -hoofDrop * s, hoofZ * s);
  const legR = thick * s;
  const rHoof = legR * 0.85;

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
    part: partSock,
    phase,
    aoBase: 0.58,
    aoTip: 0.72,
  });
  addTubePath(lowerG, [hoofPad, hoof.clone().sub(knee)], [legR * 0.55, rHoof], {
    ringSegs: Math.max(5, ringSegs - 2),
    hue: hue * 0.4,
    part: 0.42,
    phase,
    aoBase: 0.38,
    aoTip: 0.42,
    capEnd: true,
  });

  return {
    upper: upperG.build(),
    lower: lowerG.build(),
    kneeLocal: knee.clone(),
  };
}

export function buildStaticLimb(
  _front: boolean,
  s: number,
  ringSegs: number,
  hue: number,
  phase: number,
  thick: number,
  kneeDrop: number,
  hoofDrop: number,
  kneeZ: number,
  hoofZ: number,
  partSock = 0.48,
): BufferGeometry {
  void _front;
  const g = new MeshGrower();
  const hip = new Vector3(0, 0, 0);
  const knee = new Vector3(0, -kneeDrop * s, kneeZ * s);
  const fetlock = new Vector3(0, -hoofDrop * s * 0.84, hoofZ * s * 0.85);
  const hoof = new Vector3(0, -hoofDrop * s, hoofZ * s);
  const legR = thick * s;
  const rHoof = legR * 0.85;
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
    { ringSegs: Math.max(5, ringSegs - 1), hue, part: partSock, phase, aoBase: 0.58, aoTip: 0.72 },
  );
  addTubePath(
    g,
    [hoof.clone().add(new Vector3(0, rHoof * 0.2, 0)), hoof],
    [legR * 0.55, rHoof],
    {
      ringSegs: Math.max(5, ringSegs - 2),
      hue: hue * 0.4,
      part: 0.42,
      phase,
      aoBase: 0.38,
      aoTip: 0.42,
      capEnd: true,
    },
  );
  return g.build();
}
