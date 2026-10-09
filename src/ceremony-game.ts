import { describeMove } from './move-text';
import type { Side } from './game';
import { A, NAMES, typeOf, type Move, type Position, type Color, type Status } from './rules/engine';

/** D8: your win, or either person's win on one device. */
export function shouldPlayCeremony(status: Status, turn: Color, sides: readonly [Side, Side], linkSide: Color | null, resigned: Color | null): boolean {
  if (status !== 'checkmate' || resigned != null) return false;
  const winner = (1 - turn) as Color;
  return linkSide != null ? winner === linkSide : sides[winner] === 'human';
}

/** A short act for a review tile. */
export function ceremonyMoveLabel(pos: Position, move: Move): string {
  const name = NAMES[typeOf(pos.board[move.from])];
  const piece = name[0].toUpperCase() + name.slice(1);
  if (move.power && move.from === move.to && !move.captures.length) {
    const act = describeMove(pos, move).replace(/^(White|Black) /, '');
    return act[0].toUpperCase() + act.slice(1);
  }
  if (move.swap) return `${piece} swaps`;
  if (move.shove) return `${piece} shoves ${NAMES[typeOf(pos.board[move.shove.from])]}`;
  if (move.captures.length) return `${piece} ${typeOf(pos.board[move.from]) === A && move.from === move.to ? 'shoots' : 'takes'} ${NAMES[typeOf(pos.board[move.captures[0]])]}`;
  if (move.promo) return `${piece} becomes ${NAMES[move.promo]}`;
  return `${piece} moves`;
}
