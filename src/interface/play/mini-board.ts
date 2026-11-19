/**
 * The small board of the saved game on Play (launch decision 25): the current position in the Symbols look, from the
 * person's side, with the squares of the last action in the "Last" colour of the marks spec. A picture, not an input.
 */
import { colorOf, moveNumber, type Color } from '../../rules/engine';
import type { Move, Position } from '../board-api';
import { PLAIN } from '../../render/plain-marks';
import type { DraftTurn } from './turn';
import { sentence, text } from './texts';
import { ease, reducedMotion, tween } from './fx';
import { squareAt } from './sides';

export const LAST_COLOUR = PLAIN.last;
/** Each square that the action changes: its start and end, each capture, each push, swap, castle and entry. */
export function lastSquares(move: Move): number[] {
  if (move.pass) return [];
  const squares = [move.from, move.to, ...move.captures];
  if (move.shove) squares.push(move.shove.from, move.shove.to);
  for (const push of move.pushes ?? []) squares.push(push.from, push.to);
  if (move.castle) squares.push(move.castle.from, move.castle.to);
  if (move.drop2 != null) squares.push(move.drop2);
  return [...new Set(squares)].filter(sq => sq >= 0 && sq < 64);
}
export type PreviewState = 'mine' | 'draft' | 'computer';
export interface SavedPreview {
  position: Position; player: Color; turn: number; state: PreviewState;
  /** The last action that is not a pass: a staged step first, else the history. */
  last: { before: Position; move: Move; computer: boolean } | null;
}
/** The preview of a game that can continue. `draft.position` holds the staged steps; `game.pos` alone does not. */
export function savedPreview(draft: DraftTurn, player: Color): SavedPreview {
  const game = draft.game;
  const staged = [...draft.steps].reverse().find(step => !step.move.pass);
  const played = [...game.history].reverse().find(entry => !entry.move.pass);
  const last = staged ? { before: staged.before, move: staged.move, computer: false } : played ? { before: played.pos, move: played.move, computer: played.pos.turn !== player } : null;
  const state: PreviewState = draft.length ? 'draft' : game.pos.turn === player ? 'mine' : 'computer';
  return { position: draft.position, player, turn: moveNumber(game.pos), state, last };
}
export const stateText: Record<PreviewState, string> = { mine: 'Your move', draft: 'Your turn · Not final', computer: 'Computer to move' };
/** The last action as the game screen says it. `cards`: the side of the action plays cards. */
export const lastSentence = (preview: SavedPreview, cards: (side: Color) => boolean): string => {
  const last = preview.last; if (!last) return '';
  const side = last.computer ? (preview.player ^ 1) as Color : preview.player;
  return sentence(last.before, last.move, last.computer, cards(side));
};

/** 64 static cells in the person's view. `src` gives the symbol picture of a piece code. */
export function miniBoard(preview: SavedPreview, src: (code: number) => string): HTMLElement {
  const board = document.createElement('div'); board.className = 'mini-board';
  board.setAttribute('role', 'img'); board.setAttribute('aria-label', `${text.title}: the board of your game, from your side.`);
  const marked = new Set(preview.last ? lastSquares(preview.last.move) : []);
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    const square = squareAt(row, col, preview.player), cell = document.createElement('span'), code = preview.position.board[square];
    cell.className = `mini-cell${(row + col) % 2 ? ' mini-dark' : ''}${marked.has(square) ? ' mini-last' : ''}`; cell.dataset.square = String(square);
    if (code) { const img = document.createElement('img'); img.alt = ''; img.src = src(code); img.dataset.code = String(code); img.className = `mini-glyph${colorOf(code) ? ' mini-glyph-dark' : ''}`; cell.append(img); }
    board.append(cell);
  }
  return board;
}

/** Show a move once, over the final position. Leave the final position intact when motion is off. */
export function replayMiniBoard(board: HTMLElement, preview: SavedPreview): void {
  if (!preview.last || reducedMotion()) return;
  const { move, before } = preview.last;
  const cell = (square: number) => board.querySelector<HTMLElement>(`[data-square="${square}"]`);
  for (const { from, to } of [move, ...(move.shove ? [move.shove] : []), ...(move.pushes ?? []), ...(move.castle ? [move.castle] : [])]) {
    if (from === to || !before.board[from]) continue;
    const source = cell(from), destination = cell(to), image = destination?.querySelector('img');
    if (!source || !destination || !image || colorOf(before.board[from]) !== colorOf(+image.dataset.code!)) continue;
    const a = source.getBoundingClientRect(), b = destination.getBoundingClientRect();
    const draw = (k: number) => { image.style.transform = `translate(${(a.left - b.left) * (1 - k)}px, ${(a.top - b.top) * (1 - k)}px)`; };
    image.style.zIndex = '1'; draw(0);
    tween(340, draw, { curve: ease.out3, done: () => { image.style.removeProperty('transform'); image.style.removeProperty('z-index'); } });
  }
}
