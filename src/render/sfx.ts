/** Short synthesized board sounds: filtered noise and decaying tones. Web Audio only — no sound files. */
let ctx: AudioContext | null = null;
let enabled = true;
const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

export function setSound(on: boolean): void { enabled = on; }

/** One second of white noise per context, reused by every noisy sound. */
function noiseBuffer(c: BaseAudioContext): AudioBuffer {
  let b = noiseBuffers.get(c);
  if (!b) {
    b = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = b.getChannelData(0);
    let seed = 1;
    for (let i = 0; i < d.length; i++) { seed = (seed * 16807) % 2147483647; d[i] = seed / 1073741823.5 - 1; }
    noiseBuffers.set(c, b);
  }
  return b;
}

/** A gain envelope: a 4 ms attack to `peak`, then an exponential fall over `dur` seconds. */
function envelope(c: BaseAudioContext, out: AudioNode, t: number, dur: number, peak: number): GainNode {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(out);
  return g;
}

function tone(c: BaseAudioContext, out: AudioNode, t: number, dur: number, peak: number, from: number, to = from, type: OscillatorType = 'sine'): void {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  if (to !== from) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  o.connect(envelope(c, out, t, dur, peak));
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(c: BaseAudioContext, out: AudioNode, t: number, dur: number, peak: number, filter: BiquadFilterType, from: number, to = from, q = 1): void {
  const s = c.createBufferSource();
  s.buffer = noiseBuffer(c);
  const f = c.createBiquadFilter();
  f.type = filter;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  if (to !== from) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  s.connect(f).connect(envelope(c, out, t, dur, peak));
  s.start(t);
  s.stop(t + dur + 0.02);
}

type Sound = (c: BaseAudioContext, out: AudioNode, t: number) => void;

/** Each sound draws on (context, destination, start time), so tools can render them offline. */
export const SOUNDS: Record<'move' | 'capture' | 'check' | 'shove' | 'shot' | 'chain' | 'swap', Sound> = {
  // A piece set down on stone: a short knock and a low body.
  move: (c, o, t) => { noise(c, o, t, 0.05, 1, 'bandpass', 1700, 1700, 2.5); tone(c, o, t, 0.07, 0.3, 210, 170); },
  // A heavier blow: low thump, dull crunch, and the knock.
  capture: (c, o, t) => { tone(c, o, t, 0.22, 0.55, 150, 55); noise(c, o, t, 0.16, 0.35, 'lowpass', 1200, 300); noise(c, o, t, 0.04, 0.3, 'bandpass', 1500, 1500, 2); },
  // One low note: a falling triangle with a quiet upper partial.
  check: (c, o, t) => { tone(c, o, t, 0.7, 0.32, 110, 98, 'triangle'); tone(c, o, t, 0.7, 0.08, 220); },
  // Stone dragged across stone, over a low push.
  shove: (c, o, t) => { noise(c, o, t, 0.26, 0.4, 'bandpass', 320, 220, 1.2); tone(c, o, t, 0.18, 0.35, 95, 60); },
  // A bowstring: a plucked, falling tone and a thin whistle of air.
  shot: (c, o, t) => { tone(c, o, t, 0.2, 0.3, 330, 180, 'triangle'); noise(c, o, t + 0.02, 0.12, 0.2, 'highpass', 2500, 5000); },
  // Teeth: two quick snaps.
  chain: (c, o, t) => { for (const dt of [0, 0.07]) { noise(c, o, t + dt, 0.03, 1, 'bandpass', 2600, 2600, 3); tone(c, o, t + dt, 0.04, 0.12, 190, 120, 'square'); } },
  // Two pieces trading places: a rising whoosh.
  swap: (c, o, t) => { noise(c, o, t, 0.3, 1.2, 'bandpass', 400, 1800, 1.5); },
};

function play(sound: Sound): void {
  if (!enabled) return;
  const c = ctx ??= new AudioContext();
  void c.resume().catch(() => {}); // A browser may keep audio locked until the next gesture.
  sound(c, c.destination, c.currentTime + 0.005);
}

export const snd = Object.fromEntries(
  Object.entries(SOUNDS).map(([name, sound]) => [name, () => play(sound)]),
) as Record<keyof typeof SOUNDS, () => void>;
