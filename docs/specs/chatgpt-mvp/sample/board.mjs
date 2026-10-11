// The sample's board: the game's own painted scene (docs/2d-first-pieces/board/scene.mjs, as src/render/PaintedView.ts
// drives it) and the game's own move legend (src/render/legend.ts; render.mjs serves .ts as plain JS).
import { P, N, B, R, Q, K, S, L, M, G, A, O, typeOf, colorOf, sqName, piece } from '/docs/2d-first-pieces/board/rules.mjs';
import { createScene } from '/docs/2d-first-pieces/board/scene.mjs';
import { tile, occupied, paint } from '/src/render/legend.ts';

const HEADROOM = 64;
const TYPE = { P, N, B, R, Q, K, A, L, G, M, S, O };
const ICON = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king', A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast', O: 'ogre' };
export const sq = name => (name.charCodeAt(0) - 97) + (+name[1] - 1) * 8;

/**
 * Draws one board into `host` (an element with a size). ranks: 8 strings, rank 8 first, '.' for an empty square.
 * o: kings [white, black] designs; last, moves, takes, threats: square names; sel: a square name; fallen: a square
 * name (the king lies down); symbols: piece icons in place of the figures; veil: words over ranks 5 to 8.
 * Resolves when the board is drawn.
 */
export async function drawBoard(host, ranks, o = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 960; canvas.height = 960 + HEADROOM;
  host.classList.add('painted');
  host.append(canvas);
  const board = new Uint8Array(64);
  ranks.forEach((row, i) => [...row].forEach((l, f) => {
    if (l !== '.') board[(7 - i) * 8 + f] = piece(TYPE[l.toUpperCase()], l === l.toUpperCase() ? 0 : 1);
  }));
  const scene = createScene({ canvas, pieces: { P, N, B, R, Q, K, S, L, M, G, A, O, typeOf, colorOf, sqName }, headroom: HEADROOM, kings: o.kings ?? ['spirit', 'shadow'], floor: null });
  scene.setLively({ moves: true, atmosphere: true, captures: true, idle: false, kings: false, pawns: false });
  scene.setReducedMotion(true);
  const set = list => new Set((list ?? []).map(sq));
  const last = set(o.last), moves = set(o.moves), takes = set(o.takes), threats = set(o.threats);
  scene.setDecorate((ctx, sc, layer) => {
    if (layer !== 'under') return;
    const { PAD, TILE } = sc;
    const box = s => { const c = sc.cell(s); return { x: PAD + c.col * TILE, y: PAD + c.row * TILE }; };
    for (const s of last) { const b = box(s); ctx.fillStyle = '#e6b84a6e'; ctx.fillRect(b.x, b.y, TILE, TILE); }
    for (const s of moves) { const b = box(s); paint(ctx, tile(takes.has(s) ? 'both' : 'move', b.x, b.y, TILE)); }
    for (const s of takes) if (!moves.has(s)) { const b = box(s); paint(ctx, occupied('take', b.x, b.y, TILE, sc.foot(s).y)); }
    for (const s of threats) { const b = box(s); paint(ctx, occupied('take', b.x, b.y, TILE, sc.foot(s).y)); }
  });
  scene.setPosition({ board: o.symbols ? new Uint8Array(64) : board, turn: 0, halfmove: 0, ply: 0 });
  if (o.sel) scene.setSelected(sq(o.sel));
  if (o.fallen) scene.setFallen(sq(o.fallen), false, -1.5);
  // As PaintedView: the square board as large as the host allows, sharp on a dense screen.
  const box = host.getBoundingClientRect();
  const width = Math.floor(Math.min(box.width, box.height * 960 / (960 + HEADROOM)));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${width * (960 + HEADROOM) / 960}px`;
  scene.setCoords(true, Math.max(13, 13 * 700 / width), 14);
  scene.setResolution(Math.min(2, Math.max(1, Math.ceil(width * devicePixelRatio / 960 * 4) / 4)));
  await scene.load();
  // Symbols only: the game's piece icons (src/piece-icons.ts) stand on the squares, in a layer over the canvas.
  const k = width / 960;
  const layer = document.createElement('div');
  layer.className = 'board-layer';
  layer.style.cssText = `width:${width}px;height:${width * (960 + HEADROOM) / 960}px`;
  if (o.symbols) board.forEach((v, s) => {
    if (!v) return;
    const l = ranks[7 - (s >> 3)][s & 7], c = scene.cell(s);
    layer.insertAdjacentHTML('beforeend', `<svg class="pi pi-${l === l.toUpperCase() ? 'w' : 'b'}" style="left:${(scene.PAD + c.col * scene.TILE + 14) * k}px;top:${(HEADROOM + scene.PAD + c.row * scene.TILE + 14) * k}px;width:${(scene.TILE - 28) * k}px;height:${(scene.TILE - 28) * k}px"><use href="/ui/icons/${ICON[l.toUpperCase()]}.svg#icon"/></svg>`);
  });
  if (o.veil) layer.insertAdjacentHTML('beforeend', `<div class="veil" style="left:${scene.PAD * k}px;top:${(HEADROOM + scene.PAD) * k}px;width:${8 * scene.TILE * k}px;height:${4 * scene.TILE * k}px"><span>${o.veil}</span></div>`);
  host.append(layer);
  const start = scene.frames;
  await new Promise(r => { const tick = () => scene.frames > start ? r() : requestAnimationFrame(tick); tick(); });
  return scene;
}
