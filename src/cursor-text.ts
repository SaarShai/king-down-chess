import type { GameRules } from './game-rules';
import { colorOf, sqName, typeOf, type Position } from './rules/engine';

/** The square, piece and move mark at the keyboard cursor. */
export function cursorText(context: Pick<GameRules, 'nameOf'>, pos: Position, square: number, selected: number | null | undefined, target: boolean): string {
  const p = pos.board[square], what = p ? `${colorOf(p) ? 'black' : 'white'} ${context.nameOf(typeOf(p))}` : 'empty';
  return `${sqName(square)}, ${what}${square === selected ? ', selected' : target ? ', can go here' : ''}`;
}
