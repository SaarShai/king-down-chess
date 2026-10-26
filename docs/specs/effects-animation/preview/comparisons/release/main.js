import { createScene } from '../../../../../2d-first-pieces/board/scene.mjs';
import * as pieces from '../../../../../../src/rules/engine';
import { coordInk } from '../../../../../../src/render/board-ink';
import { drawBoardEffects } from '../../../../../../src/render/effects/board-effects';
import { StateEffects } from '../../../../../../src/render/effects/states';
import { SIGNAL_DURATION_MS } from '../../../../../../src/render/effects/indications';
import { samples, proof, controller } from './fixtures';
import { drawRelease } from './release';
const $ = id => document.getElementById(id);
const canvas = $('board');
const scene = createScene({ canvas, pieces, headroom: 64, floor: null, kings: ['spirit', 'shadow'] });
scene.setLively({ atmosphere: true, moves: false, idle: false, kings: false, pawns: false, captures: false }); scene.setReducedMotion(true);
const query = matchMedia('(prefers-reduced-motion: reduce)');
const lossAt = 250, releaseMs = 620, duration = lossAt + Math.round(.28 * SIGNAL_DURATION_MS) + 220;
let variant = 'current', sample = samples[0], progress = 0, reduced = query.matches, playing = false, ready = false, flipped = false, speed = 1, inView = true, raf = 0, last = 0;
let effects = new StateEffects(), displayed;
const clamp = n => Math.max(0, Math.min(1, n));
const clock = () => progress * duration;
function prepare() {
  effects = new StateEffects(); effects.sync(sample.f.rules, sample.before, 0, true);
  if (clock() >= lossAt) { effects = controller(sample); effects.remaining(clock()); }
}
scene.setDecorate((ctx, _scene, layer, row) => {
  const lost = clock() >= lossAt;
  if (variant === 'current' || !lost) drawBoardEffects(ctx, scene, layer, row, effects, {}, canvas.getBoundingClientRect().width, clock(), !reduced, false, null, 0);
  else if (!reduced && (layer === 'under' || row === scene.cell(sample.target).row)) drawRelease(ctx, scene, sample, layer === 'over', (clock() - lossAt) / releaseMs);
});
function render() {
  prepare();
  const lost = clock() >= lossAt, pos = lost ? sample.after : sample.before;
  if (displayed !== pos) { scene.setPosition(pos); displayed = pos; }
  scene.redraw();
  const residue = lost && !reduced && clock() < lossAt + (variant === 'current' ? sample.id === 'shelter' ? 0 : .28 * SIGNAL_DURATION_MS : releaseMs);
  $('phase').textContent = !lost ? 'Active · settled' : residue ? 'Rule ended · residue' : 'Rule ended · clear';
  $('badge').hidden = lost; $('badge').textContent = `${sample.title} active`;
  $('title').textContent = sample.title; $('detail').textContent = sample.detail; $('action').textContent = `${sample.action} · legal engine move`;
  $('proposal').textContent = `Proposed · ${sample.proposal}`;
  $('baseline').textContent = sample.id === 'shelter' ? 'Current · the production mantle ends at source loss. Proposed · 620 ms of residue.' : 'Current · 1,344 ms of production residue. Proposed · 620 ms of residue.';
  $('time').textContent = `${Math.round(clock())} / ${duration} ms`; $('view-time').textContent = `${Math.round(clock())} ms`;
  $('scrub').value = String(progress * 1000); $('play').textContent = playing ? 'Pause' : 'Play';
  $('current').setAttribute('aria-pressed', String(variant === 'current')); $('proposed').setAttribute('aria-pressed', String(variant === 'proposed'));
  $('play').disabled = !ready || reduced; $('replay').disabled = !ready; $('scrub').disabled = !ready || reduced;
  canvas.setAttribute('aria-label', `${sample.title}, ${variant}, ${Math.round(clock())} milliseconds. ${lost ? 'Condition ended.' : 'Condition active.'}`);
}
function stop() { playing = false; cancelAnimationFrame(raf); raf = 0; last = 0; }
function seek(value) { if (!Number.isFinite(value)) return; stop(); progress = reduced ? value >= lossAt / duration ? 1 : 0 : clamp(value); render(); }
function tick(time) {
  if (!playing) return;
  if (document.hidden || !inView) { stop(); render(); return; }
  if (last) progress = clamp(progress + (time - last) * speed / duration);
  last = time; if (progress === 1) stop(); render(); if (playing) raf = requestAnimationFrame(tick);
}
function play() {
  if (playing) { stop(); render(); return; }
  if (!ready || reduced || document.hidden || !inView) return;
  if (progress === 1) progress = 0; playing = true; last = 0; render(); raf = requestAnimationFrame(tick);
}
function replay() { stop(); progress = reduced ? 1 : 0; render(); if (!reduced) play(); }
function select(id) { const next = samples.find(s => s.id === id); if (!next) return; stop(); sample = next; progress = 0; $('sample').value = id; render(); }
function setVariant(next) { if (!['current', 'proposed'].includes(next)) return; variant = next; render(); }
function setReduced(next) { stop(); reduced = Boolean(next); $('reduced').checked = reduced; progress = clock() >= lossAt ? 1 : 0; render(); }
$('replay').addEventListener('click', replay); $('play').addEventListener('click', play);
$('scrub').addEventListener('input', e => seek(Number(e.target.value) / 1000)); $('sample').addEventListener('change', e => select(e.target.value));
$('speed').addEventListener('change', e => { speed = Number(e.target.value); }); $('reduced').addEventListener('change', e => setReduced(e.target.checked));
for (const name of ['current', 'proposed']) $(name).addEventListener('click', () => setVariant(name));
$('flip').addEventListener('click', () => { stop(); flipped = !flipped; scene.setFlipped(flipped); $('flip').setAttribute('aria-pressed', String(flipped)); render(); });
query.addEventListener('change', () => setReduced(query.matches)); document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); render(); } });
const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; if (!inView && playing) { stop(); render(); } }); observer.observe(canvas);
new ResizeObserver(() => { const ink = coordInk(canvas.getBoundingClientRect().width); scene.setCoords(ink.shown, ink.size, ink.inset); scene.redraw(); }).observe(canvas);
document.addEventListener('keydown', e => { if (e.code === 'Space' && !['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(e.target.tagName)) { e.preventDefault(); play(); } });
Object.assign(window, { comparisonStudy: {
  get ready() { return ready; }, seek, select, setVariant, replay, play, pause: () => { stop(); render(); }, setReduced,
  getState: () => ({ variant, sample: sample.id, progress, reduced, playing, flipped, speed, timestamp: clock(), lossAt, releaseMs, duration, baselineReleaseMs: sample.id === 'shelter' ? 0 : Math.round(.28 * SIGNAL_DURATION_MS), active: clock() < lossAt, residueFrames: effects.frames.filter(s => s.clear != null).length, materialFrames: effects.frames.map(s => ({ kind: s.kind, clear: s.clear ?? null, turns: s.turns, progress: effects.materialProgress(s, clock(), !reduced) })), inView, hidden: document.hidden, sceneFrames: scene.frames, board: Array.from((clock() < lossAt ? sample.before : sample.after).board), proof }),
} });
$('reduced').checked = reduced; render();
scene.load().then(async () => {
  // The scene builds contact shadows at idle. Warm each real fixture before ready.
  for (const entry of samples) {
    scene.setPosition(entry.before); scene.redraw();
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => (globalThis.requestIdleCallback ?? (fn => setTimeout(fn, 0)))(resolve, { timeout: 600 }));
  }
  displayed = undefined; ready = true; $('loading').hidden = true; render();
}).catch(error => { $('loading').textContent = `The board cannot load. Reload to try again. ${String(error)}`; });
window.addEventListener('pagehide', () => { stop(); observer.disconnect(); scene.dispose(); });
