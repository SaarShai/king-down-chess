import { expect, it, vi } from 'vitest';
import type { View } from '../match/protocol';
import { pollDelay, pollSince, runPoll, type PollTarget } from './poll';
const view = (change: Partial<View> = {}) => ({ game_id: 'g1', kind: 'friend', status: 'playing', speed: 'daily', turn: 1, seat: 0, opponent: { last_seen_ms: null }, last_commands: [], server_now: '2026-10-11T12:00:00.000Z', ...change }) as View;

it('keeps a visible solo setup and either turn current across hosts', () => {
  expect(pollDelay(view({ kind: 'solo', status: 'setup' }), 0, false)).toBe(5000);
  expect(pollDelay(view({ kind: 'solo', status: 'setup' }), 120000, false)).toBe(15000);
  for (const turn of [0, 1] as const) expect(pollDelay(view({ kind: 'solo', turn, created_at: '2026-10-11T12:00:00.000Z' }), 0, false)).toBe(5000);
  expect(pollDelay(view({ kind: 'solo' }), 0, true)).toBeUndefined();
  expect(pollDelay(view({ kind: 'solo', status: 'finished' }), 0, false)).toBeUndefined();
});

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
  for (const current of [view({ status: 'finished' }), view({ status: 'aborted' }), undefined]) expect(pollDelay(current, 0, false)).toBeUndefined();
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
  // A computer game uses its own cross-host cadence.
  expect(pollDelay(view({ kind: 'solo', last_commands: own('turn', 0) }), 0, false)).toBe(5000);
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

it('a hide and show inside one second keeps the poll alive', async () => {
  vi.useFakeTimers();
  const page = Object.assign(new EventTarget(), { hidden: true }), read = vi.fn(async () => {});
  const runner = runPoll(() => ({ view: view(), read }), undefined, page);
  try {
    page.hidden = false; page.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(200); expect(read).toHaveBeenCalledTimes(1);
    page.hidden = true; page.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(200);
    page.hidden = false; page.dispatchEvent(new Event('visibilitychange')); page.dispatchEvent(new Event('pageshow'));
    await vi.advanceTimersByTimeAsync(60000); expect(read.mock.calls.length).toBeGreaterThan(1);
  } finally { runner.stop(); vi.useRealTimers(); }
});

it('a new wait after a long old wait starts at the 5-second rate', async () => {
  vi.useFakeTimers();
  const page = Object.assign(new EventTarget(), { hidden: false }), read = vi.fn(async () => {});
  let current: PollTarget | undefined = { view: 'waiting for a join', read };
  const runner = runPoll(() => current, undefined, page);
  try {
    await vi.advanceTimersByTimeAsync(1000);
    current = { view: view({ kind: 'random', status: 'waiting' }), read }; runner.update();
    await vi.advanceTimersByTimeAsync(130000);
    current = { view: view(), read }; runner.update();
    current = { view: 'waiting for a join', read }; runner.update();
    const before = read.mock.calls.length;
    await vi.advanceTimersByTimeAsync(5000); expect(read.mock.calls.length - before).toBe(1);
  } finally { runner.stop(); vi.useRealTimers(); }
});

it('refreshes the bounded command window rather than retaining stale private payloads or losing activity times', () => {
  const before = view({ revision: 10, last_commands: [{ seq: 7, seat: 0, at: '2026-10-11T12:00:00.000Z', action: { type: 'turn', actions: ['e2-e4'] } }] });
  expect(pollSince(before)).toBe(6);
  expect(pollSince(view({ revision: 10 }))).toBe(10);
  const refreshed = { ...before, server_now: '2026-10-11T12:00:03.000Z' };
  expect(pollDelay(refreshed, 0, false)).toBe(3000);
});

/** A visible solo game on a fake clock: each read returns the server's current commands and time. */
async function soloReads(minutes: number, remoteAt?: number) {
  vi.useFakeTimers(); vi.setSystemTime(Date.parse('2026-10-11T12:00:00.000Z'));
  const start = Date.now(), page = Object.assign(new EventTarget(), { hidden: false }), reads: number[] = [];
  const commands = [{ seq: 4, seat: 0 as const, at: new Date(start).toISOString(), action: { type: 'turn' as const, actions: ['e2-e4'] } }];
  let current = view({ kind: 'solo', turn: 0, last_commands: commands, server_now: new Date(start).toISOString() });
  const read = vi.fn(async () => { reads.push(Date.now() - start); current = { ...current, last_commands: [...commands], server_now: new Date().toISOString() }; });
  if (remoteAt !== undefined) setTimeout(() => commands.push({ seq: 5, seat: 0, at: new Date().toISOString(), action: { type: 'turn', actions: ['d2-d4'] } }), remoteAt);
  const runner = runPoll(() => ({ view: current, read }), undefined, page);
  try { await vi.advanceTimersByTimeAsync(minutes * 60000); return reads; } finally { runner.stop(); vi.useRealTimers(); }
}

it('backs off the visible idle solo poll: 5 s for 2 minutes after the newest command, then 15 s', async () => {
  const reads = await soloReads(10);
  // Before this rule: the mount read plus 120 timed reads. After: the mount read plus 56 timed reads.
  expect(reads.length - 1).toBe(56);
  expect(reads.filter(at => at <= 120000).length - 1).toBe(24);
  expect((await soloReads(60)).length - 1).toBe(256);
});

it('sets the solo delay from the newest command, else the game start, and stays at 5 s with no known time', () => {
  const now = Date.parse('2026-10-11T12:00:00.000Z'), ago = (ms: number) => new Date(now - ms).toISOString();
  const moved = (ms: number) => [{ seq: 1, seat: 0 as const, at: ago(600000), action: { type: 'turn' as const, actions: ['e2-e4'] } }, { seq: 2, seat: 1 as const, at: ago(ms), action: { type: 'computer' as const, actions: ['e7-e5'] } }];
  expect(pollDelay(view({ kind: 'solo', created_at: ago(900000), last_commands: moved(119999) }), 0, false)).toBe(5000);
  expect(pollDelay(view({ kind: 'solo', created_at: ago(900000), last_commands: moved(120000) }), 0, false)).toBe(15000);
  // No move yet: the game start opens the first 2-minute window.
  expect(pollDelay(view({ kind: 'solo', created_at: ago(0) }), 0, false)).toBe(5000);
  expect(pollDelay(view({ kind: 'solo', created_at: ago(119999) }), 0, false)).toBe(5000);
  expect(pollDelay(view({ kind: 'solo', created_at: ago(120000) }), 0, false)).toBe(15000);
  // A missing or unreadable time is never slower than 5 seconds.
  expect(pollDelay(view({ kind: 'solo', last_commands: [] }), 0, false)).toBe(5000);
  expect(pollDelay(view({ kind: 'solo', created_at: ago(900000), server_now: 'unknown' }), 0, false)).toBe(5000);
  expect(pollDelay(view({ kind: 'solo', created_at: 'unknown', last_commands: moved(600000) }), 0, false)).toBe(15000);
  // A missing commands list falls back to the game start.
  expect(pollDelay(view({ kind: 'solo', created_at: ago(900000), last_commands: undefined }), 0, false)).toBe(15000);
  // The End screen's rematch watch gives the finished solo view as a playing view; it uses the same rule.
  expect(pollDelay(view({ kind: 'solo', turn: 1, created_at: ago(900000), last_commands: moved(119999) }), 0, false)).toBe(5000);
  expect(pollDelay(view({ kind: 'solo', turn: 1, created_at: ago(900000), last_commands: moved(180000) }), 0, false)).toBe(15000);
});

it('shows a remote solo move within 5 s in the first 2 idle minutes, and within 15 s after them', async () => {
  for (const [at, limit] of [[90001, 5000], [119999, 5000], [300001, 15000]] as const) {
    const reads = await soloReads(10, at), seen = reads.find(read => read >= at)!;
    expect(seen - at).toBeLessThanOrEqual(limit);
    // The new move opens a new 5-second window.
    expect(reads.filter(read => read > seen && read <= seen + 15000).length).toBe(3);
  }
});
