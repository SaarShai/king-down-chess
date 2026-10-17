import { expect, it } from 'vitest';
import { assertCardReadState } from './plugin-card-read.mjs';

const before = { modelContent: {}, privateContent: { screen: 'board', board_id: 'test-board', pending: undefined, sheet: undefined, draft: { options: { cardPool: ['Freeze', 'IceWall', 'MorphP', 'Vault'] } } } };
const opened = () => ({ ...before, privateContent: { ...before.privateContent, sheet: 'board-sheet' } });

it('accepts a public card pool that was saved before the card read', () => {
  expect(() => assertCardReadState(before, opened())).not.toThrow();
});

it.each([
  { hand: ['IceWall'] },
  { card: 'Freeze' },
  { rules: { hands: [['Vault'], ['Vault']] } },
  { draft: { options: { cardPool: ['Freeze'] } } },
])('rejects card data or a changed saved field: %j', extra => {
  expect(() => assertCardReadState(before, { ...opened(), privateContent: { ...opened().privateContent, ...extra } })).toThrow();
});

it('rejects card data in model context', () => {
  expect(() => assertCardReadState(before, { ...opened(), modelContent: { card: 'Vault' } })).toThrow();
});
