/**
 * The text generator (revision 3 §4.10): the Moves, Takes and Special lines of a piece, the
 * sentence of each rule (with its pills, for the editor), the worth in words, and the escaper.
 * Pure, so the tests run it in Node.
 * "Revision 3" and the section numbers (§, W) cite docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
 */
import { bandOf, type Verdict } from './judge';
import { DIAG, DIRS, ORTHO, type Ability, type Dir, type LikeAs, type PieceDesign, type Rule, type Square, type When } from './model';
import { blockOf, choiceText, whenWords, type Part } from './vocab';

type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules'>;
/** The one escaper of the Workshop (a copy of `esc` in src/account/account.ts). */
export const esc = (s: string): string => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Rounded to halves: "4½", "½", "10". */
export function halves(w: number): string {
  const r = Math.round(Math.max(0, w) * 2) / 2, n = Math.floor(r);
  return r === n ? String(n) : n ? `${n}½` : '½';
}
/** "about 4½ pawns", "about half a pawn", "about 1 pawn" (the word "about" is the caller's). */
export function pawns(w: number): string {
  const h = halves(w);
  return h === '½' ? 'half a pawn' : h === '1' ? '1 pawn' : `${h} pawns`;
}

/* ---- square groups ---- */

/** A group is the squares one "Paint on: All sides" tap makes: same (max, min) of |x|, |y|. */
export const orbitOf = (x: number, y: number): [number, number] => [Math.max(Math.abs(x), Math.abs(y)), Math.min(Math.abs(x), Math.abs(y))];
const orbitSize = ([a, b]: [number, number]): number => (b === 0 || a === b ? 4 : 8);
/** The points grouped by orbit, nearest first. */
export function groupsOf(pts: readonly { x: number; y: number }[]): { orbit: [number, number]; pts: { x: number; y: number }[] }[] {
  const by = new Map<string, { orbit: [number, number]; pts: { x: number; y: number }[] }>();
  for (const p of pts) { const o = orbitOf(p.x, p.y), k = o.join(); if (!by.has(k)) by.set(k, { orbit: o, pts: [] }); by.get(k)!.pts.push(p); }
  return [...by.values()].sort((a, b) => a.orbit[0] - b.orbit[0] || a.orbit[1] - b.orbit[1]);
}
const sq = (n: number): string => `${n} square${n > 1 ? 's' : ''}`;
const side = (ps: { x: number }[]): string => (ps.length > 1 ? '' : ps[0].x > 0 ? ' right' : ' left');
/** One group in words: "2 squares straight ahead", "in a forward L". */
export function groupPhrase(orbit: [number, number], pts: readonly { x: number; y: number }[]): string {
  const [a, b] = orbit, full = pts.length === orbitSize(orbit), has = (x: number, y: number) => pts.some(p => p.x === x && p.y === y);
  if (b === 0) {
    if (full) return `${sq(a)} straight`;
    const v = has(0, a) && has(0, -a) ? 'straight ahead and back' : has(0, a) ? 'straight ahead' : has(0, -a) ? 'straight back' : '';
    const h = has(a, 0) && has(-a, 0) ? 'sideways' : has(a, 0) ? 'to the right' : has(-a, 0) ? 'to the left' : '';
    return `${sq(a)} ${[v, h].filter(Boolean).join(' and ')}`;
  }
  if (a === b) {
    if (full) return `${sq(a)} diagonally`;
    const f = pts.filter(p => p.y > 0), k = pts.filter(p => p.y < 0);
    return `${sq(a)} diagonally ${[f.length ? `forward${side(f)}` : '', k.length ? `back${side(k)}` : ''].filter(Boolean).join(' and ')}`;
  }
  const shape = a === 2 ? 'L' : `long L (${a} and ${b})`;
  if (full) return `in ${a === 2 ? 'an' : 'a'} ${shape}`;
  if (pts.every(p => p.y > 0)) return `in a forward ${shape}`;
  if (pts.every(p => p.y < 0)) return `in a back ${shape}`;
  return `in ${a === 2 ? 'an' : 'a'} ${shape}, not every way`;
}
/** The lines in words: "slides straight", "slides straight ahead and back". */
export function lineWords(lines: readonly Dir[]): string {
  if (lines.length === 8) return 'slides any way';
  const o = ORTHO.filter(d => lines.includes(d)), g = DIAG.filter(d => lines.includes(d)), has = (d: Dir) => lines.includes(d);
  const ortho = o.length === 4 ? 'straight' : [has('n') && has('s') ? 'straight ahead and back' : has('n') ? 'straight ahead' : has('s') ? 'straight back' : '',
    has('e') && has('w') ? 'sideways' : has('e') ? 'to the right' : has('w') ? 'to the left' : ''].filter(Boolean).join(' and ');
  const f = (['ne', 'nw'] as Dir[]).filter(has), k = (['se', 'sw'] as Dir[]).filter(has), one = (ds: Dir[]) => (ds.length > 1 ? '' : ds[0].endsWith('e') ? ' right' : ' left');
  const diag = g.length === 4 ? 'diagonally' : g.length ? `diagonally ${[f.length ? `forward${one(f)}` : '', k.length ? `back${one(k)}` : ''].filter(Boolean).join(' and ')}` : '';
  return `slides ${[ortho, diag].filter(Boolean).join(' and ')}`;
}
/** "a, b or c"; more than 3 groups read "to 14 squares" (SAVED lists every square). */
function phrases(pts: readonly { x: number; y: number }[], extra: string[] = []): string {
  const gs = groupsOf(pts).map(g => groupPhrase(g.orbit, g.pts));
  const all = gs.length > 3 ? [`to ${pts.length} squares`, ...extra] : [...gs, ...extra];
  return all.length < 2 ? all.join('') : `${all.slice(0, -1).join(', ')} or ${all[all.length - 1]}`;
}
const same = (pts: readonly { x: number; y: number }[], offs: readonly [number, number][]): boolean =>
  pts.length === offs.length && offs.every(([x, y]) => pts.some(p => p.x === x && p.y === y));
const KING8: [number, number][] = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
const KNIGHT8: [number, number][] = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const isLines = (lines: readonly Dir[], set: readonly Dir[]): boolean => lines.length === set.length && set.every(d => lines.includes(d));
const jumps = (s: Square): boolean => Math.max(Math.abs(s.x), Math.abs(s.y)) > 1;

/* ---- every square, exactly ---- */

/** "2 up, 1 right": the editor's board labels (forward is up). */
export const dirWords = (x: number, y: number): string =>
  [y > 0 ? `${y} up` : y < 0 ? `${-y} down` : '', x > 0 ? `${x} right` : x < 0 ? `${-x} left` : ''].filter(Boolean).join(', ');

/* ---- rule sentences ---- */

/** A rule's sentence as parts. The editor shows "Always" as a pill; the card leaves it out. */
export function ruleParts(r: Rule, editor = false): Part[] {
  const b = blockOf(r.does.a), say = b.say(r);
  const head: Part[] = b.head ? b.head(r) : r.when.on === 'always' ? (editor ? [{ pill: 'when', text: 'Always' }] : []) : [{ pill: 'when', text: cap(whenWords(r.when)) }];
  if (head.length) return [...head, ', ', ...say, '.'];
  return [cap(say[0] as string), ...say.slice(1), '.'];
}
export const partsText = (ps: readonly Part[]): string => ps.map(p => (typeof p === 'string' ? p : p.text)).join('');
export const ruleText = (r: Rule): string => partsText(ruleParts(r));

/** The short line of each block on the Proving Ground's plinth (its spec, decision 38; proving-ground.html:979-1005), with the block's pill. */
const LINE: Record<Ability['a'], (pill: Part) => Part[]> = {
  step2: () => ['steps 2 straight ahead'], movesLike: p => ['also moves like ', p], linesPass: p => ['its lines pass over ', p],
  chain: () => ['it may take again (not a king)'], cannotBeTaken: p => ['cannot be taken ', p], push: p => ['pushes a piece next to it ', p],
  swap: p => ['swaps with ', p, ' next to it'], becomes: p => ['becomes ', p], cannotTake: p => ['cannot take ', p], removedAfter: () => ['it is removed too'],
};
/** A pill's words on the Proving Ground: "a piece you choose", with no list after a colon. */
export const brief = (s: string): string => s.replace(/:.*/, '');
/** A rule on the Proving Ground: `after`, the parts after its When chip (the When's own pill: "a piece, not a pawn");
 *  `line`, its short line; `say`, its sentence on the Rules shelf (proving-ground.html:1426), the long one of the block. */
export function lineParts(r: Rule): { after: Part[]; line: Part[]; say: Part[] } {
  const b = blockOf(r.does.a), short = (p: Part): Part => (typeof p === 'string' ? p : { ...p, text: brief(p.text) });
  const p: Part = b.pill ? { pill: b.pill.key, text: brief(choiceText(b.pill.choices, (r.does as unknown as Record<string, string>)[b.pill.key])) } : '';
  const say = b.say(r).map(short);
  return { after: r.does.a === 'removedAfter' ? [p] : [], line: LINE[r.does.a](p), say: [cap(say[0] as string), ...say.slice(1), '.'] };
}

/* ---- the When choices (the When sheet; the Proving Ground's When chip) ---- */

/** A When choice in words. "Always" for "moves like" adds that piece's squares to Moves. */
export const whenLabel = (w: When, like: boolean): string =>
  w.on === 'always' && like ? 'Always (adds it to Moves)' : w.on === 'zone' && w.zone === 'capital' ? 'On a center square (d4 e4 d5 e5)' : cap(whenWords(w));
/** Why "Always" cannot take a "moves like" rule into Moves (likeAlways gives null). */
export const LIKE_CLASH = 'Its shots and these moves meet on a square, and a square cannot hold both. Keep it as a rule.';
/** What "Always" added to Moves, for its toast. */
export const LIKE_ADDED: Record<LikeAs, string> = { king: "the king's squares", knight: "the knight's squares", bishop: "the bishop's lines", rook: "the rook's lines", queen: "the queen's lines" };

/* ---- describe ---- */

export interface Described { moves: string; takes: string; special: string[]; summary: string }
export function describe(d: D): Described {
  const M = d.squares.filter(s => s.mark === 'both' || s.mark === 'move' || s.mark === 'moveShoot');
  const T = d.squares.filter(s => s.mark === 'both' || s.mark === 'take');
  const S = d.squares.filter(s => s.mark === 'shoot' || s.mark === 'moveShoot');
  const L = DIRS.filter(x => d.lines.includes(x));
  let moves: string;
  if (!M.length && !L.length) moves = d.rules.some(r => r.does.a === 'movesLike' || r.does.a === 'step2') ? 'only as its rules say.' : 'nowhere.';
  else if (!L.length && same(M, KING8)) moves = '1 square any way, like a king.';
  else if (!L.length && same(M, KNIGHT8)) moves = 'in an L, like a knight.';
  else if (!M.length && isLines(L, DIAG)) moves = 'like a bishop.';
  else if (!M.length && isLines(L, ORTHO)) moves = 'like a rook.';
  else if (!M.length && L.length === 8) moves = 'like a queen.';
  else if (!L.length && same(M, [[0, 1]]) && same(T, [[1, 1], [-1, 1]]) && !S.length) moves = 'like a pawn.';
  else moves = `${phrases(M, L.length ? [lineWords(L)] : [])}.${M.some(jumps) ? ' It lands on a painted square, even past other pieces.' : ''}`;
  let takes: string;
  if ((d.squares.length || L.length) && d.squares.every(s => s.mark === 'both')) takes = 'the same squares.';
  else if (!T.length && !S.length && !L.length) takes = d.rules.some(r => r.does.a === 'movesLike') ? 'only as its rules say.' : 'nothing.';
  else takes = [T.length || L.length ? `${phrases(T, L.length ? [lineWords(L)] : [])}.` : '', S.length ? `Shoots without moving: ${phrases(S)}.` : ''].filter(Boolean).join(' ');
  if (d.rules.some(r => r.does.a === 'cannotBeTaken' && r.does.by === 'allButKing')) takes += ' Only a king can take it.';
  const special = d.rules.map(ruleText);
  return { moves, takes, special, summary: [`Moves ${moves}`, takes.startsWith('Shoots') ? takes : `Takes ${takes}`, ...special].join(' ') };
}

/** Copy as text (§7.6): the sentences, a MATRIX-style row and the link. `v` is the judge's verdict of `d`. */
export function designText(d: D & Pick<PieceDesign, 'name'>, v: Verdict, link: string): string {
  const t = describe(d), band = bandOf(v);
  const parts = [`squares: moves ${t.moves.replace(/\.$/, '')}; takes ${t.takes.replace(/\.$/, '')}`, ...d.rules.map(r => `${blockOf(r.does.a).matrix}: ${ruleText(r).replace(/\.$/, '')}`)];
  return [d.name, `Moves: ${t.moves}`, `Takes: ${t.takes}`, ...t.special.map(s => `Special: ${s}`), `About ${pawns(v.worth.point)}. ${band}.`, '',
    `| ${d.name} | piece | ${parts.join(' · ')} | ${v.worth.point.toFixed(2)} | ${band.toLowerCase()} |`, '', link].join('\n');
}
