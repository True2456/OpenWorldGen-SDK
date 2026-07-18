import { Engine } from '../core/Engine';
import { WorldSeed } from '../core/Seed';
import { initHooks } from '../core/Hooks';
import { parseParams } from '../core/Params';
import { buildTerrainScene } from '../debug/TerrainScene';

export interface GeneratorOptions {
  seed?: string | number;
  preset?: 'low' | 'high' | 'ultra';
  scene?: string;
  weather?: string;
  timeOfDay?: number;
}

export class WorldGenerator {
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions = {}) {
    this.options = options;
  }

  async build(container?: HTMLElement): Promise<Engine> {
    const hooks = initHooks();
    const params = parseParams();
    
    // Override params from options if specified
    if (this.options.seed !== undefined) {
      if (typeof this.options.seed === 'number') {
        params.seed = this.options.seed;
      } else {
        const val = Number(this.options.seed);
        if (Number.isFinite(val)) {
          params.seed = val;
        } else {
          let hash = 0;
          for (let i = 0; i < this.options.seed.length; i++) {
            hash = (hash << 5) - hash + this.options.seed.charCodeAt(i);
            hash |= 0;
          }
          params.seed = Math.abs(hash);
        }
      }
    }
    if (this.options.preset !== undefined) params.preset = this.options.preset;
    if (this.options.scene !== undefined) params.scene = this.options.scene;
    if (this.options.weather !== undefined) params.weather = this.options.weather;
    if (this.options.timeOfDay !== undefined) params.timeOfDay = this.options.timeOfDay;

    const engine = await Engine.create(params, hooks);
    
    if (container) {
      container.appendChild(engine.renderer.domElement);
    } else {
      document.body.appendChild(engine.renderer.domElement);
    }

    const seed = new WorldSeed(params.seed);
    const ctx = {
      engine,
      params,
      seed,
      hooks,
      progress: (p: number, msg: string) => {
        // eslint-disable-next-line no-console
        console.log(`[laas-sdk] Progress: ${(p * 100).toFixed(0)}% - ${msg}`);
      },
    };

    await buildTerrainScene(ctx);
    engine.start();
    return engine;
  }
}
