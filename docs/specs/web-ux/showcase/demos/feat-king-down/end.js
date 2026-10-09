// King Down: the end. The last move of a game, the result beside the board, a kind way back after a loss,
// and resign as "Lay your king down". All positions and moves come from the kit's engine (kit/kd.js).
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceIcon, pieceArt, emblemArt } from '../../kit/icons.js';
import { $, $$, toast, hideToast, openSheet, closeSheet, animate, wait, prefersReducedMotion, sfx, haptic } from '../../kit/ui.js';

// ---- the game: the showcase's shared positions (idea bank 6.1), Frost (Freeze) against Flame (Strike) ----
const POW = { powers: ['Frost:Freeze', 'Flame:Strike'] };
const P1_BEFORE = 'r1b2mk1/2p1p1pp/1a6/pp1o4/2g1S3/A1OP4/PP1G1PPP/R1B2MK1 b - - 0 11'; // P1 one ply early: Black then plays e7-e6
const P2 = 'r1b3rk/2p4p/4p3/pp2A3/2g5/2OP4/PP1G1PPP/R1B2MK1 w - - 0 24';            // P2: White mates in one
const FINAL_BLOW = 'Ae5-f6';
const REMATCH_ARMY = 'RABGKMSO';
// A real loss from P1: White (a Beginner) against the Club computer. Move 22, Guard d2 to c2, allows Bishop a6 mate.
const LOSS = ['Aa3*a5', 'Ab6-e3!', 'Mf1<>g1', 'Od5xe4', 'h2-h3', 'Ae3*f2', 'd3xe4', 'Ae3*c3', '!F:c7', 'Kf1-e2', 'Ra8xa3', 'b2xa3',
  'Ae3-d4', 'a3-a4', 'Ad4-c3', 'Bc1-b2', 'Ac3*b2', 'Ke2-d3', 'b5-b4', 'Ra1-f1', 'Gc4-c5', 'Gd2-c2', 'Bc8-a6'];
const LOSS_BETTER = 'Kd3-e2'; // the Club computer's move there; it allows no mate in one

const playAll = (s, lans) => lans.reduce((x, l) => KD.play(x, l), s);
const p1 = () => KD.play(KD.fromFen(P1_BEFORE, POW), 'e7-e6');
const p2 = () => KD.fromFen(P2, POW);

// The win's key moments: three real moves from the shared positions (P1, its scripted Strike, and P2).
// They are not one game: P2 cannot come from P1 by legal moves. Each tile has its own picture.
const WIN_MOMENTS = [
  { side: 'w', piece: 'archer', start: () => p1(), lan: 'Aa3*a5', text: 'Your shot', art: () => pieceIcon('archer', 'w', { className: 'tile-pic' }) },
  { side: 'b', piece: 'archer', start: () => KD.play(p1(), 'Aa3*a5'), lan: 'Ab6-e3!', text: 'Their Strike', art: () => `<img class="tile-pic" src="${emblemArt('flame')}" alt="">` },
  { side: 'w', piece: 'archer', start: p2, lan: FINAL_BLOW, text: 'Your final blow', slow: true, art: () => `<img class="tile-pic tile-fallen" src="${pieceArt('king', 'b', 'flame')}" alt="">` },
];

const NAME = { pawn: 'Pawn', knight: 'Knight', bishop: 'Bishop', rook: 'Rook', queen: 'Queen', king: 'King',
  archer: 'Archer', guard: 'Guard', maester: 'Maester', beast: 'Beast', ogre: 'Ogre', paladin: 'Paladin' };
const REASON = { checkmate: 'Checkmate', stalemate: 'Stalemate', draw50: 'Fifty moves, no take', drawRepetition: 'Same position three times', drawMaterial: 'Too little to mate' };
const who = side => (side === 'w' ? 'Your' : 'Their');
const reduced = () => prefersReducedMotion();

// ---- page parts ----
const app = $('#app');
const label = (el, name, text) => { el.innerHTML = `${icon(name)}<span>${text}</span>`; };
$('#menu-btn').innerHTML = icon('menu');
$('#menu-sheet [data-close]').innerHTML = icon('close');
label($('#hint'), 'hint', 'Hint');
label($('#undo'), 'undo', 'Undo');
label($('#review'), 'eye', 'Review');
label($('#new'), 'plus', 'New game');
label($('#ghost-again'), 'hint', 'Show a better move');
label($('#back-result'), 'back', 'Back to result');
label($('#moment-back'), 'back', 'Back to result');
$('#sound').checked = !sfx.muted;
$('#sound').addEventListener('change', e => sfx.setMuted(!e.target.checked));

const board = createBoard($('#board'), {
  play: { level: 'club', human: 'w', ms: 600 },
  label: 'King Down board. Arrow keys move, Enter or Space chooses, Escape cancels, I shows a piece.',
  onMove: story => onMove(story),
  // While "Lay your king down?" is open, the board only shows the game: no tap, no key plays a move.
  onTap: () => (app.dataset.phase === 'ask' ? false : ceremonyLive ? (skipCeremony(), false) : undefined),
});

// Overlays on the board's square layer: the veil, the cause line, the words. The replay caption sits in the tile slots.
const NS = 'http://www.w3.org/2000/svg';
const veil = document.createElement('div'); veil.className = 'kd-veil';
const line = document.createElementNS(NS, 'svg'); line.setAttribute('class', 'kd-line'); line.setAttribute('viewBox', '0 0 800 800'); line.setAttribute('preserveAspectRatio', 'none'); line.setAttribute('aria-hidden', 'true');
const words = document.createElement('div'); words.className = 'kd-words'; words.textContent = 'King Down'; words.setAttribute('aria-hidden', 'true');
board.layer.append(veil, line, words);
let ghost = null;

const fileOf = sq => sq.charCodeAt(0) - 97, rankOf = sq => +sq[1] - 1;
const centre = (sq, dy = 0.5) => [(fileOf(sq) + 0.5) * 100, (7 - rankOf(sq) + dy) * 100];

function clearBoardFx() {
  for (const el of [veil, words]) el.getAnimations?.().forEach(a => a.cancel());
  veil.classList.remove('is-on');
  line.replaceChildren();
  words.hidden = true;
  ghost?.remove(); ghost = null;
  board.clearMarks('hint'); board.clearMarks('check');
  for (const el of $$('.kdb-fig.kd-lit, .kdb-fig.is-leaning', board.layer)) el.classList.remove('kd-lit', 'is-leaning');
}

/**
 * The cause: a dashed line from each piece that gives mate toward the king. The red sight is the Archer's shot
 * mark (kit/board.js 'shot'), so it shows only when an Archer's shot reaches the king. Every other mate gets the
 * board's own check mark. checkers: [{ from, shot }]. place: where the fallen king lies ('in-place' or a side).
 */
function drawCause(checkers, kingSq, { draw = false, place = 'side' } = {}) {
  line.replaceChildren();
  board.clearMarks('check');
  const [kx, ky] = centre(kingSq, place === 'in-place' ? 0.62 : 0.55);
  const R = 42; // the sight's radius (one square = 100): the ring goes round the lying king, the ticks stay outside it
  const shot = checkers.some(c => c.shot);
  for (const { from } of checkers) {
    const [x0, y0] = centre(from, 0.42);
    const len = Math.hypot(kx - x0, ky - y0), stop = shot ? R + 4 : 26; // the line points at the king; it does not cross it
    const x = kx - (kx - x0) * stop / len, y = ky - (ky - y0) * stop / len;
    const g = document.createElementNS(NS, 'g');
    g.innerHTML = `<line x1="${x0}" y1="${y0}" x2="${x}" y2="${y}" stroke="rgba(40,24,10,.55)" stroke-width="7" stroke-linecap="round"/>
      <line x1="${x0}" y1="${y0}" x2="${x}" y2="${y}" stroke="#fff3d6" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="14 11"/>`;
    line.appendChild(g);
    if (draw) animate(g, [{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
  }
  if (!shot) { board.mark(kingSq, 'check'); return; }
  const sight = document.createElementNS(NS, 'g');
  const ticks = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => `M${kx + dx * (R + 1)} ${ky + dy * (R + 1)}L${kx + dx * (R + 13)} ${ky + dy * (R + 13)}`).join('');
  sight.innerHTML = `<circle cx="${kx}" cy="${ky}" r="${R}" fill="none" stroke="rgba(40,24,10,.55)" stroke-width="6"/>
    <path d="${ticks}" stroke="rgba(40,24,10,.55)" stroke-width="7" stroke-linecap="round"/>
    <circle cx="${kx}" cy="${ky}" r="${R}" fill="none" stroke="#d8392b" stroke-width="3"/>
    <path d="${ticks}" stroke="#d8392b" stroke-width="3.5" stroke-linecap="round"/>`;
  line.appendChild(sight);
  if (draw) animate(sight, [{ opacity: 0, transform: 'scale(1.4)', transformOrigin: `${kx}px ${ky}px` }, { opacity: 1, transform: 'scale(1)', transformOrigin: `${kx}px ${ky}px` }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

/** The pieces that give mate: in the final position with the turn handed over, the moves that would take the king. */
function checkersOf(final, kingSq) {
  try {
    const fen = KD.toFen(final);
    const flipped = fen.replace(/ ([wb]) /, (_, t) => ` ${t === 'w' ? 'b' : 'w'} `);
    const spec = k => (k ? `${k.king}:${k.power}` : null);
    const g = KD.fromFen(flipped, final.kings[0] || final.kings[1] ? { powers: [spec(final.kings[0]), spec(final.kings[1])] } : {});
    const by = new Map();
    for (const m of KD.legal(g)) if (m.captures.includes(kingSq)) by.set(m.from, (by.get(m.from) ?? false) || m.kind === 'shoot');
    return [...by].map(([from, shot]) => ({ from, shot }));
  } catch { return []; }
}

const kingOf = (state, color) => KD.board(state).find(c => c && c.type === 'king' && c.color === color);
/**
 * Lay a king down. It falls toward an empty square beside it, so it stays on the board and covers little.
 * With no empty square beside it (the edge, or a piece on each side), it lies down inside its own square.
 * Returns where it lies: 'left', 'right' or 'in-place'.
 */
function fall(sq, on = true) {
  const el = board.figure(sq);
  if (!el) return 'right';
  const f = fileOf(sq), cells = KD.board(board.state ?? p2());
  const free = df => f + df >= 0 && f + df <= 7 && !cells[KD.sq.index(sq) + df];
  const l = free(-1), r = free(1);
  const place = !l && !r ? 'in-place' : l && !r ? 'left' : r && !l ? 'right' : f >= 4 ? 'left' : 'right';
  // In place, the head points into the board, away from the edge.
  el.classList.toggle('fall-left', on && (place === 'left' || (place === 'in-place' && f >= 4)));
  el.classList.toggle('fall-in-place', on && place === 'in-place');
  el.classList.toggle('is-fallen', on);
  return place;
}
const lit = sq => board.figure(sq)?.classList.add('kd-lit');

// ---- the result ----
let info = null;          // the game that ended: { final, prev, story, win, loss, resign, reason, moveNumber, retry }
let ending = new URLSearchParams(location.search).get('ending') === 'ceremony' ? 'ceremony' : 'quiet';
let ceremonyLive = false, ceremonyToken = 0, lastMode = 'quiet';

function chainOf(state) { const c = [state]; while (c[0].history.length) c.unshift(KD.undo(c[0])); return c; }
function allowsMate(q) {
  const st = KD.status(q);
  if (st.over || st.turn !== 'b') return false;
  return KD.legal(q).some(r => KD.status(KD.play(q, r)).reason === 'checkmate');
}

/** Retry: the last move of yours that let the computer mate, and a move there that does not. */
async function findRetry(final, { better } = {}) {
  const chain = chainOf(final);
  for (let i = chain.length - 2; i >= 0; i--) {
    const pre = chain[i];
    if (KD.status(pre).turn !== 'w') continue;
    if (!allowsMate(chain[i + 1])) return null;
    const safe = KD.legal(pre).filter(m => !m.pass && !m.needsArming && !allowsMate(KD.play(pre, m)));
    if (!safe.length) return null;
    let pick = better && safe.find(m => m.lan === better);
    if (!pick) { const ai = await KD.think(pre, { level: 'club', ms: 500 }); pick = safe.find(m => m.lan === ai?.lan) ?? safe[0]; }
    const played = KD.describe(pre, final.history[i].lan);
    return { pre, played, better: pick, moveNumber: KD.status(pre).moveNumber };
  }
  return null;
}

function infoFor(final, extra = {}) {
  const st = KD.status(final);
  const story = extra.story ?? (final.history.length ? KD.describe(KD.undo(final), final.history.at(-1).lan) : null);
  const prev = final.history.length ? KD.undo(final) : null;
  return { final, prev, story, st, win: st.winner === 'w', loss: st.winner === 'b', draw: st.over && !st.winner, moveNumber: KD.status(prev ?? final).moveNumber, ...extra };
}

/** Fill the result pane for info. tiles: 'tiles' (ceremony), 'fold' (quiet), or none. */
function renderResult({ tiles = 'fold' } = {}) {
  const { story, st } = info;
  const title = $('#end-title'), cause = $('#end-cause');
  if (info.resign) {
    $('#end-eyebrow').textContent = `Move ${info.moveNumber}`;
    title.textContent = 'The computer wins';
    cause.innerHTML = `${pieceIcon('king', 'w')}<span>You laid your king down.</span>`;
  } else if (info.draw) {
    $('#end-eyebrow').textContent = `${REASON[st.reason] ?? 'Draw'} · Move ${info.moveNumber}`;
    title.textContent = 'Draw';
    cause.innerHTML = '<span>Neither king falls.</span>';
  } else {
    $('#end-eyebrow').textContent = `Checkmate · Move ${info.moveNumber}`;
    title.textContent = info.win ? 'You win' : 'The computer wins';
    const at = story.kind === 'shoot' ? story.from : story.to;
    const text = story.piece === 'archer' && story.kind !== 'shoot'
      ? `${who(story.side)} Archer on ${at} can shoot the king.`
      : `${who(story.side)} ${NAME[story.piece] ?? story.piece} on ${at} gives mate.`;
    cause.innerHTML = `${pieceIcon(story.piece, story.side)}<span>${text}</span>`;
  }
  title.classList.toggle('is-long', title.textContent.length > 12);

  const m = $('#moments');
  m.replaceChildren();
  m.classList.remove('is-waiting');
  if (info.win && tiles === 'tiles') m.appendChild(tileList());
  else if (info.win && tiles === 'fold') m.appendChild(foldRow());
  else if (info.loss && info.retry) m.appendChild(keyMomentRow(info.retry));

  const retry = $('#retry');
  retry.hidden = !(info.loss && info.retry);
  if (info.retry) label(retry, 'undo', `Retry from move ${info.retry.moveNumber}`);
  $('#rematch-sub').textContent = 'Same army · Club';
}

/** The three key-moment tiles. In B they wait as quiet spacers, with the replay caption in their place. */
function tileList({ id = 'tiles-head' } = {}) {
  const box = document.createElement('div');
  box.innerHTML = `<p class="tiles-head" id="${id}">Moves to look at again</p>
    <div class="tiles-wrap">
      <div class="tiles" role="list" aria-labelledby="${id}">${WIN_MOMENTS.map((k, i) => {
        const n = KD.status(k.start()).moveNumber;
        return `<div role="listitem"><button type="button" class="tile${k.side === 'b' ? ' theirs' : ''}" data-moment="${i}" style="--i:${i}">
          ${k.art()}<div><b>Move ${n}</b><span>${k.text}</span></div></button></div>`;
      }).join('')}</div>
      <p class="replay-cap" aria-hidden="true"><b>The final blow</b><span>Half speed · Tap the board to skip</span></p>
    </div>`;
  for (const b of box.querySelectorAll('[data-moment]')) b.addEventListener('click', () => showMoment(WIN_MOMENTS[+b.dataset.moment]));
  return box;
}

function foldRow() {
  const box = document.createElement('div');
  box.innerHTML = `<button type="button" class="fold-row" aria-expanded="false" aria-controls="fold-tiles">${icon('moves')}<span>3 moves to look at again<small>A shot, a Strike and the final blow</small></span>${icon('chevron')}</button><div id="fold-tiles" hidden></div>`;
  const btn = box.querySelector('.fold-row'), host = box.querySelector('#fold-tiles');
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    host.hidden = !open;
    host.replaceChildren();
    if (open) {
      const list = tileList({ id: 'fold-tiles-head' });
      list.querySelector('.tiles-head').hidden = true;
      list.querySelector('.replay-cap').remove();
      list.style.paddingTop = 'var(--space-2)';
      for (const t of list.querySelectorAll('.tile')) t.classList.add('is-in');
      host.appendChild(list);
    }
  });
  return box;
}

function keyMomentRow(r) {
  const box = document.createElement('div');
  box.className = 'km';
  // Only the costly move: the better move waits in Retry, so the player can find it first.
  const p = r.played;
  box.innerHTML = `<img src="${pieceArt(p.piece, 'w')}" alt=""><p>Move ${r.moveNumber}: ${NAME[p.piece]} ${p.from} to ${p.to} allowed mate.</p>`;
  return box;
}

function setPhase(p) { app.dataset.phase = p; }

/** The still end frame of the game in info: the board, the fallen king, the cause, the result pane. */
function endFrame({ mode = 'quiet' } = {}) {
  clearBoardFx();
  board.play.human = 'both';
  board.setState(info.final);
  const loserColor = info.win ? 'b' : 'w';
  const king = kingOf(info.final, loserColor);
  if (!info.draw && king) {
    app.classList.add('is-still'); // a still frame: the king is already down, no second fall
    const place = fall(king.sq);
    void app.offsetWidth;
    app.classList.remove('is-still');
    if (!info.resign) drawCause(checkersOf(info.final, king.sq), king.sq, { place });
  }
  if (mode === 'ceremony' && info.win) {
    veil.classList.add('is-on');
    words.hidden = false;
    lit(king.sq);
    for (const c of checkersOf(info.final, king.sq)) lit(c.from);
  }
  renderResult({ tiles: mode === 'ceremony' ? 'tiles' : 'fold' });
  for (const t of $$('#moments .tile')) t.classList.remove('is-in');
  setPhase('end');
}

// ---- the live end: the move lands, then the chosen ending ----
async function endGame(story) {
  info = infoFor(board.state, { story });
  lastMode = info.win && ending === 'ceremony' ? 'ceremony' : 'quiet';
  if (info.win && ending === 'ceremony') return runCeremony();
  // A (and every loss or draw): the king lies down where it stands; the result sits beside the board at once.
  renderResult({ tiles: 'fold' });
  setPhase('end');
  enterPane($('#pane-end'));
  const king = kingOf(info.final, info.win ? 'b' : 'w');
  if (king && !info.draw) { const place = fall(king.sq); drawCause(checkersOf(info.final, king.sq), king.sq, { draw: true, place }); }
  if (info.loss) {
    const me = info;
    const r = await findRetry(info.final);
    if (me !== info || !r) return;
    info.retry = r;
    renderResult({ tiles: 'fold' });
    animate($('#retry'), [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
}

function enterPane(el) {
  animate(el, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

/** The board one beat into B: the position before the blow under the veil, the two actors lit, no cause yet. */
function replayStart(prev, story, kingSq) {
  board.clearMarks();
  board.setBoard(KD.board(prev), { keepMarks: true });
  lit(story.from); lit(kingSq);
  veil.classList.add('is-on');
  $('#moments').classList.add('is-waiting'); // the tile slots hold their place; the caption sits in them
}

/** B: a 120 ms stop, the final blow again at half speed under a veil, the king falls, "King Down" settles, the tiles rise. Rematch works from the first frame. */
async function runCeremony() {
  const token = ++ceremonyToken;
  const { story, prev, final } = info;
  renderResult({ tiles: 'tiles' });
  $('#moments').classList.add('is-waiting');
  $('#moments .replay-cap').hidden = true;
  setPhase('end');
  enterPane($('#pane-end'));
  if (reduced()) return ceremonyEnd(token);
  ceremonyLive = true;
  const live = () => token === ceremonyToken;
  const king = kingOf(final, 'b');
  fall(king.sq, false); // no first fall: the king falls once, in the replay
  await wait(120);
  if (!live()) return;
  // Back to the position before the blow; the veil comes down; the two actors stay lit.
  replayStart(prev, story, king.sq);
  const cap = $('#moments .replay-cap');
  cap.hidden = false;
  animate(cap, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
  await animate(veil, [{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
  if (!live()) return;
  const sound = board.o.sound;
  board.o.sound = false; board.o.speed = 0.5;
  await board.animate(story); // the same move, at half speed; the board lays the king down at its end
  board.o.sound = sound; board.o.speed = 1;
  if (!live()) return;
  const place = fall(king.sq); // the board laid it down; this picks where it lies
  const checkers = checkersOf(final, king.sq);
  lit(story.to); lit(king.sq);
  for (const c of checkers) lit(c.from);
  drawCause(checkers, king.sq, { draw: true, place });
  await wait(560);
  if (!live()) return;
  sfx.capture(); haptic(20);
  cap.hidden = true;
  words.hidden = false;
  await animate(words, [{ opacity: 0, letterSpacing: '.42em', transform: 'translateY(8px)' }, { opacity: 1, letterSpacing: '.14em', transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
  if (!live()) return;
  $('#moments').classList.remove('is-waiting');
  for (const t of $$('#moments .tile')) t.classList.add('is-in');
  ceremonyLive = false;
}

function ceremonyEnd(token = ++ceremonyToken) {
  void token;
  ceremonyLive = false;
  board.o.speed = 1; board.o.sound = true;
  endFrame({ mode: 'ceremony' });
}
function skipCeremony() { if (ceremonyLive) ceremonyEnd(); }
$('.board-wrap').addEventListener('pointerdown', () => skipCeremony(), { capture: true });
// Escape skips from anywhere; Space and Enter skip on the board.
document.addEventListener('keydown', e => {
  if (!ceremonyLive) return;
  if (e.key === 'Escape' || ([' ', 'Enter'].includes(e.key) && e.target.closest?.('.board-wrap'))) { e.preventDefault(); skipCeremony(); }
});

// ---- play ----
/** Stop the ending, clear the board's extras and forget the result. The board itself stays as it is. */
function resetView(human = 'both') {
  ceremonyToken++; ceremonyLive = false;
  board.o.speed = 1;
  clearBoardFx();
  info = null;
  board.play.human = human;
}

function showPlay(state, { human = 'w', title = 'Your move', sub = '' } = {}) {
  resetView(human);
  board.setState(state);
  setPhase('play');
  $('#play-title').textContent = title;
  $('#play-sub').textContent = sub;
  $('#undo').disabled = state.history.length < 2;
}

function onMove(story) {
  removeGhost();
  const st = KD.status(board.state);
  if (app.dataset.phase === 'moment') {
    // A review shows a move; it is not play. A reviewed mate ends on the same board as the result, and the pane stays.
    const king = st.winner && kingOf(board.state, st.winner === 'w' ? 'b' : 'w');
    if (king) { const place = fall(king.sq); drawCause(checkersOf(board.state, king.sq), king.sq, { draw: true, place }); }
    return;
  }
  if (st.over) { endGame(story); return; }
  if (app.dataset.phase === 'retry') setPhase('play');
  $('#play-title').textContent = board.isHuman(st.turn) ? (st.check ? 'Check: your move' : 'Your move') : 'The computer thinks';
  $('#play-sub').textContent = board.isHuman(st.turn) ? '' : story.text;
  $('#undo').disabled = board.state.history.length < 2;
}

$('#hint').addEventListener('click', async () => {
  const s = board.state;
  if (!s || KD.status(s).over || board.busy) return;
  const m = await KD.think(s, { level: 'club', ms: 500 });
  if (!m || board.state !== s) return;
  board.selectSquare(m.from);
  board.mark(m.to, 'hint');
  $('#play-sub').textContent = `Hint: your ${NAME[KD.board(s)[KD.sq.index(m.from)].type]} on ${m.from}.`;
});
$('#undo').addEventListener('click', () => {
  const s = board.state;
  if (!s || s.history.length < 2 || board.busy) return;
  showPlay(KD.undo(KD.undo(s)), { sub: '' });
});

// ---- after the end ----
$('#rematch').addEventListener('click', () => {
  showPlay(KD.newGame({ army: REMATCH_ARMY, ...POW }), { sub: 'Same army. You play White.' });
  toast('Rematch: same army, same level');
});
$('#new').addEventListener('click', () => {
  showPlay(KD.newGame({ army: 'random', ...POW }), { sub: 'A new army.' });
  toast('New game: a new random army');
});
$('#review').addEventListener('click', () => {
  if (!info?.story) return;
  showMoment({ side: info.story.side, piece: info.story.piece, start: () => info.prev, lan: info.story.lan, slow: info.win });
});
$('#retry').addEventListener('click', () => info?.retry && startRetry());
$('#ghost-again').addEventListener('click', () => info?.retry && showBetter(info.retry));
$('#back-result').addEventListener('click', () => backToResult());
$('#moment-back').addEventListener('click', () => backToResult());

function backToResult() {
  if (!info) return;
  endFrame({ mode: lastMode });
  $('#end-title').focus({ preventScroll: true });
}

/** Review one move: the board before it, then the move (the final blow at half speed). */
async function showMoment(k) {
  const me = ++momentRun;
  ceremonyToken++; ceremonyLive = false;
  clearBoardFx();
  board.play.human = 'both';
  const start = k.start();
  board.setState(start);
  const story = KD.describe(start, k.lan);
  $('#moment-eyebrow').textContent = `Move ${KD.status(start).moveNumber} · Review`;
  $('#moment-title').textContent = story.text.replace(/^White /, 'Your ').replace(/^Black /, 'Their ');
  $('#moment-sub').textContent = story.moment ?? (story.mate ? 'Checkmate. The king has no escape.' : '');
  setPhase('moment');
  $('#moment-title').focus({ preventScroll: true });
  await wait(350, { instant: true });
  if (me !== momentRun) return;
  board.o.speed = k.slow ? 0.5 : 1;
  await board.playMove(k.lan);
  board.o.speed = 1;
}
let momentRun = 0;

/** Retry: the board goes back to the costly move, and you try again. A ghost shows a better move only when you ask. Play goes on. */
async function startRetry() {
  const r = info.retry;
  ceremonyToken++; ceremonyLive = false;
  clearBoardFx();
  board.play.human = 'w';
  board.setState(r.pre);
  fillRetry(r);
  setPhase('retry');
  $('#retry-title').focus({ preventScroll: true });
}

function fillRetry(r) {
  const p = r.played;
  $('#retry-eyebrow').textContent = `Retry · Move ${r.moveNumber}`;
  $('#retry-sub').textContent = 'Find a move that stops the mate.';
  $('#retry-last').innerHTML = `<img src="${pieceArt(p.piece, 'w')}" alt=""><p>Last time: ${NAME[p.piece]} ${p.from} to ${p.to}.<small>Then their reply gave mate.</small></p>`;
}

/** The answer, on request: the ghost plays the better move once, then rests faint on its square. */
async function showBetter(r) {
  const b = KD.describe(r.pre, r.better);
  $('#retry-sub').textContent = `The ghost shows ${NAME[b.piece]} to ${b.to}.`;
  await showGhost(r.better);
}

function removeGhost() { ghost?.remove(); ghost = null; board.clearMarks('hint'); }
async function showGhost(m, { move = true } = {}) {
  removeGhost();
  const fig = board.figure(m.from);
  if (!fig) return;
  board.mark([m.from, m.to], 'hint');
  const g = fig.cloneNode(true);
  g.classList.remove('is-selected', 'is-fallen', 'kd-lit');
  g.classList.add('kd-ghost');
  g.setAttribute('aria-hidden', 'true');
  board.layer.appendChild(g);
  ghost = g;
  const place = sq => { g.style.left = `${fileOf(sq) * 12.5}%`; g.style.top = `${(7 - rankOf(sq)) * 12.5}%`; g.style.zIndex = String(12 + (7 - rankOf(sq)) * 3); };
  place(m.from);
  if (move && !reduced() && m.to !== m.from) {
    await wait(250);
    if (ghost !== g) return;
    await board.slide(g, m.from, m.to, { dur: 700 });
  }
  if (ghost === g) place(m.to);
}

// ---- resign: "Lay your king down" ----
$('#menu-btn').addEventListener('click', () => openSheet('menu-sheet'));
for (const b of $$('[data-soon]')) b.addEventListener('click', async () => { await closeSheet('menu-sheet'); toast('This demo shows the end of a game.'); });
$('#resign-row').addEventListener('click', async () => {
  await closeSheet('menu-sheet');
  const s = board.state;
  if (!s || KD.status(s).over) { toast('The game is over.'); return; }
  askResign();
});
for (const c of $$('[data-ending]', $('#menu-sheet'))) c.addEventListener('click', () => setEnding(c.dataset.ending));
function setEnding(e) {
  ending = e;
  app.dataset.ending = e;
  for (const c of $$('[data-ending]', $('#menu-sheet'))) c.setAttribute('aria-pressed', String(c.dataset.ending === e));
}
setEnding(ending);

function askResign({ focus = true } = {}) {
  const s = board.state;
  board.play.human = 'both'; // only to hold the computer; the board takes no input in this phase (onTap, end.css)
  board.clearSelection();
  const king = kingOf(s, 'w');
  setPhase('ask');
  if (king) board.figure(king.sq)?.classList.add('is-leaning');
  if (focus) $('#ask-keep').focus({ preventScroll: true });
}
$('#ask-keep').addEventListener('click', () => {
  for (const el of $$('.kdb-fig.is-leaning')) el.classList.remove('is-leaning');
  board.play.human = 'w';
  setPhase('play');
  $('#menu-btn').focus({ preventScroll: true }); // the question came from Menu: the focus goes back there
  board.maybeAi();
});
$('#ask-yes').addEventListener('click', () => { layDown({ animated: true }); $('#rematch').focus({ preventScroll: true }); });

function layDown({ animated }) {
  const s = board.state;
  const king = kingOf(s, 'w');
  info = { ...infoFor(s), resign: true, win: false, loss: true, draw: false, retry: null, moveNumber: KD.status(s).moveNumber };
  for (const el of $$('.kdb-fig.is-leaning')) el.classList.remove('is-leaning');
  if (king) fall(king.sq);
  renderResult({ tiles: 'none' });
  setPhase('end');
  if (animated) { enterPane($('#pane-end')); sfx.capture(); haptic(20); }
}

// ---- the demo contract (kit README): state(name), play(), reset() ----
let run = 0;
const tag = text => { const t = $('#demo-tag'); t.hidden = !text; t.textContent = text || ''; };
const lossFinal = () => playAll(p1(), LOSS);
async function lossInfo() {
  const final = lossFinal();
  const i = infoFor(final);
  i.retry = await findRetry(final, { better: LOSS_BETTER });
  return i;
}
function closeAll() { hideToast(); if ($('#menu-sheet').open) $('#menu-sheet').close(); tag(''); }

window.demo = {
  async state(name) {
    run++; momentRun++;
    closeAll();
    resetView(); // each state then puts its own game on the board (no figure is made and dropped at once)
    switch (name) {
      case 'quiet':
        lastMode = 'quiet';
        info = infoFor(KD.play(p2(), FINAL_BLOW));
        endFrame({ mode: 'quiet' });
        break;
      case 'ceremony':
        lastMode = 'ceremony';
        info = infoFor(KD.play(p2(), FINAL_BLOW));
        endFrame({ mode: 'ceremony' });
        break;
      case 'final-blow': {
        // B, one beat in: the position before the blow under the veil, the Archer and the king lit, no cause line yet.
        // The result and Rematch are already there; the caption sits in the tile slots.
        lastMode = 'ceremony';
        info = infoFor(KD.play(p2(), FINAL_BLOW));
        endFrame({ mode: 'ceremony' });
        clearBoardFx();
        replayStart(info.prev, info.story, kingOf(info.final, 'b').sq);
        break;
      }
      case 'loss':
        lastMode = 'quiet';
        info = await lossInfo();
        endFrame({ mode: 'quiet' });
        break;
      case 'retry': {
        lastMode = 'quiet';
        info = await lossInfo();
        clearBoardFx();
        board.play.human = 'both';
        board.setState(info.retry.pre);
        fillRetry(info.retry);
        setPhase('retry'); // the first frame: your move again, no answer on the board yet
        break;
      }
      case 'resign':
        showPlay(p1(), { human: 'both', sub: '' });
        askResign({ focus: false });
        break;
      case 'laid-down':
        showPlay(p1(), { human: 'both', sub: '' });
        layDown({ animated: false });
        break;
      default: throw new Error(`demo.state: no state "${name}"`);
    }
  },

  // A, then B, then a loss with Retry, then resign: about 20 s.
  async play() {
    const me = ++run;
    const go = () => me === run;
    closeAll();
    const startWin = async (label, mode) => {
      tag(label);
      setEnding(mode);
      showPlay(p2(), { human: 'w', sub: 'Mate in one. Find it.' });
      await wait(800);
      if (!go()) return false;
      board.selectSquare('e5');
      await wait(900);
      if (!go()) return false;
      await board.playMove(FINAL_BLOW); // onMove starts the ending
      return go();
    };
    if (!await startWin('A · Quiet', 'quiet')) return;
    lastMode = 'quiet';
    await wait(2600); if (!go()) return;
    if (!await startWin('B · Ceremony', 'ceremony')) return;
    lastMode = 'ceremony';
    await wait(3400); if (!go()) return;
    // After a loss: the key moment and Retry. The board goes back; then "Show a better move" plays the ghost.
    tag('After a loss');
    setEnding('quiet');
    lastMode = 'quiet';
    info = await lossInfo();
    if (!go()) return;
    endFrame({ mode: 'quiet' });
    const k = kingOf(info.final, 'w');
    fall(k.sq, false);
    await wait(500); if (!go()) return;
    fall(k.sq, true);
    await wait(1900); if (!go()) return;
    await startRetry();
    await wait(1400); if (!go()) return;
    $('#ghost-again').classList.add('is-pressed');
    await wait(200); if (!go()) return;
    $('#ghost-again').classList.remove('is-pressed');
    await showBetter(info.retry);
    await wait(1400); if (!go()) return;
    // Resign as a gesture.
    tag('Resign');
    showPlay(p1(), { human: 'both', sub: '' });
    await wait(600); if (!go()) return;
    askResign({ focus: false });
    await wait(1500); if (!go()) return;
    layDown({ animated: true });
    await wait(1600);
    if (go()) tag('');
  },

  async reset() {
    run++; momentRun++;
    closeAll();
    setEnding(new URLSearchParams(location.search).get('ending') === 'ceremony' ? 'ceremony' : 'quiet');
    showPlay(p2(), { human: 'w', sub: 'Mate in one. Find it.' });
  },
};

// First view: your move in P2, ready for a person to find the final blow.
showPlay(p2(), { human: 'w', sub: 'Mate in one. Find it.' });
