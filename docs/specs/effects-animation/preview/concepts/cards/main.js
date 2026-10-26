import { art } from '/src/account-game/art';
import { createScene } from '/docs/2d-first-pieces/board/scene.mjs';
import { GameRules } from '/src/game-rules';
import * as pieces from '/src/rules/engine';
import { POWERS_BALANCED, parseKings } from '/src/rules/rules';
import { toFen } from '/src/rules/setup';
import { cardPlayback } from '/src/render/effects/card';
import { drawFreeze, drawFirewall } from '/src/render/effects/materials';
import { cardPicture } from '/src/card-symbol';
import fixtures from '../../cards/fixtures.json';

const $ = id => document.getElementById(id);
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const PREPARE = 125, SPENT = 500;
const samples = [{ id: 'freeze', name: 'Freeze' }, { id: 'firewall', name: 'Firewall' }];
const assert = (value, message) => { if (!value) throw new Error(message); };

function buildFixture(id, dense) {
  const base = fixtures.find(f => f.id === `card-${id}`);
  const hand = [base.item, ...(id === 'freeze' ? ['Strike', 'Haste', 'Flight'] : ['Freeze', 'Strike', 'Flight'])];
  const kings = !dense && base.setup.kings ? parseKings(base.setup.kings) : undefined;
  const rules = new GameRules({ ...(kings?.some(Boolean) ? POWERS_BALANCED : {}), ...(kings ? { kings } : {}), markFree: id === 'firewall', hands: [hand, hand] });
  const play = (pos, lan) => {
    const found = rules.legalMoves(pos).filter(move => rules.toLan(pos, move) === lan);
    assert(found.length === 1, `${id}: ${lan} must have one legal action`);
    return { move: found[0], after: rules.makeMove(pos, found[0]) };
  };
  let before = rules.fromFen(dense ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : base.setup.fen);
  // The crowded position follows six legal moves from the normal starting board.
  if (dense) for (const lan of ['e2-e4', 'Ng8-f6', 'Nb1-c3', 'Nf6-d5', 'd2-d4', 'e7-e6']) before = play(before, lan).after;
  const { move, after } = play(before, base.actions[0]);
  const playback = cardPlayback(rules, before, move);
  assert(playback, `${id}: CardPlayback must accept the legal action`);
  assert(JSON.stringify([...before.board]) === JSON.stringify([...after.board]), `${id}: casting must not move or remove any figure`);
  assert(after.used?.[0] === 1, `${id}: exactly the first card must be spent`);
  assert(hand.length === 4 && new Set(hand).size === 4, 'The hand has four distinct cards');
  if (id === 'freeze') {
    assert(after.marks?.[0]?.sq === pieces.parseSq('d5'), 'Freeze must bind d5');
    assert(!rules.legalMoves(after).some(m => m.from === pieces.parseSq('d5')), 'The frozen knight must have no move');
    assert(after.turn === 1, 'Freeze must end White’s turn');
  } else {
    assert(after.marks?.[0]?.all && after.marks[0].ward, 'Firewall must protect the army');
    assert(after.turn === 0 && after.free, 'Firewall must leave the normal move available');
    // Finish the fixture turn only for a rule check. This preview stops at the cast.
    const continuation = play(after, dense ? 'Bc1-e3' : base.actions[1]).after;
    assert(!rules.legalMoves(continuation).some(m => m.captures.some(sq => pieces.colorOf(continuation.board[sq]) === 0)), 'Firewall must prevent an enemy capture');
  }
  return { id, hand, rules, before, after, playback, duration: playback.duration, dense };
}
const cases = new Map(samples.flatMap(s => [false, true].map(dense => [`${s.id}:${dense}`, buildFixture(s.id, dense)])));

const board = $('board'), stage = document.querySelector('.stage'), overlay = $('source-material');
const sourcePaint = document.createElement('canvas');sourcePaint.width = 160;sourcePaint.height = 180;
const scene = createScene({ canvas: board, pieces, headroom: 64, floor: null, kings: ['spirit', 'shadow'] });
scene.setLively({ atmosphere: true, moves: false, idle: false, kings: false, captures: false, pawns: false });
scene.setReducedMotion(true);
const media = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = media.matches, active = cases.get('freeze:true'), progress = 1, playing = false;
let treatment = 'local', flipped = false, speed = 1, ready = false, raf = 0, lastTime = 0, inView = true;
let displayed, sourceSlot, sourceEmblem, sourceState, overlayBox, anchor, destination;
let materialProgress = .42, elapsed = active.duration;

function cardArt(name) {
  return name === 'Firewall' ? cardPicture(name) : `<img src="${art(`ui/cards/${name.toLowerCase()}.webp`)}" alt="">`;
}
function fillHand() {
  $('hand').innerHTML = active.hand.map((name, index) => `<div class="card-slot${index === 0 ? ' is-source' : ''}" data-slot="${index}"><span class="emblem">${cardArt(name)}</span><b>${name}</b><span class="card-state">Ready</span></div>`).join('');
  sourceSlot = $('hand').firstElementChild;
  sourceEmblem = sourceSlot.querySelector('.emblem');
  sourceState = sourceSlot.querySelector('.card-state');
  return Promise.all([...$('hand').querySelectorAll('img')].map(img => img.decode().catch(() => {}))).then(() => { measure(); drawSource(); });
}
function measure() {
  overlayBox = stage.getBoundingClientRect();
  const dpr = Math.min(2, devicePixelRatio || 1);
  overlay.width = Math.max(1, Math.round(overlayBox.width * dpr));
  overlay.height = Math.max(1, Math.round(overlayBox.height * dpr));
  const coin = sourceEmblem.getBoundingClientRect(), rect = board.getBoundingClientRect();
  anchor = { x: coin.x - overlayBox.x + coin.width / 2, y: coin.y - overlayBox.y + coin.height * .8, scale: coin.width / 142 };
  const target = scene.foot(active.id === 'freeze' ? pieces.parseSq('d5') : pieces.parseSq('e1'));
  destination = { x: rect.x - overlayBox.x + target.x * rect.width / 960, y: rect.y - overlayBox.y + (target.y + 64 - 42) * rect.width / 960 };
  scene.setCoords(true, Math.max(17, 14 * 960 / Math.max(360, rect.width)), 15);
}

scene.setDecorate((ctx, _scene, layer, row) => {
  if (materialProgress <= 0) return;
  const draw = active.id === 'freeze' ? drawFreeze : drawFirewall;
  const front = layer === 'over', mark = active.after.marks[0];
  active.after.board.forEach((value, sq) => {
    if (!value || (mark.all ? pieces.colorOf(value) !== 0 : mark.sq !== sq)) return;
    if (front && scene.cell(sq).row !== row) return;
    draw(ctx, { ...scene.foot(sq), progress: materialProgress, front, seed: active.id === 'firewall' ? sq % 4 : sq });
  });
});

function wisp(ctx) {
  const u = clamp((elapsed - PREPARE) / 175);
  if (u <= 0 || u >= 1 || treatment !== 'wisp' || reduced) return;
  const cold = active.id === 'freeze', a = anchor, b = destination;
  const at = t => ({ x: a.x + (b.x - a.x) * t + Math.sin(t * Math.PI) * (flipped ? -15 : 15), y: a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 16 });
  // A tapered brush-sized connection lasts 175 ms; it never covers the board with a full trail.
  const head = ease(u), tail = Math.max(0, head - .29), fade = Math.sin(u * Math.PI);
  const colors = cold ? ['#377b9f', '#7fc6d6', '#e8ffff'] : ['#99441f', '#e9a54d', '#fff1b6'];
  for (let strand = 0; strand < 3; strand++) {
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const t = tail + (head - tail) * i / 20, p = at(t);
      const drag = Math.sin(i / 20 * Math.PI) * Math.sin(t * 43 + strand * 2) * (cold ? 1.7 : 2.7);
      i ? ctx.lineTo(p.x + drag, p.y) : ctx.moveTo(p.x, p.y);
    }
    ctx.strokeStyle = colors[strand];ctx.globalAlpha = fade * [.19, .4, .77][strand];
    ctx.lineWidth = [9, 4, 1.4][strand];ctx.lineCap = 'round';ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function drawSource() {
  if (!anchor || !overlay.width) return;
  const ctx = overlay.getContext('2d'), dpr = overlay.width / overlayBox.width;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);ctx.clearRect(0, 0, overlayBox.width, overlayBox.height);
  if (reduced || elapsed <= 0 || elapsed >= SPENT) return;
  const prepare = ease(elapsed / PREPARE), drain = 1 - ease((elapsed - PREPARE) / (SPENT - PREPARE));
  const draw = active.id === 'freeze' ? drawFreeze : drawFirewall;
  const paint = sourcePaint.getContext('2d');paint.clearRect(0, 0, 160, 180);
  for (const front of [false, true]) draw(paint, { x: 80, y: 145, progress: .32 * prepare, front, seed: 3 });
  ctx.save();ctx.translate(anchor.x, anchor.y);ctx.scale(anchor.scale, anchor.scale);
  ctx.globalAlpha = drain * .86;ctx.drawImage(sourcePaint, -80, -145);
  ctx.restore();wisp(ctx);
}
function stateText() {
  const committed = reduced || elapsed >= PREPARE;
  const phase = reduced || progress === 1 ? 'Result' : elapsed < PREPARE ? 'Prepare' : elapsed < SPENT ? 'Release' : 'Settle';
  $('phase').textContent = phase;
  $('meaning').textContent = active.id === 'freeze' ? 'The knight stays on d5. Its next turn is frozen.' : 'White’s army is protected. White still has a move.';
  $('cost').textContent = committed ? `${active.hand[0]} is spent. Three cards stay ready.` : `${active.hand[0]} is ready. Replay confirms the cast.`;
  $('hand-count').textContent = committed ? '3 ready · 1 spent' : '4 ready';
  const spent = reduced ? 1 : ease((elapsed - PREPARE) / (SPENT - PREPARE));
  sourceEmblem.style.filter = `grayscale(${spent}) brightness(${1 + .2 * Math.sin(clamp(elapsed / SPENT) * Math.PI) - .28 * spent})`;
  sourceEmblem.style.opacity = String(1 - .15 * spent);
  sourceState.textContent = committed ? 'Spent' : elapsed > 0 ? 'Casting' : 'Ready';
  $('scrub').value = String(Math.round(progress * 1000));
  $('scrub').setAttribute('aria-valuetext', `${phase}, ${(progress * active.duration / 1000).toFixed(2)} seconds`);
  $('time').textContent = `${(progress * active.duration / 1000).toFixed(1)} / ${(active.duration / 1000).toFixed(1)} s`;
  $('play').textContent = playing ? 'Pause' : 'Play';
  $('play').disabled = !ready || reduced;
  $('scrub').disabled = !ready || reduced;$('speed').disabled = reduced;
  $('replay').disabled = !ready;
}
function render() {
  elapsed = progress * active.duration;
  materialProgress = reduced ? .42 : .42 * ease((elapsed - PREPARE) / (active.id === 'freeze' ? 450 : 480));
  const t = reduced || progress === 1 ? 1 : elapsed < PREPARE ? 0 : .62 + .38 * clamp((elapsed - PREPARE) / (active.duration - PREPARE));
  const shown = active.playback.position(t);
  // CardPlayback supplies the frame position. The concept replaces the king-source travel with local approved material.
  if (shown !== displayed) { scene.setPosition(shown);displayed = shown; }
  scene.redraw();stateText();drawSource();
}
function stop() { playing = false;cancelAnimationFrame(raf);raf = 0;lastTime = 0;if (ready) stateText(); }
function tick(now) {
  if (!playing || reduced || document.hidden || !inView) { stop();return; }
  if (lastTime) progress = clamp(progress + (now - lastTime) * speed / active.duration);
  lastTime = now;render();
  if (progress === 1) stop();else raf = requestAnimationFrame(tick);
}
function play() {
  if (!ready || reduced || document.hidden || !inView || playing) return;
  if (progress === 1) progress = 0;
  playing = true;lastTime = 0;render();raf = requestAnimationFrame(tick);
}
const painted = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
async function seek(value) { stop();progress = clamp(Number.isFinite(value) ? value : 0);render();await painted();return getState(); }
async function select(id) {
  const sample = samples.find(s => s.id === String(id).toLowerCase());
  assert(sample, `Unknown card: ${id}`);stop();
  active = cases.get(`${sample.id}:${$('dense').checked}`);progress = 1;
  $('sample-title').textContent = sample.name;$('replay').textContent = `Replay ${sample.name}`;
  document.querySelectorAll('[data-sample]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.sample === sample.id)));
  board.setAttribute('aria-label', sample.id === 'freeze' ? 'Painted board. Freeze holds the black knight on d5.' : 'Painted board. Firewall protects White’s army without damage.');
  await fillHand();measure();render();await painted();return getState();
}
function getState() {
  const committed = reduced || progress * active.duration >= PREPARE;
  return { id: active.id, progress, playing, reduced, treatment, dense: active.dense, flipped, speed, ready, duration: active.duration, preparationMs: PREPARE, materialProgress, remaining: committed ? 3 : 4, spent: committed ? 1 : 0, slots: 4, fixtureLegal: true, beforeFen: toFen(active.before), afterFen: toFen(active.after), shownFen: toFen(scene.position), target: active.id === 'freeze' ? 'd5' : 'white-army', boardUnchanged: [...active.before.board].every((value, sq) => value === active.after.board[sq]), continuationPending: active.id === 'firewall' && committed, sceneFrames: scene.frames };
}
$('replay').addEventListener('click', () => { if (reduced) { seek(1);return; }stop();progress = 0;play(); });
$('play').addEventListener('click', () => playing ? stop() : play());
$('scrub').addEventListener('input', event => seek(Number(event.target.value) / 1000));
$('speed').addEventListener('change', event => { speed = Number(event.target.value);lastTime = 0; });
$('flip').addEventListener('click', () => { flipped = !flipped;scene.setFlipped(flipped);$('flip').setAttribute('aria-pressed', String(flipped));measure();render(); });
$('dense').addEventListener('change', () => select(active.id));
function setReduced(value) { reduced = value;$('reduced').checked = reduced;stop();if (reduced) progress = 1;render(); }
$('reduced').checked = reduced;
$('reduced').addEventListener('change', event => setReduced(event.target.checked));
media.addEventListener('change', event => setReduced(event.matches));
document.querySelectorAll('[data-sample]').forEach(button => button.addEventListener('click', () => select(button.dataset.sample)));
document.querySelectorAll('[data-treatment]').forEach(button => button.addEventListener('click', () => {
  stop();treatment = button.dataset.treatment;
  document.querySelectorAll('[data-treatment]').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
  render();
}));
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
new IntersectionObserver(entries => { inView = entries[0].isIntersecting;if (!inView) stop(); }, { threshold: .05 }).observe(stage);
new ResizeObserver(() => { measure();drawSource(); }).observe(stage);
window.addEventListener('pagehide', () => { stop();scene.dispose(); });
Object.assign(window, { motionConcept: { get ready() { return ready; }, seek, select, getState, samples } });
const handReady = fillHand();measure();render();
scene.load().then(async () => {
  await Promise.all([document.fonts.ready, handReady]);
  $('loading').hidden = true;measure();render();
  // The shared scene builds contact shadows in idle time. Ready includes that stable art.
  let previous = '';
  for (let i = 0; i < 12; i++) {
    await new Promise(resolve => globalThis.requestIdleCallback ? requestIdleCallback(resolve, { timeout: 500 }) : setTimeout(resolve, 0));
    scene.redraw();await painted();
    const frame = board.toDataURL();if (frame === previous) break;previous = frame;
  }
  ready = true;stateText();
}).catch(error => { $('loading').textContent = `The art cannot load. Reload to try again. ${error.message}`; });
