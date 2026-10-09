// The first minute: from the title to the first real move.
// Option A (recommended): one button, "Take your first shot". The first tap of the app is an Archer shot
// over a row of pawns, on a close view of the real board. The view then pulls back: the same board,
// with the Archer still in her place, is a full game against the Beginner computer.
// Option B: the advisors' title, "Learn the new pieces" first and Play second, one Archer lesson, then a choice.
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceIcon, pieceArt } from '../../kit/icons.js';
import { $, toast, hideToast, animate, wait, prefersReducedMotion, sfx } from '../../kit/ui.js';

// ---- the positions (checked with the kit's engine) ----
// Deal 83 is a real random deal: back rank QRNAKBBS. It holds one Archer, one Beast and chess pieces only,
// so the first game shows only the two starter pieces (docs/PROGRESSION.md; idea bank 3.2, card 1).
const SEED = 83;
// The first shot: White's own home ranks of that deal, and one enemy pawn on d3. The Archer on d1 has one
// legal move: she shoots the pawn over her own pawn on d2, without moving (Ad1*d3).
const SHOT_FEN = '4k3/8/8/8/8/3p4/PPPPPPPP/QRNAKBBS w - - 0 1';
const ARCHER = 'd1', TARGET = 'd3', SHOT = 'Ad1*d3';
const PLAY = { level: 'beginner', human: 'w', ms: 500, pause: 450 };
const newGame = () => KD.newGame({ army: 'random', seed: SEED });

const app = $('#app'), title = $('#title'), table = $('#table'), stage = $('#stage'), zoom = $('#zoom');
const cap = s => s[0].toUpperCase() + s.slice(1);

// ---- the title ----
const LINEUP = [['pawn', 'b', 0.74], ['knight', 'w', 0.79], ['bishop', 'b', 0.87], ['rook', 'w', 0.96], ['queen', 'b', 0.79],
  ['king', 'w', 0.81], ['archer', 'b', 0.72], ['paladin', 'w', 0.86], ['guard', 'b', 0.78], ['maester', 'w', 0.66], ['beast', 'b', 0.87], ['ogre', 'w', 1]];
$('#lineup').innerHTML = LINEUP.map(([t, c, h], i) =>
  `<li style="--h:${h};--i:${i}"${t === 'archer' ? ' class="is-archer"' : ''}><img src="${pieceArt(t, c)}" alt="" decoding="async"><span>${pieceIcon(t)}${cap(t)}</span></li>`).join('');

const COPY = {
  a: { first: `${pieceIcon('archer')}<span>Take your first shot</span>`, play: 'Play a game' },
  b: { first: `${icon('book')}<span>Learn the new pieces</span>`, play: `${icon('play')}<span>Play</span>` },
};
// The words on the board's coach line, for each option. Eight words or fewer in each line.
const WORDS = {
  a: {
    start: { main: 'Tap your Archer.', sub: 'She can shoot over pieces.' },
    aim: { main: 'Now tap the pawn.', sub: 'She shoots without moving.' },
    hit: { main: 'A clean shot.', sub: 'She did not move.' },
  },
  b: {
    start: { main: 'Tap your Archer, then the pawn.', sub: 'She shoots without moving.' },
    aim: { main: 'Now tap the pawn.', sub: 'She shoots without moving.' },
    hit: { main: 'A clean shot.', sub: 'Your Archer stays here.' },
  },
};
const NUDGE = 'Start with your Archer.';
const LINES = {
  archer: 'Shoots without moving, even over other pieces.',
  guard: 'Only a king can take it. It never takes.',
  maester: 'Swaps with a friend next to it.',
  beast: 'After each bite, it can bite again.',
  ogre: 'Shoves a neighbour, then steps in.',
  paladin: 'Jumps its own pieces. Taking more than a pawn costs it.',
};

let variant = 'a';
function setVariant(v) {
  variant = v;
  app.dataset.variant = v;
  $('#go-first').innerHTML = COPY[v].first;
  $('#go-play').innerHTML = COPY[v].play;
}

// ---- static controls ----
$('#back').innerHTML = icon('back');
$('#lesson-icon').innerHTML = pieceIcon('archer', 'w');
$('#next-piece').innerHTML = `${pieceIcon('beast', 'w')}<span>Next: the Beast</span>`;
$('#done-play').innerHTML = `${icon('play')}<span>Play a game</span>`;
$('#hint').innerHTML = `${icon('hint')}<span>Hint</span>`;
$('#undo').innerHTML = `${icon('undo')}<span>Undo</span>`;
$('#menu').innerHTML = `${icon('menu')}<span>Menu</span>`;

// ---- the coach line ----
function setCoach({ piece = null, side = 'w', main = '', sub = '', quiet = false } = {}, { fade = true } = {}) {
  $('#coach-icon').innerHTML = piece ? pieceIcon(piece, side) : '';
  $('#coach-main').textContent = main;
  $('#coach-sub').textContent = sub;
  $('#coach').classList.toggle('is-quiet', quiet);
  if (fade) animate($('#coach-line'), [{ opacity: 0, translate: '0 6px' }, { opacity: 1, translate: '0 0' }], { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
}
const words = key => WORDS[variant][key];

/** A piece's name in a line: the new pieces have a capital letter, as on the coach line ("Archer", "pawn"). */
const pieceName = t => (LINES[t] ? cap(t) : t);
/** The last move in the player's words: "Their pawn moves to e5." */
function lastLine(st) {
  const who = st.side === 'w' ? 'Your' : 'Their', v = st.captured?.[0] && pieceName(st.captured[0]), on = st.capturedOn?.[0];
  let s;
  switch (st.kind) {
    case 'shoot': s = `${who} Archer shoots the ${v} on ${on}.`; break;
    case 'chain': s = `${who} Beast bites ${st.capturedOn.length} pieces.`; break;
    case 'push': s = `${who} Ogre shoves a piece to ${st.push.to}.`; break;
    case 'swap': s = `${who} Maester swaps places.`; break;
    default: s = st.capturedOn.length ? `${who} ${pieceName(st.piece)} takes the ${v} on ${on}.` : `${who} ${pieceName(st.piece)} moves to ${st.to}.`;
  }
  return s + (st.mate ? ' Checkmate.' : st.check ? ' Check.' : '');
}
function gameLine(story) {
  $('#undo').disabled = !board.state?.history.length;
  const st = KD.status(board.state);
  if (st.over) return setCoach({ main: st.text, quiet: true });
  if (!story) return setCoach({ main: 'Your move.', sub: 'Tap a piece to see its moves.' });
  const yours = st.turn === 'w';
  setCoach({ piece: story.piece, side: story.side, main: lastLine(story), sub: yours ? 'Your move.' : 'The computer thinks.', quiet: true });
}

// ---- the board ----
let phase = 'title';
let swallow = false;   // true while the tap or key that ended the reading pause is still down
const board = createBoard($('#board'), {
  label: 'King Down board. Arrow keys move, Enter or Space chooses, Escape cancels, I reads a piece.',
  onTap(sq) {
    if (swallow) { swallow = false; return false; }   // this tap only ended the reading pause
    if (phase === 'game') { board.clearMarks('hint'); return undefined; }   // the board's own rules
    if (phase !== 'shot' || board.busy || trail.length) return false;   // a trail: the shot has left
    if (sq === ARCHER) {
      if (board.selected == null) aim(); else { board.clearSelection(); setCoach({ piece: 'archer', ...words('start') }); markArcher(); }
    } else if (board.selected != null) {
      if (sq === TARGET) void shoot({ auto: true });
      else setCoach({ piece: 'archer', ...words('aim') });   // the Archer stays chosen: point at the pawn again
    } else {
      // Any other first tap (a piece, the pawn, an empty square): point at the Archer.
      sfx.tap();
      setCoach({ piece: 'archer', main: NUDGE, sub: words('start').sub });
      markArcher();
    }
    return false;
  },
  onInspect(sq, cell) {
    const name = cell.type === 'king' ? 'King' : cap(cell.type);
    toast(LINES[cell.type] ? `${name}: ${LINES[cell.type]}` : `${cell.color === 'w' ? 'Your' : 'Their'} ${cell.type} on ${sq}`);
  },
  onMove(story) { if (phase === 'game') gameLine(story); },
});
const idx = sq => (sq.charCodeAt(1) - 49) * 8 + (sq.charCodeAt(0) - 97);

function setPhase(p) {
  phase = p;
  app.dataset.phase = p;
  table.inert = p === 'title';
  title.inert = p !== 'title';
}

// ---- the close view: the camera stands near the Archer; grow() pulls it back to the whole board ----
function closeTransform() {
  zoom.getAnimations().forEach(a => a.cancel());
  zoom.style.transform = 'none';
  const v = stage.getBoundingClientRect(), home = board.squareRect(ARCHER), t = home.width;
  if (!t || !v.width) return 'none';
  const top = board.squareRect(`${ARCHER[0]}4`).top - 0.35 * t, bottom = home.bottom + 0.32 * t;
  const cx = home.left + t / 2 - v.left, cy = (top + bottom) / 2 - v.top;
  const s = Math.min(v.width / (4.7 * t), v.height / (bottom - top), 2.4);
  return `translate(${(v.width / 2 - cx * s).toFixed(1)}px, ${(v.height / 2 - cy * s).toFixed(1)}px) scale(${s.toFixed(3)})`;
}
function closeView() {
  app.classList.add('is-close');
  zoom.style.transform = closeTransform();
}
new ResizeObserver(() => requestAnimationFrame(() => { if (app.classList.contains('is-close') && !zoom.getAnimations().length) zoom.style.transform = closeTransform(); })).observe(stage);

function markArcher() {
  board.clearMarks('glow'); board.clearMarks('hint');
  board.mark(ARCHER, 'glow', { colour: '255,206,120' });
  board.mark(ARCHER, 'hint');
}
function aim() {
  sfx.tap();
  board.clearMarks('glow'); board.clearMarks('hint');
  board.select(ARCHER);
  board.showTargets(KD.legal(board.state, ARCHER).filter(m => m.lan === SHOT));
  board.cursor = idx(TARGET); board.moveCursorMark();
  setCoach({ piece: 'archer', ...words('aim') });
}

let run = 0;   // a new state, play, reset or click stops an old run

// ---- the first shot's mark: a thin gold trail over the pawn, and a ring where the Archer still stands ----
// Both stay after the shot, so a still frame shows "over" and "she did not move". grow() removes them.
const SVG = 'http://www.w3.org/2000/svg';
const FLIGHT = 360;   // ms: the first shot flies slower than a shot in play, so the eye can follow it
let trail = [];
function clearTrail() { trail.forEach(el => el.remove()); trail = []; }
/** Draws the trail from the Archer to the target (the board's own shot uses the same line). Resolves when it is drawn. */
function drawTrail(from, to) {
  clearTrail();
  const at = sq => ({ x: (sq.charCodeAt(0) - 97 + 0.5) * 100, y: (56 - sq.charCodeAt(1)) * 100 });   // the board is never flipped here
  const a = at(from), b = at(to), y1 = a.y + 45, y2 = b.y + 55, len = Math.hypot(b.x - a.x, y2 - y1);
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'fm-trail');
  svg.setAttribute('viewBox', '0 0 800 800');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<defs><linearGradient id="fm-trail-g" gradientUnits="userSpaceOnUse" x1="${a.x}" y1="${y1}" x2="${b.x}" y2="${y2}">
      <stop offset="0" stop-color="#f3d58e" stop-opacity=".3"/><stop offset=".55" stop-color="#f3d58e" stop-opacity=".85"/><stop offset="1" stop-color="#fff3d6"/></linearGradient></defs>
    <line class="fm-trail-glow" x1="${a.x}" y1="${y1}" x2="${b.x}" y2="${y2}"/>
    <line class="fm-trail-core" x1="${a.x}" y1="${y1}" x2="${b.x}" y2="${y2}" stroke="url(#fm-trail-g)"/>`;
  const stay = document.createElement('div');
  stay.className = 'fm-stay';
  stay.style.left = `${(from.charCodeAt(0) - 97) * 12.5}%`;
  stay.style.top = `${(56 - from.charCodeAt(1)) * 12.5}%`;
  board.layer.append(stay, svg);
  trail = [stay, svg];
  if (prefersReducedMotion()) return Promise.resolve();
  const lines = [...svg.querySelectorAll('line')];
  for (const l of lines) { l.style.strokeDasharray = `${len}`; l.style.strokeDashoffset = `${len}`; }
  stay.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: FLIGHT, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
  return Promise.all(lines.map(l => l.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
    { duration: FLIGHT, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' }).finished.catch(() => {})));
}

/** The first shot, on the close view. */
function startShot() {
  setPhase('shot');
  hideToast();
  clearTrail();
  board.play = null;   // no computer and no drag in the first shot: the coach line leads
  board.setState(KD.fromFen(SHOT_FEN));
  board.clearSelection(false);
  closeView();
  markArcher();
  board.cursor = idx(ARCHER); board.moveCursorMark();
  setCoach({ piece: 'archer', ...words('start') }, { fade: false });
}

/** The Archer shoots. Option A then grows into the game; option B stops on a choice. */
async function shoot({ auto = false } = {}) {
  const me = run;
  board.clearMarks('glow'); board.clearMarks('hint');
  board.clearSelection(false);
  // The gold trail flies first (360 ms). The board's own quick shot leaves late, so both reach the pawn together.
  const flight = drawTrail(ARCHER, TARGET);
  if (!prefersReducedMotion()) await wait(FLIGHT - 130);
  if (me !== run) return;
  await Promise.all([board.playMove(SHOT), flight]);
  if (me !== run) return;
  setCoach({ piece: 'archer', ...words('hit') });
  if (variant === 'b') {
    setPhase('done');
    if (auto) $('#done-play').focus({ preventScroll: true });
    return;
  }
  if (!auto) return;
  await beat(1300);
  if (me === run) await grow();
}

/** A pause to read, which any tap or key ends at once (input never waits). That tap or key only ends the
 *  pause: the board does not read it as a tap in the new game. */
function beat(ms) {
  return new Promise(resolve => {
    const release = () => { swallow = false; removeEventListener('pointerup', release); removeEventListener('pointercancel', release); };
    const done = e => {
      clearTimeout(t); removeEventListener('pointerdown', done, true); removeEventListener('keydown', done, true);
      if (e?.type === 'pointerdown') { swallow = true; addEventListener('pointerup', release); addEventListener('pointercancel', release); }
      else if (e?.type === 'keydown') { swallow = true; setTimeout(release); }
      resolve();
    };
    const t = setTimeout(done, ms);
    addEventListener('pointerdown', done, true);
    addEventListener('keydown', done, true);
  });
}

/** The one strong moment: the view pulls back to the whole board and the other army rises into place. */
async function grow() {
  const me = run;
  clearTrail();
  board.play = { ...PLAY };
  const from = zoom.style.transform || 'none';
  app.classList.remove('is-close');
  setPhase('game');
  const motion = !prefersReducedMotion();
  zoom.style.transform = 'none';
  const pull = motion && from !== 'none'
    ? zoom.animate([{ transform: from }, { transform: 'none' }], { duration: 640, easing: 'cubic-bezier(.65,0,.35,1)' }).finished.catch(() => {})
    : Promise.resolve();
  // The white army stays where it stands (the Archer has not moved); the black army rises in, file by file.
  board.setState(newGame());
  board.cursor = idx('e2'); board.moveCursorMark();
  if (motion) {
    for (const c of KD.board(board.state)) {
      if (!c || c.color !== 'b' || c.type === 'king') continue;
      const el = board.figure(c.sq), file = c.sq.charCodeAt(0) - 97, back = c.sq[1] === '8';
      el?.animate([{ opacity: 0, transform: 'translateY(-16px)' }, { opacity: 1, transform: 'none' }],
        { duration: 300, delay: 260 + file * 34 + (back ? 0 : 70), easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    }
  }
  gameLine(null);
  await pull;
  if (me !== run) return;
}

/** Play a game at once: no shot, no setup (the title's Play). */
function startGame() {
  setPhase('game');
  hideToast();
  clearTrail();
  app.classList.remove('is-close');
  zoom.getAnimations().forEach(a => a.cancel());
  zoom.style.transform = 'none';
  board.play = { ...PLAY };
  board.setState(newGame());
  gameLine(null);
}

// ---- the title ----
async function hideTitle() {
  if (title.hidden) return;
  await animate(title, [{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-out' });
  title.hidden = true;
  title.style.opacity = '';
}
function showTitle({ enter = false } = {}) {
  setPhase('title');
  hideToast();
  title.getAnimations().forEach(a => a.cancel());
  title.style.opacity = '';
  title.hidden = false;
  title.classList.remove('is-entering');
  if (enter && !prefersReducedMotion()) { void title.offsetWidth; title.classList.add('is-entering'); }
  // Behind the title the table waits, ready for the first shot.
  clearTrail();
  board.play = null;
  board.setState(KD.fromFen(SHOT_FEN));
  closeView();
}

// ---- the controls ----
$('#go-first').addEventListener('click', () => {
  run++;
  startShot();
  void hideTitle();
  board.el.focus({ preventScroll: true });
});
$('#go-play').addEventListener('click', () => {
  run++;
  startGame();
  void hideTitle();
  board.el.focus({ preventScroll: true });
});
$('#go-workshop').addEventListener('click', e => { e.preventDefault(); toast('The Workshop opens here.'); });
$('#back').addEventListener('click', () => { run++; showTitle(); $('#go-first').focus(); });
$('#skip').addEventListener('click', () => { run++; void grow(); board.el.focus({ preventScroll: true }); });
$('#done-play').addEventListener('click', () => { run++; void grow(); board.el.focus({ preventScroll: true }); });
$('#next-piece').addEventListener('click', () => toast('The Beast lesson opens next.'));
$('#hint').addEventListener('click', async () => {
  const s = board.state;
  if (phase !== 'game' || !s || board.busy || !board.isHuman(KD.status(s).turn)) return;
  const m = await KD.think(s, { level: 'club', ms: 400 });
  if (!m || board.state !== s) return;
  board.clearMarks('hint');
  board.mark([m.from, m.to], 'hint');
  setCoach({ main: 'Try the marked move.', sub: 'Tap the piece, then its square.', quiet: true });
});
$('#undo').addEventListener('click', () => {
  const s = board.state;
  if (phase !== 'game' || !s?.history.length) return;
  const plies = board.isHuman(KD.status(s).turn) ? 2 : 1;
  let back = s;
  for (let i = 0; i < plies && back.history.length; i++) back = KD.undo(back);
  board.play.human = 'w';
  board.setState(back);
  if (!back.history.length) gameLine(null);
  else gameLine(KD.describe(KD.undo(back), back.history.at(-1).lan));
});
$('#menu').addEventListener('click', () => toast('Menu: New game, Guide and Resign.'));

// ---- start ----
setVariant(new URLSearchParams(location.search).get('option') === 'b' ? 'b' : 'a');
showTitle({ enter: true });

// ---- the demo contract (kit README): state(name), play(), reset() ----
async function scriptGame(me) {
  board.play.human = 'both';
  for (const lan of ['e2-e4', 'e7-e5']) {
    if (me !== run) return;
    await board.playMove(lan);
  }
  if (me === run) board.play.human = 'w';
}

window.demo = {
  async state(name) {
    const me = ++run;
    hideToast();
    board.closeChoice();
    switch (name) {
      case 'title': setVariant('a'); showTitle(); break;
      case 'shot-board': setVariant('a'); title.hidden = true; startShot(); aim(); break;
      case 'shot': setVariant('a'); title.hidden = true; startShot(); await shoot(); break;
      case 'grow': setVariant('a'); title.hidden = true; startShot(); await shoot(); if (me === run) await grow(); break;
      case 'first-move': setVariant('a'); title.hidden = true; startGame(); await scriptGame(me); break;
      case 'learn-title': setVariant('b'); showTitle(); break;
      case 'learn-done': setVariant('b'); title.hidden = true; startShot(); await shoot(); break;
      default: throw new Error(`demo.state: no state "${name}"`);
    }
  },
  // The whole first minute in about 14 s: the title, the shot, the board grows, a first move and the answer.
  async play() {
    const me = ++run;
    setVariant('a');
    showTitle({ enter: true });
    await wait(2000, { instant: true });
    if (me !== run) return;
    const go = $('#go-first');
    await animate(go, [{ transform: 'translateY(0)' }, { transform: 'translateY(2px)' }, { transform: 'translateY(0)' }], { duration: 200 });
    if (me !== run) return;
    startShot();
    await hideTitle();
    await wait(1300, { instant: true });
    if (me !== run) return;
    aim();
    await wait(1200, { instant: true });
    if (me !== run) return;
    await shoot();
    await wait(1500, { instant: true });
    if (me !== run) return;
    await grow();
    await wait(1800, { instant: true });
    if (me !== run) return;
    board.play.human = 'both';
    board.selectSquare('e2');
    await wait(800, { instant: true });
    if (me !== run) return;
    await board.playMove('e2-e4');
    await wait(900, { instant: true });
    if (me !== run) return;
    await board.playMove('e7-e5');
    if (me === run) board.play.human = 'w';
  },
  async reset() {
    ++run;
    setVariant('a');
    showTitle({ enter: true });
  },
};
