// The trailer soundtrack: the score (score.mjs) plus sound design (sfx.mjs) placed by the cue sheet (cues.mjs),
// mixed and rendered offline. Cue times are shot-local and shot starts come from timeline.mjs, so retiming a shot
// or reordering the timeline moves its sounds with it. Loudness is mastered afterwards (render-trailer.mjs audio).
// How it is built, the knobs and the measurements: docs/trailer/AUDIO.md.
import { shots, DURATION } from '../timeline.mjs';
import { SFX } from './sfx.mjs';
import { CUES, HUSH } from './cues.mjs';
import { score } from './score.mjs';

export const SR = 48000;
export const MIX = {
  music: 0.8, sfx: 1,                  // bus levels
  shotSfx: { montage: 1.4 },           // sound-design level per shot (× every cue's gain): the montage hits sit on the score's tutti
  duck: 0.5, duckRelease: 0.35,        // music dips under a cue that sets { duck: true } (or a depth 0–1)
  verb: { seconds: 3.4, decay: 2.6, level: 0.9, monoBelow: 200 },  // shared hall reverb (a send; each sound sets its own amount)
  glue: { threshold: -16, ratio: 2.5, attack: 0.012, release: 0.25 },
  fadeOut: 1,                          // s: the whole mix fades to silence with the picture (title.mjs FADE_OUT), ending at DURATION
};
export const start = Object.fromEntries(shots.map(s => [s.id, s.start]));

/** Seeded noise, so every render is identical. */
export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

/**
 * A stereo hall impulse, built mid/side: a shared (mid) noise plus a side noise high-passed twice at monoBelow, so the
 * hall is wide above it and mono below it (low tails cannot drift out of phase). An exponential decay, and a one-pole
 * low-pass that closes over the tail: bright early, darker late (the air absorbs the highs).
 */
function impulse(ctx, { seconds, decay, monoBelow }) {
  const sr = ctx.sampleRate, n = Math.round(seconds * sr), b = ctx.createBuffer(2, n, sr), L = b.getChannelData(0), R = b.getChannelData(1);
  const mid = rng(17), side = rng(18), hp = 1 - Math.exp((-2 * Math.PI * monoBelow) / sr);
  let h1 = 0, h2 = 0, l = 0, r = 0;
  for (let i = 0; i < n; i++) {
    const k = i / n, c = 0.85 - 0.75 * k, m = mid() * 2 - 1, env = (1 - k) ** decay * Math.min(1, i / (sr * 0.012));
    let s = side() * 2 - 1;
    h1 += hp * (s - h1); s -= h1; h2 += hp * (s - h2); s -= h2;
    l += c * (m + s - l); r += c * (m - s - r);
    L[i] = l * env; R[i] = r * env;
  }
  return b;
}

/** A raised-cosine move of a gain from → to over [at, at + len]. */
const fade = (param, at, len, from, to) =>
  param.setValueCurveAtTime(Float32Array.from({ length: 64 }, (_, k) => from + (to - from) * (0.5 - 0.5 * Math.cos((Math.PI * k) / 63))), at, len);

/**
 * Render the soundtrack. only: 'music' | 'sfx' for stems. Returns an AudioBuffer (stereo, float), DURATION long.
 * Bus contract for sfx.mjs and score.mjs: { out, verb } — connect the dry signal to out, a send to verb.
 * The master stage after the glue enforces the hush windows (cues.mjs HUSH: true silence, reverb tails included) and
 * fades everything out with the picture.
 */
export async function renderSoundtrack({ sampleRate = SR, only = null } = {}) {
  const ctx = new OfflineAudioContext(2, Math.ceil(DURATION * sampleRate), sampleRate);
  const master = ctx.createGain(), glue = ctx.createDynamicsCompressor();
  master.connect(ctx.destination);
  for (const [k, v] of Object.entries(MIX.glue)) glue[k].value = v;
  glue.knee.value = 8; glue.connect(master);
  for (const [id, list] of Object.entries(HUSH)) for (const [a, b] of list) {   // 6 ms out before a, 2 ms back in by b
    fade(master.gain, start[id] + a - 0.006, 0.006, 1, 0); fade(master.gain, start[id] + b - 0.002, 0.002, 0, 1);
  }
  fade(master.gain, DURATION - MIX.fadeOut, MIX.fadeOut, 1, 0);
  const verb = ctx.createConvolver(); verb.normalize = true; verb.buffer = impulse(ctx, MIX.verb);
  const verbOut = ctx.createGain(); verbOut.gain.value = MIX.verb.level; verb.connect(verbOut).connect(glue);
  const music = ctx.createGain(), sfx = ctx.createGain();
  music.gain.value = MIX.music; sfx.gain.value = MIX.sfx; music.connect(glue); sfx.connect(glue);

  if (only !== 'sfx') await score(ctx, { out: music, verb }, { start });
  if (only !== 'music') {
    const ducks = [];
    for (const [id, list] of Object.entries(CUES)) {
      if (!(id in start)) throw new Error(`cues.mjs: no shot "${id}" in timeline.mjs`);
      const trim = MIX.shotSfx[id] ?? 1;
      for (const [t, name, opts = {}] of list) {
        if (!SFX[name]) throw new Error(`cues.mjs: no sound "${name}" in sfx.mjs`);
        const at = start[id] + t;
        SFX[name](ctx, { out: sfx, verb }, at, trim === 1 ? opts : { ...opts, gain: (opts.gain ?? 1) * trim });
        if (opts.duck) ducks.push([at, opts.duck === true ? MIX.duck : opts.duck]);
      }
    }
    ducks.sort((a, b) => a[0] - b[0]).forEach(([at, depth]) => {
      music.gain.setTargetAtTime(MIX.music * (1 - depth), at, 0.004);
      music.gain.setTargetAtTime(MIX.music, at + 0.06, MIX.duckRelease);
    });
  }
  return ctx.startRendering();
}

/** 32-bit float WAV bytes (headroom for mastering). */
export function toWav(buf) {
  const ch = buf.numberOfChannels, n = buf.length, bytes = 44 + n * ch * 4, v = new DataView(new ArrayBuffer(bytes));
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, bytes - 8, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 3, true); v.setUint16(22, ch, true); v.setUint32(24, buf.sampleRate, true);
  v.setUint32(28, buf.sampleRate * ch * 4, true); v.setUint16(32, ch * 4, true); v.setUint16(34, 32, true);
  str(36, 'data'); v.setUint32(40, n * ch * 4, true);
  const data = [...Array(ch)].map((_, c) => buf.getChannelData(c));
  for (let i = 0, o = 44; i < n; i++) for (let c = 0; c < ch; c++, o += 4) v.setFloat32(o, data[c][i], true);
  return v.buffer;
}
