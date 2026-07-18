/**
 * Load import maps in the browser from /public/import/<id>/.
 */

import type { ImportManifest, ImportMapsCpu } from '../../contracts/import';

export async function loadImportMaps(id: string): Promise<ImportMapsCpu | null> {
  try {
    const manifestRes = await fetch(`/import/${id}/manifest.json`);
    if (!manifestRes.ok) return null;
    const manifest = (await manifestRes.json()) as ImportManifest;
    const [hBuf, mBuf, bBuf] = await Promise.all([
      fetch(manifest.maps.height).then((r) => r.arrayBuffer()),
      fetch(manifest.maps.moisture).then((r) => r.arrayBuffer()),
      fetch(manifest.maps.biomePrior).then((r) => r.arrayBuffer()),
    ]);
    return {
      manifest,
      height: new Float32Array(hBuf),
      moisture: new Float32Array(mBuf),
      biomePrior: new Uint8Array(bBuf),
    };
  } catch {
    return null;
  }
}
