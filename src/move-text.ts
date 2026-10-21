import type { GameRules } from './game-rules';
/**
 * Plain-language helpers for the HUD that only read the engine: the screen-reader sentence for a
 * move, the threat markers, and move numbers that stay right when a Haste turn plays two plies.
 */
import { A, C, Color, Move, N, P, PieceType, Position, TAG_POWER, colorOf, file, findKing, isSpawnTag, rank, sqName, typeOf } from './rules/engine';

import { cardName } from './powers-ui';
import type { Mode } from './turn';

type MoveRules = Pick<GameRules, 'nameOf' | 'theName' | 'aName' | 'genPiece' | 'pseudoMoves'>;

const SIDE = ['White', 'Black'] as const;

export interface Checker { sq: number; king: number; path: 'straight' | 'arc' }

/** The cause of the current check, in one short line. */
export function checkCause(context: MoveRules, pos: Position, last?: Move, mode?: Mode, viewer: Color = pos.turn): string {
  const checkers = checkersOf(context, pos), names = checkers.map(ch => context.nameOf(typeOf(pos.board[ch.sq])));
  if (!checkers.length) return '';
  const attacker = mode === 'device' ? `${SIDE[(pos.turn ^ 1) as Color]}'s` : viewer === pos.turn ? 'Their' : 'Your';
  const target = mode === 'device' ? `the ${SIDE[pos.turn].toLowerCase()} king` : viewer === pos.turn ? 'your king' : 'their king';
  if (checkers.length === 2) return `${attacker} ${names.join(' and ')} attack ${target}.`;
  if (checkers.length > 2) return `Check: ${names.slice(0, 5).join(', ')}${names.length > 5 ? `; ${names.length - 5} more.` : '.'}`;
  const ch = checkers[0], name = names[0];
  const df = file(ch.king) - file(ch.sq), dr = rank(ch.king) - rank(ch.sq);
  const mid = name === 'archer' && Math.max(Math.abs(df), Math.abs(dr)) === 2 && df % 2 === 0 && dr % 2 === 0
    ? (ch.sq + ch.king) / 2 : -1;
  const over = mid >= 0 && pos.board[mid] ? sqName(mid) : '';
  if (mode) {
    const strike = last?.power === 'strike' && last.from !== last.to && last.to === ch.sq;
    const cause = `${strike ? 'Strike: ' : ''}${attacker} ${name} ${name === 'archer' ? 'shoots' : 'attacks'} ${target}`;
    return `${cause}${over && cause.split(/\s+/).length <= 6 ? ` over ${over}` : ''}.`;
  }
  if (last?.power === 'strike' && last.from !== last.to && last.to === ch.sq) {
    return over ? `Strike lets their ${name} shoot over ${over}.` : `Strike lets their ${name} attack your king.`;
  }
  if (over) return `Their archer can shoot over ${over}.`;
  return name === 'archer' ? 'Their archer can shoot your king.' : `Their ${name} attacks your king.`;
}

/** Attacks on the king, including frozen pieces. A Freeze stops moves, not check. */
export function checkersOf(context: MoveRules, pos: Position): Checker[] {
  const king = findKing(pos.board, pos.turn);
  if (king < 0) return [];
  const checkers: Checker[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const p = pos.board[sq];
    if (!p || colorOf(p) === pos.turn) continue;
    const attacks: Move[] = [];
    context.genPiece(pos.board, sq, 'attacks', attacks);
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

/** A short line for the last move, with the card or power name. */
export function shortMove(pre: Position, m: Move, pieceName: (type: PieceType) => string): string {
  const side = SIDE[pre.turn], name = pieceName(typeOf(pre.board[m.from]));
  const power = m.power ? `${m.via ? `${cardName(m.via === 'mirrorb' ? 'MirrorB' : 'Mirror')} · ` : ''}${cardName(TAG_POWER[m.power])} · ` : '';
  const action = m.pass ? `ends turn · ${pre.free ? pre.marks?.[pre.turn] ? 'mark' : 'draw' : pre.rage === 3 ? 'Rally' : 'Haste'}`
    : m.drop !== undefined ? `adds ${pieceName(m.drop)} ${sqName(m.to)}${m.drop2 === undefined ? '' : `, ${sqName(m.drop2)}`}`
    : m.castle ? `castles ${file(m.to) === 6 ? 'short' : 'long'}`
    : `${name} ${sqName(m.from)}${m.from === m.to ? '' : ` ${m.swap ? '↔' : '→'} ${sqName(m.to)}`}${m.promo ? ` = ${pieceName(m.promo)}` : ''}${m.from === m.to && m.captures.length ? ` × ${m.captures.map(sqName).join(', ')}` : ''}`;
  return `${side} ${power}${action}`;
}

/** One sentence for a screen reader: who moved what, and what it did. */
export function describeMove(context: MoveRules, pre: Position, m: Move, freePass = false, final = false): string {
  // The side is the one to move, not the piece on `from`: a Freeze names an enemy piece.
  const side = SIDE[pre.turn], piece = pre.board[m.from], name = context.nameOf(typeOf(piece));
  const the = (s: number): string => `${context.nameOf(typeOf(pre.board[s]))} on ${sqName(s)}`;
  const theOn = (s: number): string => `${context.theName(typeOf(pre.board[s]))} on ${sqName(s)}`;
  const colour = (s: number): string => (colorOf(pre.board[s]) ? 'black' : 'white');
  // King powers that move nothing, or change a piece where it stands.
  // The pass of a free mark (or a GrowthB draw) ends a turn that had no second move to skip.
  if (freePass && m.pass && pre.free) return `${side} ends the turn after the ${pre.marks?.[pre.turn] ? 'mark' : 'draw'}.`;
  if (m.pass) return `${side} ends the turn without the ${pre.rage === 3 ? 'Rally' : 'Haste'} second move.`;
  if (m.power === 'freeze') return `${side} freezes the ${colour(m.to)} ${the(m.to)}.`;
  if (m.power === 'firewall') return `${side} uses Firewall to protect all its pieces until its next turn.`;
  if (m.power === 'ward') return `${side} puts an Ice Wall on the ${colour(m.to)} ${the(m.to)}.`;
  if (m.power === 'sacrifice') return `${side} sacrifices the pawn on ${sqName(m.from)} and brings back ${context.aName(m.promo!)} there.`;
  if (m.power === 'morph' || m.power === 'morphb' || m.power === 'morphp') return `${side} turns ${theOn(m.from)} into ${context.aName(m.promo!)}.`;
  if (isSpawnTag(m.power)) return m.drop2 === undefined ? `${side} adds a pawn on ${sqName(m.to)}.` : `${side} adds pawns on ${sqName(m.to)} and ${sqName(m.drop2)}.`;
  if (m.castle) return `${side} castles ${file(m.to) === 6 ? 'short' : 'long'}.`;
  let text = m.power === 'flight'
    ? `${side} ${name} flies from ${sqName(m.from)} to ${sqName(m.to)}`
    : m.shove
    ? `${side} ${name} on ${sqName(m.from)} shoves ${theOn(m.shove.from)} to ${sqName(m.shove.to)}${m.to !== m.from ? `, stepping to ${sqName(m.to)}` : ''}`
    : m.swap ? `${side} ${name} on ${sqName(m.from)} swaps places with ${theOn(m.to)}`
    : m.to === m.from && m.captures.length ? `${side} ${name} on ${sqName(m.from)} takes ${m.captures.map(theOn).join(' and ')} without moving`
    : `${side} ${name} ${sqName(m.from)} to ${sqName(m.to)}${m.captures.length ? `, taking ${m.captures.map(theOn).join(', then ')}${typeOf(piece) === P && m.captures[0] !== m.to ? ' en passant' : ''}` : ''}`;
  if (m.promo) text += `, and becomes ${context.aName(m.promo)}`;
  if (m.selfRemove) text += `; ${context.theName(typeOf(piece))} leaves the board`;
  if (m.power === 'strike') text += ' with Strike';
  if (!final && m.power === 'haste') text += `, with Haste: ${context.theName(typeOf(piece))} may move again`;
  if (!final && m.power === 'rally') text += ', with Rally: a different piece may move next';
  return `${text}.`;
}

/**
 * The threats of the side not to move: each of its pieces and each of the mover's pieces it can take (the king: its
 * checkers). Asked as if it were the other side's turn, outside the turn in progress: a pending Haste second move or the
 * move after a free Freeze belongs to the side to move, so it is left out.
 */
export function threatsIn(context: MoveRules, pos: Position): { from: number; to: number }[] {
  const out = checkersOf(context, pos).map(ch => ({ from: ch.sq, to: ch.king }));
  for (const m of context.pseudoMoves({ ...pos, turn: (pos.turn ^ 1) as Color, haste: undefined, free: undefined }, 'captures')) {
    for (const to of m.captures) {
      if (pos.board[to] && colorOf(pos.board[to]) === pos.turn && !out.some(t => t.from === m.from && t.to === to)) out.push({ from: m.from, to });
    }
  }
  return out;
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
