/**
 * KD: the real King Down rules engine and computer player, for the showcase demos.
 *
 * build-engine.mjs bundles this file into kit/kd-engine.js. That file sets `globalThis.KD`.
 * It works as a classic <script> and as a side-effect ES module import (kit/kd.js wraps it).
 *
 * The engine keeps its rules in one module-level object (src/rules/rules.ts). A demo can hold
 * more than one game, so each KD state carries its own rule choice, and every KD call applies
 * that choice before it asks the engine anything. The settings are the app's own: a normal game
 * uses the default rules; a Kings' powers game adds POWERS_BALANCED and the two kings (main.ts).
 *
 * States are immutable: KD.play and KD.undo return a new state and do not change the old one.
 */
import {
  BLACK, K, KINGS, NAMES, PLAIN_KINGS, POWERS_BALANCED, RULES, WHITE,
  colorOf, findKing, inCheck, legalMoves, makeMove, moveNumber, parseSq, setRules, sqName, status as engineStatus, typeOf,
  TAG_POWER, cardAt, heldCount,
  type CardName, type Color, type KingChoice, type KingName, type Move, type PieceType, type PowerName, type Position, type Rules,
} from '../../../../../src/rules/engine';
import { CLASSIC_CHESS, fromFen as engineFromFen, randomBackRank, startPosition, toFen as engineToFen, toLan } from '../../../../../src/rules/setup';
import { describeMove, threatsIn } from '../../../../../src/move-text';
import { positionKey, resetSearchState, search } from '../../../../../src/ai/search';
import { setEvaluator } from '../../../../../src/ai/eval';
import { skillPlan, type SkillName } from '../../../../../src/ai/skill';
import { POWER_NAME, POWER_TAG, cardText, needsArming, powerText as appPowerText, powersRules } from '../../../../../src/powers-ui';
import { momentKind, momentText } from '../../../../../src/moment';
import { LESSONS } from '../../../../../src/lessons';

// The app's evaluator (main.ts and ai/worker.ts both set it).
setEvaluator('residual');

type Side = 'w' | 'b';
type KingSpec = KingChoice | KingName | string | null | undefined;

/** One game. Treat it as read-only; KD functions return new states. */
export interface KDState {
  /** The engine position (board, side to move, power state). */
  pos: Position;
  /** [white, black] king choice; null = a king with no power. */
  kings: [KingChoice | null, KingChoice | null];
  /** [white, black] card hands (card mode); empty arrays outside card mode. */
  hands: [CardName[], CardName[]];
  /** The back rank this game started from ('' after fromFen). */
  backRank: string;
  /** Every move so far, oldest first, with the position before it. */
  history: { pos: Position; move: Move; lan: string }[];
  /** positionKey of every position so far (start included), for threefold repetition. */
  keys: number[];
}

/** One legal move, as KD.legal gives it. `raw` is the engine move (do not change it). */
export interface KDMove {
  from: string; to: string; lan: string;
  /** What the move does, in one word (see README): move, capture, shoot, chain, push, swap, power, promote, drop, pass. */
  kind: string;
  capture: boolean;
  /** Squares emptied of enemy pieces, in order. */
  captures: string[];
  /** The Archer shoots without moving. */
  shot: boolean;
  /** The Beast takes more than one piece. */
  chain: boolean;
  /** The Ogre pushes a piece: { from, to } of the pushed piece. */
  push: { from: string; to: string } | null;
  /** The Maester trades places with a friendly piece. */
  swap: boolean;
  /** Promotion: the new piece type ('queen'), else null. */
  promo: string | null;
  /** A king power or a card spent by this move: the engine tag ('strike', 'freeze' ...), else null. */
  power: string | null;
  /** The power's or card's display name ('Strike', 'Ice Wall' ...), else null. */
  powerName: string | null;
  /** In the app the player must arm the power before the board offers this move. */
  needsArming: boolean;
  /** Squares to tap after the piece, in order (the app's click path). */
  path: string[];
  /** A piece enters from beside the board (a waiting guard, Salvation, Spawn). */
  drop: string | null;
  pass: boolean;
  raw: Move;
}

export interface KDCell { type: string; color: Side; sq: string; spent?: true; design?: string }

const SIDE: Side[] = ['w', 'b'];
const SIDE_NAME = ['White', 'Black'];
const nameOf = (t: number): string => NAMES[t] ?? '';
const kingNames = Object.keys(KINGS) as KingName[];

// ---- rules ----------------------------------------------------------------------------------

/** The app's rules for this state: defaults, plus POWERS_BALANCED when a king has a power or a hand is dealt. */
function rulesOf(s: Pick<KDState, 'kings' | 'hands'>): Partial<Rules> {
  const powers = !!(s.kings[0] || s.kings[1]);
  const cards = s.hands[0].length > 0 || s.hands[1].length > 0;
  return {
    ...(powers || cards ? POWERS_BALANCED : {}),
    kings: [s.kings[0], s.kings[1]],
    ...(cards ? { hands: [[...s.hands[0]], [...s.hands[1]]] } : {}),
  };
}

let applied = '';
/** Apply the state's rules to the engine (cheap when they are already in force). */
function use(s: Pick<KDState, 'kings' | 'hands'>): void {
  const key = JSON.stringify([s.kings, s.hands]);
  if (key === applied) return;
  setRules(rulesOf(s));
  if (applied) resetSearchState(); // the search tables hold scores of the other rule set
  applied = key;
}

function parseKingSpec(k: KingSpec): KingChoice | null {
  if (k == null || k === '' || k === 'none') return null;
  if (typeof k === 'object') {
    const king = kingNames.find(n => n.toLowerCase() === String(k.king).toLowerCase());
    if (!king) throw new Error(`KD: unknown king "${k.king}" (${kingNames.join(', ')})`);
    const power = k.power ? KINGS[king].find(p => p.toLowerCase() === String(k.power).toLowerCase()) : KINGS[king][0];
    if (!power) throw new Error(`KD: the ${king} king has no power "${k.power}" (${KINGS[king].join(', ')})`);
    return { king, power };
  }
  const [name, power] = String(k).split(':');
  return parseKingSpec({ king: name as KingName, power: power as PowerName });
}

/** Seeded random numbers (mulberry32), so a demo can show the same random army every time. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function freshState(pos: Position, kings: KDState['kings'], hands: KDState['hands'], backRank: string): KDState {
  return { pos, kings, hands, backRank, history: [], keys: [positionKey(pos)] };
}

function parseHands(cards?: [string[] | null, string[] | null] | null): KDState['hands'] {
  if (!cards) return [[], []];
  return [(cards[0] ?? []).slice() as CardName[], (cards[1] ?? []).slice() as CardName[]];
}

export interface NewGameOptions {
  /** 'random' (default), 'chess' (the chess back rank) or a back rank such as 'RNAQKGOM'. */
  army?: string;
  /** Seed for 'random', so the same army comes back. */
  seed?: number;
  /** Kings' powers: [white, black], each 'Frost', 'Frost:IceWall', { king, power } or null. */
  powers?: [KingSpec, KingSpec] | null;
  /** Card mode (lab): [white hand, black hand], card names such as 'Freeze', 'Haste'. */
  cards?: [string[] | null, string[] | null] | null;
}

function newGame(opts: NewGameOptions = {}): KDState {
  const kings: KDState['kings'] = opts.powers ? [parseKingSpec(opts.powers[0]), parseKingSpec(opts.powers[1])] : [null, null];
  const hands = parseHands(opts.cards);
  use({ kings, hands });
  const army = opts.army ?? 'random';
  const backRank = army === 'random' ? randomBackRank(opts.seed == null ? Math.random : rng(opts.seed))
    : army === 'chess' ? CLASSIC_CHESS : army.toUpperCase();
  return freshState(startPosition(backRank), kings, hands, backRank);
}

function fromFen(fen: string, opts: Pick<NewGameOptions, 'powers' | 'cards'> = {}): KDState {
  const kings: KDState['kings'] = opts.powers ? [parseKingSpec(opts.powers[0]), parseKingSpec(opts.powers[1])] : [null, null];
  const hands = parseHands(opts.cards);
  use({ kings, hands });
  return freshState(engineFromFen(fen), kings, hands, '');
}

const toFen = (s: KDState): string => engineToFen(s.pos);

// ---- reading the board ----------------------------------------------------------------------

/** The king art each side shows: its king's design, or Spirit (White) and Shadow (Black) with no power. */
const designOf = (s: KDState, c: Color): string => (s.kings[c]?.king ?? PLAIN_KINGS[c]).toLowerCase();

function board(s: KDState): (KDCell | null)[] {
  const out: (KDCell | null)[] = [];
  for (let i = 0; i < 64; i++) {
    const p = s.pos.board[i];
    if (!p) { out.push(null); continue; }
    const c = colorOf(p), t = typeOf(p);
    const cell: KDCell = { type: nameOf(t), color: SIDE[c], sq: sqName(i) };
    if (p & 32) cell.spent = true; // a guard that spent its one capture (lab rule)
    if (t === K) cell.design = designOf(s, c);
    out.push(cell);
  }
  return out;
}

// ---- moves ----------------------------------------------------------------------------------

/** The squares a player taps after the piece (main.ts clickPath). */
function clickPath(m: Move): number[] {
  if (m.shove) return [m.shove.from];
  if (m.pass || m.power === 'freeze' || m.power === 'ward' || m.power === 'sacrifice') return [m.to];
  if (m.to === m.from) return m.captures.length ? [m.captures[0]] : [m.to];
  if (m.captures.length > 1) return m.captures;
  if (m.captures.length === 1 && m.to !== m.captures[0]) return [m.captures[0], m.to];
  return [m.to];
}

function powerNameOf(tag: string | undefined): string | null {
  if (!tag) return null;
  const card = TAG_POWER[tag as keyof typeof TAG_POWER];
  if (!card) return null;
  return (POWER_NAME as Record<string, string>)[card] ?? card.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function kindOf(m: Move): string {
  if (m.pass) return 'pass';
  if (m.power && m.power !== 'march' && m.power !== 'leap') return 'power';
  if (m.drop) return 'drop';
  if (m.shove) return 'push';
  if (m.swap) return 'swap';
  if (m.to === m.from && m.captures.length) return 'shoot';
  if (m.captures.length > 1) return 'chain';
  if (m.promo) return 'promote';
  if (m.captures.length) return 'capture';
  return 'move';
}

function wrap(pre: Position, m: Move): KDMove {
  return {
    from: sqName(m.from), to: sqName(m.to), lan: toLan(pre, m),
    kind: kindOf(m),
    capture: m.captures.length > 0,
    captures: m.captures.map(sqName),
    shot: m.to === m.from && m.captures.length > 0,
    chain: m.captures.length > 1,
    push: m.shove ? { from: sqName(m.shove.from), to: sqName(m.shove.to) } : null,
    swap: !!m.swap,
    promo: m.promo ? nameOf(m.promo) : null,
    power: m.power ?? null,
    powerName: powerNameOf(m.power),
    needsArming: needsArming(m),
    path: clickPath(m).map(sqName),
    drop: m.drop ? nameOf(m.drop) : null,
    pass: !!m.pass,
    raw: m,
  };
}

const sqIndex = (sq: string | number): number => (typeof sq === 'number' ? sq : parseSq(sq));

function legal(s: KDState, fromSq?: string | number): KDMove[] {
  use(s);
  if (statusOf(s).over) return [];
  const from = fromSq == null ? null : sqIndex(fromSq);
  return legalMoves(s.pos).filter(m => from == null || m.from === from).map(m => wrap(s.pos, m));
}

/** Find the engine move for a KDMove, a LAN string or { from, to, promo }. */
function resolve(s: KDState, move: KDMove | string | { from: string; to: string; promo?: string }): Move {
  use(s);
  const all = legalMoves(s.pos);
  if (typeof move === 'string') {
    const m = all.find(x => toLan(s.pos, x) === move);
    if (!m) throw new Error(`KD: "${move}" is not a legal move here`);
    return m;
  }
  if (typeof (move as unknown as Move).from === 'number') {
    // An engine move (KDMove.raw): the same object, or the same move by notation.
    const em = move as unknown as Move;
    if (all.includes(em)) return em;
    const m = all.find(x => toLan(s.pos, x) === toLan(s.pos, em));
    if (!m) throw new Error('KD: that engine move is not legal here');
    return m;
  }
  const raw = (move as KDMove).raw;
  if (raw && all.includes(raw)) return raw;
  const lan = (move as KDMove).lan;
  if (lan) {
    const m = all.find(x => toLan(s.pos, x) === lan);
    if (m) return m;
  }
  const from = parseSq(move.from), to = parseSq(move.to), promo = (move as { promo?: string }).promo;
  const hits = all.filter(x => x.from === from && (x.to === to || clickPath(x).at(-1) === to) && !needsArming(x));
  const pick = promo ? hits.find(x => x.promo && nameOf(x.promo) === promo) : hits.find(x => !x.promo || nameOf(x.promo) === 'queen');
  if (!pick && !hits.length) throw new Error(`KD: no legal move ${move.from}-${move.to} here`);
  return pick ?? hits[0];
}

function play(s: KDState, move: KDMove | string | { from: string; to: string; promo?: string }): KDState {
  if (statusOf(s).over) throw new Error('KD: the game is over');
  const m = resolve(s, move);
  const pos = makeMove(s.pos, m);
  return {
    ...s,
    pos,
    history: [...s.history, { pos: s.pos, move: m, lan: toLan(s.pos, m) }],
    keys: [...s.keys, positionKey(pos)],
  };
}

function undo(s: KDState): KDState {
  const last = s.history.at(-1);
  if (!last) return s;
  return { ...s, pos: last.pos, history: s.history.slice(0, -1), keys: s.keys.slice(0, -1) };
}

// ---- status ---------------------------------------------------------------------------------

const REASON_TEXT: Record<string, string> = {
  stalemate: 'Draw by stalemate', draw50: 'Draw by the 50-move rule', drawRepetition: 'Draw by threefold repetition', drawMaterial: 'Draw by insufficient material',
};

function statusOf(s: KDState) {
  use(s);
  let st: string = engineStatus(s.pos);
  if (st === 'playing' && RULES.threefold && s.keys.filter(k => k === s.keys.at(-1)).length >= 3) st = 'drawRepetition';
  const turn = SIDE[s.pos.turn];
  const over = st !== 'playing';
  const kingTaken = findKing(s.pos.board, s.pos.turn) < 0;
  const winner: Side | null = st === 'checkmate' ? SIDE[s.pos.turn ^ 1] : null;
  return {
    over,
    result: !over ? null : winner === 'w' ? '1-0' : winner === 'b' ? '0-1' : '1/2-1/2',
    winner,
    reason: over ? st : null,
    check: !over && inCheck(s.pos),
    turn,
    ply: s.history.length,
    moveNumber: moveNumber(s.pos),
    text: !over ? `${SIDE_NAME[s.pos.turn]} to move`
      : st === 'checkmate' ? `${SIDE_NAME[s.pos.turn ^ 1]} wins ${kingTaken ? 'by king capture' : 'by checkmate'}`
      : REASON_TEXT[st] ?? st,
  };
}

// ---- stories --------------------------------------------------------------------------------

function describe(s: KDState, move: KDMove | string | { from: string; to: string; promo?: string }) {
  const m = resolve(s, move);
  const pre = s.pos, next = play(s, m), after = next.pos;
  const mover = pre.turn as Color, them = (mover ^ 1) as Color;
  const t = m.drop ?? typeOf(pre.board[m.from]);
  const nextStatus = statusOf(next);
  const holds = after.turn === mover;
  const kingsq = findKing(after.board, them);
  return {
    side: SIDE[mover],
    piece: nameOf(t),
    from: sqName(m.from),
    to: sqName(m.to),
    lan: toLan(pre, m),
    kind: kindOf(m),
    captured: m.captures.map(c => nameOf(typeOf(pre.board[c]))),
    capturedOn: m.captures.map(sqName),
    push: m.shove ? { from: sqName(m.shove.from), to: sqName(m.shove.to), piece: nameOf(typeOf(pre.board[m.shove.from])) } : null,
    swap: m.swap ? { with: nameOf(typeOf(pre.board[m.to])) } : null,
    promo: m.promo ? nameOf(m.promo) : null,
    power: powerNameOf(m.power),
    powerTag: m.power ?? null,
    leaves: !!m.selfRemove,
    /** The turn holds (Haste, a free mark): the same side moves again. */
    again: holds,
    check: kingsq >= 0 && inCheck(after, them),
    /** The square of the king in check, or null. */
    checkSq: kingsq >= 0 && inCheck(after, them) ? sqName(kingsq) : null,
    mate: nextStatus.reason === 'checkmate',
    over: nextStatus.over,
    result: nextStatus.result,
    /** The app's own sentence for this move (describeMove). */
    text: describeMove(pre, m),
    /** A short teaching line for a special move (the app's key moment), else null. */
    moment: momentKind(pre, m) ? momentText(pre, m, new Set()) : null,
    /** The board after the move (KD.board). */
    after: board(next),
    /** The game state after the move (the same as KD.play). */
    next,
  };
}

function threats(s: KDState): { pieces: string[]; squares: string[] } {
  use(s);
  const t = threatsIn(s.pos);
  return { pieces: t.pieces.map(sqName), squares: t.squares.map(sqName) };
}

// ---- computer player --------------------------------------------------------------------------

export interface AiOptions { level?: SkillName; ms?: number; random?: () => number }

/** A legal move for the side to move, as the app's computer picks it (skillPlan + search). Synchronous. */
function ai(s: KDState, opts: AiOptions = {}): KDMove | null {
  use(s);
  const all = legalMoves(s.pos);
  if (!all.length || statusOf(s).over) return null;
  const level = opts.level ?? 'beginner';
  const random = opts.random ?? Math.random;
  const plan = skillPlan(level, Math.max(50, Math.min(opts.ms ?? 500, 4000)), s.history.length);
  if (plan.blunder > 0 && random() < plan.blunder) return wrap(s.pos, all[Math.floor(random() * all.length)]);
  const res = search(s.pos, { timeMs: plan.timeMs, temperature: plan.temperature, history: s.keys.slice(0, -1), rng: random });
  const lan = res.move ? toLan(s.pos, res.move) : '';
  const m = all.find(x => toLan(s.pos, x) === lan) ?? all[0];
  return wrap(s.pos, m);
}

// ---- serialising (for a worker, a URL or a save) ----------------------------------------------

function serialize(s: KDState) {
  return { fen: toFen(s), kings: s.kings, hands: s.hands, backRank: s.backRank, lans: s.history.map(h => h.lan), start: s.history.length ? engineToFen(s.history[0].pos) : toFen(s) };
}

/** Rebuild a state from serialize(): replays the moves from the start position, so repetition and undo work. */
function deserialize(o: ReturnType<typeof serialize>): KDState {
  let s = fromFen(o.start, { powers: o.kings, cards: o.hands });
  s = { ...s, backRank: o.backRank };
  for (const lan of o.lans) s = play(s, lan);
  return s;
}

// ---- kings, cards, lessons --------------------------------------------------------------------

/** The six kings with their two powers each, with display names and the app's one-line rules. */
function kings() {
  return kingNames.map(king => ({
    king,
    design: king.toLowerCase(),
    powers: KINGS[king].map(p => ({ power: p, name: POWER_NAME[p], text: appPowerText(p, powersRules()) })),
  }));
}

function powerText(power: string): string {
  const p = (Object.keys(POWER_NAME) as PowerName[]).find(x => x.toLowerCase() === power.toLowerCase().replace(/\s+/g, ''));
  return p ? appPowerText(p, powersRules()) : '';
}

/** Uses of its power a side has left, or null when the power is always on (or there is none). */
function usesLeft(s: KDState, side: Side): number | null {
  use(s);
  const c = side === 'w' ? WHITE : BLACK;
  const power = s.kings[c]?.power;
  if (!power) return null;
  const key = ({ Freeze: 'freezeUses', IceWall: 'iceWallUses', Strike: 'strikeUses', Haste: 'hasteUses', Flight: 'flightUses', Sacrifice: 'sacrificeUses', March: 'marchUses', Leap: 'leapUses' } as Record<string, keyof Rules>)[power];
  if (!key) return null;
  const n = RULES[key] as number;
  if (!n) return null;
  return Math.max(0, n - (s.pos.used?.[c] ?? 0));
}

/** Card mode: a side's cards, dealt and drawn, and whether each one is played. */
function hand(s: KDState, side: Side) {
  use(s);
  const c = side === 'w' ? WHITE : BLACK;
  const used = s.pos.used?.[c] ?? 0, n = heldCount(c, s.pos.drawn?.[c] ?? 0);
  const out = [];
  for (let k = 0; k < n; k++) {
    const card = cardAt(c, k);
    out.push({ card, name: (POWER_NAME as Record<string, string>)[card] ?? card.replace(/([a-z])([A-Z])/g, '$1 $2'), played: !!(used >> k & 1), text: cardText(card, RULES) });
  }
  return out;
}

const lessons = LESSONS.map((l, i) => ({ index: i, name: l.name, fen: l.fen, task: l.task, done: l.done }));
/** Does this move meet lesson i's goal? */
function lessonGoal(i: number, s: KDState, move: KDMove | string): boolean {
  const m = resolve(s, move);
  return LESSONS[i].goal(s.pos, m);
}

const PIECES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'archer', 'paladin', 'guard', 'maester', 'beast', 'ogre'];

const KD = {
  version: 1,
  newGame, fromFen, toFen, board, legal, play, undo,
  status: statusOf, describe, threats, ai,
  serialize, deserialize,
  kings, powerText, usesLeft, hand, lessons, lessonGoal,
  PIECES,
  POWER_TAG: { ...POWER_TAG },
  /** Square helpers: 'e4' <-> 28 (a1 = 0, h8 = 63). */
  sq: { index: (n: string): number => parseSq(n), name: (i: number): string => sqName(i) },
};

(globalThis as unknown as { KD: typeof KD }).KD = KD;
export type KDApi = typeof KD;
