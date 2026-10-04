// Live preview of the kings' board effects (king-effects.mjs), their captures (king-captures.mjs) and the
// resting pawns (lance/idle.mjs), with the game's own painted scene. tools/king-effects-preview.mjs turns
// this page into one self-contained file and records each panel.
import { P, N, B, R, Q, K, S, L, M, G, A, O, typeOf, colorOf, sqName, parseSq, piece, genPiece } from '../2d-first-pieces/board/rules.mjs';
import { createScene } from '../2d-first-pieces/board/scene.mjs';
import { PERIOD } from '../2d-first-pieces/board/king-effects.mjs';

const HEADROOM = 64, PAD = 32, TILE = 112, pieces = { P, N, B, R, Q, K, S, L, M, G, A, O, typeOf, colorOf, sqName };
const INFO = {
  flame: ['Flame', 'Lava light flows through the cracks and seams of his armour.', 'Lava climbs up the piece and pulls it down into a glowing pool.'],
  frost: ['Frost', 'Ice flakes drift down around and in front of him and melt on his square.', 'Ice climbs up the piece and pulls it down into a frozen patch.'],
  stratus: ['Stratus', 'He hovers a little above his square; his shadow shrinks as he rises.', 'Not chosen yet: the old ice shatter stays for now.'],
  mud: ['Mud', 'Roots spread over his square and grass sprouts round his feet; both sink back.', 'Vines wind up over the piece and pull it down into the earth.'],
  spirit: ['Spirit', 'A holy light round him, rays behind him and light on his square brighten and dim.', 'The piece turns into a glowing silhouette of itself (white for the ivory king, black for the charcoal one) and implodes.'],
  shadow: ['Shadow', 'Skeletal hands reach up out of cracks round his feet; his smoke drifts and curls upward.', 'A big crack opens across the square and swallows the piece. Death Touch takes it without moving.'],
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
// The captures each card plays: a king on d4 or e4 takes the piece beside him.
export const CAPTURES = [
  { label: 'Ivory takes a pawn', king: ['d4', 0], victim: ['e4', P] },
  { label: 'Ivory takes a knight', king: ['d4', 0], victim: ['e4', N] },
  { label: 'Charcoal takes a pawn', king: ['e4', 1], victim: ['d4', P] },
  { label: 'Charcoal takes a knight', king: ['e4', 1], victim: ['d4', N] },
  { label: 'Death Touch (ivory)', king: ['d4', 0], victim: ['e4', N], touch: true, only: 'shadow' },
  { label: 'Death Touch (charcoal)', king: ['e4', 1], victim: ['d4', P], touch: true, only: 'shadow' },
];
export const capturesFor = design => CAPTURES.filter(c => !c.only || c.only === design);

const scenes = {}, frames = [];
let size = 'desktop', animations = true;
const resolution = scale => Math.min(2, Math.max(1, Math.ceil(scale * 960 * devicePixelRatio / 960 * 4) / 4));
function makeScene(kings, pos, coords) {
  const canvas = document.createElement('canvas');
  canvas.width = 960; canvas.height = 960 + HEADROOM;
  const scene = createScene({ canvas, pieces, headroom: HEADROOM, kings });
  scene.setCoords(coords); scene.setPosition(pos);
  scene.setLively({ moves: true, idle: true, atmosphere: true, kings: true, captures: true, pawns: true });
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
  for (const f of frames) { place(f.frame, f.box, f.box === CROP ? Math.min(scale, (innerWidth - 56) / CROP.w) : Math.min(scale, (innerWidth - 32) / 960)); f.scene.setResolution(resolution(scale)); }
}
function card(parent, title, text, scene, canvas) {
  const section = document.createElement('section'), frame = document.createElement('div');
  section.className = 'card'; frame.className = 'frame'; frame.appendChild(canvas);
  section.innerHTML = `<h2>${title}</h2><p>${text}</p>`;
  section.insertBefore(frame, section.children[1]);
  const labels = document.createElement('div'); labels.className = 'labels'; labels.innerHTML = '<span>Ivory</span><span>Charcoal</span>';
  section.insertBefore(labels, frame.nextSibling);
  parent.appendChild(section);
  frames.push({ frame, box: CROP, scene });
  return section;
}

// 1. The idle effects.
const grid = document.getElementById('grid');
for (const design of Object.keys(INFO)) {
  const { canvas, scene } = makeScene([design, design], KINGS_ROW, false);
  scenes[design] = { scene, canvas };
  card(grid, INFO[design][0], `${INFO[design][1]} <span class="period">Loop ${PERIOD[design] / 1000} s.</span>`, scene, canvas);
}

// 2. Captures: each card plays its captures in turn; a button plays one now.
/** Sets up capture `c` on a scene and returns its move (the scene shows the position before it). */
export function setUpCapture(scene, c) {
  const [ksq, side] = c.king, [vsq, type] = c.victim;
  const pos = position([[ksq, K, side], [vsq, type, 1 - side]]);
  scene.setSelected(null); scene.setPosition(pos);
  const moves = []; genPiece(pos.board, parseSq(ksq), 'all', moves);
  const take = moves.find(m => m.to === parseSq(vsq) && m.captures.length);
  return c.touch ? { from: parseSq(ksq), to: parseSq(ksq), captures: [parseSq(vsq)] } : take;
}
const captureGrid = document.getElementById('captures');
const wait = ms => new Promise(r => setTimeout(r, ms));
for (const design of Object.keys(INFO)) {
  const { canvas, scene } = makeScene([design, design], KINGS_ROW, false);
  scenes[`capture-${design}`] = { scene, canvas };
  const section = card(captureGrid, INFO[design][0], INFO[design][2], scene, canvas);
  section.querySelector('.labels').remove();
  const buttons = document.createElement('div'); buttons.className = 'buttons';
  const list = capturesFor(design);
  let next = 0, token = 0;
  async function play(i) {
    const mine = ++token, c = list[i], move = setUpCapture(scene, c);
    for (const b of buttons.children) b.setAttribute('aria-pressed', String(b === buttons.children[i]));
    await wait(450); if (mine !== token) return;
    await scene.play(move);
    if (mine !== token) return;
    await wait(700); if (mine !== token) return;
    next = (i + 1) % list.length; play(next);
  }
  list.forEach((c, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c.label; b.addEventListener('click', () => play(i)); buttons.appendChild(b); });
  section.appendChild(buttons);
  scenes[`capture-${design}`].start = () => play(0);
  scenes[`capture-${design}`].stop = () => { token++; };
}

// 3. A whole board: resting pawns and two kings.
const board = makeScene(['spirit', 'shadow'], START, true);
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
  for (const { scene } of Object.values(scenes)) scene.setLively({ kings: animations, pawns: animations });
});
addEventListener('resize', layout);
layout();
const ready = Promise.all(Object.values(scenes).map(({ scene }) => scene.load()));
// The recording tool drives the captures itself (?record).
if (!new URLSearchParams(location.search).has('record')) ready.then(() => { for (const s of Object.values(scenes)) s.start?.(); });
window.preview = { scenes, CROP, CAPTURES, capturesFor, setUpCapture, ready };
