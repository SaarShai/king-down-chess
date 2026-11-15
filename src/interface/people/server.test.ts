import { expect, it, vi } from 'vitest';
import { OnlineError, type OnlineClient } from '../../online/client';
import type { View } from '../../match/protocol';
import { faultOf, inviteKey, peopleServer, settled } from './server';

it('gives one fault kind for each server answer', () => {
  const cases: [OnlineError, string][] = [
    [new OnlineError('UNAUTHENTICATED', 401, ''), 'auth'], [new OnlineError('STALE_REVISION', 409, ''), 'stale'], [new OnlineError('WRONG_TURN', 403, ''), 'stale'],
    [new OnlineError('INVALID_MOVE', 400, ''), 'illegal'], [new OnlineError('MATCH_TERMINAL', 409, ''), 'ended'], [new OnlineError('MATCH_REMOVED', 404, ''), 'gone'],
    [new OnlineError('NOT_FOUND', 404, ''), 'gone'], [new OnlineError('UNAVAILABLE', 503, ''), 'down'], [new OnlineError('NOT_ALLOWED', 409, ''), 'refused'],
    [new OnlineError('FORBIDDEN', 403, ''), 'refused'], [new OnlineError('INVITE_UNAVAILABLE', 404, ''), 'refused'],
  ];
  for (const [error, kind] of cases) expect(faultOf(error).kind, error.code).toBe(kind);
  expect(faultOf(new OnlineError('FORBIDDEN', 403, ''), true, true).kind).toBe('account');
  expect(faultOf(new OnlineError('INTERNAL' as never, 500, '')).kind).toBe('unknown');
  expect(faultOf(new TypeError('Failed to fetch')).kind).toBe('unknown');
  expect(faultOf(new TypeError('Failed to fetch'), false).kind).toBe('offline');
  // Only an answer of the server settles a command: no answer, an ended sign-in or a busy service keep it.
  expect(['unknown', 'offline', 'auth', 'down'].map(kind => settled({ kind: kind as never, message: '' }))).toEqual([false, false, false, false]);
  expect(['stale', 'illegal', 'ended', 'gone', 'refused'].map(kind => settled({ kind: kind as never, message: '' }))).toEqual([true, true, true, true, true]);
});

it('reads only a link token as an invite key; game codes stay parked', () => {
  const token = 'A'.repeat(42) + '_';
  expect(inviteKey(`#${token}`)).toEqual({ token });
  expect(inviteKey(encodeURIComponent(token))).toEqual({ token });
  expect(inviteKey('#ABCDEF')).toBeUndefined();
  expect(inviteKey('#%E0%A4%A')).toBeUndefined();
});

it('uses the website client unchanged and gives the command view', async () => {
  const view = { game_id: 'g', revision: 3 } as View;
  const api = { command: vi.fn(async () => ({ type: 'ack', command_id: 'c', revision: 3, view })), game: vi.fn(async () => view), redeem: vi.fn(async () => view) } as unknown as OnlineClient;
  const server = peopleServer(api);
  expect(await server.command('g', 2, { type: 'resign' }, 'c')).toBe(view);
  expect(api.command).toHaveBeenCalledWith('g', 2, { type: 'resign' }, 'c', undefined);
  await server.game('g', 2); expect(api.game).toHaveBeenCalledWith('g', 2, undefined);
  await server.join({ token: 't' }); expect(api.redeem).toHaveBeenCalledWith({ token: 't' }, undefined);
});
