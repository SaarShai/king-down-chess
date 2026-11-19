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
    destination = {}; state = 'running'; resume() { return Promise.resolve(); }
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
    destination = {}; state = 'running'; currentTime = 2; resume() { return Promise.resolve(); }
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
    destination = {}; state = 'running'; currentTime = 2; resume() { return Promise.resolve(); }
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
    destination = {}; state = 'running'; currentTime = 0; resume() { return Promise.resolve(); }
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
    destination = {}; state = 'running'; resume() { return Promise.resolve(); }
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
    destination = {}; state = 'running'; currentTime = 0; resume() { return Promise.resolve(); }
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
    destination = {}; state = 'running'; currentTime = 0; resume() { return Promise.resolve(); }
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

it('fault 1: with no audio context the sound calls return and the game continues', async () => {
  for (const missing of [undefined, class { constructor() { throw new Error('blocked'); } }]) {
    vi.resetModules(); vi.stubGlobal('AudioContext', missing);
    try {
      const sfx = await import('./sfx'); sfx.setSound(true);
      expect(() => { sfx.unlockSound(); sfx.preloadArmour(); sfx.selectPieceSound(P); sfx.snd.move(); sfx.stopSelection(); }).not.toThrow();
      await sfx.playArmour('rookMove', true).done;
    } finally { vi.unstubAllGlobals(); }
  }
});

it('fault 4: a hidden page starts no character cue, also one that was loading when the page hid', async () => {
  vi.resetModules();
  let decode!: (buffer: AudioBuffer) => void;
  const start = vi.fn(), page = { hidden: true };
  vi.stubGlobal('document', page);
  vi.stubGlobal('AudioContext', class {
    destination = {}; state = 'running'; resume() { return Promise.resolve(); }
    decodeAudioData() { return new Promise<AudioBuffer>(resolve => { decode = resolve; }); }
    createBufferSource() { return { playbackRate: { value: 1 }, connect() {}, start, stop() {} }; }
  });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })));
  try {
    const { playArmour, selectPieceSound, setSound } = await import('./sfx'); setSound(true);
    await playArmour('pawnWalkA').done; expect(fetch).not.toHaveBeenCalled();
    page.hidden = false; selectPieceSound(N); await vi.waitFor(() => expect(decode).toBeDefined());
    page.hidden = true; decode({} as AudioBuffer); await new Promise(resolve => setTimeout(resolve, 0));
    expect(start).not.toHaveBeenCalled(); setSound(false);
  } finally { vi.unstubAllGlobals(); }
});

it('fault 5: a suspended context, a stalled file or a failed start leaves no queued sound', async () => {
  vi.resetModules(); vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  let state = 'suspended', fail = false, stalled = true;
  const start = vi.fn(() => { if (fail) throw new Error('start'); }), disconnect = vi.fn();
  vi.stubGlobal('AudioContext', class {
    destination = {}; get state() { return state; }
    resume() { return state === 'running' ? Promise.resolve() : new Promise<void>(() => {}); }
    decodeAudioData() { return Promise.resolve({} as AudioBuffer); }
    createBufferSource() { return { playbackRate: { value: 1 }, connect() {}, disconnect, start, stop: vi.fn() }; }
    createGain() { return { gain: { value: 1 }, connect() {}, disconnect }; }
  });
  vi.stubGlobal('fetch', vi.fn(() => stalled ? new Promise(() => {}) : Promise.resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })));
  try {
    const { playArmour, setSound } = await import('./sfx'); setSound(true);
    // A stalled file: the cue ends at its 150 ms deadline, and the shared load clears at its own deadline.
    const late = playArmour('rookMove'); await vi.advanceTimersByTimeAsync(150); await late.done;
    await vi.advanceTimersByTimeAsync(15_000); stalled = false;
    // A suspended context: the decoded cue does not start and does not wait for a later resume.
    const quiet = playArmour('rookMove'); await vi.advanceTimersByTimeAsync(150); await quiet.done;
    expect(fetch).toHaveBeenCalledTimes(2); expect(start).not.toHaveBeenCalled();
    // A start that throws disconnects its nodes and leaves nothing for Sound Off to stop.
    state = 'running'; fail = true; await playArmour('rookMove', true).done;
    expect(start).toHaveBeenCalledOnce(); expect(disconnect).toHaveBeenCalledTimes(2);
    fail = false; await vi.advanceTimersByTimeAsync(0); setSound(false);
  } finally { vi.useRealTimers(); vi.unstubAllGlobals(); }
});

it('maps Daylight mark and knock to the approved recordings', async () => {
  vi.resetModules();
  const start = vi.fn();
  const fetcher = vi.fn(async (_url: string) => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }));
  vi.stubGlobal('fetch', fetcher);
  vi.stubGlobal('AudioContext', class {
    destination = {}; state = 'running'; resume() { return Promise.resolve(); }
    decodeAudioData() { return Promise.resolve({} as AudioBuffer); }
    createBufferSource() { return { playbackRate: { value: 1 }, connect() {}, start, stop() {} }; }
  });
  try {
    const { playDaylightSound, setSound } = await import('./sfx');
    setSound(true);
    playDaylightSound('mark', { piece: B });
    playDaylightSound('mark', { piece: K, king: 'Shadow' });
    playDaylightSound('mark', { piece: Q });
    playDaylightSound('knock', { piece: N });
    playDaylightSound('knock', { piece: N });
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(4));
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      '/audio/armour/select-bishop-v2-B.wav', '/audio/armour/select-shadow-r10-A.wav',
      '/audio/armour/knight-land-A.wav', '/audio/armour/knight-land-B.wav',
    ]);
    setSound(false);
    playDaylightSound('mark', { piece: P });
    expect(fetcher).toHaveBeenCalledTimes(4);
  } finally { vi.unstubAllGlobals(); }
});

it('plays the ten stand-ins from Web Audio and keeps three unused names silent', async () => {
  vi.resetModules();
  const param = () => ({ value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  const output = { gain: param(), connect() {}, disconnect: vi.fn() };
  const start = vi.fn(), frequency = param();
  vi.stubGlobal('AudioContext', class {
    destination = {}; currentTime = 1; sampleRate = 8; resume() { return Promise.resolve(); }
    createGain() { return output; }
    createOscillator() { return { frequency, connect() {}, start, stop() {} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(8) }; }
    createBufferSource() { return { connect: (node: AudioNode) => node, start, stop() {} }; }
    createBiquadFilter() { return { frequency, Q: param(), connect() {} }; }
  });
  const random = vi.spyOn(Math, 'random').mockReturnValue(.5);
  try {
    const { playDaylightSound, setSound } = await import('./sfx');
    setSound(true);
    playDaylightSound('tick');
    expect(frequency.setValueAtTime.mock.calls).toEqual([[3200, 1.005], [1500, 1.005]]);
    expect(frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(1100, expect.closeTo(1.039));
    for (const name of ['press', 'ting', 'clink', 'pass', 'arrive', 'fire', 'rewind', 'no', 'lift'] as const) {
      start.mockClear();
      playDaylightSound(name);
      expect(start).toHaveBeenCalled();
    }
    start.mockClear();
    for (const name of ['whoosh', 'wind', 'ice'] as const) playDaylightSound(name);
    expect(start).not.toHaveBeenCalled();
    setSound(false);
    playDaylightSound('fire');
    expect(start).not.toHaveBeenCalled();
    expect(output.disconnect).toHaveBeenCalledOnce();
  } finally { random.mockRestore(); vi.unstubAllGlobals(); }
});
