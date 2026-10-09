// Their turn and check. The computer's turn with no spinner (the portrait breathes once, a thin ring after
// 1 s), the tell (their piece lifts just before it moves), and a check you can see (a cause line from the
// checking piece, an ember ring on your king, one low note, no red flash).
// The scripted line is P1 of the idea bank (12. Archer shoots a5; Flame's Strike puts their Archer on e3,
// check over f2). Every other reply comes from the real computer player at Club.
import { createBoard, KD, figureArt } from '../../kit/board.js';
import { icon, pieceIcon } from '../../kit/icons.js';
import { $, toast, hideToast, sfx, haptic, openSheet, closeSheet, animate, wait, prefersReducedMotion } from '../../kit/ui.js';

const ME = 'w', CPU = 'b', LEVEL = 'club';
const POWERS = ['Frost:Freeze', 'Flame:Strike'];
// P1 one ply early, so the board shows "Black pawn e7 to e6" as the last move.
const P1_BEFORE = 'r1b2mk1/2p1p1pp/1a6/pp1o4/2g1S3/A1OP4/PP1G1PPP/R1B2MK1 b - - 0 11';
const p1 = () => KD.play(KD.fromFen(P1_BEFORE, { powers: POWERS }), 'e7-e6');
const BASE = 1; // Undo never goes back past P1
const SHOT = 'Aa3*a5', STRIKE = 'Ab6-e3!';
const afterShot = () => KD.play(p1(), SHOT);
// their-move: your Beast steps away from their Ogre, and their Archer shoots it. Club plays this reply itself.
const BEAST = 'Se4-d4', THEIR_SHOT = 'Ab6*d4';

// ---- the screen ----
const label = (el, name, text) => { el.innerHTML = `${icon(name)}<span>${text}</span>`; };
label($('#hint'), 'hint', 'Hint');
label($('#undo'), 'undo', 'Undo');
label($('#menu'), 'menu', 'Menu');
$('#moves-icon').innerHTML = icon('moves');
for (const b of document.querySelectorAll('[data-close]')) b.innerHTML = icon('close');

let tellOn = true;   // the option of this demo: the tell on (A) or off (B)
let auto = true;     // false while play() runs its script: the script starts the computer itself
let epoch = 0;       // a new state, play, reset, undo or new game stops the old run
let thinking = false;
let note = null;     // a line that replaces the last move's line for a moment (hint, Freeze, a read)

const board = createBoard($('#board'), {
  play: { level: LEVEL, human: 'both', ms: 700, pause: 0 }, // 'both': this page runs the computer itself, for the tell
  sound: false,                                            // this page plays its own sounds: one low note for check
  label: 'King Down board. You play White against the computer. Arrow keys move, Enter or Space chooses, Escape cancels, I reads a piece.',
  onTap(sq, cell) {
    // Their turn: no move, but a tap on a piece still reads it. Reading never commits a move.
    if (!board.state || KD.status(board.state).turn !== ME) { if (cell) readPiece(sq, cell); return false; }
    board.clearMarks('hint');
    if (note && !board.armed) { note = null; render(); }
    return true;
  },
  onInspect: (sq, cell) => readPiece(sq, cell),
  onMove: story => landed(story),
});

// ---- words ----
const SIDE_WORD = c => (c === ME ? 'your' : 'their');
const cap = s => s[0].toUpperCase() + s.slice(1);
const cellAt = (cells, sq) => cells[KD.sq.index(sq)];
/** True when two squares touch (or are the same). */
const near = (a, b) => { const i = KD.sq.index(a), j = KD.sq.index(b); return Math.max(Math.abs((i >> 3) - (j >> 3)), Math.abs((i & 7) - (j & 7))) <= 1; };
// A read is "Their archer." plus one of these: eight words or fewer in all.
const SHORT = {
  archer: 'Shoots over pieces, without moving.', guard: 'Only a king can take it.',
  maester: 'Swaps with a friend beside it.', beast: 'Bites, then can bite again.',
  ogre: 'Shoves a neighbour, then steps in.', paladin: 'Jumps its own pieces.',
  pawn: 'Steps forward. Takes on a diagonal.', knight: 'Jumps in an L shape.', bishop: 'Slides on the diagonals.',
  rook: 'Slides in straight lines.', queen: 'Slides in all eight directions.',
};
function readPiece(sq, cell) {
  const who = cap(SIDE_WORD(cell.color));
  if (cell.type === 'king') {
    const k = (board.state?.kings ?? [])[cell.color === 'w' ? 0 : 1];
    toast(`${who} king${k ? ` · ${k.king} · ${k.power}` : ''}. ${cell.color === ME ? 'Keep it safe.' : 'Mate it to win.'}`);
  } else toast(`${who} ${cell.type}. ${SHORT[cell.type] ?? ''}`);
}

/** One move in eight words or fewer, from a KD.describe story. */
function shortLine(st) {
  const who = cap(SIDE_WORD(st.side)), foe = SIDE_WORD(st.side === 'w' ? 'b' : 'w');
  const after = st.after, v = st.captured?.[0];
  if (st.kind === 'shoot') return `${who} archer shoots ${foe} ${v} on ${st.capturedOn[0]}.`;
  if (st.kind === 'chain') return `${who} beast bites ${st.capturedOn.length === 2 ? 'twice' : `${st.capturedOn.length} times`}.`;
  if (st.kind === 'push') { const p = cellAt(after, st.push.to); return `${who} ogre shoves ${SIDE_WORD(p.color)} ${p.type} to ${st.push.to}.`; }
  if (st.kind === 'swap') { const p = cellAt(after, st.from); return `${who} maester swaps with the ${p.type}.`; }
  if (st.powerTag === 'freeze') return `Freeze: ${foe} ${cellAt(after, st.to).type} stays still.`;
  if (st.powerTag === 'ward') return `Ice Wall guards ${SIDE_WORD(st.side)} ${cellAt(after, st.to).type}.`;
  if (st.powerTag === 'strike') return `Strike: ${SIDE_WORD(st.side)} ${st.piece} moves like a queen.`;
  if (st.powerTag === 'haste') return `Haste: ${SIDE_WORD(st.side)} ${st.piece} moves again.`;
  if (st.kind === 'pass') return `${who} turn ends.`;
  if (st.promo) return `${who} pawn becomes a ${st.promo}.`;
  if (st.capturedOn.length) return `${who} ${st.piece} takes ${foe} ${v} on ${st.capturedOn[0]}.`;
  return `${who} ${st.piece} goes to ${st.to}.`;
}

/** The pieces that give check now (the engine's own moves, with the other side to move), else []. */
function checkers(s) {
  const st = KD.status(s);
  if (!st.check) return [];
  const king = KD.board(s).find(c => c && c.type === 'king' && c.color === st.turn);
  if (!king) return [];
  const fen = KD.toFen(s), flipped = fen.replace(/ ([wb]) /, (_, t) => ` ${t === 'w' ? 'b' : 'w'} `);
  try {
    const f = KD.fromFen(flipped, { powers: s.kings, cards: s.hands });
    const from = KD.legal(f).filter(m => m.captures.includes(king.sq) && !m.power).map(m => m.from);
    return [...new Set(from)].map(sq => ({ sq, cell: KD.board(s)[KD.sq.index(sq)], king: king.sq }));
  } catch { return []; }
}

/** The square half way between two squares (a shot two squares away), or null (a knight's jump). */
function midSquare(a, b) {
  const i = KD.sq.index(a), j = KD.sq.index(b), r = (i >> 3) + (j >> 3), f = (i & 7) + (j & 7);
  return r % 2 || f % 2 || (i === j) ? null : KD.sq.name((r / 2) * 8 + f / 2);
}

/**
 * The line that says why your king is in check, eight words or fewer. An Archer that shoots over a piece
 * names that piece. last: the move that gave check, so a Strike can say how the piece got there.
 */
function checkLine(ch, s, last) {
  const t = ch.cell.type, mid = t === 'archer' ? midSquare(ch.sq, ch.king) : null;
  const over = mid && KD.board(s)[KD.sq.index(mid)] ? mid : null;
  if (last?.powerTag === 'strike' && last.to === ch.sq) {
    return over ? `Strike moved their ${t} to shoot over ${over}.` : `Strike moved their ${t} to attack your king.`;
  }
  if (over) return `Their ${t} can shoot over ${over}.`;
  if (t === 'archer') return 'Their archer can shoot your king.';
  return `Their ${t} attacks your king.`;
}

// ---- the marks of this demo: the cause line, the ember ring ----
const NS = 'http://www.w3.org/2000/svg';
const fx = document.createElementNS(NS, 'svg');
fx.setAttribute('class', 'ttc-fx');
fx.setAttribute('viewBox', '0 0 800 800');
fx.setAttribute('preserveAspectRatio', 'none');
fx.setAttribute('aria-hidden', 'true');
board.layer.appendChild(fx);
let overlays = []; // the ring elements on the board's layer
let lines = [];    // what is drawn, so a resize can draw it again at the right stroke width

function clearCause() {
  fx.replaceChildren();
  for (const el of overlays) el.remove();
  overlays = []; lines = [];
}

/** px to board units (the layer is 800 units wide). */
const unit = () => 800 / Math.max(1, board.layer.clientWidth);

/**
 * The control point of an arc (a quadratic curve). It sits straight above the middle of the path: the curve's
 * middle is half way to it. When a figure stands on the middle square, the lift puts the curve's middle just
 * over that figure's head, so the line goes over it and clear of its neighbours.
 */
function arcControl(fromSq, toSq, x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dist = Math.hypot(x2 - x1, y2 - y1);
  if (Math.abs(x2 - x1) < 1) return [mx + dist * 0.45, my]; // along a file: bow to the side
  let lift = Math.max(60, dist * 0.25);
  const mid = midSquare(fromSq, toSq), cell = mid && board.state ? KD.board(board.state)[KD.sq.index(mid)] : null;
  if (cell) {
    const top = (board.colRow(mid).row + (figureArt(cell).box?.top ?? 0)) * 100; // the figure's head, in board units
    lift = Math.max(lift, 2 * (my - (top - 16)));
  }
  return [mx, my - lift];
}

/** A thin ink line from a cause to its effect. An arc for a shot or a jump (a piece between does not block it). */
function drawCause(fromSq, toSq, { arc = false, draw = true } = {}) {
  const a = board.colRow(fromSq), b = board.colRow(toSq), u = unit();
  const x1 = (a.col + 0.5) * 100, y1 = (a.row + 0.78) * 100;
  const x2 = (b.col + 0.5) * 100, y2 = (b.row + 0.66) * 100;
  let d, tx, ty;
  if (arc) {
    const [cx, cy] = arcControl(fromSq, toSq, x1, y1, x2, y2);
    d = `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`;
    tx = x2 - cx; ty = y2 - cy;
  } else {
    d = `M${x1} ${y1}L${x2} ${y2}`;
    tx = x2 - x1; ty = y2 - y1;
  }
  const n = Math.hypot(tx, ty) || 1, ux = tx / n, uy = ty / n, s = 7 * u;
  const head = `M${x2} ${y2}L${x2 - ux * s * 1.6 - uy * s} ${y2 - uy * s * 1.6 + ux * s}L${x2 - ux * s * 1.6 + uy * s} ${y2 - uy * s * 1.6 - ux * s}Z`;
  const g = document.createElementNS(NS, 'g');
  g.innerHTML = `<path class="halo" d="${d}" stroke-width="${5.5 * u}"/><path class="ink" d="${d}" stroke-width="${2.2 * u}"/>
    <path class="head" d="${head}" stroke-width="${1.6 * u}"/>`;
  fx.appendChild(g);
  lines.push([fromSq, toSq, { arc }]);
  // No ring at the cause: the start of the line marks it.
  if (!draw || prefersReducedMotion()) return Promise.resolve();
  const paths = [...g.querySelectorAll('.halo, .ink')], len = paths[0].getTotalLength();
  for (const p of paths) { p.style.strokeDasharray = `${len}`; p.style.strokeDashoffset = `${len}`; }
  g.querySelector('.head').style.opacity = '0';
  return Promise.all(paths.map(p => p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 280, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' }).finished))
    .then(() => { for (const p of paths) { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; p.getAnimations().forEach(x => x.cancel()); } g.querySelector('.head').style.opacity = ''; })
    .catch(() => {});
}

/** The ember ring on the king's base. It blooms once and stays still: no flash, no pulse. */
function emberRing(sq, { bloom = true } = {}) {
  const { col, row } = board.colRow(sq);
  const el = document.createElement('div');
  el.className = 'ttc-ring';
  el.style.left = `${col * 12.5}%`; el.style.top = `${row * 12.5}%`;
  el.innerHTML = `<svg viewBox="0 0 112 112"><ellipse cx="56" cy="94" rx="54" ry="19" fill="url(#ttc-ember-glow)"/>
    <ellipse cx="56" cy="94" rx="43" ry="14.5" fill="none" stroke="rgba(251,246,232,.9)" stroke-width="6"/>
    <ellipse cx="56" cy="94" rx="43" ry="14.5" fill="none" stroke="#c4501f" stroke-width="3.2"/></svg>`;
  board.layer.appendChild(el);
  overlays.push(el);
  if (!bloom) return Promise.resolve();
  return animate(el, [{ transform: 'scale(.55)', opacity: 0 }, { transform: 'scale(1.07)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }],
    { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

/** Check, made visible: the cause line draws first, then the ring blooms with one low note. */
async function showCheck(s, { motion = true, sound = true } = {}) {
  const list = checkers(s);
  if (!list.length) return;
  const ep = epoch;
  await Promise.all(list.map(ch => drawCause(ch.sq, ch.king, { arc: arcFor(ch), draw: motion })));
  if (ep !== epoch) return;
  // The note and the two short buzzes follow the Sound switch (haptic.enabled, below).
  if (sound && KD.status(s).turn === ME) { lowNote(); if (gestured) haptic([12, 70, 12]); }
  await emberRing(list[0].king, { bloom: motion });
}
const arcFor = ch => ch.cell.type === 'knight' || (ch.cell.type === 'archer' && !near(ch.sq, ch.king));
new ResizeObserver(() => {
  if (!lines.length) return;
  const keep = lines;
  fx.replaceChildren(); lines = [];
  for (const [a, b, o] of keep) drawCause(a, b, { ...o, draw: false });
}).observe(board.layer);

// ---- sound: one low note for check (the kit's tones stay for the moves) ----
let actx = null, gestured = false;
for (const t of ['pointerdown', 'keydown']) window.addEventListener(t, () => { gestured = true; }, { capture: true, once: true });
function lowNote() {
  if (sfx.muted || !gestured) return;
  try {
    actx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume().catch(() => {});
    const t = actx.currentTime, o = actx.createOscillator(), o2 = actx.createOscillator(), g = actx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(98, t + 0.7);
    o2.type = 'sine'; o2.frequency.setValueAtTime(220, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.025); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
    o.connect(g); o2.connect(g); g.connect(actx.destination);
    o.start(t); o2.start(t); o.stop(t + 1); o2.stop(t + 1);
  } catch { /* sound is a nicety */ }
}

// ---- the computer's turn: breath, ring, tell ----
const opp = $('#opp'), oppFace = $('#opp .avatar');
let longTimer = 0, breathing = false;
function setThinking(on, { long = false } = {}) {
  thinking = on;
  clearTimeout(longTimer);
  opp.classList.toggle('is-thinking', on);
  opp.classList.remove('is-long');
  if (on) {
    breathe();
    if (long) setLong();
    else longTimer = setTimeout(setLong, 1000);
  }
  $('#opp-sub').textContent = on && long ? 'Thinking' : 'Club';
}
function setLong() { if (!thinking) return; opp.classList.add('is-long'); $('#opp-sub').textContent = 'Thinking'; }
/**
 * One breath of their portrait. It always runs to its end (the end of the wait does not stop it), so the
 * portrait never jumps when their piece moves. It ends at 800 ms: with the tell on, before the fastest reply moves.
 */
function breathe() {
  if (breathing) return;
  breathing = true;
  animate(oppFace, [{ transform: 'scale(1)' }, { transform: 'scale(1.07)', offset: 0.45 }, { transform: 'scale(1)' }],
    { duration: 600, delay: 200, easing: 'ease-in-out' }).then(() => { breathing = false; });
}

let told = null;
// The tell: the chosen figure lifts and a faint light falls on its square, as when a person picks up a piece.
function tell(sq) { untell(); told = board.figure(sq); told?.classList.add('is-tell'); board.mark(sq, 'glow', { colour: '255,232,186' }); }
function untell() { told?.classList.remove('is-tell'); told = null; board.clearMarks('glow'); }

/**
 * The computer moves. lan: a scripted move (the Strike); else the real computer player chooses.
 * minThink: the shortest wait, so that a move never lands at once (the reply starts 500 ms or more after yours).
 */
async function computerTurn({ lan = null, minThink = 600 } = {}) {
  const ep = epoch, s = board.state;
  if (!s) return;
  const st = KD.status(s);
  if (st.over || st.turn !== CPU) return;
  board.busy = true;
  setThinking(true);
  render();
  const t0 = performance.now();
  const m = lan ?? await KD.think(s, { level: LEVEL, ms: 700 });
  const left = minThink - (performance.now() - t0);
  if (left > 0) await new Promise(r => setTimeout(r, left));
  if (ep !== epoch) return;
  if (!m) { setThinking(false); board.busy = false; render(); return; }
  const from = typeof m === 'string' ? KD.describe(s, m).from : m.from;
  if (tellOn) {
    tell(from);
    await new Promise(r => setTimeout(r, prefersReducedMotion() ? 320 : 240)); // the 160 ms lift, then a beat for the eye
    if (ep !== epoch) return;
  }
  setThinking(false); // the wait ends when the piece moves
  board.clearMarks('glow'); // the light stays with the square, so it goes when the piece leaves; the lift ends as it lands
  await board.playMove(m);
  if (ep !== epoch) return;
  untell();
}

// ---- after each move ----
function landed(story) {
  board.clearMarks('check'); // the board's red ring: this page draws the ember ring instead
  clearCause();
  setThinking(false);
  hideToast();
  note = null;
  const s = board.state, st = KD.status(s);
  shotCause(story);
  // The stone sound of the move; a check adds one low note when its ring blooms (showCheck).
  if (story.capturedOn.length) sfx.capture(); else if (story.powerTag && !story.check) sfx.power(); else sfx.move();
  if (story.check) void showCheck(s);
  if (story.powerTag === 'freeze' && story.again) note = 'Frozen. Now make your move.';
  render({ fresh: true });
  if (auto && !st.over && st.turn === CPU) void computerTurn();
}
/** Their take without contact (a shot, a Death Touch): the line from the cause stays until you move. */
function shotCause(story, { draw = true } = {}) {
  if (story?.side !== CPU || story.from !== story.to || !story.capturedOn.length || story.check) return;
  for (const c of story.capturedOn) void drawCause(story.from, c, { arc: story.piece === 'archer' && !near(story.from, c), draw });
}

// ---- render ----
/** Each move as a KD.describe story, with its move number (a Freeze and the move after it share one). */
function storiesOf(state) {
  const chain = [state];
  while (chain[0].history.length) chain.unshift(KD.undo(chain[0]));
  return state.history.map((h, i) => ({ ...KD.describe(chain[i], h.lan), num: KD.status(chain[i]).moveNumber }));
}
function render({ fresh = false } = {}) {
  const s = board.state;
  if (!s) return;
  const st = KD.status(s), stories = storiesOf(s), last = stories.at(-1);
  const myTurn = !st.over && st.turn === ME;
  $('#you').classList.toggle('is-turn', myTurn);
  opp.classList.toggle('is-turn', !st.over && st.turn === CPU);
  $('#you').classList.toggle('is-check', st.check && st.turn === ME);
  $('#context').classList.toggle('is-check', st.check && st.turn === ME && !st.over);

  let status, detail;
  if (st.over) {
    status = st.winner === ME ? 'You win.' : st.winner === CPU ? 'They win.' : 'Draw.';
    detail = st.reason === 'checkmate' ? 'Checkmate.' : st.reason === 'stalemate' ? 'No legal move: stalemate.' : last ? shortLine(last) : '';
  } else if (st.turn === CPU) {
    status = 'Their move';
    detail = last ? shortLine(last) : '';
  } else {
    status = st.check ? 'Check. Your move.' : 'Your move';
    const ch = st.check ? checkers(s)[0] : null;
    if (ch) detail = checkLine(ch, s, last);
    else detail = last ? shortLine(last) : 'Tap a piece to see its moves.';
  }
  if (note) detail = note;
  $('#status').textContent = status;
  const d = $('#detail');
  if (d.textContent !== detail) {
    d.textContent = detail;
    if (fresh) { d.classList.remove('is-fresh'); void d.offsetWidth; d.classList.add('is-fresh'); }
  }

  // Powers: what is left, and a spent power turns to stone.
  const theirs = KD.usesLeft(s, CPU), mine = KD.usesLeft(s, ME);
  $('#opp-left').textContent = theirs > 0 ? `${theirs} left` : 'Used';
  $('#opp-power').classList.toggle('is-used', theirs <= 0);
  $('#opp-power').setAttribute('aria-label', `Their power: Strike, ${theirs > 0 ? `${theirs} left` : 'used'}`);
  $('#you-left').textContent = mine > 0 ? `${mine} left` : 'Used';
  const fz = $('#freeze');
  fz.classList.toggle('is-used', mine <= 0);
  fz.disabled = !myTurn || mine <= 0;
  fz.setAttribute('aria-pressed', String(board.armed === 'freeze'));

  $('#hint').disabled = !myTurn;
  $('#undo').disabled = s.history.length <= BASE;
  const lastSq = last ? (last.kind === 'shoot' ? last.capturedOn[0] : last.to) : '';
  $('#moves-last').innerHTML = last ? `${pieceIcon(last.piece, last.side)}<span>${lastSq}</span>${icon('chevron')}` : '';
  const numOf = (x, i) => (i && stories[i - 1].num === x.num && stories[i - 1].side === x.side ? '' : `${x.num}${x.side === 'b' ? '…' : '.'}`);
  $('#story').innerHTML = stories.map((x, i) => `<li><span class="num">${numOf(x, i)}</span>${pieceIcon(x.piece, x.side)}<div><p>${shortLine(x)}</p>${x.check ? '<small>Check</small>' : ''}</div></li>`).reverse().join('');
}

/** Show a position at once: no motion, the check (if any) as its end frame. */
function show(s) {
  epoch++;
  untell();
  clearCause();
  setThinking(false);
  board.armed = null;
  board.setState(s);
  board.clearMarks('check');
  note = null;
  const st = KD.status(s);
  if (st.check) void showCheck(s, { motion: false, sound: false });
  else if (s.history.length) shotCause(KD.describe(KD.undo(s), s.history.at(-1).lan), { draw: false });
  if (!st.over && st.turn === CPU) board.busy = true; // no tap or drag moves their pieces
  render();
}

// ---- controls ----
$('#undo').addEventListener('click', () => {
  let s = board.state;
  if (!s || s.history.length <= BASE) return;
  do { s = KD.undo(s); } while (s.history.length > BASE && KD.status(s).turn !== ME);
  show(s);
});
$('#hint').addEventListener('click', async () => {
  const s = board.state;
  if (!s || KD.status(s).turn !== ME || board.busy) return;
  const ep = epoch;
  const m = await KD.think(s, { level: LEVEL, ms: 500 });
  if (!m || ep !== epoch || board.state !== s) return;
  board.selectSquare(m.from);
  board.mark(m.path[0] ?? m.to, 'hint');
  note = 'Hint: the gold square is a good move.';
  render({ fresh: true });
});
$('#freeze').addEventListener('click', () => {
  const s = board.state;
  if (!s || KD.status(s).turn !== ME || board.busy) return;
  if (board.armed === 'freeze') { board.arm(null); note = null; }
  else { board.arm('freeze'); note = 'Tap an enemy piece to freeze it.'; }
  render({ fresh: true });
});
$('#moves-line').addEventListener('click', () => openSheet('moves-sheet'));
$('#menu').addEventListener('click', () => openSheet('menu-sheet'));
$('#new-game').addEventListener('click', async () => { await closeSheet('menu-sheet'); auto = true; show(p1()); toast('New game: the same position.'); });
// One switch for sound and buzz: the check's low note, its two short buzzes and the board's own buzz on a take.
const soundBox = $('#sound');
const syncSound = () => { soundBox.checked = !sfx.muted; haptic.enabled = !sfx.muted; };
syncSound();
soundBox.addEventListener('change', () => sfx.setMuted(!soundBox.checked));
document.addEventListener('kd-mute', syncSound);
const tellBox = $('#tell');
tellBox.addEventListener('change', () => { tellOn = tellBox.checked; });
const setTell = on => { tellOn = on; tellBox.checked = on; };

show(p1());

// ---- the demo contract ----
function closeAll() { hideToast(); for (const id of ['moves-sheet', 'menu-sheet']) { const d = document.getElementById(id); if (d?.open) d.close(); } }

window.demo = {
  async state(name) {
    closeAll();
    auto = true;
    setTell(name !== 'tell-off');
    switch (name) {
      // Your Archer's shot has landed. Their turn: the portrait has breathed, the thin ring is drawn.
      case 'thinking': show(afterShot()); setThinking(true, { long: true }); render(); break;
      // The tell: their Archer on b6 lifts just before it moves.
      case 'tell': show(afterShot()); setThinking(true, { long: true }); render(); tell('b6'); break;
      // The tell off: no lift. The first frame the eye can catch is their Archer already in flight.
      case 'tell-off': {
        show(afterShot());
        const fig = board.figure('b6');
        void board.playMove(STRIKE); // a new state cancels it
        const flight = fig?.getAnimations() ?? [];
        for (const a of flight) { a.pause(); a.currentTime = 0.3 * a.effect.getComputedTiming().duration; }
        // The move clears the last-move mark; put a5 back, so the still is a moment in flight.
        if (flight.length) board.mark('a5', 'last');
        // Live, the frame does not stay frozen: after a moment the Archer lands and the check shows.
        const ep = epoch;
        setTimeout(() => { if (ep !== epoch) return; board.clearMarks('last'); for (const a of flight) a.play(); }, 1800);
        break;
      }
      // Strike puts their Archer on e3. The line shows the shot over f2; the ember ring is on your king.
      case 'check': {
        show(afterShot());
        await computerTurn({ lan: STRIKE, minThink: 300 });
        await wait(700, { instant: true });
        break;
      }
      // Your Beast steps away from their Ogre, and their Archer shoots it from b6 (Club's own reply here).
      // The line from b6 stays until you move: the cause of a take with no contact.
      case 'their-move': {
        show(KD.play(p1(), BEAST));
        await computerTurn({ lan: THEIR_SHOT, minThink: 300 });
        await wait(700, { instant: true });
        break;
      }
      default: throw new Error(`demo.state: no state "${name}"`);
    }
  },
  // The best moment: your shot, their wait with no spinner, the tell, then Strike and a check you can see.
  // Then you answer, and the real computer (Club) replies.
  async play() {
    closeAll();
    show(p1());
    const me = epoch;
    auto = false;
    const ok = () => me === epoch;
    await wait(900);
    if (!ok()) return;
    board.selectSquare('a3');
    await wait(1000);
    if (!ok()) return;
    await board.playMove(SHOT);
    if (!ok()) return;
    await computerTurn({ lan: STRIKE, minThink: 1700 });
    if (!ok()) return;
    await wait(3000);
    if (!ok()) return;
    board.selectSquare('f2');
    await wait(1000);
    if (!ok()) return;
    await board.playMove('f2xe3');
    if (!ok()) return;
    await computerTurn({ minThink: 900 });
    if (!ok()) return;
    auto = true;
    await wait(1200);
  },
  async reset() { closeAll(); auto = true; show(p1()); },
};
