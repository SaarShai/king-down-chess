// Starting a game: A one short sheet, B one Play that names the setup, C the levels as faces.
// The start ends in the muster of feat-muster: the new army flips in file by file on the real board.
import { createBoard, KD } from '../../kit/board.js';
import { icon, pieceIcon } from '../../kit/icons.js';
import { $, $$, openSheet, closeSheet, toast, hideToast, animate, wait, sfx, prefersReducedMotion } from '../../kit/ui.js';

const ASSETS = '../../assets/';
const TODAY_SEED = 20261008;          // Today's army: the app seeds it with the date (YYYYMMDD)
const DEMO_SEED = 8;                  // a random army with an Ogre, a Maester, an Archer, a Beast and a Guard
const OLD_ARMY = 'ONAQKBSM';          // the game behind the sheet
const OLD_MOVES = ['e2-e4', 'e7-e5', 'Nb1-c3', 'Nb8-c6', 'd2-d3', 'Bf8-c5', 'Ac1-d2', 'd7-d6'];

const LEVELS = [
  { id: 'beginner', name: 'Beginner', line: 'New to King Down? Start here.', face: 'hare-scout', who: 'Hare Scout' },
  { id: 'casual', name: 'Casual', line: 'Relaxed. It makes mistakes.', face: 'owl-archivist', who: 'Owl Archivist' },
  { id: 'club', name: 'Club', line: 'A solid player. Keep your pieces safe.', face: 'fox-pathfinder', who: 'Fox Pathfinder', crop: '50% 0%' },
  { id: 'strong', name: 'Strong', line: 'Thinks longer. A real fight.', face: 'antler-guardian', who: 'Antler Guardian' },
];
const level = id => LEVELS.find(l => l.id === id);

// One short line for each power, cut from the engine's text (KD.kings()[k].powers[p].text, docs/RULES.md §4).
// Each line keeps the power's limit ("not the king", "takes only ..."). 13 words or fewer.
const LINE = {
  Freeze: 'Freeze an enemy piece, not the king. Then make your move.',
  IceWall: 'Wall your piece, not the king. Nothing can take it next turn.',
  Strike: 'A piece, not a pawn or king, moves like a queen without taking.',
  Haste: 'Move one piece twice in one turn. Neither move takes.',
  Flight: 'Move a piece, not the king, to an empty square in your half.',
  Sacrifice: 'Turn a pawn into a piece you lost, not a pawn or guard.',
  March: 'Your pawns can step two squares from any rank.',
  Leap: 'Your rook, bishop or queen can pass over your own pawns.',
  HolyLight: 'Pawns cannot take your king. Your pieces on its four sides are safe.',
  Mercy: 'Your king steps two and jumps. It takes only pawns and guards.',
  DeathTouch: 'Your king takes without moving. It can take only this way.',
  Darkness: 'Your pawns also step diagonally, but take only straight ahead.',
};
const KINGS = KD.kings();
// The uses tag comes from the engine: the count a new game gives, or none for an always-on power.
const USES = Object.fromEntries(KINGS.flatMap(k => k.powers.map(p => {
  const n = KD.usesLeft(KD.newGame({ army: 'chess', powers: [`${k.king}:${p.power}`, null] }), 'w');
  return [p.power, n == null ? 'Always on' : n === 1 ? '1 use' : `${n} uses`];
})));
const king = name => KINGS.find(k => k.king === name);
const powerName = p => (p ? KINGS.flatMap(k => k.powers).find(x => x.power === p)?.name ?? p : 'No power');

const POOL = ['queen', 'rook', 'bishop', 'knight', 'archer', 'guard', 'maester', 'beast', 'ogre'];
const ARMY = {
  random: { name: 'Random army', line: 'Each game draws 7 from these. Both sides get the same.' },
  today: { name: "Today's army", line: 'Everyone gets this army today.' },
  chess: { name: 'Chess army', line: 'The chess army. No new pieces.' },
};
const SIDE = { w: 'White', b: 'Black' };

const fresh = () => ({
  mode: 'computer', level: 'beginner', side: 'w', army: 'random', device: 'here', twoPowers: false,
  you: { king: 'Frost', power: 'Freeze' }, them: { king: 'Flame', power: 'Strike' }, open: 'you', fold: false,
});
let cfg = fresh();
let faces = false;       // option C
let fromGame = false;    // the sheet opened over a game in play: name what Start ends

// ---- small helpers ----
for (const el of $$('[data-icon]')) el.outerHTML = icon(el.dataset.icon);
for (const el of $$('[data-piece]')) { const [t, c] = el.dataset.piece.split(' '); el.outerHTML = pieceIcon(t, c); }
const btn = (el, name, text) => { el.innerHTML = `${icon(name)}<span>${text}</span>`; };
btn($('#hint'), 'hint', 'Hint');
btn($('#undo'), 'undo', 'Undo');
btn($('#new'), 'plus', 'New game');
$('#go-home').innerHTML = icon('back');
$('#ng-close').innerHTML = icon('close');
$('#quick-change').innerHTML = `${icon('settings')}<span>Change</span>`;
const setRadio = (name, v) => { const el = document.querySelector(`input[name="${name}"][value="${v}"]`); if (el) el.checked = true; };
const powered = c => c.mode === 'powers' || (c.mode === 'two' && c.twoPowers);
const kingArt = (k, color) => {
  const design = k.power ? king(k.king).design : color === 'w' ? 'spirit' : 'shadow';
  return `${ASSETS}kings/${design}${color === 'b' ? '-b' : ''}.webp`;
};
// The side that each slot plays: "you" is White in a two-player game.
const colorOf = (who, c = cfg) => (c.mode === 'two' ? (who === 'you' ? 'w' : 'b') : who === 'you' ? c.side : c.side === 'w' ? 'b' : 'w');
const reveal = el => { el.classList.remove('reveal'); void el.offsetWidth; el.classList.add('reveal'); };

// ---- the level row: words (A) and faces (C) ----
$('#level-words').innerHTML = LEVELS.map(l => `<label><input type="radio" name="level" value="${l.id}"><span>${l.name}</span></label>`).join('');
$('#level-faces').innerHTML = LEVELS.map(l => `<label><input type="radio" name="level-face" value="${l.id}">
  <span class="por"><img src="${ASSETS}workshop/${l.face}-b.webp" alt=""${l.crop ? ` style="transform-origin: ${l.crop}; transform: scale(1.3)"` : ''}></span><span class="tick">${icon('check')}</span>
  <span class="nm">${l.who}</span><span class="lv">${l.name}</span></label>`).join('');

function renderLevel() {
  setRadio('level', cfg.level); setRadio('level-face', cfg.level);
  $('#level-words').hidden = faces; $('#level-faces').hidden = !faces;
  const l = level(cfg.level);
  $('#level-line').innerHTML = faces ? `<b>${l.who}</b> · ${l.line}` : l.line;
}

// ---- the king picker: one open at a time ----
const picker = $('#tpl-picker').content.firstElementChild.cloneNode(true);
const embRow = picker.querySelector('.emb-row');
embRow.setAttribute('aria-label', 'King');
picker.querySelector('.powers').setAttribute('aria-label', 'Power');
embRow.innerHTML = KINGS.map(k => `<label><input type="radio" name="king" value="${k.king}">
  <span class="disc"><img src="${ASSETS}emblems/${k.design}.webp" alt=""></span><span class="nm">${k.king}</span></label>`).join('');

function slotTitle(who) {
  if (cfg.mode === 'two') return who === 'you' ? "White's king" : "Black's king";
  return who === 'you' ? 'Your king' : 'Their king';
}
function renderPicker(anim = false) {
  const who = cfg.open, k = cfg[who], color = colorOf(who);
  picker.querySelector('.pick-h').textContent = slotTitle(who);
  setRadio('king', k.king);
  const img = picker.querySelector('.king-fig img');
  img.src = kingArt(k, color);
  picker.querySelector('.king-name').textContent = k.power ? k.king : 'Plain king';
  const rows = king(k.king).powers.map(p => `<label><input type="radio" name="power" value="${p.power}"${k.power === p.power ? ' checked' : ''}>
      <span class="rd"></span><span class="pn">${p.name}<span class="pill">${USES[p.power]}</span></span><span class="pl">${LINE[p.power]}</span></label>`);
  rows.push(`<label><input type="radio" name="power" value=""${k.power ? '' : ' checked'}><span class="rd"></span><span class="pn">No power</span><span class="pl">A plain king.</span></label>`);
  picker.querySelector('.powers').innerHTML = rows.join('');
  if (anim) animate(img, [{ opacity: 0.2, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
}
function summaryRow(who) {
  const k = cfg[who];
  // The same summary row as Side and army: the whole row is one button.
  return `<button type="button" class="fold-row krow" data-change="${who}" aria-expanded="false">
    <span class="disc"><img src="${ASSETS}emblems/${king(k.king).design}.webp" alt=""></span>
    <span class="txt"><span class="lbl">${slotTitle(who)}</span><span class="val">${k.king} · ${powerName(k.power)}</span></span>
    <span class="chg">Change${icon('chevron-down')}</span></button>`;
}
function renderKings() {
  for (const slot of $$('.king-slot')) {
    const who = slot.dataset.who;
    if (who === cfg.open) { if (picker.parentNode !== slot) slot.replaceChildren(picker); }
    else slot.innerHTML = summaryRow(who);
  }
  renderPicker();
}
embRow.addEventListener('change', e => {
  const k = cfg[cfg.open];
  k.king = e.target.value;
  k.power = king(k.king).powers[0].power;
  renderPicker(true); renderFold();
});
picker.querySelector('.powers').addEventListener('change', e => {
  const k = cfg[cfg.open], had = !!k.power;
  k.power = e.target.value || null;
  if (had !== !!k.power) {           // the figure changes: the king with its power, or the plain king
    const img = picker.querySelector('.king-fig img');
    img.src = kingArt(k, colorOf(cfg.open));
    picker.querySelector('.king-name').textContent = k.power ? k.king : 'Plain king';
  }
});
$('#grp-kings').addEventListener('click', e => {
  const b = e.target.closest('[data-change]');
  if (!b) return;
  cfg.open = b.dataset.change;
  renderKings();
  reveal(picker);
  picker.querySelector('input[name="king"]:checked')?.focus();
});

// ---- the fold: Side and Army in one row ----
function renderFold() {
  const two = cfg.mode === 'two';
  $('#fold .fold-row .lbl').textContent = two ? 'Army' : 'Side and army';
  $('#fold-val').textContent = two ? ARMY[cfg.army].name : `${SIDE[cfg.side]} · ${ARMY[cfg.army].name}`;
  $('#fold-row').setAttribute('aria-expanded', String(cfg.fold));
  $('#fold-body').hidden = !cfg.fold;
  $('#side-row').hidden = two;
  setRadio('side', cfg.side); setRadio('army', cfg.army);
  const icons = cfg.army === 'random' ? POOL.map(t => pieceIcon(t, 'w'))
    : backRank(cfg.army).map(t => pieceIcon(t, 'w'));
  $('#army-strip').innerHTML = icons.join('');
  $('#army-strip').setAttribute('aria-label', cfg.army === 'random' ? `Can draw: ${POOL.join(', ')}` : `Back rank: ${backRank(cfg.army).join(', ')}`);
  $('#army-strip').setAttribute('role', 'img');
  $('#army-line').textContent = ARMY[cfg.army].line;
}
function backRank(army) {
  const s = army === 'chess' ? KD.newGame({ army: 'chess' }) : KD.newGame({ army: 'random', seed: TODAY_SEED });
  return KD.board(s).slice(0, 8).map(c => c.type);
}
$('#fold-row').addEventListener('click', () => {
  cfg.fold = !cfg.fold;
  renderFold();
  if (cfg.fold) reveal($('#fold-body'));
});

// ---- the mode decides which rows show ----
function renderMode(anim = false) {
  setRadio('mode', cfg.mode); setRadio('device', cfg.device);
  $('#two-powers').checked = cfg.twoPowers;
  const vis = {
    '#grp-level': cfg.mode !== 'two',
    '#grp-two': cfg.mode === 'two',
    '#grp-kings': powered(cfg),
  };
  for (const [sel, on] of Object.entries(vis)) {
    const el = $(sel), was = !el.hidden;
    el.hidden = !on;
    if (anim && on && !was) reveal(el);
  }
  $('#two-line').textContent = cfg.device === 'here' ? 'Pass the device after each move.' : 'Send a link after each move.';
  renderLevel(); renderKings(); renderFold(); renderFoot();
}
function renderFoot() {
  const s = board.state, st = s && KD.status(s), live = fromGame && s && !st.over && s.history.length > 0;
  $('#ng-warn').hidden = !live;
  if (live) $('#ng-warn').textContent = `This ends your game at move ${st.moveNumber}.`;
  $('#start').textContent = live ? 'Start new game' : 'Start game';
}

$('#ng-body').addEventListener('change', e => {
  const t = e.target;
  if (t.name === 'mode') { cfg.mode = t.value; if (cfg.open !== 'you') cfg.open = 'you'; renderMode(true); }
  else if (t.name === 'level' || t.name === 'level-face') { cfg.level = t.value; renderLevel(); }
  else if (t.name === 'device') { cfg.device = t.value; renderMode(); }
  else if (t.id === 'two-powers') { cfg.twoPowers = t.checked; renderMode(true); }
  else if (t.name === 'side') { cfg.side = t.value; renderFold(); renderKings(); }
  else if (t.name === 'army') { cfg.army = t.value; renderFold(); }
});

function openNewGame({ game = false } = {}) {
  fromGame = game;
  renderMode();
  openSheet('ng');
  $('#ng-body').scrollTop = 0;
}
function closeNow() { const d = $('#ng'); if (d.open) { d.classList.remove('is-closing'); d.close(); } }

// ---- the game screen ----
const board = createBoard($('#board'), {
  play: { level: 'beginner', human: 'w' },
  label: 'King Down board. Arrow keys move, Enter or Space chooses, Escape cancels, I shows a piece.',
  onMove() { musterLine = false; renderStatus(); },
});
let musterLine = false;

function face(el, src, kind) { el.innerHTML = `<img class="${kind}" src="${src}" alt="">`; }
function setPlates(c) {
  const p = powered(c), two = c.mode === 'two';
  const youC = colorOf('you', c), themC = colorOf('them', c);
  const l = level(c.level);
  if (p) face($('#them-face'), `${ASSETS}emblems/${king(c.them.king).design}.webp`, 'emb');
  else if (faces && !two) {
    face($('#them-face'), `${ASSETS}workshop/${l.face}-b.webp`, 'fig');
    if (l.crop) Object.assign($('#them-face img').style, { transformOrigin: l.crop, transform: 'scale(1.25)' });
  }
  else face($('#them-face'), kingArt({ power: null }, themC), 'fig');
  if (p) face($('#you-face'), `${ASSETS}emblems/${king(c.you.king).design}.webp`, 'emb');
  else face($('#you-face'), kingArt({ power: null }, youC), 'fig');
  $('#them-who').textContent = two ? 'Black' : faces ? l.who : 'Computer';
  $('#you-who').textContent = two ? 'White' : 'You';
  const pw = k => (p ? ` · ${k.king} · ${powerName(k.power)}` : '');
  $('#them-sub').textContent = two ? (p ? `${c.them.king} · ${powerName(c.them.power)}` : (c.device === 'here' ? 'On this device' : 'By link')) : `${l.name}${pw(c.them)}`;
  $('#you-sub').textContent = two ? (p ? `${c.you.king} · ${powerName(c.you.power)}` : ARMY[c.army].name) : `${SIDE[youC]}${pw(c.you)}`;
}
function renderStatus() {
  const s = board.state, el = $('#status');
  if (!s) { el.innerHTML = ''; return; }
  const st = KD.status(s);
  let main;
  if (st.over) main = st.text;
  else if (board.play.human === 'both') main = `${SIDE[st.turn]} to move`;
  else if (board.isHuman(st.turn)) main = st.check ? 'Check. Your move' : 'Your move';
  else main = 'The computer thinks';
  el.classList.toggle('is-new', musterLine);
  el.innerHTML = `<b>${main}</b>${musterLine ? '<span>Same army for both sides.</span>' : ''}`;
}

function oldGame() {
  return OLD_MOVES.reduce((s, lan) => KD.play(s, lan), KD.newGame({ army: OLD_ARMY }));
}
function showOld() {
  board.play.human = 'both';
  board.flip(false);
  board.setState(oldGame());
  setPlates({ ...fresh(), level: 'club' });
  musterLine = false;
  board.play.human = 'w';
  board.play.level = 'club';
  renderStatus();
}

// ---- the muster: the feat-muster moment (option A, "Flip in") ----
// The kings and the pawns stand. Each drawn piece flips in, file by file, with its match on the other
// side: 62 ms a file, 260 ms a figure, about 700 ms in all. A tap or a key jumps to the end frame.
// It follows the Motion setting: Fast is one flip for all; Off and reduced motion show the army at once.
// Here ?speed=fast or ?speed=off stands in for that setting.
const SPEED = { normal: { stagger: 62, dur: 260 }, fast: { stagger: 0, dur: 240 } };
const speedParam = new URLSearchParams(location.search).get('speed');
const MOTION = speedParam === 'fast' || speedParam === 'off' ? speedParam : 'normal';
const FLIP = [
  { transform: 'perspective(420px) translateY(-14%) rotateY(90deg)', opacity: 0 },
  { opacity: 1, offset: 0.25 },
  { transform: 'perspective(420px) translateY(0) rotateY(0deg)', opacity: 1 },
];
let musterGen = 0, mustering = false, anims = [], lands = [], ticks = [];
function stopMuster() {
  musterGen++; mustering = false;
  ticks.forEach(clearTimeout); ticks = [];
  anims.forEach(a => a.cancel()); anims = [];
  lands.forEach(e => e.remove()); lands = [];
}
function skip() { ticks.forEach(clearTimeout); ticks = []; anims.forEach(a => a.finish()); }
// The skip runs before the board sees the tap, so the tap never reaches a board that is not ready.
addEventListener('pointerdown', () => { if (mustering) skip(); }, { capture: true });
addEventListener('keydown', () => { if (mustering) skip(); }, { capture: true });

/** Show the new army and flip in its drawn pieces. pauseAt: stop at that time (a still frame). Resolves true at the end. */
async function muster(state, flipped, { pauseAt = null } = {}) {
  stopMuster();
  const me = musterGen;
  board.play.human = 'both';
  board.flip(flipped);
  board.setState(state);
  board.clearMarks();
  if (MOTION === 'off' || prefersReducedMotion()) return true;
  const { stagger, dur } = SPEED[MOTION];
  const figs = [], times = new Set();
  for (const c of KD.board(state)) {
    if (!c || c.type === 'king' || (c.sq[1] !== '1' && c.sq[1] !== '8')) continue;
    const fig = board.figure(c.sq);
    if (!fig) continue;
    const file = c.sq.charCodeAt(0) - 97, col = flipped ? 7 - file : file;   // the wave runs left to right on the screen
    const delay = col * stagger;
    figs.push(fig.animate(FLIP, { delay, duration: dur, fill: 'backwards', easing: 'cubic-bezier(.2,.8,.2,1)' }));
    // A soft gold on the ground where it lands: both pieces of a file glow at the same moment.
    const land = document.createElement('div');
    land.className = 'ng-land'; land.setAttribute('aria-hidden', 'true');
    land.style.left = `${col * 12.5}%`;
    land.style.top = `${(flipped ? +c.sq[1] - 1 : 8 - c.sq[1]) * 12.5}%`;
    board.layer.appendChild(land); lands.push(land);
    anims.push(land.animate([{ opacity: 0 }, { opacity: 0.7, offset: 0.3 }, { opacity: 0 }], { delay: delay + dur * 0.6, duration: 380, easing: 'ease-out' }));
    times.add(delay + dur * 0.6);
  }
  anims.push(...figs);
  mustering = true;
  if (pauseAt != null) for (const a of anims) { a.pause(); a.currentTime = pauseAt; }
  else for (const t of times) ticks.push(setTimeout(() => sfx.tap(), t));   // one soft tick for each file, like a deal
  await Promise.all(figs.map(a => a.finished.catch(() => {})));
  if (me !== musterGen) return false;
  mustering = false;
  return true;
}

async function beginGame(c, { seed, pauseAt = null } = {}) {
  hideToast();
  const opts = { army: c.army === 'chess' ? 'chess' : 'random' };
  if (c.army === 'today') opts.seed = TODAY_SEED;
  else if (c.army === 'random') opts.seed = seed ?? Math.floor(Math.random() * 1e9);
  if (powered(c)) {
    const spec = k => (k.power ? `${k.king}:${k.power}` : null);
    const white = colorOf('you', c) === 'w' ? c.you : c.them, black = white === c.you ? c.them : c.you;
    opts.powers = [spec(white), spec(black)];
  }
  const s = KD.newGame(opts);
  const human = c.mode === 'two' ? 'both' : c.side;
  board.play.level = c.level;
  setPlates(c);
  musterLine = false;
  $('#status').innerHTML = '';
  const done = await muster(s, human === 'b', { pauseAt });
  if (!done) return;
  board.play.human = human;
  musterLine = true;
  renderStatus();
  animate($('#status'), [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
  board.maybeAi();
}

// ---- option B: the home screen ----
function summary(c = cfg) {
  if (c.mode === 'two') return `Two players · ${ARMY[c.army].name}`;
  // In Kings' powers the king and its power are the main choice: name them.
  if (c.mode === 'powers') return `${level(c.level).name} · ${c.you.king} · ${powerName(c.you.power)}`;
  return `${level(c.level).name} · ${SIDE[c.side]} · ${ARMY[c.army].name}`;
}
/** The Play line names the setup. */
function syncHome() {
  $('#quick-sub').textContent = summary();
  $('#quick-play').setAttribute('aria-label', `Play: ${summary()}`);
}
function showHome(on) {
  $('#home').hidden = !on;
  $('#app').inert = on;
  if (on) syncHome();
}
async function hideHome() {
  if ($('#home').hidden) return;
  await animate($('#home'), [{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-in' });
  showHome(false);
  $('#home').style.opacity = '';
}

async function start({ seed } = {}) {
  const c = structuredClone(cfg);
  await Promise.all([$('#ng').open ? closeSheet('ng') : null, hideHome()]);
  await beginGame(c, { seed });
}

$('#start').addEventListener('click', () => start());
$('#quick-play').addEventListener('click', () => start());
$('#quick-change').addEventListener('click', () => openNewGame());
// Back on Home after Change: the Play line names the new setup.
$('#ng').addEventListener('close', syncHome);
$('#new').addEventListener('click', () => openNewGame({ game: true }));
$('#go-home').addEventListener('click', () => { showHome(true); $('#quick-play').focus(); });
for (const b of $$('[data-soon]')) b.addEventListener('click', () => toast('This demo shows how a game starts.'));
$('#undo').addEventListener('click', () => {
  const s = board.state;
  if (!s?.history.length || board.busy) return;
  const plies = board.play.human !== 'both' && s.history.length > 1 ? 2 : 1;
  let back = s;
  for (let i = 0; i < plies && back.history.length; i++) back = KD.undo(back);
  const h = board.play.human;
  board.play.human = 'both'; board.setState(back); board.play.human = h;
  musterLine = false; renderStatus();
});
$('#hint').addEventListener('click', async () => {
  const s = board.state;
  if (!s || KD.status(s).over || !board.isHuman(KD.status(s).turn)) return;
  const m = await KD.think(s, { level: 'club', ms: 400 });
  if (m && board.state === s) { board.clearMarks('hint'); board.mark([m.from, m.to], 'hint'); }
});

// ---- the demo contract ----
let run = 0;
function base({ variant = false } = {}) {
  run++;
  stopMuster();
  hideToast();
  closeNow();
  cfg = fresh();
  faces = variant;
  fromGame = false;
  showHome(false);
  $('#home').style.opacity = '';
  showOld();
  renderMode();
}
function tapRing(el) {
  const r = el.getBoundingClientRect(), ring = document.createElement('div');
  ring.className = 'tap-ring';
  ring.style.left = `${r.left + r.width / 2}px`;
  ring.style.top = `${r.top + r.height / 2}px`;
  (el.closest('dialog') ?? document.body).appendChild(ring);   // a ring for an open sheet goes in its top layer
  animate(ring, [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1)', offset: 0.4 }, { opacity: 0, transform: 'scale(1.25)' }], { duration: 420, easing: 'ease-out' })
    .then(() => ring.remove());
}
const tap = async (sel, me) => {
  if (me !== run) return false;
  const el = typeof sel === 'string' ? $(sel) : sel;
  const target = el.closest('label') ?? el;
  tapRing(target);
  await wait(140, { instant: true });
  if (me !== run) return false;
  el.click();
  return true;
};

window.demo = {
  async state(name) {
    switch (name) {
      // New game during a game: the sheet names what Start ends.
      case 'sheet': base(); openNewGame({ game: true }); break;
      case 'side-army': base(); cfg.fold = true; cfg.army = 'today'; openNewGame({ game: true }); break;
      case 'powers': base(); cfg.mode = 'powers'; openNewGame({ game: true }); break;
      case 'quick': base(); showHome(true); break;
      case 'faces': base({ variant: true }); cfg.level = 'beginner'; openNewGame({ game: true }); break;
      // The muster stopped mid-way: files a to d stand, e turns in, f to h wait. The kings and pawns stand.
      case 'muster': base(); beginGame(cfg, { seed: DEMO_SEED, pauseAt: 270 }); break;
      case 'start': base(); await beginGame(cfg, { seed: DEMO_SEED }); break;
      default: throw new Error(`demo.state: no state "${name}"`);
    }
  },
  // B's Play names the setup; Change opens A; a king is chosen; Start; the muster.
  async play() {
    base();
    const me = run;
    showHome(true);
    const step = async (sel, ms) => (await tap(sel, me)) && (await wait(ms, { instant: true }), me === run);
    await wait(1300, { instant: true });
    if (!(await step('#quick-change', 1100))) return;
    if (!(await step('input[name="mode"][value="powers"]', 1300))) return;
    if (!(await step('input[name="king"][value="Shadow"]', 1300))) return;
    if (!(await step('input[name="king"][value="Frost"]', 1000))) return;
    if (!(await step('input[name="power"][value="IceWall"]', 1100))) return;
    if (!(await step('input[name="level"][value="casual"]', 1100))) return;
    if (me !== run) return;
    tapRing($('#start'));
    await wait(160, { instant: true });
    if (me !== run) return;
    await start({ seed: DEMO_SEED });
    await wait(1800, { instant: true });
  },
  async reset() {
    base();
    openNewGame({ game: true });
  },
};

// The presentation can open one state: index.html?state=faces
const want = new URLSearchParams(location.search).get('state');
if (want) window.demo.state(want); else window.demo.reset();
