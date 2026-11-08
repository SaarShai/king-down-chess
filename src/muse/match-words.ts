/**
 * What a user says or types, matched against the legal moves only (a closed grammar, never a free guess):
 * exactly one move, a short list of choices, or a refusal with a reason.
 */
import type { PublicMatchRules } from '../match';
import { describeMove } from '../move-text';
import { cardName, POWER_NAME, POWER_TAG } from '../powers-ui';
import { whyNot } from '../read';
import { B, LETTERS, N, NAMES, P, Q, R, T, TAG_POWER, colorOf, file, rank, sqName, typeOf, type Move, type PieceType, type PowerName, type PowerTag } from '../rules/engine';
import { board } from './position';

export interface MoveChoice { id: string; words: string }
/** `many` holds at most 4 choices; `count` is how many moves fit. Reasons are fixed or built from squares and names, never from the said text. */
export type MoveMatch = { kind: 'one'; move: MoveChoice } | { kind: 'many'; choices: MoveChoice[]; count: number } | { kind: 'none'; reason: string; options: MoveChoice[] };

type Flag = 'take' | 'shoot' | 'swap' | 'shove' | 'castle' | 'short' | 'long' | 'pass';
type Item = { k: 'piece'; t: PieceType } | { k: 'sq'; s: number } | { k: 'file'; f: number } | { k: 'rank'; r: number }
  | { k: 'from' } | { k: 'promo' } | { k: 'flag'; flag: Flag } | { k: 'power'; tags: Set<string> } | { k: 'unknown'; w: string };
type Entry = string | Item[];

const FILLER = 'um uh er erm hmm the a an my your please i im want would like to lets let me play move moves go goes on at onto with and then now it its piece square ok okay white black again turn check mate checkmate for of can you make en';
const FILES = ['alfa alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel'];
const RANKS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const VERBS: Record<Flag | 'promo' | 'from', string> = {
  take: 'take capture taking capturing x kill bite biting passant', shoot: 'shoot shot shooting', swap: 'swap swapping switch',
  shove: 'shove push shoving pushing', castle: 'castle castling', short: 'short', long: 'long', pass: 'pass stop end done skip finish',
  promo: 'promote promotion promoting become into =', from: 'from',
};

/** Word (or phrase) to items: built once; only a designed piece's own name is added per call. */
const DICT = new Map<string, Item[]>();
const put = (items: Item[], words: string): void => { for (const w of words.split(' ')) DICT.set(w, items); };
put([], FILLER);
NAMES.forEach((name, t) => { if (t) put([{ k: 'piece', t: t as PieceType }], name); });
put([{ k: 'piece', t: N }], 'horse');
for (const [flag, words] of Object.entries(VERBS)) put([flag === 'promo' || flag === 'from' ? { k: flag } as Item : { k: 'flag', flag: flag as Flag }], words);
const power = (name: string, tag: string): void => {
  for (const key of new Set([name.toLowerCase(), name.toLowerCase().replace(/ /g, '')])) {
    const item = DICT.get(key)?.[0];
    if (item?.k === 'power') item.tags.add(tag); else DICT.set(key, [{ k: 'power', tags: new Set([tag]) }]);
  }
};
for (const p of Object.keys(POWER_NAME) as PowerName[]) if (POWER_TAG[p]) power(POWER_NAME[p], POWER_TAG[p]!);
for (const [tag, card] of Object.entries(TAG_POWER)) power(cardName(card), tag);
power(cardName('Mirror'), 'mirror'); power(cardName('MirrorB'), 'mirror');

const SAN = /^([KQRBNALGMSOCVT])?([a-h][1-8]|[a-h]|[1-8])?(-|x|:|\*|<>|>)?([a-h][1-8])(?:=?([QRBNALGMSOCVT]))?[+#]?$/;
const SEP: Record<string, Flag> = { x: 'take', ':': 'take', '*': 'shoot', '<>': 'swap', '>': 'shove' };
const letter = (l: string): PieceType => LETTERS.indexOf(l.toUpperCase()) as PieceType;
const at = (f: number, r: number): number => f + 8 * r;
const fileOf = (w: string): number => /^[a-h]$/.test(w) ? w.charCodeAt(0) - 97 : FILES.findIndex(names => names.split(' ').includes(w));
const rankOf = (w: string): number => /^[1-8]$/.test(w) ? +w - 1 : RANKS.indexOf(w);

/** Raw text to entries: notation tokens become items at once, other tokens become lower-case words. */
function entries(said: string): Entry[] {
  const text = said.replace(/\b[o0]-[o0]-[o0]\b/gi, ' castle long ').replace(/\b[o0]-[o0]\b/gi, ' castle short ')
    .replace(/\b(king|queen)'?s?[\s-]*side\b/gi, (_, k: string) => k.toLowerCase() === 'king' ? ' short ' : ' long ');
  const out: Entry[] = [];
  for (const raw of text.split(/[\s,;.!?()"]+/).filter(Boolean)) {
    const san = SAN.exec(raw), promo = /^=([a-z])$/i.exec(raw);
    if (san) {
      const [, piece, from, sep, to, promoted] = san, items: Item[] = [];
      if (piece) items.push({ k: 'piece', t: letter(piece) });
      else if (from && /^[a-h]$/.test(from)) items.push({ k: 'piece', t: P });
      if (from?.length === 2) items.push({ k: 'from' }, { k: 'sq', s: at(fileOf(from[0]), rankOf(from[1])) });
      else if (from) items.push(/^[a-h]$/.test(from) ? { k: 'file', f: fileOf(from) } : { k: 'rank', r: rankOf(from) });
      if (sep && SEP[sep]) items.push({ k: 'flag', flag: SEP[sep] });
      items.push({ k: 'sq', s: at(fileOf(to[0]), rankOf(to[1])) });
      if (promoted) items.push({ k: 'promo' }, { k: 'piece', t: letter(promoted) });
      out.push(items);
    } else if (promo && letter(promo[1]) > 0) out.push([{ k: 'promo' }, { k: 'piece', t: letter(promo[1]) }]);
    else out.push(...raw.toLowerCase().replace(/'/g, '').split('-').filter(Boolean));
  }
  return out;
}

const lookup = (w: string): Item[] | undefined => DICT.get(w) ?? (w.endsWith('s') ? DICT.get(w.slice(0, -1)) ?? (w.endsWith('es') ? DICT.get(w.slice(0, -2)) : undefined) : undefined);

/** Entries to items: phrases of up to three words first (power and card names), then a file and a rank, then one word. */
function items(said: string, design: string): Item[] {
  const list = entries(said), out: Item[] = [];
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (typeof e !== 'string') { out.push(...e); continue; }
    const words = (n: number): string => i + n <= list.length && list.slice(i, i + n).every(x => typeof x === 'string') ? list.slice(i, i + n).join(' ') : '';
    const n = [3, 2].find(n => words(n) === design || DICT.has(words(n)));
    if (n) { out.push(...(words(n) === design ? [{ k: 'piece', t: T } as Item] : DICT.get(words(n))!)); i += n - 1; continue; }
    const next = list[i + 1], f = fileOf(e), r = typeof next === 'string' ? rankOf(next) : -1;
    // "= Q": a lone letter after the promotion word names the piece ("a" stays the article).
    if (out.at(-1)?.k === 'promo' && r < 0 && /^[b-z]$/.test(e) && letter(e) > 0) { out.push({ k: 'piece', t: letter(e) }); continue; }
    if (f >= 0 && r >= 0) { out.push({ k: 'sq', s: at(f, r) }); i++; continue; }
    out.push(...(e === design ? [{ k: 'piece', t: T } as Item] : lookup(e) ?? [{ k: 'unknown', w: e } as Item]));
  }
  return out;
}

interface Ask { mover?: PieceType; others: PieceType[]; promo?: PieceType; from?: number; squares: number[]; fromFile?: number; fromRank?: number; flags: Set<Flag>; tags: Set<string>; unknown?: string }

/** A piece named before any square or verb is the mover; one named later is the other piece (the target, or the promotion). */
function ask(said: string, design: string): Ask {
  const a: Ask = { others: [], squares: [], flags: new Set(), tags: new Set() };
  let started = false, promoNext = false, fromNext = false;
  for (const it of items(said, design)) {
    if (it.k === 'piece') {
      if (promoNext) { a.promo = it.t; promoNext = false; } else if (a.mover === undefined && !started) a.mover = it.t; else a.others.push(it.t);
    } else if (it.k === 'sq') { if (fromNext) a.from = it.s; else a.squares.push(it.s); fromNext = false; started = true; }
    else if (it.k === 'from') fromNext = true;
    else if (it.k === 'file') a.fromFile = it.f;
    else if (it.k === 'rank') a.fromRank = it.r;
    else if (it.k === 'promo') { promoNext = started = true; }
    else if (it.k === 'flag') { a.flags.add(it.flag); started = true; }
    else if (it.k === 'power') it.tags.forEach(t => a.tags.add(t));
    else a.unknown ??= it.w;
  }
  return a;
}

/** The squares a phrase may name as the move's aim: where it lands, what it takes, shoves or pushes. A shot stays on its square. */
const aims = (m: Move): number[] => m.pass ? [] : [...(m.to === m.from && m.captures.length ? [] : [m.to]), ...m.captures,
  ...(m.shove ? [m.shove.from, m.shove.to] : []), ...(m.drop2 === undefined ? [] : [m.drop2]), ...(m.pushes ?? []).map(p => p.from)];

const FLAG: Record<Flag, (m: Move) => boolean> = {
  take: m => m.captures.length > 0, shoot: m => m.to === m.from && m.captures.length > 0, swap: m => !!m.swap,
  shove: m => !!(m.shove || m.pushes), castle: m => !!m.castle, short: m => !!m.castle && file(m.to) === 6,
  long: m => !!m.castle && file(m.to) === 2, pass: m => !!m.pass,
};
const PROMO_ORDER: readonly PieceType[] = [Q, R, B, N];

export function moveChoices(rules: PublicMatchRules, fen: string, legal: readonly string[]): MoveChoice[] {
  const { context, pos, moves } = board(rules, fen, legal);
  return moves.map(m => ({ id: m.lan, words: describeMove(context, pos, m.move, true) }));
}

export function matchMove(rules: PublicMatchRules, fen: string, legal: readonly string[], said: string): MoveMatch {
  const { context, pos, moves } = board(rules, fen, legal), text = said.trim();
  const choice = (m: { lan: string; move: Move }): MoveChoice => ({ id: m.lan, words: describeMove(context, pos, m.move, true) });
  const exact = moves.filter(m => m.lan === text), loose = moves.filter(m => m.lan.toLowerCase() === text.toLowerCase());
  if (exact.length || loose.length === 1) return { kind: 'one', move: choice(exact[0] ?? loose[0]) };
  if (!moves.length) return { kind: 'none', reason: 'You have no legal move now.', options: [] };

  const a = ask(text, context.nameOf(T).toLowerCase()), mover = (m: Move): PieceType => m.drop ?? typeOf(pos.board[m.from]);
  const mirror = a.tags.has('mirror'), powered = [...a.tags].some(t => t !== 'mirror');
  // A power or a Mirror the phrase does not name is an extra; a move with an extra never plays unasked.
  const extras = (m: Move): number => m.via ? (mirror ? 0 : 1) : m.power && !powered ? 2 : 0;
  const plainFirst = (list: typeof moves) => [...list].sort((x, y) => extras(x.move) - extras(y.move));
  const none = (reason: string, from: typeof moves): MoveMatch => ({ kind: 'none', reason, options: plainFirst(from).slice(0, 6).map(choice) });
  const named = a.squares.concat(a.from ?? []);
  const near = (): typeof moves => {
    const list = a.mover ? moves.filter(m => mover(m.move) === a.mover)
      : named.length ? moves.filter(m => named.some(s => m.move.from === s || aims(m.move).includes(s))) : moves;
    return list.length ? list : moves;
  };
  if (a.unknown) return none('Some words are not move words. Say a piece and a square, for example "knight to f3".', near());
  if (a.mover === undefined && !a.others.length && a.promo === undefined && !named.length && !a.flags.size && !a.tags.size && a.fromFile === undefined && a.fromRank === undefined) {
    return none('Say a piece and a square, for example "knight to f3".', moves);
  }

  const fits = (from: number | undefined, targets: number[]) => moves.filter(({ move: m }) => {
    if (a.mover !== undefined && mover(m) !== a.mover) return false;
    if (from !== undefined && m.from !== from) return false;
    if ((a.fromFile !== undefined && file(m.from) !== a.fromFile) || (a.fromRank !== undefined && rank(m.from) !== a.fromRank)) return false;
    const aim = aims(m);
    if (!targets.every(s => aim.includes(s))) return false;
    if (a.promo !== undefined && m.promo !== a.promo) return false;
    if (a.others.length) {
      const hit = [...m.captures, ...(m.swap ? [m.to] : []), ...(m.shove ? [m.shove.from] : []), ...(m.pushes ?? []).map(p => p.from)].map(s => typeOf(pos.board[s]));
      if (!a.others.every(t => hit.includes(t) || m.promo === t)) return false;
    }
    for (const flag of a.flags) if (!FLAG[flag](m)) return false;
    if (mirror && !m.via) return false;
    return !powered || (!!m.power && a.tags.has(m.power));
  });
  const from = a.from ?? (a.squares.length > 1 ? a.squares[0] : undefined), targets = a.from === undefined && a.squares.length > 1 ? a.squares.slice(1) : a.squares;
  let fit = fits(from, targets);
  // One square alone names the aim. When no move aims there, it can name the piece that moves ("knight g1"), but a misheard
  // target ("pawn to e4" when the pawn stands on e4) must never move that piece: these are choices, even when only one fits.
  if (!fit.length && from === undefined && targets.length === 1) {
    const own = fits(targets[0], []);
    if (own.length) return { kind: 'many', count: own.length, choices: plainFirst(own).slice(0, 4).map(choice) };
  }
  if (!fit.length) {
    const to = targets[0], piece = from === undefined ? 0 : pos.board[from];
    if (from === undefined || to === undefined || moves.some(m => m.move.from === from && aims(m.move).includes(to))) return none('No legal move matches those words.', near());
    const tag = [...a.tags].find(t => t !== 'mirror') ?? null;
    return none(!piece ? `There is no piece on ${sqName(from)}.` : colorOf(piece) !== pos.turn ? `The ${context.nameOf(typeOf(piece))} on ${sqName(from)} is not yours.`
      : whyNot(context, pos, from, to, tag), near());
  }
  const least = Math.min(...fit.map(m => extras(m.move)));
  fit = fit.filter(m => extras(m.move) === least);
  if (least) {
    const m = fit[0].move, card = m.via && !mirror ? cardName('MirrorB') : cardName(TAG_POWER[m.power as PowerTag]);
    return none(`That move needs ${card}. Say "${card}" to use it.`, fit);
  }
  if (fit.length === 1) return { kind: 'one', move: choice(fit[0]) };
  // Most specific first: a move that lands on a named square, then the stronger promotion; else the legal order.
  const key = (m: Move): number => (targets.includes(m.to) && m.to !== m.from ? 0 : 10) + (m.promo ? PROMO_ORDER.indexOf(m.promo) + 1 || 5 : 0);
  return { kind: 'many', count: fit.length, choices: [...fit].sort((x, y) => key(x.move) - key(y.move)).slice(0, 4).map(choice) };
}
