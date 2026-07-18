/**
 * Biome + snow classification at full height resolution.
 * temperature(altitude, aspect) × moisture × slope × exposure → biome id,
 * snow coverage, vegetation density, rock exposure. Written as rgba8:
 *   r = biomeId / 16, g = snow 0..1, b = vegetation density, a = rock exposure
 */

import { NearestFilter } from 'three';
import type { Renderer } from 'three/webgpu';
import { StorageBufferAttribute, StorageTexture } from 'three/webgpu';
import {
  Fn,
  If,
  Return,
  clamp,
  float,
  floor,
  instanceIndex,
  mix,
  mx_noise_float,
  smoothstep,
  storage,
  texture,
  textureStore,
  uvec2,
  vec2,
  vec4,
} from 'three/tsl';
import { BIOME_TEX_SCALE, type ClimateParams } from '../../contracts/biome';
import { zoneMasks, type MacroParams } from '../../world/MacroMap';
import { Biome, LAKE_LEVEL, TREELINE, WORLD_SIZE } from '../../world/WorldConst';
import { getProfile } from '../../world/profiles/registry';
import type { FloatBuffer } from './HeightSynthesis';

export interface BiomeSnowOpts {
  res: number;
  mp: MacroParams;
  profileId?: string;
  /** orthophoto-derived moisture prior (CPU, res×res) */
  importMoisture?: Float32Array;
  importMoistureRes?: number;
  /** rgba16f normal+slope texture (filtered) */
  normalTex: StorageTexture;
  /** rgba16f fields texture: moisture, flowStrength, riverDepth, W */
  fieldsTex: StorageTexture;
}

/** @deprecated use BiomeSnowOpts */
export type BiomeClassifierOpts = BiomeSnowOpts;

export async function runBiomeSnow(
  renderer: Renderer,
  height: FloatBuffer,
  opts: BiomeSnowOpts,
): Promise<StorageTexture> {
  const { res, mp } = opts;
  const climate: ClimateParams = getProfile(opts.profileId).climate;
  const impMoist = opts.importMoisture;
  const impMoistRes = opts.importMoistureRes ?? 0;
  const impBlend =
    impMoist && impMoistRes > 0 ? (opts.profileId === 'desert' ? 0.5 : 0.65) : 0;
  const impRes = Math.max(impMoistRes, 1);
  const impBuf = storage(
    new StorageBufferAttribute(impMoist && impMoistRes > 0 ? impMoist : new Float32Array([0.5]), 1),
    'float',
    impMoist?.length ?? 1,
  );
  const out = new StorageTexture(res, res);
  out.magFilter = NearestFilter;
  out.minFilter = NearestFilter;
  out.generateMipmaps = false;

  const kernel = Fn(() => {
    const i = instanceIndex;
    If(i.greaterThanEqual(res * res), () => {
      Return();
    });
    const x = i.mod(res);
    const y = i.div(res);
    const uv = vec2(float(x).add(0.5), float(y).add(0.5)).div(res);
    const wpos = uv.sub(0.5).mul(WORLD_SIZE);
    const h = height.element(i).toVar();
    const ns = texture(opts.normalTex, uv);
    const n = ns.xyz;
    const slope = ns.w;
    const fields = texture(opts.fieldsTex, uv);
    const moistureRaw = fields.x;
    const fx = uv.x.mul(float(impRes)).sub(0.5);
    const fy = uv.y.mul(float(impRes)).sub(0.5);
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
    const impM = impBuf
      .element(i00)
      .mul(float(1).sub(tx).mul(float(1).sub(ty)))
      .add(impBuf.element(i10).mul(tx.mul(float(1).sub(ty))))
      .add(impBuf.element(i01).mul(float(1).sub(tx).mul(ty)))
      .add(impBuf.element(i11).mul(tx.mul(ty)));
    const moisture = clamp(
      mix(
        moistureRaw.mul(climate.moistureScale).add(climate.moistureOffset),
        impM,
        float(impBlend),
      ),
      0,
      1,
    );
    const water = fields.z;
    const zm = zoneMasks(wpos, mp);

    // temperature: lapse with altitude; north faces colder; noise breakup.
    const northness = n.z.negate().mul(clamp(slope, 0, 1)).clamp(0, 1);
    const tNoise = mx_noise_float(wpos.div(420).add(vec2(mp.off.hard[0], mp.off.hard[1])));
    const temp = float(11.8 + climate.tempOffset)
      .sub(h.mul(0.0125))
      .sub(northness.mul(2.0))
      .add(tNoise.mul(1.2));
    const snowline = float(TREELINE + climate.snowlineOffset);

    // local curvature from height buffer (ledge detection for snow/scree)
    const texel = WORLD_SIZE / res;
    const stepT = 3;
    const idx = (xx: typeof x, yy: typeof y) =>
      clamp(float(yy), 0, res - 1)
        .toInt()
        .mul(res)
        .add(clamp(float(xx), 0, res - 1).toInt());
    const hl = height.element(idx(x.sub(stepT), y));
    const hr = height.element(idx(x.add(stepT), y));
    const hd = height.element(idx(x, y.sub(stepT)));
    const hu = height.element(idx(x, y.add(stepT)));
    const lap = hl.add(hr).add(hd).add(hu).sub(h.mul(4)).div(stepT * stepT); // concave > 0
    const ledge = smoothstep(0.08, 0.5, lap).mul(smoothstep(0.9, 0.35, slope));

    // COARSE slope (16 m support): texel-scale crags make the 1 m slope ≥2.7
    // everywhere on the massif — snow holds on the landform, not the micro-relief
    const s8 = 14;
    const cl = height.element(idx(x.sub(s8), y));
    const cr = height.element(idx(x.add(s8), y));
    const cd = height.element(idx(x, y.sub(s8)));
    const cu = height.element(idx(x, y.add(s8)));
    const slopeCoarse = vec2(cr.sub(cl), cu.sub(cd)).length().div(2 * s8 * texel);
    // coarse concavity: couloirs/gullies between rock ribs accumulate snow —
    // this is what makes very steep massifs read snowy (white veins in crags)
    const lapCoarse = cl.add(cr).add(cd).add(cu).sub(h.mul(4)).div(s8 * s8 * texel);
    const couloir = smoothstep(0.015, 0.16, lapCoarse);

    // --- snow coverage ---------------------------------------------------------
    const snowTemp = smoothstep(2.6, -2.2, temp); // cold → 1
    const slopeHold = smoothstep(2.6, 0.8, slopeCoarse); // landform-scale cliffs shed
    const snow = clamp(
      snowTemp.mul(slopeHold).add(ledge.mul(snowTemp).mul(0.45)).add(couloir.mul(snowTemp).mul(0.9)),
      0,
      1,
    )
      .pow(0.78) // perceptual boost: partial coverage reads as snow, not gray
      .mul(smoothstep(0.02, 0.0, water)) // not on water
      .toVar();

    // --- rock exposure -----------------------------------------------------------
    const rockSlope = smoothstep(0.75, 1.45, slope);
    const rockExposure = clamp(
      rockSlope.add(zm.tKarst.mul(smoothstep(0.55, 1.0, slope)).mul(0.7)).add(zm.tAlp.mul(0.18)),
      0,
      1,
    );

    // --- biome decision tree -----------------------------------------------------
    const isAlpine = h.greaterThan(snowline.add(tNoise.mul(60)));
    const isSubalpine = h.greaterThan(snowline.sub(170).add(tNoise.mul(70)));
    const lowFlat = slope.lessThan(0.35);
    const isWetland = moisture
      .greaterThan(0.72)
      .and(lowFlat)
      .and(h.lessThan(LAKE_LEVEL + 70));
    const isSwamp = moisture
      .greaterThan(0.78)
      .and(lowFlat)
      .and(h.lessThan(LAKE_LEVEL + 130))
      .and(zm.tLake.greaterThan(0.15));
    const meadowNoise = mx_noise_float(wpos.div(560).add(vec2(mp.off.hills[0], mp.off.hills[1])));
    const isMeadow = meadowNoise
      .greaterThan(0.22)
      .and(slope.lessThan(0.42))
      .and(moisture.lessThan(0.72))
      .and(h.lessThan(520))
      .and(zm.tKarst.lessThan(0.4));
    const isGrassland = meadowNoise
      .greaterThan(-0.05)
      .and(slope.lessThan(0.48))
      .and(moisture.lessThan(0.55))
      .and(moisture.greaterThan(0.18))
      .and(h.lessThan(680))
      .and(zm.tAlp.lessThan(0.35));
    const isDesert = moisture
      .lessThan(0.32)
      .and(temp.greaterThan(6))
      .and(slope.lessThan(0.62))
      .and(h.lessThan(920))
      .and(snow.lessThan(0.08));
    const isJungle = moisture
      .greaterThan(0.62)
      .and(temp.greaterThan(4))
      .and(h.lessThan(720))
      .and(slope.lessThan(0.68))
      .and(snow.lessThan(0.05));
    const isKarst = zm.tKarst.greaterThan(0.42);

    const biome = isAlpine
      .select(
        float(Biome.Alpine),
        isSubalpine.select(
          float(Biome.Subalpine),
          isSwamp.select(
            float(Biome.Swamp),
            isWetland.select(
              float(Biome.Wetland),
              isDesert.select(
                float(Biome.Desert),
                isJungle.select(
                  float(Biome.Jungle),
                  isKarst.select(
                    float(Biome.KarstForest),
                    isGrassland.select(
                      float(Biome.Grassland),
                      isMeadow.select(float(Biome.Meadow), float(Biome.Conifer)),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      )
      .toVar();

    // --- vegetation density --------------------------------------------------------
    const densBase = mix(float(0.85), float(0.25), rockExposure)
      .mul(smoothstep(-2.5, 1.5, temp))
      .mul(smoothstep(0.05, 0.25, moisture.add(0.15)))
      .mul(smoothstep(1.9, 1.1, slope));
    const dens = clamp(densBase.sub(snow.mul(0.7)).mul(climate.vegDensityScale), 0, 1);

    const DIAG_COMPONENTS = false; // temp bisect: write snow components
    textureStore(
      out,
      uvec2(x.toUint(), y.toUint()),
      DIAG_COMPONENTS
        ? vec4(snowTemp, slopeHold, ledge, temp.div(20).add(0.5))
        : vec4(biome.div(BIOME_TEX_SCALE), snow, dens, rockExposure),
    ).toWriteOnly();
  })().compute(res * res);
  kernel.setName('biomeSnowClassify');
  await renderer.computeAsync(kernel);
  return out;
}
