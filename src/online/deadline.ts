/**
 * The next due time of a game in play (multiplayer report part 03, G7 and sections 5.7, 6.5, 6.6). Pure: every time is a
 * millisecond count the caller supplies. No product code calls this module. The sweep, lazy checks and claim read
 * games.deadline_at, which the game service (src/match/service.ts) sets.
 * Times count turns, not actions: a Haste turn has two actions and one turn of time, so the state changes only in `passTurn`.
 */
export type Seat = 0 | 1;
/** The kind names `games.deadline_kind` as far as it goes: move, first-turn, first-action. */
export type DeadlineKind = 'move' | 'first-turn' | 'reminder' | 'first-action' | 'flag' | 'away';

export const DEADLINE = {
  dayMs: 86_400_000,
  firstTurnDays: 3,         // Daily: cancel the game when a side makes no first turn in this time
  reminderShare: 0.8,       // Daily: "time almost up" after this share of the turn time
  firstActionMs: 45_000,    // Live: abort the game when a side makes no first turn in this time
  awayMs: 30_000,           // Live: a seat that is away can be claimed against after this time x the speed factor
  chatgptAwayMinMs: 60_000, // Live: a ChatGPT seat never gets less
};

/** `leftMs` is each seat's time at `turnStartedAt`, with the increment already added. */
export interface LiveClock { initialMs: number; incrementMs: number; leftMs: [number, number] }
interface Base {
  turn: Seat;                       // who acts: the engine's turn, so Haste keeps the same seat
  turnStartedAt: number;            // when the turn began; it moves only when the turn passes
  turnsPlayed: [number, number];    // turns each seat completed (turns, not actions)
}
export interface DailyState extends Base { speed: 'daily'; daysPerMove: number; reminded?: boolean }
export interface LiveState extends Base {
  speed: 'live'; clock: LiveClock;
  lastSeen: [number, number];       // each seat's last request (the heartbeat or presence call)
  chatgpt: [boolean, boolean];      // the seat's last surface is ChatGPT
}
export type DeadlineState = DailyState | LiveState;
export interface Deadline { at: number; kind: DeadlineKind }

/** Lichess speed factor from the estimated total time (initial + 40 x increment): bullet 1, blitz 2, rapid 4, classical 10. */
const speedFactor = ({ initialMs, incrementMs }: LiveClock) => { const total = (initialMs + 40 * incrementMs) / 1000; return total < 180 ? 1 : total < 480 ? 2 : total < 1500 ? 4 : 10; };

/**
 * The earliest due time and its kind. A time before `now` is overdue. `now` has one use: once the turn is out, the
 * reminder is dropped, so a late sweep sends no "time almost up" after time is up. On a tie the game-ending kind wins.
 * The caller reads game status: call this only for a game in play.
 */
export function nextDeadline(s: DeadlineState, now: number): Deadline {
  const D = DEADLINE, t = s.turn, t0 = s.turnStartedAt, c: Deadline[] = [];
  const first = s.turnsPlayed[t] === 0, started = s.turnsPlayed[0] > 0 && s.turnsPlayed[1] > 0; // started: both sides have played a turn
  if (s.speed === 'daily') {
    const due = t0 + s.daysPerMove * D.dayMs;
    // The 3 days run from the start of the side's first turn, not from the game start: Black's turn starts when White's passes.
    if (first) c.push({ at: t0 + D.firstTurnDays * D.dayMs, kind: 'first-turn' });
    c.push({ at: due, kind: 'move' });
    if (started && !s.reminded && now < due) c.push({ at: t0 + D.reminderShare * (due - t0), kind: 'reminder' });
  } else if (!started) {
    // ponytail: 45 s covers the whole first turn, both actions of a Haste first turn; add a per-action stamp if that is too short
    c.push({ at: t0 + D.firstActionMs, kind: 'first-action' });
  } else {
    c.push({ at: t0 + s.clock.leftMs[t], kind: 'flag' });
    // The claim time runs from the seat's last request, but never before its own turn began. No claim in a first turn: the other side aborts.
    const wait = Math.max(s.chatgpt[t] ? D.chatgptAwayMinMs : 0, D.awayMs * speedFactor(s.clock));
    c.push({ at: Math.max(t0, s.lastSeen[t]) + wait, kind: 'away' });
  }
  return c.reduce((a, b) => b.at < a.at ? b : a);
}

/**
 * The state after the mover's turn passes at `now`, however many actions the turn held. A live mover pays the time since the
 * turn began and gains the increment once, so a Haste turn gets one increment. The first turn of each side is free: the main
 * clocks start after both sides have played one. Call it only when the mover has not flagged (nextDeadline says so).
 */
export function passTurn(s: DeadlineState, now: number): DeadlineState {
  const t = s.turn, turnsPlayed: [number, number] = [...s.turnsPlayed];
  turnsPlayed[t]++;
  const next = { turn: (1 - t) as Seat, turnStartedAt: now, turnsPlayed };
  if (s.speed === 'daily') return { ...s, ...next, reminded: false };
  const leftMs: [number, number] = [...s.clock.leftMs];
  if (s.turnsPlayed[0] > 0 && s.turnsPlayed[1] > 0) leftMs[t] += s.clock.incrementMs - (now - s.turnStartedAt);
  return { ...s, ...next, clock: { ...s.clock, leftMs } };
}
