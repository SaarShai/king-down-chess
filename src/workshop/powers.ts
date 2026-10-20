import { GameRules } from '../game-rules';
/**
 * The kings' powers on the Proving Ground (docs/specs/workshop-proving-ground, ticket 13): a seated king's power on a
 * pool piece, or on a copy or a new piece, which plays as `T` (ticket 17). A LAB card in White's hand works the same way (ticket 14). The engine makes every power move (legalMoves) under the power readings, and each preview runs in
 * an owned rules context. Pure, so it runs in Node.
 */
import { K, POWERS_BALANCED, TAG_POWER, WHITE, colorOf, file, isMarkTag, parseSq, piece, rank, sqName, typeOf, type CardName, type KingName, type Move, type PieceType, type Position, type PowerName, type PowerTag, type Rules } from '../rules/engine';
import { POWER_TAG, usesAllowed } from '../powers-ui';
import { step } from './moves';
import type { Scene } from './scene';
import type { DesignSpec } from '../rules/design';

/** White's king has `power` (none with no king), under the power readings. `design`: the Try board's design plays as `T` (ticket 17). */
const over = (king: KingName | null, power: PowerName, design: DesignSpec | null = null): Partial<Rules> => ({ ...POWERS_BALANCED, kings: [king && { king, power }, null], design });
/** The rules a seated king plays under: its coin reads them (coinState, powerText). */
export const kingRules = (king: KingName, power: PowerName): Rules => new GameRules(over(king, power)).rules;

/** The Try board with a seated king: White's king stays where it stands, else it stands on b1 (the scenes), else on the
 *  first empty square. */
export function seated(board: Uint8Array): Uint8Array {
  const b = new Uint8Array(board);
  if (!b.some(v => v && typeOf(v) === K && colorOf(v) === WHITE)) b[b[parseSq('b1')] ? b.indexOf(0) : parseSq('b1')] = piece(K, WHITE);
  return b;
}
/** The engine position of the Try board: the pool piece on `from` as its engine `type`, White to move, with the uses spent and the marks. */
export const enginePos = (board: Uint8Array, from: number, type: PieceType, game: Pick<Position, 'used' | 'marks'> = {}): Position => {
  const b = new Uint8Array(board);
  b[from] = piece(type, WHITE);
  return { board: b, turn: WHITE, halfmove: 0, ply: 0, ...game };
};

/** The moves that White's `king` with `power` adds for the piece on `from`: its tagged power moves, and for Freeze and Ice
 *  Wall a mark on any piece. An always-on power has no tagged move: its moves are those that the power adds. None is an echo. */
export function powerMarks(pos: Position, from: number, king: KingName, power: PowerName, design: DesignSpec | null = null): Move[] {
  const mine = mover(from);
  const context = new GameRules(over(king, power, design));
  const moves = context.legalMoves(pos).filter(mine), always = !usesAllowed(power, context.rules) || !POWER_TAG[power];
  if (!always) return moves.filter(m => m.power === POWER_TAG[power]);
  const key = (m: Move): string => `${m.from} ${m.to} ${m.captures}`, was = new Set(new GameRules(over(null, power, design)).legalMoves(pos).filter(mine).map(key));
  return moves.filter(m => !was.has(key(m)));
}

/** A move of the piece on `from`, or a mark (Freeze, Ice Wall) on any piece. */
const mover = (from: number) => (m: Move): boolean => m.from === from || isMarkTag(m.power);

/** Card mode with LAB card `card` in White's hand and no king power (setRules refuses both, decision 30). */
const hand = (card: CardName, design: DesignSpec | null = null): Partial<Rules> => ({ hands: [[card], []], design });
/** The rules a LAB card plays under: its words read them (cardText). */
export const cardRules = (card: CardName): Rules => new GameRules(hand(card)).rules;
/** The moves that LAB card `card` gives the piece on `from` (its tagged moves), and for Freeze and Ice Wall a mark on any piece. */
export function cardMarks(pos: Position, from: number, card: CardName, design: DesignSpec | null = null): Move[] {
  const tag = (Object.keys(TAG_POWER) as PowerTag[]).find(t => TAG_POWER[t] === card), mine = mover(from);
  return new GameRules(hand(card, design)).legalMoves(pos).filter(m => m.power === tag && mine(m));
}
/** Plays card move `m` with the engine: the card played and the marks are in the position it gives. */
export const playCard = (pos: Position, m: Move, card: CardName, design: DesignSpec | null = null): Position => new GameRules(hand(card, design)).makeMove(pos, m);

/** Plays power move `m` with the engine under the king's rules: the uses spent and the marks are in the position it gives. */
export const playPower = (pos: Position, m: Move, king: KingName, power: PowerName, design: DesignSpec | null = null): Position => new GameRules(over(king, power, design)).makeMove(pos, m);

/** The power moves as scene parts: a mark with the power frame on each target, the emblem stamp at the end of each line,
 *  and an arch over each piece that a move passes, with the line on from there (the mockup's rook-leap). `emblem` is the
 *  king's emblem name. */
export function powerLayer(moves: readonly Move[], board: Uint8Array, from: number, emblem: string): Pick<Scene, 'marks' | 'arches' | 'rails'> {
  const to = (m: Move): number => m.captures[0] ?? m.to, at = new Set(moves.map(to)), own = moves.filter(m => m.from === from), ray = new Set(own.map(to)), arches = new Map<string, Scene['arches'][number]>();
  const dx = (s: number): number => file(s) - file(from), dy = (s: number): number => rank(s) - rank(from);
  /** The step from `from` towards `s` when `s` is on one of its lines, else null. */
  const dir = (s: number): [number, number] | null => (s !== from && (!dx(s) || !dy(s) || Math.abs(dx(s)) === Math.abs(dy(s))) ? [Math.sign(dx(s)), Math.sign(dy(s))] : null);
  const marks = [...at].map((s): Scene['marks'][number] => {
    const d = dir(s), next = d ? step(s, ...d) : -1;
    return { sq: sqName(s), k: moves.some(m => m.captures.includes(s)) ? 'take' : 'move', power: emblem, ...(!ray.has(next) && { stamp: true as const }) };
  });
  // Each line that passes a piece: an arch over each piece, then the line from the last piece passed to the farthest
  // target, with an x on a take, an arrow at the edge, else a stop.
  const far = (s: number): number => Math.max(Math.abs(dx(s)), Math.abs(dy(s))), lines = new Map<string, { over: number; to: number }>();
  for (const m of own) {
    const d = dir(to(m));
    if (!d) continue;
    const l = lines.get(d.join()) ?? { over: -1, to: to(m) };
    for (let p = from, s = step(from, ...d); s >= 0 && s !== to(m); p = s, s = step(s, ...d)) {
      if (!board[s]) continue;
      arches.set(sqName(s), { from: sqName(p), over: sqName(s), to: sqName(step(s, ...d)), power: emblem });
      if (l.over < 0 || far(s) > far(l.over)) l.over = s;
    }
    if (far(to(m)) > far(l.to)) l.to = to(m);
    lines.set(d.join(), l);
  }
  const rails = [...lines.values()].filter(l => l.over >= 0).map((l): Scene['rails'][number] => {
    const next = step(l.to, ...dir(l.to)!), take = own.some(m => m.captures.includes(l.to));
    return { from: sqName(l.over), to: sqName(take || next < 0 ? l.to : next), end: take ? 'x' : next < 0 ? 'arrow' : 'stop' };
  });
  return { marks, arches: [...arches.values()], rails };
}
