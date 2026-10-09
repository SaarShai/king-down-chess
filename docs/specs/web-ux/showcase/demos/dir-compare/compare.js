// The five directions side by side: one moment picker drives five live direction demos in frames.
// Each frame is ../<id>/index.html?bare=1&frame=<phone|desktop>. A frame loads only when it shows. After it
// loads, this page calls the frame's own window.demo.state(moment) once, so a new moment needs no reload.
import { icon } from '../../kit/icons.js';
import { animate, onMotionChange, $, $$ } from '../../kit/ui.js';

const DIRS = [
  { id: 'dir-quiet-table', name: 'Quiet Table', motto: 'Nothing on the table but the game.',
    more: 'Only the board and two text strips. Help shows only under a finger.' },
  { id: 'dir-arena', name: 'Arena', motto: 'Two kings meet. Every special move is a reveal.',
    more: 'Two kings face each other. Every power is a reveal that you can read.' },
  { id: 'dir-pocket', name: 'Pocket', motto: 'One thumb, one hand, one bus stop.',
    more: 'The board sits low, over a thumb bar. Every action is in thumb reach.' },
  { id: 'dir-chronicle', name: 'Chronicle', motto: 'Every game is a short tale worth retelling.',
    more: 'One line under the board tells each move. The game ends as a recap of three panels.' },
  { id: 'dir-coach', name: 'Coach', motto: 'You never lose to a rule you could not see.',
    more: 'The board explains each rule when it matters. The help gets quieter at higher levels.' },
];

// The six shared moments (idea bank 6.1 and 6.2). "at": what each direction shows at that moment.
// Each line says only what the still frame shows, and names its piece: at Read and Select the
// directions do not all show the same piece.
const MOMENTS = [
  { key: 'rest', label: 'Rest', line: 'Move 12. Your move.', look: 'What is on the screen at rest?', at: {
    'dir-quiet-table': 'The board and two text strips.',
    'dir-arena': 'Two nameplates and a tray of tiles.',
    'dir-pocket': 'A low board and a thumb bar.',
    'dir-chronicle': 'The board and one story line.',
    'dir-coach': 'A badge on the new Guard.',
  } },
  { key: 'read', label: 'Read', line: 'You hold a piece to read it.', look: 'Where does the help appear?', at: {
    'dir-quiet-table': 'Their Archer: its reach shows.',
    'dir-arena': 'Their Archer: a card rises.',
    'dir-pocket': 'Their Archer: a card rises in thumb reach.',
    'dir-chronicle': 'Their Archer: a card under the board.',
    'dir-coach': 'Their Guard, not the Archer: a card below.',
  } },
  { key: 'select', label: 'Select', line: 'You choose a piece or a power.', look: 'Each shows its own piece. How are targets marked?', at: {
    'dir-quiet-table': 'Your Ogre: its shove shows.',
    'dir-arena': 'Your Freeze is armed: the targets glow.',
    'dir-pocket': 'Your Beast: a loupe shows the first bite.',
    'dir-chronicle': 'Your Ogre: the line names the shove first.',
    'dir-coach': 'Peek: who can take your Ogre on c4.',
  } },
  { key: 'played', label: 'Played', line: 'Your Archer shoots the pawn on a5.', look: 'How much does the shot show?', at: {
    'dir-quiet-table': 'The shot, then one quiet line.',
    'dir-arena': 'A shot tile joins the tray.',
    'dir-pocket': 'The ribbon shows the shot.',
    'dir-chronicle': 'The story line, with a First shot tag.',
    'dir-coach': 'One line: the Archer shoots without moving.',
  } },
  { key: 'check', label: 'Check', line: 'Their Archer uses Strike and gives check.', look: 'Can you see the cause of check?', at: {
    'dir-quiet-table': 'Check, and a thin line to the cause.',
    'dir-arena': 'A card reveals their Strike.',
    'dir-pocket': 'The word Check and the cause line.',
    'dir-chronicle': 'The line names the shot over f2.',
    'dir-coach': 'The four ways out, on the board and below.',
  } },
  { key: 'end', label: 'End', line: 'Your Archer moves to f6. King Down.', look: 'How big is the last moment?', at: {
    'dir-quiet-table': 'The king lies down. Rematch below.',
    'dir-arena': 'King Down and three key tiles.',
    'dir-pocket': 'A result sheet under the thumb.',
    'dir-chronicle': 'A recap in three panels.',
    'dir-coach': 'The rule that won the game.',
  } },
];
const MOMENT = Object.fromEntries(MOMENTS.map(m => [m.key, m]));
const SIZE = { phone: [390, 844], desktop: [1440, 900] };
const BEZEL = { phone: 7, desktop: 5 };
const DEFAULTS = { moment: 'rest', view: 'phone', count: 5, pair: ['dir-quiet-table', 'dir-arena'] };

const ui = { ...DEFAULTS, pair: [...DEFAULTS.pair] };
const url = new URLSearchParams(location.search);
if (MOMENT[url.get('state')]) ui.moment = url.get('state');

const stage = $('#stage');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- the header: moments, frame, count, play all ----------------------------------------------
const VIEW_ICON = {
  phone: 'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 18h2',
  desktop: 'M4 5h16v11H4zM9 20h6M12 16v4',
};
const svg = d => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
for (const b of $$('[data-view]')) {
  const v = b.dataset.view;
  b.innerHTML = `${svg(VIEW_ICON[v])}<span class="long">${v === 'phone' ? 'Phone' : 'Desktop'}</span>`;
  b.setAttribute('aria-label', v === 'phone' ? 'Phone frames' : 'Desktop frames');
  b.title = b.getAttribute('aria-label');
}
for (const b of $$('[data-count]')) b.setAttribute('aria-label', b.dataset.count === '5' ? 'All five' : 'Two at a time');

const group = $('#moments');
group.insertAdjacentHTML('beforeend', MOMENTS.map(m =>
  `<button type="button" role="radio" class="moment" data-moment="${m.key}" aria-checked="false" tabindex="-1">${m.label}</button>`).join(''));
const radios = $$('.moment', group);

function renderPicker({ instant = false } = {}) {
  const idle = group.classList.contains('is-idle');
  for (const r of radios) {
    const on = r.dataset.moment === ui.moment;
    r.setAttribute('aria-checked', String(on && !idle));
    r.tabIndex = on ? 0 : -1;
  }
  const on = radios.find(r => r.dataset.moment === ui.moment);
  const thumb = $('.thumb', group);
  if (instant) thumb.style.transition = 'none';
  thumb.style.width = `${on.offsetWidth}px`;
  thumb.style.transform = `translateX(${on.offsetLeft}px)`;
  if (instant) { void thumb.offsetWidth; thumb.style.transition = ''; }
}
/** While the stories play, no moment is chosen: the frames are each at their own point. */
function setIdle(on, line) {
  group.classList.toggle('is-idle', on);
  stage.classList.toggle('is-playing', on);
  if (on) {
    for (const r of radios) r.setAttribute('aria-checked', 'false');
    $('#note').innerHTML = line;
  }
}
function renderTools() {
  for (const b of $$('[data-view]')) b.setAttribute('aria-pressed', String(b.dataset.view === ui.view));
  for (const b of $$('[data-count]')) b.setAttribute('aria-pressed', String(+b.dataset.count === ui.count));
}
function renderNote({ fresh = false } = {}) {
  const m = MOMENT[ui.moment];
  const note = $('#note');
  note.innerHTML = `<b>${m.label}.</b> ${m.line} <span class="look">${m.look}</span>`;
  if (fresh) animate(note, [{ opacity: 0.2 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
}

group.addEventListener('click', e => {
  const r = e.target.closest('.moment');
  if (r) pick(r.dataset.moment, { focus: false });
});
group.addEventListener('keydown', e => {
  const i = MOMENTS.findIndex(m => m.key === ui.moment);
  const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: MOMENTS.length - 1 }[e.key];
  if (to === undefined) return;
  e.preventDefault();
  e.stopPropagation();
  pick(MOMENTS[(to + MOMENTS.length) % MOMENTS.length].key, { focus: true });
});
// Left and right arrows anywhere on this page (not in a frame, not in a list) step the moment.
addEventListener('keydown', e => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.closest?.('select, input, textarea, [role=radiogroup]')) return;
  const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
  if (!step) return;
  const i = MOMENTS.findIndex(m => m.key === ui.moment);
  const to = i + step;
  if (to < 0 || to >= MOMENTS.length) return;
  e.preventDefault();
  pick(MOMENTS[to].key, { focus: false });
});

function pick(moment, { focus }) {
  stopPlayAll();
  show(moment);
  if (focus) radios.find(r => r.dataset.moment === moment)?.focus();
}

for (const b of $$('[data-view]')) b.addEventListener('click', () => setView(b.dataset.view));
for (const b of $$('[data-count]')) b.addEventListener('click', () => setCount(+b.dataset.count));

// ---- the slots: one live frame for each direction ---------------------------------------------
const OPEN_ICON = 'M14 4h6v6M20 4l-8.5 8.5M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4';
const options = DIRS.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

const slots = DIRS.map(dir => {
  const el = document.createElement('figure');
  el.className = 'slot';
  el.dataset.id = dir.id;
  el.innerHTML = `
    <div class="fit"><div class="device"><div class="screen">
      <p class="wait" aria-hidden="true">${dir.name}</p>
      <iframe loading="eager"></iframe>
    </div></div></div>
    <figcaption class="cap">
      <div class="cap-head"><div class="cap-title">
        <h2 class="cap-name">${dir.name}</h2>
        <label class="cap-pick"><span class="sr-only">Direction</span><select>${options}</select></label>
        <a class="btn btn-icon open" target="_blank" rel="noopener" aria-label="Open ${dir.name} on its own page">${svg(OPEN_ICON)}</a>
      </div></div>
      <p class="cap-motto">${dir.motto}</p>
      <p class="cap-at"></p>
      <p class="cap-more">${dir.more}</p>
    </figcaption>`;
  stage.appendChild(el);
  const s = {
    dir, el,
    frame: $('iframe', el), device: $('.device', el), screen: $('.screen', el), cap: $('.cap', el),
    select: $('select', el), open: $('.open', el), at: $('.cap-at', el),
    gen: 0, loaded: -1, shown: null, want: null,
  };
  s.select.value = dir.id;
  s.frame.addEventListener('load', () => { s.loaded = s.gen; syncMotion(s); });
  s.select.addEventListener('change', () => choose(s, s.select.value));
  return s;
});
const slotOf = id => slots.find(s => s.dir.id === id);

function frameSrc(s) {
  // No ?state= here: the demo would show it on load, and apply() shows it again.
  const q = new URLSearchParams({ bare: '1', frame: ui.view });
  if (document.documentElement.dataset.motion === 'reduce') q.set('motion', 'reduce');
  return `../${s.dir.id}/index.html?${q}`;
}
function load(s) {
  s.gen++;
  s.view = ui.view;
  s.shown = null;
  s.el.dataset.status = 'loading';
  s.frame.src = frameSrc(s);
}
const off = s => s.el.classList.contains('is-off');
const visible = () => slots.filter(s => !off(s));

/** The frame's window once its page has loaded and set window.demo; null after `ms`. */
async function ready(s, ms = 15000) {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    try {
      const w = s.frame.contentWindow;
      if (s.loaded === s.gen && w?.demo && typeof w.demo.state === 'function') return w;
    } catch { /* not ready */ }
    await sleep(60);
  }
  return null;
}

/** Waits for a frame's fonts, images and animations, 3 s at most (as the capture does for a page). */
async function settle(w) {
  const end = performance.now() + 3000;
  const left = () => Math.max(0, end - performance.now());
  const timeout = () => sleep(left());
  try {
    const doc = w.document;
    await Promise.race([doc.fonts.ready, timeout()]);
    const imgs = [...doc.images].filter(i => !i.complete);
    await Promise.race([Promise.all(imgs.map(i => new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }))), timeout()]);
    for (;;) {
      const running = doc.getAnimations().filter(a => a.playState === 'running' && Number.isFinite(a.effect?.getComputedTiming?.().endTime));
      if (!running.length || !left()) break;
      await Promise.race([Promise.all(running.map(a => a.finished.catch(() => {}))), timeout()]);
    }
  } catch { /* the frame went away */ }
}

/** Shows ui.moment in one frame through its own demo.state(). */
async function apply(s) {
  const moment = ui.moment;
  s.want = moment;
  if (s.view !== ui.view) load(s);
  const w = await ready(s);
  if (s.want !== moment) return;
  if (!w) { s.el.dataset.status = 'missing'; $('.wait', s.el).textContent = `${s.dir.name}: not built yet`; return; }
  try {
    await Promise.race([w.demo.state(moment), sleep(15000).then(() => { throw new Error('timeout'); })]);
    if (s.want !== moment) return;
    s.shown = moment;
    s.el.dataset.status = 'ok';
  } catch (e) {
    console.warn(`${s.dir.id}: state("${moment}") failed: ${e?.message ?? e}`);
    s.el.dataset.status = 'error';
    $('.wait', s.el).textContent = `${s.dir.name}: no “${MOMENT[moment].label}” view yet`;
  }
  await settle(w);
}

function renderCaps({ fresh = false } = {}) {
  const m = MOMENT[ui.moment];
  for (const s of slots) {
    s.at.textContent = m.at[s.dir.id];
    s.frame.title = `${s.dir.name}: ${m.label}`;
    const q = new URLSearchParams({ state: ui.moment, view: ui.view });
    s.open.href = `../${s.dir.id}/index.html?${q}`;
    if (fresh && !off(s)) animate(s.at, [{ opacity: 0.2 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
  }
}

// ---- layout: which slots show, and the scale that fits each frame in its cell ------------------
const wide = () => innerWidth >= 900;
function layout() {
  stage.dataset.view = ui.view;
  stage.dataset.count = String(ui.count);
  document.documentElement.dataset.wide = wide() ? '1' : '';
  for (const s of slots) {
    const i = ui.count === 5 ? DIRS.indexOf(s.dir) : ui.pair.indexOf(s.dir.id);
    // A slot that is not shown moves off the stage but keeps its size: its demo never sees a 0 px window.
    s.el.classList.toggle('is-off', i < 0);
    s.el.setAttribute('aria-hidden', String(i < 0));
    s.el.style.order = String(i);
    if (ui.count === 2) s.select.value = s.dir.id;
  }
  fit();
}

function fit() {
  const [iw, ih] = SIZE[ui.view];
  const b = BEZEL[ui.view];
  const shown = visible();
  // Wide screens fit every frame in the stage; narrow screens fit the width and scroll down.
  let cellH = Infinity;
  if (wide()) {
    const cs = getComputedStyle(stage);
    const rows = ui.view === 'desktop' && ui.count === 5 ? 2 : 1;
    const inner = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    cellH = (inner - (parseFloat(cs.rowGap) || 0) * (rows - 1)) / rows;
  }
  // Two passes: the caption's width follows the scale, and its height (line wraps) follows its width.
  for (let pass = 0; pass < 2; pass++) {
    // One scale for all shown frames, so they stay the same size side by side.
    const k = Math.max(0.1, Math.min(...shown.map(s => {
      const capH = s.cap.offsetHeight + parseFloat(getComputedStyle(s.el).rowGap || 0);
      return Math.min((s.el.clientWidth - 2 * b) / iw, (cellH - capH - 2 * b) / ih);
    })));
    for (const s of shown) {
      s.el.style.setProperty('--k', k.toFixed(4));
      s.screen.style.width = `${Math.floor(iw * k)}px`;
      s.screen.style.height = `${Math.floor(ih * k)}px`;
      s.frame.style.width = `${iw}px`;
      s.frame.style.height = `${ih}px`;
      s.frame.style.transform = `scale(${k})`;
      s.cap.style.width = `${Math.floor(iw * k) + 2 * b}px`;
    }
  }
}
new ResizeObserver(() => { fit(); renderPicker({ instant: true }); }).observe(stage);
addEventListener('resize', () => layout());

// ---- reduced motion reaches every frame -------------------------------------------------------
function syncMotion(s) {
  try { s.frame.contentDocument.documentElement.dataset.motion = document.documentElement.dataset.motion || ''; } catch { /* loading */ }
}
onMotionChange(() => slots.forEach(syncMotion));

// ---- actions -----------------------------------------------------------------------------------
async function show(moment, { fresh = true } = {}) {
  ui.moment = moment;
  setIdle(false);
  renderPicker();
  renderNote({ fresh });
  renderCaps({ fresh });
  try { history.replaceState(null, '', `?${new URLSearchParams({ ...Object.fromEntries(url), state: moment })}`); } catch { /* sandboxed */ }
  for (const s of slots) if (off(s)) s.want = null;   // a hidden frame catches up when it shows
  await Promise.all(visible().map(apply));
}

async function setView(view, { apply: run = true } = {}) {
  if (view === ui.view) return;
  stopPlayAll();
  ui.view = view;
  setIdle(false);
  renderTools();
  renderPicker();
  renderNote();
  renderCaps();
  layout();
  for (const s of visible()) load(s);
  if (run) await Promise.all(visible().map(apply));
}

async function setCount(count, { apply: run = true } = {}) {
  if (count === ui.count) return;
  const idle = group.classList.contains('is-idle');
  stopPlayAll();
  ui.count = count;
  renderTools();
  layout();
  if (!wide()) stage.scrollTop = 0;
  fadeIn(visible());
  if (idle && run) return show(ui.moment, { fresh: false });   // after the stories, all frames meet at one moment again
  if (run) await catchUp();
}

/** In Two: a slot's list picks another direction. The other slot takes the old one if they clash. */
async function choose(s, id) {
  const pos = ui.pair.indexOf(s.dir.id);
  if (pos < 0 || id === s.dir.id) return;
  const other = ui.pair[1 - pos];
  ui.pair[pos] = id;
  if (other === id) ui.pair[1 - pos] = s.dir.id;
  layout();
  fadeIn([slotOf(id)]);
  slotOf(id).select.focus();
  await catchUp();
}

/** Frames that were hidden show the current moment when they come back. */
function catchUp() {
  return Promise.all(visible().filter(s => s.shown !== ui.moment || s.want !== ui.moment).map(apply));
}
function fadeIn(list) {
  for (const s of list) animate(s.el, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
}

// Play all: each visible direction plays its own short story at the same time.
let playing = 0;
const playBtn = $('#play-all');
function renderPlay() {
  const on = playing > 0;
  playBtn.innerHTML = `${icon(on ? 'pause' : 'play')}<span>${on ? 'Stop' : 'Play all'}</span>`;
  playBtn.classList.toggle('is-on', on);
  playBtn.title = on ? 'Stop the stories' : 'Play each story at the same time';
}
async function playAll() {
  const me = ++playing;
  renderPlay();
  setIdle(true, '<b>Play all.</b> Each direction plays its own story. <span class="look">Watch how each one moves.</span>');
  await Promise.all(visible().map(async s => {
    const w = await ready(s);
    if (!w || me !== playing) return;
    s.shown = null;
    try { await w.demo.reset?.(); if (me === playing) await w.demo.play?.(); } catch (e) { console.warn(`${s.dir.id}: play failed: ${e?.message ?? e}`); }
  }));
  if (me === playing) {
    playing = 0;
    renderPlay();
    setIdle(true, '<b>The stories end.</b> Pick a moment to compare again.');
  }
}
function stopPlayAll() {
  if (!playing) return;
  playing = 0;
  renderPlay();
}
playBtn.addEventListener('click', () => {
  if (playing) { stopPlayAll(); show(ui.moment, { fresh: false }); } else playAll();
});

// ---- start ---------------------------------------------------------------------------------------
renderTools();
renderPlay();
renderNote();
renderCaps();
layout();
renderPicker({ instant: true });
const first = Promise.all(visible().map(apply));   // apply() loads each shown frame; a hidden one loads in catchUp()
document.fonts?.ready.then(() => { fit(); renderPicker({ instant: true }); });

// ---- the demo contract (kit README) -------------------------------------------------------------
const STATES = {
  rest: { moment: 'rest' }, read: { moment: 'read' }, select: { moment: 'select' },
  played: { moment: 'played' }, check: { moment: 'check' }, end: { moment: 'end' },
  desktop: { moment: 'played', view: 'desktop' },
  two: { moment: 'check', count: 2, pair: ['dir-quiet-table', 'dir-arena'] },
  'two-desktop': { moment: 'end', count: 2, view: 'desktop', pair: ['dir-chronicle', 'dir-coach'] },
};
let run = 0;
async function setup({ moment, view = 'phone', count = 5, pair = DEFAULTS.pair }) {
  stopPlayAll();
  await first;
  Object.assign(ui, { pair: [...pair], count, view });
  renderTools();
  layout();
  stage.scrollTop = 0;
  await show(moment, { fresh: false });   // apply() reloads a frame whose size changed
}
window.demo = {
  async state(name) {
    run++;
    const st = STATES[name];
    if (!st) throw new Error(`demo.state: no state "${name}"`);
    await setup(st);
  },
  // A walk through the six moments: one picker, five directions, the same game.
  async play() {
    const me = ++run;
    await setup({ moment: 'rest' });
    for (const m of ['read', 'select', 'played', 'check', 'end']) {
      if (me !== run) return;
      await sleep(1800);
      if (me !== run) return;
      await show(m);
    }
    await sleep(1200);
  },
  async reset() {
    run++;
    await setup({ moment: 'rest' });
  },
};
