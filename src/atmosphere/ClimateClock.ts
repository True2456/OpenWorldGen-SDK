/**
 * ClimateClock — annual season cycle driven by engine worldTime.
 *
 * Advances a simulated calendar (default: one in-world day every 120 s of
 * worldTime → a full year in ~12 h). Exposes live uniforms for shaders and
 * CPU helpers for ecology / tooling. Orthogonal to diurnal timeOfDay (SunSky)
 * and boot-time weather presets (WeatherController).
 *
 * URL: ?season=0.42 (phase 0..1) · ?day=180 (day-of-year) · ?seasonSpeed=4
 * Keys: , / . step one day backward / forward (when not typing in an input).
 *
 * Performance: zero tree-path cost — Forests/cull shaders are untouched. Seasonal
 * grass/particle tints compile in ONLY when setClimateContext(true) is called
 * before those materials build (?ablate=climate skips them). CPU tick runs at
 * CLIMATE_TICK_S (4 Hz), not every frame.
 */

import { float } from 'three/tsl';
import { runiform } from '../gpu/RenderUniform';
import type { NF } from '../gpu/TSLTypes';
import { DAYS_PER_YEAR, YEAR_SECONDS } from '../world/WorldConst';

/** CPU calendar refresh — seasons move slowly; 4 Hz is plenty */
export const CLIMATE_TICK_S = 0.25;

let climateLive = false;

/**
 * Enable seasonal shader hooks (grass dryness, particle snow bias). Call before
 * GroundRing / Particles build — same pattern as setWindContext.
 */
export function setClimateContext(on: boolean): void {
  climateLive = on;
}

export function climateContext(): boolean {
  return climateLive;
}

/** live climate uniforms — stable within a frame (mutate in ClimateClock.tick) */
export const climateU = {
  /** 0..1 around the year (0/1 winter, 0.25 spring, 0.5 summer, 0.75 autumn) */
  seasonPhase: runiform(0.25),
  /** 0..365 fractional day-of-year */
  dayOfYear: runiform(91.25),
  /** multiplier on calendar advance vs worldTime */
  seasonSpeed: runiform(1),
  /** 0..1 cold intensity (1 = deep winter) — derived each tick */
  coldK: runiform(0.5),
  /** 0..1 growing-season vigor (1 = midsummer) — derived each tick */
  growthK: runiform(0.5),
};

/** 1 at winter solstice (phase 0/1), 0 at midsummer — future tree cold stress */
export function coldStressK(phase: number): number {
  return 0.5 + 0.5 * Math.cos(phase * Math.PI * 2);
}

/** 1 at midsummer, 0 at winter — future growth / leaf-out driver */
export function growthSeasonK(phase: number): number {
  return Math.max(0, Math.cos((phase - 0.5) * Math.PI * 2) * 0.5 + 0.5);
}

/**
 * Analytic temperature (°C) at altitude — mirrors BiomeSnow lapse + seasonal swing.
 * Noise / aspect omitted; use for coarse ecology gating, not placement.
 */
export function tempAtAltitude(altitudeM: number, phase: number, tempOffset = 0): number {
  const seasonal = Math.cos(phase * Math.PI * 2) * 8;
  return 11.8 + tempOffset - altitudeM * 0.0125 + seasonal;
}

export function seasonLabel(phase: number): string {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.08 || p > 0.92) return 'winter';
  if (p < 0.33) return 'spring';
  if (p < 0.58) return 'summer';
  return 'autumn';
}

/** Only valid inside a climateContext() material branch */
export function climateColdK(): NF {
  return climateU.coldK as unknown as NF;
}

/** Only valid inside a climateContext() material branch */
export function climateGrowthK(): NF {
  return climateU.growthK as unknown as NF;
}

/** TSL temperature at altitude (m) — same curve as tempAtAltitude */
export function tempAtAltitudeTSL(altY: NF, tempOffset = 0): NF {
  const seasonal = (climateU.seasonPhase as unknown as NF).mul(Math.PI * 2).cos().mul(8);
  return float(11.8 + tempOffset).sub(altY.mul(0.0125)).add(seasonal);
}

export interface ClimateBoot {
  startPhase: number;
  speed: number;
}

export function parseClimateBoot(search = window.location.search): ClimateBoot {
  const q = new URLSearchParams(search);
  let startPhase = 0.25;
  const dayRaw = q.get('day');
  const seasonRaw = q.get('season');
  if (dayRaw !== null) {
    const day = Number(dayRaw);
    if (Number.isFinite(day)) {
      startPhase =
        (((day % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR) / DAYS_PER_YEAR;
    }
  } else if (seasonRaw !== null) {
    const s = Number(seasonRaw);
    if (Number.isFinite(s)) {
      startPhase =
        s > 1
          ? (((s % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR) / DAYS_PER_YEAR
          : ((s % 1) + 1) % 1;
    }
  }
  const speed = Number(q.get('seasonSpeed') ?? NaN);
  return {
    startPhase,
    speed: Number.isFinite(speed) && speed >= 0 ? speed : 1,
  };
}

export class ClimateClock {
  private startPhase: number;
  private readonly speed: number;
  private lastWorldTime = 0;
  private keysInstalled = false;

  constructor(boot: ClimateBoot) {
    this.startPhase = boot.startPhase;
    this.speed = boot.speed;
    climateU.seasonSpeed.value = boot.speed;
    this.tick(0);
  }

  get phase(): number {
    return climateU.seasonPhase.value;
  }

  phaseAt(worldTime: number): number {
    const t = (this.startPhase + (worldTime * this.speed) / YEAR_SECONDS) % 1;
    return t < 0 ? t + 1 : t;
  }

  tick(worldTime: number): void {
    this.lastWorldTime = worldTime;
    const phase = this.phaseAt(worldTime);
    climateU.seasonPhase.value = phase;
    climateU.dayOfYear.value = phase * DAYS_PER_YEAR;
    climateU.coldK.value = coldStressK(phase);
    climateU.growthK.value = growthSeasonK(phase);
  }

  /** Jump to an absolute season phase (0..1), preserving worldTime continuity */
  setPhase(phase: number): void {
    const p = ((phase % 1) + 1) % 1;
    let start = p - (this.lastWorldTime * this.speed) / YEAR_SECONDS;
    start = ((start % 1) + 1) % 1;
    this.startPhase = start;
    this.tick(this.lastWorldTime);
  }

  nudgeDays(days: number): void {
    this.setPhase(this.phase + days / DAYS_PER_YEAR);
  }

  /** , / . — step one simulated day (skipped when focus is in a text field) */
  installKeys(): void {
    if (this.keysInstalled) return;
    this.keysInstalled = true;
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Comma' && e.code !== 'Period') return;
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        (t instanceof HTMLElement && t.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      this.nudgeDays(e.code === 'Comma' ? -1 : 1);
      // eslint-disable-next-line no-console
      console.log(
        `[laas] season=${seasonLabel(this.phase)} day=${climateU.dayOfYear.value.toFixed(0)} φ=${this.phase.toFixed(3)}`,
      );
    });
  }
}
