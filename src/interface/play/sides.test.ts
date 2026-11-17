import { expect, it } from 'vitest';
import { Game } from '../../game';
import { sqName } from '../../rules/engine';
import { arrowStep, cellOf, fileLabelRow, rankLabelColumn, resolveSide, sideLine, SIDE_CHOICES, squareAt } from './sides';
import { firstMinute } from './learning';
import { DraftTurn } from './turn';

it('the side slider has two stops and reads stored Random as Light', () => {
  expect(SIDE_CHOICES).toEqual(['light', 'dark']);
  expect(resolveSide('light')).toBe(0); expect(resolveSide('dark')).toBe(1); expect(resolveSide('random')).toBe(0);
  expect(sideLine('light')).toBe('White. You start.'); expect(sideLine('dark')).toBe('Black. You go second.');
  expect(sideLine('random')).toBe(sideLine('light'));
});

it('all 64 squares map to one cell and back in both views', () => {
  for (const player of [0, 1] as const) {
    const seen = new Set<number>();
    for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
      const square = squareAt(row, col, player); seen.add(square);
      expect(cellOf(square, player)).toEqual({ row, col });
    }
    expect(seen.size).toBe(64);
  }
  // Light: a8 top left, a1 bottom left. Dark: h1 top left, h8 bottom left.
  expect([squareAt(0, 0, 0), squareAt(7, 0, 0), squareAt(0, 0, 1), squareAt(7, 0, 1)].map(sqName)).toEqual(['a8', 'a1', 'h1', 'h8']);
});

it('arrows move on the screen in both views and stop at each edge with no file wrap', () => {
  const at = (name: string) => [...Array(64).keys()].find(sq => sqName(sq) === name)!;
  const step = (name: string, key: string, player: 0 | 1) => { const next = arrowStep(at(name), key, player); return next == null ? null : sqName(next); };
  expect(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].map(key => step('e4', key, 0))).toEqual(['e5', 'e3', 'd4', 'f4']);
  expect(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].map(key => step('e4', key, 1))).toEqual(['e3', 'e5', 'f4', 'd4']);
  expect([step('h4', 'ArrowRight', 0), step('a4', 'ArrowRight', 1), step('h8', 'ArrowUp', 0), step('a1', 'ArrowUp', 1), step('a1', 'ArrowDown', 0), step('h8', 'ArrowDown', 1)]).toEqual([null, null, null, null, null, null]);
  expect(step('e4', 'Enter', 1)).toBeNull();
});

it('file letters sit on the bottom row and rank numbers on the left column of each view', () => {
  const names = (test: (square: number) => boolean) => [...Array(64).keys()].filter(test).map(sqName).sort();
  expect(names(sq => fileLabelRow(sq, 0))).toEqual(['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1']);
  expect(names(sq => fileLabelRow(sq, 1))).toEqual(['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8']);
  expect(names(sq => rankLabelColumn(sq, 0))).toEqual(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8']);
  expect(names(sq => rankLabelColumn(sq, 1))).toEqual(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8']);
});

it('the first-minute line stays for a Dark player after the computer moves first', () => {
  const game = new Game('RNBQKBNR');
  expect(firstMinute(new DraftTurn(game), 1)).toBe(true);
  game.play(game.legal.find(m => !m.pass)!);
  expect(firstMinute(new DraftTurn(game), 1)).toBe(true);
  expect(firstMinute(new DraftTurn(game))).toBe(false); // the Light rule stays: a real move ends it
  game.play(game.legal.find(m => !m.pass)!);
  expect(firstMinute(new DraftTurn(game), 1)).toBe(false);
});
