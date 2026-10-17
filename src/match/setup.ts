/**
 * The plugin game setup (spec "Modules: Game setup"): the initiator's options, the draw, the seat choices and
 * the built match setup. Pure and zod-free, so the app page may import it; the schema is in `setup-schema.ts`.
 * It lives outside `src/rules/`, so it leaves the engine hash (saved matches) alone.
 * `draw` uses `randomBackRank`, which reads the live `RULES`; `validateChoice` always checks the bishops and the guard,
 * so the server must draw under the default rules (a preset with `guardNextToKing: false` can draw an order it refuses).
 */
import { CLASSIC_CHESS, POOL, randomBackRank, shuffle } from '../rules/setup';
import { KINGS, kingLabel, type CardName, type KingChoice, type PowerName } from '../rules/rules';
import type { MatchSetup } from './index';

/** The deal list of spec Q20, in its order. */
export const DEAL_CARDS: readonly CardName[] = [
  'Freeze', 'IceWall', 'Strike', 'Haste', 'Flight', 'Sacrifice', 'March', 'Leap', 'Salvation', 'MirrorB', 'Firewall',
  'EarthQuake', 'Burn', 'FireStarter', 'Control', 'Rally', 'MorphP', 'Mimic', 'Vault', 'Curse', 'SkyLift',
];
/** The piece kinds of the "all" sheet: each kind of `POOL` once (spec Q7); a kind brings its `POOL` count. */
export const POOL_KINDS: readonly string[] = [...new Set(POOL)];

export interface Options { fairy: boolean; pool: readonly string[]; arrangement: boolean; classic: boolean; cards: boolean; cardPool: readonly CardName[]; kingPowers: boolean }
/** The five feature switches that a random game must share with a Find (owner, D1 a). The piece and card pools may differ. */
export const switches = ({ fairy, arrangement, classic, cards, kingPowers }: Options) => JSON.stringify({ fairy, arrangement, classic, cards, kingPowers });
/** Frozen to the arrays: a caller copies them (`[...o.pool]`) before an edit. */
export const DEFAULT_OPTIONS: Readonly<Options> = Object.freeze({ fairy: true, pool: Object.freeze([...POOL_KINDS]), arrangement: true, classic: false, cards: false, cardPool: Object.freeze([...DEAL_CARDS]), kingPowers: false });

const letters = (kinds: readonly string[]): string => [...POOL].filter(l => kinds.includes(l)).join('');

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

/** One seat's choice: its king and power (null with powers off) and its order of the army. */
export interface Choice { king: KingChoice | null; order: string }
/** The powers with no uses under `POWERS_BALANCED`: the only ones a hand allows (`setRules`; spec Q19). A test holds it to the engine. */
export const ALWAYS_ON: readonly PowerName[] = ['HolyLight', 'Mercy', 'DeathTouch', 'Darkness', 'March'];

/** Why `row` is not a legal order of `army`: the same letters, bishops on opposite colours, the guard next to the king (spec Q8). */
function arrangementError(row: string, army: string): string | null {
  if ([...row].sort().join('') !== [...army].sort().join('')) return 'Use the same pieces as the army.';
  const bishops = [...row].flatMap((p, i) => (p === 'B' ? [i] : []));
  if (bishops.length === 2 && (bishops[0] + bishops[1]) % 2 === 0) return 'Bishops must stand on opposite colours.';
  if (row.includes('G') && Math.abs(row.indexOf('G') - row.indexOf('K')) !== 1) return 'The guard must stand next to the king.';
  return null;
}

/** Why a seat's choice is not legal for these options and this draw, or null. */
export function validateChoice(o: Options, d: Draw, c: Choice): string | null {
  const orderError = o.arrangement ? arrangementError(c.order, d.army) : c.order === d.army ? null : 'Use the drawn order.';
  if (orderError) return orderError;
  if (!o.kingPowers) return c.king ? 'King powers are off.' : null;
  if (!c.king || !(Object.hasOwn(KINGS, c.king.king) && KINGS[c.king.king].includes(c.king.power))) return 'Pick a king and one of its two powers.';
  if (o.cards && !ALWAYS_ON.includes(c.king.power)) return 'With cards, pick a power that is always on.';
  return null;
}

/** The seat's choice when it makes none: Spirit/Mercy for White, Shadow/Darkness for Black; a computer arranges at random. */
export function defaultChoice(o: Options, d: Draw, seat: 0 | 1, rng: () => number, computer: boolean): Choice {
  const king: KingChoice | null = !o.kingPowers ? null : seat === 0 ? { king: 'Spirit', power: 'Mercy' } : { king: 'Shadow', power: 'Darkness' };
  let order = d.army;
  if (o.arrangement && computer) do order = shuffle([...d.army], rng).join(''); while (arrangementError(order, d.army));
  return { king, order };
}

/** The match setup from the options, the draw and both seats' choices. */
export function buildSetup(o: Options, d: Draw, seats: readonly [Choice, Choice]): MatchSetup {
  for (const c of seats) { const error = validateChoice(o, d, c); if (error) throw new Error(error); }
  const [w, b] = seats, kings = `${kingLabel(w.king)},${kingLabel(b.king)}`;
  const match: MatchSetup = w.order === b.order ? { backRank: w.order, kings } : { fen: `${b.order.toLowerCase()}/pppppppp/8/8/8/8/PPPPPPPP/${w.order} w - - 0 1`, kings };
  return { ...match, ...(o.classic ? { classic: true } : {}), ...(d.hand.length ? { hand: [...d.hand] } : {}) };
}
