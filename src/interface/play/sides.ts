/**
 * The player's side (launch decision 10). No DOM. The engine colours: 0 is Light, 1 is Dark. The board shows the
 * player's side at the bottom; engine square numbers (a1 = 0, h8 = 63) stay the same in both views.
 */
import type { Color } from '../../rules/engine';

export type SideChoice = 'light' | 'dark' | 'random';
/** The stored choice for the next game. The first value is the default. */
export const SIDE_KEY = 'kingdown.side';
export const SIDE_CHOICES: readonly SideChoice[] = ['light', 'dark', 'random'];

/** Resolve the choice once, when a new game starts. Continue and Rematch do not draw again. */
export const resolveSide = (choice: SideChoice, random: () => number = Math.random): Color =>
  choice === 'dark' ? 1 : choice === 'random' ? (random() < 0.5 ? 0 : 1) : 0;

/** The square at a screen cell of the player's view: row 0 is the top row, column 0 the left column. */
export const squareAt = (row: number, col: number, player: Color): number => player ? row * 8 + (7 - col) : (7 - row) * 8 + col;
/** The screen row and column of a square in the player's view. */
export const cellOf = (square: number, player: Color): { row: number; col: number } =>
  player ? { row: square >> 3, col: 7 - (square & 7) } : { row: 7 - (square >> 3), col: square & 7 };

const ARROWS: Record<string, [number, number]> = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
/** The square one arrow step away on the screen, or null at the edge of the board. */
export function arrowStep(square: number, key: string, player: Color): number | null {
  const step = ARROWS[key]; if (!step) return null;
  const { row, col } = cellOf(square, player), r = row + step[0], c = col + step[1];
  return r < 0 || r > 7 || c < 0 || c > 7 ? null : squareAt(r, c, player);
}
/** The edge labels: file letters on the bottom row, rank numbers on the left column of the player's view. */
export const fileLabelRow = (square: number, player: Color) => cellOf(square, player).row === 7;
export const rankLabelColumn = (square: number, player: Color) => cellOf(square, player).col === 0;

/** The words of this stage (the learning copy table has none of them). */
export const sideText = {
  light: 'Light', dark: 'Dark', random: 'Random',
  artFailed: 'The art cannot load.', computerFailed: 'The computer cannot move.', staysSaved: 'Your game stays saved.', tryAgain: 'Try again',
  offer: 'A kept game can open now. Open it?', open: 'Open', notNow: 'Not now', openTitle: 'Open the kept game?',
} as const;
