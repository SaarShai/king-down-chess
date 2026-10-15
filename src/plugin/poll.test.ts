import { expect, it, vi } from 'vitest';
import type { View } from '../match/protocol';
import { pollDelay, runPoll } from './poll';
const view = (change: Partial<View> = {}) => ({ game_id: 'g1', kind: 'friend', status: 'playing', speed: 'daily', turn: 1, seat: 0, opponent: { last_seen_ms: null }, last_commands: [], server_now: '2026-10-11T12:00:00.000Z', ...change }) as View;

it('uses the wait and game schedule, with the owner’s recent-opponent rule', () => {
  expect(pollDelay('waiting for a join', 0, false)).toBe(5000);
  expect(pollDelay(view({ status: 'waiting', kind: 'random' }), 119999, false)).toBe(5000);
  expect(pollDelay(view({ status: 'waiting' }), 120000, false)).toBe(15000);
  expect(pollDelay(view({ status: 'setup' }), 0, false)).toBe(5000);
  expect(pollDelay(view(), 0, false)).toBe(30000);
  expect(pollDelay(view({ speed: 'live' }), 0, false)).toBe(15000);
  expect(pollDelay(view({ speed: 'live', turn: 0 }), 0, false)).toBe(15000);
  expect(pollDelay(view({ opponent: { handle: null, icon: null, computer: false, deleted: false, last_seen_ms: 119999 } }), 0, false)).toBe(3000);
  expect(pollDelay(view({ opponent: { handle: null, icon: null, computer: false, deleted: false, last_seen_ms: 120000 } }), 0, false)).toBe(30000);
  expect(pollDelay(view({ last_commands: [
    { seq: 1, seat: 1, at: '2026-10-11T11:58:00.001Z', action: { type: 'join' } },
    { seq: 2, seat: 0, at: '2026-10-11T12:00:00.000Z', action: { type: 'join' } },
  ] }), 0, false)).toBe(3000);
  expect(pollDelay(view({ last_commands: [{ seq: 2, seat: 0, at: '2026-10-11T12:00:00.000Z', action: { type: 'join' } }] }), 0, false)).toBe(30000);
  for (const current of [view({ kind: 'solo' }), view({ status: 'finished' }), view({ status: 'aborted' }), undefined]) expect(pollDelay(current, 0, false)).toBeUndefined();
  expect(pollDelay(view(), 0, true)).toBeUndefined();
});

it('polls an inactive opponent in a live human game every 15 seconds', () => {
  const opponent = { handle:null, icon:null, computer:false, deleted:false, last_seen_ms:120000 };
  expect(pollDelay(view({speed:'live',opponent}), 0, false)).toBe(15000);
  expect(pollDelay(view({speed:'live',opponent:{...opponent,last_seen_ms:null}}), 0, false)).toBe(15000);
});

it('reads at mount and visibility, and stops on hide and teardown', async () => {
  vi.useFakeTimers();
  const page = Object.assign(new EventTarget(), { hidden: false }), read = vi.fn(async () => {});
  const runner = runPoll(() => view(), read, page);
  try {
    await vi.advanceTimersByTimeAsync(0); expect(read).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(30000); expect(read).toHaveBeenCalledTimes(2);
    page.hidden = true; page.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(60000); expect(read).toHaveBeenCalledTimes(2);
    page.hidden = false; page.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0); expect(read).toHaveBeenCalledTimes(3);
    runner.stop(); await vi.advanceTimersByTimeAsync(60000); expect(read).toHaveBeenCalledTimes(3);
    let release!: () => void;
    const pending = vi.fn(() => new Promise<void>(resolve => { release = resolve; }));
    const late = runPoll(() => view(), pending, page); late.stop(); release();
    await vi.advanceTimersByTimeAsync(60000); expect(pending).toHaveBeenCalledTimes(1);
    page.dispatchEvent(new Event('visibilitychange')); await vi.advanceTimersByTimeAsync(60000); expect(read).toHaveBeenCalledTimes(3);
  } finally { runner.stop(); vi.useRealTimers(); }
});


it('reads a pending draw offer every three seconds, also on your turn', () => {
  expect(pollDelay(view({turn:0,draw_offer:0}), 0, false)).toBe(3000);
  expect(pollDelay(view({turn:0,draw_offer:1}), 0, false)).toBe(3000);
  expect(pollDelay(view({turn:0,draw_offer:null}), 0, false)).toBe(30000);
});
