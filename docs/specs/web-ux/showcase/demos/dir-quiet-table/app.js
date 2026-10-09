// Quiet Table: the board, two text strips, one voice line, a folded moves line and one hairline row.
// The real board, rules and computer player come from the kit. Shared positions P1 and P2 (idea bank §6.1).
import { createBoard, KD, moveLabel } from '../../kit/board.js';
import { icon, pieceIcon } from '../../kit/icons.js';
import { $, $$, openSheet, closeSheet, hideToast, toast, animate, wait, prefersReducedMotion, sfx } from '../../kit/ui.js';

// ---- positions ----
const POWERS = ['Frost:Freeze', 'Flame:Strike'];
const PRE_P1 = 'r1b2mk1/2p1p1pp/1a6/pp1o4/2g1S3/A1OP4/PP1G1PPP/R1B2MK1 b - - 0 11';
const P2 = 'r1b3rk/2p4p/4p3/pp2A3/2g5/2OP4/PP1G1PPP/R1B2MK1 w - - 0 24 u0.1'; // u0.1: Black used Strike earlier
const ME = 'w';
const p1 = () => KD.play(KD.fromFen(PRE_P1, { powers: POWERS }), 'e7-e6'); // the last move: Black pawn e7 to e6
const p2 = () => KD.fromFen(P2, { powers: POWERS });
const ARMY = 'RABOGMKS'; // a back rank that fits P1: rook, bishop, maester and king still stand at home
const playAll = (s, lans) => lans.reduce((st, lan) => KD.play(st, lan), s);

// ---- words: one short line for each piece and power (king-down-facts.md §2, §3) ----
const CARD = {
  pawn: 'Steps forward. Takes one step diagonally.',
  knight: 'Jumps in an L shape.',
  bishop: 'Moves any distance on a diagonal.',
  rook: 'Moves any distance in a straight line.',
  queen: 'Moves any distance in any direction.',
  king: 'Steps one square. Lose it, lose the game.',
  archer: 'Shoots without moving, even over other pieces.',
  guard: 'Only a king can take it. It never takes.',
  maester: 'Swaps places with a friend next to it.',
  beast: 'After each bite, it can bite again.',
  ogre: 'Shoves a neighbour and steps into its place.',
  paladin: 'Jumps its own pieces. Taking more than a pawn costs it.',
};
const POWER_LINE = {
  Freeze: 'An enemy piece cannot move next turn.',
  Strike: 'One piece moves like a queen. It cannot take.',
};
/** The added line when the player reads their power (king-down-facts.md §3). */
const POWER_MORE = { Strike: 'Not a pawn or the king.' };
const KING_POWER = { Frost: 'Freeze', Flame: 'Strike' };

const sqi = sq => (sq.charCodeAt(1) - 49) * 8 + (sq.charCodeAt(0) - 97);
const whose = side => (side === ME ? 'Your' : 'Their');

/** A move as one short sentence in the player's voice (eight words or fewer). */
function sentence(st) {
  const who = whose(st.side), p = st.piece, cap = st.captured?.[0], on = st.capturedOn?.[0];
  const at = sq => st.after?.[sqi(sq)];
  let t;
  switch (st.kind) {
    case 'shoot': t = `${who} archer shoots the ${cap} on ${on}`; break;
    case 'chain': t = st.captured.length === 2 ? `${who} beast bites the ${st.captured[0]}, then the ${st.captured[1]}` : `${who} beast bites ${st.captured.length} pieces`; break;
    case 'push': t = `${who} ogre shoves the ${st.push.piece ?? at(st.push.to)?.type} to ${st.push.to}`; break;
    case 'swap': t = `${who} maester swaps with the ${st.swap?.with ?? at(st.from)?.type}`; break;
    case 'capture': t = `${who} ${p} takes the ${cap} on ${on}`; break;
    case 'promote': t = `${who} pawn becomes a ${st.promo}`; break;
    case 'pass': t = `${who} turn ends`; break;
    case 'power':
      if (st.powerTag === 'freeze') { t = `${who} king freezes the ${p} on ${st.to}`; break; }
      if (st.powerTag === 'ward') { t = `${who} king walls the ${p} on ${st.to}`; break; }
      if (st.from === st.to) { t = st.text.replace(/\.$/, ''); break; }
      // falls through: Strike, Haste and Flight move a piece

    default: {
      const verb = p === 'pawn' ? 'steps' : 'goes';
      t = `${who} ${p} ${verb} to ${st.to}${st.power ? ` with ${st.power}` : ''}`;
    }
  }
  if (st.leaves) t += '. The paladin leaves';
  return `${t}${st.mate ? '. Checkmate.' : st.check ? '. Check.' : '.'}`;
}

// ---- the page ----
const root = document.documentElement;
const app = $('#app');
const params = new URLSearchParams(location.search);

// Layout: ?frame=phone|desktop wins; else the width decides.
const wide = matchMedia('(min-width: 900px)');
const setLayout = () => { root.dataset.layout = params.get('frame') === 'phone' ? 'phone' : params.get('frame') === 'desktop' ? 'desktop' : wide.matches ? 'desktop' : 'phone'; };
wide.addEventListener('change', setLayout);
setLayout();

function setFloor(floor) {
  root.dataset.floor = floor === 'dark' ? 'dark' : 'light';
  for (const b of $$('.floor-pick')) b.setAttribute('aria-pressed', String(b.dataset.floor === root.dataset.floor));
}
setFloor(params.get('floor') ?? 'light');

const label = (el, name, text) => { el.innerHTML = `${icon(name)}<span>${text}</span>`; };
label($('#hint'), 'hint', 'Hint');
label($('#undo'), 'undo', 'Undo');
label($('#menu-btn'), 'menu', 'Menu');
$('.ml-chev').innerHTML = icon('chevron-down');
$('#menu [data-close]').innerHTML = icon('close');
$('#menu-back').innerHTML = icon('back');
$('#m-extra .chev').innerHTML = icon('chevron');

// ---- the board ----
let stories = [];
let cause = null;      // { from, to, check } : the cause line on the board
let reading = null;    // the square that a hold reads
let ended = null;      // { title, text, short, ready, review } after the game ends (a mate or a resign)
let resultTimer = 0;

const board = createBoard($('#board'), {
  play: { level: 'casual', human: ME, ms: 500, pause: 400 },
  label: 'King Down board. Arrow keys move, Enter or Space chooses, Escape cancels, I reads a piece.',
  onMove(story) {
    // The king falls first, before any layout read below, so its turn starts from the right values.
    if (story.mate) {
      const loser = KD.board(board.state).find(c => c && c.type === 'king' && c.color !== story.side);
      if (loser) fallKing(loser.sq);
    }
    stories.push(story);
    endRead(false);
    if (story.kind === 'shoot') cause = { from: story.from, to: story.capturedOn[0], check: false };
    else cause = null;
    if (story.check || story.mate) cause = checkCause(board.state, story.side === 'w' ? 'b' : 'w') ?? cause;
    drawCause();
    renderStory({ fresh: true });
    render();
    if (story.mate) endGame(story.side === ME ? { title: 'King Down', text: 'You win by checkmate.', short: 'You win.' } : { title: 'King Down', text: 'Flame wins by checkmate.', short: 'Flame wins.' });
  },
  onSelect(sq) {
    if (!sq) { renderVoice(); return; }
    const cell = board.cells[sqi(sq)];
    if (cell) voice(`${whose(cell.color)} ${cell.type}`, cardLine(cell));
  },
  onInspect(sq, cell) {
    // A mouse that rests on a piece reads it, but never over a selection: only a press or the I key does that.
    if (board.selected != null && !pressing && !keyRead) return;
    readPiece(sq, cell);
  },
});
const boardEl = $('#board');

function cardLine(cell) {
  if (cell.type !== 'king') return CARD[cell.type] ?? '';
  const spec = board.state?.kings?.[cell.color === 'w' ? 0 : 1];
  return spec?.power && POWER_LINE[spec.power] ? `${spec.power}: ${POWER_LINE[spec.power]}` : CARD.king;
}

// ---- reading a piece: its reach on the board, its line in the voice. A hold never plays a move. ----
function flipped(s) {
  const f = KD.toFen(s).split(' ');
  f[1] = f[1] === 'w' ? 'b' : 'w';
  return KD.fromFen(f.join(' '));
}
const LETTER = { pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k', archer: 'a', paladin: 'l', guard: 'g', maester: 'm', beast: 's', ogre: 'o' };
/**
 * The engine is the truth for an Archer's shot squares. The probe holds only the two kings, the Archer and,
 * on each square up to two away that is empty or holds an enemy, an enemy Paladin (it never gives check).
 * An enemy Guard stays a Guard (she cannot take it). No other piece is in the probe, so no Beast chain
 * search can grow: a read takes about 1 ms.
 */
function archerProbe(cells, sq, cell) {
  const me = sqi(sq), probe = new Array(64).fill(null);
  for (const c of cells) if (c?.type === 'king') probe[sqi(c.sq)] = c;
  probe[me] = cell;
  for (let i = 0; i < 64; i++) {
    if (probe[i] || Math.max(Math.abs((i & 7) - (me & 7)), Math.abs((i >> 3) - (me >> 3))) > 2) continue;
    const c = cells[i];
    if (c && c.color === cell.color) continue;
    probe[i] = c?.type === 'guard' ? c : { type: 'paladin', color: cell.color === 'w' ? 'b' : 'w' };
  }
  const rows = [];
  for (let r = 7; r >= 0; r--) {
    let row = '', gap = 0;
    for (let f = 0; f < 8; f++) {
      const c = probe[r * 8 + f];
      if (!c) { gap++; continue; }
      if (gap) { row += gap; gap = 0; }
      row += c.color === 'w' ? LETTER[c.type].toUpperCase() : LETTER[c.type];
    }
    rows.push(row + (gap || ''));
  }
  return KD.fromFen(`${rows.join('/')} ${cell.color} - - 0 1`);
}
/** The squares a piece can take on: its real takes, and for an Archer every square she can shoot. */
function reachOf(sq) {
  const s = board.state, cell = board.cells[sqi(sq)];
  if (!s || !cell) return [];
  const out = new Set();
  try {
    const side = KD.status(s).turn === cell.color ? s : flipped(s);
    for (const m of KD.legal(side, sq)) if (!m.power) m.captures.forEach(c => out.add(c));
    if (cell.type === 'archer') {
      for (const m of KD.legal(archerProbe(KD.board(s), sq, cell), sq)) if (m.kind === 'shoot') m.captures.forEach(c => out.add(c));
    }
  } catch { /* a position the probe cannot hold: show the real takes only */ }
  return [...out];
}

function readPiece(sq, cell = board.cells[sqi(sq)]) {
  if (!cell) return;
  board.clearSelection(false);
  board.clearMarks('shot'); board.clearMarks('selected');
  reading = sq;
  board.mark(sq, 'selected');
  board.figure(sq)?.classList.add('is-selected');
  const reach = reachOf(sq);
  if (reach.length) board.mark(reach, 'shot', { pop: true, from: sq });
  app.classList.add('coords-on');
  voice(`${whose(cell.color)} ${cell.type}`, cardLine(cell));
}
function endRead(restore = true) {
  if (!reading) return;
  board.figure(reading)?.classList.remove('is-selected');
  reading = null;
  board.clearMarks('shot'); board.clearMarks('selected');
  app.classList.remove('coords-on');
  if (restore) renderVoice();
}
// The finger lifts, the mouse leaves the piece, or a key: the reading ends. Capture phase: before the board's own tap.
// Coordinates show for a hold (readPiece) or a drag, never for a short tap.
let pressing = false, keyRead = false, downAt = null;
boardEl.addEventListener('pointerdown', e => { endRead(false); pressing = true; downAt = { x: e.clientX, y: e.clientY }; }, { capture: true });
addEventListener('pointerup', () => { pressing = false; downAt = null; if (!reading) app.classList.remove('coords-on'); else endRead(); });
addEventListener('pointercancel', () => { pressing = false; downAt = null; app.classList.remove('coords-on'); endRead(); });
boardEl.addEventListener('pointermove', e => {
  if (downAt && e.buttons && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) app.classList.add('coords-on');
  if (!reading || e.buttons) return;
  const i = board.squareAtPoint(e.clientX, e.clientY);
  if (i == null || i !== sqi(reading)) endRead();
});
boardEl.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') endRead(); });
boardEl.addEventListener('keydown', e => {
  keyRead = e.key === 'i' || e.key === 'I';
  if (reading && !keyRead) endRead(false);
}, { capture: true });

// ---- the cause line ----
function checkCause(s, color) {
  const st = KD.status(s);
  if (!color) { if (!st.check) return null; color = st.turn; }
  const king = KD.board(s).find(c => c && c.type === 'king' && c.color === color);
  if (!king) return null;
  try {
    const m = KD.legal(flipped(s)).find(x => x.captures.includes(king.sq));
    if (m) return { from: m.from, to: king.sq, check: true };
  } catch { /* none */ }
  return null;
}
const svgNS = 'http://www.w3.org/2000/svg';
let causeSvg = null;
function drawCause({ animateIt = true } = {}) {
  causeSvg?.remove(); causeSvg = null;
  if (!cause) return;
  const a = board.colRow(cause.from), b = board.colRow(cause.to);
  const G = 0.82; // the ground line of a square, where the feet stand
  const x1 = (a.col + 0.5) * 100, y1 = (a.row + G) * 100, x2 = (b.col + 0.5) * 100, y2 = (b.row + G) * 100;
  const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const sx = x1 + ux * 22, sy = y1 + uy * 22, ex = x2 - ux * 26, ey = y2 - uy * 26;
  const s = document.createElementNS(svgNS, 'svg');
  s.setAttribute('class', 'cause'); s.setAttribute('viewBox', '0 0 800 800'); s.setAttribute('preserveAspectRatio', 'none'); s.setAttribute('aria-hidden', 'true');
  s.style.setProperty('--c', cause.check ? 'var(--cause-check)' : 'var(--cause)');
  s.innerHTML = `<line class="halo" x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}"/><line class="ink" x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}"/>
    <circle class="end" cx="${sx}" cy="${sy}" r="5"/><path class="end" d="M${ex + ux * 8} ${ey + uy * 8} L${ex - ux * 10 - uy * 8} ${ey - uy * 10 + ux * 8} L${ex - ux * 10 + uy * 8} ${ey - uy * 10 - ux * 8} Z"/>`;
  board.layer.appendChild(s);
  causeSvg = s;
  if (animateIt) animate(s, [{ opacity: 0, clipPath: `inset(0 ${x2 < x1 ? 0 : 100}% 0 ${x2 < x1 ? 100 : 0}%)` }, { opacity: 1, clipPath: 'inset(0 0 0 0)' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

// ---- the strips, the voice and the moves line ----
function voice(say, sub = '') {
  const v = $('#voice');
  v.classList.toggle('is-end', false);
  $('#say').textContent = say;
  $('#sub').innerHTML = sub;
  animate(v, [{ opacity: 0.35 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
}
function renderVoice() {
  const s = board.state;
  if (!s) return;
  if (ended) { if (ended.ready) showResult(); else { $('#say').textContent = ''; $('#sub').textContent = ''; } return; }
  const st = KD.status(s);
  if (st.check && st.turn === ME) {
    const c = checkCause(s), piece = c && board.cells[sqi(c.from)];
    let why = piece ? `Their ${piece.type} attacks your king.` : '';
    if (piece?.type === 'archer') {
      const a = sqi(c.from), b = sqi(c.to), df = (b & 7) - (a & 7), dr = (b >> 3) - (a >> 3);
      const mid = Math.abs(df) <= 2 && Math.abs(dr) <= 2 && (Math.abs(df) === 2 || Math.abs(dr) === 2) && df % 2 === 0 && dr % 2 === 0 ? a + (dr / 2) * 8 + df / 2 : null;
      why = mid != null && board.cells[mid] ? `Their archer shoots over ${'abcdefgh'[mid & 7]}${(mid >> 3) + 1}.` : 'Their archer shoots your king.';
    }
    voice('Check.', why);
  } else if (st.turn === ME) {
    if (board.armed) voice('Freeze', 'Tap an enemy piece to freeze it.');
    else if (stories.at(-1)?.again && stories.at(-1)?.side === ME) voice('Now make your move.', '');
    else voice('Your move.', stories.length > 2 ? '' : 'Hold a piece to read it.');
  } else {
    // The caption names the side: under "Their move." a bare "The archer shot" reads as their archer.
    const last = stories.at(-1);
    voice('Their move.', last?.side === ME && last.moment ? last.moment.replace(/^(The|A) /, 'Your ') : '');
  }
}
function renderStrips() {
  const s = board.state, st = s ? KD.status(s) : null;
  const live = !!st && !st.over && !ended;
  $('#them').classList.toggle('is-turn', live && st.turn !== ME);
  $('#you').classList.toggle('is-turn', live && st.turn === ME);
  const mine = KD.usesLeft(s, ME), theirs = KD.usesLeft(s, ME === 'w' ? 'b' : 'w');
  const tp = $('#their-power'), mp = $('#my-power');
  tp.innerHTML = `${icon('sparkle')}<span>Strike</span><small>${theirs > 0 ? 'ready' : 'used'}</small>`;
  tp.setAttribute('aria-label', `Their power: Strike, ${theirs > 0 ? 'ready' : 'used'}. Read it.`);
  const canFreeze = mine > 0 && st && !st.over && st.turn === ME && board.isHuman(ME);
  mp.innerHTML = `${icon('sparkle')}<span>Freeze</span><small>${mine > 0 ? (board.armed === 'freeze' ? 'armed' : 'ready') : 'used'}</small>`;
  mp.disabled = !canFreeze && board.armed !== 'freeze';
  mp.setAttribute('aria-pressed', String(board.armed === 'freeze'));
}
function render() {
  renderStrips();
  renderVoice();
  const s = board.state, st = s && KD.status(s);
  $('#undo').disabled = !s || s.history.length < 3 || !!st.over || !!ended;
  $('#hint').disabled = !s || st.over || !!ended || st.turn !== ME;
  const last = stories.at(-1);
  const open = $('#moves-line').getAttribute('aria-expanded') === 'true';
  $('#ml-icon').innerHTML = last && !open ? pieceIcon(last.piece, last.side) : icon('moves');
  const moveNo = st?.moveNumber ?? 1;
  $('#ml-text').textContent = open ? `All moves · ${stories.length}` : last ? sentence(last) : moveNo > 1 ? `Move ${moveNo}.` : 'No moves yet.';
  $('#ctx').classList.toggle('is-ended', !!ended);
  // At the end the power controls step back: only the result speaks.
  for (const b of [$('#my-power'), $('#their-power')]) b.style.visibility = ended || st?.over ? 'hidden' : '';
  $('#moves-line').setAttribute('aria-label', `Moves. Last: ${last ? sentence(last) : 'none'} ${$('#moves-line').getAttribute('aria-expanded') === 'true' ? 'Hide all moves.' : 'Show all moves.'}`);
}
function storiesOf(state) {
  const chain = [state];
  while (chain[0].history.length) chain.unshift(KD.undo(chain[0]));
  return state.history.map((h, i) => KD.describe(chain[i], h.lan));
}
function renderStory({ fresh = false } = {}) {
  const startPly = (board.state?.pos?.ply ?? stories.length) - stories.length; // the ply of the first story (0: White's first move)
  const moveNo = board.state ? KD.status(board.state).moveNumber : 1;
  $('#story').innerHTML = stories.map((st, i) => {
    const ply = startPly + i, n = Math.floor(ply / 2) + 1;
    return `<li class="${fresh && i === stories.length - 1 ? 'is-new' : ''}"><span class="n">${n}${st.side === 'b' ? '…' : '.'}</span>${pieceIcon(st.piece, st.side)}<p>${sentence(st)}${st.moment ? `<small>${st.moment}</small>` : ''}</p></li>`;
  }).join('') || `<li><p>${moveNo > 1 ? `Move ${moveNo}.` : 'No moves yet.'}</p></li>`;
  const list = $('#story');
  list.scrollTop = list.scrollHeight;
}
/** On a desktop the list stays open (the column has room); on a phone it folds to one line. */
const listOpenByDefault = () => root.dataset.layout === 'desktop';
function setStory(open, { animateIt = true } = {}) {
  $('#moves-line').setAttribute('aria-expanded', String(open));
  $('#story').hidden = !open;
  $('#ctx').classList.toggle('is-open', open);
  if (!open && ended?.review) { ended.review = false; showResult(); }
  if (open) { renderStory(); if (animateIt) animate($('#story'), [{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' }); }
  render();
}
$('#moves-line').addEventListener('click', () => setStory($('#moves-line').getAttribute('aria-expanded') !== 'true'));
wide.addEventListener('change', () => setStory(listOpenByDefault(), { animateIt: false }));

// ---- the end: the king lies down, then two words settle ----
/** The result: in full (title, line, Rematch, Review), or folded to one line while Review shows the moves. */
function showResult() {
  if (!ended) return;
  const review = !!ended.review;
  $('#result-title').textContent = ended.title;
  $('#result-text').textContent = review ? ended.short : ended.text;
  $('#review').hidden = review;
  $('#voice').classList.toggle('is-review', review);
  $('#ctx').classList.toggle('is-review', review);
  const v = $('#voice');
  if (!v.classList.contains('is-end')) {
    v.classList.add('is-end');
    animate($('#result'), [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
}
let resultReady = Promise.resolve();
/**
 * The king lies down in its own square: turned 78 degrees, at 80 %, its head toward the middle of the board,
 * so it never covers a neighbour or the frame. The numbers come from the figure's own box in its square.
 */
function fallKing(sq) {
  const f = board.figure(sq), img = f?.querySelector('img');
  if (!f) return;
  if (img) {
    const [L, T, W, H] = ['left', 'top', 'width', 'height'].map(k => parseFloat(img.style[k]) / 100);
    const dir = board.colRow(sq).col >= 4 ? -1 : 1, a = dir * 78 * Math.PI / 180, S = 0.8;
    // transform-origin is 50% 90% of the image; the body's middle (feet at 100 %, head at 0 %) after the turn:
    const mx = L + W / 2 + 0.4 * H * S * Math.sin(a), my = T + 0.9 * H - 0.4 * H * S * Math.cos(a);
    f.style.setProperty('--fall-r', `${dir * 78}deg`);
    f.style.setProperty('--fall-t', `${((0.5 - mx) / W * 100).toFixed(1)}% ${((0.6 - my) / H * 100).toFixed(1)}%`);
  }
  f.classList.add('is-fallen');
}
function endGame(e) {
  ended = e;
  clearTimeout(resultTimer);
  // On a phone the result needs the room under the board: the list folds, and Review opens it again.
  if (!listOpenByDefault()) setStory(false, { animateIt: false });
  render();
  $('#voice').classList.remove('is-end');
  $('#say').textContent = ''; $('#sub').textContent = '';
  const delay = prefersReducedMotion() ? 0 : 700;
  resultReady = new Promise(r => { resultTimer = setTimeout(() => { e.ready = true; showResult(); r(); }, delay); });
}

// ---- show a game ----
function show(state, { human = 'both' } = {}) {
  clearTimeout(resultTimer);
  ended = null; reading = null; cause = null;
  $('#voice').classList.remove('is-review'); $('#ctx').classList.remove('is-review'); $('#review').hidden = false;
  app.classList.remove('coords-on');
  board.armed = null;
  board.play.human = human;
  board.setState(state);
  board.clearMarks('shot'); board.clearMarks('hint');
  stories = storiesOf(state);
  const st = KD.status(state);
  if (st.check) cause = checkCause(state);
  drawCause({ animateIt: false });
  $('#voice').classList.remove('is-end');
  renderStory();
  render();
}

// ---- the controls ----
$('#my-power').addEventListener('click', () => {
  if (board.armed === 'freeze') { board.arm(null); render(); return; }
  if ($('#my-power').disabled) return;
  endRead(false);
  board.arm('freeze');
  render();
});
$('#their-power').addEventListener('click', () => voice('Their power: Strike', `${POWER_LINE.Strike} ${POWER_MORE.Strike}`));
$('#hint').addEventListener('click', async () => {
  const s = board.state;
  if (!s || board.busy || ended || KD.status(s).turn !== ME) return;
  board.clearSelection(false); board.clearMarks('hint');
  $('#hint').disabled = true;
  const m = await KD.think(s, { level: 'club', ms: 600 });
  if (board.state !== s || !m) { render(); return; }
  board.mark([m.from, m.path?.at(-1) ?? m.to], 'hint');
  const cell = board.cells[sqi(m.from)];
  voice(`Try your ${cell?.type ?? 'piece'}.`, `${moveLabel(m)}.`);
  $('#hint').disabled = false;
});
$('#undo').addEventListener('click', () => {
  const s = board.state;
  if (!s || board.busy || s.history.length < 3) return;
  let back = s;
  const plies = KD.status(s).turn === ME ? 2 : 1;
  for (let i = 0; i < plies; i++) back = KD.undo(back);
  show(back, { human: board.play.human });
});
// A rematch is a new game: the same army code and the same two kings, from the first move.
$('#rematch').addEventListener('click', () => { show(KD.newGame({ army: ARMY, powers: POWERS }), { human: ME }); setStory(listOpenByDefault(), { animateIt: false }); toast('A new game. The same armies.'); });
// Review folds the result to one line and gives the moves the whole space under the board.
function openReview() {
  if (!ended) return;
  ended.review = true;
  showResult();
  setStory(true);
}
$('#review').addEventListener('click', () => { openReview(); $('#rematch').focus({ preventScroll: true }); });

// The menu: one plain sheet; Extra replaces its rows.
// ring: false focuses the first row as a mouse or touch open does (the still render has no real click).
const menuLevel = (extra, { ring } = {}) => {
  $('#menu-main').hidden = extra; $('#menu-extra').hidden = !extra; $('#menu-back').hidden = !extra;
  $('#menu-title').textContent = extra ? 'Extra' : 'Menu';
  (extra ? $('#menu-back') : $('#m-new')).focus({ preventScroll: true, focusVisible: ring });
};
$('#menu-btn').addEventListener('click', () => { $('#m-anim').checked = !prefersReducedMotion(); openSheet('menu'); menuLevel(false); $('#menu-btn').setAttribute('aria-expanded', 'true'); });
$('#menu').addEventListener('close', () => $('#menu-btn').setAttribute('aria-expanded', 'false'));
$('#m-extra').addEventListener('click', () => menuLevel(true));
$('#menu-back').addEventListener('click', () => menuLevel(false));
for (const b of $$('#menu-extra .menu-row, #m-guide')) b.addEventListener('click', () => toast('This page is not part of this demo.'));
$('#m-new').addEventListener('click', async () => { await closeSheet('menu'); show(KD.newGame({ army: 'random', powers: POWERS }), { human: ME }); });
$('#m-resign').addEventListener('click', async () => {
  await closeSheet('menu');
  const s = board.state;
  if (!s || KD.status(s).over || ended) return;
  board.play.human = 'both';
  board.clearSelection(false);
  const king = KD.board(s).find(c => c && c.type === 'king' && c.color === ME);
  if (king) fallKing(king.sq);
  endGame({ title: 'King Down', text: 'You resign. Flame wins.', short: 'Flame wins.' });
});
$('#m-sound').checked = !sfx.muted;
$('#m-sound').addEventListener('change', e => sfx.setMuted(!e.target.checked));
$('#m-anim').checked = !prefersReducedMotion();
// 'full' and 'reduce' both win over the system setting, so On always means motion.
$('#m-anim').addEventListener('change', e => { root.dataset.motion = e.target.checked ? 'full' : 'reduce'; });
for (const b of $$('.floor-pick')) b.addEventListener('click', () => setFloor(b.dataset.floor));

// Their move: "thinking" shows only after a second of waiting.
let thinkTimer = 0;
setInterval(() => {
  const s = board.state, st = s && KD.status(s);
  const waiting = !!st && !st.over && !board.isHuman(st.turn);
  if (waiting && !thinkTimer) thinkTimer = setTimeout(() => $('#thinking').classList.add('is-on'), 1000);
  if (!waiting) { clearTimeout(thinkTimer); thinkTimer = 0; $('#thinking').classList.remove('is-on'); }
}, 200);

// ---- the demo contract: state(name), play(), reset() ----
const STATES = ['rest', 'read', 'read-own', 'select', 'played', 'check', 'end', 'review', 'moves', 'menu', 'dark-rest', 'dark-read', 'dark-check', 'dark-end'];
let run = 0, current = 'rest';
async function quiet() {
  hideToast();
  if ($('#menu').open) await closeSheet('menu');
  setStory(listOpenByDefault(), { animateIt: false });
  board.arm(null);
}
async function cut() {
  // A cut to another game (P2): the table fades, never slides.
  if (prefersReducedMotion()) return;
  app.classList.add('is-cut');
  await wait(220);
}
window.demo = {
  async state(name) {
    run++;
    current = name;
    await quiet();
    const dark = name.startsWith('dark-'), base = dark ? name.slice(5) : name;
    setFloor(dark ? 'dark' : 'light');
    app.classList.remove('is-cut');
    switch (base) {
      case 'rest': show(p1()); break;
      case 'read': show(p1()); readPiece('b6'); break;
      case 'read-own': show(p1()); readPiece('a3'); break;
      case 'select': show(p1()); board.selectSquare('c3'); break;
      case 'played': show(p1()); await board.playMove('Aa3*a5'); break;
      case 'check': show(playAll(p1(), ['Aa3*a5'])); await board.playMove('Ab6-e3!'); break;
      case 'end': show(p2()); await board.playMove('Ae5-f6'); await resultReady; break;
      case 'review': show(p2()); await board.playMove('Ae5-f6'); await resultReady; openReview(); break;
      case 'moves': show(playAll(p1(), ['Aa3*a5', 'Ab6-e3!'])); setStory(true); break;
      case 'menu': show(p1()); openSheet('menu'); menuLevel(false, { ring: false }); break;
      default: throw new Error(`demo.state: no state "${name}"`);
    }
  },
  async play() {
    const me = ++run, alive = () => me === run;
    await quiet();
    app.classList.remove('is-cut');
    show(p1());
    const beat = ms => wait(ms, { instant: true });
    await beat(1100); if (!alive()) return;
    readPiece('b6');                                   // hold their Archer: her reach, her line
    await beat(1900); if (!alive()) return;
    endRead();
    await beat(400); if (!alive()) return;
    board.selectSquare('a3');
    await beat(1000); if (!alive()) return;
    await board.playMove('Aa3*a5'); if (!alive()) return;   // your shot, without moving
    await beat(1300); if (!alive()) return;
    await board.playMove('Ab6-e3!'); if (!alive()) return;  // their Strike: check, with its cause
    await beat(2400); if (!alive()) return;
    await board.playMove('f2xe3'); if (!alive()) return;
    await beat(1300); if (!alive()) return;
    await cut(); if (!alive()) return;
    show(p2());
    voice('Another game, near the end.', 'Your move.');
    app.classList.remove('is-cut');
    await beat(1300); if (!alive()) return;
    board.selectSquare('e5');
    await beat(1000); if (!alive()) return;
    await board.playMove('Ae5-f6'); if (!alive()) return;   // the king lies down
    await resultReady;
    await beat(1600);
  },
  async reset() {
    run++;
    await quiet();
    app.classList.remove('is-cut');
    show(p1(), { human: ME });
  },
};

// ← and → step through the states when the focus is not on the board or a control (for the owner).
addEventListener('keydown', e => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key) || e.target !== document.body) return;
  const i = STATES.indexOf(current), n = STATES[(i + (e.key === 'ArrowRight' ? 1 : -1) + STATES.length) % STATES.length];
  void window.demo.state(n);
});

// Start: ?state= shows one state; else the live game against the computer.
show(p1(), { human: ME });
setStory(listOpenByDefault(), { animateIt: false });
if (params.get('state')) void window.demo.state(params.get('state'));
