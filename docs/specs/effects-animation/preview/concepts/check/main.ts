import { createScene } from '../../../../../2d-first-pieces/board/scene.mjs';
import kingIcon from '../../../../../../public/ui/icons/king.svg?url';
import * as pieces from '../../../../../../src/rules/engine';
import { coordInk } from '../../../../../../src/render/board-ink';
import { link } from '../../../../../../src/render/effects/indications';
import { samples } from './fixtures';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('board');
const scene = createScene({ canvas, pieces, headroom: 64, floor: null, kings: ['spirit', 'shadow'] });
scene.setLively({ atmosphere: true, moves: false, idle: false, kings: false, pawns: false, captures: false });
scene.setReducedMotion(true);
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => 1 - (1 - clamp(n)) ** 4;
const smooth = (n: number) => { n = clamp(n); return n * n * (3 - 2 * n); };
const query = matchMedia('(prefers-reduced-motion: reduce)');
let active = samples[0], progress = 1, playing = false, ready = false, reduced = query.matches;
let mode: 'check' | 'resolve' = 'check', speed = 1, flipped = false, raf = 0, lastTime = 0, inView = true;
let displayed: pieces.Position | undefined;
let glyphs: Path2D[] = [];
const onsetMs = 440, withdrawalMs = 220;
const duration = () => mode === 'check' ? onsetMs : withdrawalMs;
const pixel = () => 960 / Math.max(1, canvas.getBoundingClientRect().width);

// Fixed bristle strokes leave dry gaps. The stamp never changes between seeks.
function paintTexture() {
  const c = document.createElement('canvas'); c.width = 320; c.height = 180;
  const ctx = c.getContext('2d')!;
  let seed = 71;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  ctx.lineCap = 'round';
  for (let i = 0; i < 190; i++) {
    const y = 29 + random() * 111, belly = Math.sin((y - 23) / 128 * Math.PI);
    const x = 34 + (1 - belly) * 43 + random() * 19, right = 282 - (1 - belly) * 37 - random() * 21;
    ctx.globalAlpha = .1 + random() * .23;
    ctx.strokeStyle = ['#692821', '#873126', '#9d402e', '#ae5b3e'][i % 4];
    ctx.lineWidth = 2 + random() * 10;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(100, y - 9 + random() * 11, 205, y + random() * 13, right, y - 3 + random() * 6); ctx.stroke();
  }
  for (let i = 0; i < 160; i++) {
    const x = 26 + random() * 270, y = 23 + random() * 125;
    ctx.globalCompositeOperation = i % 4 ? 'destination-out' : 'source-over';
    ctx.globalAlpha = .12 + random() * .25; ctx.strokeStyle = '#e6a373'; ctx.lineWidth = .4 + random() * 1.3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4 + random() * 26, y - 1 + random() * 3); ctx.stroke();
  }
  return c;
}
const paint = paintTexture();
const accent = document.createElement('canvas'); accent.width = 960; accent.height = 1024;
function cacheCheckerEdge() {
  const ctx = accent.getContext('2d')!;
  ctx.clearRect(0, 0, 960, 1024);
  for (const ch of active.checkers) scene.ghost(ctx, active.checked.board[ch.sq], ch.sq, 1);
  ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = '#e5aa59'; ctx.fillRect(0, 0, 960, 1024);
  ctx.globalCompositeOperation = 'source-over';
}
function drawWash(ctx: CanvasRenderingContext2D, life: number, press: number, withdrawing = false) {
  if (life <= 0) return;
  const foot = scene.foot(active.checkers[0].king);
  ctx.save(); ctx.translate(foot.x, foot.y - 4);
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = life * .85;
  const spread = withdrawing ? 1 - press * .16 : 1.24 - .24 * press;
  ctx.drawImage(paint, -75 * spread, -53, 150 * spread, 78);
  ctx.globalAlpha = life * .54;
  ctx.drawImage(paint, -57 * spread + (1 - press) * 12, -38, 110 * spread, 54);
  ctx.restore();
}
function drawSeal(ctx: CanvasRenderingContext2D, t: number) {
  const impression = reduced ? 1 : ease((t - 175) / 150);
  if (impression <= 0) return;
  const f = scene.foot(active.checkers[0].king), size = Math.max(42, 23 * pixel());
  const scale = 1.12 - .12 * impression;
  ctx.save();
  ctx.translate(f.x + 33, f.y - 34 - (1 - impression) * 12);
  ctx.scale(scale, scale); ctx.globalAlpha = impression;
  ctx.drawImage(paint, -size * .75, -size * .84, size * 1.5, size * 1.72);
  ctx.save();ctx.scale(size / 48, size / 48);ctx.translate(-24, -24);
  ctx.fillStyle = '#f9e7bf';
  for (const path of glyphs) ctx.fill(path, 'evenodd');
  ctx.restore();ctx.restore();
}
function decoration(ctx: CanvasRenderingContext2D, layer: 'under' | 'over', row?: number) {
  const t = progress * duration();
  if (mode === 'resolve') {
    if (layer === 'under' && !reduced && progress < 1) drawWash(ctx, 1 - ease(progress), smooth(progress), true);
    return;
  }
  if (layer === 'under') {
    const press = reduced ? 1 : ease((t - 45) / 290);
    drawWash(ctx, reduced ? 1 : smooth(t / 85), press);
    const edge = reduced ? 0 : smooth(t / 55) * (1 - smooth((t - 110) / 160));
    if (edge > 0) {
      ctx.save(); ctx.globalAlpha = edge * .85;
      const offset = Math.max(3, pixel());
      for (const [x, y] of [[-offset, 0], [offset, 0], [0, -offset]]) ctx.drawImage(accent, x, y);
      ctx.restore();
    }
  }
  if (layer === 'over' && row === scene.cell(active.checkers[0].king).row) drawSeal(ctx, t);
  if (layer === 'over' && row === 7) {
    ctx.save(); ctx.globalAlpha = .9;
    // The full cause stays still: no travelling attack or growing path.
    for (const ch of active.checkers) link(ctx, scene, ch.sq, ch.king, '#b84d25', ch.path === 'arc');
    ctx.restore();
  }
}
scene.setDecorate((ctx, _scene, layer, row) => decoration(ctx, layer, row));
function render() {
  const pos = mode === 'resolve' ? active.resolved : active.checked;
  if (displayed !== pos) { scene.setPosition(pos); displayed = pos; }
  scene.redraw();
  const resolved = mode === 'resolve';
  document.querySelector<HTMLElement>('.concept')!.dataset.state = mode;
  $('state-title').textContent = resolved ? 'Check resolved' : 'Check';
  $('instruction').textContent = resolved ? 'The White king is safe on f1.' : 'Get the White king out of check.';
  $('cause').textContent = resolved ? 'King e1 → f1 · Black to move' : 'Black rook e3 → White king e1';
  canvas.setAttribute('aria-label', resolved ? 'White king on f1. Check is resolved. Black to move.' : 'Black rook on e3 checks the White king on e1. White must answer check.');
  $('phase').textContent = reduced ? 'Still result · reduced motion' : resolved ? progress === 1 ? 'Resolved' : 'Paint withdraws' : progress === 1 ? 'Still check' : progress * onsetMs < 175 ? 'Pressure gathers' : progress * onsetMs < 330 ? 'Seal impression' : 'Settles';
  const count = Array.from(pos.board).filter(Boolean).length;
  $('position-label').textContent = `${count} pieces · ${resolved ? 'Black' : 'White'} to move`;
  $('timeline-title').textContent = resolved ? 'Check withdrawal' : 'Check onset';
  $('time').textContent = `${Math.round(progress * duration())} / ${duration()} ms`;
  $<HTMLInputElement>('scrub').value = String(Math.round(progress * 1000));
  $('start-label').textContent = resolved ? 'Legal reply' : 'Checker';
  $('middle-label').textContent = resolved ? 'Withdraw' : 'Impression';
  $('end-label').textContent = resolved ? 'Safe' : 'Still check';
  $('play').textContent = playing ? 'Pause' : 'Play';
  $('play').setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
  $<HTMLButtonElement>('play').disabled = !ready || reduced;
  $<HTMLButtonElement>('replay').disabled = !ready;
  $<HTMLButtonElement>('resolve').disabled = !ready || resolved;
  $<HTMLInputElement>('scrub').disabled = !ready || reduced;
}
function stop() { playing = false; cancelAnimationFrame(raf); raf = 0; lastTime = 0; render(); }
function seek(value: number) {
  if (!Number.isFinite(value)) return;
  stop(); progress = reduced ? 1 : clamp(value); render();
}
function tick(time: number) {
  if (!playing) return;
  if (document.hidden || !inView) { stop(); return; }
  if (lastTime) progress = clamp(progress + (time - lastTime) * speed / duration());
  lastTime = time;
  if (progress === 1) { stop(); return; }
  render(); raf = requestAnimationFrame(tick);
}
function play() {
  if (!ready || reduced || document.hidden || !inView) return;
  if (playing) { stop(); return; }
  if (progress === 1) progress = 0;
  playing = true; lastTime = 0; render(); raf = requestAnimationFrame(tick);
}
function replay() { stop(); mode = 'check'; progress = reduced ? 1 : 0; render(); if (!reduced) play(); }
function resolve() { stop(); mode = 'resolve'; progress = reduced ? 1 : 0; render(); if (!reduced) play(); }
function select(id: string) {
  const next = samples.find(s => s.id === id); if (!next) return;
  stop(); active = next; mode = 'check'; progress = 1;
  $<HTMLSelectElement>('sample').value = next.id;
  if (ready) cacheCheckerEdge(); render();
}
function setReduced(value: boolean) {
  stop(); reduced = value; $<HTMLInputElement>('reduced').checked = reduced;
  if (reduced) progress = 1;
  render();
}
$('replay').addEventListener('click', replay);
$('resolve').addEventListener('click', resolve);
$('play').addEventListener('click', play);
$('scrub').addEventListener('input', e => seek(Number((e.target as HTMLInputElement).value) / 1000));
$('sample').addEventListener('change', e => select((e.target as HTMLSelectElement).value));
$('speed').addEventListener('change', e => { speed = Number((e.target as HTMLSelectElement).value); });
$('reduced').addEventListener('change', e => setReduced((e.target as HTMLInputElement).checked));
$('flip').addEventListener('click', () => {
  stop(); flipped = !flipped; scene.setFlipped(flipped);
  $('flip').setAttribute('aria-pressed', String(flipped));
  if (ready) cacheCheckerEdge(); render();
});
query.addEventListener('change', () => setReduced(query.matches));
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
const observer = new IntersectionObserver(entries => {
  inView = entries[0].isIntersecting;
  if (!inView && playing) stop();
});
observer.observe(canvas);
document.addEventListener('keydown', e => {
  const tag = (e.target as HTMLElement).tagName;
  if (['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(tag)) return;
  if (e.code === 'Space') { e.preventDefault(); play(); }
});
new ResizeObserver(() => {
  const ink = coordInk(canvas.getBoundingClientRect().width);
  scene.setCoords(ink.shown, ink.size, ink.inset); scene.redraw();
}).observe(canvas);
const requested = new URLSearchParams(location.search).get('sample');
select(requested ?? 'dense');
$<HTMLInputElement>('reduced').checked = reduced;
Object.assign(window, { motionConcept: {
  get ready() { return ready; }, seek, select, samples: samples.map(({ id, title }) => ({ id, title })),
  getState: () => ({ id: active.id, mode, progress, playing, reduced, flipped, speed, duration: duration(),
    inCheck: mode === 'check', status: active.rules.status(mode === 'check' ? active.checked : active.resolved),
    checkers: mode === 'check' ? active.checkers : [], resultKing: mode === 'check' ? 'e1' : 'f1',
    board: Array.from((mode === 'check' ? active.checked : active.resolved).board), fixtureLegal: true, sceneFrames: scene.frames }),
} });
Promise.all([scene.load(), fetch(kingIcon).then(r => { if (!r.ok) throw new Error('King icon could not load'); return r.text(); }).then(svg => {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  glyphs = [...doc.querySelectorAll('path')].map(path => new Path2D(path.getAttribute('d')!));
  if (!glyphs.length) throw new Error('King icon is empty');
})]).then(() => {
  ready = true; cacheCheckerEdge(); $('loading').hidden = true; render();
}).catch(error => { $('loading').textContent = `The preview could not load. Reload to try again. ${String(error)}`; });
window.addEventListener('pagehide', () => { stop(); observer.disconnect(); scene.dispose(); });
render();
