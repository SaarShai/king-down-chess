// The clay 3D look in one chunk: three.js, the clay figures and the voxel fallbacks load only
// when a player picks it (main.ts imports this module dynamically).
import { BoardRenderer } from './renderer';
import { loadModels } from './voxels';

export async function createClayView(el: HTMLElement): Promise<BoardRenderer> {
  await loadModels();
  return new BoardRenderer(el);
}
