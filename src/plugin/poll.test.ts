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
  const runner = runPoll(() => ({ view: view(), read }), undefined, page);
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
    const late = runPoll(() => ({ view: view(), read: pending }), undefined, page); late.stop(); release();
    await vi.advanceTimersByTimeAsync(60000); expect(pending).toHaveBeenCalledTimes(1);
    page.dispatchEvent(new Event('visibilitychange')); await vi.advanceTimersByTimeAsync(60000); expect(read).toHaveBeenCalledTimes(3);
  } finally { runner.stop(); vi.useRealTimers(); }
});


it('reads every three seconds for two minutes after your own move, draw or rematch answer against a person', () => {
  const idle = { handle: null, icon: null, computer: false, deleted: false, last_seen_ms: 600000 };
  const own = (type: 'turn' | 'draw' | 'rematch', ago: number) => [{ seq: 3, seat: 0 as const, at: new Date(Date.parse('2026-10-11T12:00:00.000Z') - ago).toISOString(), action: type === 'turn' ? { type, actions: ['e2-e4'] } : { type, choice: 'offer' as const } }];
  for (const type of ['turn', 'draw', 'rematch'] as const) {
    expect(pollDelay(view({ opponent: idle, last_commands: own(type, 0) }), 0, false)).toBe(3000);
    expect(pollDelay(view({ opponent: idle, last_commands: own(type, 119999) }), 0, false)).toBe(3000);
    expect(pollDelay(view({ opponent: idle, last_commands: own(type, 120000) }), 0, false)).toBe(30000);
  }
  // A draw answer or a rematch offer leaves the turn with you.
  expect(pollDelay(view({ turn: 0, opponent: idle, last_commands: own('draw', 5000) }), 0, false)).toBe(3000);
  // Never faster in a computer game.
  expect(pollDelay(view({ kind: 'solo', last_commands: own('turn', 0) }), 0, false)).toBeUndefined();
});

it('reads a pending draw offer every three seconds, also on your turn', () => {
  expect(pollDelay(view({turn:0,draw_offer:0}), 0, false)).toBe(3000);
  expect(pollDelay(view({turn:0,draw_offer:1}), 0, false)).toBe(3000);
  expect(pollDelay(view({turn:0,draw_offer:null}), 0, false)).toBe(30000);
});

it('F2, F3: a return to the page (visibilitychange and pageshow) starts one fresh read; missed ticks do not run', async () => {
  vi.useFakeTimers();
  const page = Object.assign(new EventTarget(), { hidden: false }), read = vi.fn(async () => {});
  const runner = runPoll(() => ({ view: view(), read }), undefined, page);
  try {
    await vi.advanceTimersByTimeAsync(0); expect(read).toHaveBeenCalledTimes(1);
    page.hidden = true; page.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(120000); expect(read).toHaveBeenCalledTimes(1);
    page.hidden = false; page.dispatchEvent(new Event('pageshow')); page.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0); expect(read).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(29999); expect(read).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1); expect(read).toHaveBeenCalledTimes(3);
  } finally { runner.stop(); vi.useRealTimers(); }
});

it('skips a tick while the gate is closed, reads the current target, and stops every timer and wake at teardown (F4)', async () => {
  vi.useFakeTimers();
  const page = Object.assign(new EventTarget(), { hidden: false }), board = vi.fn(async () => {}), lobby = vi.fn(async () => {});
  let open = false, target: 'board' | 'lobby' | undefined = 'board';
  const runner = runPoll(() => target === 'board' ? { view: view(), read: board } : target === 'lobby' ? { view: view({ speed: 'live' }), read: lobby } : undefined, () => open, page);
  try {
    await vi.advanceTimersByTimeAsync(30000); expect(board).not.toHaveBeenCalled();
    open = true; await vi.advanceTimersByTimeAsync(30000); expect(board).toHaveBeenCalledTimes(1);
    target = 'lobby'; runner.update(); await vi.advanceTimersByTimeAsync(15000); expect(lobby).toHaveBeenCalledTimes(1);
    target = undefined; runner.update(); await vi.advanceTimersByTimeAsync(60000); expect(board.mock.calls.length + lobby.mock.calls.length).toBe(2);
    target = 'board'; runner.stop(); page.dispatchEvent(new Event('pageshow'));
    await vi.advanceTimersByTimeAsync(60000); expect(board).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  } finally { runner.stop(); vi.useRealTimers(); }
});

it('C9: a wait keeps its two-minute clock when the target switches away and back (the computer handoff)', async () => {
  vi.useFakeTimers();
  const page = Object.assign(new EventTarget(), { hidden: false }), read = vi.fn(async () => {});
  const wait = view({ kind: 'random', status: 'waiting' });
  let current: View = wait;
  const runner = runPoll(() => ({ view: current, read }), undefined, page);
  try {
    await vi.advanceTimersByTimeAsync(130000);
    current = view({ game_id: 'solo', kind: 'solo', status: 'setup' }); runner.update();
    current = wait; runner.update();
    const before = read.mock.calls.length;
    await vi.advanceTimersByTimeAsync(25000); expect(read.mock.calls.length - before).toBeLessThanOrEqual(2);
  } finally { runner.stop(); vi.useRealTimers(); }
});
