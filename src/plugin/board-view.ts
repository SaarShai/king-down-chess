import { PaintedView, type Pace } from '../render/PaintedView';
import type { Highlights } from '../render/marks';
import { colorOf, nameOf, typeOf } from '../rules/engine';
import type { BoardSettings } from './client';
import { symbols } from './art';

export const board = new PaintedView(document.getElementById('board')!, { floor: null, webInk: true });
void board.ready().then(() => document.getElementById('board')!.setAttribute('aria-busy', 'false'));
board.onLoadError = () => { document.getElementById('error')!.textContent = 'The board artwork could not load. Reload the board.'; };
let settings: BoardSettings = { symbols_only: false, show_threats: false }, marks: Highlights = {};
export let animations: Pace = (() => {
  try { const pace = localStorage.getItem('kingdown-animations'); if (pace === 'normal' || pace === 'fast' || pace === 'off') return pace; } catch { /* Storage can be blocked in a host frame. */ }
  return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'off' : 'normal';
})();
function applyAnimations() {
  board.setPace(settings.symbols_only ? 'off' : animations);
  document.documentElement.dataset.pace = animations;
}
export function setAnimations(pace: Pace) {
  animations = pace; applyAnimations();
  try { localStorage.setItem('kingdown-animations', pace); } catch { /* Keep the choice for this visit. */ }
}
applyAnimations();
let symbolImages: Promise<Map<string, HTMLImageElement>> | undefined;
export function highlight(next: Highlights) {
  marks = next;
  board.highlight({ ...marks, threats: settings.show_threats ? marks.threats : [] });
}
export async function setSettings(next: BoardSettings) {
  settings = { ...next }; highlight(marks);
  applyAnimations();
  if (!settings.symbols_only) { board.setSymbols(); return; }
  try {
    symbolImages ??= Promise.all(Object.entries(symbols).flatMap(([path, urls]) => urls.map(async (src, side) => {
      const image = new Image(); image.crossOrigin = 'anonymous'; image.src = src; await image.decode(); return [`${path.split('/').at(-1)!.slice(0, -4)}-${side}`, image] as const;
    }))).then(entries => new Map(entries)).catch(error => { symbolImages = undefined; throw error; });
    const images = await symbolImages;
    if (settings.symbols_only) board.setSymbols(piece => images.get(`${nameOf(typeOf(piece))}-${colorOf(piece)}`)!);
  } catch { document.getElementById('error')!.textContent = 'The board symbols could not load. Try again.'; }
}
