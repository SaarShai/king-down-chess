// Lessons: one piece in four small boards (introduce, develop, twist, conclude), the piece shelf (A)
// and the short path (B). The Guard has the four-board lesson; the other pieces use the app's own
// one-board lessons (KD.lessons, KD.lessonGoal). Every board is the real engine. A lesson never
// touches a saved game: it has its own board and its own state.
import { createBoard, KD, figureArt } from '../../kit/board.js';
import { icon, pieceIcon } from '../../kit/icons.js';
import { $, $$, toast, hideToast, sfx, animate, wait, prefersReducedMotion } from '../../kit/ui.js';

// ---- content -----------------------------------------------------------------------------------

/** One board of a lesson. goal(story) is true for the move that teaches; the rest is optional.
 *  No key piece stands straight above another: tall figures on one file merge into one shape. */
const GUARD_BOARDS = [
  {
    key: 'move', name: 'Move', fen: '7k/8/8/4p3/3G4/8/8/K7 w - - 0 1',
    task: 'Step your Guard one square.', how: 'Tap your Guard, then a gold mark.',
    done: 'One step, any way. It never takes.', retry: 'Move the Guard.',
    goal: st => st.piece === 'guard', show: ['d4', 'e4'],
    // A tap on the pawn with the Guard selected: the Guard shakes its head.
    refuse: { sq: 'e5', when: sel => sel === 'd4', text: 'A Guard never takes.', icon: 'close', shake: 'd4' },
  },
  {
    // The queen checks, not the rook: the rook's art is a stone giant that reads as the Ogre.
    key: 'block', name: 'Block', fen: 'k3q3/8/8/8/3G4/8/8/4K3 w - - 0 1',
    task: 'The queen checks. Block with your Guard.', how: 'Step it between the queen and your king.',
    done: 'The queen cannot take it.', retry: 'Block with the Guard.',
    goal: st => st.piece === 'guard', show: ['d4', 'e4'], wallFrom: 'e8',
  },
  {
    key: 'king', name: 'King', fen: '7k/8/8/4g3/3P1K2/8/8/8 w - - 0 1',
    task: 'Take their Guard.', how: 'Try your pawn first.',
    done: 'Your king takes it. Nothing else can.', retry: 'Take their Guard.',
    goal: st => st.piece === 'king' && st.capturedOn.includes('e5'), show: ['f4', 'e5'],
    // Any try on the Guard that is not the king's: the shield, the rule, then the king.
    refuse: { sq: 'e5', when: sel => sel !== 'f4', text: 'Only a king can take a Guard.', icon: 'shield', shield: 'e5', task: 'Take it with your king.', hint: 'f4' },
  },
  {
    // The Guard and the knight can both block on c3; the queen takes the knight there, not the Guard.
    key: 'choose', name: 'Choose', fen: '7k/8/8/q7/8/8/2G5/3NK3 w - - 0 1',
    task: 'Block the check. Lose nothing.', how: 'Two pieces can block. Choose well.',
    done: 'The queen cannot take your Guard.', retry: 'Block the check.',
    goal: st => st.piece === 'guard', show: ['c2', 'c3'], wallFrom: 'a5',
    // The knight blocks too, but the queen takes it: show that, then try again.
    punish: { piece: 'knight', reply: 'Qa5xc3', text: 'Their queen takes your knight. Try again.' },
  },
];

const one = (i, task, how, done, show) => [{
  key: 'try', name: 'Try it', fen: KD.lessons[i].fen, task, how, done, retry: task, show,
  goal: st => KD.lessonGoal(i, KD.fromFen(KD.lessons[i].fen), st.lan),
}];

const PIECES = [
  { type: 'archer', name: 'Archer', tag: 'Shoots without moving', line: 'Shoots without moving, even over other pieces.',
    rules: ['Steps one square. Never takes by moving.', 'Shoots without moving.', 'Shoots over other pieces.'],
    boards: one(0, 'Shoot the pawn with your Archer.', 'Tap your Archer, then the pawn.', 'She shoots without moving.', ['d4', 'e5']) },
  { type: 'beast', name: 'Beast', tag: 'Can bite again after a bite', line: 'After each bite, it can bite again.',
    rules: ['Steps one square, any way.', 'After each bite, it can bite again.', 'A later bite never takes a king.'],
    boards: one(3, 'Bite both knights in one move.', 'Tap your Beast, then d5, then d6.', 'After each bite, it can bite again.', ['d4', 'd5']) },
  { type: 'maester', name: 'Maester', tag: 'Swaps with a friend', line: 'Swaps places with a friend next to it.',
    rules: ['Steps one square and takes next to it.', 'Swaps with a friend next to it.', 'On the first rank, it swaps with its king from any distance.'],
    boards: one(2, 'Swap your Maester with your knight.', 'Tap your Maester, then your knight.', 'It swaps places with a friend.', ['d4', 'e4']) },
  // One verb for one action: the board's choice sheet says Push, so every Ogre line says push.
  { type: 'ogre', name: 'Ogre', tag: 'Pushes a neighbour', line: 'Pushes a neighbour and steps into its place.',
    rules: ['Steps and takes one square, any way.', 'Pushes a neighbour one square away.', 'It never pushes a king.'],
    boards: one(4, 'Push the knight with your Ogre.', 'Tap your Ogre, the knight, then Push.', 'It pushes, then steps into the gap.', ['d4', 'd5']) },
  { type: 'guard', name: 'Guard', tag: 'Only a king takes it', line: 'Only a king can take it. It never takes.',
    rules: ['Steps one square. Never takes.', 'Blocks lines like any piece.', 'Only a king can take it.'],
    boards: GUARD_BOARDS },
  { type: 'paladin', name: 'Paladin', tag: 'Jumps its own pieces', line: 'Jumps its own pieces. Taking more than a pawn costs it.', bonus: true,
    rules: ['Moves like a queen. Jumps its own pieces.', 'Taking a pawn is safe.', 'Taking more than a pawn removes it.'],
    boards: one(5, 'Take the pawn on d6.', 'It jumps over its own pieces.', 'A pawn is safe to take.', ['d1', 'd6']) },
];
const byType = t => PIECES.find(p => p.type === t);
// Four learned: the Guard is Next, so the shelf's main button opens the four-board lesson that this demo shows.
const START_LEARNED = ['archer', 'beast', 'maester', 'ogre'];

// ---- page state --------------------------------------------------------------------------------

const app = $('#app');
let learned = new Set(START_LEARNED);
let piece = byType('guard');      // the lesson on screen
let origin = 'shelf';             // where Back goes
let stepI = 0;
const lesson = { done: false, lock: false, refused: false };
let scripted = false;             // a scripted reply is on the board: onMove ignores it
let run = 0;                      // a new state, play or reset stops the old run

const nextPiece = (skip) => PIECES.find(p => !p.bonus && !learned.has(p.type) && p.type !== skip)?.type
  ?? (learned.has('paladin') || skip === 'paladin' ? null : 'paladin');

/** The painted figure at the size it has on the board: --u is one square in px. */
function figImg(type, extra = '') {
  const art = figureArt({ type, color: 'w' });
  const h = art.box?.height ?? 1;
  return `<img src="${art.src}" alt="" style="height: calc(var(--sq) * ${h.toFixed(3)})" class="${art.box?.mirror ? 'mirror' : ''} ${extra}">`;
}

// ---- static parts ------------------------------------------------------------------------------

$$('[data-act="home"]').forEach(b => { b.innerHTML = icon('back'); });
$('[data-act="back"]').innerHTML = icon('back');
$$('.play-btn').forEach(b => { b.innerHTML = `${icon('play')}<span>Play</span>`; });
$$('.rule-ic').forEach(s => { s.innerHTML = icon('check'); });
$('.seal-check').innerHTML = icon('check');
$('#shelf-safe').textContent = 'Lessons never change your saved game.';

// ---- A: the shelf ------------------------------------------------------------------------------

function renderShelf() {
  const next = nextPiece();
  $('#shelf-list').innerHTML = PIECES.map(p => {
    const done = learned.has(p.type), isNext = p.type === next && !p.bonus;
    const status = done ? `<span class="done-mark">${icon('check')}Learned</span>`
      : isNext ? '<span class="pill pill-gold">Next</span>'
      : p.bonus ? '<span class="pill">Bonus</span>' : '';
    const say = done ? ' Learned.' : isNext ? ' Next.' : p.bonus ? ' Bonus.' : '';
    return `<li><button type="button" class="piece${done ? ' is-done' : ''}${isNext ? ' is-next' : ''}" data-piece="${p.type}" aria-label="${p.name}: ${p.tag}.${say}">
      <span class="fig">${figImg(p.type)}</span><span class="name">${p.name}</span><span class="tag">${p.tag}</span><span class="status">${status}</span></button></li>`;
  }).join('');
  const np = next && byType(next);
  const btn = $('#shelf-next');
  btn.dataset.piece = np ? np.type : '';
  btn.innerHTML = np ? `Learn the ${np.name}` : 'Play a game';
}

// ---- B: the path -------------------------------------------------------------------------------

function renderPath() {
  const next = nextPiece();
  $('#trail').innerHTML = PIECES.map(p => {
    const done = learned.has(p.type);
    if (p.type === next) {
      return `<li class="node is-next"><div class="next-row"><span class="disc">${figImg(p.type)}</span>
        <div><p class="eyebrow">${p.bonus ? 'Bonus' : 'Next'} · about a minute</p><h2 class="display">${p.name}</h2><p class="rule">${p.line}</p></div></div>
        <button type="button" class="btn btn-primary" data-piece="${p.type}">${icon('play')}<span>Start</span></button></li>`;
    }
    const sub = done ? `${icon('check')} Learned` : p.bonus ? `Bonus · ${p.tag}` : p.tag;
    return `<li class="node ${done ? 'is-done' : 'is-later'}"><button type="button" class="node-btn" data-piece="${p.type}">
      <span class="disc">${figImg(p.type)}</span>${done ? `<span class="badge">${icon('check')}</span>` : ''}
      <span class="txt"><b>${p.name}</b><small>${sub}</small></span></button></li>`;
  }).join('');
}

// ---- the lesson --------------------------------------------------------------------------------

/** The player can act on the lesson board: a lesson is open, not done, not waiting, and White moves. */
const canAct = () => app.dataset.view === 'lesson' && !lesson.done && !lesson.lock && !!board.state && KD.status(board.state).turn === 'w';

const board = createBoard($('#board'), {
  play: { human: 'both' },
  label: 'Lesson board. Arrow keys move, Enter or Space chooses, Escape cancels, I reads a piece.',
  onTap(sq) {
    if (!canAct()) return false;
    board.clearMarks('hint');
    const b = piece.boards[stepI], r = b.refuse;
    const sel = board.selected != null ? KD.sq.name(board.selected) : null;
    if (r && sq === r.sq && r.when(sel)) { refuse(r); return false; }
    return undefined;
  },
  onMove(story) {
    if (scripted || app.dataset.view !== 'lesson') return;
    const b = piece.boards[stepI];
    if (b.goal(story)) void succeed(story); else void wrong(story);
  },
  onInspect(sq, cell) {
    // Reading a piece never plays a move: it only says what the piece is.
    const p = byType(cell.type), side = cell.color === 'w' ? 'Your' : 'Their';
    toast(p ? `${side} ${p.name}: ${p.line}` : `${side} ${cell.type}`);
  },
});

// A drag onto the refused square teaches the rule too. The board only snaps such a drag back: it calls no onTap.
let downAt = null;
board.el.addEventListener('pointerdown', e => {
  const i = board.squareAtPoint(e.clientX, e.clientY);
  downAt = i == null ? null : { sq: KD.sq.name(i), x: e.clientX, y: e.clientY };
});
board.el.addEventListener('pointerup', e => {
  const d = downAt; downAt = null;
  if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) <= 8 || !canAct()) return;
  const r = piece.boards[stepI].refuse, i = board.squareAtPoint(e.clientX, e.clientY);
  const own = KD.board(board.state)[KD.sq.index(d.sq)]?.color === 'w';
  if (r && own && i != null && KD.sq.name(i) === r.sq && r.when(d.sq)) refuse(r);
});

let fxEls = [];
function clearFx() {
  fxEls.forEach(el => el.remove()); fxEls = [];
  $('#board').classList.remove('is-spot');
  $$('.kdb-fig.lz-star').forEach(f => f.classList.remove('lz-star'));
}
const colRow = sq => ({ col: sq.charCodeAt(0) - 97, row: 8 - Number(sq[1]) });

/** The Guard's shield: a gold badge at the figure's shoulder. It says "this piece cannot be taken". */
const SHIELD = `<svg viewBox="-2 -1 28 28" aria-hidden="true"><defs><linearGradient id="lz-sg" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#fff1c4"/><stop offset=".55" stop-color="#e9c071"/><stop offset="1" stop-color="#b98a2e"/></linearGradient></defs>
  <path d="M12 2l8.5 3.4v6c0 5.4-3.6 9.8-8.5 12-4.9-2.2-8.5-6.6-8.5-12v-6z" fill="url(#lz-sg)" stroke="#3a2a0c" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M12 6.2v14.2M7.6 9.2c2.9-.8 5.9-.8 8.8 0" fill="none" stroke="#6b4a12" stroke-width="1.4" stroke-linecap="round" opacity=".7"/></svg>`;
function shieldAt(sq, { instant = false } = {}) {
  const el = document.createElement('div');
  const { col, row } = colRow(sq);
  el.className = 'lz-shield';
  el.style.left = `${(col + 0.62) * 12.5}%`;
  el.style.top = `${(row - 0.12) * 12.5}%`;
  el.innerHTML = SHIELD;
  board.layer.appendChild(el); fxEls.push(el);
  board.mark(sq, 'glow', { colour: '233,192,113' });
  if (!instant) animate(el, [{ transform: 'scale(.3) rotate(-12deg)', opacity: 0 }, { transform: 'scale(1.15) rotate(3deg)', opacity: 1, offset: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

/** The attacker's line stops at the Guard: a dashed ink line and a short bar. The bar sits 0.3 square before
 *  the Guard's square, so the tall figure (it rises about 0.2 square over its square) never hides it. */
function wallLine(from, to, { instant = false } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const a = colRow(from), b = colRow(to);
  const x1 = (a.col + 0.5) * 100, y1 = (a.row + 0.5) * 100, cx = (b.col + 0.5) * 100, cy = (b.row + 0.5) * 100;
  const dx = cx - x1, dy = cy - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  const stop = 80 / Math.max(Math.abs(ux), Math.abs(uy));          // 0.3 square before the Guard's square
  const x2 = cx - ux * stop, y2 = cy - uy * stop, sx = x1 + ux * 34, sy = y1 + uy * 34;
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'lz-fx'); svg.setAttribute('viewBox', '0 0 800 800'); svg.setAttribute('preserveAspectRatio', 'none');
  const t = 24, bar = `M${x2 - uy * t} ${y2 + ux * t}L${x2 + uy * t} ${y2 - ux * t}`;
  svg.innerHTML = `<path class="ln" d="M${sx} ${sy}L${x2} ${y2}" fill="none" stroke="rgba(251,246,232,.85)" stroke-width="9" stroke-linecap="round"/>
    <path class="ln" d="M${sx} ${sy}L${x2} ${y2}" fill="none" stroke="#9c2a1f" stroke-width="4" stroke-linecap="round" stroke-dasharray="14 12"/>
    <path d="${bar}" fill="none" stroke="rgba(251,246,232,.9)" stroke-width="12" stroke-linecap="round"/>
    <path d="${bar}" fill="none" stroke="#3a2a0c" stroke-width="6" stroke-linecap="round"/>`;
  board.layer.appendChild(svg); fxEls.push(svg);
  if (!instant) animate(svg, [{ clipPath: `circle(0% at ${x1 / 8}% ${y1 / 8}%)` }, { clipPath: `circle(150% at ${x1 / 8}% ${y1 / 8}%)` }], { duration: 360, easing: 'ease-in' });
}

function setTask(text) { $('#task').textContent = text; }
function setNote(text, kind = 'how', iconName) {
  const el = $('#note');
  const name = iconName ?? { how: 'info', done: 'check', no: 'shield', wrong: 'undo' }[kind];
  el.dataset.kind = kind;
  el.innerHTML = `${icon(name)}<span>${text}</span>`;
  el.classList.remove('is-fresh'); void el.offsetWidth; el.classList.add('is-fresh');
}
function setAct(kind) {
  const b = $('#act');
  b.dataset.kind = kind;
  b.style.visibility = kind === 'none' ? 'hidden' : '';
  b.className = `btn btn-wide${kind === 'next' ? ' btn-primary' : ' btn-quiet'}`;
  b.innerHTML = kind === 'next' ? `<span>Next</span>${icon('chevron')}` : `${icon('eye')}<span>Show me</span>`;
}

function renderTrack() {
  const boards = piece.boards, many = boards.length > 1;
  $('#track').hidden = !many;
  $('#track').innerHTML = boards.map((b, i) => {
    const done = i < stepI || (i === stepI && lesson.done), now = i === stepI;
    return `<li class="${done ? 'is-done' : now ? 'is-now' : ''}"${now ? ' aria-current="step"' : ''}><span class="bar"></span>
      <span class="num">${done ? icon('check') : i + 1}</span><span class="lbl">${done ? icon('check') : ''}${b.name}${done ? '<span class="sr-only">, done</span>' : ''}</span></li>`;
  }).join('');
}

function paintLessonChrome() {
  $('#lesson').setAttribute('aria-label', `${piece.name} lesson`);
  $('.lesson-pi').innerHTML = pieceIcon(piece.type, 'w');
  $$('#lesson-title .display, .lesson-name').forEach(e => { e.textContent = piece.name; });
  const art = figureArt({ type: piece.type, color: 'w' });
  $('#lesson-fig').src = art.src; $('#seal-fig').src = art.src;
  $('#lesson-fig').classList.toggle('mirror', !!art.box?.mirror);
  $('.lesson-head .muted').textContent = piece.boards.length > 1 ? 'Four small boards. About a minute.' : 'One small board. Under a minute.';
  $('#learned-title').textContent = `${piece.name} learned`;
  $$('.rules li').forEach((li, i) => { li.lastChild.textContent = piece.rules[i]; });
}

function enterStep(i, { fade = false } = {}) {
  stepI = i;
  Object.assign(lesson, { done: false, lock: false, refused: false });
  clearFx();
  const b = piece.boards[i];
  board.play.human = 'both';
  board.clearMarks();
  board.setState(KD.fromFen(b.fen));
  $('#coach-play').hidden = false; $('#learned').hidden = true; $('#lesson .play-btn').hidden = false;
  setTask(b.task); setNote(b.how, 'how'); setAct('show');
  renderTrack();
  if (fade) for (const f of $$('#board .kdb-fig')) animate(f, [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

function openLesson(type, from = app.dataset.view) {
  piece = byType(type);
  origin = from === 'path' ? 'path' : 'shelf';
  paintLessonChrome();
  show('lesson');
  enterStep(0);
}

function refuse(r, { instant = false } = {}) {
  if (!instant) { sfx.tap(); }
  if (r.shake) {
    const f = board.figure(r.shake);
    if (f && !instant) animate(f, [{ transform: 'none' }, { transform: 'translateX(-5%)' }, { transform: 'translateX(5%)' }, { transform: 'translateX(-3%)' }, { transform: 'none' }], { duration: 300, easing: 'ease-in-out' });
  }
  if (r.shield) {
    fxEls.filter(e => e.classList.contains('lz-shield')).forEach(e => e.remove());
    board.clearMarks('glow');
    shieldAt(r.shield, { instant });
  }
  setNote(r.text, 'no', r.icon);
  if (r.task) { lesson.refused = true; setTask(r.task); }
  // The next step is the king: drop the pawn's gold marks, so only one gold cue shows.
  if (r.hint) { board.clearSelection(false); board.mark(r.hint, 'hint'); }
}

function showMe() {
  const b = piece.boards[stepI];
  board.clearSelection(false); board.clearMarks('hint');
  board.mark(b.show, 'hint');
  setNote('Tap the marked piece, then its marked square.', 'how', 'eye');
}

async function succeed(story, { instant = false } = {}) {
  const me = run, b = piece.boards[stepI];
  lesson.done = true;
  clearFx();                       // a refusal's shield must not stay on the square the king now holds
  board.clearMarks('hint'); board.clearMarks('glow');
  setNote(b.done, 'done');
  renderTrack();
  if (b.wallFrom) { wallLine(b.wallFrom, story.to, { instant }); shieldAt(story.to, { instant }); }
  if (stepI < piece.boards.length - 1) {
    setAct('next');
    if (!instant && document.activeElement === board.el) $('#act').focus({ preventScroll: true });
    return;
  }
  setAct('none');
  await wait(instant ? 0 : 900, { instant: true });
  if (me !== run) return;
  learnedMoment({ instant });
}

async function wrong(story) {
  const me = run, b = piece.boards[stepI];
  lesson.lock = true;
  if (b.punish && story.piece === b.punish.piece) {
    await wait(300, { instant: true });
    if (me !== run) return;
    scripted = true;
    await board.playMove(b.punish.reply);
    scripted = false;
    if (me !== run) return;
    setNote(b.punish.text, 'wrong');
    await wait(1500, { instant: false });
  } else {
    setNote(`Not quite. ${lesson.refused && b.refuse?.task ? b.refuse.task : b.retry}`, 'wrong');
    await wait(1000, { instant: false });
  }
  if (me !== run) return;
  clearFx(); board.clearMarks();
  board.setState(KD.fromFen(b.fen));
  if (lesson.refused && b.refuse?.shield) shieldAt(b.refuse.shield, { instant: true });
  lesson.lock = false;
}

/** The one strong moment: the other squares dim, a gold ring passes under the piece, one chime, the card. */
function learnedMoment({ instant = false } = {}) {
  const cell = KD.board(board.state).find(c => c && c.color === 'w' && c.type === piece.type);
  const calm = instant || prefersReducedMotion();
  learned.add(piece.type);
  stepI = piece.boards.length - 1; lesson.done = true; renderTrack();
  if (cell) {
    const sq = cell.sq, { col, row } = colRow(sq);
    board.figure(sq)?.classList.add('lz-star');
    $('#board').classList.add('is-spot');
    const dim = document.createElement('div');
    dim.className = 'lz-dim';
    dim.style.background = `radial-gradient(ellipse 11% 11% at ${(col + 0.5) * 12.5}% ${(row + 0.55) * 12.5}%, rgba(20,14,8,0) 55%, rgba(20,14,8,.5) 100%)`;
    board.layer.appendChild(dim); fxEls.push(dim);
    const ring = document.createElement('div');
    ring.className = 'lz-ring';
    ring.style.left = `${col * 12.5}%`; ring.style.top = `${row * 12.5}%`;
    const e = 'cx="56" cy="92" rx="46" ry="16"';
    ring.innerHTML = `<svg viewBox="0 0 112 112" aria-hidden="true"><ellipse ${e} fill="rgba(233,192,113,.28)" stroke="rgba(251,246,232,.9)" stroke-width="6"/><ellipse ${e} fill="none" stroke="#c99a3e" stroke-width="3"/>
      <g class="wave"><ellipse ${e} fill="none" stroke="#e9c071" stroke-width="3"/></g></svg>`;
    board.layer.appendChild(ring); fxEls.push(ring);
    const wave = ring.querySelector('.wave');
    wave.style.transformOrigin = '56px 92px';
    if (calm) { dim.classList.add('is-on'); wave.remove(); }
    else {
      requestAnimationFrame(() => dim.classList.add('is-on'));
      animate(wave, [{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(2.6)', opacity: 0 }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
      sfx.win();
    }
  }
  const np = nextPiece(piece.type), nextBtn = $('[data-act="next-piece"]');
  nextBtn.hidden = !np;
  if (np) { nextBtn.textContent = `Next: ${byType(np).name}`; nextBtn.dataset.piece = np; }
  $('#coach-play').hidden = true;
  $('#lesson .play-btn').hidden = true;     // the card's main button is the one Play here
  const card = $('#learned');
  card.hidden = false;
  card.classList.remove('is-rising');
  if (!calm) { void card.offsetWidth; card.classList.add('is-rising'); }
  if (!instant) $('#learned-title').focus({ preventScroll: true });
}

// ---- views and wiring ----------------------------------------------------------------------------

function show(view) {
  app.dataset.view = view;
  if (view === 'shelf') renderShelf();
  if (view === 'path') renderPath();
}
function go(view) {
  show(view);
  const el = $(`#${view}`);
  animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
}

const PLAY_TEXT = 'Your game waits, as you left it.';
const NEW_GAME_TEXT = 'A new game starts here.';
document.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  const act = t.dataset.act;
  // A move to another screen or board stops what the old one still waits for (a reset, the learned card).
  const leave = () => { run++; };
  if (act === 'home') toast('Home is not part of this demo.');
  else if (act === 'play') toast(PLAY_TEXT);
  else if (act === 'play-game') toast(NEW_GAME_TEXT);
  else if (act === 'back') { leave(); board.clearSelection(false); go(origin); }
  else if (act === 'next-piece') { leave(); openLesson(t.dataset.piece, origin); }
  else if (t.id === 'act') {
    if (t.dataset.kind === 'show') showMe();
    else if (t.dataset.kind === 'next') { leave(); const kb = document.activeElement === t && t.matches(':focus-visible'); enterStep(stepI + 1, { fade: true }); if (kb) board.el.focus(); }
  } else if (t.dataset.piece) { leave(); openLesson(t.dataset.piece); }
  else if (t.id === 'shelf-next') toast(NEW_GAME_TEXT);
});

// ---- the demo contract -------------------------------------------------------------------------

/** Build a lesson board as if the player had played up to `step`. */
function stage(type, step) {
  piece = byType(type); origin = 'shelf';
  learned = new Set(START_LEARNED);
  paintLessonChrome();
  show('lesson');
  enterStep(step);
}
const clean = () => { run++; hideToast(); board.closeChoice(); scripted = false; };

window.demo = {
  async state(name) {
    clean();
    learned = new Set(START_LEARNED);
    switch (name) {
      case 'shelf': show('shelf'); break;
      case 'path': show('path'); break;
      case 'introduce':
        stage('guard', 0);
        board.selectSquare('d4');
        break;
      case 'develop': {
        stage('guard', 1);
        const st = KD.describe(board.state, 'Gd4-e4');
        board.setState(st.next);
        await succeed(st, { instant: true });
        break;
      }
      case 'twist':
        stage('guard', 2);
        board.selectSquare('d4');
        refuse(GUARD_BOARDS[2].refuse, { instant: true });
        break;
      case 'conclude':
        stage('guard', 3);
        board.mark(['c2', 'd1'], 'hint');
        break;
      case 'learned': {
        stage('guard', 3);
        const st = KD.describe(board.state, 'Gc2-c3');
        board.setState(st.next);
        await succeed(st, { instant: true });
        break;
      }
      default: throw new Error(`demo.state: no state "${name}"`);
    }
  },

  // The story: choose the Guard on the shelf, then its four boards, then "Guard learned".
  async play() {
    clean();
    const me = run;
    learned = new Set(START_LEARNED);
    const alive = () => me === run;
    const pause = ms => wait(ms, { instant: true });
    const press = async el => { el.classList.add('is-pressed'); await pause(160); el.classList.remove('is-pressed'); };
    show('shelf');
    await pause(1200); if (!alive()) return;
    await press($('.piece[data-piece="guard"]')); if (!alive()) return;
    openLesson('guard', 'shelf');
    animate($('#lesson'), [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    // 1. Move
    await pause(900); if (!alive()) return;
    board.selectSquare('d4'); sfx.tap();
    await pause(900); if (!alive()) return;
    await board.playMove('Gd4-e4'); if (!alive()) return;
    await pause(1300); if (!alive()) return;
    await press($('#act')); enterStep(1, { fade: true });
    // 2. Block
    await pause(1000); if (!alive()) return;
    board.selectSquare('d4');
    await pause(800); if (!alive()) return;
    await board.playMove('Gd4-e4'); if (!alive()) return;
    await pause(1600); if (!alive()) return;
    await press($('#act')); enterStep(2, { fade: true });
    // 3. King: the pawn tries, the shield answers, the king takes.
    await pause(1000); if (!alive()) return;
    board.selectSquare('d4');
    await pause(800); if (!alive()) return;
    refuse(GUARD_BOARDS[2].refuse);
    await pause(1700); if (!alive()) return;
    board.clearMarks('hint'); board.selectSquare('f4');
    await pause(800); if (!alive()) return;
    await board.playMove('Kf4xe5'); if (!alive()) return;
    await pause(1300); if (!alive()) return;
    await press($('#act')); enterStep(3, { fade: true });
    // 4. Choose: the Guard blocks, and the lesson ends.
    await pause(1300); if (!alive()) return;
    board.selectSquare('c2');
    await pause(800); if (!alive()) return;
    await board.playMove('Gc2-c3'); if (!alive()) return;
    await pause(2600);
  },

  async reset() {
    clean();
    learned = new Set(START_LEARNED);
    board.play.human = 'both';
    show('shelf');
  },
};

show('shelf');
