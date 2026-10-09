/**
 * Plain-language helpers for the HUD that only read the engine: the screen-reader sentence for a
 * move, the threat markers, and move numbers that stay right when a Haste turn plays two plies.
 */
import { A, C, Color, K, Move, N, NAMES, Position, colorOf, file, findKing, genPiece, isAttacked, isSpawnTag, pseudoMoves, rank, sqName, typeOf } from './rules/engine';

const SIDE = ['White', 'Black'] as const;

export interface Checker { sq: number; king: number; path: 'straight' | 'arc' }

/** Attacks on the king, including frozen pieces. A Freeze stops moves, not check. */
export function checkersOf(pos: Position): Checker[] {
  const king = findKing(pos.board, pos.turn);
  if (king < 0) return [];
  const checkers: Checker[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const p = pos.board[sq];
    if (!p || colorOf(p) === pos.turn) continue;
    const attacks: Move[] = [];
    genPiece(pos.board, sq, 'attacks', attacks);
    if (attacks.some(m => m.captures.includes(king))) {
      checkers.push({ sq, king, path: checkPath(pos.board, sq, king) });
    }
  }
  return checkers;
}

function checkPath(board: Uint8Array, from: number, king: number): Checker['path'] {
  const t = typeOf(board[from]), df = file(king) - file(from), dr = rank(king) - rank(from);
  const distance = Math.max(Math.abs(df), Math.abs(dr));
  if (t === N || t === C || (t === A && distance > 1) || (df && dr && Math.abs(df) !== Math.abs(dr))) return 'arc';
  const step = Math.sign(df) + 8 * Math.sign(dr);
  for (let s = from + step; s !== king; s += step) if (board[s]) return 'arc';
  return 'straight';
}

/** One sentence for a screen reader: who moved what, and what it did. */
export function describeMove(pre: Position, m: Move): string {
  // The side is the one to move, not the piece on `from`: a Freeze names an enemy piece.
  const side = SIDE[pre.turn], piece = pre.board[m.from], name = NAMES[typeOf(piece)];
  const the = (s: number): string => `${NAMES[typeOf(pre.board[s])]} on ${sqName(s)}`;
  const colour = (s: number): string => (colorOf(pre.board[s]) ? 'black' : 'white');
  // King powers that move nothing, or change a piece where it stands.
  if (m.pass) return `${side} ends the turn without the ${pre.rage === 3 ? 'Rally' : 'Haste'} second move.`;
  if (m.power === 'freeze') return `${side} freezes the ${colour(m.to)} ${the(m.to)}.`;
  if (m.power === 'ward') return `${side} puts an Ice Wall on the ${colour(m.to)} ${the(m.to)}.`;
  if (m.power === 'sacrifice') return `${side} sacrifices the pawn on ${sqName(m.from)} and brings back a ${NAMES[m.promo!]} there.`;
  if (m.power === 'morph' || m.power === 'morphb' || m.power === 'morphp') return `${side} turns the ${the(m.from)} into a ${NAMES[m.promo!]}.`;
  if (isSpawnTag(m.power)) return m.drop2 === undefined ? `${side} adds a pawn on ${sqName(m.to)}.` : `${side} adds pawns on ${sqName(m.to)} and ${sqName(m.drop2)}.`;
  let text = m.power === 'flight'
    ? `${side} ${name} flies from ${sqName(m.from)} to ${sqName(m.to)}`
    : m.shove
    ? `${side} ${name} on ${sqName(m.from)} shoves the ${the(m.shove.from)} to ${sqName(m.shove.to)}${m.to !== m.from ? `, stepping to ${sqName(m.to)}` : ''}`
    : m.swap ? `${side} ${name} on ${sqName(m.from)} swaps places with the ${the(m.to)}`
    : m.to === m.from && m.captures.length ? `${side} ${name} on ${sqName(m.from)} takes the ${m.captures.map(the).join(' and the ')} without moving`
    : `${side} ${name} ${sqName(m.from)} to ${sqName(m.to)}${m.captures.length ? `, taking the ${m.captures.map(the).join(', then the ')}` : ''}`;
  if (m.promo) text += `, and becomes a ${NAMES[m.promo]}`;
  if (m.selfRemove) text += `; the ${name} leaves the board`;
  if (m.power === 'strike') text += ' with Strike';
  if (m.power === 'haste') text += `, with Haste: the ${name} may move again`;
  if (m.power === 'rally') text += ', with Rally: a different piece may move next';
  return `${text}.`;
}

/**
 * Squares the side not to move attacks: the mover's pieces it can take, and the empty squares it
 * covers. Asked as if it were the other side's turn, outside the turn in progress: a pending Haste
 * second move or the move after a free Freeze belongs to the side to move, so it is left out.
 */
export function threatsIn(pos: Position): { pieces: number[]; squares: number[] } {
  const them = (pos.turn ^ 1) as Color;
  const pieces = new Set<number>(), squares: number[] = [];
  for (const m of pseudoMoves({ ...pos, turn: them, haste: undefined, free: undefined }, 'captures')) {
    for (const c of m.captures) if (pos.board[c] && colorOf(pos.board[c]) === pos.turn) pieces.add(c);
  }
  for (let s = 0; s < 64; s++) {
    const p = pos.board[s];
    if (!p) { if (isAttacked(pos.board, s, them)) squares.push(s); }
    else if (colorOf(p) === pos.turn && typeOf(p) === K && isAttacked(pos.board, s, them)) pieces.add(s);
  }
  return { pieces: [...pieces], squares };
}

/**
 * The move number of each ply, given the side that played it. A number is White's turn and
 * Black's; a Haste turn (two plies by one side) stays on one number. A game that starts with
 * Black opens on 1.
 */
export function moveNumbers(turns: readonly Color[]): number[] {
  let n = 0;
  return turns.map((c, i) => {
    if (i === 0 || (c === 0 && turns[i - 1] !== 0)) n++;
    return n;
  });
}

/** The number of the move about to be played: plies so far by side, then the side to move. */
export const nextMoveNumber = (turns: readonly Color[], toMove: Color): number => moveNumbers([...turns, toMove]).at(-1)!;
