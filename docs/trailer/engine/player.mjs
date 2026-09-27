// Trailer player: composites the timeline's shots at any global time T.
// Serve docs/ and open trailer/engine/ — ?t=12.5 shows one frame, ?shot=beast isolates a shot, ?play plays live.
// window.renderAt(T) draws the frame for the render tool; window.ready resolves when every shot is set up.
import { W, H } from './runtime.mjs';
import { shots, DURATION } from './timeline.mjs';

const q = new URLSearchParams(location.search), stage = document.getElementById('stage');
const only = q.get('shot'), list = only ? shots.filter(s => s.id === only) : shots;
const offset = only ? list[0].start : 0;

async function mount(shot) {
  const box = document.createElement('div'); box.className = 'shot'; box.dataset.id = shot.id;
  const base = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const layer = document.createElement('div'); layer.className = 'layer';
  const top = Object.assign(document.createElement('canvas'), { width: W, height: H });
  box.append(base, layer, top); stage.append(box);
  const mod = await import(`./shots/${shot.module}.mjs`);
  const draw = await mod.create(shot.params, { fx: base.getContext('2d'), over: top.getContext('2d'), layer, W, H, dur: shot.dur });
  return { shot, box, draw };
}

const mounted = [];
window.ready = (async () => {
  await Promise.all([document.fonts.load('900 100px Cinzel'), document.fonts.load('700 36px Cinzel')]);
  for (const s of list) mounted.push(await mount(s));  // sequential: shots may share the game clock
  window.duration = only ? list[0].dur : DURATION;
  window.renderAt(Number(q.get('t') ?? 0));
  return true;
})();

window.renderAt = T => {
  T += offset;
  for (const m of mounted) {
    const { start, dur, fadeIn = 0, fadeOut = 0 } = m.shot, t = T - start;
    const live = t >= -fadeIn && t < dur + fadeOut;
    m.box.style.display = live ? '' : 'none';
    if (!live) continue;
    const a = Math.min(fadeIn ? (t + fadeIn) / fadeIn : 1, fadeOut ? (dur + fadeOut - t) / fadeOut : 1, 1);
    m.box.style.opacity = String(Math.max(0, a));
    m.draw(Math.max(0, t));
  }
};

// Live preview (requestAnimationFrame belongs to the shot clock, so a timer drives playback).
if (q.has('play')) window.ready.then(() => { const t0 = Date.now(); setInterval(() => window.renderAt(((Date.now() - t0) / 1000) % window.duration), 1000 / 30); });
