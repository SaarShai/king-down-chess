/**
 * The one replay implementation for stored games. `src/sim/game.ts` counts events as it plays;
 * this module counts them the same way while replaying LANs, and `playGame` calls `countMove` so
 * the two cannot drift. Sampling and the Q6 audit both validate records with it: a move list that
 * replays to different events than the record stored is a record of a different game.
 */
import { A, C, Color, G, K, Move, Position, S, colorOf, inCheck, makeMove, typeOf } from '../rules/engine';
import { fromFen, toLan } from '../rules/setup';
import { parseLan } from './tune';
import type { Events, GameRecord } from './game';

export function emptyEvents(): Events {
  return {
    archerShots: [0, 0], beastChains: [[], []], maesterSwaps: [0, 0], maesterLongSwaps: [0, 0],
    paladinSacrifices: [0, 0], promotions: [0, 0], checks: [0, 0],
    ogreShoves: [0, 0], ogreShovesFriend: [0, 0], ogreShovesGuard: [0, 0], catapultChecks: [0, 0],
    strikes: [0, 0],
  };
}

/** Count one move, exactly as `playGame` does. `post` is the position after the move. */
export function countMove(events: Events, pos: Position, move: Move, post: Position): void {
  const c = pos.turn;
  const mt = typeOf(pos.board[move.from]);
  if (mt === A && move.to === move.from) events.archerShots[c]++;
  if (mt === S && move.captures.length) events.beastChains[c].push(move.captures.length);
  if (move.swap) {
    events.maesterSwaps[c]++;
    if (typeOf(pos.board[move.to]) === K) events.maesterLongSwaps[c]++;
  }
  if (move.selfRemove) events.paladinSacrifices[c]++;
  if (move.promo) events.promotions[c]++;
  if (move.shove) {
    const shoved = pos.board[move.shove.from];
    events.ogreShoves[c]++;
    if (colorOf(shoved) === c) events.ogreShovesFriend[c]++;
    if (typeOf(shoved) === G) events.ogreShovesGuard[c]++;
  }
  if (move.strike) events.strikes[c]++;
  if (inCheck(post)) { events.checks[c]++; if (mt === C) events.catapultChecks[c]++; }
}

export interface Replay { events: Events; plies: number; end: Position }

/**
 * Replay the recorded LANs under the **live** rules (the caller sets them from the run's stamp
 * first). Throws on the first move that is not legal now — a stronger check than "the text parses",
 * because the same LAN can be legal under two rule sets and move different pieces (LESSONS.md
 * 2026-09-14: `Ld4xd5` under old and new paladin semantics).
 */
export function replayRecord(rec: GameRecord): Replay {
  let pos = fromFen(rec.startFen);
  const events = emptyEvents();
  for (let i = 0; i < rec.moves.length; i++) {
    const lan = rec.moves[i].lan;
    const m = parseLan(pos.board, lan);
    if (toLan(pos, m) !== lan) throw new Error(`game ${rec.gameId} ply ${i}: parsed ${toLan(pos, m)} from ${lan}`);
    const next = makeMove(pos, m);
    countMove(events, pos, m, next);
    pos = next;
  }
  return { events, plies: rec.moves.length, end: pos };
}

/** Fields the record carries (an older record may lack the lab counters) must agree with the replay. */
export function eventsMatch(recomputed: Events, stored: Partial<Events>): string | null {
  for (const k of Object.keys(recomputed) as (keyof Events)[]) {
    const s = stored[k];
    if (s === undefined) continue;
    if (JSON.stringify(recomputed[k]) !== JSON.stringify(s)) {
      return `${k}: stored ${JSON.stringify(s)}, replay ${JSON.stringify(recomputed[k])}`;
    }
  }
  return null;
}
