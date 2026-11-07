// The painted clouds and wind gusts of the air moves. One sheet, painted once (travel-clouds-prompt.txt): six puffs
// above, three gusts below. Each cell in each tint goes to its own small canvas the first time it is used. Until the
// sheet has loaded, or if it cannot load, a cell is null and the caller draws nothing.
import { afterBoard } from '../painted/after-board.mjs';
export type CloudTint = 'cloud' | 'lilac' | 'slate' | 'gold';
export type WindTint = CloudTint | 'flame';
export interface ArtSprite { canvas: HTMLCanvasElement; w: number; h: number }

/** Sheet pixels per board pixel. */
const DENSITY = 2;
export const PUFF_W = 120, PUFF_H = 84, PUFFS = 6, GUST_W = 150, GUST_H = 48, GUSTS = 3;
const GUST_TOP = PUFF_H * 2;
/** A gust's tail thins to nothing over this share of its length, so no hairline shows behind it. */
const GUST_TAIL = .42;
/** How far each tint moves the painted ivory and blue toward its own colour; the light and shade stay. */
const TINTS: Record<WindTint, [string, number] | null> = { cloud: null, lilac: ['#9a7fc8', .62], slate: ['#6d94b8', .6], gold: ['#d9ae5c', .68], flame: ['#ff8a2c', .9] };

const sheet = typeof Image === 'undefined' ? null : new Image();
if (sheet) sheet.crossOrigin = 'anonymous';
if (sheet) afterBoard(() => { sheet.src = new URL('./travel-clouds.webp', import.meta.url).href; });

const cells = new Map<string, ArtSprite>();
function cell(key: string, tint: WindTint, x: number, y: number, w: number, h: number): ArtSprite | null {
  const made = cells.get(key);
  if (made) return made;
  if (!sheet?.naturalWidth) return null;
  const canvas = document.createElement('canvas');
  canvas.width = w * DENSITY; canvas.height = h * DENSITY;
  const g = canvas.getContext('2d');
  if (!g) return null;
  const from = (mode: GlobalCompositeOperation) => { g.globalCompositeOperation = mode; g.drawImage(sheet, x * DENSITY, y * DENSITY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height); };
  from('source-over');
  const tone = TINTS[tint];
  if (tone) {
    g.globalCompositeOperation = 'color'; g.globalAlpha = tone[1]; g.fillStyle = tone[0]; g.fillRect(0, 0, canvas.width, canvas.height); g.globalAlpha = 1;
    from('destination-in');
  }
  if (w === GUST_W) {
    g.globalCompositeOperation = 'destination-in';
    const fade = g.createLinearGradient(0, 0, canvas.width, 0);
    fade.addColorStop(0, '#0000'); fade.addColorStop(GUST_TAIL, '#000'); fade.addColorStop(1, '#000');
    g.fillStyle = fade; g.fillRect(0, 0, canvas.width, canvas.height);
  }
  const sprite = { canvas, w, h };
  cells.set(key, sprite);
  return sprite;
}
export const puffArt = (tint: CloudTint, i: number) => { const n = i % PUFFS; return cell(`p${tint}${n}`, tint, (n % 3) * PUFF_W, Math.floor(n / 3) * PUFF_H, PUFF_W, PUFF_H); };
export const gustArt = (tint: WindTint, i: number) => { const n = i % GUSTS; return cell(`g${tint}${n}`, tint, 0, GUST_TOP + n * GUST_H, GUST_W, GUST_H); };
