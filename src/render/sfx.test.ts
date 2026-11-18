import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { P, N, B, R, A, L, G, M, S, O, Q, K } from '../rules/engine';
import { SOUNDS, setSound, unlockSound } from './sfx';

it('sounds check as one low note with a 220 Hz partial', () => {
  const tones: { type: string; start: number; frequencies: number[] }[] = [];
  const context = {
    createOscillator() {
      const tone = { type: 'sine', start: -1, frequencies: [] as number[] };
      tones.push(tone);
      return {
        get type() { return tone.type; },
        set type(value: string) { tone.type = value; },
        frequency: {
          setValueAtTime(value: number) { tone.frequencies.push(value); },
          exponentialRampToValueAtTime(value: number) { tone.frequencies.push(value); },
        },
        connect() {}, start(time: number) { tone.start = time; }, stop() {},
      };
    },
    createGain() {
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    },
  } as unknown as BaseAudioContext;
  SOUNDS.check(context, {} as AudioNode, 3);
  expect(tones).toEqual([
    { type: 'triangle', start: 3, frequencies: [110, 98] },
    { type: 'sine', start: 3, frequencies: [220] },
  ]);
});

it('unlocks one audio context only when sound is on', () => {
  const resume = vi.fn(() => Promise.resolve()), make = vi.fn();
  vi.stubGlobal('AudioContext', class { constructor() { make(); } resume = resume; });
  setSound(false); unlockSound(); expect(make).not.toHaveBeenCalled();
  setSound(true); unlockSound(); unlockSound(); expect(make).toHaveBeenCalledOnce(); expect(resume).toHaveBeenCalledTimes(2);
  setSound(false); unlockSound(); expect(resume).toHaveBeenCalledTimes(2); vi.unstubAllGlobals();
});

it('does not play a delayed sample after sound is switched off and on', async () => {
  vi.resetModules();
  let decode!: (buffer: AudioBuffer) => void;
  const start = vi.fn(), stop = vi.fn();
  vi.stubGlobal('AudioContext', class {
    destination = {}; resume() { return Promise.resolve(); }
    decodeAudioData() { return new Promise<AudioBuffer>(resolve => { decode = resolve; }); }
    createBufferSource() { return { buffer: null, playbackRate: { value: 1 }, connect() {}, start, stop }; }
  });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })));
  try {
    const { playArmour, setSound } = await import('./sfx');
    setSound(true); playArmour('pawnSelect');
    await vi.waitFor(() => expect(decode).toBeDefined());
    setSound(false); setSound(true); decode({} as AudioBuffer);
    await vi.waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledOnce());
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(start).not.toHaveBeenCalled();
    playArmour('pawnSelect'); await vi.waitFor(() => expect(start).toHaveBeenCalledOnce());
    setSound(false); playArmour('pawnSelect'); await Promise.resolve();
    expect(start).toHaveBeenCalledOnce(); expect(stop).toHaveBeenCalledOnce();
  } finally { vi.unstubAllGlobals(); }
});

it('cancels a pending loop and fades an active loop on stop', async () => {
  vi.resetModules();
  let decode!: (buffer: AudioBuffer) => void;
  const start = vi.fn(), stop = vi.fn(), fade = vi.fn(), sources: { loop: boolean }[] = [];
  vi.stubGlobal('AudioContext', class {
    destination = {}; currentTime = 2; resume() { return Promise.resolve(); }
    decodeAudioData() { return new Promise<AudioBuffer>(resolve => { decode = resolve; }); }
    createBufferSource() { const source = { buffer: null, loop: false, playbackRate: { value: 1 }, connect() {}, start, stop }; sources.push(source); return source; }
    createGain() { return { gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: fade }, connect() {}, disconnect() {} }; }
  });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })));
  try {
    const { playArmour, setSound } = await import('./sfx');
    setSound(true); const cancel = playArmour('rookMove', true);
    await vi.waitFor(() => expect(decode).toBeDefined());
    cancel.cancel(); decode({} as AudioBuffer); await new Promise(resolve => setTimeout(resolve, 0));
    expect(start).not.toHaveBeenCalled();
    const end = playArmour('rookMove', true); await vi.waitFor(() => expect(start).toHaveBeenCalledOnce());
    expect(sources[0].loop).toBe(true); end.cancel(); end.cancel();
    expect(fade).toHaveBeenCalledWith(0, 2.012); expect(stop).toHaveBeenCalledOnce();
    setSound(false); expect(stop).toHaveBeenCalledTimes(2);
  } finally { vi.unstubAllGlobals(); }
});

it('finishes the current recording without a new repeat or an early stop', async () => {
  vi.resetModules();
  let decode!: (buffer: AudioBuffer) => void;
  const stop = vi.fn(), sources: { loop: boolean; onended?: () => void }[] = [];
  vi.stubGlobal('AudioContext', class {
    destination = {}; currentTime = 2; resume() { return Promise.resolve(); }
    decodeAudioData() { return new Promise<AudioBuffer>(resolve => { decode = resolve; }); }
    createBufferSource() { const source = { loop: false, playbackRate: { value: 1 }, connect() {}, start() {}, stop, onended: undefined as (() => void) | undefined }; sources.push(source); return source; }
    createGain() { return { gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })));
  try {
    const { playArmour, setSound } = await import('./sfx'); setSound(true);
    const pending = playArmour('rookMove', true); await vi.waitFor(() => expect(decode).toBeDefined());
    pending.finish(); decode({} as AudioBuffer); await vi.waitFor(() => expect(sources).toHaveLength(1));
    expect(sources[0].loop).toBe(false); expect(stop).not.toHaveBeenCalled();
    sources[0].onended?.(); await pending.done;
    const playing = playArmour('rookMove', true); await vi.waitFor(() => expect(sources).toHaveLength(2));
    expect(sources[1].loop).toBe(true); playing.finish();
    expect(sources[1].loop).toBe(false); expect(stop).not.toHaveBeenCalled();
    sources[1].onended?.(); await playing.done; setSound(false);
  } finally { vi.unstubAllGlobals(); }
});

it('keeps the approved Rook C recording unchanged', () => {
  const wave = readFileSync(new URL('../../public/audio/armour/select-rook-v2-C.wav', import.meta.url));
  expect(createHash('sha256').update(wave).digest('hex')).toBe('ce30b070a945047d05216a569149fe1d7b8fc69aca5a3b58f5119011869e5096');
});

it('plays Rook C at its original speed for both loop and single play', async () => {
  vi.resetModules();
  const sources: { loop: boolean; playbackRate: { value: number } }[] = [];
  vi.stubGlobal('AudioContext', class {
    destination = {}; currentTime = 0; resume() { return Promise.resolve(); }
    decodeAudioData() { return Promise.resolve({} as AudioBuffer); }
    createBufferSource() { const source = { loop: false, playbackRate: { value: 0 }, connect() {}, start() {}, stop() {} }; sources.push(source); return source; }
    createGain() { return { gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })));
  const random = vi.spyOn(Math, 'random').mockReturnValue(0);
  try {
    const { playArmour, setSound } = await import('./sfx'); setSound(true);
    playArmour('rookMove', true); playArmour('rookMove');
    await vi.waitFor(() => expect(sources).toHaveLength(2));
    expect(sources.map(source => [source.loop, source.playbackRate.value])).toEqual([[true, 1], [false, 1]]);
    setSound(false);
  } finally { random.mockRestore(); vi.unstubAllGlobals(); }
});

it('maps each approved piece selection to its chosen file and respects mute', async () => {
  vi.resetModules();
  const start = vi.fn(), fetcher = vi.fn(async (_url: string) => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }));
  vi.stubGlobal('AudioContext', class {
    destination = {}; resume() { return Promise.resolve(); }
    decodeAudioData() { return Promise.resolve({} as AudioBuffer); }
    createBufferSource() { return { playbackRate: { value: 1 }, connect() {}, start, stop() {} }; }
  });
  vi.stubGlobal('fetch', fetcher);
  try {
    const { selectPieceSound, setSound } = await import('./sfx'); setSound(true);
    for (const type of [P, N, B, R, A, L, G, M, S, O, Q, K]) selectPieceSound(type);
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(10));
    expect(fetcher.mock.calls.map(call => call[0])).toEqual([
      '/audio/armour/select-armour-B.wav', '/audio/armour/select-armour-A.wav',
      '/audio/armour/select-bishop-v2-B.wav', '/audio/armour/select-rook-v2-A.wav',
      '/audio/armour/select-archer-B.wav', '/audio/armour/select-paladin-A.wav',
      '/audio/armour/select-guard-r10-A.wav', '/audio/armour/select-maester-C.wav',
      '/audio/armour/select-beast-B.wav', '/audio/armour/select-ogre-B.wav',
    ]);
    setSound(false); selectPieceSound(A); await Promise.resolve(); expect(start).toHaveBeenCalledTimes(10);
  } finally { vi.unstubAllGlobals(); }
});

it('maps all six kings to the approved selection and movement files', async () => {
  vi.resetModules();
  const start = vi.fn(), fetcher = vi.fn(async (_url: string) => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }));
  vi.stubGlobal('AudioContext', class {
    destination = {}; currentTime = 0; resume() { return Promise.resolve(); }
    decodeAudioData() { return Promise.resolve({} as AudioBuffer); }
    createBufferSource() { return { playbackRate: { value: 1 }, connect() {}, start, stop() {} }; }
    createGain() { return { gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  });
  vi.stubGlobal('fetch', fetcher);
  try {
    const { selectPieceSound, movementSample, playArmour, setSound } = await import('./sfx'); setSound(true);
    const names = ['Flame', 'Frost', 'Stratus', 'Mud', 'Spirit', 'Shadow'] as const;
    for (const name of names) { selectPieceSound(K, name); playArmour(movementSample(K, name)!, true); }
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(12));
    expect(fetcher.mock.calls.map(call => call[0])).toEqual([
      '/audio/armour/select-flame-r10-A.wav', '/audio/armour/select-flame-r10-B.wav',
      '/audio/armour/select-frost-r10-B.wav', '/audio/armour/select-frost-r10-A.wav',
      '/audio/armour/select-stratus-r10-B.wav', '/audio/armour/select-stratus-r10-A.wav',
      '/audio/armour/select-mud-r10-C.wav', '/audio/armour/select-mud-r10-B.wav',
      '/audio/armour/select-spirit-r10-C.wav', '/audio/armour/select-spirit-r10-A.wav',
      '/audio/armour/select-shadow-r10-C.wav', '/audio/armour/select-shadow-r10-A.wav',
    ]);
    expect([G, M, O].map(type => movementSample(type))).toEqual(['guardMove', 'maesterMove', 'ogreMove']);
    setSound(false);
  } finally { vi.unstubAllGlobals(); }
});

it('uses the natural playback rate for every new approved sound', async () => {
  vi.resetModules();
  const rates: { value: number }[] = [];
  vi.stubGlobal('AudioContext', class {
    destination = {}; currentTime = 0; resume() { return Promise.resolve(); }
    decodeAudioData() { return Promise.resolve({} as AudioBuffer); }
    createBufferSource() { const playbackRate = { value: 0 }; rates.push(playbackRate); return { playbackRate, connect() {}, start() {}, stop() {} }; }
    createGain() { return { gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })));
  const random = vi.spyOn(Math, 'random').mockReturnValue(0);
  try {
    const { playArmour, setSound } = await import('./sfx'); setSound(true);
    const names = ['guardSelect', 'guardMove', 'maesterMove', 'ogreMove', 'flameKingSelect', 'flameKingMove', 'frostKingSelect', 'frostKingMove', 'stratusKingSelect', 'stratusKingMove', 'mudKingSelect', 'mudKingMove', 'spiritKingSelect', 'spiritKingMove', 'shadowKingSelect', 'shadowKingMove'] as const;
    for (const name of names) playArmour(name);
    await vi.waitFor(() => expect(rates).toHaveLength(names.length));
    expect(rates.map(rate => rate.value)).toEqual(names.map(() => 1)); setSound(false);
  } finally { random.mockRestore(); vi.unstubAllGlobals(); }
});
