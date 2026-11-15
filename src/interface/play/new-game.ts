/**
 * The next game (launch decision 26): one candidate outside the live game. It holds the army, the kings, the hands and
 * the side that the next game uses, so the army on the screen is the army of the new game. No DOM and no storage.
 */
import { Game } from '../../game';
import { A, G, K, KINGS, L, M, O, P, S, colorOf, typeOf, type Color, type KingName, type PieceType, type PowerName, type Rules } from '../../rules/engine';
import { shuffle } from '../../rules/setup';
import { RELEASED_CARDS } from '../../content/cards';
import { rulesOf, type GameType, type Level } from './saved';
import { resolveSide, type SideChoice } from './sides';

// The powers with no use count: the only king powers of a game with cards (APP/src/match/setup.ts:58).
const ALWAYS_ON: readonly PowerName[] = ['HolyLight', 'Mercy', 'DeathTouch', 'Darkness', 'March'];
/** The engine deals the kings and the four shared cards of a game type. */
export function rulesFor(setup: GameType, random: () => number = Math.random): Partial<Rules> {
  if (setup === 'pieces') return rulesOf('pieces', [null, null], [[], []]);
  const kings = (Object.entries(KINGS) as [KingName, readonly PowerName[]][]).flatMap(([king, powers]) => powers.filter(p => setup === 'powers' || ALWAYS_ON.includes(p)).map(power => ({ king, power })));
  const pick = () => kings[Math.floor(random() * kings.length)];
  const hand = setup === 'cards' ? shuffle(RELEASED_CARDS.map(card => card.id), random).slice(0, 4) : [];
  return rulesOf(setup, [pick(), pick()], [hand, hand]);
}
/** A dealt back rank with two different special types at least: two Archers or two Maesters alone are not enough. */
export function dealArmy(): string {
  let back: string;
  do back = new Game(undefined, { kings: [null, null], hands: [[], []] }).backRank;
  while (new Set(back.split('').filter(c => 'ALGMSO'.includes(c))).size < 2);
  return back;
}

/** The accepted choices: the stored setup, the level of the save, the stored side choice. */
export interface Choices { setup: GameType; level: Level; sideChoice: SideChoice }
export interface NewGameDraft extends Choices {
  /** The side of the person, resolved once when the candidate is made (Random draws here, not at the start). */
  player: Color;
  back: string;
  rules: Partial<Rules>;
  /** A preview of the first position. It is never the live game. */
  game: Game;
}
export function createDraft(choices: Choices, random: () => number = Math.random, back = dealArmy()): NewGameDraft {
  const rules = rulesFor(choices.setup, random);
  return { ...choices, player: resolveSide(choices.sideChoice, random), back, rules, game: new Game(back, rules) };
}
/**
 * A change in the New game panel. The level keeps the same game. The side keeps the deal (Random draws when it is
 * chosen). The game type keeps the army and deals its kings and cards once. An unchanged value changes nothing.
 */
export function changeDraft(draft: NewGameDraft, change: Partial<Choices>, random: () => number = Math.random): NewGameDraft {
  let next: NewGameDraft = { ...draft, ...change };
  if (change.sideChoice !== undefined && change.sideChoice !== draft.sideChoice) next.player = resolveSide(change.sideChoice, random);
  if (change.setup !== undefined && change.setup !== draft.setup) {
    const rules = rulesFor(change.setup, random);
    next = { ...next, rules, game: new Game(draft.back, rules) };
  }
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
