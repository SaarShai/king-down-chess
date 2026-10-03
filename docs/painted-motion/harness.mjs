// Drives the shared painted scene for tools/painted-motion-sheets.mjs: one scene with the game's
// opt-in liveliness, positions from [square, type, side] lists, moves from the trial's rules bundle.
import { P, N, B, R, Q, K, S, L, M, G, A, O, typeOf, colorOf, sqName, parseSq, piece, genPiece, makeMove } from '../2d-first-pieces/board/rules.mjs';
import { createScene } from '../2d-first-pieces/board/scene.mjs';
const HEADROOM = 64, types = { P, N, B, R, Q, K, S, L, M, G, A, O };
const canvas = document.getElementById('scene');
canvas.width = 960; canvas.height = 960 + HEADROOM;
const scene = createScene({ canvas, pieces: { P, N, B, R, Q, K, S, L, M, G, A, O, typeOf, colorOf, sqName }, headroom: HEADROOM });
scene.setCoords(true);
let position = null;
window.harness = {
  scene,
  ready: scene.load(),
  /** placements: [['d4', 'K', 0], …]; lively: setLively options. */
  setup(placements, lively = {}, flipped = false) {
    const board = new Uint8Array(64);
    for (const [sq, t, side] of placements) board[parseSq(sq)] = piece(types[t], side);
    position = { board, turn: 0, halfmove: 0, ply: 0 };
    scene.setLively({ moves: false, idle: false, atmosphere: false, ...lively });
    scene.setFlipped(flipped); scene.setSelected(null); scene.setPosition(position);
  },
  /** Plays the quiet move from → to; resolves to the animation's duration in ms. */
  play(from, to) {
    const moves = []; genPiece(position.board, parseSq(from), 'all', moves);
    const move = moves.find(m => m.to === parseSq(to) && !m.captures.length && !m.swap && !m.shove);
    if (!move) throw new Error(`no quiet move ${from}-${to}`);
    window.harness.done = scene.play(move).then(ok => { if (ok) { position = makeMove({ ...position, turn: colorOf(position.board[move.from]) }, move); scene.setPosition(position); } return ok; });
    return move;
  },
  select(sq) { scene.setSelected(sq == null ? null : parseSq(sq)); },
  foot(sq) { const f = scene.foot(parseSq(sq)); return { x: f.x, y: f.y + HEADROOM }; },
};
