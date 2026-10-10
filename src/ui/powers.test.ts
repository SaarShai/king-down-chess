import { expect, it } from 'vitest';
import { coinReadNote } from './powers';
import { coinState } from '../powers-ui';
import { DEFAULT_RULES, type Color } from '../rules/engine';
import { fromFen } from '../rules/setup';

const pos = fromFen('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1');
const rules = { ...DEFAULT_RULES, kings: [{ king: 'Frost', power: 'Freeze' }, { king: 'Flame', power: 'Haste' }] as typeof DEFAULT_RULES.kings };
const coin = (side: Color) => coinState(pos, side, rules, [], false)!;
const state = { pos, mode: 'computer' as const, viewer: 0 as Color, activeSide: 0 as Color, reading: 1 as Color, waiting: false };
it('names the other side power against the computer and online', () => {
  expect(coinReadNote(coin(1), state)).toBe('Their power.');
  expect(coinReadNote(coin(1), { ...state, mode: 'link' })).toBe('Their power.');
});
it('names the coin colour on one device', () => {
  expect(coinReadNote(coin(1), { ...state, mode: 'device' })).toBe("Black's power.");
  expect(coinReadNote(coin(0), { ...state, mode: 'device', reading: 0, activeSide: 1 })).toBe("White's power.");
});
it('says Not your turn only for your own coin during their move', () => {
  expect(coinReadNote(coin(0), { ...state, pos: { ...pos, turn: 1 }, reading: 0, activeSide: 1 })).toBe('Not your turn.');
});
it('asks for Undo when your staged turn waits', () => {
  expect(coinReadNote(coin(0), { ...state, pos: { ...pos, turn: 1 }, reading: 0, waiting: true })).toBe('Undo your move to use it.');
});
