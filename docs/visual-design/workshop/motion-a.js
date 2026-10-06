// Set A, the Workshop's motion for approval (docs/WORKSHOP.md §5.5): A1 equip, A2 floor pop, A3 gauge
// ease, A4 overload, A5 the "When…" reveal. Plain browser code; tools/workshop-motion.mts puts it in
// the preview page. If the owner approves, it moves to src/workshop/motion.ts and dialog.ts calls
// react() after each change. Only transform, opacity and one stroke draw move.
// Every motion: a new tap first cancels the element's running motions; nothing runs with reduced
// motion or Settings › Animations Off (el.animate() ignores the CSS rule); Fast halves the times.

const pace = () => document.documentElement.dataset.pace || 'normal';
export const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches || pace() === 'off';
/** One animation on `el`, after the element's running ones are cancelled. Null when motion is off. */
function run(el, frames, o) {
  if (!el) return null;
  el.getAnimations().forEach(a => a.cancel());
  if (still()) return null;
  const k = pace() === 'fast' ? 0.5 : 1;
  return el.animate(frames, { easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'none', ...o, duration: o.duration * k, delay: (o.delay ?? 0) * k });
}
/** A copy of `old` laid over `el`'s place, which fades out (the 250 ms cross-fade). */
function fadeOut(old, parent, ms = 250) {
  if (!old || still()) return;
  old.style.pointerEvents = 'none';
  parent.append(old);
  const a = run(old, [{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: 'linear' });
  if (a) a.onfinish = a.oncancel = () => old.remove(); else old.remove();
}

/** A1 Equip: the figure's gait as an in-place bob (lift, squash, tilt; no travel), a rim flash, and a body cross-fade. */
export function equip(model, gait, before) {
  const fig = model.querySelector('.ws-fig'), rim = model.querySelector('.ws-rim');
  run(fig, gait, { duration: 450, easing: 'linear' });
  run(rim, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0.35, transform: 'scale(1.06)', offset: 0.3 }, { opacity: 1, transform: 'scale(1)' }], { duration: 450 });
  const old = before?.querySelector('.ws-fig');
  if (old && old.getAttribute('src') !== fig?.getAttribute('src')) {
    const copy = old.cloneNode();
    copy.style.zIndex = '1';
    fadeOut(copy, model);
    run(fig, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'linear', composite: 'add' });
  }
}

/** The floor's marks by place: "gem 45,25" or "ring 45,25", with their ring (1 to 3). */
function marks(svg) {
  const m = new Map();
  for (const e of svg.querySelectorAll('path[fill^="url"], circle[stroke-width="1.2"], circle[stroke-dasharray]')) {
    const [x, y] = e.tagName === 'circle' ? [+e.getAttribute('cx'), +e.getAttribute('cy')]
      : e.getAttribute('d').match(/^M([\d.-]+) ([\d.-]+)/).slice(1).map(Number).map((v, i) => (i ? v + 3.4 : v));
    const ring = Math.round(Math.max(Math.abs(x - 35), Math.abs(y - 35)) / 10);
    m.set(`${e.tagName} ${x.toFixed(1)},${y.toFixed(1)}${e.classList.contains('h') ? ' h' : ''}`, { e, ring });
  }
  return m;
}
/** A2 Floor pop: new marks pop in by distance, 300 ms + 38 ms a ring; removed marks fade. */
export function floorPop(model, before) {
  const svg = model.querySelector('.ws-floor-svg'), was = before && marks(before.querySelector('.ws-floor-svg'));
  if (!svg || !was) return;
  const now = marks(svg);
  for (const [k, { e, ring }] of now) if (!was.has(k)) {
    e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center';
    run(e, [{ opacity: 0, transform: 'scale(0.2)' }, { opacity: 1, transform: 'scale(1.15)', offset: 0.7 }, { opacity: 1, transform: 'scale(1)' }], { duration: 300, delay: 38 * (ring - 1) });
  }
  for (const [k, { e }] of was) if (!now.has(k)) fadeOut(e.cloneNode(true), svg, 300);
}

/** A3 Gauge ease: the gem, the band pill and the metal ease from where they were (350 ms). */
export function gaugeEase(gauge, before, model, modelBefore) {
  const ease = { duration: 350 };
  for (const sel of ['.g-gem', '.g-fuzz']) {
    const el = gauge.querySelector(sel), old = before?.querySelector(sel);
    if (!el || !old) continue;
    const w = gauge.querySelector('.g-track').getBoundingClientRect().width / 100;
    const [l0, l1] = [parseFloat(old.style.left), parseFloat(el.style.left)];
    if (sel === '.g-gem') run(el, [{ transform: `translateX(${(l0 - l1) * w}px)` }, { transform: 'none' }], ease);
    else {
      const [w0, w1] = [parseFloat(old.style.width) || 0.1, parseFloat(el.style.width) || 0.1];
      el.style.transformOrigin = 'left';
      run(el, [{ transform: `translateX(${(l0 - l1) * w}px) scaleX(${w0 / w1})` }, { transform: 'none' }], ease);
    }
  }
  const plinth = model?.querySelector('.ws-plinth'), old = modelBefore?.querySelector('.ws-plinth');
  if (plinth && old && old.className !== plinth.className) fadeOut(old.cloneNode(true), plinth.parentElement, 350);
}

/** A4 Overload: on crossing the line, the cracks draw and the figure shakes 3 times; then a slow ember loop. */
export function overload(model) {
  const cracks = model.querySelector('.ws-cracks'), fig = model.querySelector('.ws-fig');
  if (!cracks) return;
  for (const p of cracks.querySelectorAll('path')) {
    p.style.strokeDasharray = '1';
    run(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 500, easing: 'ease-out' });
  }
  run(fig, [0, -3, 3, -3, 3, -2, 0].map(x => ({ transform: `translateX(${x}px)` })), { duration: 500, easing: 'linear' });
  const glow = run(cracks, [{ opacity: 1 }, { opacity: 0.55 }, { opacity: 1 }], { duration: 1600, delay: 500, iterations: Infinity, easing: 'ease-in-out' });
  return glow;
}

/** A5 "When…" reveal: the ghost fades in with a gold ring, the zone or the partner lights, the hourglass wakes, chains break. */
export function reveal(model, before) {
  const ghost = model.querySelector('.ws-ghost');
  if (ghost && !before?.querySelector('.ws-ghost')) {
    run(ghost, [{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 0.25, transform: 'scale(1.15)' }], { duration: 500 });
    const ring = document.createElement('span');
    ring.className = 'mo-ring';
    model.append(ring);
    const a = run(ring, [{ opacity: 0.9, transform: 'translate(-50%, 50%) scale(0.5)' }, { opacity: 0, transform: 'translate(-50%, 50%) scale(1.5)' }], { duration: 500, easing: 'ease-out' });
    if (a) a.onfinish = a.oncancel = () => ring.remove(); else ring.remove();
  }
  model.querySelectorAll('.ws-zone rect[fill="#e9c071"], .ws-partner, .ws-floor-svg .h').forEach((e, i) => {
    e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center';
    run(e, [{ opacity: 0 }, { opacity: getComputedStyle(e).opacity }], { duration: 300, delay: Math.min(200, 20 * i) });
  });
  const glass = model.querySelector('.ws-hourglass');
  if (glass && !before?.querySelector('.ws-hourglass')) run(glass, [{ transform: 'rotate(180deg)', opacity: 0.4 }, { transform: 'rotate(0deg)', opacity: 1 }], { duration: 500 });
  const seals = model.querySelector('.ws-seals'), had = before?.querySelectorAll('.ws-seal-i').length ?? 0;
  if (seals && had > seals.children.length) {
    const lost = before.querySelector('.ws-seals').lastElementChild.cloneNode(true);
    lost.style.position = 'absolute';
    seals.style.position = 'relative';
    seals.append(lost);
    const a = run(lost, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px) rotate(25deg) scale(1.4)' }], { duration: 500 });
    if (a) a.onfinish = a.oncancel = () => lost.remove(); else lost.remove();
  }
}
