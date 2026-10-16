import { expect, it } from 'vitest';
import type { InboxEntry } from '../match/protocol';
import { nextGame } from './next-game';
const entry = (game_id: string, computer = false, fields: Partial<InboxEntry> = {}) => ({ game_id, status: 'playing', action: 'ready', opponent: { computer }, ...fields }) as InboxEntry;

it('prefers the first ready person to a computer and keeps inbox order within each group', () => {
  const computer = entry('computer', true), person = entry('person'), later = entry('later');
  expect(nextGame([computer, person, later])).toBe(person);
  expect(nextGame([computer, person, later], 'person')).toBe(later);
  expect(nextGame([computer, person], 'person')).toBe(computer);
  expect(nextGame([computer, entry('other-computer', true)])).toBe(computer);
});
it('skips waiting games and games that need the opponent, but includes setup choices', () => {
  const setup = entry('setup', false, { status: 'setup' });
  expect(nextGame([entry('waiting', false, { status: 'waiting' }), entry('opponent', false, { action: 'waiting' }), setup])).toBe(setup);
  expect(nextGame([], 'missing')).toBeUndefined();
  expect(nextGame([setup], 'setup')).toBeUndefined();
});
