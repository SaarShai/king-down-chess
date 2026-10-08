import { describe, expect, it, vi } from 'vitest';
import { copyText } from './clipboard';

/** A clipboard whose write waits until the test settles it. */
const pending = () => {
  let settle!: (ok: boolean) => void;
  const write = new Promise<void>((resolve, reject) => { settle = ok => (ok ? resolve() : reject(new Error('Refused'))); });
  return { clipboard: { writeText: vi.fn(() => write) }, settle };
};

describe('copyText', () => {
  it('answers only after the clipboard write ends, and true when it succeeds', async () => {
    const { clipboard, settle } = pending(), fallback = vi.fn(() => true);
    let answer: boolean | undefined;
    const copy = copyText('1. e2-e4', clipboard, fallback).then(ok => { answer = ok; });
    await Promise.resolve();
    expect(answer).toBeUndefined(); // the write still waits: no answer yet
    settle(true);
    await copy;
    expect([answer, clipboard.writeText.mock.calls, fallback.mock.calls.length]).toEqual([true, [['1. e2-e4']], 0]);
  });

  it('tries the fallback once when the clipboard refuses, and gives its outcome', async () => {
    for (const result of [true, false]) {
      const { clipboard, settle } = pending(), fallback = vi.fn(() => result);
      const copy = copyText('a link', clipboard, fallback);
      settle(false);
      expect(await copy).toBe(result);
      expect(fallback.mock.calls).toEqual([['a link']]);
    }
  });

  it('uses the fallback when there is no clipboard', async () => {
    const fallback = vi.fn(() => false);
    expect(await copyText('a result', null, fallback)).toBe(false);
    expect(fallback).toHaveBeenCalledOnce();
  });
});
