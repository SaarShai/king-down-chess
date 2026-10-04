// Live preview of the six kings' board effects (king-effects.mjs) with the game's own painted scene.
// Each panel is one scene: the king on a light and a dark square in both armies. A full board below
// shows two chosen kings in the chess army's starting position. tools/king-effects-preview.mjs turns this
// page into one self-contained file and records each panel.
import { P, N, B, R, Q, K, S, L, M, G, A, O, typeOf, colorOf, sqName, parseSq, piece } from '../2d-first-pieces/board/rules.mjs';
import { createScene } from '../2d-first-pieces/board/scene.mjs';
import { PERIOD } from '../2d-first-pieces/board/king-effects.mjs';

const HEADROOM = 64, PAD = 32, TILE = 112, pieces = { P, N, B, R, Q, K, S, L, M, G, A, O, typeOf, colorOf, sqName };
const INFO = {
  flame: ['Flame', 'Lava light flows through the cracks and seams of his armour.'],
  frost: ['Frost', 'Ice flakes drift down around and in front of him and melt on his square.'],
  stratus: ['Stratus', 'He hovers a little above his square; his shadow shrinks as he rises.'],
  mud: ['Mud', 'Grass sprouts from the earth around his feet, sways, and sinks back.'],
  spirit: ['Spirit', 'A soft holy light around him and on his square brightens and dims.'],
  shadow: ['Shadow', 'Black skeletal hands reach up out of his square, clutch, and sink back.'],
};
// Ivory on c4 (light) and d4 (dark), charcoal on e4 (light) and f4 (dark); canvas units (board + headroom).
export const CROP = { x: PAD + 2 * TILE - 12, y: HEADROOM + PAD + 3 * TILE - 2, w: 4 * TILE + 24, h: 2 * TILE + 26 };
// The game's board is 776 px wide in a 1440 × 900 window and 365 px on a 390 px phone.
const SIZES = { desktop: 776 / 960, phone: 365 / 960, double: 1.6 };
const position = placements => {
  const board = new Uint8Array(64);
  for (const [sq, type, side] of placements) board[parseSq(sq)] = piece(type, side);
  return { board, turn: 0, halfmove: 0, ply: 0 };
};
const KINGS_ROW = position([['c4', K, 0], ['d4', K, 0], ['e4', K, 1], ['f4', K, 1]]);
const BACK = [R, N, B, Q, K, B, N, R];
const START = position([...BACK.map((t, i) => [`${'abcdefgh'[i]}1`, t, 0]), ...BACK.map((t, i) => [`${'abcdefgh'[i]}8`, t, 1]),
  ...[...'abcdefgh'].flatMap(f => [[`${f}2`, P, 0], [`${f}7`, P, 1]])]);

const scenes = {}, frames = [];
let size = 'desktop', animations = true;
const resolution = scale => Math.min(2, Math.max(1, Math.ceil(scale * 960 * devicePixelRatio / 960 * 4) / 4));
function makeScene(kings, pos, coords) {
  const canvas = document.createElement('canvas');
  canvas.width = 960; canvas.height = 960 + HEADROOM;
  const scene = createScene({ canvas, pieces, headroom: HEADROOM, kings });
  scene.setCoords(coords); scene.setPosition(pos);
  scene.setLively({ moves: true, idle: true, atmosphere: true, kings: true });
  return { canvas, scene };
}
function place(frame, box, scale) {
  frame.style.width = `${box.w * scale}px`; frame.style.height = `${box.h * scale}px`;
  const c = frame.firstChild;
  c.style.width = `${960 * scale}px`; c.style.height = `${(960 + HEADROOM) * scale}px`;
  c.style.marginLeft = `${-box.x * scale}px`; c.style.marginTop = `${-box.y * scale}px`;
}
function layout() {
  const scale = SIZES[size];
  for (const f of frames) { place(f.frame, f.box, f.box === CROP ? scale : Math.min(scale, (innerWidth - 32) / 960)); f.scene.setResolution(resolution(scale)); }
}

const grid = document.getElementById('grid');
for (const design of Object.keys(INFO)) {
  const { canvas, scene } = makeScene([design, design], KINGS_ROW, false);
  scenes[design] = { scene, canvas };
  const card = document.createElement('section'), frame = document.createElement('div');
  card.className = 'card'; frame.className = 'frame'; frame.appendChild(canvas);
  card.innerHTML = `<h2>${INFO[design][0]}</h2><p>${INFO[design][1]} <span class="period">Loop ${PERIOD[design] / 1000} s.</span></p>`;
  card.insertBefore(frame, card.children[1]);
  const labels = document.createElement('div'); labels.className = 'labels'; labels.innerHTML = '<span>Ivory</span><span>Charcoal</span>';
  card.insertBefore(labels, frame.nextSibling);
  grid.appendChild(card);
  frames.push({ frame, box: CROP, scene });
}
const board = makeScene(['flame', 'shadow'], START, true);
scenes.board = board;
const boardFrame = document.getElementById('board');
boardFrame.appendChild(board.canvas);
frames.push({ frame: boardFrame, box: { x: 0, y: 0, w: 960, h: 960 + HEADROOM }, scene: board.scene });
for (const [i, id] of ['white', 'black'].entries()) {
  const select = document.getElementById(id);
  select.innerHTML = Object.entries(INFO).map(([d, [name]]) => `<option value="${d}">${name}</option>`).join('');
  select.value = board.scene.kings[i];
  select.addEventListener('change', () => board.scene.setKings([document.getElementById('white').value, document.getElementById('black').value]));
}
for (const input of document.querySelectorAll('input[name=size]')) input.addEventListener('change', () => { size = input.value; layout(); });
document.getElementById('animations').addEventListener('change', e => {
  animations = e.target.checked;
  for (const { scene } of Object.values(scenes)) scene.setLively({ kings: animations });
});
addEventListener('resize', layout);
layout();
window.preview = { scenes, CROP, ready: Promise.all(Object.values(scenes).map(({ scene }) => scene.load())) };
