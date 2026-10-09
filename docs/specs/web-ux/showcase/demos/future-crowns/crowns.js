// Unlocks with crowns: the proposal of docs/PROGRESSION.md as a finished screen.
// A win at Casual or higher adds a crown on the result card. The next piece waits beside it: a silhouette
// made from its real figure, or its grey figure when the player met it in today's army. At 2, 5 and 9
// crowns the paint fills the figure (600 ms), then "Try its move" opens the piece's real lesson.
// A loss or a draw never takes a crown.
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceIcon, pieceArt } from '../../kit/icons.js';
import { $, $$, toast, hideToast, sfx, haptic, openSheet, closeSheet, animate, wait, prefersReducedMotion } from '../../kit/ui.js';

// ---- the proposal (docs/PROGRESSION.md) ------------------------------------------------------

const PIECE = {
  archer:  { name: 'Archer',  line: 'Shoots without moving, even over other pieces.', short: 'Shoots without moving.', lesson: 0,
             task: 'Tap your Archer, then the pawn.', done: 'She shoots from where she stands.' },
  guard:   { name: 'Guard',   line: 'Only a king can take it. It never takes.', short: 'Only a king takes it.', lesson: 1,
             task: 'The rook gives check. Block it.', done: 'The rook cannot take your guard.' },
  maester: { name: 'Maester', line: 'Swaps places with a friend next to it.', short: 'Swaps with a friend.', lesson: 2,
             task: 'Tap your Maester, then your knight.', done: 'They trade places.',
             more: 'On the first rank, it can also swap with its king at any distance.' },
  beast:   { name: 'Beast',   line: 'After each bite, it can bite again.', short: 'Bites again.', lesson: 3,
             task: 'Bite the knight on d5, then d6.', done: 'Two bites in one move.' },
  ogre:    { name: 'Ogre',    line: 'Shoves a neighbour and steps into its place.', short: 'Shoves a neighbour.', lesson: 4,
             task: 'Tap your Ogre, then the knight. Push.', done: 'The Ogre shoves and steps in.' },
  paladin: { name: 'Paladin', line: 'Jumps its own pieces. Taking more than a pawn costs it.', short: 'Jumps its own pieces.', lesson: 5,
             task: 'Take the pawn on d6.', done: 'Taking a pawn is safe.' },
};
const STARTERS = ['archer', 'beast'];
const LADDER = ['maester', 'ogre', 'guard'];   // option A: the fixed order; option B: the first piece is a choice
const AT = [2, 5, 9];                           // the crowns for the first, second and third new piece
const MET = new Set(['ogre']);                  // met in today's army (PROGRESSION.md, owner decision 4)
const SHELF = ['archer', 'beast', 'maester', 'ogre', 'guard', 'paladin'];
const LEVELS = [['beginner', 'Beginner'], ['casual', 'Casual'], ['club', 'Club'], ['strong', 'Strong']];
const EARNS = new Set(['casual', 'club', 'strong']);

// The game: the player has only the starter pieces, so the armies hold no Maester, Ogre or Guard.
// White mates in one: the Archer steps to f6 and her shot reaches h8 (checked with the kit engine).
const WIN_FEN = 'r1b3rk/2p4p/1a2p3/pp2A3/2n5/2NP4/PP3PPP/R1B2SK1 w - - 0 24';
const WIN_MOVE = 'Ae5-f6';
// The same game turned round: Black's Archer mates White on h1.
const LOSS_FEN = 'r1b2sk1/pp3ppp/2np4/2N5/PP2a3/4P3/2P4P/R1B3RK b - - 0 24';
const LOSS_MOVE = 'Ae4-f3';

// ---- progress -----------------------------------------------------------------------------------

let crowns = 1;                  // crowns so far
let got = [];                    // the new pieces that are yours, in the order they joined
let fresh = null;                // a new piece that no random game has used yet
let pickMode = 'fixed';          // 'fixed' (option A) or 'choose' (option B)

const owned = () => [...STARTERS, ...got];
/** Option B: the first new piece is a choice, and it stays open until the player picks. */
const choosing = () => pickMode === 'choose' && got.length === 0 && crowns >= AT[0];
/** The step that the crowns now work toward (null when every piece is yours). */
function stepAt(c = crowns) {
  const k = got.length;
  if (k >= LADDER.length) return null;
  const at = AT[k], prev = k ? AT[k - 1] : 0;
  return { piece: LADDER.find(p => !got.includes(p)), at, prev, total: at - prev,
    have: Math.max(0, Math.min(c, at) - prev), left: Math.max(0, at - c) };
}
/** The crowns at which a piece that is not yours joins your army. */
const atFor = piece => AT[got.length + LADDER.filter(p => !got.includes(p)).indexOf(piece)];
function unlock(piece) { got.push(piece); fresh = piece; }
function setProgress(c, pieces = [], { mode = 'fixed', isNew = null } = {}) { crowns = c; got = [...pieces]; fresh = isNew; pickMode = mode; }

// One look for each state, on every screen: yours = full paint, met = grey paint, locked = silhouette.
const lockedLook = piece => (MET.has(piece) ? 'met' : 'locked');
const lookOf = piece => (owned().includes(piece) || piece === 'paladin' ? 'yours' : lockedLook(piece));
const crownsWord = n => `${n} crown${n === 1 ? '' : 's'}`;

// ---- small parts ------------------------------------------------------------------------------

const CROWN_D = 'M4 18 3 8l5 4 4-6 4 6 5-4-1 10z';
const pip = (on, cls = '') => `<svg class="pip${on ? ' is-on' : ''}${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${CROWN_D}"/></svg>`;

/** A figure from the real art: the base (a silhouette mask or the grey figure), the paint over it, and the fill edge. */
function fig(piece, size, { look = 'yours', fresh: isNew = false } = {}) {
  const src = pieceArt(piece, 'w');
  const base = look === 'met' ? `<img class="sil met" src="${src}" alt="" draggable="false">` : look === 'locked' ? '<span class="sil"></span>' : '';
  return `<span class="fig fig-${size}${look !== 'yours' ? ' is-locked' : ''}${isNew ? ' is-new' : ''}" style="--art:url('${src}')" data-piece="${piece}" aria-hidden="true">`
    + `${base}<img class="paint" src="${src}" alt="" draggable="false"><span class="edge"></span></span>`;
}
const metTag = () => `<span class="met-tag">${icon('eye')}Met</span>`;

const btn = (act, text, { primary = false, piece, ico, cls = '' } = {}) =>
  `<button type="button" class="btn ${primary ? 'btn-primary' : 'btn-quiet'}${cls ? ' ' + cls : ''}" data-act="${act}"${piece ? ` data-piece="${piece}"` : ''}>${ico ? icon(ico) : ''}<span>${text}</span></button>`;

/** A line for screen readers (a visually hidden status). */
function say(text) {
  const el = $('#say');
  el.textContent = '';
  setTimeout(() => { el.textContent = text; }, 40);
}

// ---- state ------------------------------------------------------------------------------------

let level = 'casual';
let view = 'turn';               // 'turn', 'result' or 'lesson'
let lesson = null;               // { piece, index, start, done }
let back = null;                 // where the lesson came from: { state, view, human, shelf }
let result = { outcome: 'win', moveNo: 24 };
let run = 0;                     // a new state, play or reset stops the old flow
let flowRun = -1;                // the run of the result motion that now plays (a tap or a key skips it)
let skipping = false;            // a skip jumps each step to its end frame
let flow = Promise.resolve();

// ---- the board ----------------------------------------------------------------------------------

const board = createBoard($('#board'), {
  play: { level: 'casual', human: 'w', ms: 500 },
  label: 'King Down board. Arrow keys move, Enter or Space chooses, Escape cancels, I shows a piece.',
  onTap() { if (view === 'result' || (view === 'lesson' && lesson?.done)) return false; },
  onMove(story) {
    if (view === 'lesson') return lessonMove(story);
    const st = KD.status(story.next);
    if (st.over) { flow = asFlow(run, () => finishGame(st)); return; }
    renderTurn();
  },
  onInspect(sq, cell) {
    const p = PIECE[cell.type];
    toast(p ? `${p.name}: ${p.short}` : `${cell.color === 'w' ? 'White' : 'Black'} ${cell.type}`);
  },
});

// A mated king lies toward the middle of the board, so the board edge never cuts it.
const kingOf = (s, color) => KD.board(s).find(c => c?.type === 'king' && c.color === color);
function aimFall(sq) { $('#board').classList.toggle('fall-in', !!sq && sq[0] >= 'e'); }
function fallKing(sq) { aimFall(sq); board.figure(sq)?.classList.add('is-fallen'); }
function fallLoser(s) {
  const st = KD.status(s);
  if (st.reason !== 'checkmate' || !st.winner) return;
  const k = kingOf(s, st.winner === 'w' ? 'b' : 'w');
  if (k) fallKing(k.sq);
}

// ---- views ------------------------------------------------------------------------------------

function setView(v) {
  view = v;
  $('#app').dataset.view = v;
  $('#v-turn').hidden = v !== 'turn';
  $('#v-result').hidden = v !== 'result';
  $('#v-lesson').hidden = v !== 'lesson';
  $('#panel-title').textContent = v === 'lesson' ? 'Lesson' : v === 'result' ? 'Result' : 'Game';
  renderWho();
}

function renderWho() {
  if (view === 'lesson' && lesson) {
    $('#who').innerHTML = `${pieceIcon(lesson.piece, 'w')}<span class="who-name">${PIECE[lesson.piece].name} lesson</span>`;
    return;
  }
  $('#who').innerHTML = `<span class="portrait"><img src="${pieceArt('king', 'b')}" alt=""></span><span class="who-name">Computer</span><span class="pill">${LEVEL_NAME()}</span>`;
}

let puzzleSub = false;
function renderTurn() {
  const s = board.state;
  if (!s) return;
  const st = KD.status(s);
  const mine = board.play.human === 'both' || board.isHuman(st.turn);
  $('#turn-text').textContent = st.over ? st.text : mine ? (st.check ? 'Your move: you are in check' : 'Your move') : 'The computer thinks';
  $('#turn-sub').hidden = !puzzleSub || s.history.length > 0;
  $('#undo-btn').disabled = !s.history.length;
  if (!st.over) aimFall(kingOf(s, st.turn === 'w' ? 'b' : 'w')?.sq);   // the king that the next move can mate
}

function showGame(state, { human = 'w', puzzle = false } = {}) {
  lesson = null;
  puzzleSub = puzzle;
  board.play.level = level;
  board.play.human = human;
  setView('turn');
  board.setState(state);
  renderTurn();
}

// ---- the result card ----------------------------------------------------------------------------

const LEVEL_NAME = () => LEVELS.find(l => l[0] === level)[1];

function trackHTML({ step = stepAt(), gained = false, pending = false, outcome = 'win' } = {}) {
  if (!step) return `<p class="track-all">${icon('crown')} Every piece is in your army.</p>`;
  const p = PIECE[step.piece], look = lockedLook(step.piece);
  const last = step.have - 1;
  const pips = Array.from({ length: step.total }, (_, i) => pip(i < step.have && !(pending && i === last), i === last && (gained || pending) ? 'is-fresh' : '')).join('');
  const toGo = n => (n ? `${crownsWord(n)} to go` : 'Ready');
  const rule = outcome === 'win'
    ? (EARNS.has(level) ? `${icon('crown')}<span>A win at Casual or higher gives a crown.</span>` : `${icon('info')}<span>Wins at Casual or higher give crowns.</span>`)
    : `${icon('check')}<span>${outcome === 'loss' ? 'Your crowns stay. A loss never takes one.' : 'Your crowns stay.'}</span>`;
  return `<div class="track">
      ${fig(step.piece, 'sm', { look })}
      <div class="track-text">
        <p class="track-name"><span class="muted">Next piece:</span> <b>${p.name}</b>${look === 'met' ? ` ${metTag()}` : ''}</p>
        <p class="track-line">${p.line}</p>
        <div class="pips-row">
          <span class="pips" role="img" aria-label="${step.have} of ${step.total} crowns">${pips}</span>
          <span class="left" data-after="${toGo(step.left)}">${toGo(step.left + (pending ? 1 : 0))}</span>
          ${gained || pending ? '<span class="pill pill-gold gain">+1 crown</span>' : ''}
        </div>
      </div>
    </div>
    <p class="rule">${rule}</p>`;
}

function revealHTML(piece, { done = true, chosen = false } = {}) {
  const p = PIECE[piece], i = got.indexOf(piece);
  const total = AT[i] - (i ? AT[i - 1] : 0);
  return `<div class="reveal">
      ${fig(piece, 'lg', done ? { fresh: true } : { look: lockedLook(piece) })}
      <div class="reveal-text">
        <p class="eyebrow"><span class="pips" role="img" aria-label="${total} of ${total} crowns">${pip(true).repeat(total)}</span><span>New piece</span></p>
        <p class="reveal-name display">${p.name}</p>
        <p class="reveal-line">${p.line}</p>
        <p class="reveal-join">${chosen ? 'Your choice. ' : ''}It now joins your random army.</p>
      </div>
    </div>`;
}

function chooseHTML({ gained = false, pending = false } = {}) {
  return `<div class="choose">
      <p class="choose-title"><b>Choose your next piece</b>
        <span class="choose-pips"><span class="pips" role="img" aria-label="2 of 2 crowns">${pip(true)}${pip(!pending, pending ? 'is-fresh' : '')}</span>${gained ? '<span class="pill pill-gold gain">+1 crown</span>' : ''}</span></p>
      <div class="picks">${LADDER.map(t => `<button type="button" class="pick" data-act="pick" data-piece="${t}" aria-label="${PIECE[t].name}: ${PIECE[t].short}">
          ${fig(t, 'md', { look: lockedLook(t) })}<b>${PIECE[t].name}</b><small>${PIECE[t].short}</small></button>`).join('')}</div>
      <p class="rule">${icon('info')}<span>The other two come at 5 and 9 crowns. You can also choose later, in Pieces.</span></p>
    </div>`;
}

const ACTIONS = {
  after: () => `${btn('rematch', 'Rematch', { primary: true })}${btn('review', 'Review')}${btn('new-game', 'New game')}`,
  unlock: piece => `${btn('try', 'Try its move', { primary: true, piece })}${btn('later', 'Later')}`,
  choose: () => `${btn('rematch', 'Rematch')}${btn('new-game', 'New game')}`,
};

function setResultHead(outcome, moveNo) {
  result = { outcome, moveNo };
  $('#res-title').textContent = outcome === 'win' ? 'You win' : outcome === 'loss' ? 'Computer wins' : 'Draw';
  $('#res-sub').textContent = `${moveNo ? `Checkmate on move ${moveNo}` : 'Game over'} · ${LEVEL_NAME()}`;
}

function setActions(html, pair = false) {
  const a = $('#res-actions');
  a.innerHTML = html;
  a.style.opacity = '';
  a.inert = false;
  a.classList.toggle('pair', pair);
}

/** The card after the motion: an open choice (option B), else the track toward the next piece. */
function showAfter({ gained = false } = {}) {
  const box = $('#crowns');
  if (choosing()) { box.innerHTML = chooseHTML({ gained }); setActions(ACTIONS.choose(), true); return; }
  box.innerHTML = trackHTML({ gained, outcome: result.outcome });
  setActions(ACTIONS.after());
}

/** The still frames: each one is the end frame of its motion. */
function resultStill({ outcome, gained = false, moveNo, unlocked = null }) {
  setView('result');
  setResultHead(outcome, moveNo);
  if (unlocked) { $('#crowns').innerHTML = revealHTML(unlocked); setActions(ACTIONS.unlock(unlocked), true); return; }
  showAfter({ gained });
}

// ---- motion helpers: each one jumps to its end with reduced motion or a skip ----------------------

const still = () => skipping || prefersReducedMotion();
const go = (el, frames, opts) => (el ? animate(el, frames, still() ? { ...opts, duration: 0 } : opts) : Promise.resolve());
const pause = ms => (still() ? Promise.resolve() : wait(ms));

function finishMotion() { for (const a of document.getAnimations()) if (a.effect?.target?.closest?.('#panel, .fly')) a.finish(); }
function skip() {
  if (skipping) return;
  skipping = true;
  finishMotion();
}
/** Runs a result motion. While it plays, a tap on the card, Space, Enter or Escape skips to its end. */
async function asFlow(me, fn) {
  flowRun = me;
  try { await fn(); } finally { if (flowRun === me) { flowRun = -1; skipping = false; } }
}
const flowing = () => flowRun === run;
/** The skip ends the motion at once, so the buttons are live before the tap ends: its click must not press one. */
function swallowClick() {
  const eat = e => { e.stopPropagation(); e.preventDefault(); };
  document.addEventListener('click', eat, { capture: true, once: true });
  setTimeout(() => document.removeEventListener('click', eat, { capture: true }), 600);
}
$('#panel').addEventListener('pointerdown', e => {
  if (!flowing() || e.target.closest('[data-act]')) return;
  skip();
  swallowClick();
});
document.addEventListener('keydown', e => {
  if (!flowing() || $('dialog[open]') || ![' ', 'Enter', 'Escape'].includes(e.key)) return;
  e.preventDefault(); e.stopPropagation();
  skip();
}, true);

async function riseIn(el) {
  await go(el, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

/** A crown flies from the result line into its pip, which fills. */
async function flyCrown(toPip) {
  const from = $('#res-title').getBoundingClientRect(), to = toPip.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'fly';
  el.innerHTML = pip(true);
  document.body.appendChild(el);
  const x0 = from.left + Math.min(from.width, 150) + 16, y0 = from.top + from.height / 2;
  const x1 = to.left + to.width / 2, y1 = to.top + to.height / 2;
  const at = (x, y, s) => `translate(${x - 14}px, ${y - 14}px) scale(${s})`;
  await go(el, [
    { transform: at(x0, y0, 0.4), opacity: 0 },
    { transform: at((x0 + x1) / 2, Math.min(y0, y1) - 46, 1.25), opacity: 1, offset: 0.45 },
    { transform: at(x1, y1, 1), opacity: 1 },
  ], { duration: 460, easing: 'cubic-bezier(.45,.05,.3,1)' });
  el.remove();
  toPip.classList.add('is-on');
  sfx.tap();
  await go(toPip, [{ transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'cubic-bezier(.34,1.4,.64,1)' });
}

/** The one strong moment: paint fills the figure from the base to the head in 600 ms. */
async function fillPaint(figEl) {
  const paint = $('.paint', figEl), edge = $('.edge', figEl);
  figEl.classList.remove('is-locked');
  sfx.power();
  await Promise.all([
    go(paint, [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }], { duration: 600, easing: 'cubic-bezier(.45,.05,.3,1)' }),
    go(edge, [{ top: '100%', opacity: 1 }, { top: '4%', opacity: 1, offset: 0.92 }, { top: '0%', opacity: 0 }], { duration: 600, easing: 'cubic-bezier(.45,.05,.3,1)' }),
  ]);
  figEl.classList.add('is-new');
  haptic(14);
}
const glow = figEl => go(figEl, [
  { filter: 'drop-shadow(0 0 0 rgba(233,192,113,0))' },
  { filter: 'drop-shadow(0 0 16px rgba(233,192,113,.95))', offset: 0.3 },
  { filter: 'drop-shadow(0 0 0 rgba(233,192,113,0))' },
], { duration: 640, easing: 'ease-out' });

/** The unlock ritual in place on the result card. No claim step: the piece is already yours. */
async function ritual(piece, me, { chosen = false } = {}) {
  const box = $('#crowns');
  box.innerHTML = revealHTML(piece, { done: false, chosen });
  setActions(ACTIONS.unlock(piece), true);
  const join = $('.reveal-join', box), acts = $('#res-actions'), f = $('.fig', box);
  join.style.opacity = '0'; acts.style.opacity = '0';
  acts.inert = true;                                 // a hidden button never takes a tap or the focus
  await go($('.reveal', box), [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
  if (me !== run) return;
  await fillPaint(f);
  if (me !== run) return;
  join.style.opacity = ''; acts.style.opacity = ''; acts.inert = false;
  say(`New piece: ${PIECE[piece].name}. It joins your army.`);
  // Focus follows a player who works with focus (the board or a button); it never appears from nowhere.
  if (document.activeElement && document.activeElement !== document.body) $('.btn-primary', acts)?.focus({ preventScroll: true });
  await Promise.all([                                // the buttons come in with the glow, not after it
    glow(f),
    go(join, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 }),
    go(acts, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' }),
  ]);
}

/** The end of a real game: the card rises, a win adds a crown, a step on the ladder unlocks its piece. */
async function finishGame(st) {
  const me = run;
  skipping = false;
  const outcome = st.winner === 'w' ? 'win' : st.winner === 'b' ? 'loss' : 'draw';
  const moveNo = st.reason === 'checkmate' ? (st.turn === 'b' ? st.moveNumber : st.moveNumber - 1) : 0;
  const gained = outcome === 'win' && EARNS.has(level);
  if (gained) crowns++;
  const step = stepAt();                             // the step this crown counts toward, before an unlock
  const choice = choosing();
  const opens = !choice && gained && step && crowns >= step.at;
  if (opens) unlock(step.piece);                     // the piece is yours now, also if the motion stops
  await pause(520);                                  // the fallen king first
  if (me !== run) return;
  setView('result');
  setResultHead(outcome, moveNo);
  const box = $('#crowns');
  if (choice) {
    const flies = gained && crowns === AT[0];        // this crown opens the choice
    box.innerHTML = chooseHTML({ gained: gained && !flies, pending: flies });
    setActions(ACTIONS.choose(), true);
  } else {
    box.innerHTML = trackHTML({ step, pending: gained, outcome });
    setActions(opens ? '' : ACTIONS.after(), !!opens);
  }
  await riseIn($('#v-result'));
  if (me !== run) return;
  if (!gained) { if (outcome !== 'win') say('Your crowns stay.'); return; }
  const target = $('.pip.is-fresh:not(.is-on)', box);
  if (target) {
    await pause(80);
    if (me !== run) return;
    await flyCrown(target);
    if (me !== run) return;
  }
  const left = $('.left', box);
  if (left) left.textContent = left.dataset.after;
  if (choice) { say('+1 crown. Choose your next piece.'); return; }
  if (!opens) { const next = stepAt(); say(next ? `+1 crown. ${crownsWord(next.left)} to go.` : '+1 crown.'); return; }
  say('+1 crown.');
  await ritual(step.piece, me);
}

// ---- the lesson: the app's own one-move lessons (src/lessons.ts through the kit) -------------------

function startLesson(piece, from) {
  if (view !== 'lesson') back = { state: board.state, view, human: board.play.human, shelf: from === 'shelf' };
  run++;
  skipping = false;
  const L = KD.lessons[PIECE[piece].lesson];
  lesson = { piece, index: L.index, start: KD.fromFen(L.fen), done: false };
  board.play.human = 'both';
  setView('lesson');
  board.setState(lesson.start);
  const p = PIECE[piece];
  $('#ls-fig').innerHTML = fig(piece, 'sm');
  $('#ls-title').textContent = p.name;
  $('#ls-line').textContent = p.line;
  $('#ls-task').innerHTML = `${icon('target')}<span>${p.task}</span>`;
  $('#ls-task').classList.remove('is-done');
  $('#ls-more').hidden = true;
  $('#ls-actions').innerHTML = btn('lesson-back', 'Back', { ico: 'back' });
  $('#ls-actions').classList.remove('pair');
  $('#ls-task').focus({ preventScroll: true });
}

/** Back from a lesson: the view that opened it (the result card or a game), and Pieces again if it came from there. */
function lessonBack() {
  const b = back;
  back = null;
  run++;
  if (!b?.state || b.view === 'lesson') { showGame(KD.fromFen(WIN_FEN), { puzzle: true }); return; }
  showGame(b.state, { human: 'both', puzzle: puzzleSub });
  if (b.view === 'result') {
    fallLoser(b.state);
    setView('result');
    setResultHead(result.outcome, result.moveNo);
    showAfter();
    $('#res-actions .btn-primary')?.focus({ preventScroll: true });
  } else {
    board.play.human = b.human;
    board.maybeAi();
    renderTurn();
  }
  if (b.shelf) { renderShelf(); openSheet('pieces-sheet'); }
}

async function lessonMove(story) {
  if (!lesson || lesson.done) return;
  const me = run;
  if (KD.lessonGoal(lesson.index, lesson.start, story.lan)) {
    lesson.done = true;
    const p = PIECE[lesson.piece];
    $('#ls-task').innerHTML = `${icon('check')}<span>${p.done}</span>`;
    $('#ls-task').classList.add('is-done');
    $('#ls-more').textContent = p.more ?? '';
    $('#ls-more').hidden = !p.more;
    $('#ls-actions').innerHTML = btn('play-game', 'Play a game', { primary: true }) + btn('lesson-back', 'Back');
    $('#ls-actions').classList.add('pair');
    await go($('.ls-body'), [{ opacity: 0.4, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
    return;
  }
  $('#ls-task').innerHTML = `${icon('undo')}<span>Not quite. Try again.</span>`;
  await wait(900, { instant: true });
  if (me !== run || !lesson) return;
  board.setState(lesson.start);
  $('#ls-task').innerHTML = `${icon('target')}<span>${PIECE[lesson.piece].task}</span>`;
}

// ---- sheets: New game and Pieces ---------------------------------------------------------------

function renderPlaySheet() {
  $('#levels').innerHTML = LEVELS.map(([k, n]) => `<button type="button" class="chip" data-act="level" data-level="${k}" aria-pressed="${k === level}">${EARNS.has(k) ? icon('crown') : ''}<span>${n}</span></button>`).join('');
  $('#lvl-rule').innerHTML = `${icon('crown')}<span>Casual, Club and Strong wins give crowns.</span>`;
  const chess = [['queen', 'Queen'], ['rook', 'Rook'], ['bishop', 'Bishop'], ['knight', 'Knight']];
  $('#pool').innerHTML = [...chess.map(([t, n]) => [t, n, false]), ...owned().map(t => [t, PIECE[t].name, t === fresh])]
    .map(([t, n, isNew]) => `<li class="${isNew ? 'is-new' : ''}">${pieceIcon(t, 'w')}<span>${n}</span>${isNew ? '<span class="pill pill-gold">New</span>' : ''}</li>`).join('');
  const step = stepAt();
  $('#next-row').innerHTML = choosing()
    ? `<span class="next-ico">${icon('sparkle')}</span><p><b>Choose your next piece</b><br><span class="left">Your 2 crowns are ready.</span></p>
       <button type="button" class="btn btn-quiet" data-act="shelf">Choose</button>`
    : step
      ? `${fig(step.piece, 'xs', { look: lockedLook(step.piece) })}<p><span class="muted">Next piece:</span> <b>${PIECE[step.piece].name}</b>${lockedLook(step.piece) === 'met' ? ` ${metTag()}` : ''}<br><span class="left">${crownsWord(step.left)} to go</span></p>
       <button type="button" class="btn btn-quiet" data-act="shelf">All pieces</button>`
      : `<p>${icon('crown')} Every piece is in your army.</p>`;
}

let shelfPick = 'guard';
function shelfStatus(piece) {
  if (piece === 'paladin') return { kind: 'custom', tag: 'Custom armies', ico: 'book', text: 'It plays only in custom armies, not in the random army.' };
  const look = lookOf(piece);
  if (look === 'yours') return { kind: 'yours', tag: 'Yours', ico: 'check', text: 'It is in your random army.' };
  if (choosing()) return { kind: look, tag: 'Your pick', ico: 'sparkle', take: true,
    text: `${look === 'met' ? 'You met it in today\'s army. ' : ''}Your 2 crowns let you take one piece now.` };
  const at = atFor(piece);
  if (look === 'met') return { kind: 'met', tag: `Met · ${at} crowns`, ico: 'eye', text: `You met it in today's army. It joins your army at ${at} crowns. You have ${crowns}.` };
  return { kind: 'locked', tag: `${at} crowns`, ico: 'lock', text: `It joins your army at ${at} crowns. You have ${crowns}.` };
}
function renderShelf() {
  const step = stepAt();
  $('#shelf-sum').innerHTML = `${pip(true)}<b>${crownsWord(crowns)}</b>${choosing() ? '<span class="muted">· Choose your next piece</span>'
    : step ? `<span class="muted">· Next: ${PIECE[step.piece].name} at ${step.at}</span>` : ''}`;
  $('#shelf').innerHTML = SHELF.map(t => {
    const s = shelfStatus(t);
    return `<button type="button" class="tile is-${s.kind}" data-act="shelf-pick" data-piece="${t}" aria-pressed="${t === shelfPick}">
        ${fig(t, 'shelf', { look: lookOf(t), fresh: t === fresh })}<span class="ledge"></span>
        <b>${PIECE[t].name}</b><span class="st">${icon(s.ico)}${s.tag}</span></button>`;
  }).join('');
  const s = shelfStatus(shelfPick), p = PIECE[shelfPick];
  $('#detail').innerHTML = `<p class="d-name display">${p.name}</p><p class="d-line">${p.line}</p>
    <p class="d-st">${icon(s.ico)}<span>${s.text}</span></p>
    <div class="d-acts">${s.take ? btn('take', 'Take it', { primary: true, piece: shelfPick }) : ''}${btn('try', 'Try its move', { piece: shelfPick, ico: 'play' })}</div>`;
}

function closeAll() {
  for (const d of $$('dialog[open]')) { d.classList.remove('is-closing'); d.close(); }
  hideToast();
}

// ---- a random army from your pieces (the draw rules of docs/RULES.md §2) --------------------------

const LETTER = { queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', archer: 'A', beast: 'S', maester: 'M', ogre: 'O', guard: 'G' };
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/** Seven pieces from your pool, plus the king. A new piece is sure to play in its first random game. */
function randomArmy() {
  const pool = ['Q', 'R', 'R', 'B', 'B', 'N', 'N'];
  for (const t of owned()) pool.push(...(t === 'archer' || t === 'maester' ? [LETTER[t], LETTER[t]] : [LETTER[t]]));
  const first = fresh ? LETTER[fresh] : null;
  if (first) pool.splice(pool.indexOf(first), 1);
  for (;;) {
    const bag = first ? [first, ...shuffle([...pool]).slice(0, 6)] : shuffle([...pool]).slice(0, 7);
    const rank = shuffle([...bag, 'K']);
    const bishops = rank.map((c, i) => (c === 'B' ? i % 2 : -1)).filter(x => x >= 0);
    if (bishops.length < 2 || bishops[0] !== bishops[1]) return rank.join('');
  }
}

// ---- actions --------------------------------------------------------------------------------------

async function act(name, el) {
  switch (name) {
    case 'menu': openSheet('menu-sheet'); break;
    case 'new-game': await closeSheet('menu-sheet'); renderPlaySheet(); openSheet('play-sheet'); break;
    case 'shelf': closeAll(); if (choosing() && !LADDER.includes(shelfPick)) shelfPick = LADDER[0]; renderShelf(); openSheet('pieces-sheet'); break;
    case 'shelf-pick': shelfPick = el.dataset.piece; renderShelf(); $(`.tile[data-piece="${shelfPick}"]`)?.focus(); break;
    case 'level': level = el.dataset.level; renderPlaySheet(); $(`.chip[data-level="${level}"]`)?.focus(); renderWho(); break;
    case 'start': {
      run++;
      await closeSheet('play-sheet');
      const army = randomArmy(), isNew = fresh;
      fresh = null;                                  // the new piece has now played
      showGame(KD.newGame({ army }));
      toast(isNew ? `Your ${PIECE[isNew].name} is in this army.` : 'A random army from your pieces.');
      break;
    }
    case 'rematch': run++; showGame(KD.fromFen(WIN_FEN), { puzzle: true }); break;
    case 'review': toast('Review has its own demo.'); break;
    case 'later': {
      run++; finishMotion(); skipping = false;
      showAfter();
      await riseIn($('#crowns'));
      $('#res-actions .btn-primary')?.focus({ preventScroll: true });
      break;
    }
    case 'try': {
      const from = el.closest('#pieces-sheet') ? 'shelf' : 'result';
      closeAll();
      startLesson(el.dataset.piece, from);
      break;
    }
    case 'lesson-back': lessonBack(); break;
    case 'play-game': renderPlaySheet(); openSheet('play-sheet'); break;
    case 'pick': {                                   // option B on the result card
      if (!choosing()) break;
      const me = ++run;
      unlock(el.dataset.piece);
      await asFlow(me, () => ritual(el.dataset.piece, me, { chosen: true }));
      break;
    }
    case 'take': {                                   // option B in Pieces: the paint fills the tile in place
      if (!choosing()) break;
      const piece = el.dataset.piece, f = $(`.tile[data-piece="${piece}"] .fig`);
      unlock(piece);
      if (f) { await fillPaint(f); await glow(f); }
      renderShelf();
      if (view === 'result' && $('#crowns .choose')) showAfter();   // the card behind no longer offers the choice
      say(`New piece: ${PIECE[piece].name}. It joins your army.`);
      $(`.tile[data-piece="${piece}"]`)?.focus();
      break;
    }
    case 'hint': {
      const s = board.state;
      if (!s || KD.status(s).over) break;
      const turn = KD.status(s).turn;
      const mate = KD.legal(s).find(m => { const t = KD.status(KD.play(s, m)); return t.over && t.winner === turn; });
      const m = mate ?? await KD.think(s, { level: 'club', ms: 400 });
      if (!m || board.state !== s) break;
      board.selectSquare(m.from);
      board.mark(m.to, 'hint');
      break;
    }
    case 'undo': {
      const s = board.state;
      if (!s?.history.length) break;
      const plies = board.isHuman(KD.status(s).turn) && s.history.length > 1 ? 2 : 1;
      let prev = s;
      for (let i = 0; i < plies; i++) prev = KD.undo(prev);
      board.setState(prev);
      renderTurn();
      break;
    }
  }
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && !el.disabled) act(el.dataset.act, el);
});

// ---- first paint ----------------------------------------------------------------------------------

$('#menu-btn').innerHTML = icon('menu');
$('#hint-btn').innerHTML = `${icon('hint')}<span>Hint</span>`;
$('#undo-btn').innerHTML = `${icon('undo')}<span>Undo</span>`;
for (const b of $$('[data-close]')) b.innerHTML = icon('close');
for (const r of $$('.row-btn .chev')) r.innerHTML = icon('chevron');

function start() { setProgress(1); level = 'casual'; shelfPick = 'guard'; back = null; closeAll(); showGame(KD.fromFen(WIN_FEN), { puzzle: true }); }
start();

// ---- the demo contract (kit/README.md) ----------------------------------------------------------------

/** A finished game on the board: the mate played, the king down. */
function showMate(fen, lan) {
  showGame(KD.play(KD.fromFen(fen), lan), { human: 'both' });
  fallLoser(board.state);
}

window.demo = {
  async state(name) {
    run++;
    skipping = false;
    closeAll();
    level = 'casual'; back = null;
    board.play.human = 'both';
    switch (name) {
      case 'crown': {               // the first win: a crown lands on the track; the Maester waits in silhouette
        setProgress(1);
        showMate(WIN_FEN, WIN_MOVE);
        resultStill({ outcome: 'win', gained: true, moveNo: 24 });
        break;
      }
      case 'unlock': {              // the second win: paint has filled the Maester
        setProgress(2, ['maester'], { isNew: 'maester' });
        showMate(WIN_FEN, WIN_MOVE);
        resultStill({ outcome: 'win', moveNo: 24, unlocked: 'maester' });
        break;
      }
      case 'try-it': {              // Try its move: the Maester's own lesson, the swap marked
        setProgress(2, ['maester'], { isNew: 'maester' });
        showMate(WIN_FEN, WIN_MOVE);
        resultStill({ outcome: 'win', moveNo: 24, unlocked: 'maester' });
        startLesson('maester', 'result');
        board.selectSquare('d4');
        break;
      }
      case 'new-game': {            // the next random army is sure to draw the Maester
        setProgress(2, ['maester'], { isNew: 'maester' });
        showMate(WIN_FEN, WIN_MOVE);
        resultStill({ outcome: 'win', moveNo: 24 });
        renderPlaySheet(); openSheet('play-sheet');
        break;
      }
      case 'shelf': {               // Extra › Pieces: yours, met, locked
        setProgress(3, ['maester']); shelfPick = 'guard';
        showMate(WIN_FEN, WIN_MOVE);
        resultStill({ outcome: 'win', moveNo: 24 });
        renderShelf(); openSheet('pieces-sheet');
        break;
      }
      case 'loss': {                // a loss: the crowns stay
        setProgress(1);
        showMate(LOSS_FEN, LOSS_MOVE);
        resultStill({ outcome: 'loss', moveNo: 24 });
        break;
      }
      case 'choose': {              // option B: the player picks the next piece
        setProgress(2, [], { mode: 'choose' });
        showMate(WIN_FEN, WIN_MOVE);
        resultStill({ outcome: 'win', gained: true, moveNo: 24 });
        break;
      }
      default: throw new Error(`demo.state: no state "${name}"`);
    }
  },

  // The second win, the crown, the unlock, then the Maester's lesson.
  async play() {
    const me = ++run;
    skipping = false;
    closeAll();
    setProgress(1); level = 'casual'; back = null;
    showGame(KD.fromFen(WIN_FEN), { human: 'both', puzzle: true });
    await wait(800, { instant: true });
    if (me !== run) return;
    board.selectSquare('e5');
    await wait(900, { instant: true });
    if (me !== run) return;
    await board.playMove(WIN_MOVE);        // onMove starts the result flow
    if (me !== run) return;
    await flow;
    if (me !== run) return;
    await wait(1700, { instant: true });
    if (me !== run) return;
    const tryBtn = $('#res-actions [data-act="try"]');
    tryBtn?.classList.add('is-pressed');
    await wait(220, { instant: true });
    if (me !== run) return;
    startLesson('maester', 'result');
    const mine = run;
    await wait(900, { instant: true });
    if (mine !== run) return;
    board.selectSquare('d4');
    await wait(1000, { instant: true });
    if (mine !== run) return;
    await board.playMove('Md4<>e4');
    await wait(1600, { instant: true });
  },

  async reset() { run++; skipping = false; start(); },
};
