/**
 * The plugin game setup (spec "Modules: Game setup"): the initiator's options, the draw, the seat choices and
 * the built match setup. Pure and zod-free, so the app page may import it; the schema is in `setup-schema.ts`.
 * It lives outside `src/rules/`, so it leaves the engine hash (saved matches) alone.
 */
import { CLASSIC_CHESS, POOL, randomBackRank, shuffle } from '../rules/setup';
import type { CardName } from '../rules/rules';

/** The deal list of spec Q20, in its order. */
export const DEAL_CARDS: readonly CardName[] = [
  'Freeze', 'IceWall', 'Strike', 'Haste', 'Flight', 'Sacrifice', 'March', 'Leap', 'Salvation', 'MirrorB', 'Firewall',
  'EarthQuake', 'Burn', 'FireStarter', 'Control', 'Rally', 'MorphP', 'Mimic', 'Vault', 'Curse', 'SkyLift',
];
/** The piece kinds of the "all" sheet: each kind of `POOL` once (spec Q7); a kind brings its `POOL` count. */
export const POOL_KINDS: readonly string[] = [...new Set(POOL)];

export interface Options { fairy: boolean; pool: string[]; arrangement: boolean; classic: boolean; cards: boolean; cardPool: CardName[]; kingPowers: boolean }
export const DEFAULT_OPTIONS: Readonly<Options> = Object.freeze({ fairy: true, pool: [...POOL_KINDS], arrangement: true, classic: false, cards: false, cardPool: [...DEAL_CARDS], kingPowers: false });

const letters = (kinds: string[]): string => [...POOL].filter(l => kinds.includes(l)).join('');

/** Why `o` is not a legal set of options, or null (spec Q7, Q19, Q20). */
export function validate(o: Options): string | null {
  if (o.classic && o.fairy) return 'Classic needs Fairy pieces off.';
  if (o.arrangement && !o.fairy) return 'Arrangement needs Fairy pieces on.';
  if (o.fairy) {
    if (new Set(o.pool).size !== o.pool.length || o.pool.some(k => !POOL_KINDS.includes(k))) return 'Unknown or repeated piece kind.';
    if (letters(o.pool).length < 7) return 'Keep at least 7 pieces in the pool.';
  }
  if (new Set(o.cardPool).size !== o.cardPool.length || o.cardPool.some(c => !DEAL_CARDS.includes(c))) return 'Unknown or repeated card.';
  if (o.cards && o.cardPool.length < 4) return 'Keep at least 4 cards.';
  return null;
}

/** The draw: the army both sides field (8 letters, the king included) and the hand both sides hold. */
export interface Draw { army: string; hand: CardName[] }

/** Draws the army through `randomBackRank` (or the chess start with Classic) and deals 4 cards, the same for both sides. */
export function draw(o: Options, rng: () => number): Draw {
  const error = validate(o); if (error) throw new Error(error);
  const army = o.classic ? CLASSIC_CHESS : randomBackRank(rng, o.fairy ? letters(o.pool) : 'QRRBBNN');
  return { army, hand: o.cards ? shuffle([...o.cardPool], rng).slice(0, 4) : [] };
}

/** The choices each seat makes before the game: a king and power, and its own order of the army. */
export const seatChoicesNeeded = (o: Options): { king: boolean; order: boolean } => ({ king: o.kingPowers, order: o.arrangement });
