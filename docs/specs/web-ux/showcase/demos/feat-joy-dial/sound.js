// The joy dial's sounds: short tones made in code (WebAudio), like the kit's sfx, plus the ones the
// dial needs that the kit has not (a bowstring, a bite at a given pitch, a bell, a drum).
// Silent until the first tap or key press, and silent while the kit's sound is muted (sfx.muted).
import { sfx } from '../../kit/ui.js';

let ctx = null, master = null;
function unlock() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  } catch { ctx = null; }
}
for (const type of ['pointerdown', 'keydown']) window.addEventListener(type, unlock, { capture: true, once: true });

function tone({ type = 'sine', f, f2 = f, at = 0, dur = 0.14, gain = 0.2, attack = 0.005 }) {
  const t0 = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2 !== f) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function noise({ at = 0, dur = 0.05, gain = 0.25, freq = 1800, q = 1 }) {
  const t0 = ctx.currentTime + at, n = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = buf; fl.type = 'bandpass'; fl.frequency.value = freq; fl.Q.value = q; g.gain.value = gain;
  src.connect(fl).connect(g).connect(master);
  src.start(t0);
}

const SOUNDS = {
  // the Archer: a plucked string that drops in pitch
  bowstring: () => { tone({ type: 'triangle', f: 330, f2: 160, dur: 0.2, gain: 0.16 }); noise({ dur: 0.03, freq: 3400, q: 4, gain: 0.12 }); },
  thud: () => { tone({ f: 120, f2: 60, dur: 0.22, gain: 0.3, at: 0.1 }); noise({ at: 0.1, dur: 0.08, freq: 500, gain: 0.3 }); },
  // check: one low note
  low: () => tone({ type: 'triangle', f: 196, dur: 0.42, gain: 0.2, attack: 0.012 }),
  // a king's power: two notes up
  motif: () => { tone({ type: 'triangle', f: 392, dur: 0.16, gain: 0.13 }); tone({ type: 'triangle', f: 587, at: 0.12, dur: 0.26, gain: 0.13 }); },
  // a Beast bite: a snap; step n sounds a whole tone higher than step n - 1
  bite: (n = 0) => { const f = 300 * 2 ** ((n * 2) / 12); noise({ dur: 0.03, freq: 2600, q: 3, gain: 0.22 }); tone({ type: 'square', f, f2: f * 0.72, dur: 0.08, gain: 0.05 }); },
  bell: () => { [659, 1318, 1976].forEach((f, i) => tone({ f, dur: 1.1, gain: 0.12 / (i + 1) })); },
  drum: () => { tone({ f: 92, f2: 46, dur: 0.38, gain: 0.42 }); noise({ dur: 0.12, freq: 280, gain: 0.32 }); },
};

/** Play a named sound (bowstring, thud, low, motif, bite, bell, drum). */
export function sound(name, arg) {
  if (!ctx || sfx.muted || !SOUNDS[name]) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  try { SOUNDS[name](arg); } catch { /* sound is a nicety */ }
}
