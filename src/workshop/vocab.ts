/**
 * The one table of rule blocks (docs/WORKSHOP.md §4.2, build 1a): for each block its group, its
 * sentence with pills and defaults, the Whens it allows, what it needs, its MATRIX row, the pieces
 * that have it today, and whether Try it shows it. When the owner adds a MATRIX row, the matching
 * entry is one more object here. Types only from model.ts, so the two modules load in any order.
 */
import type { Ability, Body, PieceDesign, Rule, When, Zone } from './model';

/** A piece of a sentence: fixed words, or a pill the player taps to change. */
export type Part = string | { pill: string; text: string };
type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules'>;
export type Choices = readonly (readonly [string, string])[];
export type Group = 'Moving' | 'Taking' | 'Safe' | 'Moving others' | 'Changing' | 'Holding back';

export interface Block {
  a: Ability['a'];
  group: Group;
  /** The rule book row: a bold title and an example under it. */
  title: string;
  example: string;
  /** An event rule happens at one moment; a state rule holds while its When holds. */
  event: boolean;
  /** The rule a tap in the rule book adds. */
  rule: Rule;
  /** The ability's own pill: its key on `does` and its choices (value, words). */
  pill?: { key: string; choices: Choices };
  whens: (w: When) => boolean;
  /** Why it cannot work on this design (the greyed row), or null. */
  needs?: (d: D) => string | null;
  /** A row label in docs/MATRIX.md (the vocab test finds it there). */
  matrix: string;
  /** The pool pieces that have it today. */
  seenOn: Body[];
  /** Try it can show it (the other side never moves, so a Safe rule cannot). */
  tryIt: boolean;
  /** A 24 × 24 path, stroked in currentColor. */
  icon: string;
  /** An event rule's head, with its pills: "When it takes by moving". A state rule's head is its When. */
  head?: (r: Rule) => Part[];
  /** What it does, after the head: "it may take again from the new square (not a king)". */
  say: (r: Rule) => Part[];
  /** A few words, for toasts and fixes: "takes again". */
  short: (r: Rule) => string;
}

const val = (r: Rule, key: string): string => (r.does as unknown as Record<string, string>)[key];
export const choiceText = (c: Choices, v: string): string => c.find(([k]) => k === v)?.[1] ?? v;
const pill = (b: Pick<Block, 'pill'>, r: Rule): Part => ({ pill: b.pill!.key, text: choiceText(b.pill!.choices, val(r, b.pill!.key)) });
const ALWAYS: When = { on: 'always' };

/** Take squares, a shot, a line, or a rule that moves and takes like a piece. */
export const takesAny = (d: D): boolean =>
  d.lines.length > 0 || d.squares.some(s => s.mark !== 'move') || d.rules.some(r => r.does.a === 'movesLike');
/** It takes by moving onto the square: what "takes again" needs. */
export const takesByMoving = (d: D): boolean =>
  d.lines.length > 0 || d.squares.some(s => s.mark === 'both' || s.mark === 'take') || d.rules.some(r => r.does.a === 'movesLike');

export const LIKE: Choices = [['king', 'a king'], ['knight', 'a knight'], ['bishop', 'a bishop'], ['rook', 'a rook'], ['queen', 'a queen']];
export const INTO: Choices = [['choice', 'a piece you choose: queen, rook, bishop or knight'], ['Q', 'a queen'], ['R', 'a rook'], ['B', 'a bishop'], ['N', 'a knight'], ['A', 'an archer']];
const NOT_TAKE: Choices = [['king', 'a king'], ['pawns', 'pawns'], ['any', 'anything']];
const TAKES_NOTHING = 'It takes nothing already.';

export const BLOCKS: readonly Block[] = [
  { a: 'step2', group: 'Moving', title: 'Steps 2 straight ahead', example: 'From its start rank, as a pawn does.', event: false,
    rule: { when: { on: 'zone', zone: 'startRank' }, does: { a: 'step2' } },
    whens: w => w.on === 'always' || (w.on === 'zone' && ['startRank', 'ownHalf', 'enemyHalf'].includes(w.zone)),
    matrix: '4a Movement — special first move', seenOn: ['P'], tryIt: true, icon: 'M7 13l5-5 5 5M7 19l5-5 5 5',
    say: () => ['it may also step 2 squares straight ahead, over an empty square, to an empty square'], short: () => 'steps 2 straight ahead' },
  { a: 'movesLike', group: 'Moving', title: 'Also moves like another piece', example: 'On a center square, it also moves like a queen.', event: false,
    rule: { when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } }, pill: { key: 'as', choices: LIKE },
    // "Always" is offered in its sheet, but it moves the piece's squares into the Moves tab (W6), so it is never stored.
    whens: w => !['always', 'takes', 'firstTake', 'reaches'].includes(w.on),
    matrix: 'C3 moves differently while there', seenOn: [], tryIt: true, icon: 'M4 12h14M13 7l5 5-5 5',
    say: function (r) { return ['it also moves and takes like ', pill(this, r)]; }, short: r => `also moves like ${choiceText(LIKE, val(r, 'as'))}` },
  { a: 'linesPass', group: 'Moving', title: 'Its lines pass over pieces', example: 'It slides past its own pieces, as the Paladin does.', event: false,
    rule: { when: ALWAYS, does: { a: 'linesPass', over: 'own' } }, pill: { key: 'over', choices: [['own', 'its own pieces'], ['any', 'any piece']] },
    whens: w => ['always', 'zone', 'near'].includes(w.on), needs: d => (d.lines.length ? null : 'Paint a line first.'),
    matrix: '4d Hop — over friends only', seenOn: ['L'], tryIt: true, icon: 'M3 18c3-9 15-9 18 0M12 15v4',
    say: function (r) { return ['its lines pass over ', pill(this, r)]; }, short: r => `its lines pass over ${val(r, 'over') === 'own' ? 'its own pieces' : 'any piece'}` },
  { a: 'chain', group: 'Taking', title: 'Takes again', example: 'After a take by moving, it may take again from there.', event: true,
    rule: { when: { on: 'takes' }, does: { a: 'chain' } }, whens: w => w.on === 'takes',
    needs: d => (takesByMoving(d) ? null : 'It needs a square it takes on by moving.'),
    matrix: '6a Trigger on capture', seenOn: ['S'], tryIt: true, icon: 'M4 7l5 5m0-5l-5 5M14 12l5 5m0-5l-5 5',
    head: () => ['When it takes by moving'], say: () => ['it may take again from the new square (not a king)'], short: () => 'takes again' },
  { a: 'cannotBeTaken', group: 'Safe', title: 'Some pieces cannot take it', example: 'For example, pawns cannot take it.', event: false,
    rule: { when: ALWAYS, does: { a: 'cannotBeTaken', by: 'pawns' } }, pill: { key: 'by', choices: [['pawns', 'by pawns'], ['allButKing', 'by anything but a king']] },
    whens: w => ['always', 'zone', 'near', 'beforeMove'].includes(w.on),
    matrix: '2 Shield — cannot be taken by X', seenOn: ['G'], tryIt: false, icon: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z',
    say: function (r) { return ['it cannot be taken ', pill(this, r)]; }, short: r => (val(r, 'by') === 'pawns' ? 'pawns cannot take it' : 'only a king can take it') },
  { a: 'push', group: 'Moving others', title: 'Pushes a piece next to it', example: '1 square straight away, and it follows.', event: false,
    rule: { when: ALWAYS, does: { a: 'push', then: 'follow' } }, pill: { key: 'then', choices: [['follow', 'and follow it'], ['stay', 'and stay']] },
    whens: w => ['always', 'zone', 'near'].includes(w.on),
    matrix: '5a Control — move any adjacent piece', seenOn: ['O'], tryIt: true, icon: 'M3 12h11M10 8l4 4-4 4M19 5v14',
    // "Never a king" is its own sentence, so the sentence with a long When still fits in 120 characters.
    say: function (r) { return ['it may push a piece next to it 1 square straight away, onto an empty square, ', pill(this, r), '. Never a king']; },
    short: () => 'pushes a piece next to it' },
  { a: 'swap', group: 'Moving others', title: 'Swaps with a piece next to it', example: 'It trades squares with a friend.', event: false,
    rule: { when: ALWAYS, does: { a: 'swap', with: 'friend' } }, pill: { key: 'with', choices: [['friend', 'a friend'], ['enemy', 'an enemy']] },
    whens: w => ['always', 'zone'].includes(w.on),
    matrix: '5b Control — friends only', seenOn: ['M'], tryIt: true, icon: 'M4 9h15l-4-4M20 15H5l4 4',
    say: function (r) { return ['it may swap places with ', pill(this, r), ' next to it (not a king)']; },
    short: r => `swaps with ${val(r, 'with') === 'friend' ? 'a friend' : 'an enemy'}` },
  { a: 'becomes', group: 'Changing', title: 'Becomes another piece', example: 'On the last rank, as a pawn does.', event: true,
    rule: { when: { on: 'reaches', zone: 'lastRank' }, does: { a: 'becomes', into: 'choice' } }, pill: { key: 'into', choices: INTO },
    whens: w => w.on === 'firstTake' || (w.on === 'reaches' && w.zone === 'lastRank'),
    matrix: 'Last rank', seenOn: ['P'], tryIt: true, icon: 'M12 21V10M8 14l4-4 4 4M6 7l3 2 3-5 3 5 3-2',
    head: r => ['When it ', { pill: 'when', text: r.when.on === 'firstTake' ? 'takes for the first time' : 'reaches the last rank' }],
    say: function (r) { return ['it becomes ', pill(this, r)]; }, short: r => `becomes ${choiceText(INTO, val(r, 'into')).replace(/:.*/, '')}` },
  { a: 'cannotTake', group: 'Holding back', title: 'Cannot take …', example: 'It cannot take a king.', event: false,
    rule: { when: ALWAYS, does: { a: 'cannotTake', what: 'king' } }, pill: { key: 'what', choices: NOT_TAKE },
    whens: w => ['always', 'zone', 'near', 'beforeMove'].includes(w.on), needs: d => (takesAny(d) ? null : TAKES_NOTHING),
    matrix: '3 Handicap — cannot take X', seenOn: ['L'], tryIt: true, icon: 'M5 5l14 14M12 3a9 9 0 1 0 .01 0',
    say: function (r) { return ['it cannot take ', pill(this, r)]; }, short: r => `cannot take ${choiceText(NOT_TAKE, val(r, 'what'))}` },
  { a: 'removedAfter', group: 'Holding back', title: 'Is removed after it takes', example: 'It takes a piece and leaves the board too.', event: true,
    rule: { when: { on: 'takes' }, does: { a: 'removedAfter', what: 'piece' } }, pill: { key: 'what', choices: [['piece', 'a piece, not a pawn'], ['any', 'anything']] },
    whens: w => w.on === 'takes', needs: d => (takesAny(d) ? null : TAKES_NOTHING),
    matrix: '6a Trigger on capture', seenOn: ['L'], tryIt: true, icon: 'M6 6l12 12M18 6L6 18',
    head: function (r) { return ['When it takes ', pill(this, r)]; }, say: () => ['it is removed too'], short: () => 'is removed after it takes' },
];
export const GROUPS: readonly Group[] = ['Moving', 'Taking', 'Safe', 'Moving others', 'Changing', 'Holding back'];
export const blockOf = (a: Ability['a']): Block => BLOCKS.find(b => b.a === a)!;

/* ---- Whens (§4.3) ---- */

export const ZONE_WORDS: Record<Zone, string> = { startRank: 'on its start rank', ownHalf: 'in your half', enemyHalf: 'in the enemy half', lastRank: 'on the last rank', capital: 'on a center square' };
export const NEAR_BODY: Record<Body, string> = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast', O: 'ogre' };
/** The When as words: "on a center square", "next to your king", "always". */
export function whenWords(w: When): string {
  switch (w.on) {
    case 'always': return 'always';
    case 'zone': return ZONE_WORDS[w.zone];
    case 'near': return w.who === 'king' ? 'next to your king' : w.who === 'friend' ? 'next to one of your pieces' : w.who === 'enemy' ? 'next to an enemy piece' : `next to your ${NEAR_BODY[w.who]}`;
    case 'fromMove': return `from move ${w.n}`;
    case 'beforeMove': return `before move ${w.n}`;
    case 'afterFirstCapture': return 'after its first capture';
    case 'afterCard': return 'on your turn after your opponent plays any card';
    case 'takes': return 'when it takes';
    case 'firstTake': return 'when it takes for the first time';
    case 'reaches': return 'when it reaches the last rank';
  }
}
const BODY_KEYS = Object.keys(NEAR_BODY);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
/** An object with exactly these keys. */
export const keysAre = (o: unknown, k: readonly string[]): o is Record<string, unknown> =>
  isObj(o) && Object.keys(o).sort().join() === [...k].sort().join();
/** The When is well formed. */
export function validWhen(w: unknown): w is When {
  if (!isObj(w)) return false;
  switch (w.on) {
    case 'always': case 'afterFirstCapture': case 'takes': case 'firstTake': return keysAre(w, ['on']);
    case 'zone': return keysAre(w, ['on', 'zone']) && Object.hasOwn(ZONE_WORDS, w.zone as string);
    case 'reaches': return keysAre(w, ['on', 'zone']) && w.zone === 'lastRank';
    case 'near': return keysAre(w, ['on', 'who']) && ['king', 'friend', 'enemy', ...BODY_KEYS].includes(w.who as string);
    case 'fromMove': case 'beforeMove': return keysAre(w, ['on', 'n']) && [5, 10, 15, 20].includes(w.n as number);
    case 'afterCard': return keysAre(w, ['on', 'card']) && w.card === 'any';
    default: return false;
  }
}
/** The ability is one of the blocks, with a value its pill offers. */
export function validDoes(v: unknown): v is Ability {
  const b = isObj(v) ? BLOCKS.find(x => x.a === v.a) : undefined;
  if (!b || !isObj(v)) return false;
  return b.pill ? keysAre(v, ['a', b.pill.key]) && b.pill.choices.some(([k]) => k === v[b.pill!.key]) : keysAre(v, ['a']);
}
/** The rule is well formed and its When fits its block. */
export const whenOk = (r: Rule): boolean => keysAre(r, ['when', 'does']) && validWhen(r.when) && validDoes(r.does) && blockOf(r.does.a).whens(r.when);

/** The When sheet (W6): the first six, then "More choices". A sheet shows only the ones its rule allows. */
export const TOP_WHENS: readonly When[] = [ALWAYS, { on: 'zone', zone: 'capital' }, { on: 'zone', zone: 'enemyHalf' }, { on: 'near', who: 'king' }, { on: 'fromMove', n: 10 }, { on: 'afterFirstCapture' }];
export const MORE_WHENS: readonly When[] = [
  { on: 'zone', zone: 'ownHalf' }, { on: 'zone', zone: 'startRank' }, { on: 'zone', zone: 'lastRank' },
  { on: 'near', who: 'friend' }, { on: 'near', who: 'enemy' },
  ...(BODY_KEYS as Body[]).map((who): When => ({ on: 'near', who })),
  ...([5, 15, 20] as const).map((n): When => ({ on: 'fromMove', n })),
  ...([5, 10, 15, 20] as const).map((n): When => ({ on: 'beforeMove', n })),
  { on: 'afterCard', card: 'any' },
];
export const EVENT_WHENS: readonly When[] = [{ on: 'reaches', zone: 'lastRank' }, { on: 'firstTake' }];
