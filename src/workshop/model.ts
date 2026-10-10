/**
 * The Workshop's stored form of a piece (revision 3 §3): painted squares, lines and at most 3
 * rules. Here too: the presets (§4.7), "Paint on", the canonical key, the hard limits (§4.9) and the
 * share code. Pure, so the judge and the tests run it in Node.
 * "Revision 3" and the section numbers (§, W) cite docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
 */
import { figureById } from './figures';
import type { KingName } from '../rules/engine';
import { BLOCKS, BODY, keysAre, takesAny, whenOk } from './vocab';

export type Body = 'P' | 'N' | 'B' | 'R' | 'Q' | 'A' | 'L' | 'G' | 'M' | 'S' | 'O';
export type Mark = 'both' | 'move' | 'take' | 'shoot' | 'moveShoot';
export type Dir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
export type Zone = 'startRank' | 'ownHalf' | 'enemyHalf' | 'lastRank' | 'capital';
export type MoveN = 5 | 10 | 15 | 20;
/** MATRIX D.1. A state holds for a while; an event happens at one moment. */
export type When =
  | { on: 'always' }
  | { on: 'zone'; zone: Zone }
  | { on: 'near'; who: 'king' | 'friend' | 'enemy' | Body }
  | { on: 'fromMove'; n: MoveN } | { on: 'beforeMove'; n: MoveN }
  | { on: 'afterFirstCapture' }
  | { on: 'afterCard'; card: 'any' }
  | { on: 'takes' } | { on: 'firstTake' }
  | { on: 'reaches'; zone: 'lastRank' };
/** The pieces that "also moves like" can name. */
export type LikeAs = 'king' | 'knight' | 'bishop' | 'rook' | 'queen';
/** The 10 rule blocks of build 1a (§4.2); vocab.ts has the sentence and the limits of each. */
export type Ability =
  | { a: 'step2' }
  | { a: 'movesLike'; as: LikeAs }
  | { a: 'linesPass'; over: 'own' | 'any' }
  | { a: 'chain' }
  | { a: 'cannotBeTaken'; by: 'pawns' | 'allButKing' }
  | { a: 'push'; then: 'follow' | 'stay' }
  | { a: 'swap'; with: 'friend' | 'enemy' }
  | { a: 'becomes'; into: 'choice' | 'Q' | 'R' | 'B' | 'N' | 'A' }
  | { a: 'cannotTake'; what: 'king' | 'pawns' | 'any' }
  | { a: 'removedAfter'; what: 'piece' | 'any' };
export interface Rule { when: When; does: Ability }
/** x to the right, y forward, both in −3..3, never (0, 0). Black's pattern is the mirror image. */
export interface Square { x: number; y: number; mark: Mark }
export interface Look { figure?: string; body: Body | 'token'; auto: boolean; glow: KingName | null; army: 0 | 1 }
export interface PieceDesign {
  v: 1; kind: 'piece';
  /** Random, on the device only; not in the share code. */
  id: string;
  name: string;
  /** True once the player typed or rolled a name; until then the name follows the design. */
  named: boolean;
  look: Look;
  letter: string;
  /** True once the player chose the letter; until then it follows the name. Absent in designs saved before it. */
  ownLetter?: boolean;
  squares: Square[];
  /** It slides that way until a piece stops it, and it may take that piece. */
  lines: Dir[];
  rules: Rule[];
  from: string[];
  updated: number;
}
/** "Paint on": all 8 turns and reflections, across the file only, or one square. Editor state, never stored. */
export type PaintOn = 'all' | 'lr' | 'one';

export const BODIES = Object.keys(BODY) as readonly Body[];
export const DIRS: readonly Dir[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
export const DIR: Record<Dir, readonly [number, number]> = { n: [0, 1], ne: [1, 1], e: [1, 0], se: [1, -1], s: [0, -1], sw: [-1, -1], w: [-1, 0], nw: [-1, 1] };
export const ORTHO: readonly Dir[] = ['n', 'e', 's', 'w'];
export const DIAG: readonly Dir[] = ['ne', 'se', 'sw', 'nw'];
/** Letters the engine does not use (src/rules/engine.ts LETTERS), and E (the Squire, MATRIX A.3). */
export const FREE_LETTERS = 'DFHIJUWXYZ';
export const MAX_RULES = 3;
/** The words of a try to add a rule past MAX_RULES. */
export const FULL = '3 of 3 rules. Remove one to add another.';
/** The longest share code: the largest design the editor can make is about 2,800 characters (a unit test). */
export const MAX_CODE = 4000;

/** The squares one tap paints. */
export function orbit(x: number, y: number, on: PaintOn): [number, number][] {
  const all: [number, number][] = on === 'one' ? [[x, y]] : on === 'lr' ? [[x, y], [-x, y]]
    : [[x, y], [-x, y], [x, -y], [-x, -y], [y, x], [-y, x], [y, -x], [-y, -x]];
  return [...new Map(all.map(p => [p.join(), p])).values()];
}
/** The lines one tap paints: the 4 of its kind, it and its mirror across the file, or one. */
export function lineOrbit(d: Dir, on: PaintOn): Dir[] {
  if (on === 'all') return [...(ORTHO.includes(d) ? ORTHO : DIAG)];
  if (on === 'one') return [d];
  const [x, y] = DIR[d];
  return [...new Set([d, DIRS.find(e => DIR[e][0] === -x && DIR[e][1] === y)!])];
}
const sq = (offs: [number, number][], mark: Mark, on: PaintOn = 'all'): Square[] =>
  offs.flatMap(([x, y]) => orbit(x, y, on)).map(([x, y]) => ({ x, y, mark }));
export const KING_STEP = (mark: Mark): Square[] => sq([[0, 1], [1, 1]], mark);
export const KNIGHT_JUMP = (): Square[] => sq([[1, 2]], 'both');
const rule = (when: When, does: Ability): Rule => ({ when, does });
const ALWAYS: When = { on: 'always' };

export interface Preset {
  key: string; name: string; body: Body | 'token'; paintOn: PaintOn;
  squares: Square[]; lines: Dir[]; rules: Rule[];
  /** What the Workshop leaves out of the real piece. */
  note?: string;
}
/** §4.7: the pool pieces in Workshop words, from White's side. A unit test proves each equals the engine's piece. */
export const PRESETS: readonly Preset[] = [
  { key: 'pawn', name: 'Pawn', body: 'P', paintOn: 'lr', squares: [{ x: 0, y: 1, mark: 'move' }, ...sq([[1, 1]], 'take', 'lr')], lines: [],
    rules: [rule({ on: 'zone', zone: 'startRank' }, { a: 'step2' }), rule({ on: 'reaches', zone: 'lastRank' }, { a: 'becomes', into: 'choice' })] },
  { key: 'knight', name: 'Knight', body: 'N', paintOn: 'all', squares: KNIGHT_JUMP(), lines: [], rules: [] },
  { key: 'bishop', name: 'Bishop', body: 'B', paintOn: 'all', squares: [], lines: [...DIAG], rules: [] },
  { key: 'rook', name: 'Rook', body: 'R', paintOn: 'all', squares: [], lines: [...ORTHO], rules: [] },
  { key: 'queen', name: 'Queen', body: 'Q', paintOn: 'all', squares: [], lines: [...DIRS], rules: [] },
  // Today's Archer (`far2`, owner 2026-10-09): steps 1 any way, shoots only 2 straight and 2 diagonally forward.
  { key: 'archer', name: 'Archer', body: 'A', paintOn: 'lr', lines: [], rules: [],
    squares: [...sq([[0, 1]], 'move'), ...sq([[1, 1]], 'move'), ...sq([[0, 2], [2, 0], [0, -2], [2, 2]], 'shoot', 'lr')] },
  { key: 'paladin', name: 'Paladin', body: 'L', paintOn: 'all', squares: [], lines: [...DIRS],
    rules: [rule(ALWAYS, { a: 'linesPass', over: 'own' }), rule({ on: 'takes' }, { a: 'removedAfter', what: 'piece' }), rule(ALWAYS, { a: 'cannotTake', what: 'king' })] },
  { key: 'guard', name: 'Guard', body: 'G', paintOn: 'all', squares: KING_STEP('move'), lines: [], rules: [rule(ALWAYS, { a: 'cannotBeTaken', by: 'allButKing' })] },
  { key: 'maester', name: 'Maester', body: 'M', paintOn: 'all', squares: KING_STEP('both'), lines: [], rules: [rule(ALWAYS, { a: 'swap', with: 'friend' })],
    note: 'Not in the Workshop: the long swap with the king.' },
  { key: 'beast', name: 'Beast', body: 'S', paintOn: 'all', squares: KING_STEP('both'), lines: [], rules: [rule({ on: 'takes' }, { a: 'chain' })] },
  { key: 'ogre', name: 'Ogre', body: 'O', paintOn: 'all', squares: KING_STEP('both'), lines: [], rules: [rule(ALWAYS, { a: 'push', then: 'follow' })] },
];
export const BLANK: Preset = { key: 'blank', name: 'Blank', body: 'token', paintOn: 'all', squares: [], lines: [], rules: [] };
export const presetOf = (key: string): Preset => PRESETS.find(p => p.key === key) ?? BLANK;

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const rid = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** A new design from a preset. names.ts gives it its name and letter. */
export function fromPreset(p: Preset): PieceDesign {
  return {
    v: 1, kind: 'piece', id: rid(), name: '', named: false,
    look: { body: p.body, auto: p.body === 'token', glow: null, army: 0 }, letter: '', ownLetter: false,
    squares: clone(p.squares), lines: [...p.lines], rules: clone(p.rules), from: p.key === 'blank' ? [] : [p.key], updated: Date.now(),
  };
}

/* ---- the canonical form (§3.4): what the piece does, never its name or look ---- */

const sorted = (v: unknown): unknown => Array.isArray(v) ? v.map(sorted)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sorted((v as Record<string, unknown>)[k])])) : v;
const ORDER = BLOCKS.map(b => b.a) as string[];
export function canonical(d: Pick<PieceDesign, 'squares' | 'lines' | 'rules'>): { kind: 'piece'; squares: Square[]; lines: Dir[]; rules: Rule[] } {
  return {
    kind: 'piece',
    squares: [...d.squares].sort((a, b) => a.y - b.y || a.x - b.x).map(({ x, y, mark }) => ({ x, y, mark })),
    lines: DIRS.filter(x => d.lines.includes(x)),
    rules: [...d.rules].sort((a, b) => ORDER.indexOf(a.does.a) - ORDER.indexOf(b.does.a)).map(r => sorted(r) as Rule),
  };
}
/** The anchor key and the duplicate test. */
export const keyOf = (d: Pick<PieceDesign, 'squares' | 'lines' | 'rules'>): string => JSON.stringify(sorted(canonical(d)));
export const ruleKey = (r: Rule): string => JSON.stringify(sorted(r));

/** The hard limits a stored design breaks (§4.9 H2b, H8, H12; the others cannot be stored), or null. */
export function limit(d: Pick<PieceDesign, 'squares' | 'lines' | 'rules'>): string | null {
  if (d.rules.length > MAX_RULES) return FULL;
  if (new Set(d.rules.map(r => r.does.a)).size < d.rules.length) return 'Already in this piece.';
  for (const r of d.rules) if (!whenOk(r)) return 'That choice does not fit this rule.';
  if (d.rules.some(r => r.does.a === 'cannotBeTaken' && r.does.by === 'allButKing') && takesAny(d))
    return 'Only a king can take this piece, so it cannot take. Remove that rule first.';
  return null;
}
/** H3: a piece must move or take somewhere. */
export const empty = (d: Pick<PieceDesign, 'squares' | 'lines' | 'rules'>): boolean =>
  !d.squares.length && !d.lines.length && !d.rules.some(r => r.does.a === 'movesLike' || r.does.a === 'step2');

/** The squares and lines that "also moves like" adds: the preset's, and for the king the Maester's step. */
export function likeSquares(as: LikeAs): { squares: readonly Square[]; lines: readonly Dir[] } {
  const p = presetOf(as === 'king' ? 'maester' : as);
  return { squares: p.squares, lines: p.lines };
}
/** "Always" for "also moves like": the piece's squares and lines with that piece's added, or null where a square
 *  would need a shot and a take by moving at once, which a stored square cannot hold. */
export function likeAlways(d: Pick<PieceDesign, 'squares' | 'lines'>, as: LikeAs): { squares: Square[]; lines: Dir[] } | null {
  const add = likeSquares(as), squares = clone(d.squares);
  const can = (m: Mark) => ({ m: m !== 'take' && m !== 'shoot', t: m === 'both' || m === 'take', s: m === 'shoot' || m === 'moveShoot' });
  for (const a of add.squares) {
    const o = squares.find(t => t.x === a.x && t.y === a.y);
    if (!o) { squares.push({ ...a }); continue; }
    const x = can(o.mark), y = can(a.mark), m = x.m || y.m, t = x.t || y.t, sh = x.s || y.s;
    if (t && sh) return null;
    o.mark = sh ? (m ? 'moveShoot' : 'shoot') : m && t ? 'both' : m ? 'move' : 'take';
  }
  return { squares, lines: DIRS.filter(l => d.lines.includes(l) || add.lines.includes(l)) };
}

/* ---- the share code (§3.4): base64url of the canonical form, the name, the look and the letter ---- */

const b64 = (s: string): string => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string): string => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));

export const designCode = (d: PieceDesign): string => b64(JSON.stringify({ ...canonical(d), name: d.name, look: d.look, letter: d.letter }));

/** Letters, digits, space, - and ' (§3.1), and the brackets of " (yours)" (§4.8). */
const NAME_RE = /^[\p{L}\p{N} '()-]{1,18}$/u;
const KINGS: readonly string[] = ['Frost', 'Flame', 'Stratus', 'Mud', 'Spirit', 'Shadow'];
const int3 = (v: unknown): boolean => Number.isInteger(v) && Math.abs(v as number) <= 3;
export const validName = (s: string): boolean => NAME_RE.test(s) && s.trim() === s;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
/** The parts a share code and a stored design hold, checked key by key: the letter, the look, the squares, lines and rules. */
function validParts(o: Record<string, unknown>): boolean {
  const { squares, lines, rules, look, letter } = o;
  if (typeof letter !== 'string' || letter.length !== 1 || !FREE_LETTERS.includes(letter)) return false;
  if (!(keysAre(look, ['body', 'auto', 'glow', 'army']) || keysAre(look, ['body', 'auto', 'glow', 'army', 'figure'])) || !(BODIES as readonly unknown[]).concat('token').includes(look.body)
    || (look.figure !== undefined && (typeof look.figure !== 'string' || !figureById(look.figure)))
    || typeof look.auto !== 'boolean' || !(look.glow === null || KINGS.includes(look.glow as string)) || (look.army !== 0 && look.army !== 1)) return false;
  if (!Array.isArray(squares) || squares.length > 48 || !Array.isArray(lines) || !Array.isArray(rules) || rules.length > MAX_RULES) return false;
  const marks = ['both', 'move', 'take', 'shoot', 'moveShoot'];
  if (!squares.every(s => keysAre(s, ['x', 'y', 'mark']) && int3(s.x) && int3(s.y) && (s.x || s.y) && marks.includes(s.mark as string))) return false;
  if (new Set(squares.map(s => `${s.x},${s.y}`)).size !== squares.length) return false;
  if (!lines.every(l => DIRS.includes(l)) || new Set(lines).size !== lines.length) return false;
  return rules.every(r => whenOk(r as Rule));
}
/** A whole design as the shelf stores it; the shelf skips any other entry. */
export function validStored(o: unknown): o is PieceDesign {
  return isObj(o) && o.v === 1 && o.kind === 'piece' && typeof o.id === 'string' && typeof o.name === 'string' && !!o.name
    && typeof o.named === 'boolean' && (o.ownLetter === undefined || typeof o.ownLetter === 'boolean') && typeof o.updated === 'number'
    && Array.isArray(o.from) && o.from.every(f => typeof f === 'string') && validParts(o);
}

/** A design from a share code, checked key by key (as `parseSetup` does); null when it is not one. */
export function parseDesign(code: string): PieceDesign | null {
  if (code.length > MAX_CODE || !/^[\w-]+$/.test(code)) return null;
  let o: unknown;
  try { o = JSON.parse(unb64(code)); } catch { return null; }
  if (!keysAre(o, ['kind', 'squares', 'lines', 'rules', 'name', 'look', 'letter']) || o.kind !== 'piece') return null;
  if (typeof o.name !== 'string' || !validName(o.name) || !validParts(o)) return null;
  const d: PieceDesign = {
    v: 1, kind: 'piece', id: rid(), name: o.name, named: true, look: o.look as unknown as Look, letter: o.letter as string, ownLetter: true,
    squares: o.squares as Square[], lines: o.lines as Dir[], rules: o.rules as unknown as Rule[], from: [], updated: Date.now(),
  };
  return limit(d) || empty(d) ? null : d;
}

/** Change one channel without erasing the other. A square takes by moving or by shooting. */
export function setMark(mark: Mark | undefined, channel: 'move' | 'take' | 'shoot', on: boolean): Mark | null {
  const moves = channel === 'move' ? on : mark === 'move' || mark === 'both' || mark === 'moveShoot';
  const capture = channel === 'move' ? (mark === 'shoot' || mark === 'moveShoot' ? 'shoot' : mark === 'take' || mark === 'both' ? 'take' : null)
    : on ? channel : null;
  return capture === 'shoot' ? moves ? 'moveShoot' : 'shoot' : capture === 'take' ? moves ? 'both' : 'take' : moves ? 'move' : null;
}

/** The Proving Ground's brushes and tools (docs/specs/workshop-proving-ground, ticket 02). */
export type Brush = 'move' | 'take' | 'both' | 'shot' | 'erase';
/** The mark a brush leaves on a square that holds `mark`: Move, Take and Both paint the whole mark; Shot adds a shot
 *  and keeps the move (spec decision 34); Erase clears the square. */
export const brushMark = (mark: Mark | undefined, brush: Brush): Mark | null =>
  brush === 'erase' ? null : brush === 'shot' ? setMark(mark, 'shoot', true) : brush;
