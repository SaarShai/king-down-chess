// Small UI helpers for the showcase demos: sheets, toasts, reduced motion, haptics and sounds.
// import { openSheet, closeSheet, toast, prefersReducedMotion, haptic, sfx } from '../../kit/ui.js';

// ---- reduced motion ---------------------------------------------------------------------------

const motionQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

/**
 * True when the system asks for less motion, or when the page sets <html data-motion="reduce">
 * (the frame's Reduced motion toggle does that). Read it at the moment you animate.
 */
export function prefersReducedMotion() {
  const set = document.documentElement.dataset.motion;
  if (set === 'reduce') return true;
  if (set === 'full') return false;
  return !!motionQuery?.matches;
}

/** Calls fn(reduced) now and whenever the system setting or <html data-motion> changes. Returns a stop function. */
export function onMotionChange(fn) {
  const run = () => fn(prefersReducedMotion());
  motionQuery?.addEventListener('change', run);
  const mo = new MutationObserver(run);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  run();
  return () => { motionQuery?.removeEventListener('change', run); mo.disconnect(); };
}

/** element.animate() that respects reduced motion: with reduced motion it jumps to the end and resolves. */
export function animate(el, keyframes, options) {
  if (prefersReducedMotion() || !el.animate) {
    const last = Array.isArray(keyframes) ? keyframes.at(-1) : null;
    if (last && options?.fill !== 'none') for (const [k, v] of Object.entries(last)) if (k !== 'offset' && k !== 'easing') el.style[k] = v;
    return Promise.resolve();
  }
  return el.animate(keyframes, options).finished.catch(() => {});
}

// ---- sheets -----------------------------------------------------------------------------------

const opener = new WeakMap();

/**
 * Open a <dialog class="sheet">: a bottom sheet on a phone, a side panel on a wide screen.
 * Focus goes into the sheet; Escape, the close button ([data-close]) and a tap on the dim area close it.
 * closeSheet gives the focus back to the control that opened it.
 */
export function openSheet(sheet) {
  const dlg = typeof sheet === 'string' ? document.getElementById(sheet) : sheet;
  if (!dlg || dlg.open) return dlg;
  opener.set(dlg, document.activeElement);
  dlg.classList.remove('is-closing');
  if (!dlg.dataset.kitWired) {
    dlg.dataset.kitWired = '1';
    dlg.addEventListener('cancel', e => { e.preventDefault(); closeSheet(dlg); });
    // The dim area closes the sheet only when the press also started there (not a click left over from
    // the tap that opened the sheet, and not a text selection that ends outside).
    let downOnBackdrop = false;
    dlg.addEventListener('pointerdown', e => { downOnBackdrop = e.target === dlg; });
    dlg.addEventListener('click', e => {
      if (e.target === dlg && downOnBackdrop) closeSheet(dlg); // the backdrop: the dialog box itself, outside its content
      downOnBackdrop = false;
      if (e.target.closest?.('[data-close]')) closeSheet(dlg);
    });
  }
  dlg.showModal();
  const first = dlg.querySelector('[autofocus]') ?? dlg.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  first?.focus({ preventScroll: true });
  return dlg;
}

/** Close a sheet with its exit animation, then return focus. Resolves when it is closed. */
export async function closeSheet(sheet) {
  const dlg = typeof sheet === 'string' ? document.getElementById(sheet) : sheet;
  if (!dlg?.open) return;
  if (!prefersReducedMotion()) {
    dlg.classList.add('is-closing');
    await new Promise(r => {
      const done = () => { clearTimeout(t); r(); };
      const t = setTimeout(done, 400);
      dlg.addEventListener('animationend', done, { once: true });
    });
  }
  dlg.classList.remove('is-closing');
  dlg.close();
  const back = opener.get(dlg);
  if (back && document.contains(back)) back.focus({ preventScroll: true });
}

// ---- toast ------------------------------------------------------------------------------------

let toastBox = null, toastTimer = 0;

/** A short message at the bottom of the screen, read by screen readers. One at a time. */
export function toast(text, { ms = 2600 } = {}) {
  if (!toastBox) {
    toastBox = document.createElement('div');
    toastBox.className = 'toast';
    toastBox.setAttribute('role', 'status');
    toastBox.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastBox);
  }
  toastBox.textContent = text;
  toastBox.classList.remove('is-shown');
  void toastBox.offsetWidth; // restart the entrance
  toastBox.classList.add('is-shown');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastBox.classList.remove('is-shown'), ms);
}

/** Hide the toast now (for example at the start of a demo state). */
export function hideToast() {
  clearTimeout(toastTimer);
  toastBox?.classList.remove('is-shown');
}

// ---- haptics ----------------------------------------------------------------------------------

/** A short vibration where the device has one (most phones; not iOS Safari). Set haptic.enabled = false to stop all. */
export function haptic(pattern = 10) {
  if (!haptic.enabled) return;
  try { navigator.vibrate?.(pattern); } catch { /* not allowed here */ }
}
haptic.enabled = true;

// ---- sounds -----------------------------------------------------------------------------------

/**
 * Tiny sounds made in code with WebAudio (no files). Silent until the first tap or key press
 * (browsers allow sound only after a user gesture), and silent while sfx.muted is true.
 * sfx.tap(), sfx.move(), sfx.capture(), sfx.check(), sfx.power(), sfx.win(); sfx.setMuted(bool).
 */
const MUTE_KEY = 'kd-showcase-muted';
let ctx = null, unlocked = false, master = null;
function readMuted() { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } }

function unlock() {
  if (unlocked) return;
  unlocked = true;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  } catch { ctx = null; }
}
if (typeof window !== 'undefined') {
  for (const type of ['pointerdown', 'keydown']) window.addEventListener(type, unlock, { capture: true, once: true });
}

function tone({ type = 'sine', from, to = from, at = 0, dur = 0.12, gain = 0.3, attack = 0.005 }) {
  const t0 = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, t0);
  if (to !== from) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function noise({ at = 0, dur = 0.06, gain = 0.25, freq = 1800, q = 1 }) {
  const t0 = ctx.currentTime + at, n = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = gain;
  src.connect(f).connect(g).connect(master);
  src.start(t0);
}

const SOUNDS = {
  tap: () => noise({ dur: 0.03, gain: 0.12, freq: 2600, q: 2 }),
  // A stone figure set down: a soft knock and a low thump.
  move: () => { noise({ dur: 0.05, gain: 0.35, freq: 900, q: 1.4 }); tone({ from: 180, to: 120, dur: 0.09, gain: 0.18 }); },
  capture: () => { noise({ dur: 0.08, gain: 0.45, freq: 600, q: 1 }); tone({ from: 140, to: 70, dur: 0.16, gain: 0.3 }); noise({ at: 0.06, dur: 0.05, gain: 0.15, freq: 3000, q: 3 }); },
  check: () => { tone({ type: 'triangle', from: 880, dur: 0.18, gain: 0.16 }); tone({ type: 'triangle', from: 660, at: 0.12, dur: 0.24, gain: 0.14 }); },
  power: () => { tone({ from: 520, to: 1040, dur: 0.32, gain: 0.12, attack: 0.04 }); tone({ type: 'triangle', from: 1560, at: 0.08, dur: 0.3, gain: 0.05, attack: 0.05 }); },
  win: () => { [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', from: f, at: i * 0.11, dur: 0.32, gain: 0.14 })); },
};

export const sfx = {
  muted: readMuted(),
  /** True once sound can play (after the first user gesture). */
  get ready() { return !!ctx; },
  setMuted(on) {
    this.muted = !!on;
    try { localStorage.setItem(MUTE_KEY, on ? '1' : '0'); } catch { /* private mode */ }
    document.dispatchEvent(new CustomEvent('kd-mute', { detail: { muted: this.muted } }));
  },
  toggle() { this.setMuted(!this.muted); return this.muted; },
  play(name) {
    if (this.muted || !ctx || !SOUNDS[name]) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    try { SOUNDS[name](); } catch { /* audio is a nicety */ }
  },
};
for (const name of Object.keys(SOUNDS)) sfx[name] = () => sfx.play(name);

// ---- small DOM helpers ------------------------------------------------------------------------

/** document.querySelector / querySelectorAll in one short call. */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Wait ms milliseconds (0 with reduced motion when instant is true). */
export const wait = (ms, { instant = false } = {}) => new Promise(r => setTimeout(r, instant && prefersReducedMotion() ? 0 : ms));
