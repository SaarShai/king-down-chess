import { PaintedView } from '../render/PaintedView';
import type { Highlights } from '../render/marks';
import { colorOf, nameOf, typeOf } from '../rules/engine';
import type { BoardSettings } from './client';
import { symbols } from './art';

export const board = new PaintedView(document.getElementById('board')!, { floor: null, webInk: true });
board.setPace('off');
void board.ready().then(() => document.getElementById('board')!.setAttribute('aria-busy', 'false'));
board.onLoadError = () => { document.getElementById('error')!.textContent = 'The board artwork could not load. Reload the board.'; };
let settings: BoardSettings = { symbols_only: false, show_threats: false }, marks: Highlights = {};
let symbolImages: Promise<Map<string, HTMLImageElement>> | undefined;
export function highlight(next: Highlights) {
  marks = next;
  board.highlight({ ...marks, threats: settings.show_threats ? marks.threats : [] });
}
export async function setSettings(next: BoardSettings) {
  settings = { ...next }; highlight(marks);
  if (!settings.symbols_only) { board.setSymbols(); return; }
  try {
    symbolImages ??= Promise.all(Object.entries(symbols).flatMap(([path, urls]) => urls.map(async (src, side) => {
      const image = new Image(); image.crossOrigin = 'anonymous'; image.src = src; await image.decode(); return [`${path.split('/').at(-1)!.slice(0, -4)}-${side}`, image] as const;
    }))).then(entries => new Map(entries)).catch(error => { symbolImages = undefined; throw error; });
    const images = await symbolImages;
    if (settings.symbols_only) board.setSymbols(piece => images.get(`${nameOf(typeOf(piece))}-${colorOf(piece)}`)!);
  } catch { document.getElementById('error')!.textContent = 'The board symbols could not load. Try again.'; }
}
