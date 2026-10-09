// feat-help: Hint, second look and rewind.
// Hint style A: at once (selects the piece, plays a ghost of the move once, one line why). B: three steps.
// Second look (owner check): at Beginner, after a large mistake, the computer waits. Undo is a rewind: the
// moves play backward, a second press or a tap on the board ends it at once, and the button names its scope.
// The hint and the mistake check come from the real computer player (KD.think). The rules are the engine's.
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceIcon, pieceArt } from '../../kit/icons.js';
import { $, $$, toast, hideToast, openSheet, closeSheet, animate, wait, prefersReducedMotion, haptic } from '../../kit/ui.js';

// ---- the position ----------------------------------------------------------------------------
// Move 13. White's guard steps to e3, Black's knight goes to d6. Now White can shoot the knight on d6
// over the pawn on d5. The computer finds that shot every time (club and strong, checked in Node).
// The trap: the queen to d3 stands on a square that Black's archer on f5 shoots (two away on its forward diagonal).
const START = 'r1b1nrk1/1p2gppp/p7/3p1a2/3A4/2O5/PP2GPPP/R2Q1RK1 w - - 0 13';
const PRE = ['Ge2-e3', 'Ne8-d6'];
const YOU = 'w';
const playLans = (s, lans) => lans.reduce((st, lan) => KD.play(st, lan), s);
const HINT_POS = playLans(KD.fromFen(START), PRE);
const MISTAKE = 'Qd1-d3';
const SHOT = 'Af5*d3';

// The computer's worth of each piece, in pawns (src/ai/eval.ts). Used only to find a large loss.
const VAL = { pawn: 1, knight: 3.16, bishop: 3.22, rook: 4.49, queen: 9.33, archer: 5.05, beast: 4.34, paladin: 4.08, maester: 3.18, ogre: 3.18, guard: 0.96, king: 0 };
const material = s => KD.board(s).reduce((t, c) => (c ? t + (c.color === 'w' ? 1 : -1) * (VAL[c.type] ?? 0) : t), 0);
const cap = w => w[0].toUpperCase() + w.slice(1);
const NEW = new Set(['archer', 'paladin', 'guard', 'maester', 'beast', 'ogre']);
const pieceName = t => (NEW.has(t) ? cap(t) : t); // the new pieces are names: "your Archer", "your queen"
const named = text => text.replace(/\b(archer|paladin|guard|maester|beast|ogre)\b/g, cap); // the engine's lines, with the same names
const whose = c => (c.color === YOU ? 'your' : 'their');
const I = sq => KD.sq.index(sq);
const near = (a, b) => Math.max(Math.abs((I(a) & 7) - (I(b) & 7)), Math.abs((I(a) >> 3) - (I(b) >> 3))) <= 1;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- state of the help ------------------------------------------------------------------------
const settings = { style: 'direct', secondLook: true };
let hint = null;        // { key, move, story, lines, step, note }
let look = null;        // { checking: true } while the check runs, then { res, text, textAt } after a large mistake
let held = null;        // the computer's reply (a Promise): it waits behind the second look
let rewound = null;     // { lines, done }: what Undo takes back
let rw = null;          // the rewind that plays now: { target, undone, back, lines, instant }
let rewinding = false;  // the moves play backward
let epoch = 0;          // a new state, a reset or a rewind stops older async work
let live = false;       // true when a person plays (reset); false in still states and play()
let tapNote = true;     // "Tap the marked square" shows on the first hint of a game only
let lastUndoEnd = -Infinity;
let posed = null;       // a figure that a still state posed by hand
const hintCache = new Map();

// ---- the board -------------------------------------------------------------------------------
const board = createBoard($('#board'), {
  play: { level: 'beginner', human: 'both', ms: 500, pause: 450 },
  label: 'King Down board. You play White against the computer. Arrow keys move, Enter or Space chooses, Escape cancels, I reads a piece. H gives a hint, U undoes.',
  onMove(story) {
    clearHintMarks(); hint = null; clearRewound();
    if (live && story.side === YOU && !KD.status(board.state).over) void computerTurn();
    render();
  },
  onSelect(sq) {
    // The player picked another piece or tapped away: the hint steps aside.
    if (hint && sq !== hint.move.from) { clearHintMarks(); hint = null; render(); }
  },
  onTap(sq, cell) {
    if (rewinding) { skipRewind(); return false; }               // a tap ends the rewind at once
    if (look) { if (cell) readPiece(sq, cell); return false; }  // reading a piece never plays a move
    if (rewound?.done) { clearRewound(); render(); }
  },
  onInspect: (sq, cell) => readPiece(sq, cell),
});
const PLAY = board.play;
/** Hold the board: no move from a tap or a drag, and no computer of its own. The demo runs the computer's turn. */
const hold = on => { board.play = on ? null : PLAY; };
$('#opp-art').src = pieceArt('king', 'b');
$('#you-art').src = pieceArt('king', 'w');

function readPiece(sq, cell) {
  if (look?.res && sq === look.res.reply.from) toast(look.textAt);
  else toast(`${cap(whose(cell))} ${pieceName(cell.type)} on ${sq}.`);
}

// ---- overlays: ghost lines, cause lines and rewind trails, in board units (one square = 100) ----
const NS = 'http://www.w3.org/2000/svg';
let fx = null, lineId = 0;
function fxLayer() {
  if (fx?.isConnected) return fx;
  fx = document.createElementNS(NS, 'svg');
  fx.setAttribute('class', 'fh-fx');
  fx.setAttribute('viewBox', '0 0 800 800');
  fx.setAttribute('preserveAspectRatio', 'none');
  fx.setAttribute('aria-hidden', 'true');
  fx.innerHTML = `<defs>
    <marker id="fh-head-gold" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.6" markerHeight="3.6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#7a5712" stroke="rgba(251,246,232,.9)" stroke-width="1.2"/></marker>
    <marker id="fh-head-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.6" markerHeight="3.6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#b0251b" stroke="rgba(251,246,232,.9)" stroke-width="1.2"/></marker>
  </defs>`;
  board.layer.appendChild(fx);
  return fx;
}
const centre = (sq, dy = 0.5) => { const { col, row } = board.colRow(sq); return [(col + 0.5) * 100, (row + dy) * 100]; };

/** A dashed line with a halo and an arrowhead, from square to square. It draws once, then rests. */
async function drawLine(fromSq, toSq, { kind, tone = 'gold', dyFrom = 0.42, dyTo = 0.5, grow = true, trim = 30 } = {}) {
  const layer = fxLayer();
  let [x1, y1] = centre(fromSq, dyFrom), [x2, y2] = centre(toSq, dyTo);
  const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  x1 += ux * 22; y1 += uy * 22; x2 -= ux * trim; y2 -= uy * trim;  // leave the figures clear
  const colour = tone === 'red' ? '#b0251b' : '#7a5712', id = `fh-m${++lineId}`;
  const d = `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
  const g = document.createElementNS(NS, 'g');
  g.dataset.kind = kind;
  grow = grow && !prefersReducedMotion();
  g.innerHTML = `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="800"><path d="${d}" stroke="#fff" stroke-width="40" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${grow ? 1 : 0}" fill="none"/></mask>
    <g mask="url(#${id})">
      <path d="${d}" fill="none" stroke="rgba(251,246,232,.88)" stroke-width="9" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="${colour}" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="13 9" marker-end="url(#fh-head-${tone})"/>
    </g>`;
  layer.appendChild(g);
  if (grow) {
    const m = g.querySelector('mask path');
    await m.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }).finished.catch(() => {});
    m.setAttribute('stroke-dashoffset', '0');
  }
  return g;
}
function clearFx(kind) { if (fx) for (const g of [...fx.querySelectorAll(':scope > g')]) if (!kind || g.dataset.kind === kind) g.remove(); }

/** A see-through copy of a figure plays the move once, then rests faint on the target. */
async function ghostSlide(move) {
  const src = board.figure(move.from);
  if (!src) return;
  const g = src.cloneNode(true);
  g.classList.remove('is-selected');
  g.classList.add('fh-ghost');
  g.dataset.kind = 'ghost';
  const stops = [move.from, ...move.path.filter((sq, i) => i < move.path.length - 1 || sq !== move.to), move.to]
    .filter((sq, i, a) => i === 0 || sq !== a[i - 1]);
  const at = sq => board.colRow(sq);
  const put = sq => { const { col, row } = at(sq); g.style.left = `${col * 12.5}%`; g.style.top = `${row * 12.5}%`; g.style.zIndex = String(11 + row * 3); };
  put(move.from);
  board.layer.appendChild(g);
  ghosts.push(g);
  if (prefersReducedMotion()) { put(move.to); return; }
  const a = at(move.from);
  const frames = stops.map(sq => { const b = at(sq); return { transform: `translate(${(b.col - a.col) * 100}%, ${(b.row - a.row) * 100}%)` }; });
  await g.animate(frames, { duration: 260 + 140 * (stops.length - 1), easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' }).finished.catch(() => {});
  if (!g.isConnected) return;
  g.getAnimations().forEach(x => x.cancel());
  put(move.to);
}
const ghosts = [];
function clearGhosts() { while (ghosts.length) ghosts.pop().remove(); }

// ---- the hint ---------------------------------------------------------------------------------
const keyOf = s => KD.toFen(s) + '|' + s.history.length;

/** The real computer's move for the side to move, and its lines. Only engine facts, never a guess at a plan. */
async function findHint(s) {
  const key = keyOf(s);
  if (hintCache.has(key)) return hintCache.get(key);
  const move = await KD.think(s, { level: 'club', ms: 400 });
  if (!move) return null;
  const h = { key, move, story: KD.describe(s, move.lan), lines: hintLines(s, move) };
  hintCache.set(key, h);
  return h;
}

/** The rule behind a special move, in the present tense (king-down-facts.md section 2). */
function ruleLine(st, cells) {
  if (st.kind === 'shoot') {
    const f = I(st.from), t = I(st.capturedOn[0]);
    const df = (t & 7) - (f & 7), dr = (t >> 3) - (f >> 3);
    if (Math.max(Math.abs(df), Math.abs(dr)) === 2 && df % 2 === 0 && dr % 2 === 0) {
      const mid = KD.sq.name(f + (dr / 2) * 8 + df / 2), m = cells[I(mid)];
      if (m) return `She shoots over the ${pieceName(m.type)} on ${mid}.`;
    }
    return 'She shoots without moving.';
  }
  if (st.kind === 'chain') return 'After each bite, it can bite again.';
  if (st.kind === 'push') return 'It shoves a neighbour and steps in.';
  if (st.kind === 'swap') return near(st.from, st.to) ? 'It swaps places with a friend beside it.' : 'Maester and king swap on the first rank.';
  return null;
}

function hintLines(s, move) {
  const st = KD.describe(s, move.lan), after = st.next, cells = KD.board(s);
  const piece = pieceName(st.piece);
  const victim = st.captured[0] ? pieceName(st.captured[0]) : '';
  const pushed = st.push ? cells[I(st.push.from)] : null;
  const action = {
    shoot: () => `shoot the ${victim} on ${st.capturedOn[0]}`,
    chain: () => `bite the ${victim} on ${st.capturedOn[0]}, then ${st.capturedOn.slice(1).join(', then ')}`,
    capture: () => `take the ${victim} on ${st.capturedOn[0]}`,
    push: () => `shove ${whose(pushed)} ${pieceName(pushed.type)} to ${st.push.to}`,
    swap: () => `swap with your ${pieceName(st.swap.with)} on ${st.to}`,
    promote: () => `promote to a ${st.promo} on ${st.to}`,
    power: () => `use ${st.power}`,
  }[st.kind]?.() ?? `move to ${st.to}`;
  const home = st.kind === 'shoot' ? st.from : st.to;
  const safe = !KD.legal(after).some(m => m.captures.includes(home));
  const wasHit = KD.threats(s).pieces.includes(st.from);
  const rule = ruleLine(st, cells);
  // One true reason, from engine facts only. Never the app's past-tense caption.
  let reason;
  if (st.mate) reason = 'It is checkmate.';
  else if (st.check) reason = 'It gives check.';
  else if (victim && st.leaves) reason = `Then your ${piece} leaves the board.`;
  else if (victim && safe) reason = `Nothing can take your ${piece} back.`;
  else if (victim) reason = `A trade: they can take your ${piece} back.`;
  else if (wasHit && safe) reason = `Your ${piece} gets out of danger.`;
  else reason = rule ?? 'The computer likes this move best.';
  return { head: `${cap(piece)}: ${action}.`, reason, rule: rule === reason ? null : rule, piece };
}

/** Show the hint up to a step: 1 the piece, 2 the move (a ghost, once), 3 the reason. Direct shows all three. */
async function showHint(step) {
  const s = board.state;
  if (!s || KD.status(s).over || KD.status(s).turn !== YOU) return;
  const me = epoch;
  const h = hint ?? await findHint(s);
  if (!h || me !== epoch || board.state !== s) return;
  const before = hint?.step ?? 0;
  if (before >= step) return;
  hint = { ...h, step, note: hint ? hint.note : tapNote };
  if (before === 0) tapNote = false;
  clearRewound();
  if (before === 0) { clearHintMarks(); board.select(h.move.from); }
  if (step === 1 && settings.style === 'ladder') board.mark(h.move.from, 'hint');
  render();
  if (step >= 2 && before < 2) {
    board.showTargets([h.move]);
    if (h.move.kind === 'shoot') await drawLine(h.move.from, h.move.captures[0], { kind: 'ghost', dyFrom: 0.38, dyTo: 0.42 });
    else await ghostSlide(h.move);
  }
}
function clearHintMarks() { clearGhosts(); clearFx('ghost'); board.clearMarks('hint'); board.clearSelection(false); }

// ---- the computer's turn and the second look ------------------------------------------------------
/** After your move: the real computer looks two moves on. A loss of 3 pawns or more is a large mistake. */
async function largeMistake(before, after) {
  if (KD.status(after).over) return null;
  const reply = await KD.think(after, { level: 'club', ms: 300 });
  if (!reply) return null;
  const s2 = KD.play(after, reply), st2 = KD.status(s2);
  if (st2.over && st2.winner && st2.winner !== YOU) return { reply, mate: true };
  if (!reply.captures.length) return null;
  let s3 = s2;
  if (!st2.over) { const ans = await KD.think(s2, { level: 'club', ms: 300 }); if (ans) s3 = KD.play(s2, ans); }
  const loss = (material(before) - material(s3)) * (YOU === 'w' ? 1 : -1);
  return loss >= 3 ? { reply, loss } : null;
}

/**
 * The computer's turn in a live game. The board holds still. The mistake check runs in the computer's pause,
 * beside its own think, so a move with no mistake waits no longer. After a large mistake only the reply waits.
 */
async function computerTurn() {
  const me = epoch, s = board.state;
  hold(true);
  const checkOn = settings.secondLook && PLAY.level === 'beginner';
  look = checkOn ? { checking: true } : null;
  const check = checkOn ? largeMistake(KD.undo(s), s) : null;
  const reply = sleep(PLAY.pause).then(() => (me === epoch ? KD.think(s, { level: PLAY.level, ms: PLAY.ms }) : null));
  if (check) {
    const res = await check;
    if (me !== epoch) return;
    if (res) { held = reply; showLook(res); return; }
    look = null;
    render();
  }
  await playReply(reply, me);
}
async function playReply(reply, me) {
  const m = await reply;
  if (me !== epoch) return;
  hold(false);
  if (m) await board.playMove(m);
}

function showLook(res) {
  const st = KD.describe(board.state, res.reply.lan);
  look = { res, text: lookText(st, res), textAt: lookText(st, res, true) };
  hold(true);
  const r = res.reply, target = r.captures[0] ?? KD.board(board.state).find(c => c && c.type === 'king' && c.color === YOU)?.sq;
  // The cause and the place, nothing more: a red line from their piece, and the target on yours.
  board.mark(target, 'threat');
  if (r.kind === 'shoot') board.mark(target, 'shot');
  void drawLine(r.from, target, { kind: 'cause', tone: 'red', dyFrom: 0.4, dyTo: 0.45 });
  const from = document.activeElement;
  render({ lookIn: true });
  if (from === board.el || from?.closest?.('.bar')) $('#take-back')?.focus({ preventScroll: true });
}
function clearLook() { look = null; held = null; clearFx('cause'); board.clearMarks('threat'); board.clearMarks('shot'); }

function lookText(st, res, at = false) {
  const who = `Their ${pieceName(st.piece)}${at ? ` on ${st.from}` : ''}`;
  if (res.mate) return `${who} can give checkmate.`;
  const verb = st.kind === 'shoot' ? 'shoot' : st.kind === 'chain' ? 'bite' : 'take';
  return `${who} can ${verb} your ${pieceName(st.captured[0])}.`;
}

/** Keep it: the computer plays the reply it found while the look showed. */
function keepIt() {
  const me = epoch, reply = held ?? KD.think(board.state, { level: PLAY.level, ms: PLAY.ms });
  live = true; PLAY.human = YOU;
  clearLook();
  render();
  void playReply(reply, me);
}

// ---- Undo as a rewind ---------------------------------------------------------------------------
/** What Undo takes back from a state: on your turn your move and the reply; while the computer waits, your move. */
function undoPlan(s = board.state) {
  if (!s?.history.length) return { plies: 0, scope: 'nothing yet' };
  const st = KD.status(s);
  const lastBy = KD.undo(s).pos.turn === 0 ? 'w' : 'b';
  if (st.over) return lastBy === YOU ? { plies: 1, scope: 'your move' } : { plies: Math.min(2, s.history.length), scope: 'your move and the reply' };
  if (st.turn === YOU) return s.history.length >= 2 ? { plies: 2, scope: 'your move and the reply' } : { plies: 1, scope: 'their move' };
  return { plies: 1, scope: 'your move' };
}

/** The whole rewind, worked out before it plays: the moves, the end state, and what comes back. */
function planRewind(s0, plies, why) {
  const undone = [], states = [s0];
  for (let s = s0; undone.length < plies && s.history.length;) { const prev = KD.undo(s); undone.push(KD.describe(prev, s.history.at(-1).lan)); states.push(prev); s = prev; }
  const target = states.at(-1), start = KD.board(s0);
  const back = KD.board(target).filter((c, i) => c && (!start[i] || start[i].type !== c.type || start[i].color !== c.color));
  return { target, states, undone, back, lines: rewindLines(undone, back, why), instant: false };
}

/** One move plays backward: the piece goes home, a shot flies back, a taken piece rises again. */
async function reverseOne(st, prev, me) {
  const figs = board.figs;   // the board's square -> figure map: kept true so no figure is drawn twice
  if (st.kind === 'shoot') {
    const g = await drawLine(st.capturedOn[0], st.from, { kind: 'trail-tmp', dyFrom: 0.42, dyTo: 0.38 });
    if (me !== epoch) return;
    g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' }).finished.then(() => g.remove(), () => {});
  } else if (st.kind === 'swap') {
    const a = board.figure(st.to), b = board.figure(st.from);
    await Promise.all([board.slide(a, st.to, st.from), board.slide(b, st.from, st.to)]);
    if (me !== epoch) return;
    figs.set(I(st.from), a); figs.set(I(st.to), b);
  } else if (st.push) {
    const ogre = board.figure(st.to), pushed = board.figure(st.push.to);
    await Promise.all([board.slide(pushed, st.push.to, st.push.from, { lift: 0, dur: 260 }), st.from !== st.to ? board.slide(ogre, st.to, st.from, { dur: 260 }) : null]);
    if (me !== epoch) return;
    figs.delete(I(st.to)); figs.delete(I(st.push.to));
    if (ogre) figs.set(I(st.from), ogre);
    if (pushed) figs.set(I(st.push.from), pushed);
  } else if (st.from !== st.to && st.kind !== 'drop' && st.kind !== 'pass') {
    const el = board.figure(st.to);
    const stops = [st.to, ...st.capturedOn.filter(sq => sq !== st.to).reverse(), st.from];
    for (let i = 1; i < stops.length; i++) {
      await board.slide(el, stops[i - 1], stops[i], { dur: i === stops.length - 1 ? 300 : 200 });
      if (me !== epoch) return;
    }
    const at = figs.get(I(st.to));
    figs.delete(I(st.to));
    if (at) figs.set(I(st.from), at);
  }
  board.setState(prev);
  // A taken piece comes back: it rises where it stood.
  const risen = st.capturedOn.map(sq => board.figure(sq)).filter(Boolean);
  await Promise.all(risen.map(el => animate(el, [{ opacity: 0, transform: 'translateY(9%) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' })));
  for (const el of risen) { el.style.opacity = ''; el.style.transform = ''; }
}

async function rewind(plies, { why = 'undo', instant = false } = {}) {
  const s0 = board.state;
  if (!s0 || !plies) return;
  const me = ++epoch;
  clearHintMarks(); hint = null; clearLook(); clearRewound();
  hold(true);
  const r = rw = planRewind(s0, plies, why);
  r.instant = instant || prefersReducedMotion();
  rewound = { lines: r.lines, done: false };
  if (!r.instant) {
    rewinding = true;
    render();
    for (let i = 0; i < r.undone.length; i++) {
      await reverseOne(r.undone[i], r.states[i + 1], me);
      if (me !== epoch) return;
    }
  }
  endRewind(r);
}

/** The end frame of a rewind: the position, a soft glow on what came back (it fades), a trail home, one line. */
function endRewind(r) {
  rewinding = false; rw = null;
  clearFx('trail-tmp');
  if (board.state !== r.target) board.setState(r.target);
  for (const c of r.back) { const el = board.figure(c.sq); if (el) { el.style.opacity = ''; el.style.transform = ''; } }
  hold(false);
  PLAY.human = live ? YOU : 'both';
  board.mark(r.back.map(c => c.sq), 'glow', { colour: '226,158,52', pop: !r.instant });
  for (const st of r.undone) if (st.from !== st.to && ['move', 'capture', 'chain', 'promote'].includes(st.kind)) void drawLine(st.to, st.from, { kind: 'trail', dyFrom: 0.55, dyTo: 0.55, trim: 52, grow: !r.instant });
  fadeReturned();
  haptic(10);
  lastUndoEnd = performance.now();
  rewound = { lines: r.lines, done: true };
  render();
  if (live) void board.maybeAi();   // only when the computer is to move
}

/** A second Undo or a tap on the board: the rewind that plays ends at once. */
function skipRewind() {
  if (!rewinding || !rw) return;
  const r = rw;
  ++epoch;
  endRewind(r);
}

/** The "came back" glow fades after about 1 s. With reduced motion it stays until the next action. */
let fadeTimer = 0;
function fadeReturned() {
  clearTimeout(fadeTimer);
  if (prefersReducedMotion()) return;
  const me = epoch;
  fadeTimer = setTimeout(async () => {
    if (me !== epoch) return;
    const glows = [...board.el.querySelectorAll('.kdb-m-glow')].filter(el => [...el.classList].every(c => ['kdb-m', 'kdb-m-glow', 'pop'].includes(c)));
    await Promise.all(glows.map(el => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-out', fill: 'forwards' }).finished.catch(() => {})));
    if (me === epoch) board.clearMarks('glow');
  }, 1000);
}

function rewindLines(undone, back, why) {
  const part = st => {
    const who = st.side === YOU ? 'your' : 'their';
    if (st.kind === 'shoot') return `${who} shot`;
    if (st.kind === 'chain') return `${who} bites`;
    if (st.kind === 'capture') return `${who} take`;
    return `${who} ${pieceName(st.piece)} move`;
  };
  const head = why === 'look' ? 'Taken back. Your move again.' : `Undone: ${undone.slice().reverse().map(part).join(' and ')}.`;
  // Name one piece that came back: a taken piece first, yours before theirs.
  const taken = new Set(undone.flatMap(st => st.capturedOn));
  const rank = c => (taken.has(c.sq) ? 0 : 2) + (c.color === YOU ? 0 : 1);
  const c = back.slice().sort((a, b) => rank(a) - rank(b))[0];
  const sub = c ? `${cap(whose(c))} ${pieceName(c.type)} is back on ${c.sq}.` : '';
  return { head, sub };
}
function clearRewound() { rewound = null; clearTimeout(fadeTimer); clearFx('trail'); board.clearMarks('glow'); }

// ---- rendering ----------------------------------------------------------------------------------
function lastLine() {
  const s = board.state;
  const h = s?.history.at(-1);
  if (!h) return '<div class="line"><p class="quiet">Tap a piece to see its moves.</p></div>';
  const st = KD.describe(KD.undo(s), h.lan);
  return `<div class="line">${pieceIcon(st.piece, st.side)}<p class="quiet">${named(st.text)}</p></div>`;
}

let ctxHtml = '';
function render({ lookIn = false } = {}) {
  const s = board.state, st = s ? KD.status(s) : null;
  const yourTurn = st && !st.over && st.turn === YOU && !rewinding;
  // nameplates
  const opp = $('#opp-turn'), you = $('#you-turn');
  opp.className = 'turn'; you.className = 'turn';
  opp.textContent = ''; you.textContent = '';
  if (rewinding) { /* the moves play backward: no turn */ }
  else if (st?.over) you.textContent = st.text;
  else if (look?.res) { opp.textContent = 'Waits for you'; opp.classList.add('is-waiting'); }
  else if (yourTurn) { you.textContent = 'Your move'; you.classList.add('is-you'); }
  else if (st) opp.textContent = 'Thinks…';

  // the context area: one task at a time
  let html;
  if (look?.res) {
    html = `<div class="look${lookIn ? ' is-in' : ''}" role="group" aria-labelledby="look-t">
      <div class="line"><span class="badge back">${icon('eye')}</span><div><p class="lead" id="look-t">${look.text}</p></div></div>
      <div class="ctx-do"><button type="button" class="btn btn-primary" id="take-back">Take it back</button><button type="button" class="btn btn-quiet" id="keep-it">Keep it</button></div>
    </div>`;
  } else if (hint) {
    const L = hint.lines, ladder = settings.style === 'ladder', step = ladder ? hint.step : 3;
    const rungs = ladder ? `<p class="rungs">${[1, 2, 3].map(i => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}<span>Hint ${step} of 3</span></p>` : '';
    let head = L.head, sub = L.reason, next = '';
    if (ladder && step === 1) { head = `Look at your ${L.piece}.`; sub = 'It has a good move.'; next = 'Show the move'; }
    if (ladder && step === 2) { sub = ''; next = 'Why this move?'; }
    const rule = ladder && step === 3 && L.rule ? `<p class="rule">${pieceIcon(hint.story.piece, YOU)}<span>${L.rule}</span></p>` : '';
    const note = !next && hint.note ? '<p class="tapnote">Tap the marked square to play it.</p>' : '';
    html = `${rungs}<div class="line"><span class="badge">${icon('hint')}</span><div><p class="lead">${head}</p>${sub ? `<p class="sub">${sub}</p>` : ''}</div></div>${rule}
      ${next ? `<div class="ctx-do"><button type="button" class="btn btn-quiet" id="next-rung">${next}</button></div>` : note}`;
  } else if (rewound) {
    const sub = rewound.done ? rewound.lines.sub : '';
    html = `<div class="line"><span class="badge back">${icon('undo')}</span><div><p class="lead">${rewound.lines.head}</p>${sub ? `<p class="sub">${sub}</p>` : ''}</div></div>`;
  } else {
    html = lastLine();
  }
  const ctx = $('#ctx');
  if (html !== ctxHtml) {
    // Keep the keyboard's place: the same control if it is still there, else the next sensible one.
    const had = ctx.contains(document.activeElement) ? document.activeElement.id : '';
    ctx.innerHTML = ctxHtml = html;
    if (had) {
      const same = document.getElementById(had);
      if (same && ctx.contains(same)) same.focus({ preventScroll: true });
      else if (had === 'next-rung') $('#hint').focus({ preventScroll: true });   // the ladder ends
      else board.el.focus({ preventScroll: true });                               // Keep it, Take it back
    }
  }

  // the bar: one fixed name for Hint (a toggle), and Undo says what it undoes
  const hb = $('#hint'), ub = $('#undo');
  hb.setAttribute('aria-pressed', String(!!hint));
  hb.disabled = rewinding || !yourTurn || !!look;
  const plan = undoPlan(rw ? rw.target : s);
  ub.innerHTML = `${icon('undo')}<span>Undo</span> <span class="scope">${plan.scope}</span>`;
  ub.disabled = !plan.plies;
  if (!plan.plies) ub.title = 'No move to undo yet.'; else ub.removeAttribute('title');
}

// ---- controls -----------------------------------------------------------------------------------
$('#hint').innerHTML = `${icon('hint')}<span>Hint</span>`;
$('#menu').innerHTML = `${icon('menu')}<span>Menu</span>`;
$('#menu-sheet [data-close]').innerHTML = icon('close');
$('#restart').innerHTML = `${icon('back')}<span>Start this position again</span>`;

/** Hint is a toggle: the first press shows the hint (all of it, or step 1 of the ladder), the next one hides it. */
function onHint() {
  if ($('#hint').disabled) return;
  if (hint) { clearHintMarks(); hint = null; render(); return; }
  return showHint(settings.style === 'direct' ? 3 : 1);
}
/** Undo. A press while a rewind plays, or soon after one, ends it at once and shows the next end frame at once. */
async function onUndo() {
  if ($('#undo').disabled) return;
  const quick = rewinding || performance.now() - lastUndoEnd < 1500;
  skipRewind();
  const plan = undoPlan();
  if (!plan.plies) return;
  await rewind(plan.plies, { why: look?.res ? 'look' : 'undo', instant: quick });
}
$('#hint').addEventListener('click', onHint);
$('#undo').addEventListener('click', onUndo);
$('#menu').addEventListener('click', () => openSheet('menu-sheet'));
$('#ctx').addEventListener('click', e => {
  const id = e.target.closest('button')?.id;
  if (id === 'next-rung' && hint) void showHint(hint.step + 1);
  else if (id === 'take-back') { run++; void rewind(1, { why: 'look' }); }
  else if (id === 'keep-it') { run++; keepIt(); }
});
for (const chip of $$('[data-style]')) chip.addEventListener('click', () => {
  settings.style = chip.dataset.style;
  for (const c of $$('[data-style]')) c.setAttribute('aria-pressed', String(c === chip));
  if (hint) { clearHintMarks(); hint = null; }
  render();
});
$('#look-toggle').addEventListener('change', e => { settings.secondLook = e.target.checked; });
$('#restart').addEventListener('click', async () => { await closeSheet('menu-sheet'); window.demo.reset(); });
// Letter keys work only inside the game: on the board, the bar or the help area (WCAG 2.1.4).
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
  if (!e.target.closest?.('#board, .bar, #ctx')) return;
  if (e.key === 'h' || e.key === 'H') { e.preventDefault(); onHint(); }
  else if (e.key === 'u' || e.key === 'U') { e.preventDefault(); onUndo(); }
});

// ---- the demo contract --------------------------------------------------------------------------
function fresh(s, { human = 'both' } = {}) {
  ++epoch; rewinding = false; rw = null; held = null; tapNote = true; lastUndoEnd = -Infinity;
  hideToast();
  if (posed) { posed.style.opacity = ''; posed.style.transform = ''; posed = null; }
  board.play = PLAY; PLAY.human = 'both';
  clearHintMarks(); hint = null; clearLook(); clearRewound(); clearFx();
  board.setState(s);
  PLAY.human = human;
  render();
}
function setStyle(style) {
  settings.style = style;
  for (const c of $$('[data-style]')) c.setAttribute('aria-pressed', String(c.dataset.style === style));
}
async function press(id, ms = 160) {
  const b = $(id);
  if (!b) return;
  b.classList.add('is-pressing');
  await wait(ms, { instant: true });
  b.classList.remove('is-pressing');
}
async function lookAfter(before) {
  look = { checking: true }; hold(true); render();
  const res = await largeMistake(before, board.state);
  return res;
}

let run = 0;
window.demo = {
  async state(name) {
    run++; live = false;
    await closeSheet('menu-sheet');
    setStyle(name.startsWith('ladder') ? 'ladder' : 'direct');
    switch (name) {
      case 'hint': fresh(HINT_POS); await showHint(3); break;
      case 'ladder-1': fresh(HINT_POS); await showHint(1); break;
      case 'ladder-3': fresh(HINT_POS); await showHint(1); await showHint(2); await showHint(3); break;
      case 'second-look': {
        fresh(KD.play(HINT_POS, MISTAKE));
        const res = await lookAfter(HINT_POS);
        if (res) showLook(res);
        break;
      }
      case 'rewind-mid': {
        // The rewind, stopped half-way: the shot flies back to f5, and the queen rises again on d3.
        const s0 = playLans(HINT_POS, [MISTAKE, SHOT]);
        fresh(s0);
        hold(true);
        rw = planRewind(s0, 2, 'undo');
        rewound = { lines: rw.lines, done: false };
        rewinding = true;
        board.setState(rw.states[1]);
        const g = await drawLine('d3', 'f5', { kind: 'trail-tmp', grow: false, dyFrom: 0.42, dyTo: 0.38 });
        g.style.opacity = '0.6';
        posed = board.figure('d3');
        Object.assign(posed.style, { opacity: '0.6', transform: 'translateY(4%) scale(.95)' });
        render();
        break;
      }
      case 'rewind': fresh(playLans(HINT_POS, [MISTAKE, SHOT])); await wait(200, { instant: true }); await rewind(2); break;
      default: throw new Error(`demo.state: no state "${name}"`);
    }
  },
  // The story: a hint, a mistake that gets a second look, the take-back, the hinted shot, then Undo rewinds it.
  async play() {
    const me = ++run; live = false;
    await closeSheet('menu-sheet');
    setStyle('direct');
    fresh(HINT_POS);
    const go = () => me === run;
    await wait(800, { instant: true }); if (!go()) return;
    await press('#hint'); await showHint(3); if (!go()) return;
    await wait(2000, { instant: true }); if (!go()) return;
    await press('#hint'); clearHintMarks(); hint = null; render();
    await wait(500, { instant: true }); if (!go()) return;
    // The player plays something else: the queen to d3.
    await board.playMove(MISTAKE); if (!go()) return;
    const res = await lookAfter(KD.undo(board.state)); if (!go()) return;
    if (res) showLook(res);
    await wait(2400, { instant: true }); if (!go()) return;
    await press('#take-back', 200); if (!go()) return;
    await rewind(1, { why: 'look' }); if (!go()) return;
    await wait(1500, { instant: true }); if (!go()) return;
    // Now the hinted shot, and the computer's reply.
    await press('#hint'); await showHint(3); if (!go()) return;
    await wait(1100, { instant: true }); if (!go()) return;
    await board.playMove('Ad4*d6'); if (!go()) return;
    await wait(500, { instant: true }); if (!go()) return;
    await board.playMove('Af5-g4'); if (!go()) return;
    await wait(1200, { instant: true }); if (!go()) return;
    await press('#undo', 200); if (!go()) return;
    await rewind(2); if (!go()) return;
    await wait(2000, { instant: true }); if (!go()) return;
    live = true; hold(false); PLAY.human = YOU; render();
  },
  async reset() {
    run++; live = true;
    await closeSheet('menu-sheet');
    fresh(HINT_POS, { human: YOU });
  },
};

void window.demo.reset();
