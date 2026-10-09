// feat-your-move: what each target does before you play it.
// Verb marks on the real board: the Ogre's shove arrow, the Beast's numbered bites, the Maester's swap
// arrows, the refusal at the Guard, and the Ogre's take-or-shove choice as two pictures at the square.
// The rules come from the engine (KD.legal, KD.describe). Nothing here writes a rule.
import { createBoard, KD, figureArt } from '../../kit/board.js';
import { icon } from '../../kit/icons.js';
import { $, $$, sfx, haptic, openSheet, closeSheet, hideToast, prefersReducedMotion, wait } from '../../kit/ui.js';

// ---- positions: P1 of the idea bank (Black has just played e7-e6), and a later moment for the choice ----
const BEFORE_P1 = 'r1b2mk1/2p1p1pp/1a6/pp1o4/2g1S3/A1OP4/PP1G1PPP/R1B2MK1 b - - 0 11';
const P1 = () => KD.play(KD.fromFen(BEFORE_P1), 'e7-e6');
const LATER = () => ['Oc3-d4', 'h7-h6'].reduce((s, lan) => KD.play(s, lan), P1());
const YOU = 'w';

// ---- words (ASD-STE100; eight words or fewer in play) ----
const NAME = { pawn: 'Pawn', knight: 'Knight', bishop: 'Bishop', rook: 'Rook', queen: 'Queen', king: 'King', archer: 'Archer', paladin: 'Paladin', guard: 'Guard', maester: 'Maester', beast: 'Beast', ogre: 'Ogre' };
const LINE = {
  pawn: 'Steps forward. Takes on the diagonal.',
  knight: 'Jumps in an L, over pieces.',
  bishop: 'Slides on the diagonals.',
  rook: 'Slides along ranks and files.',
  queen: 'Slides in any straight line.',
  king: 'Steps one square in any direction.',
  archer: 'Shoots without moving, even over other pieces.',
  paladin: 'A take, except of a pawn, removes it.',
  guard: 'Only a king can take it. It never takes.',
  maester: 'Swaps places with a friend next to it.',
  beast: 'After each bite, it can bite again.',
  ogre: 'Shoves a neighbour and steps into its place.',
};
const COUNT = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
const KEY_WORD = { step: 'Step', take: 'Take', bite: 'Bite', shot: 'Shoot', shove: 'Shove', swap: 'Swap' };

// ---- the marks' colours: each kind also has its own shape ----
const C = { shove: '#2f7f75', swap: '#7d5ba6', bite: '#8a2418', take: '#b3261e', done: '#5b5045', halo: 'rgba(251,246,232,.94)' };

/** Two arcs round a ground ellipse, each with an arrowhead: the swap's sign (the app's own swap ring). */
function cycle(cx, cy, rx, ry, s) {
  let arcs = '', heads = '';
  for (let i = 0; i < 2; i++) {
    const a0 = 0.4 + i * Math.PI, a1 = a0 + Math.PI * 0.72;
    const p = a => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    arcs += `M${x0.toFixed(1)} ${y0.toFixed(1)}A${rx} ${ry} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    const tx = -Math.sin(a1) * rx, ty = Math.cos(a1) * ry, n = Math.hypot(tx, ty), ux = tx / n, uy = ty / n;
    heads += `M${(x1 + ux * s).toFixed(1)} ${(y1 + uy * s).toFixed(1)}L${(x1 - uy * s * 0.75).toFixed(1)} ${(y1 + ux * s * 0.75).toFixed(1)}L${(x1 + uy * s * 0.75).toFixed(1)} ${(y1 - ux * s * 0.75).toFixed(1)}Z`;
  }
  return { arcs, heads };
}
const SWAP_KEY = cycle(12, 13.5, 9, 5.2, 4.2);

/** Small pictures of each mark, for the key under the board (24 x 24). */
const GLYPH = {
  step: '<path d="M12 4.5l5.5 7.5-5.5 7.5-5.5-7.5z" fill="#f0bf52" stroke="#3a2408" stroke-width="1.6" stroke-linejoin="round"/>',
  take: `<ellipse cx="12" cy="15.5" rx="8.5" ry="3.4" fill="none" stroke="${C.take}" stroke-width="2.2"/><path d="M3.5 9V4.5H8M20.5 9V4.5H16" fill="none" stroke="${C.take}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  bite: `<circle cx="12" cy="12" r="9" fill="${C.bite}"/><text x="12" y="16.2" text-anchor="middle" font-size="12" font-weight="700" fill="#fbf6e8" font-family="Cinzel, Georgia, serif">1</text>`,
  shot: `<circle cx="12" cy="12" r="6" fill="none" stroke="${C.take}" stroke-width="2"/><path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5" stroke="${C.take}" stroke-width="2" stroke-linecap="round"/>`,
  shove: `<path d="M2.5 9.6h10.5V5.5l8.5 6.5-8.5 6.5v-4.1H2.5z" fill="${C.shove}" stroke-linejoin="round"/>`,
  swap: `<path d="${SWAP_KEY.arcs}" fill="none" stroke="${C.swap}" stroke-width="2.4" stroke-linecap="round"/><path d="${SWAP_KEY.heads}" fill="${C.swap}" stroke="${C.swap}" stroke-width="0.8" stroke-linejoin="round"/>`,
  // A plain shield with a small crown: only a king can take a guard. No check mark: the move is refused.
  shield: '<path d="M12 2.5l7.5 3.2v5.5c0 4.8-3.2 8.7-7.5 10.6-4.3-1.9-7.5-5.8-7.5-10.6V5.7z" fill="#f6e7bb" stroke="#7a5712" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 15.4l-.7-6 3 2.4L12 8.2l1.7 3.6 3-2.4-.7 6z" fill="#7a5712" stroke="#7a5712" stroke-width="0.8" stroke-linejoin="round"/>',
  hint: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z" fill="#fff4cf" stroke="#7a5712" stroke-width="1.6" stroke-linejoin="round"/>',
};
const glyph = (k, cls = '', rot = 0) => `<svg viewBox="0 0 24 24" class="${cls}"${rot ? ` style="transform:rotate(${rot.toFixed(0)}deg)"` : ''} aria-hidden="true" focusable="false">${GLYPH[k]}</svg>`;

// ---- helpers ----
const FILES = 'abcdefgh';
const nm = i => FILES[i & 7] + ((i >> 3) + 1);
const ix = sq => KD.sq.index(sq);
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const starts = (a, pre) => pre.every((x, i) => a[i] === x);
const nextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

// ---- state of this screen ----
let marks = 'verbs';     // 'verbs' (option A) or 'dots' (option B)
let base = 1;            // plies that belong to the setup: Undo stops there
let chain = null;        // a Beast chain in progress: { from, at, state0, moves, path, busy }
let chainDone = Promise.resolve();
let refusal = null;      // the square of a refused tap (an enemy Guard)
let fan = null;          // the open choice at the square: { el, done, from }
let focusSq = null;      // the target under the pointer or the keyboard cursor
let note = null;         // a line that stays until the next tap: { art, title, line, stamp }
let lastStory = null;    // the last move, for the line at rest
let aside = null;        // a line for the selected piece that stays until the next tap (after a chain goes back)
let lastInput = 'pointer';
let run = 0;

const board = createBoard($('#board'), {
  play: { level: 'beginner', human: 'w', ms: 500, pause: 450 },
  label: 'King Down board. Arrow keys move, Enter or Space chooses, Escape cancels, I reads a piece.',
  choose: moves => openFan(moves),
  onTap, onSelect, onMove, onInspect,
});

// Three layers over the squares: one under the figures (ground marks), one over them (numbers, shield),
// and one for the target under the pointer or the cursor (drawn alone, so the other marks do not pop again).
const NS = 'http://www.w3.org/2000/svg';
function layer(cls) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('class', `vm ${cls}`);
  s.setAttribute('viewBox', '0 0 800 800');
  s.setAttribute('preserveAspectRatio', 'none');
  s.setAttribute('aria-hidden', 'true');
  board.layer.appendChild(s);
  return s;
}
const under = layer('vm-under'), over = layer('vm-over'), lens = layer('vm-over');
let ghost = null;

// ---- mark shapes (100 units = one square) ----
const pos = sq => { const { col, row } = board.colRow(sq); return { x: col * 100, y: row * 100, col, row }; };
const far = (a, b) => { const p = pos(a), q = pos(b); return Math.hypot(p.col - q.col, p.row - q.row); };
/** Marks grow a little on a small board, as the app's marks do (1 on a desktop, up to 1.45 on a phone). */
const K = () => Math.min(1.45, Math.max(1, 64 / (board.tile || 64)));
const grp = (body, { pop = false, d = 0, cls = '' } = {}) =>
  `<g class="${[pop && !prefersReducedMotion() ? 'pop' : '', cls].join(' ').trim()}" style="--d:${d.toFixed(2)}">${body}</g>`;
const haloed = (d, fill, t = '') => `<path d="${d}" ${t ? `transform="${t}"` : ''} fill="${fill}" stroke="${C.halo}" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>`;

function groundRing(sq, colour, { w = 4, dashed = false } = {}) {
  const { x, y } = pos(sq), cx = x + 50, cy = y + 82;
  return `<ellipse cx="${cx}" cy="${cy}" rx="40" ry="14" fill="none" stroke="${C.halo}" stroke-width="${w + 4}"/>
    <ellipse cx="${cx}" cy="${cy}" rx="40" ry="14" fill="none" stroke="${colour}" stroke-width="${w}"${dashed ? ' stroke-dasharray="10 7"' : ''}/>`;
}
/** One arrow (the shove) or a two-way arrow (the swap), centred on (cx, cy), pointing at `ang` degrees. */
function arrow(cx, cy, ang, { two = false, len = 60 } = {}) {
  const h = len / 2;
  const d = two
    ? `M${-h} 0L${-h + 17} -14L${-h + 17} -5L${h - 17} -5L${h - 17} -14L${h} 0L${h - 17} 14L${h - 17} 5L${-h + 17} 5L${-h + 17} 14Z`
    : `M${-h} -5.5L${h - 24} -5.5L${h - 24} -15L${h} 0L${h - 24} 15L${h - 24} 5.5L${-h} 5.5Z`;
  return { d, t: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${ang.toFixed(1)})` };
}
/** The shove: a teal ring under the neighbour, and an arrow on the square where it lands. */
function shoveArrow(target, landing) {
  const a = pos(target), b = pos(landing);
  const ang = Math.atan2(b.row - a.row, b.col - a.col) * 180 / Math.PI;
  const { d, t } = arrow(b.x + 50, b.y + 52, ang, { len: 62 });
  return haloed(d, C.shove, t);
}
/**
 * The swap, for the target under the pointer or the cursor only: a two-way arrow between the Maester and
 * the friend, inside the squares and where the figures hide it least. At rest each friend has one swap ring.
 */
function swapArrow(from, to) {
  const a = pos(from), b = pos(to), dc = b.col - a.col, dr = b.row - a.row;
  let cx, cy, ang, len = 58;
  if (Math.abs(dc) <= 1 && Math.abs(dr) <= 1) {
    if (dr === 0) { cx = (a.x + b.x) / 2 + 50; cy = a.y + 82; ang = 0; }                  // side by side: at the feet, inside the squares
    else if (dc === 0) { cx = a.x + 14; cy = (a.y + b.y) / 2 + 50; ang = 90; }           // one above the other: at the left edge
    else { cx = Math.max(a.x, b.x); cy = Math.max(a.y, b.y); ang = Math.atan2(dr, dc) * 180 / Math.PI; len = 64; } // corner to corner
  } else { cx = (a.x + b.x) / 2 + 50; cy = a.y + 82; ang = 0; len = Math.abs(b.x - a.x) - 30; } // the far swap with the king
  const { d, t } = arrow(cx, cy, ang, { two: true, len });
  return haloed(d, C.swap, t);
}
/** A bite number at the feet: solid for the next bite, dashed for a later one, grey for a bite done. */
function badge(sq, n, { hollow = false, done = false } = {}) {
  const { x, y } = pos(sq), k = K(), cx = x + 50, cy = y + 94 + 4 * k;
  const r = (done ? 13 : 17) * k, fs = (done ? 17 : 22) * k;
  const fill = done ? C.done : hollow ? '#fbf6e8' : C.bite, ink = hollow ? C.bite : '#fbf6e8';
  return `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="${fill}" stroke="${hollow ? C.bite : C.halo}" stroke-width="${hollow ? 3 : 3.5}"${hollow ? ' stroke-dasharray="6 4"' : ''}/>
    <text x="${cx}" y="${(cy + fs * 0.34).toFixed(1)}" text-anchor="middle" font-size="${fs.toFixed(1)}" fill="${ink}">${n}</text>`;
}
/** The receipt after a chain: a small crimson tag with the count, at the Beast's feet. */
function stampMark(sq, n) {
  const { x, y } = pos(sq), k = K(), cx = x + 50, cy = y + 94 + 4 * k, w = 54 * k, h = 34 * k;
  return `<rect x="${(cx - w / 2).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${(h / 2).toFixed(1)}" fill="${C.bite}" stroke="${C.halo}" stroke-width="3.5"/>
    <text x="${cx}" y="${(cy + 7.5 * k).toFixed(1)}" text-anchor="middle" font-size="${(22 * k).toFixed(1)}" fill="#fbf6e8">×${n}</text>`;
}
function shieldMark(sq) {
  const { x, y } = pos(sq), k = 2 * K();
  return `<g transform="translate(${(x + 50 - 12 * k).toFixed(1)} ${(y + 64 - 12 * k).toFixed(1)}) scale(${k.toFixed(2)})">${GLYPH.shield}</g>`;
}
// Option B, drawn fairly: a solid two-tone dot (a dark core in a pale edge) reads as filled on light and dark stone.
const dot = sq => { const { x, y } = pos(sq), cx = x + 50, cy = y + 52; return `<circle cx="${cx}" cy="${cy}" r="16" fill="rgba(251,246,232,.85)"/><circle cx="${cx}" cy="${cy}" r="13" fill="rgba(16,10,4,.9)"/>`; };
const ring = sq => { const { x, y } = pos(sq); return `<ellipse cx="${x + 50}" cy="${y + 80}" rx="44" ry="16" fill="none" stroke="rgba(251,246,232,.5)" stroke-width="11"/><ellipse cx="${x + 50}" cy="${y + 80}" rx="44" ry="16" fill="none" stroke="rgba(28,20,10,.6)" stroke-width="6"/>`; };

function clearOverlay() {
  under.innerHTML = '';
  over.innerHTML = '';
  lens.innerHTML = '';
  ghost?.remove(); ghost = null;
}

/** The small refusal nudge: the figure leans toward the square it cannot go to, then comes back. */
function nudge(fromSq, toward) {
  const el = board.figure(fromSq);
  if (!el || prefersReducedMotion()) return;
  const a = pos(fromSq), b = pos(toward), k = board.tile * 0.14;
  const n = Math.hypot(b.col - a.col, b.row - a.row) || 1;
  const dx = (b.col - a.col) / n * k, dy = (b.row - a.row) / n * k;
  el.animate([{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 260, easing: 'ease-in-out' });
}

// ---- drawing the marks for the current moment ----
function decorate({ pop = false } = {}) {
  clearOverlay();
  const U = [], O = [];
  if (chain) drawChain(U, O, pop);
  else if (board.selected != null && board.targets.length) drawTargets(U, O, pop);
  if (refusal) {
    U.push(`<ellipse class="glint" cx="${pos(refusal).x + 50}" cy="${pos(refusal).y + 82}" rx="40" ry="14" fill="none" stroke="#e9c071" stroke-width="6"/>`);
    O.push(grp(shieldMark(refusal), { cls: prefersReducedMotion() ? '' : 'shield' }));
  }
  if (note?.stamp) O.push(grp(stampMark(note.stamp.sq, note.stamp.n), { cls: prefersReducedMotion() ? '' : 'stamp' }));
  under.innerHTML = U.join('');
  over.innerHTML = O.join('');
  drawFocus();
}

function drawTargets(U, O, pop) {
  const from = nm(board.selected), moves = board.targets;
  const by = new Map();
  for (const m of moves) { const s = m.path[0]; if (!by.has(s)) by.set(s, []); by.get(s).push(m); }
  if (marks === 'dots') {
    for (const k of ['move', 'capture', 'shot', 'swap', 'shove', 'power']) board.clearMarks(k);
    for (const sq of by.keys()) U.push(grp(board.cells[ix(sq)] ? ring(sq) : dot(sq), { pop, d: far(from, sq) }));
    return;
  }
  // A swap keeps the board's own swap ring (one sign for each friend); its arrow shows only on focus.
  board.clearMarks('shove');
  for (const [sq, ms] of by) {
    const d = far(from, sq), push = ms.find(m => m.push);
    const take = ms.some(m => m.captures.length && !m.push && m.kind !== 'shoot');
    if (push) {
      if (take) board.mark(sq, 'capture', { pop, from });   // two ways on one square: take or shove
      else U.push(grp(groundRing(sq, C.shove), { pop, d }));
      U.push(grp(shoveArrow(sq, push.push.to), { pop, d: d + 0.6 }));
    }
  }
  // The Beast: number the bites when a chain is possible (1 now, 2 after it).
  if (moves.some(m => m.path.length > 1)) {
    const depth = new Map();
    for (const m of moves) if (m.captures.length) m.path.forEach((s, j) => { if (!depth.has(s) || depth.get(s) > j + 1) depth.set(s, j + 1); });
    for (const [sq, n] of depth) O.push(grp(badge(sq, n, { hollow: n > 1 }), { pop, d: far(from, sq) + (n - 1) * 1.5 }));
  }
}

function drawChain(U, O, pop) {
  const c = chain, k = c.path.length;
  board.clearMarks('selected'); board.clearMarks('capture');
  board.mark(c.at, 'selected');
  board.figure(c.at)?.classList.add('is-selected');
  const more = c.moves.filter(m => m.path.length > k && starts(m.path, c.path));
  const next = [...new Set(more.map(m => m.path[k]))];
  for (const sq of next) {
    if (marks === 'dots') U.push(grp(ring(sq), { pop, d: far(c.at, sq) }));
    else board.mark(sq, 'capture', { pop, from: c.at });
  }
  if (marks === 'dots') return;
  c.path.forEach((sq, j) => O.push(badge(sq, j + 1, { done: true })));
  const depth = new Map();
  for (const m of more) for (let j = k; j < m.path.length; j++) if (!depth.has(m.path[j])) depth.set(m.path[j], j + 1);
  for (const [sq, n] of depth) O.push(grp(badge(sq, n, { hollow: n > k + 1 }), { pop, d: far(c.at, sq), cls: '' }));
}

/**
 * The target under the pointer or the cursor: on a shove, a see-through copy shows where the piece lands;
 * on a swap, a two-way arrow joins the Maester and the friend.
 */
function drawFocus() {
  ghost?.remove(); ghost = null;
  lens.innerHTML = '';
  if (!focusSq || marks !== 'verbs' || chain || board.selected == null) return;
  const swap = board.targets.find(m => m.path[0] === focusSq && m.swap);
  if (swap) { lens.innerHTML = grp(swapArrow(nm(board.selected), focusSq), { pop: true }); return; }
  const push = board.targets.find(m => m.path[0] === focusSq && m.push);
  if (!push) return;
  const cell = board.cells[ix(push.push.from)];
  const art = figureArt(cell);
  if (!art.box) return;
  const { col, row } = board.colRow(push.push.to);
  ghost = document.createElement('div');
  ghost.className = 'kdb-fig is-ghost vm-ghost';
  Object.assign(ghost.style, { left: `${col * 12.5}%`, top: `${row * 12.5}%`, zIndex: String(11 + row * 3) });
  const img = new Image();
  img.alt = ''; img.src = art.src; img.draggable = false;
  Object.assign(img.style, { left: `${art.box.left * 100}%`, top: `${art.box.top * 100}%`, width: `${art.box.width * 100}%`, height: `${art.box.height * 100}%` });
  if (art.box.mirror) img.classList.add('mirror');
  ghost.appendChild(img);
  board.layer.appendChild(ghost);
}

// ---- the context strip: one task at a time ----
function sentence(at, all) {
  const turn = KD.status(board.state).turn;
  const cell = q => board.cells[ix(q)];
  const whose = c => (c.color === turn ? 'your' : 'their');
  const sq = at[0].path[0], here = cell(sq);
  const push = at.find(m => m.push), swap = at.find(m => m.swap), shot = at.find(m => m.kind === 'shoot');
  const take = at.find(m => m.captures.length && !m.push && m.kind !== 'shoot');
  if (push && take) return `Take or shove their ${here.type}.`;
  if (push) { const c = cell(push.push.from); return `Shove ${whose(c)} ${c.type} to ${push.push.to}.`; }
  if (swap) return `Swap places with your ${here.type}.`;
  if (shot) return `Shoot their ${here.type}. Your archer stays.`;
  if (take && all.some(m => m.path.length > 1)) return at.some(m => m.path.length > 1) ? `Bite their ${here.type}. A second bite can follow.` : `Bite their ${here.type}.`;
  if (take) return `Take their ${here.type}.`;
  if (at.some(m => m.promo)) return `Step to ${sq} and promote.`;
  return `Move to ${sq}.`;
}

function keysFor(moves) {
  const k = new Set(), chainy = moves.some(m => m.path.length > 1);
  for (const m of moves) {
    if (m.push) k.add('shove');
    else if (m.swap) k.add('swap');
    else if (m.kind === 'shoot') k.add('shot');
    else if (m.captures.length) k.add(chainy ? 'bite' : 'take');
    else k.add('step');
  }
  if (moves.some(m => m.push) && moves.some(m => m.captures.length && !m.push && m.kind !== 'shoot' && m.path[0] === moves.find(x => x.push).path[0])) k.add('take');
  return ['step', 'take', 'bite', 'shot', 'shove', 'swap'].filter(x => k.has(x));
}

function short(st) {
  if (!st) return null;
  const who = st.side === YOU ? 'Your' : 'Their', opp = st.side === YOU ? 'their' : 'your';
  const p = st.piece, n = st.capturedOn.length;
  switch (st.kind) {
    case 'push': { const c = st.after[ix(st.push.to)]; return `${who} ${p} shoves ${c?.color === st.side ? who.toLowerCase() : opp} ${st.push.piece}.`; }
    case 'swap': return `${who} ${p} swaps with the ${st.swap.with}.`;
    case 'shoot': return `${who} ${p} shoots ${opp} ${st.captured[0]}.`;
    case 'chain': return `${who} ${p} bites ${n === 2 ? 'twice' : `${n} times`}.`;
    case 'capture': return `${who} ${p} takes ${opp} ${st.captured[0]}.`;
    case 'promote': return `${who} pawn becomes a ${st.promo}.`;
    default: return `${who} ${p} moves to ${st.to}.`;
  }
}

function view() {
  const s = board.state;
  if (fan) {
    const cell = board.cells[ix(fan.from)];
    const two = fan.moves.some(m => m.push) && fan.moves.some(m => !m.push);
    return { art: cell, title: NAME[cell.type], line: two ? 'Take, or shove?' : 'Choose one.', keys: two && marks === 'verbs' ? ['take', 'shove'] : [] };
  }
  if (chain && chain.busy) return { art: board.cells[ix(chain.at)], title: 'Beast', line: `Bite ${chain.path.length + 1}.`, keys: marks === 'verbs' ? ['bite'] : [] };
  if (chain) {
    // A tap off the marks keeps the pause and says what to do. Escape or Undo puts the Beast back.
    const line = !chain.missed ? 'Bite again, or stop here.' : marks === 'verbs' ? `Tap the ${chain.path.length + 1}, or stop here.` : 'Tap a ring, or stop here.';
    return { art: board.cells[ix(chain.at)], title: 'Beast', line, keys: marks === 'verbs' ? ['bite'] : [], act: 'Stop here', tone: chain.missed ? 'refuse' : '' };
  }
  if (refusal) return { art: 'shield', title: 'Guard', line: 'Only a king can take a guard.', tone: 'refuse' };
  if (s && board.selected != null) {
    const cell = board.cells[board.selected], moves = board.targets;
    const at = focusSq ? moves.filter(m => m.path[0] === focusSq) : [];
    return {
      art: cell, title: NAME[cell.type],
      line: at.length ? sentence(at, moves) : aside ?? (moves.length ? LINE[cell.type] : 'This piece cannot move now.'),
      keys: marks === 'verbs' ? keysFor(moves) : [],
    };
  }
  if (note) return note;
  if (!s) return { title: 'Your move', line: '' };
  const st = KD.status(s);
  if (st.over) return { art: { type: 'king', color: YOU }, title: 'Game over', line: st.text };
  if (!board.isHuman(st.turn)) return { art: { type: 'king', color: st.turn }, title: 'Their move', line: 'The computer thinks.' };
  return { art: { type: 'king', color: YOU }, title: 'Your move', line: short(lastStory) ?? 'Tap a piece to see what it does.' };
}

let shownKey = '';
function renderCtx() {
  const v = view(), ctx = $('#ctx');
  const key = `${v.title}|${v.line}|${(v.keys ?? []).join()}|${v.act ?? ''}`;
  if (key === shownKey) return;
  shownKey = key;
  const art = $('#ctx-art');
  if (v.art === 'shield' || v.art === 'hint') art.innerHTML = glyph(v.art);
  else if (v.art) { const a = figureArt(v.art); art.innerHTML = `<img src="${a.src}" alt="">`; }
  else art.innerHTML = '';
  $('#ctx-title').textContent = v.title;
  $('#ctx-line').textContent = v.line;
  $('#ctx-keys').innerHTML = (v.keys ?? []).map(k => `<li>${glyph(k)}<span>${KEY_WORD[k]}</span></li>`).join('');
  const act = $('#ctx-act');
  act.hidden = !v.act;
  if (v.act) act.textContent = v.act;
  ctx.dataset.tone = v.tone ?? '';
  ctx.classList.remove('is-new');
  if (!prefersReducedMotion()) { void ctx.offsetWidth; ctx.classList.add('is-new'); }
}

function updateBar() {
  const s = board.state, st = s && KD.status(s);
  $('#their-turn').hidden = !(st && !st.over && !board.isHuman(st.turn));
  // During a Beast chain, Undo puts the Beast back (nothing is played until the chain ends).
  $('#undo').disabled = !chain && (!s || s.history.length <= base);
}

// ---- board callbacks ----
function onSelect() {
  if (chain) {
    // A drag that starts during the pause does not pick a new piece: the chain keeps the board.
    if (board.selected != null) board.clearSelection(false);
    decorate();
    return;
  }
  refusal = null; note = null; focusSq = null; aside = null;
  board.clearMarks('hint');
  decorate({ pop: true });
  renderCtx();
}

function onMove(story) {
  lastStory = story; note = null; focusSq = null;
  clearOverlay();
  renderCtx(); updateBar();
}

function onInspect(sq, cell) {
  if (chain || fan) return;
  // A hold on a target reads it: the line says what the move does. It never plays it.
  if (board.selected != null && board.targets.some(m => m.path[0] === sq)) { setFocus(sq); return; }
  if (board.selected != null) return;
  const turn = board.state ? KD.status(board.state).turn : YOU;
  note = { art: cell, title: `${cell.color === turn ? 'Your' : 'Their'} ${cell.type}`, line: LINE[cell.type] };
  renderCtx();
}

function onTap(sq, cell) {
  if (fan) { fan.done(null); return false; }
  if (chain) { chainTap(sq); return false; }
  const s = board.state;
  if (!s || board.busy) return undefined;
  const st = KD.status(s);
  if (st.over || !board.isHuman(st.turn)) return undefined;
  aside = null;
  if (board.selected != null) {
    const next = board.targets.filter(m => m.path[0] === sq);
    if (next.length && next.some(m => m.path.length > 1)) { startChain(sq); return false; }
    // The shove arrow sits on the landing square: a tap there plays that shove. The landing square is two
    // squares from the Ogre, so it is never one of its own targets, and two shoves never share it.
    const landing = !next.length && marks === 'verbs' ? board.targets.filter(m => m.push && m.push.to === sq) : [];
    if (landing.length === 1) { clearOverlay(); refusal = null; note = null; void board.playMove(landing[0]); return false; }
    const mine = board.cells[board.selected];
    if (!next.length && cell && cell.type === 'guard' && cell.color !== st.turn && mine && mine.type !== 'king') { refuse(sq); return false; }
    // A tap on a target plays it: the marks go first, so they never cover the move.
    if (next.length) { clearOverlay(); refusal = null; note = null; return undefined; }
  }
  if (refusal || note) { refusal = null; note = null; decorate(); renderCtx(); }
  return undefined;
}

/** The target that a square points at: the target itself or, for a shove, its landing square. */
function aimAt(sq) {
  if (sq == null || board.selected == null) return null;
  if (board.targets.some(m => m.path[0] === sq)) return sq;
  const p = marks === 'verbs' ? board.targets.find(m => m.push && m.push.to === sq) : null;
  return p ? p.path[0] : null;
}

function setFocus(sq) {
  if (sq === focusSq) return;
  focusSq = sq;
  drawFocus();
  renderCtx();
}

// ---- the refusal: the rule tells itself at the Guard ----
function refuse(sq) {
  refusal = sq; focusSq = null;
  decorate();
  renderCtx();
  nudge(nm(board.selected), sq);
  haptic([8, 40, 8]);
}

// ---- the Beast's chain: bite, pause, then bite again or stop ----
function startChain(sq) {
  chain = { from: nm(board.selected), at: nm(board.selected), state0: board.state, moves: board.targets.slice(), path: [], busy: false, missed: false };
  focusSq = null;
  updateBar();
  chainDone = biteTo(sq);
}

async function biteTo(sq) {
  const c = chain;
  c.busy = true; c.missed = false;
  clearOverlay();
  board.clearSelection(false);
  renderCtx();
  const mover = board.figure(c.at), victim = board.figure(sq);
  if (!prefersReducedMotion()) {
    await board.slide(mover, c.at, sq, { dur: 230 });
    if (chain !== c) return;
    sfx.play('capture'); haptic(12);
    await board.dip(victim);
    if (chain !== c) return;
  } else sfx.play('capture');
  c.path.push(sq); c.at = sq;
  const exact = c.moves.find(m => same(m.path, c.path));
  const more = c.moves.filter(m => m.path.length > c.path.length && starts(m.path, c.path));
  if (exact) board.setBoard(KD.describe(c.state0, exact).after, { keepMarks: true });
  if (!more.length) { finishChain(exact); return; }
  c.busy = false;
  decorate({ pop: true });
  renderCtx();
}

function chainTap(sq) {
  const c = chain;
  if (c.busy) return;
  if (sq === c.at) { stopHere(); return; }
  const next = c.moves.some(m => m.path.length > c.path.length && starts(m.path, c.path) && m.path[c.path.length] === sq);
  if (next) { chainDone = biteTo(sq); return; }
  // Off the marks: the pause stays. The Beast leans toward the tap, and the line says what to do.
  c.missed = true;
  nudge(c.at, sq);
  haptic([8, 40, 8]);
  renderCtx();
}

function stopHere() {
  if (!chain || chain.busy) return;
  const exact = chain.moves.find(m => same(m.path, chain.path));
  if (exact) finishChain(exact);
}

function cancelChain() {
  const c = chain;
  if (!c) return;
  chain = null;
  show(c.state0, { keepBase: true });
  board.selectSquare(c.from);
  aside = 'The Beast goes back. Nothing is played.';
  renderCtx();
}

function finishChain(m) {
  const c = chain;
  chain = null;
  const story = KD.describe(c.state0, m), n = story.capturedOn.length;
  show(story.next, { keepBase: true });
  lastStory = story;
  // The one strong moment: the count stamps at the Beast's feet. No banner.
  note = n > 1
    ? { art: { type: 'beast', color: story.side }, title: 'Beast', line: `${COUNT[n]} bites. One turn.`, stamp: { sq: story.to, n } }
    : { art: { type: 'beast', color: story.side }, title: 'Beast', line: 'One bite. The Beast stops here.' };
  decorate();
  renderCtx();
  if (n > 1) haptic([10, 30, 14]);
}

// ---- the choice at the square: two small pictures of the result, not a dialog ----
/** A figure's box, made small enough to stand inside one square of a picture (feet kept where they can be). */
function fitBox(b) {
  const s = Math.min(1, 1 / b.width, 1 / b.height), w = b.width * s, h = b.height * s;
  return {
    left: Math.max(0, Math.min(1 - w, b.left + b.width / 2 - w / 2)),
    top: Math.max(0, Math.min(1 - h, b.top + b.height - h)),
    width: w, height: h,
  };
}
const screenAngle = (a, b) => { const p = board.colRow(a), q = board.colRow(b); return Math.atan2(q.row - p.row, q.col - p.col) * 180 / Math.PI; };

function openFan(moves) {
  return new Promise(resolve => {
    const s = board.state, target = moves[0].path[0], from = moves[0].from;
    const host = $('#board');
    // The squares that change: the target and, for a shove, where the piece lands.
    let sqs = [...new Set(moves.flatMap(m => [m.to, m.push?.to].filter(Boolean)))];
    const cr = q => board.colRow(q);
    let cols = sqs.map(q => cr(q).col), rows = sqs.map(q => cr(q).row);
    if (Math.max(...cols) - Math.min(...cols) > 1 || Math.max(...rows) - Math.min(...rows) > 1) { sqs = [target]; cols = [cr(target).col]; rows = [cr(target).row]; }
    const c0 = Math.min(...cols), c1 = Math.max(...cols), r0 = Math.min(...rows), r1 = Math.max(...rows);
    const mini = Math.round(Math.max(34, Math.min(64, board.tile * 0.74)));
    const el = document.createElement('div');
    el.className = 'fan';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', 'Choose a move');
    const word = m => (m.push ? 'Shove' : m.promo ? NAME[m.promo] ?? m.promo : m.captures.length ? 'Take' : 'Move');
    const label = m => (m.push ? `Shove their ${s && board.cells[ix(m.push.from)]?.type} to ${m.push.to}` : m.promo ? `Promote to ${m.promo}` : m.captures.length ? `Take their ${board.cells[ix(m.captures[0])]?.type}` : `Move to ${m.to}`);
    const nameAt = (col, row) => (board.flipped ? FILES[7 - col] + (row + 1) : FILES[col] + (8 - row));
    el.innerHTML = moves.map((m, i) => {
      const after = KD.describe(s, m).after;
      let pic = '';
      for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) {
        const q = nameAt(col, row), cell = after[ix(q)];
        const bg = `background-image:url(../../assets/stone-board.webp);background-position:${(col / 7 * 100).toFixed(3)}% ${(row / 7 * 100).toFixed(3)}%`;
        let fig = '';
        if (cell) { const a = figureArt(cell); if (a.box) { const b = fitBox(a.box); fig = `<img src="${a.src}" alt="" class="${a.box.mirror ? 'mirror' : ''}" style="left:${b.left * 100}%;top:${b.top * 100}%;width:${b.width * 100}%;height:${b.height * 100}%">`; } }
        pic += `<span class="fan-sq" style="${bg}">${fig}</span>`;
      }
      // The shove glyph turns to the push, as the arrow on the board does.
      const g = m.push ? glyph('shove', '', screenAngle(m.push.from, m.push.to)) : m.captures.length ? glyph('take') : '';
      return `<button type="button" class="fan-tile" data-i="${i}" aria-label="${label(m)}">
        <span class="fan-pic" style="grid-template-columns:repeat(${c1 - c0 + 1},${mini}px);grid-template-rows:repeat(${r1 - r0 + 1},${mini}px)">${pic}</span>
        <span class="fan-word">${g}${word(m)}</span></button>`;
    }).join('');
    host.appendChild(el);
    const tiles = $$('.fan-tile', el);
    // Place the pictures beside the square, so the square and the pieces that change stay in view.
    const hr = host.getBoundingClientRect(), r = board.squareRect(target);
    const W = Math.max(...tiles.map(t => t.offsetWidth)), H = Math.max(...tiles.map(t => t.offsetHeight)), gap = 8;
    const cy = r.top - hr.top + r.height / 2;
    const top = Math.max(4, Math.min(hr.height - H - 4, cy - H * 0.55));
    let lefts;
    if (tiles.length === 2) {
      const L = r.left - hr.left - gap - W, R = r.right - hr.left + gap;
      lefts = [L, R];
      if (L < 4) lefts = [R, R + W + gap];
      if (R + W > hr.width - 4) lefts = [L - W - gap, L];
    } else {
      const total = tiles.length * W + (tiles.length - 1) * gap;
      const x0 = Math.max(4, Math.min(hr.width - total - 4, r.left - hr.left + r.width / 2 - total / 2));
      lefts = tiles.map((_, i) => x0 + i * (W + gap));
    }
    tiles.forEach((t, i) => {
      const x = Math.max(4, Math.min(hr.width - W - 4, lefts[i]));
      Object.assign(t.style, { left: `${x}px`, top: `${tiles.length === 2 ? top : Math.max(4, r.top - hr.top - H - gap)}px`, width: `${W}px` });
      t.style.setProperty('--fx', `${(r.left - hr.left + r.width / 2) - (x + W / 2)}px`);
      if (!prefersReducedMotion()) t.classList.add('pop');
    });
    let finished = false;
    const done = m => {
      if (finished) return;
      finished = true;
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', keys, true);
      const hadFocus = el.contains(document.activeElement);
      el.remove();
      fan = null;
      if (hadFocus) board.el.focus({ preventScroll: true });
      resolve(m);
      if (!m) { refusal = null; renderCtx(); }
    };
    const outside = e => { if (!el.contains(e.target) && !board.el.contains(e.target)) done(null); };
    document.addEventListener('pointerdown', outside, true);
    el.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) done(moves[+b.dataset.i]); });
    // While the choice is open, Escape cancels and the arrow keys move between the pictures, wherever the
    // focus is (a tap or a click opens the choice without moving the focus).
    const keys = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(null); return; }
      if (e.key.startsWith('Arrow')) {
        e.preventDefault(); e.stopPropagation();
        const i = tiles.indexOf(document.activeElement), n = tiles.length, fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
        tiles[i < 0 ? 0 : (i + (fwd ? 1 : n - 1)) % n].focus();
      }
    };
    document.addEventListener('keydown', keys, true);
    fan = { el, done, from, moves };
    focusSq = null;
    clearOverlay();
    renderCtx();
    if (lastInput === 'key') tiles[0].focus({ preventScroll: true });
  });
}

// ---- input: the pointer and the cursor say what a target does; the tap still plays it ----
document.addEventListener('keydown', () => { lastInput = 'key'; }, true);
document.addEventListener('pointerdown', () => { lastInput = 'pointer'; }, true);
/** The square under a point, from two documented square boxes (works on a flipped board too). */
function squareAt(x, y) {
  const a = board.squareRect('a1'), h = board.squareRect('h8');
  const f = Math.round((x - a.left - a.width / 2) / ((h.left - a.left) / 7));
  const r = Math.round((y - a.top - a.height / 2) / ((h.top - a.top) / 7));
  return f < 0 || f > 7 || r < 0 || r > 7 ? null : FILES[f] + (r + 1);
}
board.el.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || board.selected == null) return;
  setFocus(aimAt(squareAt(e.clientX, e.clientY)));
});
board.el.addEventListener('pointerleave', () => { if (board.selected != null) setFocus(null); });
board.el.addEventListener('keydown', e => {
  if (e.key.startsWith('Arrow') && board.selected != null && !chain) setFocus(aimAt(nm(board.cursor)));
});
// Escape during a chain puts the Beast back, wherever the focus is; nothing is played until the chain ends.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !chain || $('#menu-sheet').open) return;
  e.preventDefault(); e.stopPropagation(); cancelChain();
}, true);
$('#ctx-act').addEventListener('click', stopHere);
new ResizeObserver(() => requestAnimationFrame(() => { if (board.selected != null || chain || refusal || note?.stamp) decorate(); })).observe($('#board'));

// ---- the bar: Hint, Undo, Menu ----
const label = (el, name, text) => { el.innerHTML = `${icon(name)}<span>${text}</span>`; };
label($('#hint'), 'hint', 'Hint');
label($('#undo'), 'undo', 'Undo');
label($('#menu'), 'menu', 'Menu');
$('#menu-sheet [data-close]').innerHTML = icon('close');

$('#hint').addEventListener('click', async () => {
  const s = board.state;
  if (!s || board.busy || chain || fan) return;
  const st = KD.status(s);
  if (st.over || !board.isHuman(st.turn)) return;
  note = { art: 'hint', title: 'Hint', line: 'The computer looks for a move.' };
  board.clearSelection(false); clearOverlay(); renderCtx();
  const m = await KD.think(s, { level: 'casual', ms: 450 });
  if (board.state !== s || !m || chain || fan) return;
  board.selectSquare(m.from);
  board.mark(m.path[0], 'hint');
  setFocus(m.path[0]);
});
$('#undo').addEventListener('click', () => {
  if (chain) { cancelChain(); return; }
  const s = board.state;
  if (!s || s.history.length <= base) return;
  const st = KD.status(s);
  const plies = board.play.human !== 'both' && board.isHuman(st.turn) ? 2 : 1;
  let back = s;
  for (let i = 0; i < plies && back.history.length > base; i++) back = KD.undo(back);
  show(back, { keepBase: true });
});
$('#menu').addEventListener('click', () => openSheet('menu-sheet'));
for (const r of $$('input[name="marks"]')) r.addEventListener('change', () => { if (r.checked) setMarks(r.value); });
$('#again').addEventListener('click', async () => { await closeSheet('menu-sheet'); window.demo.reset(); });

function setMarks(v) {
  marks = v;
  for (const r of $$('input[name="marks"]')) r.checked = r.value === v;
  if (board.selected != null) { board.showTargets(board.targets, { pop: false }); decorate({ pop: true }); }
  else decorate();
  shownKey = ''; renderCtx();
}

// ---- show a game ----
function show(state, { human = board.play.human, keepBase = false } = {}) {
  fan?.done(null);
  chain = null; refusal = null; note = null; focusSq = null; aside = null;
  clearOverlay(); hideToast();
  board.play.human = human;
  board.setState(state);
  if (!keepBase) base = state.history.length;
  const h = state.history.at(-1);
  lastStory = h ? KD.describe(KD.undo(state), h.lan) : null;
  shownKey = '';
  renderCtx(); updateBar();
}

/** A tap on a square, the way a finger or Enter plays it (the board's own tap path; see the notes for the lead). */
const tap = sq => board.handleTap(ix(sq));
/** Point at a target, as the mouse, the keyboard cursor or a long press does. */
const pointAt = sq => setFocus(aimAt(sq));

show(P1());

// ---- the demo contract ----
window.demo = {
  async state(name) {
    run++;
    if ($('#menu-sheet').open) await closeSheet('menu-sheet');
    setMarks(name === 'dots' ? 'dots' : 'verbs');
    show(name === 'choice' ? LATER() : P1(), { human: 'both' });
    switch (name) {
      case 'ogre': board.selectSquare('c3'); pointAt('c4'); break;
      case 'beast': board.selectSquare('e4'); pointAt('d5'); break;                          // the forecast: 1, then a dashed 2
      case 'bite-again': board.selectSquare('e4'); await tap('d5'); await chainDone; break;   // the pause after bite 1
      case 'beast-end': board.selectSquare('e4'); await tap('d5'); await chainDone; await tap('e6'); await chainDone; break;
      case 'maester': board.selectSquare('f1'); pointAt('g1'); break;
      case 'refusal': board.selectSquare('d3'); await tap('c4'); break;
      case 'choice': board.selectSquare('d4'); void tap('d5'); await nextFrame(); break;
      case 'dots': board.selectSquare('c3'); break;
      default: throw new Error(`demo.state: no state "${name}"`);
    }
    await nextFrame();
  },
  // The Ogre's arrows, the refusal at the Guard, the Maester's swaps, then the Beast bites twice.
  async play() {
    const me = ++run, ok = () => me === run;
    setMarks('verbs');
    show(P1(), { human: 'both' });
    await wait(900); if (!ok()) return;
    board.selectSquare('c3'); await wait(1000); if (!ok()) return;
    pointAt('c4'); await wait(1900); if (!ok()) return;
    setFocus(null); board.selectSquare('d3'); await wait(800); if (!ok()) return;
    await tap('c4'); await wait(2100); if (!ok()) return;
    board.selectSquare('f1'); await wait(800); if (!ok()) return;
    pointAt('g1'); await wait(1800); if (!ok()) return;
    setFocus(null); board.selectSquare('e4'); await wait(1600); if (!ok()) return;
    await tap('d5'); await chainDone; if (!ok()) return;
    await wait(1800); if (!ok()) return;
    await tap('e6'); await chainDone; if (!ok()) return;
    await wait(1800); if (!ok()) return;
    // The story ends; the game goes on against the computer.
    board.play.human = 'w';
    updateBar();
    void board.maybeAi();
  },
  async reset() {
    run++;
    if ($('#menu-sheet').open) await closeSheet('menu-sheet');
    show(P1(), { human: 'w' });
  },
};
