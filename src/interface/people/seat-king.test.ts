import { expect, it, vi } from 'vitest';
import type { View } from '../../match/protocol';
import { memoryStorage } from './fake-server';
import { bindSeatKing, seatKing, seatKingUnsaved } from './seat-king';

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

it.each([0, 1])('a repeated acceptance keeps the first valid king for seat %s', seat => {
  const storage = memoryStorage(), game = view('repeat', seat);
  expect(bindSeatKing(storage, 'alice', game, mud)).toEqual({ king: 'Mud', power: 'March' });
  const write = vi.spyOn(storage, 'setItem');
  expect(bindSeatKing(storage, 'alice', game, { king: 'Shadow', power: 'Darkness' })).toEqual({ king: 'Mud', power: 'March' });
  expect(write).not.toHaveBeenCalled();
});
it.each(['bad json', 'null', '{"king":"Mud","power":"Leap"}', '{"king":"Unknown","power":"March"}'])('replaces an invalid binding: %s', raw => {
  const storage = memoryStorage(); storage.setItem('kingdown.people-king.alice.first.0', raw);
  expect(bindSeatKing(storage, 'alice', view(), mud)).toEqual({ king: 'Mud', power: 'March' });
});
it('keeps a failed write in memory and retries the same binding when storage works', () => {
  const storage = memoryStorage(), write = vi.spyOn(storage, 'setItem').mockImplementation(() => { throw Error('full'); });
  expect(bindSeatKing(storage, 'alice', view(), mud)).toEqual({ king: 'Mud', power: 'March' });
  expect(seatKing(storage, 'alice', view())).toEqual({ king: 'Mud', power: 'March' });
  expect(seatKingUnsaved(storage, 'alice', view())).toBe(true);
  expect(seatKingUnsaved(storage, 'bob', view())).toBe(false);
  expect(seatKingUnsaved(storage, 'alice', view('other'))).toBe(false);
  write.mockRestore();
  expect(bindSeatKing(storage, 'alice', view(), { king: 'Shadow', power: 'Darkness' })).toEqual({ king: 'Mud', power: 'March' });
  expect(JSON.parse(storage.getItem('kingdown.people-king.alice.first.0')!)).toEqual({ king: 'Mud', power: 'March' });
  expect(seatKingUnsaved(storage, 'alice', view())).toBe(false);
});
it('does not read or write a king record when powers are off', () => {
  const storage = memoryStorage(), write = vi.spyOn(storage, 'setItem');
  expect(bindSeatKing(storage, 'alice', view('cards', 0, true, false), mud)).toBeNull();
  expect(seatKing(storage, 'alice', view('pieces', 0, false, false))).toBeNull();
  expect(write).not.toHaveBeenCalled();
});

it('a binding saved by another write ends a prior save failure', () => {
  const storage = memoryStorage(), game = view(), write = vi.spyOn(storage, 'setItem').mockImplementation(() => { throw Error('full'); });
  const king = bindSeatKing(storage, 'alice', game, mud);
  expect(seatKingUnsaved(storage, 'alice', game)).toBe(true);
  write.mockRestore();
  storage.setItem('kingdown.people-king.alice.first.0', JSON.stringify(king));
  expect(bindSeatKing(storage, 'alice', game)).toEqual(king);
  expect(seatKingUnsaved(storage, 'alice', game)).toBe(false);
});
