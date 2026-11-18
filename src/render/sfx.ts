/** Board sounds and the approved character samples. */
import { P, N, B, R, A, L, G, M, S, O, K, type KingName } from '../rules/engine';
let ctx: AudioContext | null = null;
let enabled = true;
let soundGeneration = 0;
let synthOutput: GainNode | null = null;
const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();
const playingSamples = new Set<AudioBufferSourceNode>();

export function setSound(on: boolean): void {
  if (!on) { soundGeneration++; for (const source of playingSamples) source.stop(); playingSamples.clear(); synthOutput?.disconnect(); synthOutput = null; }
  enabled = on;
}

/** Unlock audio in a page gesture. The old screens keep their sound path. */
export function unlockSound(): void {
  if (enabled) {
    const c = ctx ??= new AudioContext();
    void c.resume().catch(() => {});
    preloadArmour();
  }
}

const samples = {
  knightSelect: 'select-armour-A', pawnSelect: 'select-armour-B',
  knightLeapA: 'knight-leap-A', knightLeapB: 'knight-leap-B',
  knightLandA: 'knight-land-A', knightLandB: 'knight-land-B',
  pawnWalkA: 'select-knight-E', pawnWalkB: 'select-knight-F',
  bishopSelect: 'select-bishop-v2-B', bishopMove: 'select-bishop-v2-A',
  rookSelect: 'select-rook-v2-A', rookMove: 'select-rook-v2-C',
  archerSelect: 'select-archer-B', paladinSelect: 'select-paladin-A',
  guardSelect: 'select-guard-r10-A', maesterSelect: 'select-maester-C',
  beastSelect: 'select-beast-B', ogreSelect: 'select-ogre-B',
  guardMove: 'select-guard-r10-C', maesterMove: 'select-maester-r10-C', ogreMove: 'select-ogre-r10-C',
  flameKingSelect: 'select-flame-r10-A', flameKingMove: 'select-flame-r10-B',
  frostKingSelect: 'select-frost-r10-B', frostKingMove: 'select-frost-r10-A',
  stratusKingSelect: 'select-stratus-r10-B', stratusKingMove: 'select-stratus-r10-A',
  mudKingSelect: 'select-mud-r10-C', mudKingMove: 'select-mud-r10-B',
  spiritKingSelect: 'select-spirit-r10-C', spiritKingMove: 'select-spirit-r10-A',
  shadowKingSelect: 'select-shadow-r10-C', shadowKingMove: 'select-shadow-r10-A',
} as const;
type Sample = keyof typeof samples;
const kingSamples: Record<KingName, { select: Sample; move: Sample }> = {
  Flame: { select: 'flameKingSelect', move: 'flameKingMove' },
  Frost: { select: 'frostKingSelect', move: 'frostKingMove' },
  Stratus: { select: 'stratusKingSelect', move: 'stratusKingMove' },
  Mud: { select: 'mudKingSelect', move: 'mudKingMove' },
  Spirit: { select: 'spiritKingSelect', move: 'spiritKingMove' },
  Shadow: { select: 'shadowKingSelect', move: 'shadowKingMove' },
};
const selectionSamples: Partial<Record<number, Sample>> = {
  [P]: 'pawnSelect', [N]: 'knightSelect', [B]: 'bishopSelect', [R]: 'rookSelect',
  [A]: 'archerSelect', [L]: 'paladinSelect', [G]: 'guardSelect', [M]: 'maesterSelect',
  [S]: 'beastSelect', [O]: 'ogreSelect',
};
export function selectPieceSound(type: number, king?: KingName): void {
  const sound = type === K && king ? kingSamples[king].select : selectionSamples[type];
  if (sound) playArmour(sound);
}
export function movementSample(type: number, king?: KingName): Sample | undefined {
  return type === K && king ? kingSamples[king].move
    : type === B ? 'bishopMove' : type === R ? 'rookMove'
    : type === G ? 'guardMove' : type === M ? 'maesterMove' : type === O ? 'ogreMove' : undefined;
}
const loaded = new Map<Sample, Promise<AudioBuffer>>();
/** Load before play starts; a suspended context does not make sound. */
export function preloadArmour(): void {
  if (!enabled) return;
  const c = ctx ??= new AudioContext();
  for (const name of Object.keys(samples) as Sample[]) void loadSample(c, name).catch(() => {});
}
function loadSample(c: AudioContext, name: Sample): Promise<AudioBuffer> {
  let b = loaded.get(name);
  if (!b) {
    b = fetch(`/audio/armour/${samples[name]}.wav`).then(r => {
      if (!r.ok) throw new Error(`Sound: ${r.status}`);
      return r.arrayBuffer();
    }).then(data => c.decodeAudioData(data)).catch(error => { loaded.delete(name); throw error; });
    loaded.set(name, b);
  }
  return b;
}

export interface SamplePlayback { cancel(): void; finish(): void; done: Promise<void> }
/** Skip a late load so a sound cannot play after its action or after Sound is switched off. */
export function playArmour(name: Sample, loop = false): SamplePlayback {
  let cancelled = false, stopping = false, finishing = false, source: AudioBufferSourceNode | undefined, gain: GainNode | undefined;
  let resolveDone!: () => void; const done = new Promise<void>(resolve => { resolveDone = resolve; });
  const cancel = () => {
    cancelled = true;
    if (!source) { resolveDone(); return; }
    if (!playingSamples.has(source) || stopping) return;
    stopping = true;
    if (gain && ctx) {
      const now = ctx.currentTime; gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + .012); source.stop(now + .012);
    } else source.stop();
  };
  const finish = () => { finishing = true; if (source && !cancelled) source.loop = false; };
  const playback = { cancel, finish, done };
  if (!enabled) { resolveDone(); return playback; }
  const c = ctx ??= new AudioContext(), started = performance.now(), generation = soundGeneration;
  void c.resume().catch(() => {});
  void loadSample(c, name).then(buffer => {
    if (cancelled || !enabled || generation !== soundGeneration || performance.now() - started > 150) { resolveDone(); return; }
    source = c.createBufferSource(); source.buffer = buffer; source.loop = loop && !finishing;
    const exact = name === 'rookMove' || name === 'guardSelect' || name === 'guardMove' || name === 'maesterMove' || name === 'ogreMove' || name.includes('King');
    source.playbackRate.value = exact ? 1 : 1 + (Math.random() - .5) * .06;
    if (loop || name === 'bishopMove') { gain = c.createGain(); gain.connect(c.destination); }
    source.connect(gain ?? c.destination); playingSamples.add(source);
    const active = source; source.onended = () => { playingSamples.delete(active); gain?.disconnect(); resolveDone(); }; source.start();
  }).catch(() => { resolveDone(); });
  return playback;
}

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
  if (!synthOutput) { synthOutput = c.createGain(); synthOutput.connect(c.destination); }
  sound(c, synthOutput, c.currentTime + 0.005);
}

export const snd = Object.fromEntries(
  Object.entries(SOUNDS).map(([name, sound]) => [name, () => play(sound)]),
) as Record<keyof typeof SOUNDS, () => void>;
