/** Board sounds and the approved character samples. */
import { P, N, B, R, A, L, G, M, S, O, K, type KingName } from '../rules/engine';
import type { SoundName, SoundOptions } from '../interface/play/fx';

declare const __KINGDOWN_ARMOUR_MODULE__: string;
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

/** The page's audio context, or null with Sound off or with no audio: the game then continues silent. */
function audio(): AudioContext | null {
  if (!enabled) return null;
  try { return ctx ??= new AudioContext(); } catch { return null; }
}
const hidden = () => typeof document !== 'undefined' && document.hidden;

/** Unlock audio in a page gesture. The old screens keep their sound path. */
export function unlockSound(): void {
  const c = audio();
  if (c) { void c.resume().catch(() => {}); preloadArmour(); }
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
const selections = new Set<SamplePlayback>();
const selectionSample = (type: number, king?: KingName): Sample | undefined =>
  type === K && king ? kingSamples[king].select : selectionSamples[type];

function playSelection(sample: Sample, options?: SoundOptions): void {
  const cue = playArmour(sample, false, options);
  selections.add(cue);
  void cue.done.then(() => selections.delete(cue));
}

export function selectPieceSound(type: number, king?: KingName): void {
  const sample = selectionSample(type, king);
  if (sample) playSelection(sample);
}
/** Stop the selection cues that play or still load. */
export function stopSelection(): void { for (const cue of selections) cue.cancel(); selections.clear(); }
export function movementSample(type: number, king?: KingName): Sample | undefined {
  return type === K && king ? kingSamples[king].move
    : type === B ? 'bishopMove' : type === R ? 'rookMove'
    : type === G ? 'guardMove' : type === M ? 'maesterMove' : type === O ? 'ogreMove' : undefined;
}
const loaded = new Map<Sample, Promise<AudioBuffer>>();
const armourModule = typeof __KINGDOWN_ARMOUR_MODULE__ === 'undefined' ? undefined : __KINGDOWN_ARMOUR_MODULE__;
const LOAD_MS = 15_000, CUE_MS = 150;
/** Reject after `ms`. The caller clears the timer. */
const deadline = (ms: number, set: (timer: ReturnType<typeof setTimeout>) => void) =>
  new Promise<never>((_, reject) => set(setTimeout(() => reject(new Error('Sound: late')), ms)));
/** Load before play starts; a suspended context does not make sound. */
export function preloadArmour(): void {
  const c = audio();
  if (c) for (const name of Object.keys(samples) as Sample[]) void loadSample(c, name).catch(() => {});
}
/** One shared load for each file. A failed or stalled load clears, so a later cue loads the file again. */
function loadSample(c: AudioContext, name: Sample): Promise<AudioBuffer> {
  let b = loaded.get(name);
  if (!b) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // The widget can import static assets from its declared origin.
    const file = samples[name];
    const bytes = armourModule
      ? import(/* @vite-ignore */ armourModule).then(({ default: wav }) => Uint8Array.from(atob(wav[file]), c => c.charCodeAt(0)).buffer)
      : fetch(`/audio/armour/${file}.wav`).then(r => {
        if (!r.ok) throw new Error(`Sound: ${r.status}`);
        return r.arrayBuffer();
      });
    b = Promise.race([bytes.then(data => c.decodeAudioData(data)), deadline(LOAD_MS, t => { timer = t; })])
      .finally(() => clearTimeout(timer)).catch(error => { loaded.delete(name); throw error; });
    loaded.set(name, b);
  }
  return b;
}

export interface SamplePlayback { cancel(): void; finish(): void; done: Promise<void> }
/** Skip a late load so a sound cannot play after its action or after Sound is switched off. */
export function playArmour(name: Sample, loop = false, { pitch = 1, volume = 1 } = {}): SamplePlayback {
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
  const c = audio();
  if (!c || hidden()) { resolveDone(); return playback; }
  const generation = soundGeneration;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Start only a current cue on a running context, within CUE_MS: a late or suspended cue stays silent.
  void Promise.race([Promise.all([loadSample(c, name), c.resume()]), deadline(CUE_MS, t => { timer = t; })]).then(([buffer]) => {
    if (cancelled || !enabled || generation !== soundGeneration || c.state !== 'running' || hidden()) { resolveDone(); return; }
    source = c.createBufferSource(); source.buffer = buffer; source.loop = loop && !finishing;
    const exact = name === 'rookMove' || name === 'guardSelect' || name === 'guardMove' || name === 'maesterMove' || name === 'ogreMove' || name.includes('King');
    source.playbackRate.value = pitch * (exact ? 1 : 1 + (Math.random() - .5) * .06);
    if (loop || name === 'bishopMove' || volume !== 1) {
      gain = c.createGain(); gain.gain.value = volume; gain.connect(c.destination);
    }
    source.connect(gain ?? c.destination);
    const active = source; source.onended = () => { playingSamples.delete(active); gain?.disconnect(); resolveDone(); };
    source.start(); playingSamples.add(source);
  }).catch(() => { source?.disconnect(); gain?.disconnect(); source = undefined; resolveDone(); }).finally(() => clearTimeout(timer));
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

/** A gain envelope with a 4 ms attack unless the recipe gives a linear attack time. */
function envelope(c: BaseAudioContext, out: AudioNode, t: number, dur: number, peak: number, attack?: number): GainNode {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  if (attack === undefined) g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
  else g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(out);
  return g;
}

function tone(c: BaseAudioContext, out: AudioNode, t: number, dur: number, peak: number, from: number, to = from, type: OscillatorType = 'sine', attack?: number): void {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  if (to !== from) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  o.connect(envelope(c, out, t, dur, peak, attack));
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(c: BaseAudioContext, out: AudioNode, t: number, dur: number, peak: number, filter: BiquadFilterType, from: number, to = from, q = 1, attack?: number): void {
  const s = c.createBufferSource();
  s.buffer = noiseBuffer(c);
  const f = c.createBiquadFilter();
  f.type = filter;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  if (to !== from) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  s.connect(f).connect(envelope(c, out, t, dur, peak, attack));
  s.start(t);
  s.stop(t + dur + 0.02);
}

type Sound = (c: BaseAudioContext, out: AudioNode, t: number, pitch?: number) => void;

/** Each sound draws on (context, destination, start time), so tools can render them offline. */
export const SOUNDS: Record<'move' | 'capture' | 'check' | 'shove' | 'shot' | 'chain' | 'swap', Sound> = {
  // A piece set down on stone: a short knock and a low body.
  move: (c, o, t, pitch = 1) => { noise(c, o, t, 0.05, 1, 'bandpass', 1700 * pitch, 1700 * pitch, 2.5); tone(c, o, t, 0.07, 0.3, 210 * pitch, 170 * pitch); },
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

function play(sound: Sound, pitch = 1, volume = 1): void {
  const c = audio();
  if (!c) return;
  void c.resume().catch(() => {}); // A browser may keep audio locked until the next gesture.
  if (!synthOutput) { synthOutput = c.createGain(); synthOutput.connect(c.destination); }
  let out = synthOutput;
  if (volume !== 1) {
    out = c.createGain(); out.gain.value = volume; out.connect(synthOutput);
  }
  sound(c, out, c.currentTime + 0.005, pitch);
}

export const snd = Object.fromEntries(
  Object.entries(SOUNDS).map(([name, sound]) => [name, () => play(sound)]),
) as Record<keyof typeof SOUNDS, () => void>;

function bell(c: BaseAudioContext, out: AudioNode, t: number, hz: number, peak: number, decay: number): void {
  for (const [i, [ratio, gain]] of [[1, 1], [2.76, .45], [5.4, .22], [8.93, .1]].entries()) {
    tone(c, out, t, .002 + decay / (1 + .7 * i), peak * gain, hz * ratio, hz * ratio, 'sine', .002);
  }
}

type DaylightSource = Sound | { standIn: Sound } | {
  sample(options: SoundOptions): Sample | undefined;
  fallback?: Sound;
} | null;

let landB = false;
function landingSample({ piece }: SoundOptions): Sample | undefined {
  if (piece !== N) return;
  landB = !landB;
  return landB ? 'knightLandA' : 'knightLandB';
}

/** Replace each stand-in with an approved recording when it is ready. */
const daylightSounds: Record<SoundName, DaylightSource> = {
  mark: { sample: ({ piece, king }) => piece === undefined ? undefined : selectionSample(piece, king) },
  knock: { sample: landingSample, fallback: SOUNDS.move },
  impact: SOUNDS.capture,
  check: SOUNDS.check,
  tick: { standIn: (c, o, t, p = 1) => {
    noise(c, o, t, .021, .10, 'highpass', 3200, 3200, 1, .003);
    tone(c, o, t, .034, .08, 1500 * p, 1100 * p, 'sine', .004);
  } },
  press: { standIn: (c, o, t, p = 1) => {
    tone(c, o, t, .074, .34, 170 * p, 95, 'sine', .004);
    noise(c, o, t, .033, .14, 'lowpass', 900, 900, 1, .003);
  } },
  ting: { standIn: (c, o, t, p = 1) => {
    bell(c, o, t, 990 * p, .17, .55);
    bell(c, o, t + .045, 1320 * p, .09, .4);
    noise(c, o, t, .023, .06, 'highpass', 5000, 5000, 1, .003);
  } },
  clink: { standIn: (c, o, t, p = 1) => {
    bell(c, o, t, 1650 * p, .09, .16);
    noise(c, o, t, .015, .07, 'highpass', 4000, 4000, 1, .003);
  } },
  pass: { standIn: (c, o, t, p = 1) => {
    noise(c, o, t, .26, .07, 'bandpass', 1800, 4200, 3, .06);
    tone(c, o, t + .02, .27, .07, 660 * p, 990 * p, 'sine', .05);
  } },
  arrive: { standIn: (c, o, t, p = 1) => bell(c, o, t, 780 * p, .1, .35) },
  fire: { standIn: (c, o, t) => {
    noise(c, o, t, .56, .34, 'lowpass', 260, 1100, 1, .06);
    for (let i = 0; i < 7; i++) {
      const hz = 1500 + Math.random() * 2500;
      noise(c, o, t + .08 + Math.random() * .45, .015, .16, 'bandpass', hz, hz, 4, .003);
    }
  } },
  rewind: { standIn: (c, o, t, p = 1) => {
    tone(c, o, t, .23, .12, 880 * p, 300 * p, 'triangle', .01);
    noise(c, o, t, .22, .08, 'bandpass', 3000, 700, 2, .02);
  } },
  no: { standIn: (c, o, t, p = 1) => {
    tone(c, o, t, .074, .26, 150 * p, 110, 'sine', .004);
    tone(c, o, t + .085, .094, .24, 124 * p, 92, 'sine', .004);
  } },
  lift: { standIn: (c, o, t, p = 1) => {
    noise(c, o, t, .09, .07, 'bandpass', 1400 * p, 2600 * p, 1.5, .02);
    tone(c, o, t, .09, .05, 520 * p, 700 * p, 'sine', .01);
  } },
  whoosh: null,
  wind: null,
  ice: null,
};

export function playDaylightSound(name: SoundName, options: SoundOptions = {}): void {
  const source = daylightSounds[name];
  const { volume = 1, pitch = 1 } = options;
  if (!enabled || !source || volume <= 0 || hidden()) return;
  if (typeof source === 'function') play(source, pitch, volume);
  else if ('standIn' in source) {
    const variation = 2 ** ((Math.random() - .5) * 70 / 1200);
    play(source.standIn, pitch * variation, volume * .5);
  } else {
    const sample = source.sample(options);
    if (sample && name === 'mark') playSelection(sample, options);
    else if (sample) playArmour(sample, false, options);
    else if (source.fallback) play(source.fallback, pitch, volume);
  }
}
