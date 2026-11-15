import { expect, it, vi } from 'vitest';
import { Game } from '../../game';
import { coinState } from '../../powers-ui';
import { gamesListView } from './home';
vi.mock('./motion', () => ({ calm: () => true, ms: () => 0, token: () => '' }));

it('keeps the full list for up to three games and a fourth-row cue above that', () => {
  for (const count of [0, 1, 2, 3]) expect(gamesListView(count, false)).toEqual({ collapsed: false, shown: count });
  for (const count of [4, 6]) expect(gamesListView(count, false)).toEqual({ collapsed: true, shown: 4 });
});
it('keeps an open list open when a refresh adds or removes games', () => {
  const state = { expanded: true };
  for (const count of [4, 6, 2, 6]) expect(gamesListView(count, state.expanded)).toEqual({ collapsed: false, shown: count });
});
it('reads ready, armed and used power coins, with the uses left', () => {
  const game = new Game(undefined, { kings: [{ king: 'Frost', power: 'Freeze' }, null], freezeUses: 2 });
  expect(coinState(game.pos, 0, game.rules, [], false)).toMatchObject({ state: 'ready', total: 2, left: 2 });
  expect(coinState(game.pos, 0, game.rules, [], true)).toMatchObject({ state: 'armed', left: 2 });
  expect(coinState({ ...game.pos, used: [2, 0] }, 0, game.rules, [], false)).toMatchObject({ state: 'used', left: 0 });
});
it('shows always-on powers and no coin in a cards-only game', () => {
  const game = new Game(undefined, { kings: [{ king: 'Spirit', power: 'HolyLight' }, null] });
  expect(coinState(game.pos, 0, game.rules, [], false)).toMatchObject({ state: 'always', left: null });
  const cards = new Game(undefined, { kings: [null, null], hands: [['Freeze'], ['Freeze']] });
  for (const side of [0, 1] as const) expect(coinState(cards.pos, side, cards.rules, [], false)).toBeNull();
});
