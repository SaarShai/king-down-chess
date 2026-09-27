// Motion toolkit for the trailer: timing curves, keyframes, springs, speed ramps, noise, a camera rig,
// physics particles, optics (bloom, aberration, flares) and kinetic type (the character-name reveals).
// Everything is a pure function of time, so any frame — including motion-blur sub-frames — renders exactly.
import { W, H, clamp, lerp, rand, canvas } from './runtime.mjs';

// ---------------------------------------------------------------- timing
/** CSS-style cubic-bezier easing (Newton steps with a bisection fallback). */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s, dX = s => (3 * ax * s + 2 * bx) * s + cx;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let s = x;
    for (let i = 0; i < 8; i++) { const e = X(s) - x, d = dX(s); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; s -= e / d; }
    if (Math.abs(X(s) - x) > 1e-4) { let lo = 0, hi = 1; s = x; for (let i = 0; i < 40; i++) { if (X(s) < x) lo = s; else hi = s; s = (lo + hi) / 2; } }
    return Y(s);
  };
}
/** The house curves. `out` is the default: a fast start and a long, soft settle. */
export const ease = {
  linear: k => clamp(k, 0, 1),
  out: bezier(0.16, 1, 0.3, 1),
  in: bezier(0.7, 0, 0.84, 0),
  inOut: bezier(0.87, 0, 0.13, 1),
  smooth: bezier(0.45, 0, 0.55, 1),
  snap: bezier(0.2, 1.5, 0.35, 1),
  /** Pulls back before it goes: the wind-up of a throw. */
  anticipate: k => { k = clamp(k, 0, 1); const a = 0.24; return k < a ? -0.09 * Math.sin(Math.PI * k / a) : ease.out((k - a) / (1 - a)); },
};
/** Keyframes: keys(t, [[t0, v0], [t1, v1, ease], …]); a key's ease shapes the segment arriving at it. Values: numbers or arrays. */
export function keys(t, list) {
  if (t <= list[0][0]) return list[0][1];
  for (let i = 1; i < list.length; i++) {
    const [t1, v1, e = ease.smooth] = list[i], [t0, v0] = list[i - 1];
    if (t <= t1) {
      const k = e((t - t0) / Math.max(1e-9, t1 - t0));
      return Array.isArray(v0) ? v0.map((a, j) => lerp(a, v1[j], k)) : lerp(v0, v1, k);
    }
  }
  return list[list.length - 1][1];
}
/** Damped spring from 0 to 1, t seconds after release: freq in Hz, zeta < 1 overshoots. */
export function spring(t, { freq = 2.4, zeta = 0.42 } = {}) {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freq;
  if (zeta < 1) { const wd = w * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + (zeta * w / wd) * Math.sin(wd * t)); }
  return 1 - Math.exp(-w * t) * (1 + w * t);
}
/** A decaying ring, 0 at the hit: amplitude × e^(−decay·t) × sin(2πft). For wobbles and recoils. */
export const ring = (t, { freq = 7, decay = 9 } = {}) => (t <= 0 ? 0 : Math.exp(-decay * t) * Math.sin(2 * Math.PI * freq * t));
/**
 * Speed ramp: maps shot time to scene time through [[shotT, sceneT], …] with a monotone cubic,
 * so slow motion can melt into real time (and back) without time ever running backwards.
 */
export function remap(points) {
  const n = points.length, xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const d = xs.slice(1).map((x, i) => (ys[i + 1] - ys[i]) / (x - xs[i]));
  const m = xs.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return t => {
    if (t <= xs[0]) return ys[0] + (t - xs[0]) * m[0];
    if (t >= xs[n - 1]) return ys[n - 1] + (t - xs[n - 1]) * m[n - 1];
    let i = 0; while (t > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], u = (t - xs[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
  };
}
/** Smooth 1D gradient noise in about [−1, 1], seeded. */
export function noise(seed = 1) {
  const r = rand(seed), g = Array.from({ length: 256 }, () => r() * 2 - 1);
  return x => { const i = Math.floor(x), f = x - i, u = f * f * f * (f * (f * 6 - 15) + 10); return 2 * lerp(g[i & 255] * f, g[(i + 1) & 255] * (f - 1), u); };
}

// ---------------------------------------------------------------- camera
/**
 * A virtual camera. `path(t)` → {x, y, zoom, rot} (the look-at point in world pixels); handheld sway from noise;
 * `shakes` are impacts [{at, amount}] turned into trauma (amount decays, shake ∝ trauma²).
 * Use: const cam = camera({...}); cam.apply(g, t, depth) inside save/restore; depth > 1 moves less (parallax).
 */
export function camera({ path = () => ({ x: W / 2, y: H / 2, zoom: 1, rot: 0 }), handheld = 0.6, shakes = [], shake = 26, seed = 7 } = {}) {
  const nx = noise(seed), ny = noise(seed + 1), nr = noise(seed + 2);
  const trauma = t => clamp(shakes.reduce((s, k) => s + (t >= k.at ? k.amount * Math.exp(-(t - k.at) * (k.decay ?? 5.5)) : 0), 0), 0, 1);
  const state = t => {
    const p = { x: W / 2, y: H / 2, zoom: 1, rot: 0, ...path(t) }, tr = trauma(t) ** 2, f = 1.3 * handheld;
    return {
      x: p.x + nx(t * 0.35) * 9 * handheld + nx(t * 18 + 50) * shake * tr,
      y: p.y + ny(t * 0.3) * 6 * handheld + ny(t * 18 + 90) * shake * tr,
      zoom: p.zoom, rot: p.rot + nr(t * 0.25) * 0.004 * f + nr(t * 16) * 0.025 * tr,
    };
  };
  return {
    state, trauma,
    apply(g, t, depth = 1) {
      const s = state(t), z = 1 + (s.zoom - 1) / depth;
      g.translate(W / 2, H / 2); g.rotate(s.rot / depth); g.scale(z, z);
      g.translate(-(W / 2 + (s.x - W / 2) / depth), -(H / 2 + (s.y - H / 2) / depth));
    },
  };
}

// ---------------------------------------------------------------- particles (analytic, deterministic)
const expK = (k, t) => (1 - Math.exp(-k * t)) / k;
/** Position of a particle launched at v with linear drag k and gravity g, after t seconds. */
export function ballistic(x, y, vx, vy, t, k = 3, g = 900) {
  const e = expK(k, t);
  return { x: x + vx * e, y: y + (vy - g / k) * e + (g / k) * t };
}
/** Sparks: streaks drawn from where each spark was a moment ago to where it is — motion blur for free. */
export function sparks(g, t, { x, y, n = 36, seed = 1, speed = [380, 1100], dir = 0, spread = Math.PI * 2, gravity = 1100, drag = 3.4, life = [0.2, 0.55], width = [1.2, 3.2], color = '255,214,150', blur = 0.028 } = {}) {
  if (t <= 0) return;
  const r = rand(seed);
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = dir + (r() - 0.5) * spread, v = lerp(speed[0], speed[1], r() ** 0.7), L = lerp(life[0], life[1], r()), w = lerp(width[0], width[1], r());
    if (t > L) continue;
    const vx = Math.cos(a) * v, vy = Math.sin(a) * v, p = ballistic(x, y, vx, vy, t, drag, gravity), q = ballistic(x, y, vx, vy, Math.max(0, t - blur), drag, gravity);
    const k = 1 - t / L;
    g.strokeStyle = `rgba(255,255,240,${k})`; g.lineWidth = w * 0.6; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(p.x, p.y); g.stroke();
    g.strokeStyle = `rgba(${color},${0.55 * k})`; g.lineWidth = w * 2.4; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(p.x, p.y); g.stroke();
  }
  g.restore();
}
/** Dust: soft puffs that burst out, slow down, rise a little and thin away. */
export function dust(g, t, { x, y, n = 14, seed = 3, speed = [120, 420], dir = -Math.PI / 2, spread = Math.PI, size = [18, 60], life = [0.6, 1.3], color = '205,180,140', floor = null } = {}) {
  if (t <= 0) return;
  const r = rand(seed);
  g.save();
  for (let i = 0; i < n; i++) {
    const a = dir + (r() - 0.5) * spread, v = lerp(speed[0], speed[1], r()), L = lerp(life[0], life[1], r()), s0 = lerp(size[0], size[1], r());
    if (t > L) continue;
    const p = ballistic(x, y, Math.cos(a) * v, Math.sin(a) * v, t, 4.5, -60), k = t / L, rad = s0 * (0.45 + 1.4 * Math.sqrt(k));
    const py = floor != null ? Math.min(p.y, floor) : p.y;
    const gr = g.createRadialGradient(p.x, py, 0, p.x, py, rad);
    gr.addColorStop(0, `rgba(${color},${0.26 * (1 - k) ** 1.4})`); gr.addColorStop(0.6, `rgba(${color},${0.1 * (1 - k) ** 1.4})`); gr.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(p.x, py, rad, 0, 6.283); g.fill();
  }
  g.restore();
}
/** Embers: rising, swaying, flickering motes (buoyancy + noise). */
export function embers(g, t, { area = [0, 0, W, H], n = 80, seed = 5, rise = 40, sway = 26, size = [0.8, 2.6], color = '255,170,80', bokeh = 8 } = {}) {
  const r = rand(seed), nz = noise(seed);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x0 = area[0] + r() * area[2], y0 = r() * area[3], s = lerp(size[0], size[1], r()), sp = lerp(0.5, 1.4, r()), ph = r() * 100;
    const y = area[1] + ((((y0 - t * rise * sp) % area[3]) + area[3]) % area[3]), x = x0 + nz(ph + t * 0.6) * sway;
    const big = i < bokeh, rad = big ? s * 10 : s * 2.4, a = (0.45 + 0.55 * r()) * (0.55 + 0.45 * Math.sin(t * (4 + 5 * r()) + ph)) * (big ? 0.14 : 1);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${color},${a})`); gr.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 6.283); g.fill();
  }
  g.restore();
}
/** Shockwave: a bright expanding ellipse (for ground hits), with a dust ring riding just behind. */
export function shockwave(g, t, { x, y, radius = 420, dur = 0.55, squash = 0.32, color = '255,236,200', width = 10 } = {}) {
  if (t <= 0 || t > dur) return;
  const k = t / dur, e = ease.out(k), r = radius * e;
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = `rgba(${color},${0.8 * (1 - k)})`; g.lineWidth = width * (1 - k) + 1;
  g.beginPath(); g.ellipse(x, y, r, r * squash, 0, 0, 6.283); g.stroke();
  g.strokeStyle = `rgba(${color},${0.2 * (1 - k)})`; g.lineWidth = width * 4 * (1 - k);
  g.beginPath(); g.ellipse(x, y, r * 0.92, r * 0.92 * squash, 0, 0, 6.283); g.stroke();
  g.restore();
}

// ---------------------------------------------------------------- optics and finishing
let scratchA = null, scratchB = null, tintA = null, glowA = null;
const scratch = () => { scratchA ??= canvas(W, H); scratchB ??= canvas(W / 4, H / 4); return [scratchA, scratchB]; };
/** Bloom: blurred highlights added back with screen. threshold 0..1 (higher = only the brightest glow). */
export function bloom(g, { strength = 0.55, threshold = 0.62, radius = 6 } = {}) {
  const [, small] = scratch(), s = small.getContext('2d');
  s.save(); s.clearRect(0, 0, W / 4, H / 4);
  s.filter = `brightness(${1 / threshold}) contrast(${2 + 3 * threshold}) saturate(1.25) blur(${radius}px)`;
  s.drawImage(g.canvas, 0, 0, W / 4, H / 4); s.restore();
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'screen'; g.globalAlpha = strength;
  g.imageSmoothingQuality = 'high'; g.drawImage(small, 0, 0, W, H); g.restore();
}
/** Chromatic aberration: red and blue split sideways by `px` (use on impacts, 2–10 px, decaying fast). */
export function aberration(g, px) {
  if (px < 0.4) return;
  const [full] = scratch(), f = full.getContext('2d');
  f.save(); f.setTransform(1, 0, 0, 1, 0, 0); f.globalCompositeOperation = 'copy'; f.drawImage(g.canvas, 0, 0); f.restore();
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = '#00ff00'; g.fillRect(0, 0, W, H);  // keep green in place
  g.globalCompositeOperation = 'lighter';
  tintA ??= canvas(W, H);
  const t = tintA.getContext('2d');
  for (const [dx, tint] of [[-px, '#ff0000'], [px, '#0000ff']]) {
    t.globalCompositeOperation = 'copy'; t.drawImage(full, 0, 0);  // unshifted underlay keeps the edge strip opaque
    t.globalCompositeOperation = 'source-over'; t.drawImage(full, dx, 0);
    t.globalCompositeOperation = 'multiply'; t.fillStyle = tint; t.fillRect(0, 0, W, H);
    g.drawImage(tintA, 0, 0);
  }
  g.restore();
}
/** Anamorphic flare: a long horizontal streak and a soft core at a bright point. */
export function flare(g, x, y, k = 1, { color = '255,210,150', length = 900 } = {}) {
  if (k <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  const s = g.createLinearGradient(x - length, 0, x + length, 0);
  s.addColorStop(0, `rgba(${color},0)`); s.addColorStop(0.5, `rgba(${color},${0.55 * k})`); s.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = s; g.fillRect(x - length, y - 2.5 * k, 2 * length, 5 * k);
  const c = g.createRadialGradient(x, y, 0, x, y, 90 * k); c.addColorStop(0, `rgba(255,252,240,${0.9 * k})`); c.addColorStop(0.3, `rgba(${color},${0.35 * k})`); c.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = c; g.beginPath(); g.arc(x, y, 90 * k, 0, 6.283); g.fill();
  g.restore();
}
/** Full-frame flash (impact frames, cuts). */
export function flash(g, k, color = '255,250,240') {
  if (k <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(${color},${clamp(k, 0, 1)})`; g.fillRect(0, 0, W, H); g.restore();
}
/** Grade: soft-light wash (warm highlights, cool shadows by default). */
export function grade(g, { warm = '255,170,90', cool = '40,70,120', amount = 0.5, cx = W / 2, cy = H / 2 } = {}) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = amount;
  const r = g.createRadialGradient(cx, cy, 60, cx, cy, W * 0.62); r.addColorStop(0, `rgb(${warm})`); r.addColorStop(1, `rgb(${cool})`);
  g.fillStyle = r; g.fillRect(0, 0, W, H); g.restore();
}
/** Desaturate and darken what is already drawn (for freeze frames: drain the world, then draw the hero). */
export function drain(g, k, { dim = 0.45 } = {}) {
  if (k <= 0) return;
  const [full] = scratch(), f = full.getContext('2d');
  f.save(); f.setTransform(1, 0, 0, 1, 0, 0); f.globalCompositeOperation = 'copy'; f.drawImage(g.canvas, 0, 0); f.restore();
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = `saturate(${1 - k}) brightness(${1 - dim * k}) contrast(${1 + 0.15 * k})`;
  g.globalCompositeOperation = 'copy'; g.drawImage(full, 0, 0); g.restore();
}
/** Radial speed lines around a focus (anime-style impact frame), alpha 0..1. */
export function speedLines(g, x, y, k, { n = 90, seed = 4, inner = 260, color = '255,240,220' } = {}) {
  if (k <= 0) return;
  const r = rand(seed);
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = r() * 6.283, r0 = inner * (0.8 + r() * 0.8), r1 = r0 + 300 + r() * 900, w = 1 + r() * 3;
    g.strokeStyle = `rgba(${color},${k * (0.08 + r() * 0.22)})`; g.lineWidth = w;
    g.beginPath(); g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); g.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); g.stroke();
  }
  g.restore();
}

// ---------------------------------------------------------------- figures
/** A painted figure with a rim light behind it (build once per figure). */
export function rimmed(img, sx, sy, sw, sh, { color = '#ffb14f', blur = 22, pad = 100 } = {}) {
  const fig = canvas(sw, sh); fig.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  const glow = canvas(sw + 2 * pad, sh + 2 * pad), gg = glow.getContext('2d');
  gg.filter = `blur(${blur}px)`; gg.drawImage(fig, pad, pad); gg.filter = 'none';
  gg.globalCompositeOperation = 'source-in'; gg.fillStyle = color; gg.fillRect(0, 0, glow.width, glow.height);
  return { fig, glow, pad, w: sw, h: sh };
}
/** Draw a rimmed figure with its feet at (x, y), height h; breathing and a motion smear along vx (px/s). */
export function drawFigure(g, f, x, y, h, { t = 0, rim = 0.9, breathe = 0.006, vx = 0, flip = false } = {}) {
  const s = h / f.h, w = f.w * s, b = 1 + breathe * Math.sin(t * 2.2);
  g.save(); g.translate(x, y); if (flip) g.scale(-1, 1); g.scale(1, b);
  if (Math.abs(vx) > 60) for (let i = 4; i > 0; i--) { g.globalAlpha = 0.08 * Math.min(1, Math.abs(vx) / 1500); g.drawImage(f.fig, -w / 2 - Math.sign(vx) * i * Math.min(90, Math.abs(vx) * 0.03), -h, w, h); }
  g.globalAlpha = rim; g.globalCompositeOperation = 'lighter';
  g.drawImage(f.glow, -w / 2 - f.pad * s + 10, -h - f.pad * s - 8, (f.w + 2 * f.pad) * s, (f.h + 2 * f.pad) * s);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.drawImage(f.fig, -w / 2, -h, w, h);
  g.restore();
}

// ---------------------------------------------------------------- kinetic type: the character names
const GOLD = [[0, '#fffaf0'], [0.34, '#f8d27e'], [0.5, '#c17b24'], [0.53, '#8a4d12'], [0.7, '#e6ad55'], [1, '#6b3a0b']];
/** Gilded glyph: dark bevel, banded metallic fill with a horizon line, top highlight, faint brushing. */
function glyph(ch, px) {
  const font = `900 ${px}px Cinzel`, m = canvas(8, 8).getContext('2d'); m.font = font;
  const adv = m.measureText(ch).width, pad = Math.ceil(px * 0.18), w = Math.ceil(adv + 2 * pad), h = Math.ceil(px * 1.35);
  const c = canvas(w, h), g = c.getContext('2d'), base = Math.round(h * 0.78);
  g.font = font; g.textBaseline = 'alphabetic';
  g.lineJoin = 'round'; g.strokeStyle = '#2b1707'; g.lineWidth = px * 0.075; g.strokeText(ch, pad, base);
  const gr = g.createLinearGradient(0, base - px * 0.72, 0, base + px * 0.02);
  GOLD.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillText(ch, pad, base);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, base - px * 0.73, w, px * 0.05);
  const r = rand(ch.charCodeAt(0));
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '60,30,5'},${0.05 + r() * 0.06})`; g.fillRect(r() * w, r() * h, 1 + r() * px * 0.6, 1); }
  // A cool steel version for the Guard, and the letter outline for the Maester's blueprint.
  return { ch, c, w, h, adv, pad, base };
}
/** Lay out a name once: glyphs, letter centres (relative to the word centre), width. */
export function title(text, { px = 168, tracking = 0.16 } = {}) {
  const glyphs = [...text].map(ch => (ch === ' ' ? null : glyph(ch, px)));
  const m = canvas(8, 8).getContext('2d'); m.font = `900 ${px}px Cinzel`;
  const advs = [...text].map(ch => m.measureText(ch).width + px * tracking);
  const width = advs.reduce((a, b) => a + b, 0) - px * tracking;
  let x = -width / 2;
  const letters = [...text].map((ch, i) => { const L = glyphs[i] && { ...glyphs[i], cx: x + (advs[i] - px * tracking) / 2, i }; x += advs[i]; return L; }).filter(Boolean);
  return { text, px, width, letters, word: canvas(Math.ceil(width + px * 3), Math.ceil(px * 3.2)) };
}
/** Times (seconds after the reveal starts) at which a style lands its hits — for camera shakes and sound cues. */
export function titleHits(T, style) {
  const n = T.letters.length;
  return { arrow: T.letters.map((_, i) => 0.1 + 0.3 * (i + 0.5) / n), bite: T.letters.map((_, i) => 0.16 + i * 0.075), scan: [0.08, 0.62], shove: [0.3], stand: [0.34, 0.86], slam: [0.3] }[style] ?? [];
}
const TINTS = { arrow: '255,176,90', bite: '255,90,60', scan: '90,235,225', shove: '232,176,96', stand: '170,215,255', slam: '255,200,120' };

/**
 * Draw a name reveal at local time t (seconds since the reveal starts), centred at (x, y) — y is the baseline.
 * Styles, each motivated by its piece: arrow (written by a passing light), bite (letters chomped shut),
 * scan (measured as a blueprint, then gilded), shove (rammed in as a block), stand (wind breaks on it), slam.
 * All end in the same settled gilded name with its ornamental rule.
 */
export function drawTitle(g, T, t, style, x, y, { rule = true } = {}) {
  if (t < 0) return;
  const { px, width, letters, word } = T, wc = word.getContext('2d'), ox = word.width / 2, oy = word.height * 0.62;
  wc.setTransform(1, 0, 0, 1, 0, 0); wc.clearRect(0, 0, word.width, word.height);
  const under = [], over = [];  // effects drawn in screen space below / above the word
  const put = (L, { dx = 0, dy = 0, sx = 1, sy = 1, rot = 0, alpha = 1, hot = 0, clip = null, filter = null } = {}) => {
    if (alpha <= 0) return;
    const gx = ox + L.cx + dx, gy = oy + dy;
    wc.save(); wc.globalAlpha = clamp(alpha, 0, 1); wc.translate(gx, gy); wc.rotate(rot); wc.scale(sx, sy);
    if (clip) { wc.beginPath(); clip(wc, L); wc.clip(); }
    if (filter) wc.filter = filter;
    wc.drawImage(L.c, -L.w / 2, -L.base);
    if (hot > 0) {  // white-hot: tint towards white, only where the letter is
      wc.globalCompositeOperation = 'source-atop'; wc.fillStyle = `rgba(255,251,236,${clamp(hot, 0, 1)})`; wc.fillRect(-L.w / 2, -L.base, L.w, L.h);
    }
    wc.restore();
  };
  const n = letters.length, left = x - width / 2, right = x + width / 2;
  let ruleAt = 0.5, sheen = -1, shiftX = 0, ghosts = [];

  if (style === 'arrow') {
    // A bolt of light crosses the line; each letter ignites as the tip passes, white-hot, then cools to gold.
    const tip = keys(t, [[0, left - 520], [0.42, right + 300, ease.linear]]);
    letters.forEach(L => {
      const at = 0.42 * (x + L.cx - (left - 520)) / (right + 300 - (left - 520)), k = t - at;
      if (k < 0) return;
      const s = 1 + 0.2 * (1 - spring(k, { freq: 3.2, zeta: 0.5 }));
      put(L, { sx: s, sy: s, alpha: k / 0.05, hot: 1 - ease.out(k / 0.5) });
      over.push(() => sparks(g, k, { x: x + L.cx, y: y - px * 0.36, n: 7, seed: 11 + L.i, speed: [160, 520], dir: -Math.PI / 2, spread: 2.2, gravity: 700, life: [0.18, 0.4] }));
    });
    const fade = 1 - clamp((t - 0.42) / 0.35, 0, 1);
    if (fade > 0) over.push(() => {
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      const from = Math.max(left - 520, tip - 900), ly = y - px * 0.36, tail = g.createLinearGradient(from, 0, tip, 0);
      tail.addColorStop(0, 'rgba(255,200,130,0)'); tail.addColorStop(0.8, `rgba(255,226,180,${0.5 * fade})`); tail.addColorStop(1, `rgba(255,255,250,${fade})`);
      g.strokeStyle = tail;
      for (const [w, a] of [[34, 0.12], [12, 0.35], [3.5, 1]]) { g.globalAlpha = a; g.lineWidth = w; g.beginPath(); g.moveTo(from, ly); g.lineTo(tip, ly); g.stroke(); }
      g.restore();
      if (t < 0.46) flare(g, tip, ly, 1, { color: '255,210,150', length: 700 });
    });
    ruleAt = 0.5; sheen = 1.05;
  } else if (style === 'bite') {
    // Every letter is a pair of jaws: top and bottom halves with a toothed seam snap shut in a chain.
    const seam = (c, L, top) => {  // a zigzag of teeth across the letter's middle
      const sy = -L.base + L.h * 0.52, a = px * 0.07, w = L.w;
      c.moveTo(-w / 2, top ? -L.base : L.h - L.base);
      c.lineTo(-w / 2, sy);
      for (let xx = -w / 2, i = 0; xx < w / 2; xx += px * 0.13, i++) c.lineTo(xx + px * 0.065, sy + (i % 2 ? -a : a));
      c.lineTo(w / 2, sy); c.lineTo(w / 2, top ? -L.base : L.h - L.base); c.closePath();
    };
    letters.forEach(L => {
      const hit = 0.16 + L.i * 0.075, k = t - hit, gap = k < 0 ? px * 0.62 * (1 - ease.in(clamp((t - hit + 0.16) / 0.16, 0, 1))) : -px * 0.05 * ring(k, { freq: 9, decay: 14 });
      const alpha = clamp((t - hit + 0.22) / 0.08, 0, 1), hot = k >= 0 ? 0.75 * (1 - clamp(k / 0.12, 0, 1)) : 0;
      put(L, { dy: -gap, alpha, hot, clip: (c, l) => seam(c, l, true) });
      put(L, { dy: gap, alpha, hot, clip: (c, l) => seam(c, l, false) });
      if (k >= 0) over.push(() => sparks(g, k, { x: x + L.cx, y: y - px * 0.3, n: 10, seed: 40 + L.i, speed: [300, 900], dir: 0, spread: 0.5, gravity: 500, life: [0.12, 0.3], color: '255,150,110' }),
        () => sparks(g, k, { x: x + L.cx, y: y - px * 0.3, n: 10, seed: 60 + L.i, speed: [300, 900], dir: Math.PI, spread: 0.5, gravity: 500, life: [0.12, 0.3], color: '255,150,110' }));
    });
    ruleAt = 0.62; sheen = 1.1;
  } else if (style === 'scan') {
    // The Maester measures the name: a scan line draws it as a blueprint, then gold floods it left to right.
    const top = y - px * 0.95, bottom = y + px * 0.42, scanY = keys(t, [[0.05, top], [0.6, bottom, ease.smooth]]), fillX = keys(t, [[0.6, left - 40], [1.05, right + 40, ease.inOut]]);
    const wire = 1 - clamp((t - 0.95) / 0.35, 0, 1);
    letters.forEach(L => {
      const gx = x + L.cx;
      if (wire > 0) under.push(() => {
        g.save(); g.beginPath(); g.rect(0, 0, W, scanY); g.clip();
        g.font = `900 ${px}px Cinzel`; g.textAlign = 'center'; g.lineWidth = 1.6; g.strokeStyle = `rgba(120,245,235,${0.95 * wire})`;
        g.shadowColor = 'rgba(90,235,225,.9)'; g.shadowBlur = 12; g.strokeText(L.ch, gx, y); g.restore();
      });
      const fillK = clamp((fillX - (gx - L.w / 2)) / L.w, 0, 1);
      if (fillK > 0) put(L, { clip: (c, l) => c.rect(-l.w / 2, -l.base, l.w * fillK, l.h), hot: 0.35 * (1 - clamp((t - 0.7) / 0.5, 0, 1)) });
    });
    const guides = clamp(t / 0.15, 0, 1) * (1 - clamp((t - 1.0) / 0.4, 0, 1));
    under.push(() => {
      g.save(); g.strokeStyle = `rgba(110,235,225,${0.45 * guides})`; g.lineWidth = 1; g.setLineDash([6, 6]);
      for (const gy of [y - px * 0.7, y]) { g.beginPath(); g.moveTo(left - 60, gy); g.lineTo(right + 60, gy); g.stroke(); }
      g.setLineDash([]); g.lineWidth = 1.4;
      letters.forEach(L => { const a = x + L.cx - L.adv / 2, b = x + L.cx + L.adv / 2; for (const v of [a, b]) { g.beginPath(); g.moveTo(v, y + 14); g.lineTo(v, y + 30); g.stroke(); } });
      g.restore();
    });
    if (t < 0.64) over.push(() => {  // the scan line itself
      g.save(); g.globalCompositeOperation = 'lighter';
      const s = g.createLinearGradient(0, scanY - 40, 0, scanY + 3); s.addColorStop(0, 'rgba(90,235,225,0)'); s.addColorStop(1, 'rgba(90,235,225,.35)');
      g.fillStyle = s; g.fillRect(left - 90, scanY - 40, width + 180, 43);
      g.fillStyle = 'rgba(220,255,252,.95)'; g.fillRect(left - 90, scanY - 1.5, width + 180, 3); g.restore();
    });
    if (t > 0.58 && t < 1.12) over.push(() => flare(g, fillX, y - px * 0.36, 0.8 * (1 - clamp((t - 0.95) / 0.17, 0, 1)), { color: '255,215,150', length: 420 }));
    ruleAt = 0.9; sheen = -1;
  } else if (style === 'shove') {
    // Rammed in as one heavy block: accelerating smear, a hard stop, then a compression wave through the letters.
    const hit = 0.3, travel = t < hit ? -W * 0.62 * (1 - ease.in(t / hit)) : 0, speed = t < hit ? W * 0.62 * (ease.in(Math.min(1, t / hit + 0.02)) - ease.in(t / hit)) / 0.02 : 0;
    shiftX = travel;
    if (t < hit) ghosts = [1, 2, 3, 4, 5].map(j => ({ dx: travel - j * Math.min(80, speed * 0.012), alpha: 0.13 * (1 - j / 6), sx: 1 + Math.min(0.25, speed * 0.00006) }));
    letters.forEach(L => {
      const k = t - (hit + (n - 1 - L.i) * 0.03), sq = k > 0 ? 0.3 * (1 - spring(k, { freq: 3.4, zeta: 0.32 })) : 0;
      put(L, { sx: 1 - Math.max(-0.08, sq), sy: 1 + 0.55 * Math.max(0, sq) });
    });
    if (t >= hit) under.push(() => dust(g, t - hit, { x: right + 20, y: y - px * 0.15, n: 30, seed: 23, speed: [120, 560], dir: 0.1, spread: 2.6, size: [12, 46], life: [0.6, 1.3], color: '150,118,82' }));
    if (t >= hit) over.push(() => sparks(g, t - hit, { x: right + 10, y: y - px * 0.4, n: 18, seed: 29, speed: [300, 800], dir: -0.3, spread: 1.6, gravity: 1200, life: [0.2, 0.45], color: '255,210,140' }));
    ruleAt = 0.62; sheen = 1.0;
  } else if (style === 'stand') {
    // Already there, dark steel. The storm tears past and bends around the letters; they do not move.
    // Then a cold light runs across them and the steel turns to gold.
    const gild = keys(t, [[0.78, left - 60], [1.25, right + 60, ease.inOut]]);
    letters.forEach(L => {
      const tremble = t > 0.34 ? 1.4 * ring(t - 0.34, { freq: 22, decay: 10 }) : 0, gx = x + L.cx, k = clamp((gild - (gx - L.w / 2)) / L.w, 0, 1);
      put(L, { dx: tremble, alpha: clamp(t / 0.12, 0, 1), filter: 'grayscale(1) sepia(.4) hue-rotate(172deg) saturate(1.7) brightness(.55) contrast(1.35)' });
      if (k > 0) put(L, { dx: tremble, clip: (c, l) => c.rect(-l.w / 2, -l.base, l.w * k, l.h), hot: 0.4 * (1 - clamp((t - 1.05) / 0.4, 0, 1)) });
    });
    const r = rand(77), gusts = 70, cy = y - px * 0.36, halfH = px * 0.62;
    over.push(() => {
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      for (let i = 0; i < gusts; i++) {
        const lane = (r() - 0.5) * 2.4, y0 = cy + lane * halfH, spd = 2600 + r() * 1800, delay = r() * 0.55, len = 160 + r() * 380, w = 1 + r() * 2.2;
        const head = left - 700 + (t - delay) * spd; if (head < left - 700 || head - len > right + 700) continue;
        const bend = xx => { const u = clamp((xx - (left - 180)) / (width + 360), 0, 1), push = Math.sin(Math.PI * u) ** 1.5; return y0 + Math.sign(lane || 0.01) * push * Math.max(0, halfH * 1.25 - Math.abs(y0 - cy)) * 1.1; };
        g.strokeStyle = `rgba(200,225,255,${0.22 + 0.3 * r()})`; g.lineWidth = w; g.beginPath();
        for (let s = 0; s <= 12; s++) { const xx = head - len * (1 - s / 12); s ? g.lineTo(xx, bend(xx)) : g.moveTo(xx, bend(xx)); }
        g.stroke();
      }
      g.restore();
    });
    const hex = clamp(1 - Math.abs(t - 0.4) / 0.25, 0, 1);  // a barrier shimmer where the storm strikes
    if (hex > 0) under.push(() => {
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(150,205,255,${0.35 * hex})`; g.lineWidth = 1.2;
      const R = 34, h = R * Math.sqrt(3);
      for (let row = -3; row <= 3; row++) for (let col = -14; col <= 14; col++) {
        const hx = x + col * 1.5 * R, hy = cy + row * h + (col % 2 ? h / 2 : 0), d = Math.hypot((hx - x) / (width * 0.62), (hy - cy) / (px * 0.95));
        if (d > 1) continue; g.globalAlpha = (1 - d) * hex; g.beginPath();
        for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k; k ? g.lineTo(hx + R * Math.cos(a), hy + R * Math.sin(a)) : g.moveTo(hx + R, hy); }
        g.closePath(); g.stroke();
      }
      g.restore();
    });
    if (t > 0.76 && t < 1.3) over.push(() => flare(g, gild, cy, 0.9 * (1 - clamp((t - 1.12) / 0.18, 0, 1)), { color: '200,230,255', length: 520 }));
    ruleAt = 1.05; sheen = -1;
  } else {  // slam
    const k = t - 0.3, s = t < 0.3 ? lerp(1.9, 1, ease.in(t / 0.3)) : 1 - 0.06 * ring(k, { freq: 6, decay: 8 });
    letters.forEach(L => put(L, { sx: s, sy: s, alpha: t / 0.2, hot: k > 0 ? 0.6 * (1 - clamp(k / 0.2, 0, 1)) : 0 }));
    ruleAt = 0.5; sheen = 0.9;
  }

  // A light sweep across the finished gilding.
  if (sheen > 0 && t > sheen && t < sheen + 0.8) {
    const k = (t - sheen) / 0.8, sx = lerp(ox - width / 2 - 300, ox + width / 2 + 300, ease.inOut(k));
    wc.save(); wc.globalCompositeOperation = 'source-atop';
    const s = wc.createLinearGradient(sx - 160, 0, sx + 160, word.height); s.addColorStop(0, 'rgba(255,255,255,0)'); s.addColorStop(0.5, 'rgba(255,255,255,.85)'); s.addColorStop(1, 'rgba(255,255,255,0)');
    wc.fillStyle = s; wc.fillRect(0, 0, word.width, word.height); wc.restore();
  }

  // Composite: effects under, a soft coloured glow and a deep shadow, the word, effects over, the rule.
  under.forEach(f => f());
  const wx = x - ox + shiftX;
  for (const gh of ghosts) {  // motion smear: stretched echoes trailing the word
    g.save(); g.globalAlpha = gh.alpha; g.translate(x + gh.dx, y - oy + word.height / 2); g.scale(gh.sx, 1);
    g.drawImage(word, -ox, -word.height / 2); g.restore();
  }
  if (!glowA || glowA.width !== word.width || glowA.height !== word.height) glowA = canvas(word.width, word.height);
  const gl = glowA.getContext('2d');
  gl.save(); gl.globalCompositeOperation = 'copy'; gl.filter = `blur(${px * 0.13}px)`; gl.drawImage(word, 0, 0); gl.restore();
  gl.save(); gl.globalCompositeOperation = 'source-in'; gl.fillStyle = `rgb(${TINTS[style] ?? TINTS.slam})`; gl.fillRect(0, 0, word.width, word.height); gl.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.42; g.drawImage(glowA, wx, y - oy); g.restore();
  g.save(); g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = px * 0.28; g.shadowOffsetY = px * 0.07; g.drawImage(word, wx, y - oy); g.restore();
  over.forEach(f => f());
  if (rule) {
    const k = ease.out((t - ruleAt) / 0.55), half = (width / 2 + px * 0.5) * k, ry = y + px * 0.34;
    if (k > 0) {
      g.save(); const lg = g.createLinearGradient(x - half, 0, x + half, 0);
      lg.addColorStop(0, 'rgba(255,214,140,0)'); lg.addColorStop(0.5, 'rgba(255,222,160,.95)'); lg.addColorStop(1, 'rgba(255,214,140,0)');
      g.fillStyle = lg; g.fillRect(x - half, ry, 2 * half, 2);
      const d = spring(t - ruleAt, { freq: 2.6, zeta: 0.45 }); g.translate(x, ry + 1); g.rotate(Math.PI / 4 + (1 - d) * Math.PI); g.scale(d, d);
      g.fillStyle = '#ffe6ad'; g.fillRect(-6, -6, 12, 12); g.restore();
    }
  }
}
export { TINTS };
