/**
 * Lightweight rolling meadow height for herd scene (CPU + mesh displace).
 */

export function meadowHeight(x: number, z: number, seed = 0): number {
  const s = seed * 0.017;
  return (
    Math.sin(x * 0.045 + s) * 0.42 +
    Math.cos(z * 0.038 + s * 1.3) * 0.34 +
    Math.sin((x * 0.72 + z) * 0.052 + s * 0.6) * 0.2
  );
}

export function meadowNormal(x: number, z: number, seed = 0): { pitch: number; roll: number } {
  const eps = 1.4;
  const sx = meadowHeight(x + eps, z, seed) - meadowHeight(x - eps, z, seed);
  const sz = meadowHeight(x, z + eps, seed) - meadowHeight(x, z - eps, seed);
  return {
    pitch: Math.atan2(-sx, eps * 2),
    roll: Math.atan2(sz, eps * 2),
  };
}
