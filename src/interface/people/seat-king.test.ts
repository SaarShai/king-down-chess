import { expect, it, vi } from 'vitest';
import type { View } from '../../match/protocol';
import { memoryStorage } from './fake-server';
import { bindSeatKing, seatKing, seatKingUnsaved } from './seat-king';

const mud = { king: 'Mud', power: 'Leap' } as const;
const view = (id = 'first', seat = 0, cards = true, kingPowers = true) => ({ game_id: id, seat, options: { cards, kingPowers } }) as View;
it('keeps the shown replacement in its game and keeps the preference for cards off', async () => {
  const storage = memoryStorage(); storage.setItem('kingdown.game-options', JSON.stringify({ king: mud }));
  expect(await bindSeatKing(storage, 'alice', view())).toEqual({ king: 'Mud', power: 'March' });
  expect(JSON.parse(storage.getItem('kingdown.game-options')!).king).toEqual(mud);
  expect(await bindSeatKing(storage, 'alice', view('next', 0, false))).toEqual(mud);
});
it('separates accounts, games and seats after a preference change', async () => {
  const storage = memoryStorage(), shadow = { king: 'Shadow', power: 'Darkness' } as const;
  await bindSeatKing(storage, 'alice', view(), mud); await bindSeatKing(storage, 'alice', view('second'), shadow);
  await bindSeatKing(storage, 'bob', view(), shadow); await bindSeatKing(storage, 'alice', view('first', 1), shadow);
  storage.setItem('kingdown.game-options', JSON.stringify({ king: { king: 'Spirit', power: 'Mercy' } }));
  expect(await seatKing(storage, 'alice', view())).toEqual({ king: 'Mud', power: 'March' });
  expect(await seatKing(storage, 'alice', view('second'))).toEqual(shadow);
  expect(await seatKing(storage, 'bob', view())).toEqual(shadow);
  expect(await seatKing(storage, 'alice', view('first', 1))).toEqual(shadow);
});
it('uses the panel default for a null preference and no king with powers off', async () => {
  const storage = memoryStorage();
  expect(await bindSeatKing(storage, 'alice', view(), null)).toEqual({ king: 'Spirit', power: 'Mercy' });
  expect(await bindSeatKing(storage, 'alice', view('cards', 0, true, false), mud)).toBeNull();
});

it.each([0, 1])('a repeated acceptance keeps the first valid king for seat %s', async seat => {
  const storage = memoryStorage(), game = view('repeat', seat);
  expect(await bindSeatKing(storage, 'alice', game, mud)).toEqual({ king: 'Mud', power: 'March' });
  const write = vi.spyOn(storage, 'setItem');
  expect(await bindSeatKing(storage, 'alice', game, { king: 'Shadow', power: 'Darkness' })).toEqual({ king: 'Mud', power: 'March' });
  expect(write).not.toHaveBeenCalled();
});
it.each(['bad json', 'null', '{"king":"Mud","power":"Leap"}', '{"king":"Unknown","power":"March"}'])('replaces an invalid binding: %s', async raw => {
  const storage = memoryStorage(); storage.setItem('kingdown.people-king.alice.first.0', raw);
  expect(await bindSeatKing(storage, 'alice', view(), mud)).toEqual({ king: 'Mud', power: 'March' });
});
it('keeps a failed write in memory and retries the same binding when storage works', async () => {
  const storage = memoryStorage(), write = vi.spyOn(storage, 'setItem').mockImplementation(() => { throw Error('full'); });
  expect(await bindSeatKing(storage, 'alice', view(), mud)).toEqual({ king: 'Mud', power: 'March' });
  expect(await seatKing(storage, 'alice', view())).toEqual({ king: 'Mud', power: 'March' });
  expect(seatKingUnsaved(storage, 'alice', view())).toBe(true);
  expect(seatKingUnsaved(storage, 'bob', view())).toBe(false);
  expect(seatKingUnsaved(storage, 'alice', view('other'))).toBe(false);
  write.mockRestore();
  expect(await bindSeatKing(storage, 'alice', view(), { king: 'Shadow', power: 'Darkness' })).toEqual({ king: 'Mud', power: 'March' });
  expect(JSON.parse(storage.getItem('kingdown.people-king.alice.first.0')!)).toEqual({ king: 'Mud', power: 'March' });
  expect(seatKingUnsaved(storage, 'alice', view())).toBe(false);
});
it('does not read or write a king record when powers are off', async () => {
  const storage = memoryStorage(), write = vi.spyOn(storage, 'setItem');
  expect(await bindSeatKing(storage, 'alice', view('cards', 0, true, false), mud)).toBeNull();
  expect(await seatKing(storage, 'alice', view('pieces', 0, false, false))).toBeNull();
  expect(write).not.toHaveBeenCalled();
});

it('a binding saved by another write ends a prior save failure', async () => {
  const storage = memoryStorage(), game = view(), write = vi.spyOn(storage, 'setItem').mockImplementation(() => { throw Error('full'); });
  const king = await bindSeatKing(storage, 'alice', game, mud);
  expect(seatKingUnsaved(storage, 'alice', game)).toBe(true);
  write.mockRestore();
  storage.setItem('kingdown.people-king.alice.first.0', JSON.stringify(king));
  expect(await bindSeatKing(storage, 'alice', game)).toEqual(king);
  expect(seatKingUnsaved(storage, 'alice', game)).toBe(false);
});


it('a king write after deletion cannot restore data or give the save line', async () => {
  const storage = memoryStorage(), game = view(), failure = vi.fn();
  const { accountData, AccountDataClosed } = await import('../../account/data');
  const { clearDeletedAccount } = await import('../../account/local');
  await accountData('alice', storage).close(() => clearDeletedAccount(storage, 'alice'));
  const write = vi.spyOn(storage, 'setItem');
  await expect(bindSeatKing(storage, 'alice', game, mud, failure)).rejects.toBeInstanceOf(AccountDataClosed);
  expect(write).not.toHaveBeenCalled();
  expect(storage.getItem('kingdown.people-king.alice.first.0')).toBeNull();
  expect(failure).not.toHaveBeenCalled();
  expect(seatKingUnsaved(storage, 'alice', game)).toBe(false);
});


it.each(['cleanup first', 'king queued first'])('a queued king write stays closed when deletion gets the lock first: %s', async order => {
  const storage = memoryStorage(), game = view(), failure = vi.fn();
  const { accountData, AccountDataClosed } = await import('../../account/data');
  const requests: (() => Promise<unknown>)[] = [];
  let pause = false;
  const locks = { request: <T>(_name: string, run: () => Promise<T>) => pause ? new Promise<T>((resolve, reject) => requests.push(() => run().then(resolve, reject))) : run() };
  const gate = accountData('alice', storage, locks); await gate.write(() => {});
  const deleting = accountData('alice', storage, locks); await deleting.write(() => {});
  pause = true;
  const binding = order === 'king queued first' ? bindSeatKing(storage, 'alice', game, mud, failure, gate).catch(error => error) : undefined;
  if (binding) await vi.waitFor(() => expect(requests).toHaveLength(1));
  const cleanup = deleting.close(() => {});
  await vi.waitFor(() => expect(requests).toHaveLength(binding ? 2 : 1));
  const result = binding ?? bindSeatKing(storage, 'alice', game, mud, failure, gate).catch(error => error);
  await vi.waitFor(() => expect(requests).toHaveLength(2));
  await requests.splice(binding ? 1 : 0, 1)[0](); await cleanup;
  const write = vi.spyOn(storage, 'setItem');
  await requests.shift()!();
  expect(await result).toBeInstanceOf(AccountDataClosed);
  expect(write).not.toHaveBeenCalled(); expect(failure).not.toHaveBeenCalled();
  expect(storage.getItem('kingdown.people-king.alice.first.0')).toBeNull();
  expect(seatKingUnsaved(storage, 'alice', game)).toBe(false);
});
it('an old king writer stays closed after a new sign-in and drops its old save line', async () => {
  const storage = memoryStorage(), game = view(), failure = vi.fn();
  const { accountData, AccountDataClosed } = await import('../../account/data');
  const first = { userId: 'alice', accessToken: 'first-session' };
  await accountData('alice', storage).confirm(async () => first);
  const gate = accountData('alice', storage);
  const write = vi.spyOn(storage, 'setItem').mockImplementation(() => { throw Error('full'); });
  await bindSeatKing(storage, 'alice', game, mud, failure, gate);
  expect(seatKingUnsaved(storage, 'alice', game)).toBe(true);
  write.mockRestore(); failure.mockClear();
  await gate.close(() => {});
  await accountData('alice', storage).confirm(async () => ({ ...first, accessToken: 'new-session' }));
  const lateWrite = vi.spyOn(storage, 'setItem');
  await expect(bindSeatKing(storage, 'alice', game, mud, failure, gate)).rejects.toBeInstanceOf(AccountDataClosed);
  expect(lateWrite).not.toHaveBeenCalled(); expect(failure).not.toHaveBeenCalled();
  expect(seatKingUnsaved(storage, 'alice', game)).toBe(false);
});


it('keeps a valid saved king without rewriting its JSON or giving a save line', async () => {
  const storage = memoryStorage(), failure = vi.fn();
  storage.setItem('kingdown.people-king.alice.first.0', '{ "power": "March", "king": "Mud" }');
  const write = vi.spyOn(storage, 'setItem').mockImplementation(() => { throw Error('full'); });
  expect(await bindSeatKing(storage, 'alice', view(), mud, failure)).toEqual({ king: 'Mud', power: 'March' });
  expect(write).not.toHaveBeenCalled(); expect(failure).not.toHaveBeenCalled();
});
it('a refused king read still tries the guarded write and keeps its choice', async () => {
  const storage = memoryStorage(), game = view();
  const read = storage.getItem;
  storage.getItem = key => { if (key.startsWith('kingdown.people-king.')) throw Error('refused read'); return read(key); };
  expect(await bindSeatKing(storage, 'alice', game, mud)).toEqual({ king: 'Mud', power: 'March' });
  storage.getItem = read;
  expect(JSON.parse(storage.getItem('kingdown.people-king.alice.first.0')!)).toEqual({ king: 'Mud', power: 'March' });
  expect(seatKingUnsaved(storage, 'alice', game)).toBe(false);
});
