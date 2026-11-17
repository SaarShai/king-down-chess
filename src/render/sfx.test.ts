import { expect, it, vi } from 'vitest';
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
