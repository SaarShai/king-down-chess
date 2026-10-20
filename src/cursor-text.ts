import { colorOf, nameOf, sqName, typeOf, type Position } from './rules/engine';

/** The square, piece and move mark at the keyboard cursor. */
export function cursorText(pos: Position, square: number, selected: number | null | undefined, target: boolean): string {
  const p = pos.board[square], what = p ? `${colorOf(p) ? 'black' : 'white'} ${nameOf(typeOf(p))}` : 'empty';
  return `${sqName(square)}, ${what}${square === selected ? ', selected' : target ? ', can go here' : ''}`;
}
