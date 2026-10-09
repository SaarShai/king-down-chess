// The muster and first sight.
// A new random army lands file by file, each White piece with its Black twin; then "Same army for both
// sides." Then a tag names each new piece type under its figure. After your first move each tag folds
// into a small dot on its figure. A hold (or a tap on the tag, or the I key) reads the piece and clears
// its dot; a move with a piece of that type clears it too. A tap skips the muster. Reduced motion, or
// Animations: Off, shows the army at once.
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceArt, ASSET_URL } from '../../kit/icons.js';
import { $, $$, openSheet, closeSheet, hideToast, prefersReducedMotion, animate, sfx } from '../../kit/ui.js';

const SEED = 24;   // a1 archer, b1 archer, c1 beast, d1 king, e1 maester, f1 guard, g1 knight, h1 knight
const ME = 'w';
const NEW = new Set(['archer', 'paladin', 'guard', 'maester', 'beast', 'ogre']);
const NAME = {
  pawn: 'Pawn', knight: 'Knight', bishop: 'Bishop', rook: 'Rook', queen: 'Queen', king: 'King',
  archer: 'Archer', paladin: 'Paladin', guard: 'Guard', maester: 'Maester', beast: 'Beast', ogre: 'Ogre',
};
// The short card lines of docs (king-down-facts.md §2); the chess pieces in the same voice.
const LINE = {
  archer: 'Shoots without moving, even over other pieces.',
  guard: 'Only a king can take it. It never takes.',
  maester: 'Swaps places with a friend next to it.',
  beast: 'After each bite, it can bite again.',
  ogre: 'Shoves a neighbour and steps into its place.',
  paladin: 'Jumps its own pieces. Taking more than a pawn costs it.',
  pawn: 'Steps forward. Takes on a forward diagonal.',
  knight: 'Jumps in an L shape, over other pieces.',
  bishop: 'Moves any distance on a diagonal.',
  rook: 'Moves any distance in a straight line.',
  queen: 'Moves any distance, straight or diagonal.',
  king: 'Steps one square in any direction. Keep it safe.',
};
// Normal: a wave, one file every 62 ms, each figure 260 ms (about 700 ms in all). Fast: one flip for all.
const SPEED = { normal: { stagger: 62, dur: 260 }, fast: { stagger: 0, dur: 240 } };
const EASE = 'cubic-bezier(.2,.8,.2,1)';
// A still of the muster: how far each file (a to h) is in its landing, in figure durations (1 = it stands).
// Each file at its own point, so one frame shows the wave: a and b stand (b glows), c, e and f are on the
// way, g and h are not in yet. d is the king, who stands from the start.
const WAVE = [1.6, 1.15, 0.7, 0.55, 0.42, 0.18, 0, 0];
const BARE = Array(8).fill(0);
const TOUCH = matchMedia('(hover: none)').matches;
const SAME = `${icon('flip')}<span>Same army for both sides.</span>`;
const READ_LINE = TOUCH ? 'New pieces. Hold one to read it.' : 'New pieces. Point at one to read it.';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const opts = { style: 'flip', speed: 'normal' };  // the option on show; Menu › Animations sets the speed
let phase = 'play';             // 'muster' | 'mustered' | 'first-sight' | 'play'
let folded = false;             // the tags have folded into dots (after your first move)
let unread = new Set();         // new piece types in this army that you have not read yet
const known = new Set();        // types you read or moved on this visit: no tag in the next army
let dotSq = new Map();          // type -> the square of the figure that carries its dot
let anims = [], figAnims = [], lands = [], ticks = [], parts = [];
let run = 0;                    // a new state, play, reset or game stops the old run
const waiters = [];

const stage = $('#stage'), rail = $('#rail'), ctx = $('#ctx');

// ---- static parts ----
for (const el of $$('[data-king]')) el.style.backgroundImage = `url(${ASSET_URL}kings/${el.dataset.king}.webp)`;
const label = (el, name, text) => { el.innerHTML = `${icon(name)}<span>${text}</span>`; };
label($('#hint'), 'hint', 'Hint');
label($('#undo'), 'undo', 'Undo');
label($('#menu-btn'), 'menu', 'Menu');
$('#read-close').innerHTML = icon('close');
$('#menu [data-close]').innerHTML = icon('close');

// ---- the board ----
const board = createBoard($('#board'), {
  play: { level: 'beginner', human: ME },
  label: 'King Down board against the computer. Arrow keys move, Enter or Space chooses, Escape cancels, I reads a piece.',
  onTap() { if (phase === 'muster') skip(); hideCard(); },   // the tap still selects or plays
  onInspect(sq, cell) { readAt(sq, cell); },
  onMove(story) { afterMove(story); },
});
const cellAt = sq => KD.board(board.state)[KD.sq.index(sq)];
const fileOf = sq => sq.charCodeAt(0) - 97;
const colRow = sq => (board.flipped ? { col: 7 - fileOf(sq), row: +sq[1] - 1 } : { col: fileOf(sq), row: 8 - sq[1] });
function onLayer(cls, sq) {
  const el = document.createElement('div'), { col, row } = colRow(sq);
  el.className = cls; el.dataset.sq = sq; el.setAttribute('aria-hidden', 'true');
  el.style.left = `${col * 12.5}%`; el.style.top = `${row * 12.5}%`;
  board.layer.appendChild(el);
  return el;
}
/** The squares' box, relative to the stage. */
function sqBox() {
  const s = board.layer.getBoundingClientRect(), p = stage.getBoundingClientRect();
  return { x: s.left - p.left, y: s.top - p.top, w: s.width, h: s.height };
}

// A tap or a key skips the muster to its end frame. A tap on a piece also selects it.
addEventListener('pointerdown', () => { if (phase === 'muster') skip(); }, { capture: true });
addEventListener('keydown', e => {
  if (phase === 'muster') skip();
  if (e.key === 'Escape' && !$('#read').hidden) hideCard();
}, { capture: true });

// ---- the muster ----
/** The drawn pieces: every figure on the two back ranks but the kings. */
const drawn = () => KD.board(board.state).filter(c => c && (c.sq[1] === '1' || c.sq[1] === '8') && c.type !== 'king');

function stopMuster() {
  ticks.forEach(clearTimeout); ticks = [];
  anims.forEach(a => a.cancel()); anims = []; figAnims = []; parts = [];
  lands.forEach(e => e.remove()); lands = [];
}
function skip() {
  ticks.forEach(clearTimeout); ticks = [];
  anims.forEach(a => a.finish());
}

/**
 * Land the drawn pieces, file by file; each twin with its twin. wave: stop each file at its own point
 * (a still frame, see WAVE). hold: show the bare board (kings and pawns) for that long first.
 * Resolves when the last figure stands.
 */
function muster({ wave = null, hold = 0 } = {}) {
  stopMuster();
  if (opts.speed === 'off' || prefersReducedMotion()) return Promise.resolve();
  const { stagger, dur } = SPEED[opts.speed];
  const times = new Set();
  for (const c of drawn()) {
    const fig = board.figure(c.sq);
    if (!fig) continue;
    const file = fileOf(c.sq), delay = file * stagger, o = { delay, duration: dur, fill: 'backwards', easing: EASE };
    const from = figAnims.length;
    if (opts.style === 'rise') {
      // Rise up: the figure comes up out of the stone at its own feet; the feet show as it settles.
      const img = fig.querySelector('img');
      const clip = y => `polygon(-60% -90%, 160% -90%, 160% ${y}%, -60% ${y}%)`;
      figAnims.push(fig.animate([{ clipPath: clip(86) }, { clipPath: clip(86), offset: 0.7 }, { clipPath: clip(112) }], { ...o, easing: 'linear' }));
      if (img) figAnims.push(img.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(-4%)', offset: 0.78 }, { transform: 'none' }], o));
      figAnims.push(fig.animate([{ opacity: 0 }, { opacity: 1 }], { ...o, pseudoElement: '::before' }));
    } else {
      // Flip in: the figure turns to face you as it drops onto its square, like a card turned face up.
      figAnims.push(fig.animate([
        { transform: 'perspective(420px) translateY(-14%) rotateY(90deg)', opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { transform: 'perspective(420px) translateY(0) rotateY(0deg)', opacity: 1 },
      ], o));
    }
    for (const a of figAnims.slice(from)) parts.push({ a, file, lead: 0 });
    // A soft gold on the ground where it lands: both twins of a file glow at the same moment.
    const land = onLayer('mu-land', c.sq);
    lands.push(land);
    const glow = land.animate([{ opacity: 0 }, { opacity: 0.7, offset: 0.3 }, { opacity: 0 }], { delay: delay + dur * 0.6, duration: 380, easing: 'ease-out' });
    anims.push(glow);
    parts.push({ a: glow, file, lead: 0.6 });
    times.add(delay + dur * 0.6);
  }
  anims.push(...figAnims);
  if (wave) {
    // Linear timing, so each figure shows the true pose of its own point in the landing.
    for (const { a, file, lead } of parts) {
      a.pause();
      a.effect.updateTiming({ easing: 'linear' });
      a.currentTime = a.effect.getTiming().delay + (wave[file] - lead) * dur;
    }
  } else if (hold) for (const a of anims) { a.pause(); a.currentTime = 0; }
  if (!wave) {
    if (hold) ticks.push(setTimeout(() => anims.forEach(a => a.play()), hold));
    for (const t of times) ticks.push(setTimeout(() => sfx.tap(), hold + t));   // one soft tick for each file, like a deal
  }
  return Promise.all(figAnims.map(a => a.finished.catch(() => {})));
}

/** A new army's first seconds: the muster, the mirror line, then the first-sight tags. */
async function intro(me, { wave = null, hold = 0 } = {}) {
  phase = 'muster';
  say('New game', 'Beginner · Random army', { fade: false });
  await muster({ wave, hold });
  if (me !== run) return;
  phase = 'mustered';
  announceArmy();
  say('Your move', SAME);
  await sleep(1400);
  if (me !== run || phase !== 'mustered') return;   // a first move already folded the tags into dots
  showTags();
}

// ---- first sight: tags under the board ----
function clearTags() { rail.replaceChildren(); syncRail(); }
function syncRail() { stage.classList.toggle('has-tags', rail.children.length > 0); }

function showTags({ instant = false } = {}) {
  phase = 'first-sight';
  clearTags();
  const firsts = new Map();   // the first figure of each new type on your side, a to h
  for (const c of KD.board(board.state)) if (c && c.color === ME && unread.has(c.type) && !firsts.has(c.type)) firsts.set(c.type, c.sq);
  for (const [type, sq] of firsts) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tag'; b.dataset.type = type; b.dataset.sq = sq;
    b.setAttribute('aria-label', `${NAME[type]}, a new piece. Read it.`);
    b.innerHTML = `<span class="tag-pill"><i class="tag-notch"></i><i class="tag-dot"></i>${NAME[type]}</span>`;
    b.addEventListener('click', () => { const at = [...KD.board(board.state)].find(c => c && c.color === ME && c.type === type); if (at) readAt(at.sq, at); });
    rail.appendChild(b);
  }
  layoutTags();
  syncRail();
  if (!firsts.size) return;
  say('Your move', READ_LINE);
  if (!instant) $$('.tag-pill', rail).forEach((p, i) => animate(p, [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: i * 50, easing: EASE, fill: 'backwards' }));
}

/** Each tag under its file; tags that would touch move apart, and each notch still points at its figure. */
function layoutTags() {
  const tags = $$('.tag', rail);
  if (!tags.length) return;
  const g = sqBox(), t = g.w / 8, min = g.x - t * 0.2, max = g.x + g.w + t * 0.2, gap = 4;
  const items = tags.map(el => ({ el, c: g.x + (colRow(el.dataset.sq).col + 0.5) * t, w: el.offsetWidth })).sort((a, b) => a.c - b.c);
  items.forEach(it => { it.l = it.c - it.w / 2; });
  for (let i = 0; i < items.length; i++) items[i].l = Math.max(items[i].l, i ? items[i - 1].l + items[i - 1].w + gap : min);
  for (let i = items.length - 1; i >= 0; i--) items[i].l = Math.min(items[i].l, i < items.length - 1 ? items[i + 1].l - gap - items[i].w : max - items[i].w);
  for (const it of items) {
    const pill = it.el.querySelector('.tag-pill'), inset = (it.w - pill.offsetWidth) / 2;
    it.el.style.left = `${it.l}px`;
    it.el.style.top = `${g.y + g.h + 1}px`;
    pill.style.setProperty('--nx', `${Math.max(9, Math.min(pill.offsetWidth - 9, it.c - it.l - inset))}px`);
  }
}
new ResizeObserver(() => { layoutTags(); }).observe(stage);

// ---- after the first move: tags fold into dots ----
function placeDots() {
  // Keep each dot on a figure of its type: the same figure when it can (trackDots), else the first one.
  const cells = KD.board(board.state);
  for (const type of [...dotSq.keys()]) {
    const at = dotSq.get(type), c = at && cells[KD.sq.index(at)];
    if (!unread.has(type)) { dotSq.delete(type); continue; }
    if (c && c.color === ME && c.type === type) continue;
    const other = cells.find(x => x && x.color === ME && x.type === type);
    if (other) dotSq.set(type, other.sq); else dotSq.delete(type);
  }
}
function renderDots() {
  $$('.mu-dot', board.layer).forEach(d => d.remove());
  if (!folded || !board.state) return [];
  placeDots();
  return [...dotSq].map(([type, sq]) => { const d = onLayer('mu-dot', sq); d.dataset.type = type; return d; });
}
function trackDots(story) {
  for (const [type, sq] of dotSq) {
    let at = sq;
    if (story.push && sq === story.push.from) at = story.push.to;
    else if (story.side === ME && story.kind === 'swap' && (sq === story.from || sq === story.to)) at = sq === story.from ? story.to : story.from;
    else if (story.side === ME && sq === story.from) at = story.to;
    dotSq.set(type, at);
  }
}
const dotCenter = sq => { const r = board.squareRect(sq); return { x: r.left + r.width * 0.8, y: r.top + r.height * 0.8 }; };

function fold() {
  folded = true; phase = 'play';
  const tags = $$('.tag', rail);
  // A dot only for a tag the player saw. A first move before the tags gives no dots; the tags show next game.
  dotSq = new Map();
  for (const t of tags) if (unread.has(t.dataset.type)) dotSq.set(t.dataset.type, t.dataset.sq);
  const dots = renderDots();
  if (!tags.length || opts.speed === 'off' || prefersReducedMotion()) { clearTags(); return; }
  for (const d of dots) d.style.opacity = '0';
  tags.forEach((t, i) => {
    t.style.pointerEvents = 'none';
    const pill = t.querySelector('.tag-pill'), dotIn = t.querySelector('.tag-dot'), dot = dots.find(d => d.dataset.type === t.dataset.type);
    if (!dot) { t.remove(); syncRail(); return; }
    const a = dotIn.getBoundingClientRect(), p = pill.getBoundingClientRect(), b = dotCenter(dot.dataset.sq);
    const ax = a.left + a.width / 2, ay = a.top + a.height / 2, to = `translate(${(b.x - ax).toFixed(1)}px, ${(b.y - ay).toFixed(1)}px) scale(.16)`;
    pill.style.transformOrigin = `${(ax - p.left).toFixed(1)}px 50%`;
    pill.animate([{ transform: 'none', opacity: 1 }, { transform: to, opacity: 1, offset: 0.86 }, { transform: to, opacity: 0 }],
      { duration: 300, delay: i * 45, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' })
      .finished.catch(() => {}).then(() => {
        t.remove(); syncRail();
        dot.style.opacity = '';
        dot.animate([{ transform: 'scale(.3)' }, { transform: 'scale(1.25)', offset: 0.6 }, { transform: 'none' }], { duration: 200, easing: 'ease-out', pseudoElement: '::after' });
      });
  });
}

// ---- reading a piece: the card in the context area ----
function readAt(sq, cell) {
  if (!cell) return;
  if (phase === 'muster') skip();
  $('#read-art').src = pieceArt(cell.type, cell.color, cell.design);
  $('#read-name').textContent = NAME[cell.type];
  $('#read-side').textContent = cell.color === ME ? 'Yours' : 'Theirs';
  $('#read-line').textContent = LINE[cell.type];
  const card = $('#read'), was = !card.hidden;
  card.hidden = false;
  ctx.classList.add('is-reading');
  board.clearMarks('glow');
  board.mark(sq, 'glow', { colour: '233,192,113' });
  if (!was) animate(card, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: EASE });
  $('#sr-new').textContent = `${NAME[cell.type]}, ${cell.color === ME ? 'yours' : 'theirs'}. ${LINE[cell.type]}`;
  if (meet(cell.type) && phase === 'first-sight' && !unread.size) say('Your move', SAME, { fade: false });
}
/** The player met a type (read it, or moved a piece of it): its tag and its dot go, and no tag next game. */
function meet(type) {
  if (!unread.delete(type)) return false;
  known.add(type);
  dotSq.delete(type);
  const tag = rail.querySelector(`.tag[data-type="${type}"]`);
  if (tag) { tag.style.pointerEvents = 'none'; animate(tag, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.85)' }], { duration: 160, easing: 'ease-in', fill: 'forwards' }).then(() => { tag.remove(); syncRail(); }); }
  for (const d of $$(`.mu-dot[data-type="${type}"]`, board.layer)) animate(d, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).then(() => d.remove());
  return true;
}
function hideCard() {
  const card = $('#read');
  if (card.hidden) return;
  const focusIn = card.contains(document.activeElement);
  card.hidden = true;
  ctx.classList.remove('is-reading');
  board.clearMarks('glow');
  if (focusIn) board.el.focus({ preventScroll: true });
}
$('#read-close').addEventListener('click', hideCard);

// ---- the context lines ----
let said = '';
function say(title, sub, { fade = true } = {}) {
  if (said === title + sub) return;
  said = title + sub;
  $('#title').textContent = title;
  $('#sub').innerHTML = sub;
  if (fade) animate($('#lines'), [{ opacity: 0.15 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
}
function announceArmy() {
  const rank = KD.board(board.state).slice(0, 8).map(c => NAME[c.type]).join(', ');
  const fresh = [...unread].map(t => NAME[t]).join(', ');
  $('#sr-new').textContent = `Your back rank, a to h: ${rank}.${fresh ? ` New pieces: ${fresh}. Press I on a piece to read it.` : ''}`;
}
function moveLine(st) {
  const who = st.side === ME ? 'Your' : 'Their', whose = st.side === ME ? 'their' : 'your';
  const victim = Array.isArray(st.captured) && typeof st.captured[0] === 'string' ? `${whose} ${st.captured[0]}` : 'a piece';
  switch (st.kind) {
    case 'shoot': return `${who} ${st.piece} shoots ${victim}.`;
    case 'chain': return `${who} ${st.piece} bites ${st.capturedOn.length} times.`;
    case 'capture': return `${who} ${st.piece} takes ${victim}.`;
    case 'push': return `${who} ${st.piece} shoves a piece to ${st.push.to}.`;
    case 'swap': return `${who} ${st.piece} swaps places.`;
    case 'move': return `${who} ${st.piece} moves to ${st.to}.`;
    default: return st.text;
  }
}

// ---- the game ----
function afterMove(story) {
  hideCard();
  board.clearMarks('hint');
  if (story.side === ME) meet(story.piece);   // a move with a new piece: the player has met it
  if (story.side === ME && !folded) { trackFirst(story); fold(); } else { trackDots(story); renderDots(); }
  const st = KD.status(board.state);
  if (st.over) say(st.text, moveLine(story));
  else if (st.turn === ME) say('Your move', moveLine(story));
  else say('Their move', board.play.human === ME ? 'The computer thinks.' : moveLine(story));
  updateUndo();
  for (const w of [...waiters]) if (w.side === story.side) { waiters.splice(waiters.indexOf(w), 1); w.resolve(story); }
}
// The first move can move a tagged figure: its tag folds onto the square where it now stands.
function trackFirst(story) {
  for (const t of $$('.tag', rail)) {
    if (t.dataset.sq === story.from && story.from !== story.to) t.dataset.sq = story.to;
    else if (story.kind === 'swap' && t.dataset.sq === story.to) t.dataset.sq = story.from;
    else if (story.push && t.dataset.sq === story.push.from) t.dataset.sq = story.push.to;
  }
}
function updateUndo() { $('#undo').disabled = !board.state?.history.length; }

/** Show a game at once: no muster yet, no tags, no card. */
function startGame(state, { human = ME } = {}) {
  run++;
  stopMuster(); hideToast(); hideCard(); clearTags();
  folded = false; phase = 'play'; dotSq = new Map(); said = '';
  $('#sr-new').textContent = '';
  board.clearMarks('glow'); board.clearMarks('hint');
  board.play.human = human;
  board.setState(state);
  unread = new Set(KD.board(state).filter(c => c && c.color === ME && NEW.has(c.type) && !known.has(c.type)).map(c => c.type));
  renderDots();
  updateUndo();
  return run;
}
const army = () => KD.newGame({ army: 'random', seed: SEED });
function newArmy(state) { const me = startGame(state); intro(me); }

// ---- the bar and the menu ----
$('#hint').addEventListener('click', async () => {
  const s = board.state;
  if (!s || board.busy) return;
  const st = KD.status(s);
  if (st.over || !board.isHuman(st.turn)) return;
  if (phase === 'muster') skip();
  const m = await KD.think(s, { level: 'casual', ms: 300 });
  if (!m || board.state !== s) return;
  board.clearMarks('hint');
  board.mark([m.from, m.to], 'hint');
  say('Your move', `Hint: your ${NAME[cellAt(m.from).type].toLowerCase()} on ${m.from}.`);
});
$('#undo').addEventListener('click', () => {
  let s = board.state;
  if (!s?.history.length) return;
  const plies = board.play.human === ME && KD.status(s).turn === ME && s.history.length >= 2 ? 2 : 1;
  for (let i = 0; i < plies; i++) s = KD.undo(s);
  hideCard(); board.clearMarks('hint');
  board.setState(s);
  renderDots(); updateUndo();
  say(KD.status(s).turn === ME ? 'Your move' : 'Their move', s.history.length ? '' : SAME);
});
$('#menu-btn').addEventListener('click', () => openSheet('menu'));
$('#new').addEventListener('click', async () => { await closeSheet('menu'); newArmy(KD.newGame({ army: 'random' })); });
$('#rematch').addEventListener('click', async () => {
  await closeSheet('menu');
  let s = board.state;
  while (s.history.length) s = KD.undo(s);
  // The same army: nothing new to reveal, so no muster. The dots (or the tags on show) stay as dots.
  const kept = folded ? [...dotSq.keys()] : $$('.tag', rail).map(t => t.dataset.type);
  startGame(s);
  folded = true;
  for (const type of kept) if (unread.has(type)) dotSq.set(type, null);
  renderDots();
  say('Your move', SAME);
});
const syncSpeed = () => $$('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.speed === opts.speed)));
$$('[data-speed]').forEach(b => b.addEventListener('click', () => { opts.speed = b.dataset.speed; syncSpeed(); }));
const sound = $('#sound');
sound.checked = !sfx.muted;
sound.addEventListener('change', () => sfx.setMuted(!sound.checked));

// ---- the first view: a live game that starts with a muster ----
newArmy(army());

// ---- the demo contract (kit/README.md): state(name), play(), reset() ----
/** Each state starts from the same army, with the computer stopped. */
function base({ style = 'flip', speed = 'normal' } = {}) {
  opts.style = style; opts.speed = speed; syncSpeed();
  closeSheet('menu');
  known.clear();
  return startGame(army(), { human: 'both' });
}
function nextMove(side, ms = 8000) {
  return Promise.race([new Promise(resolve => waiters.push({ side, resolve })), sleep(ms)]);
}
async function fingerHold(sq) {
  const el = onLayer('mu-touch', sq);
  await animate(el, [{ opacity: 0, transform: 'scale(1.35)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
  await sleep(420);
  readAt(sq, cellAt(sq));
  await animate(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' });
  el.remove();
}

window.demo = {
  async state(name) {
    switch (name) {
      case 'bare': intro(base(), { wave: BARE }); break;
      case 'muster': intro(base(), { wave: WAVE }); break;
      case 'mustered': base(); phase = 'mustered'; announceArmy(); say('Your move', SAME, { fade: false }); break;
      case 'first-sight': base(); announceArmy(); showTags({ instant: true }); break;
      case 'read': base(); announceArmy(); showTags({ instant: true }); readAt('a1', cellAt('a1')); break;
      case 'folded': {
        base();
        const s1 = KD.play(army(), 'e2-e4'), reply = KD.describe(s1, 'e7-e5');
        board.setState(reply.next);
        folded = true; phase = 'play';
        for (const type of unread) dotSq.set(type, null);
        renderDots(); updateUndo();
        say('Your move', moveLine(reply), { fade: false });
        break;
      }
      case 'rise': intro(base({ style: 'rise' }), { wave: WAVE }); break;
      default: throw new Error(`demo.state: no state "${name}"`);
    }
  },
  // The story: the bare board, the muster, the mirror line, the tags; a hold reads the Archer;
  // the first move folds the tags into dots; the real Beginner computer answers.
  async play() {
    const me = base({ style: opts.style, speed: opts.speed });
    const alive = () => me === run;
    await intro(me, { hold: 650 });
    if (!alive()) return;
    await sleep(1600);
    if (!alive()) return;
    await fingerHold('a1');
    await sleep(2600);
    if (!alive()) return;
    hideCard();
    await sleep(500);
    if (!alive()) return;
    board.selectSquare('e2');
    await sleep(800);
    if (!alive()) return;
    board.play.human = ME;
    const reply = nextMove('b');
    await board.playMove('e2-e4');
    await reply;
    if (!alive()) return;
    await sleep(1800);
  },
  async reset() { known.clear(); newArmy(army()); },
};
