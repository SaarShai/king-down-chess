import { RELEASED_CARDS } from '../../../../../../../src/content/cards';
import { cardText, ruleLine } from '../../../../../../../src/powers-ui';
import { DEFAULT_RULES } from '../../../../../../../src/rules/rules';
import { createEffect as createFreeze } from '../../freeze/effect.js';
import * as air from './effects/air.js';
import * as movement from './effects/movement.js';
import * as magic from './effects/magic.js';

const WIDTH = 512, HEIGHT = 288, FPS = 30;
const $ = id => document.getElementById(id);
const groups = { air, movement, magic };
const paintingUrls = import.meta.glob('../art/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' });
const released = new Map(RELEASED_CARDS.map(card => [card.id.toLowerCase(), card]));
const cache = new Map(), cards = new Map();
const query = matchMedia('(prefers-reduced-motion: reduce)');
const frame = document.createElement('canvas');
frame.width = WIDTH; frame.height = HEIGHT;
const paint = frame.getContext('2d'), visible = $('animated').getContext('2d');
let ready = false, id = '', time = 0, playing = false, mode = 'idle', reduced = query.matches;
let speed = 1, inView = true, raf = 0, last = 0, painted = -Infinity, revision = 0, frames = 0;
let current;

const duration = () => mode === 'idle' ? 8 : 3.2;
function getState() { return { ready, id, time, playing, mode, reduced, frames, speed, progress: time / duration() }; }
function hashId() { try { return decodeURIComponent(location.hash.slice(1)).toLowerCase(); } catch { return ''; } }

function timeline() {
  $('scrub').value = String(Math.round(time / duration() * 1000));
  $('scrub').setAttribute('aria-valuetext', `${time.toFixed(2)} of ${duration().toFixed(2)} seconds`);
  $('time').textContent = `${time.toFixed(2)} / ${duration().toFixed(2)} s`;
}

function controls() {
  const card = cards.get(id), order = Array.from(cards.keys());
  $('previous').disabled = $('next').disabled = order.length < 2;
  $('position').textContent = card ? `${card.name} · ${order.indexOf(id) + 1} of ${order.length}` : 'Loading cards…';
  $('choose-summary').setAttribute('aria-label', card ? `Choose a card. ${card.name} selected` : 'Choose a card');
  for (const button of $('card-nav').children) button.setAttribute('aria-pressed', String(button.dataset.id === id));
  for (const value of ['idle', 'awaken']) {
    $(value).disabled = !ready;
    $(value).setAttribute('aria-pressed', String(value === mode));
  }
  $('play').disabled = $('replay').disabled = $('scrub').disabled = !ready || reduced;
  $('play').textContent = playing ? 'Pause' : 'Play';
  $('play').setAttribute('aria-pressed', String(playing));
  $('reduced').checked = reduced;
  $('half-speed').checked = speed === .5;
  $('phase').textContent = !ready ? 'Loading artwork…' : reduced ? 'Still artwork · reduced motion' :
    `${mode === 'idle' ? 'Gentle loop' : 'Awakening'} · ${playing ? 'playing' : time === duration() ? 'complete' : 'paused'}`;
  timeline();
}

function draw() {
  if (!ready) return;
  paint.save();
  try {
    paint.resetTransform(); paint.globalAlpha = 1; paint.globalCompositeOperation = 'source-over';
    paint.filter = 'none'; paint.shadowColor = 'transparent'; paint.shadowBlur = 0;
    paint.clearRect(0, 0, WIDTH, HEIGHT);
    if (reduced) paint.drawImage(current.original, 0, 0);
    else current.effect.draw(paint, { time, mode, reduced });
  } finally { paint.restore(); }
  visible.save();
  try {
    visible.resetTransform(); visible.globalAlpha = 1; visible.globalCompositeOperation = 'source-over';
    visible.clearRect(0, 0, WIDTH, HEIGHT); visible.drawImage(frame, 0, 0);
  } finally { visible.restore(); }
  frames++; timeline();
}

function stop() {
  playing = false; cancelAnimationFrame(raf); raf = 0; last = 0; painted = -Infinity;
}

function fail(error) {
  stop(); ready = false; $('loading').hidden = false; $('retry').hidden = false;
  $('load-message').setAttribute('role', 'alert');
  $('load-message').textContent = 'This preview could not load. Try again to reload it.';
  controls(); $('phase').textContent = 'Preview unavailable'; console.error(error);
}

function tick(now) {
  if (!playing) return;
  if (document.hidden || !inView || reduced) { stop(); controls(); return; }
  if (last) time += Math.min((now - last) / 1000, .1) * speed;
  last = now;
  if (time >= duration()) {
    if (mode === 'idle') time %= duration();
    else { time = duration(); stop(); }
  }
  if (now - painted >= 1000 / FPS || !playing) {
    try { draw(); painted = now; } catch (error) { fail(error); return; }
  }
  if (playing) raf = requestAnimationFrame(tick);
  else controls();
}

function setPlaying(value) {
  stop();
  if (value && ready && !reduced && inView && !document.hidden) {
    if (time === duration()) time = 0;
    playing = true; raf = requestAnimationFrame(tick);
  }
  controls(); return getState();
}

function replay() { stop(); time = 0; draw(); return setPlaying(true); }
function seek(progress) {
  if (!Number.isFinite(progress)) return getState();
  stop(); time = Math.max(0, Math.min(1, progress)) * duration(); draw(); controls(); return getState();
}
function setMode(value) {
  if (!['idle', 'awaken'].includes(value)) return getState();
  stop(); mode = value; time = 0; draw(); controls(); return getState();
}
function setReduced(value) { stop(); reduced = Boolean(value); draw(); controls(); return getState(); }

function prepare(image, cardId) {
  const original = document.createElement('canvas'); original.width = WIDTH; original.height = HEIGHT;
  const ctx = original.getContext('2d');
  if (cardId === 'march' || cardId === 'freeze') {
    const scale = WIDTH / image.naturalWidth;
    ctx.drawImage(image, 0, 0, WIDTH, image.naturalHeight * scale);
  } else {
    const scale = Math.min(WIDTH / image.naturalWidth, HEIGHT / image.naturalHeight);
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
    ctx.drawImage(image, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);
  }
  return original;
}

async function load(card) {
  const source = paintingUrls[card.proposal.replace('./', '../')];
  if (!source) throw new Error(`Artwork is unavailable for ${card.id}`);
  const image = new Image(); image.src = source;
  await image.decode();
  const original = prepare(image, card.id);
  if (card.id === 'freeze') return { original, effect: createFreeze(image) };
  const group = groups[card.group];
  if (!group?.ids.includes(card.id)) throw new Error(`No ready renderer for ${card.id}`);
  return { original, effect: group.createEffect(card.id, original) };
}

async function select(value, autoplay = true) {
  const next = String(value).toLowerCase();
  if (!cards.has(next)) return getState();
  stop(); const token = ++revision; id = next; time = 0; ready = false;
  const card = cards.get(id);
  for (const target of ['original', 'animated']) {
    const ctx = $(target).getContext('2d'); ctx.save();
    try { ctx.resetTransform(); ctx.clearRect(0, 0, WIDTH, HEIGHT); } finally { ctx.restore(); }
  }
  $('loading').hidden = false; $('retry').hidden = true;
  $('load-message').setAttribute('role', 'status'); $('load-message').textContent = `Loading ${card.name}…`;
  for (const heading of document.querySelectorAll('.card-title')) heading.textContent = card.name;
  for (const rule of document.querySelectorAll('.card-rule')) rule.textContent = card.rule;
  $('description').textContent = card.description;
  $('original').setAttribute('aria-label', `${card.name}: original painting`);
  $('animated').setAttribute('aria-label', `${card.name}: ${card.description}`);
  document.title = `${card.name} · Living card art · King Down`;
  controls();
  try {
    if (!cache.has(id)) cache.set(id, load(card));
    const loaded = await cache.get(id);
    if (token !== revision) return getState();
    current = loaded; ready = true;
    const originalCtx = $('original').getContext('2d');
    originalCtx.save();
    try { originalCtx.resetTransform(); originalCtx.clearRect(0,0,WIDTH,HEIGHT); originalCtx.drawImage(current.original,0,0); }
    finally { originalCtx.restore(); }
    $('loading').hidden = true;
    const url = new URL(location.href); url.hash = id; history.replaceState(null, '', url);
    draw(); controls(); if (autoplay) setPlaying(true);
  } catch (error) {
    cache.delete(next); if (token === revision) fail(error);
  }
  return getState();
}

async function readJSON(path) {
  const response = await fetch(new URL(path, location.href));
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

async function start() {
  try {
    const [catalog, manifest] = await Promise.all([readJSON('./catalog.json'), readJSON('../manifest.json')]);
    const paintings = new Map(manifest.cards.map(card => [card.id.toLowerCase(), card]));
    cards.clear();
    for (const entry of catalog.cards) {
      const cardId = entry.id.toLowerCase(), painting = paintings.get(cardId), ruleCard = released.get(cardId);
      const extra = cardId === 'rescue' || cardId === 'back';
      if (!painting || (!ruleCard && !extra) || (cardId !== 'freeze' && !groups[entry.group]?.ids.includes(cardId))) throw new Error(`Incomplete preview: ${cardId}`);
      cards.set(cardId, { ...entry, id: cardId, name: painting.name, proposal: painting.proposal,
        rule: ruleCard ? ruleLine(cardText(ruleCard.id, DEFAULT_RULES)) : cardId === 'rescue' ? ruleLine(cardText('Rescue', DEFAULT_RULES)) : '' });
    }
    if (!cards.size) throw new Error('No ready card animations');
    $('card-nav').replaceChildren();
    for (const card of cards.values()) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.id = card.id;
      button.textContent = card.name;
      button.onclick = () => { $('chooser').open = false; select(card.id, true); $('choose-summary').focus({ preventScroll: true }); };
      $('card-nav').append(button);
    }
    await select(cards.has(hashId()) ? hashId() : cards.keys().next().value, true);
  } catch (error) { fail(error); }
}

function step(amount) {
  const order = Array.from(cards.keys()), at = order.indexOf(id);
  if (order.length) select(order[(at + amount + order.length) % order.length], true);
}
$('previous').onclick = () => step(-1);
$('next').onclick = () => step(1);
$('play').onclick = () => setPlaying(!playing);
$('replay').onclick = replay;
for (const value of ['idle', 'awaken']) $(value).onclick = () => { setMode(value); replay(); };
$('scrub').oninput = event => seek(Number(event.target.value) / 1000);
$('half-speed').onchange = event => { speed = event.target.checked ? .5 : 1; last = 0; controls(); };
$('reduced').onchange = event => setReduced(event.target.checked);
$('retry').onclick = () => cards.has(id) ? select(id, true) : start();
query.addEventListener('change', () => setReduced(query.matches));
document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); controls(); } });
new IntersectionObserver(entries => {
  inView = entries[0].isIntersecting;
  if (!inView) { stop(); controls(); }
}, { threshold: .05 }).observe($('animated'));
window.addEventListener('pagehide', () => { stop(); controls(); });
window.addEventListener('hashchange', () => { if (cards.has(hashId())) select(hashId(), true); });
window.wideCardMotion = { getState, select, seek, setMode, setReduced, replay, setPlaying, frame: () => frame.toDataURL() };
controls(); start();
