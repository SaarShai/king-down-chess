/**
 * The next game (launch decision 26): one candidate outside the live game. It holds the army, the kings, the hands and
 * the side that the next game uses, so the army on the screen is the army of the new game. No DOM and no storage.
 */
import { Game } from '../../game';
import { A, G, K, KINGS, L, M, O, P, S, colorOf, typeOf, type Color, type KingName, type PieceType, type PowerName, type Rules } from '../../rules/engine';
import { GameRules } from '../../game-rules';
import { POOL, shuffle } from '../../rules/setup';
import { ALWAYS_ON, DEAL_CARDS, POOL_KINDS } from '../../match/setup';
import type { CardName, KingChoice } from '../../rules/rules';
import { hasCards, hasPowers, rulesOf, type GameType, type Level } from './saved';
import { resolveSide, type SideChoice } from './sides';

/** The stored options of the next game (main.ts). */
export const OPTIONS_KEY = 'kingdown.game-options';
/** The piece letters that a pool of kinds gives, with the counts of the full pool (APP/src/match/setup.ts). */
export const poolLetters = (kinds: readonly string[]) => [...POOL].filter(letter => kinds.includes(letter)).join('');
/** The kings and powers that a game of this type can deal: with cards, only the always-on powers (APP/src/match/setup.ts:58). */
export const kingChoices = (setup: GameType): KingChoice[] => !hasPowers(setup) ? [] :
  (Object.entries(KINGS) as [KingName, readonly PowerName[]][]).flatMap(([king, powers]) => powers.filter(power => !hasCards(setup) || ALWAYS_ON.includes(power)).map(power => ({ king, power })));
/** The options of the next game beyond its type: the piece kinds, the arrangement, the cards and your king (owner playtest section 2). */
export interface GameOptions {
  /** The piece kinds that the deal can use: 7 letters or more of the pool. */
  pool: readonly string[];
  arrangement: 'random' | 'manual';
  /** The cards that the deal takes four from: 4 or more. */
  cardPool: readonly CardName[];
  /** Your king and its power; null deals one at random. A king that the game type does not allow deals at random. */
  king: KingChoice | null;
}
export const DEFAULT_OPTIONS: Readonly<GameOptions> = Object.freeze({ pool: POOL_KINDS, arrangement: 'random', cardPool: DEAL_CARDS, king: null });
/** The options of a stored value, each field checked; a wrong field takes its default. */
export function readOptions(value: unknown): GameOptions {
  const v = (value && typeof value === 'object' ? value : {}) as Partial<Record<keyof GameOptions, unknown>>;
  const pool = Array.isArray(v.pool) && v.pool.every(kind => POOL_KINDS.includes(kind as string)) && new Set(v.pool).size === v.pool.length && poolLetters(v.pool as string[]).length >= 7 ? v.pool as string[] : DEFAULT_OPTIONS.pool;
  const cardPool = Array.isArray(v.cardPool) && v.cardPool.every(card => DEAL_CARDS.includes(card as CardName)) && new Set(v.cardPool).size === v.cardPool.length && v.cardPool.length >= 4 ? v.cardPool as CardName[] : DEFAULT_OPTIONS.cardPool;
  const k = v.king as KingChoice | null | undefined, king = k && kingChoices('powers').some(c => c.king === k.king && c.power === k.power) ? { king: k.king, power: k.power } : null;
  return { pool, arrangement: v.arrangement === 'manual' ? 'manual' : 'random', cardPool, king };
}

/** The engine deals the kings and the four shared cards of a game type. Your king (seat `player`) is the chosen one when the type allows it. */
export function rulesFor(setup: GameType, random: () => number = Math.random, options: Pick<GameOptions, 'cardPool' | 'king'> = DEFAULT_OPTIONS, player: Color = 0): Partial<Rules> {
  if (setup === 'pieces') return rulesOf('pieces', [null, null], [[], []]);
  const kings = kingChoices(setup), pick = () => kings[Math.floor(random() * kings.length)];
  const mine = options.king && kings.find(k => k.king === options.king!.king && k.power === options.king!.power);
  const dealt: [KingChoice | null, KingChoice | null] = hasPowers(setup) ? [pick(), pick()] : [null, null];
  if (mine) dealt[player] = mine;
  const hand = hasCards(setup) ? shuffle([...options.cardPool], random).slice(0, 4) : [];
  return rulesOf(setup, dealt, [hand, hand]);
}
/** A dealt back rank from the pool, with two different special types at least when the pool has them: two Archers or two Maesters alone are not enough. */
export function dealArmy(pool: readonly string[] = POOL_KINDS, random: () => number = Math.random): string {
  const letters = poolLetters(pool), specials = new Set(letters.split('').filter(c => 'ALGMSO'.includes(c))).size;
  let back: string;
  const deal = new GameRules(rulesOf('pieces', [null, null], [[], []]));
  do back = deal.randomBackRank(random, letters);
  while (specials >= 2 && new Set(back.split('').filter(c => 'ALGMSO'.includes(c))).size < 2);
  return back;
}

/** The accepted choices: the stored setup, the level of the save, the stored side choice. */
export interface Choices { setup: GameType; level: Level; sideChoice: SideChoice; options?: GameOptions }
export interface NewGameDraft extends Choices {
  options: GameOptions;
  /** The side of the person, resolved once when the candidate is made (Random draws here, not at the start). */
  player: Color;
  back: string;
  rules: Partial<Rules>;
  /** A preview of the first position. It is never the live game. */
  game: Game;
}
export function createDraft(choices: Choices, random: () => number = Math.random, back?: string): NewGameDraft {
  const options = choices.options ?? DEFAULT_OPTIONS, player = resolveSide(choices.sideChoice, random);
  const rules = rulesFor(choices.setup, random, options, player);
  back ??= dealArmy(options.pool, random);
  return { ...choices, options, player, back, rules, game: new Game(back, rules) };
}
/**
 * A change in the New game panel. The level keeps the same game. The side keeps the deal (Random draws when it is
 * chosen; a chosen king moves to the new side). The game type, the cards and the king deal the kings and cards once.
 * The piece kinds deal a new army. An unchanged value changes nothing.
 */
export function changeDraft(draft: NewGameDraft, change: Partial<Choices>, random: () => number = Math.random): NewGameDraft {
  let next: NewGameDraft = { ...draft, ...change, options: change.options ?? draft.options };
  if (change.sideChoice !== undefined && change.sideChoice !== draft.sideChoice) next.player = resolveSide(change.sideChoice, random);
  const was = draft.options, now = next.options;
  const pool = now.pool.join() !== was.pool.join(), deal = next.setup !== draft.setup || now.cardPool.join() !== was.cardPool.join() || JSON.stringify(now.king) !== JSON.stringify(was.king) || next.player !== draft.player && !!now.king;
  if (pool) next.back = dealArmy(now.pool, random);
  if (deal) next.rules = rulesFor(next.setup, random, now, next.player);
  if (pool || deal) next.game = new Game(next.back, next.rules);
  return next;
}
/** The live game of an accepted candidate: the same army, kings and hands, in a new Game. */
export const startOf = (draft: NewGameDraft): Game => new Game(draft.back, draft.rules);

const ORDER: readonly PieceType[] = [K, A, S, G, M, O, L];
/** The army row: each piece type of one side one time, the king first and the pawn last, with its count. */
export function armyTypes(game: Game, side: Color): { type: PieceType; count: number }[] {
  const codes = [...(game.history[0]?.pos ?? game.pos).board].filter(code => code && colorOf(code) === side), counts = new Map<PieceType, number>();
  for (const code of codes) counts.set(typeOf(code) as PieceType, (counts.get(typeOf(code) as PieceType) ?? 0) + 1);
  const rank = (type: PieceType) => type === P ? 99 : ORDER.includes(type) ? ORDER.indexOf(type) : 10 + type;
  return [...counts].sort(([a], [b]) => rank(a) - rank(b)).map(([type, count]) => ({ type, count }));
}
