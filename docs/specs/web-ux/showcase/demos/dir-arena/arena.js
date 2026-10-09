// Arena: two kings meet. Frost (you, White) below, Flame (the computer, Black) above.
// The one strong beat: Flame's coin flips, the Strike card shows, the Archer travels, your king flinches.
// Positions: P1, the scripted line and P2 from research/idea-bank.md section 6.1 (checked with the kit's engine).
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceArt, pieceIcon, emblemArt } from '../../kit/icons.js';
import { $, $$, sfx, haptic as kitHaptic, wait, openSheet, closeSheet, hideToast, toast, prefersReducedMotion } from '../../kit/ui.js';

// A vibration only after the person has touched the page (the browser blocks it before).
const haptic = p => { if (navigator.userActivation?.hasBeenActive) kitHaptic(p); };

// ---- positions ----
const POWERS = ['Frost:Freeze', 'Flame:Strike'];
// Five plies before P1, so the tray holds a real story: Black's Ogre, your Archer, their Guard, your Beast, their pawn.
const PRE = 'r1b2mk1/2p1p1pp/1a2o3/ppg5/8/1AOP1S2/PP1G1PPP/R1B2MK1 b - - 0 9';
const PRE_LINE = ['Oe6-d5', 'Ab3-a3', 'Gc5-c4', 'Sf3-e4', 'e7-e6'];
// P2, later in the same game: Flame's Strike is spent (the engine's FEN field u0.1).
const P2 = 'r1b3rk/2p4p/4p3/pp2A3/2g5/2OP4/PP1G1PPP/R1B2MK1 w - - 0 24 u0.1 0';
const SHOT = 'Aa3*a5', STRIKE = 'Ab6-e3!', MATE = 'Ae5-f6';
const playLans = (s, lans) => lans.reduce((st, lan) => KD.play(st, lan), s);
const p1 = () => playLans(KD.fromFen(PRE, { powers: POWERS }), PRE_LINE);
const LEVEL = 'club';

// ---- words: every line in play has eight words or fewer ----
const cap = w => w[0].toUpperCase() + w.slice(1);
const WHO = side => (side === 'w' ? 'Your' : 'Their');
const PIECE_CARD = {
  archer: ['Shoots without moving, even over other pieces.', 'Steps one square. Never takes by moving.'],
  guard: ['Only a king can take it.', 'Steps one square. It never takes.'],
  maester: ['Swaps places with a friend next to it.', 'Steps one square. Takes an enemy next to it.'],
  beast: ['After each bite, it can bite again.', 'Steps one square. Takes an enemy next to it.'],
  ogre: ['Shoves a neighbour and steps into its place.', 'Steps and takes one square in any direction.'],
  paladin: ['Jumps its own pieces.', 'Taking more than a pawn costs it.'],
  pawn: ['Steps forward. Takes one square diagonally forward.', 'Becomes a queen, rook, bishop or knight.'],
  knight: ['Jumps in an L shape.', 'It jumps over other pieces.'],
  bishop: ['Slides on its diagonals.', 'Other pieces block it.'],
  rook: ['Slides along ranks and files.', 'Other pieces block it.'],
  queen: ['Slides in all eight directions.', 'Other pieces block it.'],
};
const POWER_CARD = {
  w: { king: 'Frost', power: 'Freeze', emblem: 'frost', rule: 'Freeze an enemy piece for one turn.', more: 'Then make your move. Not the king. One use a game.' },
  b: { king: 'Flame', power: 'Strike', emblem: 'flame', rule: 'Move a piece like a queen, once.', more: 'Not a pawn or the king. Only to an empty square.' },
};
// A verb mark only for a special move: a plain step has none, so a special move stands out in the tray.
const VERB = { capture: 'swords', chain: 'swords', shoot: 'target', push: 'chevron', swap: 'flip', power: 'bolt', promote: 'crown', drop: 'plus', pass: 'clock' };
const verbOf = st => (st.powerTag ? 'bolt' : VERB[st.kind]);
/** The painted figure for a move: the Frost emblem for a Freeze, else the piece that moved. */
const artOf = st => (st.powerTag === 'freeze' ? emblemArt('frost')
  : pieceArt(st.piece, st.side, st.piece === 'king' ? (st.side === 'w' ? 'frost' : 'flame') : undefined));

/** A short line for a tile: "Their pawn to e6", "Your Archer shoots a5". */
function shortLine(st) {
  const p = st.piece === 'pawn' ? 'pawn' : cap(st.piece);
  let line;
  if (st.powerTag === 'freeze') line = `You freeze their ${cap(st.piece)}`;
  else if (st.kind === 'shoot') line = `${WHO(st.side)} ${p} shoots ${st.capturedOn[0]}`;
  else if (st.kind === 'chain') line = `${WHO(st.side)} ${p} bites ×${st.capturedOn.length}`;
  else if (st.kind === 'push') line = `${WHO(st.side)} ${p} shoves to ${st.push.to}`;
  else if (st.kind === 'swap') line = `${WHO(st.side)} ${p} swaps`;
  else if (st.capturedOn.length) line = `${WHO(st.side)} ${p} takes ${st.capturedOn[0]}`;
  else line = `${WHO(st.side)} ${p} to ${st.to}`;
  if (st.powerTag && st.powerTag !== 'freeze') line += ` · ${st.power}`;
  return line;
}
/** "Check: their Archer shoots over f2." for a shot over a piece; else "Check: their Archer." */
function checkLine(st, after) {
  const by = `their ${cap(st.piece)}`;
  if (st.piece === 'archer' && st.to && st.checkSq) {
    const [f1, r1] = [st.to.charCodeAt(0), +st.to[1]], [f2, r2] = [st.checkSq.charCodeAt(0), +st.checkSq[1]];
    if (Math.abs(f1 - f2) % 2 === 0 && Math.abs(r1 - r2) % 2 === 0) {
      const mid = String.fromCharCode((f1 + f2) / 2) + (r1 + r2) / 2;
      if (mid !== st.to && after?.[KD.sq.index(mid)]) return `${cap(by)} shoots over ${mid}.`;
    }
  }
  return `${cap(by)} gives check.`;
}

// ---- the board ----
const app = $('#app');
let mode = 'live';          // 'live': you play the computer. 'script': a state or the story runs.
let run = 0;                // a new state, play or reset stops the old one
let stories = [];
let prelude = [];          // moves from earlier in the scripted game, for the end state's key moments
let frozen = null;          // { sq, ply } while a frozen piece waits out its turn

const board = createBoard($('#board'), {
  play: { level: LEVEL, human: 'both' },  // the page runs the computer itself, so its powers can reveal first
  label: 'King Down board, Frost against Flame. Arrow keys move, Enter or Space chooses, Escape cancels, I reads a piece.',
  onTap(sq, cell) {
    const st = board.state && KD.status(board.state);
    if (st && !st.over && st.turn === 'b') return false;       // the computer's turn
    if (ctxKind === 'piece') closeRead();
    else if (ctxKind === 'power') setCtx('');
    // A tap on an enemy piece reads it, unless that piece is a target of your selected piece: then the move plays.
    const target = board.pending.at(-1) === sq || board.targets.some(m => m.path[board.pending.length] === sq);
    if (cell && cell.color === 'b' && !board.armed && !target) { readPiece(sq); return false; }
    return undefined;
  },
  onInspect(sq) { readPiece(sq); },
  onMove(story) { afterMove(story); },
  // The board disarms itself (a tap on your own piece, Escape): the coin, the dim and the prompt follow.
  onSelect() { if (!board.armed && ctxKind === 'armed') disarm(); },
});
const fx = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
fx.setAttribute('class', 'arena-fx'); fx.setAttribute('viewBox', '0 0 800 800'); fx.setAttribute('preserveAspectRatio', 'none'); fx.setAttribute('aria-hidden', 'true');
board.layer.appendChild(fx);

const xy = (sq, dy = 0.5) => [(sq.charCodeAt(0) - 97) * 100 + 50, (8 - +sq[1]) * 100 + dy * 100];
const clearFx = () => { fx.replaceChildren(); $$('.ice-badge', board.layer).forEach(el => el.remove()); };

/** A line on the board that draws itself from a cause to its effect. kind: 'cause' (crimson, solid) or 'trail' (ember, dashed). */
async function drawLine(from, to, kind, ms = 200) {
  const [x1, y1] = xy(from, kind === 'cause' ? 0.42 : 0.6), [x2, y2] = xy(to, kind === 'cause' ? 0.62 : 0.6);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', `fx-${kind}`);
  const [halo, core, w] = kind === 'cause' ? ['rgba(255,246,232,.92)', '#b3261e', 4] : ['rgba(40,12,4,.55)', '#ff9a52', 3.5];
  g.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${halo}" stroke-width="${w + 4}" stroke-linecap="round"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${core}" stroke-width="${w}" stroke-linecap="round"/>
    <circle cx="${x1}" cy="${y1}" r="${kind === 'cause' ? 9 : 7}" fill="none" stroke="${core}" stroke-width="3"/>`;
  if (kind === 'trail') g.setAttribute('opacity', '.62');
  fx.appendChild(g);
  if (prefersReducedMotion()) return;
  const lines = [...g.querySelectorAll('line')];
  await Promise.all(lines.map(l => l.animate([{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }], { duration: ms, easing: 'cubic-bezier(.2,.8,.2,1)' }).finished.catch(() => {})));
}

function iceBadge(sq) {
  const el = document.createElement('div');
  el.className = 'ice-badge';
  el.style.left = `${(sq.charCodeAt(0) - 97) * 12.5}%`; el.style.top = `${(8 - +sq[1]) * 12.5}%`;
  el.innerHTML = '<span>Frozen</span>';
  board.layer.appendChild(el);
}

/** An animation that respects reduced motion and leaves no inline style behind. */
function anim(el, frames, opts) {
  if (prefersReducedMotion() || !el?.animate) return Promise.resolve(null);
  const a = el.animate(frames, opts);
  return a.finished.then(() => a, () => a);
}

// ---- the story so far ----
function storiesOf(state) {
  const chain = [state];
  while (chain[0].history.length) chain.unshift(KD.undo(chain[0]));
  return state.history.map((h, i) => KD.describe(chain[i], h.lan));
}

// ---- nameplates ----
function renderPlates({ line } = {}) {
  const s = board.state;
  if (!s) return;
  const st = KD.status(s);
  const myTurn = !st.over && st.turn === 'w';
  app.classList.toggle('is-over', st.over);
  $('#me').classList.toggle('is-turn', myTurn);
  $('#them').classList.toggle('is-turn', !st.over && st.turn === 'b');
  $('#me').classList.toggle('is-check', !st.over && st.check && st.turn === 'w');
  $('#me').classList.toggle('is-out', st.over && st.winner === 'b');
  $('#them').classList.toggle('is-out', st.over && st.winner === 'w');
  const last = stories.at(-1);
  $('#me-line').textContent = line ?? (st.over ? (st.winner === 'w' ? 'You win' : st.winner === 'b' ? 'Flame wins' : 'A draw')
    : myTurn ? (st.check && last ? checkLine(last, KD.board(s)) : 'You · Your move') : 'You');
  $('#them-line').textContent = st.over ? 'Computer · Club' : st.turn === 'b' ? 'Thinking' : 'Computer · Club';
  coin('w', KD.usesLeft(s, 'w'));
  coin('b', KD.usesLeft(s, 'b'));
  $('#undo').disabled = !s.history.length || st.turn === 'b' && !st.over && mode === 'live';
  $('#hint').disabled = st.over || st.turn !== 'w';
}
function coin(side, left) {
  const el = $(side === 'w' ? '#me-power' : '#them-power');
  const used = !left;
  el.classList.toggle('is-used', used);
  $(side === 'w' ? '#me-uses' : '#them-uses').textContent = used ? 'Used' : `${left} use`;
  el.setAttribute('aria-label', side === 'w'
    ? (used ? 'Freeze is used.' : 'Use Freeze. One use left.')
    : `Flame's power: Strike. ${used ? 'Used.' : 'One use left.'} Read it.`);
  if (side === 'w') el.disabled = used;   // a used Freeze does nothing; your portrait still reads it
}

// ---- the tray: the last five moves as tiles; newest at the end (phone) or on top (desktop) ----
function tileHTML(st, { isNew = false } = {}) {
  const side = st.side === 'w' ? 'me' : 'them';
  const sq = st.kind === 'shoot' ? st.capturedOn[0] : st.to;
  const power = !!st.powerTag, verb = verbOf(st);
  return `<li><button type="button" class="tile${power ? ' is-power' : ''}${isNew ? ' is-new' : ''}" data-side="${side}" data-sq="${sq}" data-from="${st.from}">
    <span class="tile-art"><img alt="" src="${artOf(st)}"></span>
    ${power ? `<img class="tile-emblem" alt="" src="${emblemArt(st.side === 'w' ? 'frost' : 'flame')}">` : ''}
    <span class="tile-line">${shortLine(st)}</span>
    <span class="tile-foot">${verb ? icon(verb) : ''}${sq}</span>
    <span class="tile-sr">${st.text}</span></button></li>`;
}
function renderTray({ fresh = false } = {}) {
  const desktop = document.documentElement.dataset.layout === 'desktop';
  const last5 = stories.slice(-5);
  const shown = desktop ? [...last5].reverse() : last5;
  $('#tiles').innerHTML = shown.map(st => tileHTML(st, { isNew: fresh && st === stories.at(-1) })).join('')
    || '<li class="muted">No moves yet.</li>';
  const last = stories.at(-1);
  $('#tray-last').textContent = last ? shortLine(last) + '.' : '';
  $('#tray-chip').innerHTML = last ? `<img alt="" src="${artOf(last)}"><span>${shortLine(last)}</span><b>${Math.min(5, stories.length)} moves</b>` : '<span>No moves yet.</span>';
  $('#tray-chip').setAttribute('aria-label', last ? `Last move: ${last.text} Show the last moves.` : 'No moves yet.');
  if (fresh && last) {
    // The new move slides in: as a tile in the open tray, as the chip's line when the tray is folded.
    const el = app.classList.contains('is-folded') ? $('#tray-chip span') : $('#tiles .is-new');
    if (el) anim(el, [{ opacity: 0, transform: desktop ? 'translateY(-10px)' : 'translateX(14px) scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  renderMoves();
}
function renderMoves() {
  $('#moves-list').innerHTML = stories.map(st => `<li>${pieceIcon(st.piece, st.side)}<span>${st.text}</span></li>`).join('')
    || '<li><span class="muted">No moves yet.</span></li>';
}
/** The tray folds into one chip and opens again: a collapsible section. */
function foldTray(folded) {
  app.classList.toggle('is-folded', folded);
  $(folded ? '#tray-chip' : '#tray-fold').focus({ preventScroll: true });
}

// ---- the context area: a piece card, a power card, a prompt, the result ----
let ctxKind = '';
function setCtx(kind, html = '') {
  ctxKind = kind;
  app.dataset.ctx = kind;
  $('#ctx').innerHTML = html;
  if (kind !== 'piece') board.el.closest('.board')?.classList.remove('is-reading');
}
function closeBtn() { return `<button type="button" class="btn btn-icon close" data-close-ctx aria-label="Close">${icon('close')}</button>`; }

function pieceCardHTML(cell) {
  const [rule, more] = PIECE_CARD[cell.type] ?? ['', ''];
  const theirs = cell.color === 'b';
  return `<article class="kcard" aria-label="${cap(cell.type)}">
    <div class="kcard-art"><img alt="" src="${pieceArt(cell.type, cell.color)}"></div>
    <div><p class="kcard-kicker">${theirs ? 'Their piece' : 'Your piece'}</p><h2>${cap(cell.type)}</h2>
    <p class="kcard-rule">${rule}</p><p class="kcard-more">${more}</p></div>${closeBtn()}</article>`;
}
function powerCardHTML(side, { kicker, rule, more } = {}) {
  const c = POWER_CARD[side];
  return `<article class="kcard is-power" aria-label="${c.power}">
    <div class="kcard-art"><img alt="" src="${emblemArt(c.emblem)}"></div>
    <div><p class="kcard-kicker">${kicker ?? (side === 'w' ? 'Your power · Frost' : 'Their power · Flame')}</p><h2>${c.power}</h2>
    <p class="kcard-rule">${rule ?? c.rule}</p><p class="kcard-more">${more ?? c.more}</p></div>${closeBtn()}</article>`;
}

/**
 * Hold to read: the piece's card shows, and its reach shows on the board. It never moves a piece.
 * For their piece, red marks only the squares where it can take (an Archer's shots get the crosshair);
 * a square it can only step to gets the plain gem. So an Archer's or a Guard's steps never look like danger.
 */
function readPiece(sq) {
  const s = board.state;
  const cell = s ? KD.board(s)[KD.sq.index(sq)] : null;
  if (!cell) return;
  if (cell.type === 'king') { readPower(cell.color); return; }
  board.clearSelection(false);
  board.clearMarks('threat');
  board.select(sq);
  const reach = reachOf(s, sq, cell), from = { pop: true, from: sq };
  board.mark(reach.shots, 'shot', from);
  if (cell.color === 'b') {
    board.mark(reach.takes, 'threat', from);
    board.mark(reach.steps.filter(x => !reach.takes.includes(x)), 'move', from);
  } else board.mark(reach.steps, 'move', from);
  setCtx('piece', pieceCardHTML(cell));
  enter($('#ctx .kcard'));
}
/** Close a read: the card, the selection and every reach mark. */
function closeRead() {
  board.clearSelection(false);
  board.clearMarks('threat');
  setCtx('');
}
function readPower(side) {
  if (board.armed) return;
  setCtx('power', powerCardHTML(side, KD.usesLeft(board.state, side) ? {} : { kicker: side === 'w' ? 'Your power · used' : 'Their power · used' }));
  enter($('#ctx .kcard'));
}
function enter(el, { flip = false } = {}) {
  if (!el) return Promise.resolve();
  return anim(el, flip
    ? [{ opacity: 0, transform: 'perspective(600px) rotateX(-75deg) translateY(-8px)', transformOrigin: '50% 0' }, { opacity: 1, transform: 'none', transformOrigin: '50% 0' }]
    : [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: flip ? 300 : 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

/**
 * Where a piece reaches, from the engine (with the piece's side to move):
 * steps: the first square of each move; shots: where it shoots without moving; takes: where it takes by moving.
 * shots and takes hold empty squares too: the engine is asked with an enemy placed on each empty square.
 */
function reachOf(s, sq, cell) {
  const fen = KD.toFen(s).split(' ');
  fen[1] = cell.color;
  const opts = { powers: s.kings }, grid = KD.board(s), foe = cell.color === 'w' ? 'n' : 'N';
  const legal = KD.legal(KD.fromFen(fen.join(' '), opts), sq).filter(m => !m.needsArming);
  const shots = [], takes = [];
  for (let i = 0; i < 64; i++) {
    const at = KD.sq.name(i), here = grid[i];
    if (at === sq || here?.color === cell.color) continue;
    let moves = legal;
    if (!here) { try { moves = KD.legal(KD.fromFen(placeOn(fen, at, foe), opts), sq); } catch { continue; } }
    const hits = moves.filter(m => !m.needsArming && m.captures[0] === at && (m.kind === 'shoot' || m.path[0] === at));
    if (hits.some(m => m.kind === 'shoot')) shots.push(at);
    else if (hits.length) takes.push(at);
  }
  const steps = [...new Set(legal.filter(m => ['move', 'capture', 'chain'].includes(m.kind)).map(m => m.path[0]))];
  return { steps: steps.filter(x => !shots.includes(x)), shots, takes };
}
function placeOn(fen, sq, letter) {
  const rows = fen[0].split('/').map(r => r.replace(/\d/g, d => '.'.repeat(+d)).split(''));
  rows[8 - +sq[1]][sq.charCodeAt(0) - 97] = letter;
  const f = [...fen];
  f[0] = rows.map(r => r.join('').replace(/\.+/g, m => String(m.length))).join('/');
  return f.join(' ');
}

// ---- your power: tap the coin, the board dims, the targets come as a wave from your king ----
function armFreeze() {
  const s = board.state;
  if (!s || KD.status(s).turn !== 'w' || !KD.usesLeft(s, 'w')) return;
  if (board.armed) { disarm(); return; }
  board.arm('freeze');
  const targets = KD.legal(s).filter(m => m.power === 'freeze').map(m => m.to);
  board.clearMarks('power');
  const king = KD.board(s).find(c => c && c.type === 'king' && c.color === 'w')?.sq ?? 'g1';
  board.mark(targets, 'power', { pop: true, from: king });
  board.targets = KD.legal(s).filter(m => m.power === 'freeze');
  $('#board').classList.add('is-arming');
  $('#me-power').setAttribute('aria-pressed', 'true');
  setCtx('armed', `<div class="prompt">${runeSVG()}<p>Freeze: tap an enemy piece.<small>Then make your move.</small></p>
    <button type="button" class="btn" id="cancel-arm">Cancel</button></div>`);
  enter($('#ctx .prompt'));
  $('#cancel-arm').addEventListener('click', disarm);
  sfx.tap();
}
function disarm() {
  board.arm(null);
  $('#board').classList.remove('is-arming');
  $('#me-power').setAttribute('aria-pressed', 'false');
  if (ctxKind === 'armed') setCtx('');
}
const runeSVG = () => `<svg class="prompt-rune" viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="22" rx="17" ry="8" fill="none" stroke="#8fbcff" stroke-width="2"/><path d="M20 6v24M12 10l16 16M28 10 12 26" stroke="#cfe3ff" stroke-width="2" stroke-linecap="round"/></svg>`;

// ---- after each move ----
function afterMove(story) {
  stories.push(story);
  if (story.powerTag === 'freeze') {
    frozen = { sq: story.to, ply: board.state.history.length };
    board.mark(story.to, 'glow', { colour: '96,160,255' });
    iceBadge(story.to);
    $('#board').classList.remove('is-arming');
    $('#me-power').setAttribute('aria-pressed', 'false');
    setCtx('next', `<div class="prompt">${runeSVG()}<p>Now make your move.<small>Their ${cap(story.piece)} cannot move next turn.</small></p></div>`);
    enter($('#ctx .prompt'));
  } else if (ctxKind === 'next' || ctxKind === 'armed' || (story.side === 'w' && (ctxKind === 'power' || ctxKind === 'piece'))) setCtx('');
  board.clearMarks('threat');
  if (story.side === 'b' && frozen) { board.clearMarks('glow'); $$('.ice-badge', board.layer).forEach(el => el.remove()); frozen = null; }
  if (story.side === 'w' && !story.again) clearFx();
  renderTray({ fresh: true });
  renderPlates();
  if (KD.status(board.state).over) { showResult(); return; }
  if (mode === 'live' && KD.status(board.state).turn === 'b') void computerTurn(run);
}
// A king on the g or h file falls to the left, onto the board (the kit tips every fallen king to the right).
// The class goes on before the move, so the fall starts in the right direction.
const realPlay = board.playMove.bind(board);
board.playMove = async (move, opts) => {
  const st = board.state && KD.describe(board.state, move);
  const king = st?.mate && st.after.find(c => c && c.type === 'king' && c.color !== st.side);
  if (king && 'gh'.includes(king.sq[0])) board.figure(king.sq)?.classList.add('fall-left');
  return realPlay(move, opts);
};

// ---- the computer's turn: its power reveals before the effect plays ----
async function computerTurn(me) {
  const s = board.state;
  $('#them-line').textContent = 'Thinking';
  breathe();
  await wait(450);
  const m = await KD.think(s, { level: LEVEL, ms: 600 });
  if (me !== run || board.state !== s || !m) return;
  const story = KD.describe(s, m);
  if (story.powerTag) await powerBeat(story, me);
  else await board.playMove(m);
}
function breathe() {
  anim($('#them .portrait-face'), [{ transform: 'none' }, { transform: 'scale(1.06)' }, { transform: 'none' }], { duration: 1100, easing: 'ease-in-out' });
}

/**
 * The one strong beat. 1. Anticipation (120 ms): their coin lifts. 2. Reveal (200 ms): it flips to its power,
 * and the power card turns over in the context area. 3. Action (about 300 ms): the piece travels on an ember
 * trail. 4. Follow-through (230 ms): the cause line draws to your king, and your portrait flinches once.
 * The board never moves, and nothing covers the cause.
 */
async function powerBeat(story, me) {
  const pw = $('#them-power'), c = pw.querySelector('.coin');
  const lift = 'translateY(-4px) scale(1.12)';
  $('#them-line').textContent = `Plays ${story.power}`;
  await anim(c, [{ transform: 'none' }, { transform: lift }], { duration: 120, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
  if (me !== run) return;
  const half = c.animate && !prefersReducedMotion() ? c.animate([{ transform: lift }, { transform: `${lift} rotateY(90deg)` }], { duration: 100, easing: 'ease-in', fill: 'forwards' }) : null;
  await half?.finished.catch(() => {});
  c.getAnimations().filter(a => a !== half).forEach(a => a.cancel());
  pw.classList.add('is-revealed');
  sfx.power(); haptic(10);
  setCtx('power', powerCardHTML('b', { kicker: 'Flame plays a power', rule: `Their ${cap(story.piece)} moves like a queen.`, more: 'One use a game. Only to an empty square.' }));
  const card = enter($('#ctx .kcard'), { flip: true });
  const back = anim(c, [{ transform: `${lift} rotateY(-90deg)` }, { transform: 'none' }], { duration: 180, easing: 'cubic-bezier(.34,1.4,.64,1)' });
  half?.cancel();
  await Promise.all([card, back]);
  if (me !== run) return;
  await wait(260, { instant: true });
  if (me !== run) return;
  // Action: the piece travels; an ember trail marks where it came from.
  const trail = drawLine(story.from, story.to, 'trail', 300);
  await board.playMove(story.lan);
  await trail;
  if (me !== run) return;
  pw.classList.remove('is-revealed');
  // Follow-through: the cause of the check, then your king flinches.
  if (story.check) {
    await drawLine(story.to, story.checkSq, 'cause', 200);
    if (me !== run) return;
    haptic([12, 60, 12]);
    await anim($('#me .portrait-face'), [{ transform: 'none' }, { transform: 'rotate(-9deg) translateX(-2px)' }, { transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  renderPlates();
}

// ---- the end ----
function showResult() {
  const s = board.state, st = KD.status(s);
  const win = st.winner === 'w';
  const pool = [...prelude, ...stories], final = pool.at(-1);
  // Three moments: the last two takes or powers, then the final move. A simple pick, not the key-moment check.
  const moments = [...pool.slice(0, -1).filter(m => m.powerTag || m.capturedOn.length).slice(-2), final].filter(Boolean);
  setCtx('result', `<div class="result">
    <h2>King Down</h2>
    <p class="result-line">${win ? 'You win' : st.winner ? 'Flame wins' : 'A draw'} · ${st.reason === 'checkmate' ? 'Checkmate' : cap(st.reason ?? 'end')} on move ${s.moveNumber ?? st.moveNumber}</p>
    <ol class="moments" aria-label="Key moments">${moments.map(m => momentHTML(m, m === final)).join('')}</ol>
    <div class="result-actions"><button type="button" class="btn btn-primary" id="rematch">Rematch</button><button type="button" class="btn" id="review">Review</button></div>
  </div>`);
  enter($('#ctx .result'));
  $('#rematch').addEventListener('click', () => demo.reset());
  $('#review').addEventListener('click', () => openSheet('moves-sheet'));
  renderPlates();
}
/** A key moment: the full figure and a caption of two words or fewer. */
function momentHTML(st, isFinal) {
  const who = st.side === 'w' ? 'Your' : 'Their';
  const noun = { shoot: 'shot', chain: 'bite', push: 'shove', swap: 'swap' }[st.kind];
  const caption = isFinal ? (st.mate ? 'Checkmate' : 'Last move')
    : st.powerTag ? `${who} ${st.power}` : noun ? `${who} ${noun}` : st.side === 'w' ? 'You take' : 'They take';
  const power = !!st.powerTag;
  return `<li class="moment${power ? ' is-power' : ''}" data-side="${st.side === 'w' ? 'me' : 'them'}">
    <img class="moment-art" alt="" src="${artOf(st)}">
    ${power ? `<img class="moment-emblem" alt="" src="${emblemArt(st.side === 'w' ? 'frost' : 'flame')}">` : ''}
    <span class="moment-cap" aria-hidden="true">${caption}</span><span class="sr-only">${caption}: ${st.text}</span></li>`;
}
/** The end state starts at P2: your shot and Flame's Strike from earlier in the scripted game come first. */
function scriptedPrelude() {
  const shot = KD.describe(p1(), SHOT);
  return [shot, KD.describe(shot.next, STRIKE)];
}

// ---- controls ----
$$('.token').forEach(t => { t.innerHTML = icon('crown'); });
$('#hint').innerHTML = `${icon('hint')}<span>Hint</span>`;
$('#undo').innerHTML = `${icon('undo')}<span>Undo</span>`;
$('#menu').innerHTML = `${icon('menu')}<span>Menu</span>`;
$('#menu-sheet [data-close]').innerHTML = icon('close');
$('#tray-fold').innerHTML = icon('chevron-down');
$('#me-power').addEventListener('click', armFreeze);
$('#them-power').addEventListener('click', () => (ctxKind === 'power' ? setCtx('') : readPower('b')));
$('#me-portrait').addEventListener('click', () => readPower('w'));
$('#them-portrait').addEventListener('click', () => readPower('b'));
$('#menu').addEventListener('click', () => openSheet('menu-sheet'));
$('#new-game').addEventListener('click', async () => { await closeSheet('menu-sheet'); demo.reset(); });
$('#all-moves').addEventListener('click', async () => { await closeSheet('menu-sheet'); openSheet('moves-sheet'); });
$('#moves-sheet [data-close]').innerHTML = icon('close');
const sound = $('#sound');
sound.checked = !sfx.muted;
sound.addEventListener('change', () => sfx.setMuted(!sound.checked));
$('#ctx').addEventListener('click', e => { if (e.target.closest('[data-close-ctx]')) (ctxKind === 'piece' ? closeRead() : setCtx('')); });
$('#tray-chip').addEventListener('click', () => foldTray(false));
$('#tray-fold').addEventListener('click', () => foldTray(true));
$('#tiles').addEventListener('click', e => {
  const t = e.target.closest('.tile');
  if (!t) return;
  board.clearMarks('hint');
  board.mark([t.dataset.sq], 'hint');
  toast(t.querySelector('.tile-sr').textContent);
});
$('#hint').addEventListener('click', async () => {
  const s = board.state;
  if (!s || KD.status(s).turn !== 'w') return;
  if (board.armed || ctxKind === 'armed') disarm();
  if (ctxKind === 'piece') closeRead();
  const m = await KD.think(s, { level: LEVEL, ms: 500 });
  if (board.state !== s || !m) return;
  board.clearSelection(false);
  if (!m.needsArming) board.selectSquare(m.from);
  board.mark([m.from], 'hint');
  $('#me-line').textContent = `Hint: ${shortLine(KD.describe(s, m))}.`;
});
$('#undo').addEventListener('click', () => {
  const s = board.state;
  if (!s?.history.length) return;
  const st = KD.status(s);
  let back = KD.undo(s);
  if (!st.over && st.turn === 'w' && back.history.length) back = KD.undo(back);
  run++;
  show(back);
  mode = 'live';
});
// The board's own Escape runs first and disarms through onSelect; this one covers focus outside the board.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || document.querySelector('dialog[open]')) return;
  if (board.armed || ctxKind === 'armed') disarm();
  else if (ctxKind === 'piece') closeRead();
  else if (ctxKind === 'power') setCtx('');
});
// On a resize the layout can change between phone and desktop: the tray order and its default follow.
const isPhone = () => document.documentElement.dataset.layout !== 'desktop';
let lastLayout = document.documentElement.dataset.layout;
addEventListener('resize', () => { const l = document.documentElement.dataset.layout; if (l !== lastLayout) { lastLayout = l; setTray(isPhone() ? 'B' : 'A'); renderTray(); } });

/** A: the open tray and 48 px kings (the desktop default). B: the folded tray and 32 px kings (the phone default). */
function setTray(option) {
  app.classList.toggle('is-small', option === 'B');
  app.classList.toggle('is-folded', option === 'B');
}

// ---- one view of a game ----
function show(state, { tray = isPhone() ? 'B' : 'A' } = {}) {
  hideToast();
  board.play.human = 'both';
  board.arm(null);
  frozen = null;
  prelude = [];
  board.clearMarks();
  $$('#board .fall-left').forEach(el => el.classList.remove('fall-left'));
  board.setState(state);
  clearFx();
  $('#board').classList.remove('is-arming');
  $$('.portrait-face, .coin').forEach(el => el.getAnimations().forEach(a => a.cancel()));
  $('#me-power').setAttribute('aria-pressed', 'false');
  $('#them-power').classList.remove('is-revealed');
  setTray(tray);
  setCtx('');
  stories = storiesOf(state);
  renderTray();
  renderPlates();
}

// ---- the demo contract ----
const STATES = ['rest', 'read', 'select', 'played', 'check', 'end', 'open-tray', 'whisper'];
const demo = window.demo = {
  async state(name) {
    const me = ++run;
    mode = 'script';
    if (!STATES.includes(name)) throw new Error(`demo.state: no state "${name}"`);
    if (name === 'end') {
      show(KD.fromFen(P2, { powers: POWERS }));
      prelude = scriptedPrelude();
      await wait(150, { instant: true });
      if (me !== run) return;
      await board.playMove(MATE);
      if (me !== run) return;
      await drawLine('f6', 'h8', 'cause', 200);
      mode = 'live';
      return;
    }
    show(p1(), { tray: name === 'whisper' ? 'B' : name === 'open-tray' ? 'A' : undefined });
    if (name === 'read') readPiece('b6');
    if (name === 'select') armFreeze();
    if (name === 'played' || name === 'check') {
      await board.playMove(SHOT);
      if (me !== run) return;
    }
    if (name === 'played') { $('#them-line').textContent = 'Thinking'; return; }
    if (name === 'check') {
      await powerBeat(KD.describe(board.state, STRIKE), me);
    }
    if (me === run) mode = 'live';
  },
  // The story: read their Archer, take a pawn with yours, then Flame reveals Strike and checks you.
  async play() {
    const me = ++run;
    mode = 'script';
    show(p1());
    await wait(900, { instant: true });
    if (me !== run) return;
    readPiece('b6');
    await wait(2200, { instant: true });
    if (me !== run) return;
    closeRead();
    await wait(400, { instant: true });
    if (me !== run) return;
    board.selectSquare('a3');
    await wait(900, { instant: true });
    if (me !== run) return;
    await board.playMove(SHOT);
    if (me !== run) return;
    $('#them-line').textContent = 'Thinking';
    breathe();
    await wait(1300, { instant: true });
    if (me !== run) return;
    await powerBeat(KD.describe(board.state, STRIKE), me);
    if (me !== run) return;
    await wait(2600, { instant: true });
    if (me !== run) return;
    // Your answer: the pawn takes the Archer. Then the game is yours to play.
    board.selectSquare('f2');
    await wait(700, { instant: true });
    if (me !== run) return;
    await board.playMove('f2xe3');
    if (me !== run) return;
    await wait(900, { instant: true });
    if (me !== run) return;
    mode = 'live';
    void computerTurn(me);   // the game goes on: the computer answers
  },
  async reset() {
    run++;
    mode = 'live';
    show(p1());
  },
};

show(p1());
const asked = new URLSearchParams(location.search).get('state');
if (asked) demo.state(asked).catch(err => console.error(err));
