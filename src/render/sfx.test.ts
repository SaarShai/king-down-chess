import { expect, it } from 'vitest';
import { SOUNDS } from './sfx';

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
