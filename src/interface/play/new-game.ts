/**
 * The next game (launch decision 26): one candidate outside the live game. It holds the army, the kings, the hands and
 * the side that the next game uses, so the army on the screen is the army of the new game. No DOM and no storage.
 */
import { Game } from '../../game';
import { GameRules } from '../../game-rules';
import { A, G, K, KINGS, L, M, O, P, S, colorOf, typeOf, type Color, type KingName, type PieceType, type PowerName, type Rules } from '../../rules/engine';
import { POOL, shuffle } from '../../rules/setup';
import { ALWAYS_ON, DEAL_CARDS, POOL_KINDS } from '../../match/setup';
import type { CardName, KingChoice } from '../../rules/rules';
import { hasCards, hasPowers, rulesOf, type GameType, type Level } from './saved';
import { resolveSide, type SideChoice } from './sides';

/** The stored options of the next game (main.ts). */
export const OPTIONS_KEY = 'kingdown.game-options';
/** The piece letters that the selected first and second copies give. */
export const DOUBLE_KINDS = POOL_KINDS.filter(kind => POOL.split(kind).length === 3);
export const poolLetters = (kinds: readonly string[], seconds: readonly string[] = DOUBLE_KINDS) => kinds.map(kind => kind + (seconds.includes(kind) ? kind : '')).join('');
/** The kings and powers that a game of this type can deal: with cards, only the always-on powers (APP/src/match/setup.ts:58). */
export const kingChoices = (setup: GameType): KingChoice[] => !hasPowers(setup) ? [] :
  (Object.entries(KINGS) as [KingName, readonly PowerName[]][]).flatMap(([king, powers]) => powers.filter(power => !hasCards(setup) || ALWAYS_ON.includes(power)).map(power => ({ king, power })));
/** The options of the next game beyond its type: the piece kinds, the arrangement, the cards and your king (owner playtest section 2). */
export interface GameOptions {
  /** The piece kinds that the deal can use: 7 letters or more of the pool. */
  pool: readonly string[];
  /** The selected second copies. A missing field reads the full counts from builds 4 to 6. */
  seconds?: readonly string[];
  arrangement: 'random' | 'manual';
  /** At least four released cards. */
  cardPool: readonly CardName[];
  /** Your preferred king and power; null uses Spirit with Mercy. Cards use a legal power until cards go off. */
  king: KingChoice | null;
}
export const DEFAULT_OPTIONS: Readonly<GameOptions> = Object.freeze({ pool: POOL_KINDS, seconds: DOUBLE_KINDS, arrangement: 'random', cardPool: DEAL_CARDS, king: { king: 'Spirit', power: 'Mercy' } as const });
/** Keep the preferred power; cards use a legal power until cards go off again. */
export function shownKing(setup: GameType, preferred: KingChoice | null): KingChoice {
  const choices = kingChoices(hasCards(setup) ? 'both' : 'powers');
  return choices.find(c => c.king === preferred?.king && c.power === preferred.power)
    ?? choices.find(c => c.king === preferred?.king) ?? { king: 'Spirit', power: 'Mercy' };
}
/** The first copy owns the second: add 2nd adds x1; remove x1 removes 2nd. */
export function selectPiece(options: GameOptions, kind: string, copy: 1 | 2, on: boolean): GameOptions {
  let pool = [...options.pool], seconds = [...(options.seconds ?? DOUBLE_KINDS.filter(k => pool.includes(k)))];
  if (on) { if (!pool.includes(kind)) pool.push(kind); if (copy === 2 && !seconds.includes(kind)) seconds.push(kind); }
  else if (copy === 1) { pool = pool.filter(k => k !== kind); seconds = seconds.filter(k => k !== kind); }
  else seconds = seconds.filter(k => k !== kind);
  return { ...options, pool: POOL_KINDS.filter(k => pool.includes(k)), seconds: DOUBLE_KINDS.filter(k => seconds.includes(k)) };
}
/** Seven pieces must remain to fill the back rank. */
export function poolLocked(pool: readonly string[], kind: string, seconds: readonly string[] = DOUBLE_KINDS, copy: 1 | 2 = 1): boolean {
  const next = selectPiece({ ...DEFAULT_OPTIONS, pool, seconds }, kind, copy, false);
  return (copy === 1 ? pool : seconds).includes(kind) && poolLetters(next.pool, next.seconds).length < 7;
}
/** Decision 124 item 3: the server still deals both copies of each selected kind. */
export const onlinePanelOptions = (options: GameOptions): GameOptions => ({ pool: [...options.pool], arrangement: options.arrangement, cardPool: [...options.cardPool], king: options.king });
export const LEVELS: readonly Level[] = ['casual', 'clever', 'club'];
/** Native slider keys, clamped at the two ends. */
export function levelKey(level: Level, key: string): Level {
  const at = LEVELS.indexOf(level);
  return LEVELS[key === 'Home' ? 0 : key === 'End' ? 2 : Math.max(0, Math.min(2, at + (['ArrowRight', 'ArrowUp'].includes(key) ? 1 : ['ArrowLeft', 'ArrowDown'].includes(key) ? -1 : 0)))];
}
export const cardLocked = (picked: readonly CardName[], card: CardName) => picked.length <= 4 && picked.includes(card);
export const selectCard = (picked: readonly CardName[], card: CardName, on: boolean): readonly CardName[] =>
  !on && cardLocked(picked, card) ? picked : DEAL_CARDS.filter(c => c === card ? on : picked.includes(c));
/** A sign-in return keeps the panel choices, including its card choice. */
export const PANEL_KEY = 'kingdown.new-game-return';
export interface PanelMemory {
  setup: GameType; level: Level; sideChoice: SideChoice; options: GameOptions;
  opponent: 'computer' | 'person'; section: 'pieces' | 'powers' | 'cards' | null;
  deal?: Pick<NewGameDraft, 'back' | 'player' | 'rules'>;
}
export function readPanel(value: unknown): PanelMemory | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as PanelMemory & { cardMode?: 'all' | 'four'; picked?: CardName[] };
  const options = readOptions(v.options);
  if (v.cardMode === 'all') options.cardPool = DEAL_CARDS;
  else if (v.cardMode === 'four') options.cardPool = readOptions({ ...options, cardPool: v.picked }).cardPool;
  if (!['pieces', 'powers', 'cards', 'both'].includes(v.setup) || !LEVELS.includes(v.level) || !['light', 'dark', 'random'].includes(v.sideChoice)) return null;
  const deal = v.deal, kings = deal?.rules?.kings, hands = deal?.rules?.hands;
  const validDeal = deal && /^[A-Z]{8}$/.test(deal.back) && [...deal.back].filter(c => c === 'K').length === 1
    && [...deal.back].every(c => c === 'K' || POOL_KINDS.includes(c)) && (deal.player === 0 || deal.player === 1)
    && Array.isArray(kings) && kings.length === 2 && kings.every(k => hasPowers(v.setup) ? k && kingChoices(v.setup).some(c => c.king === k.king && c.power === k.power) : k === null)
    && Array.isArray(hands) && hands.length === 2 && hands.every(h => Array.isArray(h) && h.length === (hasCards(v.setup) ? 4 : 0) && new Set(h).size === h.length && h.every(c => DEAL_CARDS.includes(c))) && hands[0].join() === hands[1].join();
  return { setup: v.setup, level: v.level, sideChoice: v.sideChoice === 'dark' ? 'dark' : 'light', options, opponent: v.opponent === 'person' ? 'person' : 'computer',
    section: ['pieces', 'powers', 'cards'].includes(v.section ?? '') ? v.section : null,
    ...(validDeal && v.sideChoice !== 'random' ? { deal: { back: deal.back, player: deal.player, rules: rulesOf(v.setup, kings, hands) } } : {}) };
}
/** Reopen the exact preview after sign-in; the card and king checks above admit only this game's content. */
export function restorePanel(memory: PanelMemory): NewGameDraft {
  const draft = createDraft(memory, Math.random, memory.deal?.back);
  return memory.deal ? { ...draft, ...memory.deal, game: new Game(memory.deal.back, memory.deal.rules) } : draft;
}
/** The options of a stored value, each field checked; a wrong field takes its default. */
export function readOptions(value: unknown): GameOptions {
  const v = (value && typeof value === 'object' ? value : {}) as Partial<Record<keyof GameOptions, unknown>>;
  const rawSeconds = v.seconds;
  const seconds = DOUBLE_KINDS.filter(kind => Array.isArray(v.pool) && v.pool.includes(kind) && (!Array.isArray(rawSeconds) || rawSeconds.includes(kind)));
  const validPool = Array.isArray(v.pool) && v.pool.every(kind => POOL_KINDS.includes(kind as string)) && new Set(v.pool).size === v.pool.length && poolLetters(v.pool as string[], seconds).length >= 7;
  const pool = validPool ? v.pool as string[] : DEFAULT_OPTIONS.pool;
  const cardPool = Array.isArray(v.cardPool) && v.cardPool.every(card => DEAL_CARDS.includes(card as CardName)) && new Set(v.cardPool).size === v.cardPool.length && v.cardPool.length >= 4 ? v.cardPool as CardName[] : DEFAULT_OPTIONS.cardPool;
  const k = (v.king === undefined ? DEFAULT_OPTIONS.king : v.king) as KingChoice | null | undefined, king = k && kingChoices('powers').some(c => c.king === k.king && c.power === k.power) ? { king: k.king, power: k.power } : null;
  return { pool, seconds: validPool ? seconds : DEFAULT_OPTIONS.seconds, arrangement: v.arrangement === 'manual' ? 'manual' : 'random', cardPool, king };
}

/** The engine deals the kings and the four shared cards of a game type. Your king (seat `player`) is the chosen one when the type allows it. */
export function rulesFor(setup: GameType, random: () => number = Math.random, options: Pick<GameOptions, 'cardPool' | 'king'> = DEFAULT_OPTIONS, player: Color = 0): Partial<Rules> {
  if (setup === 'pieces') return rulesOf('pieces', [null, null], [[], []]);
  const kings = kingChoices(setup), pick = () => kings[Math.floor(random() * kings.length)];
  const mine = hasPowers(setup) ? shownKing(setup, options.king) : null;
  const dealt: [KingChoice | null, KingChoice | null] = hasPowers(setup) ? [pick(), pick()] : [null, null];
  if (mine) dealt[player] = mine;
  const hand = hasCards(setup) ? shuffle([...options.cardPool], random).slice(0, 4) : [];
  return rulesOf(setup, dealt, [hand, hand]);
}
/** A dealt back rank from the pool, with two different special types at least when the pool has them: two Archers or two Maesters alone are not enough. */
export function dealArmy(pool: readonly string[] = POOL_KINDS, random: () => number = Math.random, seconds: readonly string[] = DOUBLE_KINDS): string {
  const letters = poolLetters(pool, seconds), specials = new Set(letters.split('').filter(c => 'ALGMSO'.includes(c))).size, context = new GameRules();
  let back: string;
  do back = context.randomBackRank(random, letters);
  while (specials >= 2 && new Set(back.split('').filter(c => 'ALGMSO'.includes(c))).size < 2);
  return back;
}

/** The accepted choices: the stored setup, the level of the save, the stored side choice. */
export interface Choices { setup: GameType; level: Level; sideChoice: SideChoice; options?: GameOptions }
export interface NewGameDraft extends Choices {
  options: GameOptions;
  /** The side of the player. A stored Random reads as Light. */
  player: Color;
  back: string;
  rules: Partial<Rules>;
  /** A preview of the first position. It is never the live game. */
  game: Game;
}
export function createDraft(choices: Choices, random: () => number = Math.random, back?: string): NewGameDraft {
  const options = choices.options ?? DEFAULT_OPTIONS, player = resolveSide(choices.sideChoice);
  const rules = rulesFor(choices.setup, random, options, player);
  back ??= dealArmy(options.pool, random, options.seconds);
  return { ...choices, options, player, back, rules, game: new Game(back, rules) };
}
/**
 * A change in the New game panel. The level keeps the same game. The side keeps the deal; a chosen king moves to the new side. The game type, the cards and the king deal the kings and cards once.
 * The piece kinds deal a new army. An unchanged value changes nothing.
 */
export function changeDraft(draft: NewGameDraft, change: Partial<Choices>, random: () => number = Math.random): NewGameDraft {
  let next: NewGameDraft = { ...draft, ...change, options: change.options ?? draft.options };
  if (change.sideChoice !== undefined && change.sideChoice !== draft.sideChoice) next.player = resolveSide(change.sideChoice);
  const was = draft.options, now = next.options;
  const pool = now.pool.join() !== was.pool.join() || now.seconds?.join() !== was.seconds?.join(), deal = next.setup !== draft.setup || now.cardPool.join() !== was.cardPool.join() || JSON.stringify(now.king) !== JSON.stringify(was.king) || next.player !== draft.player && !!now.king;
  if (pool) next.back = dealArmy(now.pool, random, now.seconds);
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
