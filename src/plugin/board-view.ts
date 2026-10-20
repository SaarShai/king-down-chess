import { PaintedView } from '../render/PaintedView';
import type { Highlights } from '../render/marks';
import { colorOf, typeOf } from '../rules/engine';
import type { BoardSettings } from '../account-game/types';
import { symbols } from '../account-game/art';

const container = document.getElementById('board')!;
let disposed = false;
export const board = new PaintedView(container, { floor: null, webInk: true });
export function disposeBoard() { disposed = true; board.dispose(); }
board.setPace('fast');
void board.ready().then(() => { if (!disposed) container.setAttribute('aria-busy', 'false'); });
board.onLoadError = () => { if (!disposed) document.getElementById('error')!.textContent = 'The board artwork could not load. Reload the board.'; };
let settings: BoardSettings = { symbols_only: false, show_threats: false }, marks: Highlights = {};
let symbolImages: Promise<Map<string, HTMLImageElement>> | undefined;
export function highlight(next: Highlights) {
  marks = next;
  board.highlight({ ...marks, threats: settings.show_threats ? marks.threats : [] });
}
export async function setSettings(next: BoardSettings) {
  if (disposed) return;
  settings = { ...next }; highlight(marks);
  board.setPace(settings.symbols_only ? 'off' : 'fast');
  if (!settings.symbols_only) { board.setSymbols(); return; }
  try {
    symbolImages ??= Promise.all(Object.entries(symbols).flatMap(([path, urls]) => urls.map(async (src, side) => {
      const image = new Image(); image.crossOrigin = 'anonymous'; image.src = src; await image.decode(); return [`${path.split('/').at(-1)!.slice(0, -4)}-${side}`, image] as const;
    }))).then(entries => new Map(entries)).catch(error => { symbolImages = undefined; throw error; });
    const images = await symbolImages;
    if (!disposed && settings.symbols_only) board.setSymbols(piece => images.get(`${board.context.nameOf(typeOf(piece))}-${colorOf(piece)}`)!);
  } catch { if (!disposed) document.getElementById('error')!.textContent = 'The board symbols could not load. Try again.'; }
}
