/**
 * The one replay implementation for stored games. `src/sim/game.ts` counts events as it plays;
 * this module counts them the same way while replaying LANs, and `playGame` calls `countMove` so
 * the two cannot drift. Sampling and the Q6 audit both validate records with it: a move list that
 * replays to different events than the record stored is a record of a different game.
 */
import { A, C, Color, G, K, Move, Position, S, colorOf, inCheck, legalMoves, makeMove, typeOf } from '../rules/engine';
import { fromFen, toLan } from '../rules/setup';
import { parseLan } from './tune';
import type { Events, GameRecord } from './game';

const NO_SHOT: ReadonlySet<string> = new Set(['firewall', 'rescue', 'growth', 'growthb', 'quake', 'quakeb']);

export function emptyEvents(): Events {
  return {
    archerShots: [0, 0], beastChains: [[], []], maesterSwaps: [0, 0], maesterLongSwaps: [0, 0],
    paladinSacrifices: [0, 0], promotions: [0, 0], checks: [0, 0],
    ogreShoves: [0, 0], ogreShovesFriend: [0, 0], ogreShovesGuard: [0, 0], catapultChecks: [0, 0],
    strikes: [0, 0], powers: {},
  };
}

/** Count one move, exactly as `playGame` does. `post` is the position after the move. */
export function countMove(events: Events, pos: Position, move: Move, post: Position): void {
  const c = pos.turn;
  const mt = typeOf(pos.board[move.from]);
  // The 2014 cards that keep `to === from` name a square, not an archer's shot.
  if (mt === A && move.to === move.from && !NO_SHOT.has(move.power ?? '')) events.archerShots[c]++;
  if (mt === S && move.captures.length) events.beastChains[c].push(move.captures.length);
  if (move.swap && move.power !== 'skylift' && move.power !== 'firewallb') { // SkyLift and FirewallB use the swap's shape, but no maester
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
  if (move.power === 'strike') events.strikes[c]++;
  // The card spent: a Mirror's copy counts as the Mirror (`via`).
  if (move.power) (events.powers[move.via ?? move.power] ??= [0, 0])[c]++;
  else if (move.pass) (events.powers.pass ??= [0, 0])[c]++;
  // A Curse moves an enemy piece: an enemy catapult never checks its own king; nor is a quake's square or a swap's enemy the catapult's move.
  if (inCheck(post)) { events.checks[c]++; if (mt === C && move.power !== 'curse' && !move.pushes) events.catapultChecks[c]++; }
}

export interface Replay { events: Events; plies: number; end: Position }

/**
 * Replay the recorded LANs under the **live** rules (the caller sets them from the run's stamp
 * first). Throws on the first move that does not round-trip under them: the parsed move must print
 * as the recorded LAN, because the same LAN can move different pieces under two rule sets
 * (LESSONS.md 2026-09-14: `Ld4xd5` under old and new paladin semantics). That is not a legality
 * check. Only the king powers' notation is matched against the legal moves: an ordinary move is
 * parsed, so one that round-trips but is not legal (`Qd8-d4` through the queen's own pawn) replays
 * without an error. A caller that must refuse it checks `legalMoves` itself
 * (`tools/piece-activity.ts` does).
 *
 * `onMove` sees every move with the positions before and after it and its 0-based ply
 * (`tools/piece-activity.ts` counts per piece with it).
 */
export function replayRecord(
  rec: Pick<GameRecord, 'gameId' | 'startFen'> & { moves: readonly { lan: string }[] },
  onMove?: (pos: Position, move: Move, next: Position, ply: number) => void,
): Replay {
  let pos = fromFen(rec.startFen);
  const events = emptyEvents();
  for (let i = 0; i < rec.moves.length; i++) {
    const lan = rec.moves[i].lan;
    // The king powers' notation (`!F:e5`, `Nb1~e3`, `--`, `d4-d6!M` …) and the drops (`G@b1`,
    // `N@b1!R`) are matched against the legal moves, which also checks the power state and the
    // waiting guards; the rest parse without generating moves.
    const m = /[!~@]|^--$/.test(lan) ? legalMoves(pos).find(x => toLan(pos, x) === lan) : parseLan(pos.board, lan);
    if (!m || toLan(pos, m) !== lan) throw new Error(`game ${rec.gameId} ply ${i}: parsed ${m ? toLan(pos, m) : 'nothing'} from ${lan}`);
    const next = makeMove(pos, m);
    countMove(events, pos, m, next);
    onMove?.(pos, m, next, i);
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
