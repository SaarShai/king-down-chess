import { expect, it } from 'vitest';
import type { View } from '../../match/protocol';
import { memoryStorage } from './fake-server';
import { bindSeatKing, seatKing } from './seat-king';

const mud = { king: 'Mud', power: 'Leap' } as const;
const view = (id = 'first', seat = 0, cards = true, kingPowers = true) => ({ game_id: id, seat, options: { cards, kingPowers } }) as View;
it('keeps the shown replacement in its game and keeps the preference for cards off', () => {
  const storage = memoryStorage(); storage.setItem('kingdown.game-options', JSON.stringify({ king: mud }));
  expect(bindSeatKing(storage, 'alice', view())).toEqual({ king: 'Mud', power: 'March' });
  expect(JSON.parse(storage.getItem('kingdown.game-options')!).king).toEqual(mud);
  expect(bindSeatKing(storage, 'alice', view('next', 0, false))).toEqual(mud);
});
it('separates accounts, games and seats after a preference change', () => {
  const storage = memoryStorage(), shadow = { king: 'Shadow', power: 'Darkness' } as const;
  bindSeatKing(storage, 'alice', view(), mud); bindSeatKing(storage, 'alice', view('second'), shadow);
  bindSeatKing(storage, 'bob', view(), shadow); bindSeatKing(storage, 'alice', view('first', 1), shadow);
  storage.setItem('kingdown.game-options', JSON.stringify({ king: { king: 'Spirit', power: 'Mercy' } }));
  expect(seatKing(storage, 'alice', view())).toEqual({ king: 'Mud', power: 'March' });
  expect(seatKing(storage, 'alice', view('second'))).toEqual(shadow);
  expect(seatKing(storage, 'bob', view())).toEqual(shadow);
  expect(seatKing(storage, 'alice', view('first', 1))).toEqual(shadow);
});
it('uses the panel default for a null preference and no king with powers off', () => {
  const storage = memoryStorage();
  expect(bindSeatKing(storage, 'alice', view(), null)).toEqual({ king: 'Spirit', power: 'Mercy' });
  expect(bindSeatKing(storage, 'alice', view('cards', 0, true, false), mud)).toBeNull();
});
