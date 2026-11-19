import { expect, it, vi } from 'vitest';
import { Game } from '../../game';
import { DraftTurn } from './turn';
import { lastSentence, lastSquares, miniBoard, savedPreview, stateText } from './mini-board';
import { readFileSync } from 'node:fs';
import type { Move } from '../board-api';

const SQ = (name: string) => (name.charCodeAt(0) - 97) + (Number(name[1]) - 1) * 8;
const move = (game: Game, from: string, to: string) => game.legal.find(m => m.from === SQ(from) && m.to === SQ(to))!;

it('launch decision 25: the saved preview uses the staged position and the person\'s side', () => {
  const game = new Game('RNBQKBNR', { kings: [null, null], hands: [[], []] });
  game.play(move(game, 'e2', 'e4')); game.play(move(game, 'b7', 'b5'));
  const draft = new DraftTurn(game);
  let preview = savedPreview(draft, 0);
  expect(preview.state).toBe('mine'); expect(preview.turn).toBe(2);
  expect(preview.last?.computer).toBe(true); expect(lastSquares(preview.last!.move)).toEqual([SQ('b7'), SQ('b5')]);
  expect(lastSentence(preview, () => false)).toBe("The opponent's Pawn moves from b7 to b5.");
  draft.stage(draft.legal.find(m => m.from === SQ('d2') && m.to === SQ('d4'))!);
  preview = savedPreview(draft, 0);
  expect(preview.state).toBe('draft'); expect(stateText[preview.state]).toBe('Your turn · Not final');
  // The staged step shows on the board and as the last action; game.pos alone has no Pawn on d4.
  expect(preview.position.board[SQ('d4')]).not.toBe(0); expect(game.pos.board[SQ('d4')]).toBe(0);
  expect(preview.last?.computer).toBe(false); expect(lastSquares(preview.last!.move)).toEqual([SQ('d2'), SQ('d4')]);
  // A Dark person: the computer is to move after the person's turn.
  const dark = savedPreview(new DraftTurn(game), 1);
  expect(dark.state).toBe('computer'); expect(stateText.computer).toBe('Computer to move');
  expect(dark.last?.computer).toBe(false);
});
it('launch decision 25: the last squares follow the actual action, and a pass is no action', () => {
  const base = { from: SQ('e4'), to: SQ('e4'), captures: [] } as Move;
  expect(lastSquares({ ...base, pass: true })).toEqual([]);
  expect(lastSquares({ from: SQ('a2'), to: SQ('a2'), captures: [SQ('a4')] } as Move)).toEqual([SQ('a2'), SQ('a4')]);
  expect(lastSquares({ from: SQ('c3'), to: SQ('d4'), captures: [], shove: { from: SQ('d4'), to: SQ('e5') } } as Move)).toEqual([SQ('c3'), SQ('d4'), SQ('e5')]);
  expect(lastSquares({ from: SQ('d4'), to: SQ('d4'), captures: [], pushes: [{ from: SQ('d5'), to: SQ('d6') }, { from: SQ('e4'), to: SQ('f4') }] } as unknown as Move)).toEqual([SQ('d4'), SQ('d5'), SQ('d6'), SQ('e4'), SQ('f4')]);
  expect(lastSquares({ from: SQ('b1'), to: SQ('d3'), captures: [SQ('c2'), SQ('d3')] } as Move)).toEqual([SQ('b1'), SQ('d3'), SQ('c2')]);
  // No action yet: no last action and no sentence.
  const fresh = savedPreview(new DraftTurn(new Game('RNBQKBNR', { kings: [null, null], hands: [[], []] })), 0);
  expect(fresh.last).toBeNull(); expect(lastSentence(fresh, () => false)).toBe('');
});

it('paints the home board with the same light and strong brass as the game board', () => {
  const game = new Game('RNBQKBNR', { kings: [null, null], hands: [[], []] });
  game.play(move(game, 'e2', 'e4'));
  const cells: { dataset: Record<string, string>; style: { setProperty: ReturnType<typeof vi.fn> } }[] = [];
  vi.stubGlobal('document', { createElement: (tag: string) => ({
    dataset: {}, classList: { add() {} }, style: { setProperty: vi.fn() },
    append: (cell: typeof cells[number]) => { if (tag === 'div') cells.push(cell); }, setAttribute() {},
  }) });
  try {
    miniBoard(savedPreview(new DraftTurn(game), 0), () => '');
    const style = (square: string) => cells.find(cell => cell.dataset.square === String(SQ(square)))!.style;
    expect(style('e2').setProperty).toHaveBeenCalledWith('--last-move', '#ecb0401f');
    expect(style('e4').setProperty).toHaveBeenCalledWith('--last-move', '#ecb0403d');
    expect(style('e3').setProperty).not.toHaveBeenCalled();
    expect(readFileSync('src/interface/play/menus.css', 'utf8')).toMatch(/\.mini-last\s*\{[^}]*var\(--last-move\)/);
  } finally { vi.unstubAllGlobals(); }
});
