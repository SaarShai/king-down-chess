import { describe, expect, it, vi } from 'vitest';
import { DEADLINE, nextDeadline, passTurn, type DailyState, type LiveState } from './deadline';

const DAY = DEADLINE.dayMs, SEC = 1000, T = 1_000_000_000; // the fake clock starts at T
const daily = (o: Partial<DailyState> = {}): DailyState => ({ speed: 'daily', turn: 0, turnStartedAt: T, turnsPlayed: [1, 1], daysPerMove: 3, ...o });
const live = (o: Partial<LiveState> = {}, clock: Partial<LiveState['clock']> = {}): LiveState => ({
  speed: 'live', turn: 0, turnStartedAt: T, turnsPlayed: [1, 1], lastSeen: [T, T], chatgpt: [false, false],
  clock: { initialMs: 600 * SEC, incrementMs: 5 * SEC, leftMs: [600 * SEC, 600 * SEC], ...clock }, ...o,
});

describe('Daily deadlines', () => {
  it('turn deadline: days per move after the turn began', () => {
    expect(nextDeadline(daily({ daysPerMove: 1, reminded: true }), T)).toEqual({ at: T + DAY, kind: 'move' });
    expect(nextDeadline(daily({ daysPerMove: 7, reminded: true }), T)).toEqual({ at: T + 7 * DAY, kind: 'move' });
    expect(nextDeadline(daily({ turn: 1, turnStartedAt: T + 2 * DAY, reminded: true }), T)).toEqual({ at: T + 5 * DAY, kind: 'move' });
  });

  it('80% reminder: after both sides moved, once, and only while the turn is not out', () => {
    expect(nextDeadline(daily(), T)).toEqual({ at: T + 2.4 * DAY, kind: 'reminder' });
    expect(nextDeadline(daily({ reminded: true }), T + 3 * DAY)).toEqual({ at: T + 3 * DAY, kind: 'move' });
    expect(nextDeadline(daily({ daysPerMove: 7 }), T).at).toBe(T + 5.6 * DAY);
    // a sweep that runs late: the reminder is overdue but the turn is out too, so only the move deadline is left
    expect(nextDeadline(daily(), T + 3 * DAY + 1)).toEqual({ at: T + 3 * DAY, kind: 'move' });
    // overdue and the turn still running: the reminder stays due
    expect(nextDeadline(daily(), T + 2.5 * DAY)).toEqual({ at: T + 2.4 * DAY, kind: 'reminder' });
  });

  it('no reminder before both sides have moved', () => {
    // 3 days per move: the 80% time (2.4 days) falls before the 3-day cancel, so a missing guard would show
    expect(nextDeadline(daily({ turnsPlayed: [1, 0], turn: 1 }), T).kind).toBe('first-turn');
    expect(nextDeadline(daily({ turnsPlayed: [0, 0] }), T).kind).toBe('first-turn');
  });

  it('3-day first-turn cancel: for the side that has not played, counted from the start of its turn', () => {
    expect(nextDeadline(daily({ turnsPlayed: [0, 0], daysPerMove: 7 }), T)).toEqual({ at: T + 3 * DAY, kind: 'first-turn' });
    // Black's turn began when White's passed, so Black gets 3 days from then
    expect(nextDeadline(daily({ turnsPlayed: [1, 0], turn: 1, turnStartedAt: T + 2.9 * DAY, daysPerMove: 7 }), T)).toEqual({ at: T + 5.9 * DAY, kind: 'first-turn' });
    // a tie with the turn deadline: the cancel (no result) wins
    expect(nextDeadline(daily({ turnsPlayed: [0, 0], daysPerMove: 3 }), T)).toEqual({ at: T + 3 * DAY, kind: 'first-turn' });
    // 1 day per move: the turn deadline comes first
    expect(nextDeadline(daily({ turnsPlayed: [0, 0], daysPerMove: 1 }), T)).toEqual({ at: T + DAY, kind: 'move' });
    // a side that played already has no cancel
    expect(nextDeadline(daily({ turnsPlayed: [1, 0], turn: 0, daysPerMove: 7, reminded: true }), T).kind).toBe('move');
  });

  it('Haste: the deadline moves when the turn passes, not on each action', () => {
    const s = daily({ turnsPlayed: [1, 1], reminded: true }), before = nextDeadline(s, T);
    // action 1 of a two-action turn leaves the state alone; action 2 passes the turn 5 hours later
    const after = passTurn(s, T + 5 * 3600 * SEC) as DailyState;
    expect(before).toEqual({ at: T + 3 * DAY, kind: 'move' });
    expect(after).toMatchObject({ turn: 1, turnsPlayed: [2, 1], turnStartedAt: T + 5 * 3600 * SEC, reminded: false });
    expect(nextDeadline(after, T + 5 * 3600 * SEC)).toEqual({ at: T + 5 * 3600 * SEC + 2.4 * DAY, kind: 'reminder' });
  });
});

describe('Live deadlines', () => {
  it('45 s first-action timer for each side, with the main clocks waiting', () => {
    expect(nextDeadline(live({ turnsPlayed: [0, 0] }), T)).toEqual({ at: T + 45 * SEC, kind: 'first-action' });
    // Black's timer starts when White's first turn passes
    expect(nextDeadline(live({ turnsPlayed: [1, 0], turn: 1, turnStartedAt: T + 20 * SEC }), T)).toEqual({ at: T + 65 * SEC, kind: 'first-action' });
    // a stale seat gives no claim before the clocks run: the other side aborts
    expect(nextDeadline(live({ turnsPlayed: [0, 0], lastSeen: [T - 999 * SEC, T] }), T).kind).toBe('first-action');
  });

  it('flag: the mover\'s time left, counted from the turn start', () => {
    const s = live({ lastSeen: [T + 50 * SEC, T] }, { leftMs: [60 * SEC, 600 * SEC] });
    expect(nextDeadline(s, T)).toEqual({ at: T + 60 * SEC, kind: 'flag' });
    expect(nextDeadline({ ...s, turn: 1, turnStartedAt: T + 10 * SEC, lastSeen: [T, T + 10 * SEC] }, T).at).toBe(T + 130 * SEC); // Black: away at 10 + 120 s, before its 610 s flag
    expect(nextDeadline(live({ turn: 1, turnStartedAt: T + 10 * SEC, lastSeen: [T, T + 600 * SEC] }, { leftMs: [1, 60 * SEC] }), T)).toEqual({ at: T + 70 * SEC, kind: 'flag' });
  });

  it('away/claim time: 30 s times the speed factor 1, 2, 4 or 10', () => {
    const wait = (initialMs: number, incrementMs = 0) => nextDeadline(live({}, { initialMs, incrementMs, leftMs: [9e9, 9e9] }), T).at - T;
    expect(nextDeadline(live({}, { leftMs: [9e9, 9e9] }), T).kind).toBe('away');
    expect(wait(60 * SEC)).toBe(30 * SEC); // 1+0 bullet
    expect(wait(120 * SEC, SEC)).toBe(30 * SEC); // 2+1: 160 s estimated, bullet
    expect(wait(180 * SEC)).toBe(60 * SEC); // 3+0 blitz
    expect(wait(300 * SEC, 3 * SEC)).toBe(60 * SEC); // 5+3 blitz
    expect(wait(600 * SEC, 5 * SEC)).toBe(120 * SEC); // 10+5 rapid: 2 minutes, as the report says
    expect(wait(900 * SEC, 10 * SEC)).toBe(120 * SEC); // 15+10 rapid
    expect(wait(1800 * SEC)).toBe(300 * SEC); // 30+0 classical
  });

  it('away/claim time: a ChatGPT seat gets at least 60 s', () => {
    const wait = (initialMs: number, incrementMs: number, chatgpt: boolean) => nextDeadline(live({ chatgpt: [chatgpt, false] }, { initialMs, incrementMs, leftMs: [9e9, 9e9] }), T).at - T;
    expect(wait(60 * SEC, 0, true)).toBe(60 * SEC); // bullet: 30 s becomes 60 s
    expect(wait(60 * SEC, 0, false)).toBe(30 * SEC);
    expect(wait(180 * SEC, 0, true)).toBe(60 * SEC);
    expect(wait(600 * SEC, 5 * SEC, true)).toBe(120 * SEC); // rapid is already above 60 s
  });

  it('away/claim time: from the last request, never before the seat\'s own turn began, on the mover only', () => {
    const big = { leftMs: [9e9, 9e9] as [number, number] };
    expect(nextDeadline(live({ lastSeen: [T + 30 * SEC, T] }, big), T).at).toBe(T + 150 * SEC); // last request 30 s into the turn
    expect(nextDeadline(live({ lastSeen: [T - 500 * SEC, T] }, big), T).at).toBe(T + 120 * SEC); // seat was gone before its turn: full wait from the turn start
    expect(nextDeadline(live({ lastSeen: [T, T - 500 * SEC] }, big), T).at).toBe(T + 120 * SEC); // the other seat's absence does not count
  });

  it('flag wins a tie with the claim', () => {
    expect(nextDeadline(live({}, { leftMs: [120 * SEC, 120 * SEC] }), T)).toEqual({ at: T + 120 * SEC, kind: 'flag' });
  });

  it('Haste: one turn, one increment, and the clock runs across both actions', () => {
    // White opens, Black replies; neither first turn costs time and neither gains the increment
    let s = live({ turnsPlayed: [0, 0] }, { leftMs: [600 * SEC, 600 * SEC] });
    s = passTurn(s, T + 30 * SEC) as LiveState;
    expect(s).toMatchObject({ turn: 1, turnsPlayed: [1, 0], turnStartedAt: T + 30 * SEC });
    expect(s.clock.leftMs).toEqual([600 * SEC, 600 * SEC]);
    s = passTurn(s, T + 50 * SEC) as LiveState;
    expect(s).toMatchObject({ turn: 0, turnsPlayed: [1, 1], turnStartedAt: T + 50 * SEC });
    expect(s.clock.leftMs).toEqual([600 * SEC, 600 * SEC]);
    // White's Haste turn began at +50 s. Action 1 (+55 s) leaves the state alone; action 2 (+70 s) passes the turn.
    expect(nextDeadline(s, T + 55 * SEC)).toEqual({ at: T + 50 * SEC + 120 * SEC, kind: 'away' });
    const white = passTurn(s, T + 70 * SEC) as LiveState;
    expect(white.clock.leftMs[0]).toBe(600 * SEC - 20 * SEC + 5 * SEC); // charged 20 s, one 5 s increment (not two)
    expect(white).toMatchObject({ turn: 1, turnStartedAt: T + 70 * SEC });
    // Black's flag counts from the new turn start
    const short = { ...white, clock: { ...white.clock, leftMs: [white.clock.leftMs[0], 30 * SEC] as [number, number] } };
    expect(nextDeadline(short, T + 70 * SEC)).toEqual({ at: T + 100 * SEC, kind: 'flag' });
  });

  it('a plain turn pays its time and gains the increment once', () => {
    const s = passTurn(live({}, { leftMs: [100 * SEC, 100 * SEC], incrementMs: 3 * SEC }), T + 10 * SEC) as LiveState;
    expect(s.clock.leftMs).toEqual([93 * SEC, 100 * SEC]);
    expect(s.turn).toBe(1);
  });
});

it('reads no clock', () => {
  const now = vi.spyOn(Date, 'now');
  nextDeadline(daily(), 0); nextDeadline(live(), 0); passTurn(live(), 5);
  expect(now).not.toHaveBeenCalled();
  now.mockRestore();
});
