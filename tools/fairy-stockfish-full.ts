/** Fixed King Down rule contract and portable full-state action bridge. */
import { ALL_CARDS, BUILT, CARD_ONLY, DEFAULT_RULES, POWERS_BALANCED, RULES, USES_RULE, type CardName, type Rules } from '../src/rules/rules';
import { TAG_POWER, K, colorOf, inCheck, legalMoves, makeMove, status, type Move, type Position } from '../src/rules/engine';
import { toFen } from '../src/rules/setup';
import { Uci } from './fairy-stockfish-smoke';

export const FULL_NAMES = ['', ...BUILT, ...CARD_ONLY] as const;
const DYNAMIC = new Set(['kings', 'hands', 'piles', 'fromMove', 'freezeUses', 'iceWallUses', 'strikeUses', 'hasteUses', 'flightUses', 'sacrificeUses', 'marchUses', 'leapUses', 'markTurns', 'strikeMode', 'hasteSecond']);
const requireValue = (ok: unknown, message: string): void => { if (!ok) throw new Error(message); };
const id = (name: string): number => { const n = FULL_NAMES.indexOf(name as typeof FULL_NAMES[number]); requireValue(n > 0, 'Unknown native power/card: ' + name); return n; };

/** Reject every rule that the native contract does not implement. */
export function fullConfig(rules: Rules = RULES): string {
  const profiles = [DEFAULT_RULES, { ...DEFAULT_RULES, ...POWERS_BALANCED }];
  const profile = profiles.findIndex(template => [...new Set([...Object.keys(template), ...Object.keys(rules)])].every(key => DYNAMIC.has(key) || JSON.stringify(template[key as keyof Rules]) === JSON.stringify(rules[key as keyof Rules])));
  requireValue(profile >= 0, 'Rules outside the native full-state contract');
  const limits = BUILT.slice(0, 8).map(p => rules[USES_RULE[p]!] as number);
  limits.forEach((n, i) => requireValue(Number.isInteger(n) && n >= (i < 6 ? 1 : 0) && n <= 6, 'Unsupported power use limit'));
  const deck = (cards: readonly CardName[], max: number): string => {
    requireValue(cards.length <= max && cards.every(c => ALL_CARDS.includes(c)), 'Unsupported hand or pile');
    return cards.length ? cards.map(id).join(',') : '-';
  };
  requireValue(rules.markTurns === 1 || rules.markTurns === 2, 'Unsupported mark duration');
  requireValue(['move', 'capture'].includes(rules.strikeMode) && ['any', 'quiet'].includes(rules.hasteSecond), 'Unsupported power reading');
  const delays = Object.entries(rules.fromMove).sort(([a], [b]) => id(a) - id(b)).map(([card, move]) => {
    requireValue(ALL_CARDS.includes(card as CardName) && Number.isInteger(move) && move! >= 0 && move! <= 1_000_000, 'Unsupported delayed card');
    return id(card) + ':' + move;
  });
  return [profile, ...rules.kings.map(k => k ? id(k.power) : 0), limits.join(','), ...rules.hands.map(h => deck(h, 8)), ...rules.piles.map(p => deck(p, 64)), delays.join(',') || '-', rules.markTurns, Number(rules.strikeMode === 'capture'), Number(rules.hasteSecond === 'quiet')].join(' ');
}

export function fullAction(pos: Position, m: Move): string {
  requireValue(Number.isInteger(m.from) && m.from >= 0 && m.from < 64 && Number.isInteger(m.to) && m.to >= 0 && m.to < 64, 'Invalid action square');
  let victims = 0n, pushes = 0n;
  for (const s of m.captures) {
    requireValue(Number.isInteger(s) && s >= 0 && s < 64 && pos.board[s] && colorOf(pos.board[s]) !== pos.turn && (pos.board[s] & 15) !== K && !(victims & 1n << BigInt(s)), 'Invalid action victim');
    victims |= 1n << BigInt(s);
  }
  for (const push of m.pushes ?? []) {
    const df = (push.from & 7) - (m.from & 7), dr = (push.from >> 3) - (m.from >> 3);
    requireValue(Math.max(Math.abs(df), Math.abs(dr)) === 1 && push.to === push.from + df + 8 * dr && push.to >= 0 && push.to < 64 && !pos.board[push.to] && !(pushes & 1n << BigInt(push.from)), 'Invalid quake push');
    pushes |= 1n << BigInt(push.from);
  }
  requireValue(m.drop2 === undefined || !!m.drop && m.drop2 >= 0 && m.drop2 < 64, 'Invalid second drop');
  requireValue(!m.shove || m.shove.from === m.to && m.shove.to >= 0 && m.shove.to < 64, 'Invalid Ogre shove');
  const flags = (m.power ? id(TAG_POWER[m.power]) : 0) | (m.via === 'mirror' ? 1 << 6 : m.via === 'mirrorb' ? 2 << 6 : 0)
    | (m.swap ? 1 << 8 : 0) | (m.selfRemove ? 1 << 9 : 0) | (m.pass ? 1 << 10 : 0)
    | (m.shove ? (1 << 11) | m.shove.to << 12 : 0) | (m.drop ? m.drop << 18 : 0)
    | (m.drop2 === undefined ? 0 : (1 << 22) | m.drop2 << 23);
  const data = (13 << 12) | m.from << 6 | m.to | (m.promo ?? 0) << 16;
  return '@' + [data.toString(16), (flags >>> 0).toString(16), victims.toString(16), pushes.toString(16)].join(':');
}

export function fullActions(pos: Position): Map<string, Move> {
  fullConfig();
  requireValue([...pos.board].every(pc => !pc || pc < 32 && (pc & 15) > 0), 'Unsupported piece flags');
  const actions = new Map<string, Move>(), states = new Map<string, string>();
  for (const m of legalMoves(pos)) {
    const token = fullAction(pos, m), state = toFen(makeMove(pos, m));
    requireValue(!states.has(token) || states.get(token) === state, 'Action collapse changes state');
    actions.set(token, m); states.set(token, state);
  }
  return actions;
}
export function resolveFullAction(pos: Position, token: string): Move {
  const m = fullActions(pos).get(token); requireValue(m, 'Native action is illegal in King Down'); return m!;
}

/** Complete search turns. Every held turn has one ordinary follow-up, or ends first on a draw. */
export function fullTurns(pos: Position): Map<string, Position> {
  const turns = new Map<string, Position>();
  for (const [token, m] of fullActions(pos)) {
    const next = makeMove(pos, m);
    if (next.turn !== pos.turn || status(next) !== 'playing') turns.set(token, next);
    else for (const [follow, action] of fullActions(next)) {
      const end = makeMove(next, action); requireValue(end.turn !== pos.turn, 'A held turn needs more than two actions');
      turns.set(token + ',' + follow, end);
    }
  }
  return turns;
}
export function resolveFullTurn(pos: Position, token: string): { moves: Move[]; position: Position } {
  const parts = token.split(','); requireValue(parts.length >= 1 && parts.length <= 2, 'Invalid native turn');
  const startSide = pos.turn, moves: Move[] = [];
  for (const part of parts) {
    requireValue(pos.turn === startSide && status(pos) === 'playing', 'Native turn continues after it ends');
    const m = resolveFullAction(pos, part); moves.push(m); pos = makeMove(pos, m);
  }
  requireValue(pos.turn !== startSide || status(pos) !== 'playing', 'Native turn omits its follow-up');
  return { moves, position: pos };
}
export async function configureFull(fs: Uci, rules: Rules = RULES): Promise<void> {
  const registry = await fs.query('kdregistry', s => s.startsWith('kdregistry '));
  requireValue(registry.at(-1) === 'kdregistry ' + FULL_NAMES.slice(1).join('.'), 'Native power/card registry differs');
  const variant = await fs.ready('setoption name UCI_Variant value kingdown');
  requireValue(variant.some(s => s.startsWith('info string variant kingdown ')), 'Native King Down variant was not selected');
  const configured = await fs.query('kdconfig ' + fullConfig(rules), s => s.startsWith('kdconfigok ') || s.startsWith('kdconfigerror '));
  requireValue(configured.at(-1)?.startsWith('kdconfigok '), 'Native configuration was refused: ' + configured.at(-1));
}
export function fullCheckAfter(pos: Position, move: Move): boolean { return inCheck(makeMove(pos, move)); }
