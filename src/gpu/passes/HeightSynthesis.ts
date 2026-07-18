/**
 * Heightfield synthesis — bakes the macro terrain function into storage
 * buffers (height + hardness) at a given resolution. Used at HEIGHT_RES for
 * the final field and SIM_RES for the erosion working grid.
 */

import type { Renderer, StorageBufferNode } from 'three/webgpu';
import { StorageBufferAttribute } from 'three/webgpu';
import { Fn, If, Return, clamp, float, floor, instanceIndex, instancedArray, mix, storage, vec2 } from 'three/tsl';
import type { MacroParams } from '../../world/MacroMap';
import { macroTerrain } from '../../world/MacroMap';
import { WORLD_SIZE } from '../../world/WorldConst';

export type FloatBuffer = StorageBufferNode<'float'>;

export interface ImportHeightOpts {
  heights: Float32Array;
  res: number;
  demWeight: number;
}

export interface SynthesisResult {
  /** height meters, res×res row-major */
  height: FloatBuffer;
  /** rock hardness 0..1 */
  hardness: FloatBuffer;
  res: number;
}

export interface SynthesisOpts {
  /** chunk world-center offset (m) — shifts macro sampling for streamed tiles */
  worldOffset?: [number, number];
}

export async function runHeightSynthesis(
  renderer: Renderer,
  res: number,
  mp: MacroParams,
  imp?: ImportHeightOpts,
  opts?: SynthesisOpts,
): Promise<SynthesisResult> {
  const offX = opts?.worldOffset?.[0] ?? 0;
  const offZ = opts?.worldOffset?.[1] ?? 0;
  const impHeights = imp?.heights ?? new Float32Array([0]);
  const impBuf = storage(new StorageBufferAttribute(impHeights, 1), 'float', impHeights.length);
  const impRes = imp?.res ?? 1;
  const demW = imp?.demWeight ?? 0;
  const height = instancedArray(res * res, 'float');
  const hardness = instancedArray(res * res, 'float');

  const kernel = Fn(() => {
    const i = instanceIndex;
    If(i.greaterThanEqual(res * res), () => {
      Return();
    });
    const x = i.mod(res);
    const y = i.div(res);
    const wpos = vec2(float(x).add(0.5), float(y).add(0.5))
      .div(res)
      .sub(0.5)
      .mul(WORLD_SIZE)
      .add(vec2(offX, offZ));
    const m = macroTerrain(wpos, mp, 'full');
    const uv = vec2(float(x).add(0.5), float(y).add(0.5)).div(res);
    const fx = uv.x.mul(impRes).sub(0.5);
    const fy = uv.y.mul(impRes).sub(0.5);
    const x0 = clamp(floor(fx), 0, impRes - 1);
    const y0 = clamp(floor(fy), 0, impRes - 1);
    const x1 = clamp(x0.add(1), 0, impRes - 1);
    const y1 = clamp(y0.add(1), 0, impRes - 1);
    const tx = fx.sub(x0);
    const ty = fy.sub(y0);
    const i00 = y0.mul(impRes).add(x0);
    const i10 = y0.mul(impRes).add(x1);
    const i01 = y1.mul(impRes).add(x0);
    const i11 = y1.mul(impRes).add(x1);
    const demH = impBuf
      .element(i00)
      .mul(float(1).sub(tx).mul(float(1).sub(ty)))
      .add(impBuf.element(i10).mul(tx.mul(float(1).sub(ty))))
      .add(impBuf.element(i01).mul(float(1).sub(tx).mul(ty)))
      .add(impBuf.element(i11).mul(tx.mul(ty)));
    const h = mix(m.height, demH, float(demW));
    height.element(i).assign(h);
    hardness.element(i).assign(m.hardness);
  })().compute(res * res);
  kernel.setName(`heightSynthesis_${res}`);

  await renderer.computeAsync(kernel);
  return { height, hardness, res };
}
