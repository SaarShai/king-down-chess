import { createScene } from '/docs/2d-first-pieces/board/scene.mjs';
import * as pieces from '/src/rules/engine';
import { samples } from './fixtures.js';
import { loadPigment, frameAt, drawVeil, drawFlakes, DURATION_MS, clamp } from './ascension.js';

const $ = id => document.getElementById(id);
const canvas = $('board');
const scene = createScene({ canvas, pieces, headroom: 96, floor: null, kings: ['spirit', 'shadow'] });
scene.setLively({ atmosphere: true, moves: false, idle: false, kings: false, pawns: false, captures: false });
scene.setReducedMotion(true);
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let active = samples[0], progress = 1, playing = false, reduced = preference.matches, flipped = false, ready = false, onscreen = true;
let speed = 1, raf = 0, lastTime = 0;

function phase() {
  const frame = frameAt(progress, reduced);
  return reduced || progress === 1 ? `${active.title} on d8` : frame.travel < 1 ? 'Pawn arrives' : frame.t < .42 ? 'Gold veil rises' : frame.t < .77 ? `${active.title} revealed` : 'Gold settles';
}
function controls() {
  $('play').textContent = playing ? 'Pause' : 'Play';
  $('play').disabled = !ready || reduced;
  $('replay').disabled = !ready;
  $('scrub').disabled = !ready || reduced;
  $('speed').disabled = reduced;
  $('scrub').value = String(Math.round(progress * 1000));
  $('scrub').setAttribute('aria-valuetext', `${Math.round(progress * DURATION_MS)} milliseconds. ${phase()}.`);
  $('time').textContent = `${(progress * DURATION_MS / 1000).toFixed(2)} s`;
  $('phase').textContent = phase();
  $('outcome').textContent = `Pawn to ${active.title.toLowerCase()} · d7–d8`;
  canvas.setAttribute('aria-label', `Painted chessboard. White promotes to ${active.title.toLowerCase()} on d8. ${phase()}.`);
  $('motion-note').textContent = reduced ? `Reduced motion shows the ${active.title.toLowerCase()} directly.` : 'Replay once, or scrub to inspect a frame.';
}
function render() { scene.redraw(); controls(); }
function stop() { playing = false; cancelAnimationFrame(raf); raf = 0; lastTime = 0; controls(); }
function tick(now) {
  if (!playing || reduced || document.hidden || !onscreen) { stop(); return; }
  if (lastTime) progress = clamp(progress + (now - lastTime) * speed / DURATION_MS);
  lastTime = now;
  render();
  if (progress >= 1) stop(); else raf = requestAnimationFrame(tick);
}
function play() {
  if (!ready || playing || reduced || document.hidden || !onscreen) return;
  if (progress >= 1) progress = 0;
  playing = true; lastTime = 0; render(); raf = requestAnimationFrame(tick);
}
function seek(value) {
  stop(); progress = reduced ? 1 : clamp(Number.isFinite(value) ? value : 0); render();
  // The shared scene draws on its own frame; callers can await a completed exact render.
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
function select(id) {
  const sample = samples.find(item => item.id === id);
  if (!sample) throw new Error(`Unknown promotion sample: ${id}`);
  stop(); active = sample; progress = 1; scene.setPosition(active.display);
  for (const button of document.querySelectorAll('[data-choice]')) button.setAttribute('aria-pressed', String(button.dataset.choice === id));
  return seek(1);
}
function setReduced(on) {
  stop(); reduced = on; $('reduced').checked = reduced;
  if (reduced) progress = 1;
  render();
}

scene.setDecorate((ctx, _, layer, row) => {
  const frame = frameAt(progress, reduced), destination = scene.foot(active.move.to), source = scene.foot(active.move.from);
  const foot = { x: source.x + (destination.x - source.x) * frame.travel, y: source.y + (destination.y - source.y) * frame.travel };
  if (layer === 'under') { drawVeil(ctx, destination, frame, false); return; }
  // Keep the transformed actor within its board row, under any figures in front of it.
  const actorRow = Math.max(0, Math.min(7, Math.floor((foot.y - scene.PAD) / scene.TILE)));
  if (row !== actorRow) return;
  ctx.save(); ctx.translate(foot.x - destination.x, foot.y - destination.y);
  if (frame.pawn > 0) scene.ghost(ctx, active.before.board[active.move.from], active.move.to, frame.pawn);
  if (frame.reveal > 0) scene.ghost(ctx, active.after.board[active.move.to], active.move.to, frame.reveal);
  ctx.restore();
  drawVeil(ctx, destination, frame, true);
  if (!reduced) drawFlakes(ctx, destination, frame);
});

$('play').addEventListener('click', () => playing ? stop() : play());
$('replay').addEventListener('click', () => { if (reduced) { void seek(1); return; } void seek(0); play(); });
$('scrub').addEventListener('input', event => { void seek(Number(event.target.value) / 1000); });
$('speed').addEventListener('change', event => { speed = Number(event.target.value); lastTime = 0; });
$('reduced').addEventListener('change', event => setReduced(event.target.checked));
$('flip').addEventListener('click', () => { stop(); flipped = !flipped; scene.setFlipped(flipped); $('flip').setAttribute('aria-pressed', String(flipped)); render(); });
for (const button of document.querySelectorAll('[data-choice]')) button.addEventListener('click', () => { void select(button.dataset.choice); });
preference.addEventListener('change', event => setReduced(event.matches));
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
const observer = new IntersectionObserver(([entry]) => { onscreen = entry.isIntersecting; if (!onscreen) stop(); }, { threshold: .15 });
observer.observe(canvas);
new ResizeObserver(() => { scene.setCoords(true, Math.max(15, 14 * 960 / Math.max(360, canvas.clientWidth)), 14); }).observe(canvas);

window.motionConcept = {
  get ready() { return ready; }, seek, select,
  getState() {
    const frame = frameAt(progress, reduced);
    return { ready, id: active.id, playing, reduced, progress, flipped, speed, duration: DURATION_MS, phase: phase(), action: active.action,
      identity: frame.reveal >= 1 ? active.title.toLowerCase() : frame.reveal > 0 ? `pawn-to-${active.id}` : 'pawn',
      pawnOpacity: frame.pawn, resultOpacity: frame.reveal, transformProgress: frame.t, foot: scene.foot(active.move.to),
      board: Array.from(progress === 1 || reduced ? active.after.board : active.before.board), fixtureLegal: true };
  },
};

$('reduced').checked = reduced;
const requested = new URLSearchParams(location.search).get('sample');
void select(samples.some(sample => sample.id === requested) ? requested : 'queen');
Promise.all([scene.load(), loadPigment(), document.fonts.ready]).then(async () => {
  // Warm both exact sprite identities and shadows before exposing deterministic seek.
  for (const sample of samples) { active = sample; scene.redraw(); await seek(1); }
  await select(samples.some(sample => sample.id === requested) ? requested : 'queen');
  ready = true; $('loading').hidden = true; render();
}).catch(error => { $('loading').textContent = `The preview cannot load. Reload to try again. ${error.message}`; });
window.addEventListener('pagehide', () => { stop(); observer.disconnect(); scene.dispose(); });
