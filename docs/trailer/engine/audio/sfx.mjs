// Sound design, synthesized (no sound files). Contract: SFX[name](ctx, { out, verb }, at, opts) schedules one
// sound at `at` seconds: dry signal into out, a reverb send into verb. Deterministic: seeded noise only.
// Every sound STARTS at `at` and never before it. A sound that must land on a picture event (a swell, a riser,
// a whip, a lunge) takes its length as an option, and the cue sheet starts it that much earlier.
// Common opts: gain (× the designed level), pan (-1…1, [from, to] to travel, or a function of t), pitch (× on
// every frequency), verb (reverb send), cut (hard stop after this many seconds, 6 ms fade), plus per-sound lengths.
// Big hits carry a transient and a sub, not a sustained pitch: the score owns the notes. The few rings that sustain
// sit in its key (score.mjs: D minor, D major at the title); `pitch` retunes them if the score moves.
import { rng } from './mix.mjs';

// ---------------------------------------------------------------- building blocks
const RATE = 2000;     // automation curve points per second (linear between points)
const NOISE_S = 4;     // seconds per pooled noise buffer: 8 for mono / left, 8 more only for right channels
const TRIM = 10 ** (-18 / 20);  // the whole palette's level: the biggest hits peak near -3 dBFS in the stem
const rc = k => (k <= 0 ? 0 : k >= 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * k));  // raised cosine 0 → 1
const clampPan = p => Math.max(-1, Math.min(1, p));

// Envelopes are functions of t (s) that are exactly 0 at both ends, so no layer can click.
/** Percussive: raised-cosine attack a, exponential decay d (time constant), faded to 0 at len. */
const perc = (a, d, len = a + 7 * d) => t => rc(t / a) * Math.exp(-Math.max(0, t - a) / d) * rc((len - t) / (0.3 * (len - a)));
/** Swell: raised-cosine rise over a, hold h, raised-cosine fall over r. */
const swell = (a, h, r) => t => (t < a ? rc(t / a) : t < a + h ? 1 : rc(1 - (t - a - h) / r));
/** Build-up that lands on its end: an exponential rise (k: steepness) cut in `cut` seconds at len. */
const build = (len, k = 5, cut = 0.005) => t => rc(t / 0.02) * Math.exp(k * (Math.min(t, len) / len - 1)) * rc((len - t) / cut);
/** Exponential glide f0 → f1 over len (p > 1 lingers near f0 longer). */
const glide = (f0, f1, len, p = 1) => t => f0 * (f1 / f0) ** (Math.min(1, t / len) ** p);
/** Smooth seeded wander in -1…1 around `hz` (flicker, gusts, growl jitter). */
const wobble = (seed, hz) => {
  const r = rng(seed), ph = [r(), r(), r()].map(x => x * 6.283), k = [1, 1.93, 3.71].map(m => 6.283 * m * hz * (0.8 + 0.4 * r()));
  return t => (Math.sin(k[0] * t + ph[0]) + 0.6 * Math.sin(k[1] * t + ph[1]) + 0.35 * Math.sin(k[2] * t + ph[2])) / 1.95;
};

/** An AudioParam: a number, or fn(t) sampled over [at, at + len]. */
function curve(param, at, len, v) {
  if (typeof v !== 'function') { param.value = v; return; }
  const n = Math.max(2, Math.ceil(len * RATE) + 1), c = new Float32Array(n);
  for (let i = 0; i < n; i++) c[i] = v((len * i) / (n - 1));
  param.setValueCurveAtTime(c, at, len);
}

const POOL = new WeakMap();
function noiseBuffer(ctx, seed, right = false) {
  let pool = POOL.get(ctx);
  if (!pool) POOL.set(ctx, (pool = []));
  const k = (seed % 8) + (right ? 8 : 0);
  if (!pool[k]) {
    const b = ctx.createBuffer(1, NOISE_S * ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0), r = rng(9001 + k);
    for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
    pool[k] = b;
  }
  return pool[k];
}

/** Symmetric tanh saturation (no DC), 4× oversampled. */
function shaper(ctx, drive) {
  const w = ctx.createWaveShaper(), n = 1024, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(drive * x) / Math.tanh(drive); }
  w.curve = c; w.oversample = '4x';
  return w;
}

/**
 * A sound's strip: mono layers pan with equal power, wide (stereo) layers keep their image; a 4th-order 25 Hz
 * high-pass (no rumble, no DC); level (gain: the sound's balance in the palette); the reverb send, above 200 Hz.
 * `move` is how long a [from, to] or function pan takes.
 */
function voice(ctx, bus, at, o, { gain = 1, pan = 0, verb = 0.2, move = 0.3 } = {}) {
  const hp = ctx.createBiquadFilter(), hp2 = ctx.createBiquadFilter(), out = ctx.createGain(), send = ctx.createGain(), g = TRIM * gain * (o.gain ?? 1);
  for (const [f, q] of [[hp, 0.5412], [hp2, 1.3066]]) { f.type = 'highpass'; f.frequency.value = 25; f.Q.value = q; }   // Butterworth
  if (o.cut) curve(out.gain, at, o.cut, t => g * rc((o.cut - t) / 0.006)); else out.gain.value = g;
  const sendHp = ctx.createBiquadFilter(); sendHp.type = 'highpass'; sendHp.frequency.value = 200;   // no sub into the hall: its tail drifts out of phase
  send.gain.value = o.verb ?? verb;
  hp.connect(hp2).connect(out).connect(bus.out);
  out.connect(sendHp).connect(send).connect(bus.verb);
  const p = o.pan ?? pan, mono = ctx.createStereoPanner(), wide = ctx.createStereoPanner();
  mono.channelCount = 1; mono.channelCountMode = 'explicit';
  for (const n of [mono, wide]) {
    if (typeof p === 'function') curve(n.pan, at, move, t => clampPan(p(t)));
    else if (Array.isArray(p)) { n.pan.setValueAtTime(clampPan(p[0]), at); n.pan.linearRampToValueAtTime(clampPan(p[1]), at + move); }
    else n.pan.value = clampPan(p);
    n.connect(hp);
  }
  return { mono, wide };
}

/**
 * One layer into a voice: a source through filters and saturation, shaped by an envelope.
 * src: an oscillator type, 'noise' (seeded white; wide = decorrelated left and right), or a stereo AudioBuffer.
 * f and each filter's f: a number or fn(t). amp: an envelope (0 at both ends). fm: [ratio, depth in Hz or fn(t)].
 */
function layer(ctx, v, at, len, { src = 'noise', f = 440, seed = 1, wide = false, filters = [], drive = 0, amp, gain = 1, fm }) {
  const srcs = [];
  let node;
  if (src === 'noise') {
    const make = (sd, right) => { const s = ctx.createBufferSource(); s.buffer = noiseBuffer(ctx, sd, right); s.loop = true; srcs.push([s, (sd * 0.6180339) % NOISE_S]); return s; };
    if (wide) { node = ctx.createChannelMerger(2); make(seed).connect(node, 0, 0); make(seed, true).connect(node, 0, 1); }
    else node = make(seed);
  } else if (src instanceof AudioBuffer) {
    const s = ctx.createBufferSource(); s.buffer = src; srcs.push([s, 0]); node = s;
  } else {
    const o = ctx.createOscillator(); o.type = src; curve(o.frequency, at, len, f); srcs.push([o]); node = o;
    if (fm) {
      const m = ctx.createOscillator(), d = ctx.createGain();
      curve(m.frequency, at, len, typeof f === 'function' ? t => f(t) * fm[0] : f * fm[0]);
      curve(d.gain, at, len, fm[1]); m.connect(d).connect(o.frequency); srcs.push([m]);
    }
  }
  for (const { type = 'lowpass', f: ff, q } of filters) {
    const b = ctx.createBiquadFilter(); b.type = type; curve(b.frequency, at, len, ff);
    if (q) b.Q.value = q;
    node = node.connect(b);
  }
  if (drive) node = node.connect(shaper(ctx, drive));
  const g = ctx.createGain(), env = amp ?? swell(0.003, len - 0.006, 0.003);
  g.gain.value = 0; curve(g.gain, at, len, t => gain * env(t));
  node.connect(g).connect(wide || src instanceof AudioBuffer ? v.wide : v.mono);
  for (const [s, off] of srcs) { off === undefined ? s.start(at) : s.start(at, off); s.stop(at + len + 0.02); }
}

/** Grains rendered here into a stereo buffer: each a decaying sine (noise: 0…1 of it white), 2 ms attack, panned. */
function grains(ctx, len, n, seed, pick) {
  const sr = ctx.sampleRate, b = ctx.createBuffer(2, Math.ceil(len * sr), sr), L = b.getChannelData(0), R = b.getChannelData(1), r = rng(seed);
  for (let i = 0; i < n; i++) {
    const { t, f, d, a = 1, pan = 0, att = 0.002, noise = 0 } = pick(r, i), i0 = Math.round(t * sr);
    const m = Math.min(L.length - i0, Math.round((att + 6 * d) * sr)), w = (2 * Math.PI * f) / sr, ph = r() * 6.283;
    const th = ((clampPan(pan) + 1) * Math.PI) / 4, gl = a * Math.cos(th), gr = a * Math.sin(th);
    for (let k = 0; k < m; k++) {
      const tt = k / sr, e = rc(tt / att) * Math.exp(-Math.max(0, tt - att) / d) * rc((m - k) / (0.25 * m));
      const s = e * ((1 - noise) * Math.sin(w * k + ph) + (noise ? noise * (r() * 2 - 1) : 0));
      L[i0 + k] += s * gl; R[i0 + k] += s * gr;
    }
  }
  return b;
}
/** Fire crackle: short noisy snaps scattered over len (dense > 1 bunches them late). */
const crackle = (ctx, len, n, seed, { f = [900, 5000], a = 0.2, spread = 0.8, dense = 1 } = {}) =>
  grains(ctx, len, n, seed, r => ({ t: (len - 0.05) * r() ** (1 / dense), f: f[0] + (f[1] - f[0]) * r(), d: 0.0015 + 0.005 * r(), a: a * (0.3 + 0.7 * r()), pan: (r() - 0.5) * 2 * spread, noise: 0.7 }));
/** Digital glitches: n short bursts of sample-and-hold noise (2 ms edges) scattered over len. */
function glitches(ctx, len, n, seed) {
  const sr = ctx.sampleRate, b = ctx.createBuffer(2, Math.ceil(len * sr), sr), L = b.getChannelData(0), R = b.getChannelData(1), r = rng(seed), edge = 0.002 * sr;
  for (let i = 0; i < n; i++) {
    const i0 = Math.round(r() * (len - 0.08) * sr), m = Math.round((0.015 + 0.05 * r()) * sr), hold = Math.round(sr / (300 + 3000 * r()));
    const a = 0.08 + 0.1 * r(), th = ((r() - 0.5) * 1.2 + 1) * Math.PI / 4;
    let x = 0;
    for (let k = 0; k < m && i0 + k < L.length; k++) {
      if (k % hold === 0) x = r() * 2 - 1;
      const e = a * rc(k / edge) * rc((m - k) / edge);
      L[i0 + k] += x * e * Math.cos(th); R[i0 + k] += x * e * Math.sin(th);
    }
  }
  return b;
}
/** Inharmonic partials (metal, glass, bells): each higher partial is quieter (tilt) and dies faster (fall). */
function ring(ctx, v, at, f, { ratios, decay = 0.6, gain = 0.2, a = 0.002, tilt = 0.7, fall = 0.6, cap = 30 }) {
  ratios.forEach((k, i) => { const d = decay / (1 + i * fall), len = Math.min(a + 7 * d, cap); if (f * k < 17000) layer(ctx, v, at, len, { src: 'sine', f: f * k, amp: perc(a, d, len), gain: gain * tilt ** i }); });
}
/** A reverse swell into `len`: dark noise opening up, with a glitter of rising sparkle, cut dead on the end. */
function reverseSwell(ctx, v, at, len, { gain = 1.6, seed = 7, p = 1 } = {}) {
  layer(ctx, v, at, len, { src: 'noise', seed, wide: true, filters: [{ type: 'lowpass', f: glide(300 * p, 8000 * p, len, 1.8) }], amp: build(len, 6), gain });
  layer(ctx, v, at, len, { src: grains(ctx, len, 16, seed + 1, (r, i) => ({ t: len * (0.3 + 0.62 * (i / 16) ** 0.6), f: p * (2500 + 4500 * r()), d: 0.02 + 0.03 * r(), a: 0.04 + 0.08 * (i / 16), pan: r() - 0.5 })), amp: build(len, 2) });
}
/** An impact core: a saturated crack, a falling punch and (sub > 0) a sub drop with its own length. */
function hit(ctx, v, at, { crack = 1.6, hp = 1200, punch = 0.8, f = [150, 48], sub = 0, subF = [55, 32], subLen = 1.2, drive = 2.5, seed = 3 }) {
  if (crack) layer(ctx, v, at, 0.1, { src: 'noise', seed, wide: true, filters: [{ type: 'highpass', f: hp }], amp: perc(0.002, 0.015, 0.1), gain: crack, drive });
  if (punch) layer(ctx, v, at, 0.6, { src: 'sine', f: glide(f[0], f[1], 0.15), amp: perc(0.003, 0.11, 0.6), gain: punch, drive: drive * 0.8 });
  if (sub) layer(ctx, v, at, subLen, { src: 'sine', f: glide(subF[0], subF[1], subLen, 0.7), amp: perc(0.008, subLen / 4, subLen), gain: sub });
}

// ---------------------------------------------------------------- the palette
export const SFX = {
  // ================= Act I: the board wakes
  /** The falling light (len = its fall): a thin shimmer climbing, and a whoosh that accelerates down into the landing. */
  lightFall(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.8, p = o.pitch ?? 1, n = 34, v = voice(ctx, bus, at, o, { verb: 0.55 });
    layer(ctx, v, at, len + 0.4, { src: grains(ctx, len + 0.4, n, 101, (r, i) => { const u = (i / n) ** 0.75; return { t: u * len * 0.97, f: p * 4200 * 2 ** (1.3 * u) * (1 + 0.1 * (r() - 0.5)), d: 0.03 + 0.07 * r(), a: 0.04 + 0.1 * u, pan: (r() - 0.5) * 0.3 }; }) });
    layer(ctx, v, at, len, { src: 'noise', seed: 2, wide: true, filters: [{ type: 'bandpass', f: glide(3400 * p, 420 * p, len, 1.6), q: 2 }], amp: t => (t / len) ** 2.2 * rc((len - t) / 0.012), gain: 1.3 });
  },
  /** The light lands: a soft deep impact, a crown of droplets (sparkle) and the air blooming outward. */
  lightLand(ctx, bus, at, o = {}) {
    const p = o.pitch ?? 1, v = voice(ctx, bus, at, o, { verb: 0.6 });
    layer(ctx, v, at, 1.6, { src: 'sine', f: glide(95 * p, 36 * p, 0.5), amp: perc(0.012, 0.3, 1.6), gain: 0.55 });
    layer(ctx, v, at, 0.8, { src: 'noise', seed: 3, filters: [{ type: 'lowpass', f: 320 }], amp: perc(0.006, 0.12, 0.8), gain: 1.4 });
    layer(ctx, v, at, 1.2, { src: grains(ctx, 1.2, 26, 102, r => ({ t: 0.01 + 0.6 * r() ** 1.8, f: p * (2600 + 5200 * r()), d: 0.05 + 0.2 * r(), a: 0.03 + 0.06 * r(), pan: (r() - 0.5) * 0.9 })) });
    layer(ctx, v, at, 2.2, { src: 'noise', seed: 4, wide: true, filters: [{ type: 'lowpass', f: t => 250 + 3200 * (1 - Math.exp(-t / 0.12)) * Math.exp(-t / 0.9) }], amp: swell(0.05, 0.08, 2.0), gain: 0.9 });
  },
  /** A ring of torchlight rolls out: a warm swell of fire air with a few crackles (gain: the ring's strength). */
  torchSwell(ctx, bus, at, o = {}) {
    const s = o.seed ?? 0, v = voice(ctx, bus, at, o, { verb: 0.35 });
    layer(ctx, v, at, 1.6, { src: 'noise', seed: 10 + s, wide: true, filters: [{ type: 'bandpass', f: 520, q: 0.6 }, { type: 'lowpass', f: 1800 }], amp: swell(0.2, 0.1, 1.3), gain: 1.1 });
    layer(ctx, v, at, 1.4, { src: 'noise', seed: 20 + s, filters: [{ type: 'bandpass', f: 210, q: 1 }], amp: swell(0.25, 0.05, 1.1), gain: 1.1 });
    layer(ctx, v, at, 1.5, { src: crackle(ctx, 1.5, 12, 200 + s, { a: 0.1 }), filters: [{ type: 'highpass', f: 700 }] });
  },
  /** Torchlight ambience (len; fadeIn / fadeOut): a fire roar that flickers (mid bands: the lows stay clear) and sparse crackles. */
  torchBed(ctx, bus, at, o = {}) {
    const len = o.len ?? 6, fi = o.fadeIn ?? 1.2, fo = o.fadeOut ?? 0.3, s = o.seed ?? 31, v = voice(ctx, bus, at, o, { verb: 0.12 });
    const w = wobble(s, 0.9), w2 = wobble(s + 1, 0.35), fade = t => rc(t / fi) * rc((len - t) / fo);
    layer(ctx, v, at, len, { src: 'noise', seed: 30, wide: true, filters: [{ type: 'bandpass', f: t => 380 + 140 * w2(t), q: 0.7 }], amp: t => fade(t) * (0.75 + 0.25 * w(t)), gain: 0.9 });
    layer(ctx, v, at, len, { src: 'noise', seed: 33, wide: true, filters: [{ type: 'bandpass', f: 210, q: 1.2 }], amp: t => fade(t) * (0.85 + 0.15 * w2(t)), gain: 0.9 });
    layer(ctx, v, at, len, { src: crackle(ctx, len, Math.round(len * 7), s + 2, { a: 0.12 }), amp: fade });
  },
  /** A glint: a tiny bright ting (size scales level and ring; cold: icier and higher). Vary pitch per glint. */
  glint(ctx, bus, at, o = {}) {
    const s = o.size ?? 1, f = (o.cold ? 4300 : 2900) * (o.pitch ?? 1), v = voice(ctx, bus, at, o, { verb: 0.45 });
    ring(ctx, v, at, f, { ratios: [1, 2.32, 4.25, 6.63], decay: 0.16 + 0.22 * s, gain: 0.05 + 0.07 * s });
    layer(ctx, v, at, 0.03, { src: 'noise', seed: 40, filters: [{ type: 'highpass', f: 7000 }], amp: perc(0.002, 0.004, 0.03), gain: 0.3 * s });
  },
  /** A slow-motion lunge (len): a low, stretched whoosh with an armour creak. */
  lunge(ctx, bus, at, o = {}) {
    const len = o.len ?? 1.35, v = voice(ctx, bus, at, o, { verb: 0.25 }), w = wobble(51, 1.3);
    layer(ctx, v, at, len, { src: 'noise', seed: 50, wide: true, filters: [{ type: 'bandpass', f: t => 170 + 420 * Math.sin((Math.PI * Math.min(t, len)) / len) ** 1.5, q: 1.1 }], amp: swell(len * 0.45, 0.05, len * 0.5), gain: 1.6 });
    layer(ctx, v, at, len, { src: 'noise', seed: 52, filters: [{ type: 'bandpass', f: t => 900 + 120 * w(t), q: 7 }], amp: t => swell(len * 0.3, len * 0.3, len * 0.4)(t) * (0.6 + 0.4 * w(t * 1.7)), gain: 0.5 });
  },
  /** Lance on armour: a hard crack, a short metal clank, a thud and a scrape. Cue with cut for the hard cut to black. */
  lanceHit(ctx, bus, at, o = {}) {
    const p = o.pitch ?? 1, v = voice(ctx, bus, at, o, { verb: 0 });
    layer(ctx, v, at, 0.06, { src: 'noise', seed: 41, filters: [{ type: 'highpass', f: 2500 }], amp: perc(0.002, 0.01, 0.06), gain: 1.2, drive: 3 });
    ring(ctx, v, at, 620 * p, { ratios: [1, 1.83, 2.61, 3.9, 5.23], decay: 0.35, gain: 0.22, tilt: 0.8 });
    layer(ctx, v, at, 0.3, { src: 'sine', f: glide(150 * p, 70 * p, 0.1), amp: perc(0.003, 0.05, 0.3), gain: 0.6 });
    layer(ctx, v, at, 0.25, { src: 'noise', seed: 42, filters: [{ type: 'bandpass', f: 3000 * p, q: 3 }], amp: perc(0.003, 0.05, 0.25), gain: 0.5 });
  },
  /** THE BOOM: a distorted transient, a saturated punch, a sub drop to the floor and a long dark tail. */
  boom(ctx, bus, at, o = {}) {
    const v = voice(ctx, bus, at, o, { verb: 0.45, gain: 1.48 });
    hit(ctx, v, at, { crack: 2.2, hp: 600, punch: 0.9, f: [190, 42], drive: 4, seed: 80 });
    layer(ctx, v, at, 3.2, { src: 'sine', f: glide(70, 31, 2.6, 0.7), amp: perc(0.01, 0.8, 3.2), gain: 0.75 });
    layer(ctx, v, at, 2.4, { src: 'noise', seed: 82, wide: true, filters: [{ type: 'lowpass', f: glide(1400, 90, 1.2) }], amp: perc(0.004, 0.45, 2.4), gain: 2.2, drive: 1.5 });
    layer(ctx, v, at, 5, { src: 'noise', seed: 84, wide: true, filters: [{ type: 'lowpass', f: 160 }], amp: swell(0.3, 0.2, 4.5), gain: 1.4 });
  },

  // ================= Act II: the court (moves, freeze, card, reveals, resume)
  /** The wrist-bow looses: a mechanical clack, a short damped thrum and a snap of air. */
  bowShot(ctx, bus, at, o = {}) {
    const p = o.pitch ?? 1, v = voice(ctx, bus, at, o, { verb: 0.2 });
    for (const [dt, f] of [[0, 3400], [0.009, 2600]]) layer(ctx, v, at + dt, 0.04, { src: 'noise', seed: 90, filters: [{ type: 'bandpass', f: f * p, q: 3 }], amp: perc(0.002, 0.005, 0.04), gain: 2.5 });
    layer(ctx, v, at, 0.25, { src: 'triangle', f: glide(118 * p, 92 * p, 0.2), filters: [{ type: 'lowpass', f: 900 }], amp: perc(0.003, 0.05, 0.25), gain: 0.4 });
    layer(ctx, v, at + 0.004, 0.12, { src: 'noise', seed: 92, filters: [{ type: 'highpass', f: 3500 }], amp: perc(0.004, 0.025, 0.12), gain: 0.8 });
  },
  /** A bolt in flight (len): a thin whizz with a white-hot sizzle; ends in 10 ms as the freeze or the hit takes over. */
  boltFly(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.5, p = o.pitch ?? 1, v = voice(ctx, bus, at, o, { pan: [-0.2, 0.2], verb: 0.25, move: len });
    const amp = t => rc(t / 0.03) * (0.7 + (0.3 * t) / len) * rc((len - t) / 0.01);
    layer(ctx, v, at, len, { src: 'noise', seed: 94, filters: [{ type: 'bandpass', f: glide(3200 * p, 2300 * p, len), q: 7 }], amp, gain: 2.4 });
    layer(ctx, v, at, len, { src: crackle(ctx, len, Math.round(len * 40), 95, { f: [4000, 9000], a: 0.06, spread: 0.1 }), amp });
  },
  /** The bolt strikes: a hard thunk into armour, a clank and the knock-back. */
  boltHit(ctx, bus, at, o = {}) {
    const p = o.pitch ?? 1, v = voice(ctx, bus, at, o, { verb: 0.3 });
    hit(ctx, v, at, { crack: 1.6, hp: 1800, punch: 0.85, f: [170 * p, 55 * p], drive: 2, seed: 96 });
    ring(ctx, v, at, 740 * p, { ratios: [1, 1.71, 2.53, 3.62], decay: 0.25, gain: 0.12 });
    layer(ctx, v, at + 0.02, 0.6, { src: 'noise', seed: 97, wide: true, filters: [{ type: 'lowpass', f: 900 }], amp: perc(0.01, 0.15, 0.6), gain: 1.0 });
  },
  /** The Beast snarls as it lunges (len): a rough low growl, a jittered saw through a throat-like band. */
  snarl(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.5, p = o.pitch ?? 1, v = voice(ctx, bus, at, o, { verb: 0.2 }), w = wobble(98, 23), env = swell(0.05, len * 0.4, len * 0.6 - 0.05);
    layer(ctx, v, at, len, { src: 'sawtooth', f: t => p * (78 + 10 * w(t)) * (1 - (0.15 * t) / len), fm: [0.51, 30 * p], filters: [{ type: 'bandpass', f: 520 * p, q: 1.3 }, { type: 'lowpass', f: 1600 }], amp: env, gain: 0.55, drive: 2 });
    layer(ctx, v, at, len, { src: 'noise', seed: 99, filters: [{ type: 'bandpass', f: 900 * p, q: 1.5 }], amp: t => env(t) * (0.6 + 0.4 * w(t)), gain: 0.9 });
  },
  /** A bite: jaws clack shut, teeth crunch, a low thock. big: the Beast's own bite, heavier and wetter. */
  chomp(ctx, bus, at, o = {}) {
    const p = o.pitch ?? 1, b = o.big ? 1 : 0, len = 0.09 + 0.12 * b, v = voice(ctx, bus, at, o, { verb: 0.2 });
    for (const [dt, f] of [[0, 2300], [0.011, 2900]]) layer(ctx, v, at + dt, 0.035, { src: 'noise', seed: 100, filters: [{ type: 'bandpass', f: f * p, q: 3.5 }], amp: perc(0.002, 0.004, 0.035), gain: 2.4 });
    layer(ctx, v, at, 0.12, { src: 'sine', f: glide(210 * p, 85 * p, 0.06), amp: perc(0.002, 0.03, 0.12), gain: 0.5 + 0.4 * b, drive: 1.5 });
    layer(ctx, v, at + 0.004, len, { src: grains(ctx, len, 10 + 14 * b, 101 + (o.seed ?? 0), r => ({ t: r() * (0.04 + 0.08 * b), f: p * (800 + 2200 * r()), d: 0.002 + 0.006 * r(), a: 0.25, pan: (r() - 0.5) * 0.3, noise: 0.8 })) });
    if (b) layer(ctx, v, at, 0.45, { src: 'noise', seed: 102, filters: [{ type: 'lowpass', f: 700 }], amp: perc(0.004, 0.09, 0.45), gain: 1.5, drive: 1.5 });
  },
  /** Two pieces trade places (len): two whooshes crossing the stereo field and a shimmer where they pass. */
  swap(ctx, bus, at, o = {}) {
    const len = o.len ?? 1, p = o.pitch ?? 1;
    for (const d of [-1, 1]) {
      const v = voice(ctx, bus, at, { ...o, pan: [0.5 * d, -0.5 * d] }, { verb: 0.3, move: len });
      layer(ctx, v, at, len, { src: 'noise', seed: 110 + d, filters: [{ type: 'bandpass', f: t => p * (450 + 1400 * Math.sin((Math.PI * Math.min(t, len)) / len)), q: 2.2 }], amp: swell(len / 2, 0, len / 2), gain: 1.6 });
    }
    const v = voice(ctx, bus, at, o, { verb: 0.5 });
    layer(ctx, v, at + len * 0.35, len * 0.8, { src: grains(ctx, len * 0.8, 24, 113, r => ({ t: r() * len * 0.45, f: p * (3000 + 4000 * r()), d: 0.05 + 0.12 * r(), a: 0.05, pan: (r() - 0.5) * 1.2 })) });
  },
  /** The Maester's scanning beam (len): a power-on whine, an electric hum (G2: the score's G minor under him) and a scanning
   *  warble. on: false skips the whine. */
  beam(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.8, p = o.pitch ?? 1, fi = o.fadeIn ?? 0.08, fo = o.fadeOut ?? 0.06, v = voice(ctx, bus, at, o, { verb: 0.3 });
    const fade = t => rc(t / fi) * rc((len - t) / fo), scan = t => Math.sin((2 * Math.PI * t) / 0.8);
    layer(ctx, v, at, len, { src: 'sawtooth', f: 98 * p, filters: [{ type: 'lowpass', f: 700 * p }], amp: t => fade(t) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 31 * t)), gain: 0.18 });
    layer(ctx, v, at, len, { src: 'noise', seed: 120, filters: [{ type: 'bandpass', f: t => p * 2600 * 2 ** (0.9 * scan(t)), q: 9 }], amp: fade, gain: 1.8 });
    if (o.on !== false) layer(ctx, v, at, 0.22, { src: 'sine', f: glide(900 * p, 3600 * p, 0.2), amp: perc(0.01, 0.05, 0.22), gain: 0.06 });
  },
  /** The victim comes apart in strips and gears: a crack, a metal clatter, gears ticking down, a thin tear. */
  apart(ctx, bus, at, o = {}) {
    const p = o.pitch ?? 1, n = 60, v = voice(ctx, bus, at, o, { verb: 0.3 });
    hit(ctx, v, at, { crack: 1.2, hp: 1500, punch: 0.5, f: [130, 60], drive: 2, seed: 130 });
    layer(ctx, v, at, 1.0, { src: grains(ctx, 1.0, n, 131, (r, i) => ({ t: 0.7 * (i / n) ** 1.6, f: p * (900 + 5000 * r()), d: 0.01 + 0.05 * r(), a: 0.18 * (1 - (0.6 * i) / n), pan: (r() - 0.5) * 1.2, noise: 0.2 })) });
    layer(ctx, v, at, 0.9, { src: grains(ctx, 0.9, 14, 133, (r, i) => ({ t: 0.05 + i * 0.035 + i * i * 0.0022, f: p * 3600, d: 0.003, a: 0.12 * (1 - i / 16), pan: 0.2, noise: 0.5 })) });
    layer(ctx, v, at, 0.5, { src: 'noise', seed: 132, wide: true, filters: [{ type: 'bandpass', f: 1800 * p, q: 1.2 }], amp: t => perc(0.005, 0.1, 0.5)(t) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 43 * t) ** 2), gain: 1.4 });
  },
  /** A heavy footfall: a padded thump with grit. */
  ogreStep(ctx, bus, at, o = {}) {
    const v = voice(ctx, bus, at, o, { verb: 0.2 });
    layer(ctx, v, at, 0.4, { src: 'sine', f: glide(85, 45, 0.15), amp: perc(0.006, 0.08, 0.4), gain: 0.7 });
    layer(ctx, v, at, 0.3, { src: 'noise', seed: 140, filters: [{ type: 'lowpass', f: 420 }], amp: perc(0.004, 0.06, 0.3), gain: 1.5 });
    layer(ctx, v, at, 0.3, { src: crackle(ctx, 0.3, 8, 141, { f: [600, 2500], a: 0.1 }) });
  },
  /** The Ogre's shove: a straining push that builds for `lead` s, then the contact thud and stone starting to grind. */
  shove(ctx, bus, at, o = {}) {
    const lead = o.lead ?? 1.2, c = at + lead, v = voice(ctx, bus, at, o, { verb: 0.25 });
    layer(ctx, v, at, lead, { src: 'noise', seed: 150, wide: true, filters: [{ type: 'bandpass', f: glide(140, 420, lead, 1.5), q: 1.3 }], amp: t => (t / lead) ** 2 * rc((lead - t) / 0.01), gain: 2.2 });
    hit(ctx, v, c, { crack: 1.4, hp: 900, punch: 0.9, f: [125, 48], drive: 2, seed: 151 });
    layer(ctx, v, c, 1.0, { src: 'noise', seed: 152, wide: true, filters: [{ type: 'lowpass', f: 700 }], amp: perc(0.01, 0.25, 1.0), gain: 1.2 });
  },
  /** Stone dragged across stone (len), ending in a small bump. */
  slide(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.5, v = voice(ctx, bus, at, o, { verb: 0.2, move: len }), w = wobble(160, 37);
    layer(ctx, v, at, len, { src: 'noise', seed: 161, filters: [{ type: 'bandpass', f: t => 420 + 180 * w(t), q: 1.6 }], amp: t => swell(0.02, len * 0.3, len * 0.7 - 0.02)(t) * (0.65 + 0.35 * w(t * 1.3)), gain: 2.4 });
    layer(ctx, v, at, len, { src: crackle(ctx, len, Math.round(len * 50), 162, { f: [500, 2500], a: 0.12 }) });
    layer(ctx, v, at + len - 0.03, 0.3, { src: 'sine', f: glide(110, 55, 0.08), amp: perc(0.004, 0.05, 0.3), gain: 0.45 });
  },
  /** A spinning hurricane (len): wind whose band whirls at the spin rate, swelling as it closes in. hot: full force throughout. */
  storm(ctx, bus, at, o = {}) {
    const len = o.len ?? 2, spin = o.spin ?? 5, v = voice(ctx, bus, at, o, { verb: 0.25, move: len }), w = wobble(170, 0.7);
    const amp = o.hot ? t => rc(t / 0.02) * rc((len - t) / 0.02) : t => rc(t / 0.4) * (0.35 + 0.65 * Math.min(1, t / len) ** 1.5) * rc((len - t) / 0.03);
    layer(ctx, v, at, len, { src: 'noise', seed: 171, wide: true, filters: [{ type: 'bandpass', f: t => 700 * 2 ** (0.7 * Math.sin(2 * Math.PI * spin * t) + 0.3 * w(t)), q: 1.6 }], amp, gain: 2.4 });
    layer(ctx, v, at, len, { src: 'noise', seed: 172, wide: true, filters: [{ type: 'lowpass', f: 260 }], amp, gain: 1.4 });
    layer(ctx, v, at, len, { src: crackle(ctx, len, Math.round(len * 30), 173, { f: [1500, 6000], a: 0.05 }), amp });
  },
  /** The storm breaks on the Guard: a wind splash scattering both ways, a shield thrum, a cold flare in his eyes. */
  stormBreak(ctx, bus, at, o = {}) {
    const v = voice(ctx, bus, at, o, { verb: 0.4 });
    layer(ctx, v, at, 1.1, { src: 'noise', seed: 180, wide: true, filters: [{ type: 'bandpass', f: glide(2400, 380, 0.9), q: 1 }], amp: perc(0.006, 0.28, 1.1), gain: 2.6 });
    layer(ctx, v, at, 0.8, { src: 'noise', seed: 181, filters: [{ type: 'lowpass', f: 220 }], amp: perc(0.004, 0.14, 0.8), gain: 2, drive: 1.5 });
    layer(ctx, v, at, 0.9, { src: 'sine', f: 180, fm: [1.414, t => 400 * Math.exp(-t / 0.15)], amp: perc(0.003, 0.18, 0.9), gain: 0.15 });
    if (o.eyes !== false) SFX.glint(ctx, bus, at + 0.12, { cold: true, size: 1.2, pitch: 1.1, pan: o.pan, gain: 1.2 * (o.gain ?? 1) });
  },
  /** Time stops: a reverse swell sucks in over `lead`, then a hush for `hold` s: a high ring and a slow low pulse. */
  freeze(ctx, bus, at, o = {}) {
    const lead = o.lead ?? 0.45, hold = o.hold ?? 3, p = o.pitch ?? 1, z = at + lead, v = voice(ctx, bus, at, o, { verb: 0.5 });
    reverseSwell(ctx, v, at, lead, { seed: 190, p, gain: 1 });
    layer(ctx, v, z, hold, { src: 'noise', seed: 192, wide: true, filters: [{ type: 'bandpass', f: 5274 * p, q: 6 }], amp: swell(0.04, hold - 0.9, 0.86), gain: 0.45 });   // an air band, too broad to hold a note
    layer(ctx, v, z, hold, { src: 'sine', f: 7040 * p, amp: swell(0.3, hold - 1.3, 1.0), gain: 0.008 });   // A8
    for (let k = 0; k * 0.5 < hold - 0.3; k++) layer(ctx, v, z + k * 0.5, 0.5, { src: 'sine', f: glide(58, 42, 0.2), amp: perc(0.006, 0.09, 0.5), gain: 0.35 * (k % 2 ? 0.55 : 1) * Math.exp(-k / 8) });
  },
  /** The card sweeps in (from: -1 left, 1 right): a cloth-banner whoosh with flutter, and the heavier figure behind it. */
  banner(ctx, bus, at, o = {}) {
    const s = o.from ?? -1, v = voice(ctx, bus, at, o, { pan: [0.8 * s, 0], verb: 0.25, move: 0.45, gain: 0.8 });
    layer(ctx, v, at, 0.5, { src: 'noise', seed: 200, wide: true, filters: [{ type: 'bandpass', f: glide(2600, 700, 0.45), q: 1.1 }], amp: t => perc(0.03, 0.12, 0.5)(t) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 23 * t)), gain: 2.2 });
    layer(ctx, v, at + 0.08, 0.6, { src: 'noise', seed: 201, wide: true, filters: [{ type: 'lowpass', f: glide(600, 180, 0.5) }], amp: perc(0.05, 0.14, 0.6), gain: 2 });
  },
  /** ARCHER reveal: the white-hot bolt streaks across the name (len), fizzing. */
  streak(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.42, v = voice(ctx, bus, at, o, { pan: [-0.1, 0.9], verb: 0.3, move: len, gain: 0.7 }), amp = t => rc(t / 0.03) * rc((len + 0.1 - t) / 0.12);
    layer(ctx, v, at, len + 0.1, { src: 'noise', seed: 210, filters: [{ type: 'bandpass', f: glide(2500, 5200, len), q: 2.5 }], amp, gain: 2 });
    layer(ctx, v, at, len + 0.1, { src: crackle(ctx, len + 0.1, 30, 211, { f: [3500, 9000], a: 0.08, spread: 0.2 }), amp });
  },
  /** A letter ignites as the streak passes: a bright puff, a tiny ting and a spit of sparks. */
  ignite(ctx, bus, at, o = {}) {
    const p = o.pitch ?? 1, v = voice(ctx, bus, at, o, { verb: 0.35, gain: 0.7 });
    layer(ctx, v, at, 0.12, { src: 'noise', seed: 220, filters: [{ type: 'bandpass', f: 4200 * p, q: 1.5 }], amp: perc(0.002, 0.025, 0.12), gain: 1.4 });
    ring(ctx, v, at, 2349.3 * p, { ratios: [1, 2.32, 4.25], decay: 0.18, gain: 0.05 });   // D7 × pitch
    layer(ctx, v, at, 0.35, { src: crackle(ctx, 0.35, 6, 221 + (o.seed ?? 0), { f: [3000, 8000], a: 0.1, spread: 0.3 }) });
  },
  /** MAESTER reveal: the scan line draws the name (len): a stepped digital sweep over a narrow hiss. */
  scan(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.52, p = o.pitch ?? 1, steps = 22, v = voice(ctx, bus, at, o, { verb: 0.25 });
    const f = t => p * 700 * 2 ** ((2.2 * Math.floor(Math.min(1, t / len) * steps)) / steps), amp = t => rc(t / 0.02) * rc((len - t) / 0.03);
    layer(ctx, v, at, len, { src: 'triangle', f, fm: [3, t => f(t) * 0.8], amp, gain: 0.07 });
    layer(ctx, v, at, len, { src: 'noise', seed: 230, filters: [{ type: 'bandpass', f: t => f(t) * 3, q: 6 }], amp, gain: 1.3 });
  },
  /** A measurement tick: a dry digital blip. */
  tick(ctx, bus, at, o = {}) {
    const v = voice(ctx, bus, at, o, { verb: 0.15, gain: 1.6 });
    layer(ctx, v, at, 0.05, { src: 'square', f: 2349.3 * (o.pitch ?? 1), filters: [{ type: 'lowpass', f: 6000 }], amp: perc(0.002, 0.008, 0.05), gain: 0.12 });
  },
  /** Light runs across gold (len; pans from → to): a travelling shimmer. cold: the Guard's icy flare. Soft gain for a sheen. */
  gild(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.5, p = (o.pitch ?? 1) * (o.cold ? 1.35 : 1), n = 30, x0 = o.from ?? -0.3, x1 = o.to ?? 0.3, v = voice(ctx, bus, at, o, { verb: 0.5 });
    layer(ctx, v, at, len + 0.5, { src: grains(ctx, len + 0.5, n, 240 + (o.cold ? 1 : 0), (r, i) => { const u = i / n; return { t: u * len, f: p * (2600 + 3200 * r() + 1500 * u), d: 0.06 + 0.2 * r(), a: 0.04 + 0.03 * r(), pan: x0 + (x1 - x0) * u + (r() - 0.5) * 0.15 }; }) });
    layer(ctx, v, at, len + 0.3, { src: 'noise', seed: 241, wide: true, filters: [{ type: 'highpass', f: (o.cold ? 6000 : 4000) * (o.pitch ?? 1) }], amp: swell(len * 0.4, len * 0.2, len * 0.4 + 0.3), gain: 0.25 });
  },
  /** OGRE reveal: the name is rammed in (lead s, accelerating), stops dead with a huge hit, dust bursts, the letters spring. */
  ram(ctx, bus, at, o = {}) {
    const lead = o.lead ?? 0.3, h = at + lead, v = voice(ctx, bus, at, o, { pan: [-0.95, -0.4], verb: 0.35, move: lead, gain: 0.75 });
    layer(ctx, v, at, lead, { src: 'noise', seed: 250, wide: true, filters: [{ type: 'bandpass', f: glide(160, 900, lead, 1.5), q: 1 }], amp: t => (t / lead) ** 3 * rc((lead - t) / 0.006), gain: 2.6 });
    hit(ctx, v, h, { crack: 2, hp: 900, punch: 0.95, f: [170, 44], sub: 0.55, subF: [58, 31], subLen: 1.6, drive: 3, seed: 251 });
    layer(ctx, v, h, 1.5, { src: 'noise', seed: 252, wide: true, filters: [{ type: 'lowpass', f: glide(2200, 300, 1.2) }], amp: perc(0.006, 0.3, 1.5), gain: 1.4 });
    layer(ctx, v, h, 1.2, { src: crackle(ctx, 1.2, 40, 253, { f: [700, 3500], a: 0.1 }) });
    layer(ctx, v, h + 0.18, 0.5, { src: 'noise', seed: 254, filters: [{ type: 'lowpass', f: 180 }], amp: perc(0.05, 0.1, 0.5), gain: 1.3 });
  },
  /** GUARD reveal: the storm tears past the name and breaks on it after `strike` s (pan: the name); the letters stand. */
  gust(ctx, bus, at, o = {}) {
    const strike = o.strike ?? 0.34, len = 1.2, v = voice(ctx, bus, at, { ...o, pan: [-0.9, 0.9] }, { verb: 0.35, move: len, gain: 0.63 }), v2 = voice(ctx, bus, at + strike, o, { verb: 0.4, gain: 0.8 });
    layer(ctx, v, at, len, { src: 'noise', seed: 260, wide: true, filters: [{ type: 'bandpass', f: t => 900 * 2 ** (1.2 * Math.sin(Math.PI * Math.min(1, t / len))), q: 0.9 }], amp: swell(strike, 0.1, len - strike - 0.1), gain: 2.4 });
    layer(ctx, v2, at + strike, 0.8, { src: 'noise', seed: 261, filters: [{ type: 'lowpass', f: 240 }], amp: perc(0.005, 0.12, 0.8), gain: 1.6 });
    layer(ctx, v2, at + strike, 0.9, { src: 'sine', f: 160, fm: [1.414, t => 350 * Math.exp(-t / 0.12)], amp: perc(0.003, 0.2, 0.9), gain: 0.12 });
  },
  /** A whip pan (len; peaks at 55 %): a fast whoosh that travels across the stereo field (dir ±1; 0 stays centred). */
  whip(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.26, d = o.dir ?? 1, p = o.pitch ?? 1, v = voice(ctx, bus, at, o, { pan: [-0.7 * d, 0.7 * d], verb: 0.15, move: len, gain: 0.63 });
    const amp = t => rc(t / (len * 0.55)) ** 2 * rc((len - t) / (len * 0.45));
    layer(ctx, v, at, len, { src: 'noise', seed: 70, wide: true, filters: [{ type: 'bandpass', f: t => p * 700 * 2 ** (2.2 * Math.sin((Math.PI * Math.min(t, len)) / len)), q: 1.2 }], amp, gain: 2.2 });
    layer(ctx, v, at, len, { src: 'noise', seed: 72, filters: [{ type: 'lowpass', f: 350 * p }], amp, gain: 1.2 });
  },
  /** A whoosh (len; f: [from, to] band sweep; shape: 'in' builds to its end, 'bell' peaks mid-way, 'out' starts hard). */
  whoosh(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.4, [f0, f1] = o.f ?? [500, 2200], p = o.pitch ?? 1, v = voice(ctx, bus, at, o, { pan: [-0.3, 0.3], verb: 0.2, move: len });
    const amp = { in: t => Math.min(1, t / len) ** 2.5 * rc((len - t) / 0.01), bell: swell(len * 0.5, 0, len * 0.5), out: perc(0.01, len / 4, len) }[o.shape ?? 'bell'];
    layer(ctx, v, at, len, { src: 'noise', seed: o.seed ?? 60, wide: true, filters: [{ type: 'bandpass', f: glide(f0 * p, f1 * p, len), q: 1.4 }], amp, gain: 1.8 });
    layer(ctx, v, at, len, { src: 'noise', seed: (o.seed ?? 60) + 1, filters: [{ type: 'bandpass', f: glide(f0 * 2 * p, f1 * 2 * p, len), q: 2.5 }], amp, gain: 0.8 });
  },
  /** Time snaps back: the world unmuffles into an impact (a crack, a punch, a short sub, a flash of air). */
  resume(ctx, bus, at, o = {}) {
    const v = voice(ctx, bus, at, o, { verb: 0.35 });
    hit(ctx, v, at, { crack: 1.6, hp: 1200, punch: 0.8, f: [150, 48], sub: 0.45, subF: [52, 34], subLen: 1.3, drive: 2.5, seed: 270 });
    layer(ctx, v, at, 0.9, { src: 'noise', seed: 271, wide: true, filters: [{ type: 'lowpass', f: t => 5000 * Math.exp(-t / 0.18) + 200 }], amp: perc(0.004, 0.18, 0.9), gain: 1.3 });
  },

  // ================= Act III: everything at once
  /** The Rook pounds the ground (size scales it): a stone crack, a heavy thud, a rumble and rubble. */
  quake(ctx, bus, at, o = {}) {
    const v = voice(ctx, bus, at, o, { verb: 0.3, gain: o.size ?? 1 });
    hit(ctx, v, at, { crack: 2.2, hp: 700, punch: 0.95, f: [110, 38], drive: 2.5, seed: 280 });
    layer(ctx, v, at, 1.4, { src: 'noise', seed: 281, wide: true, filters: [{ type: 'lowpass', f: glide(900, 90, 0.9) }], amp: perc(0.005, 0.32, 1.4), gain: 1.8 });
    layer(ctx, v, at + 0.03, 0.9, { src: grains(ctx, 0.9, 30, 282, r => ({ t: 0.6 * r() ** 1.5, f: 300 + 1600 * r(), d: 0.006 + 0.02 * r(), a: 0.25 * r(), pan: (r() - 0.5) * 1.4, noise: 0.85 })), filters: [{ type: 'lowpass', f: 3500 }] });
  },
  /** The Bishop's dagger: a blade swish over `lead` s, then a steel shing and a short hit on the cut. */
  slash(ctx, bus, at, o = {}) {
    const lead = o.lead ?? 0.08, p = o.pitch ?? 1, h = at + lead, v = voice(ctx, bus, at, o, { pan: [-0.5, 0.5], verb: 0.3, move: lead + 0.1 });
    layer(ctx, v, at, lead + 0.05, { src: 'noise', seed: 290, wide: true, filters: [{ type: 'bandpass', f: glide(1800 * p, 6500 * p, lead), q: 1.6 }], amp: t => Math.min(1, t / lead) ** 2 * rc((lead + 0.05 - t) / 0.05), gain: 2.4 });
    ring(ctx, v, h, 2793.8 * p, { ratios: [1, 1.52, 2.17, 2.9], decay: 0.35, gain: 0.08, tilt: 0.8 });   // F7
    layer(ctx, v, h, 0.3, { src: 'noise', seed: 291, filters: [{ type: 'bandpass', f: 5200 * p, q: 4 }], amp: perc(0.002, 0.07, 0.3), gain: 1.2 });
    hit(ctx, v, h, { crack: 0, punch: 0.55, f: [160, 70], drive: 1, seed: 292 });
  },
  /** The Paladin's hammer: an anvil clang (inharmonic), a heavy thud and a spray of sparks. */
  hammer(ctx, bus, at, o = {}) {
    const p = o.pitch ?? 1, v = voice(ctx, bus, at, o, { verb: 0.35 });
    hit(ctx, v, at, { crack: 1.8, hp: 2000, punch: 0.9, f: [120, 44], drive: 3, seed: 300 });
    ring(ctx, v, at, 349.23 * p, { ratios: [1, 2.21, 3.73, 5.35, 7.12], decay: 0.9, gain: 0.14, tilt: 0.75, fall: 0.5 });   // F4
    layer(ctx, v, at, 0.8, { src: grains(ctx, 0.8, 36, 301, r => ({ t: 0.4 * r() ** 2, f: 3500 + 6000 * r(), d: 0.01 + 0.04 * r(), a: 0.07, pan: (r() - 0.5) * 1.4, noise: 0.3 })) });
  },
  /** The Knight leaps (len = airtime): a push-off, a rising whoosh and air at the top of the arc. */
  leap(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.7, v = voice(ctx, bus, at, o, { pan: [-0.3, 0.3], verb: 0.3, move: len });
    layer(ctx, v, at, 0.12, { src: 'noise', seed: 310, filters: [{ type: 'lowpass', f: 500 }], amp: perc(0.004, 0.03, 0.12), gain: 1.4 });
    layer(ctx, v, at, len, { src: 'noise', seed: 311, wide: true, filters: [{ type: 'bandpass', f: t => 350 * 2 ** (2 * Math.sin((Math.PI * Math.min(t, len)) / len)), q: 1.3 }], amp: swell(len * 0.45, 0.05, len * 0.5), gain: 2 });
  },
  /** A landing: a thud with a puff of dust and grit. */
  land(ctx, bus, at, o = {}) {
    const v = voice(ctx, bus, at, o, { verb: 0.25 });
    hit(ctx, v, at, { crack: 0, punch: 0.8, f: [105, 48], drive: 1.5, seed: 320 });
    layer(ctx, v, at, 0.6, { src: 'noise', seed: 320, wide: true, filters: [{ type: 'bandpass', f: 700, q: 0.8 }], amp: perc(0.006, 0.13, 0.6), gain: 1.8 });
    layer(ctx, v, at, 0.5, { src: crackle(ctx, 0.5, 14, 321, { f: [600, 3000], a: 0.1 }) });
  },
  /** Frost spreads (len = until the shatter): ice crackling faster, glassy ticks, a creak and a cold hiss. */
  frost(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.4, n = 70, v = voice(ctx, bus, at, o, { verb: 0.4 });
    layer(ctx, v, at, len + 0.2, { src: grains(ctx, len + 0.2, n, 330, (r, i) => ({ t: len * (i / n) ** 0.6, f: 2500 + 6500 * r(), d: 0.003 + 0.02 * r(), a: 0.1 + 0.1 * r(), pan: (r() - 0.5) * 1.2, noise: 0.5 })) });
    layer(ctx, v, at, len + 0.15, { src: 'noise', seed: 331, wide: true, filters: [{ type: 'highpass', f: 5000 }], amp: t => Math.min(1, t / len) ** 1.5 * rc((len + 0.15 - t) / 0.15), gain: 0.5 });
    layer(ctx, v, at, len, { src: 'noise', seed: 332, filters: [{ type: 'bandpass', f: glide(300, 800, len), q: 5 }], amp: swell(len * 0.5, 0, len * 0.5), gain: 1.0 });
  },
  /** A shatter: a glass crash and a scatter of shards (also the Strike card bursting). */
  shatter(ctx, bus, at, o = {}) {
    const p = o.pitch ?? 1, n = 70, v = voice(ctx, bus, at, o, { verb: 0.4 });
    layer(ctx, v, at, 0.35, { src: 'noise', seed: 340, wide: true, filters: [{ type: 'highpass', f: 2200 * p }], amp: perc(0.002, 0.06, 0.35), gain: 1.8, drive: 2 });
    layer(ctx, v, at, 1.2, { src: grains(ctx, 1.2, n, 341 + (o.seed ?? 0), (r, i) => ({ t: 0.8 * (i / n) ** 1.8, f: p * (2200 + 7500 * r()), d: 0.02 + 0.09 * r(), a: 0.12 * (1 - (0.7 * i) / n), pan: (r() - 0.5) * 1.6 })) });
    hit(ctx, v, at, { crack: 0, punch: 0.5, f: [140, 60], drive: 1, seed: 342 });
  },
  /** The slot reels spin: a ratchet from every reel (rate ticks/s each) that thins out as they stop (stops: s from the cue). */
  reelSpin(ctx, bus, at, o = {}) {
    const stops = o.stops ?? [0.55], rate = o.rate ?? 15, len = Math.max(...stops) + 0.1, r = rng(350), ticks = [], v = voice(ctx, bus, at, o, { verb: 0.2, gain: 1.4 });
    stops.forEach((s, f) => { for (let t = 0.01 + r() / rate; t < s - 0.01; t += 1 / rate) ticks.push({ t, f: 2600 + 900 * r(), pan: -0.6 + (1.2 * f) / Math.max(1, stops.length - 1) }); });
    layer(ctx, v, at, len, { src: grains(ctx, len, ticks.length, 351, (_, i) => ({ ...ticks[i], d: 0.004, a: 0.12, noise: 0.6 })) });
    layer(ctx, v, at, len, { src: 'noise', seed: 352, wide: true, filters: [{ type: 'bandpass', f: 180, q: 1.2 }], amp: t => rc(t / 0.05) * (1 - (0.8 * t) / len) * rc((len - t) / 0.05), gain: 1.4 });
  },
  /** A reel locks: a mechanical clack. last: the big final stop, with a gold shimmer. */
  reelStop(ctx, bus, at, o = {}) {
    const big = o.last ? 1 : 0, p = o.pitch ?? 1, v = voice(ctx, bus, at, o, { verb: 0.25 + 0.2 * big });
    layer(ctx, v, at, 0.05, { src: 'noise', seed: 360, filters: [{ type: 'bandpass', f: 2200 * p, q: 2 }], amp: perc(0.002, 0.008, 0.05), gain: 2 });
    layer(ctx, v, at, 0.25 + 0.4 * big, { src: 'sine', f: glide(190 * p, 80, 0.07), amp: perc(0.002, 0.05 + 0.1 * big, 0.25 + 0.4 * big), gain: 0.45 + 0.4 * big, drive: 1.5 });
    ring(ctx, v, at, 1174.7 * p, { ratios: [1, 2.4, 3.9], decay: 0.12 + 0.5 * big, gain: 0.05 + 0.06 * big });   // D6 × pitch
    if (big) SFX.gild(ctx, bus, at + 0.02, { len: 0.4, gain: 0.8 * (o.gain ?? 1), from: -0.5, to: 0.5 });
  },
  /** A wave of pieces lands, file pairs from the centre out (pairs, gap s): armoured thuds, clanks, dust. heavy: the back ranks. */
  armyLand(ctx, bus, at, o = {}) {
    const pairs = o.pairs ?? 4, gap = o.gap ?? 0.03, hv = o.heavy ? 1 : 0, r = rng(370 + (o.seed ?? 0));
    for (let j = 0; j < 2 * pairs; j++) {
      const i = j >> 1, t = at + i * gap, v = voice(ctx, bus, t, { ...o, pan: (j % 2 ? 1 : -1) * (0.1 + (0.55 * i) / Math.max(1, pairs - 1)) }, { verb: 0.2, gain: 0.8 });
      layer(ctx, v, t, 0.35, { src: 'sine', f: glide((100 + 20 * r()) * (1 - 0.2 * hv), 50, 0.1), amp: perc(0.003, 0.06 + 0.04 * hv, 0.35), gain: 0.45 + 0.2 * hv });
      layer(ctx, v, t, 0.25, { src: 'noise', seed: 371 + j, filters: [{ type: 'bandpass', f: 600 + 300 * r(), q: 0.9 }], amp: perc(0.003, 0.05, 0.25), gain: 1.2 });
      ring(ctx, v, t, (700 + 500 * r()) * (1 - 0.25 * hv), { ratios: [1, 1.9, 2.8], decay: 0.1, gain: 0.04 });
    }
  },

  // ================= Act IV: the kings
  /** Fire ignites: a whoomp as the flame catches, a low swell, then crackle. */
  fireIgnite(ctx, bus, at, o = {}) {
    const v = voice(ctx, bus, at, o, { verb: 0.35, gain: 0.63 });
    layer(ctx, v, at, 1.0, { src: 'noise', seed: 380, wide: true, filters: [{ type: 'lowpass', f: t => 150 + 2600 * Math.sin(Math.PI * Math.min(1, t / 0.5)) ** 0.8 * Math.exp(-t / 0.5) }], amp: perc(0.05, 0.22, 1.0), gain: 2.6, drive: 1.5 });
    layer(ctx, v, at, 0.8, { src: 'sine', f: glide(70, 46, 0.4), amp: swell(0.06, 0.05, 0.6), gain: 0.35 });
    layer(ctx, v, at + 0.05, 1.2, { src: crackle(ctx, 1.2, 26, 381, { a: 0.14 }) });
  },
  /** Frost ignites: a cluster of icy chimes (inharmonic), a cold crackle and a breath of frost. */
  frostIgnite(ctx, bus, at, o = {}) {
    const p = o.pitch ?? 1, v = voice(ctx, bus, at, o, { verb: 0.55, gain: 1.6 });
    [[0, 2349.3], [0.03, 2793.8], [0.07, 3520], [0.11, 4698.6]].forEach(([dt, f]) => ring(ctx, v, at + dt, f * p, { ratios: [1, 2.76, 5.4], decay: 0.9, gain: 0.045 }));   // D7 F7 A7 D8
    layer(ctx, v, at, 0.6, { src: grains(ctx, 0.6, 30, 390, r => ({ t: 0.35 * r() ** 1.5, f: 4000 + 5000 * r(), d: 0.003 + 0.01 * r(), a: 0.12, pan: (r() - 0.5) * 1.2, noise: 0.6 })) });
    layer(ctx, v, at, 1.2, { src: 'noise', seed: 391, wide: true, filters: [{ type: 'highpass', f: 5500 }], amp: swell(0.08, 0.1, 1.0), gain: 0.35 });
  },
  /** Earth ignites: a sub thump, a deep rumble and stone grinding. */
  earthIgnite(ctx, bus, at, o = {}) {
    const v = voice(ctx, bus, at, o, { verb: 0.3 });
    layer(ctx, v, at, 0.6, { src: 'sine', f: glide(62, 40, 0.3), amp: perc(0.006, 0.14, 0.6), gain: 0.6 });
    layer(ctx, v, at, 1.4, { src: 'noise', seed: 400, wide: true, filters: [{ type: 'lowpass', f: 230 }], amp: swell(0.1, 0.2, 1.1), gain: 2.4, drive: 1.3 });
    layer(ctx, v, at, 1.2, { src: grains(ctx, 1.2, 40, 401, r => ({ t: 0.9 * r(), f: 250 + 1200 * r(), d: 0.008 + 0.02 * r(), a: 0.15 * r(), pan: (r() - 0.5) * 1.2, noise: 0.9 })), filters: [{ type: 'lowpass', f: 2500 }] });
  },
  /** Air ignites: a whoosh that circles (a swirling pan) and rises. */
  airIgnite(ctx, bus, at, o = {}) {
    const len = 0.9, x = typeof o.pan === 'number' ? o.pan : 0, v = voice(ctx, bus, at, { ...o, pan: t => x + 0.35 * Math.sin(2 * Math.PI * 2.2 * t) }, { verb: 0.4, move: len, gain: 0.8 });
    layer(ctx, v, at, len, { src: 'noise', seed: 410, wide: true, filters: [{ type: 'bandpass', f: t => 600 * 2 ** (2.2 * Math.sin((Math.PI * Math.min(t, len)) / len) + 0.4 * Math.sin(2 * Math.PI * 3 * t)), q: 2.5 }], amp: swell(0.3, 0.1, 0.5), gain: 2.2 });
    layer(ctx, v, at, len, { src: 'noise', seed: 411, filters: [{ type: 'bandpass', f: glide(1400, 2200, len), q: 12 }], amp: swell(0.35, 0.05, 0.5), gain: 0.6 });
  },
  /** The ring closes: a low pulse, a soft whomp and a shimmer running round the ring. */
  ringClose(ctx, bus, at, o = {}) {
    const v = voice(ctx, bus, at, o, { verb: 0.5 });
    layer(ctx, v, at, 0.9, { src: 'sine', f: glide(64, 40, 0.35), amp: perc(0.008, 0.2, 0.9), gain: 0.6 });
    layer(ctx, v, at, 0.8, { src: 'noise', seed: 415, wide: true, filters: [{ type: 'lowpass', f: glide(1600, 200, 0.4) }], amp: perc(0.01, 0.16, 0.8), gain: 1.6 });
    SFX.gild(ctx, bus, at, { len: 0.6, from: -0.6, to: 0.6, gain: 0.7 * (o.gain ?? 1) });
  },
  /** A fuse burns round the ring (len; pan: its path, a function of t): a fizzing hiss and spitting sparks. */
  fuse(ctx, bus, at, o = {}) {
    const len = o.len ?? 1, v = voice(ctx, bus, at, o, { verb: 0.3, move: len, gain: 0.8 }), amp = t => rc(t / 0.03) * rc((len - t) / 0.05);
    layer(ctx, v, at, len, { src: 'noise', seed: 575, filters: [{ type: 'bandpass', f: 5200, q: 1.2 }], amp: t => amp(t) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 17 * t) ** 2), gain: 1.3 });
    layer(ctx, v, at, len, { src: crackle(ctx, len, Math.round(len * 60), 576, { f: [2500, 8000], a: 0.1, spread: 0.1 }), amp });
  },
  /** A heat pulse in the charging card: a low thump and a breath of fire. */
  pulse(ctx, bus, at, o = {}) {
    const v = voice(ctx, bus, at, o, { verb: 0.3 });
    layer(ctx, v, at, 0.35, { src: 'sine', f: glide(80, 45, 0.12), amp: perc(0.004, 0.07, 0.35), gain: 0.7 });
    layer(ctx, v, at, 0.3, { src: 'noise', seed: 580, wide: true, filters: [{ type: 'lowpass', f: glide(2400, 400, 0.2) }], amp: perc(0.005, 0.06, 0.3), gain: 1.4 });
  },
  /** A card dealt from the camera (len = flight): a receding swish, then a tap on glass and a soft ripple as it lands. */
  deal(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.72, p = o.pitch ?? 1, h = at + len, v = voice(ctx, bus, at, o, { verb: 0.3, move: len, gain: 0.7 });
    layer(ctx, v, at, len, { src: 'noise', seed: 420 + (o.seed ?? 0), wide: true, filters: [{ type: 'bandpass', f: glide(5500 * p, 1400 * p, len), q: 1.3 }], amp: t => rc(t / 0.05) * Math.exp(-t / (len * 0.45)) * rc((len - t) / 0.05), gain: 1.8 });
    ring(ctx, v, h, 2349.3 * p, { ratios: [1, 2.21, 3.66], decay: 0.09, gain: 0.07 });   // D7 × pitch
    layer(ctx, v, h, 0.15, { src: 'noise', seed: 421, filters: [{ type: 'bandpass', f: 3500 * p, q: 2 }], amp: perc(0.002, 0.012, 0.15), gain: 1.2 });
    layer(ctx, v, h, 0.3, { src: 'sine', f: glide(180 * p, 110 * p, 0.05), amp: perc(0.002, 0.03, 0.3), gain: 0.3 });
    layer(ctx, v, h, 0.9, { src: 'noise', seed: 422, wide: true, filters: [{ type: 'bandpass', f: 900, q: 1 }], amp: swell(0.05, 0.05, 0.8), gain: 0.5 });
  },
  /** An emblem flies into its card's gem (len): a sparkling whoosh, then a lock-in chime as the gem lights. */
  emblemFly(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.62, p = o.pitch ?? 1, s = o.seed ?? 0, v = voice(ctx, bus, at, o, { verb: 0.45, move: len });
    layer(ctx, v, at, len, { src: 'noise', seed: 430 + s, filters: [{ type: 'bandpass', f: glide(1200 * p, 3800 * p, len), q: 2 }], amp: t => Math.min(1, t / len) ** 1.5 * rc((len - t) / 0.02), gain: 1.2 });
    layer(ctx, v, at, len + 0.3, { src: grains(ctx, len + 0.3, 18, 431 + s, (r, i) => ({ t: len * (i / 18), f: p * (3000 + 3000 * r()), d: 0.04 + 0.06 * r(), a: 0.04, pan: (r() - 0.5) * 0.3 })) });
    ring(ctx, v, at + len, 2349.3 * p, { ratios: [1, 2.76, 5.4], decay: 0.5, gain: 0.06 });   // the gem lights: D7 × pitch
  },
  /** A hologram powers up and hums (len): a rising power-on, a flickering electric buzz, scan-line fizz and glitches. */
  holoOn(ctx, bus, at, o = {}) {
    const len = o.len ?? 5, p = o.pitch ?? 1, s = o.seed ?? 0, v = voice(ctx, bus, at, o, { verb: 0.3, gain: 2 }), w = wobble(440 + s, 7);
    const fade = t => rc(t / 0.25) * rc((len - t) / 0.15);
    layer(ctx, v, at, 0.5, { src: 'sawtooth', f: glide(40 * p, 110 * p, 0.35), filters: [{ type: 'lowpass', f: glide(200, 2400, 0.4) }], amp: perc(0.05, 0.12, 0.5), gain: 0.22 });
    layer(ctx, v, at, len, { src: 'sawtooth', f: 55 * p, filters: [{ type: 'bandpass', f: 440 * p, q: 0.8 }], amp: t => fade(t) * (0.75 + 0.25 * w(t)), gain: 0.11 });
    layer(ctx, v, at, len, { src: 'noise', seed: 441 + s, wide: true, filters: [{ type: 'bandpass', f: 7000, q: 3 }], amp: t => fade(t) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 60 * t) ** 2), gain: 0.25 });
    layer(ctx, v, at, len, { src: glitches(ctx, len, 3, 442 + s), filters: [{ type: 'lowpass', f: 9000 }], amp: fade });
  },
  /** The holograms glitch out: a burst of digital glitches and a falling power-down. */
  holoGlitch(ctx, bus, at, o = {}) {
    const v = voice(ctx, bus, at, o, { verb: 0.25 });
    layer(ctx, v, at, 0.5, { src: glitches(ctx, 0.5, 9, 450), filters: [{ type: 'lowpass', f: 9000 }] });
    layer(ctx, v, at, 0.45, { src: 'sawtooth', f: glide(110, 30, 0.4), filters: [{ type: 'lowpass', f: glide(2400, 150, 0.4) }], amp: perc(0.005, 0.12, 0.45), gain: 0.2 });
  },
  /** Cards fan out: a quick riffle of swishes (n, gap s), left to right. */
  riffle(ctx, bus, at, o = {}) {
    const n = o.n ?? 4, gap = o.gap ?? 0.07;
    for (let i = 0; i < n; i++) {
      const t = at + i * gap, v = voice(ctx, bus, t, { ...o, pan: -0.5 + i / Math.max(1, n - 1) }, { verb: 0.2 });
      layer(ctx, v, t, 0.18, { src: 'noise', seed: 460 + i, filters: [{ type: 'bandpass', f: glide(2200, 4800, 0.12), q: 1.8 }], amp: perc(0.01, 0.04, 0.18), gain: 1.2 });
    }
  },
  /** A card flips (len = the turn): a swish through the turn, then a crisp snap as it lands. big: the hero card. */
  cardFlip(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.42, p = o.pitch ?? 1, big = o.big ? 1 : 0, h = at + len, v = voice(ctx, bus, at, o, { verb: 0.25 + 0.15 * big, move: len, gain: 0.5 });
    layer(ctx, v, at, len, { src: 'noise', seed: 470, wide: true, filters: [{ type: 'bandpass', f: t => p * 1800 * 2 ** (1.3 * Math.sin((Math.PI * Math.min(t, len)) / len)), q: 1.5 }], amp: swell(len * 0.5, 0, len * 0.5), gain: 1.5 + big });
    layer(ctx, v, h, 0.06, { src: 'noise', seed: 471, filters: [{ type: 'highpass', f: 1500 }], amp: perc(0.002, 0.008, 0.06), gain: 1.6 + big });
    layer(ctx, v, h, 0.12, { src: 'sine', f: glide(230, 120, 0.04), amp: perc(0.002, 0.025, 0.12), gain: 0.35 + 0.3 * big });
  },
  /** The Strike card charges (len): a riser that climbs and trembles faster, crackling, cut dead on the burst. */
  charge(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.6, v = voice(ctx, bus, at, o, { verb: 0.2, gain: 0.7 }), trem = t => 0.7 + 0.3 * Math.sin(2 * Math.PI * (8 * t + (11 * t * t) / len));
    layer(ctx, v, at, len, { src: 'noise', seed: 480, wide: true, filters: [{ type: 'bandpass', f: glide(300, 6000, len, 1.3), q: 1.5 }], amp: t => build(len, 4)(t) * trem(t), gain: 2.6 });
    layer(ctx, v, at, len, { src: 'sine', f: glide(40, 70, len), amp: build(len, 3), gain: 0.4 });
    layer(ctx, v, at, len, { src: crackle(ctx, len, 40, 481, { a: 0.14, dense: 2 }), amp: build(len, 3) });
  },
  /** The meteor bursts out of the card: glass shattering and a fire whoomp. */
  burst(ctx, bus, at, o = {}) {
    SFX.shatter(ctx, bus, at, { ...o, seed: 5, gain: 0.5 * (o.gain ?? 1) });
    const v = voice(ctx, bus, at, o, { verb: 0.3, gain: 0.5 });
    layer(ctx, v, at, 0.8, { src: 'noise', seed: 490, wide: true, filters: [{ type: 'lowpass', f: glide(3500, 400, 0.6) }], amp: perc(0.004, 0.18, 0.8), gain: 2.2, drive: 2 });
    hit(ctx, v, at, { crack: 0, punch: 0.7, f: [130, 50], drive: 1.5, seed: 491 });
  },
  /** The meteor roars toward the camera (len = to the impact; k: its path progress 0–1 over t, as the picture moves it):
   *  fire that swells and brightens as it travels, darkening while it hangs in slow motion, and a falling scream. */
  meteor(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.85, k = o.k ?? (t => Math.min(1, t / len) ** 1.6), v = voice(ctx, bus, at, o, { pan: [0.3, -0.6], verb: 0.25, move: len, gain: 0.5 });
    const speed = t => Math.min(1.5, Math.max(0, (k(Math.min(len, t + 0.01)) - k(Math.max(0, t - 0.01))) / 0.02 * len));   // 1 = average speed
    const amp = t => rc(t / 0.04) * (0.25 + 0.75 * k(t)) * rc((len - t) / 0.012);
    layer(ctx, v, at, len, { src: 'noise', seed: 500, wide: true, filters: [{ type: 'lowpass', f: t => 500 + 5200 * k(t) * (0.3 + 0.7 * Math.min(1, speed(t))) }], amp, gain: 2.4, drive: 2 });
    layer(ctx, v, at, len, { src: 'noise', seed: 501, wide: true, filters: [{ type: 'lowpass', f: 180 }], amp, gain: 2.0 });
    layer(ctx, v, at, len, { src: crackle(ctx, len, 60, 502, { a: 0.16 }), amp });
    layer(ctx, v, at, len, { src: 'noise', seed: 503, filters: [{ type: 'bandpass', f: t => 2600 - 1400 * k(t), q: 6 }], amp, gain: 1.2 });
  },
  /** The meteor impact, the biggest hit with the boom: a distorted crack, a punch, a sub drop, debris and a fire tail. */
  impact(ctx, bus, at, o = {}) {
    const v = voice(ctx, bus, at, o, { verb: 0.45 });
    hit(ctx, v, at, { crack: 2.4, hp: 500, punch: 0.95, f: [200, 42], drive: 4, seed: 510 });
    layer(ctx, v, at, 3.4, { src: 'sine', f: glide(64, 31, 2.8, 0.7), amp: perc(0.01, 0.9, 3.4), gain: 0.7 });
    layer(ctx, v, at, 2.6, { src: 'noise', seed: 512, wide: true, filters: [{ type: 'lowpass', f: glide(3000, 120, 1.4) }], amp: perc(0.004, 0.5, 2.6), gain: 2.4, drive: 2 });
    layer(ctx, v, at, 1.6, { src: grains(ctx, 1.6, 60, 513, r => ({ t: 1.1 * r() ** 2, f: 400 + 3000 * r(), d: 0.006 + 0.03 * r(), a: 0.18 * r(), pan: (r() - 0.5) * 1.6, noise: 0.8 })) });
  },
  /** The white-out: a bright ringing swell that rises (rise), holds in the white (hold) and fades as it clears (fall). */
  whiteOut(ctx, bus, at, o = {}) {
    const a = o.rise ?? 0.6, h = o.hold ?? 0.5, r = o.fall ?? 1.2, len = a + h + r, sw = swell(0.01, a + h - 0.01, r), env = t => (t < a ? (t / a) ** 2 : 1) * sw(t);
    const v = voice(ctx, bus, at, o, { verb: 0.6, gain: 0.63 });
    layer(ctx, v, at, len, { src: 'noise', seed: 520, wide: true, filters: [{ type: 'highpass', f: glide(2500, 6000, a) }], amp: env, gain: 0.8 });
    [3520, 5274, 7040].forEach((f, i) => layer(ctx, v, at, len, { src: 'sine', f: f * (o.pitch ?? 1), amp: env, gain: 0.014 / (i + 1) }));   // A7 E8 A8
  },

  // ================= Act V: the title
  /** The sword's glint (len; peak: where it is brightest, 0–1): a bright steel shing that rises and rings. */
  bladeGlint(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.4, pk = o.peak ?? 0.5, p = o.pitch ?? 1, v = voice(ctx, bus, at, o, { verb: 0.5, gain: 1.4 });
    layer(ctx, v, at, len, { src: 'noise', seed: 530, filters: [{ type: 'bandpass', f: glide(3000 * p, 8000 * p, len), q: 5 }], amp: swell(len * pk, 0, len * (1 - pk)), gain: 1.2 });
    ring(ctx, v, at + len * pk * 0.8, 3300 * p, { ratios: [1, 1.51, 2.24], decay: 0.5, gain: 0.05, a: 0.03 });
  },
  /** A reverse swell that sucks back into its end (len): the sword's draw-back. */
  suck(ctx, bus, at, o = {}) {
    const len = o.len ?? 0.3, v = voice(ctx, bus, at, o, { verb: 0.3 });
    reverseSwell(ctx, v, at, len, { seed: 540, p: o.pitch ?? 1, gain: 0.9 });
  },
  /** The sword strikes the crown: a crack, a boom, and a dense metallic ring with a long tail (inharmonic, no chord). */
  crownHit(ctx, bus, at, o = {}) {
    const p = o.pitch ?? 1, v = voice(ctx, bus, at, o, { verb: 0.5, gain: 1.3 });
    hit(ctx, v, at, { crack: 2, hp: 1500, punch: 0.9, f: [180, 42], sub: 0.65, subF: [62, 31], subLen: 3.2, drive: 3, seed: 550 });
    ring(ctx, v, at, 293.66 * p, { ratios: [1, 1.502, 2.006, 2.523, 3.011, 4.024, 5.06, 6.1], decay: 1.5, gain: 0.07, tilt: 0.85, fall: 0.35, cap: o.ring ?? 5.2 });   // D4, near-harmonic
    layer(ctx, v, at, 2, { src: 'noise', seed: 551, wide: true, filters: [{ type: 'lowpass', f: glide(2500, 120, 1) }], amp: perc(0.004, 0.35, 2), gain: 1.8, drive: 1.5 });
  },
  /** Embers rising (len; fadeOut): sparse soft crackles and a warm breath of air. */
  embers(ctx, bus, at, o = {}) {
    const len = o.len ?? 5, v = voice(ctx, bus, at, o, { verb: 0.15, gain: 1.4 }), fade = t => rc(t / 0.5) * rc((len - t) / (o.fadeOut ?? 1.5));
    layer(ctx, v, at, len, { src: crackle(ctx, len, Math.round(len * 5), 560, { a: 0.1 }), amp: fade });
    layer(ctx, v, at, len, { src: 'noise', seed: 561, wide: true, filters: [{ type: 'bandpass', f: 600, q: 0.6 }], amp: fade, gain: 0.25 });
  },
  /** Wind that thins to silence (len). */
  wind(ctx, bus, at, o = {}) {
    const len = o.len ?? 4, v = voice(ctx, bus, at, o, { verb: 0.1, gain: 1.4 }), w = wobble(570, 0.4), env = swell(len * 0.3, 0, len * 0.7);
    layer(ctx, v, at, len, { src: 'noise', seed: 571, wide: true, filters: [{ type: 'bandpass', f: t => 500 * 2 ** (0.6 * w(t)), q: 1.2 }], amp: t => env(t) * (0.7 + 0.3 * w(t * 1.9)), gain: 1.2 });
  },
};
