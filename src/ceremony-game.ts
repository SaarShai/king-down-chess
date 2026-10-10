import type { Side } from './game';
import { A, NAMES, TAG_POWER, typeOf, type Move, type Position, type Color, type Status } from './rules/engine';

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
  if (move.power) {
    if (move.power === 'flight') return `${piece} flies`;
    if (move.power === 'sacrifice') return `Sacrifice restores ${NAMES[move.promo!]}`;
    const power = TAG_POWER[move.power].replace(/([a-z])([A-Z])/g, '$1 $2');
    return move.from === move.to
      ? `${power} on ${NAMES[typeOf(pos.board[move.to])]}`
      : `${piece} moves with ${power}`;
  }
  if (move.swap) return `${piece} swaps`;
  if (move.shove) return `${piece} shoves ${NAMES[typeOf(pos.board[move.shove.from])]}`;
  if (move.captures.length) return `${piece} ${typeOf(pos.board[move.from]) === A && move.from === move.to ? 'shoots' : 'takes'} ${NAMES[typeOf(pos.board[move.captures[0]])]}`;
  if (move.promo) return `${piece} becomes ${NAMES[move.promo]}`;
  return `${piece} moves`;
}
