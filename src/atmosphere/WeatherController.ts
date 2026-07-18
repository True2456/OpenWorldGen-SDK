/**
 * WeatherController — URL-driven weather presets wired into sky, wind, clouds,
 * froxels, and particles. Deterministic at boot; use ?weather=clear|rain|snow|fog|dust
 */

import type { Clouds } from '../sky/Clouds';
import type { Froxels } from '../gpu/passes/Froxels';
import type { Particles } from '../gpu/passes/Particles';
import { windU } from '../render/Wind';

export type WeatherPreset = 'clear' | 'rain' | 'snow' | 'fog' | 'dust';

export interface WeatherTargets {
  clouds: Clouds;
  froxels: Froxels | null;
  particles: Particles | null;
}

export interface WeatherState {
  preset: WeatherPreset;
  cloudDensity: number;
  fogStrength: number;
  windStrength: number;
  particleMode: 'default' | 'snow' | 'pollen' | 'dust' | 'rain';
}

const PRESETS: Record<WeatherPreset, Omit<WeatherState, 'preset'>> = {
  clear: { cloudDensity: 1, fogStrength: 1, windStrength: 1, particleMode: 'default' },
  rain: { cloudDensity: 1.45, fogStrength: 1.35, windStrength: 1.2, particleMode: 'rain' },
  snow: { cloudDensity: 1.1, fogStrength: 1.15, windStrength: 0.85, particleMode: 'snow' },
  fog: { cloudDensity: 0.85, fogStrength: 2.2, windStrength: 0.55, particleMode: 'pollen' },
  dust: { cloudDensity: 0.65, fogStrength: 1.5, windStrength: 1.55, particleMode: 'dust' },
};

export function parseWeatherPreset(raw: string): WeatherPreset {
  const v = raw.toLowerCase();
  if (v === 'rain' || v === 'snow' || v === 'fog' || v === 'dust') return v;
  return 'clear';
}

export function weatherStateFor(preset: WeatherPreset): WeatherState {
  return { preset, ...PRESETS[preset] };
}

export class WeatherController {
  readonly state: WeatherState;

  constructor(preset: WeatherPreset) {
    this.state = weatherStateFor(preset);
  }

  /** Apply boot-time multipliers to subsystems */
  applyBoot(targets: WeatherTargets, baseWindStrength: number): void {
    const s = this.state;
    targets.clouds.setWeatherScale(s.cloudDensity);
    if (targets.froxels) targets.froxels.setWeatherScale(s.fogStrength);
    windU.strength.value = baseWindStrength * s.windStrength;
    if (targets.particles) targets.particles.setWeatherMode(s.particleMode);
    if (window.__laas) Object.assign(window.__laas, { weather: s.preset });
  }
}
