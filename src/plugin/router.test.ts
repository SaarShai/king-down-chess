import { expect, it } from 'vitest';
import type { View } from '../match/protocol';
import { createRouter } from './router';

it('routes each server game phase to its one screen', () => {
  const screens: string[] = [];
  const router = createRouter(async () => undefined, screen => { screens.push(screen); }, () => {});
  for (const [status, kind, options] of [
    ['waiting', 'friend'], ['waiting', 'random'], ['setup', 'friend', {}],
    ['setup', 'solo'], ['playing', 'solo'], ['finished', 'friend'], ['aborted', 'random'],
  ]) router.routeView({ status, kind, options } as View);
  expect(screens).toEqual(['friend', 'wait', 'seat', 'board', 'board', 'end', 'end']);
});

it('returns only an explicit computer abort to the draft', () => {
  const router = createRouter(async () => undefined, () => {}, () => {});
  const view = { status: 'aborted', kind: 'solo', result: { winner: null, reason: 'abort' } } as View;
  expect(router.routeView(view)).toBe('play');
  expect(router.routeView({ ...view, kind: 'friend' })).toBe('end');
  expect(router.routeView({ ...view, result: { winner: null, reason: 'no_start' } })).toBe('end');
});

it('starts each kind as a pending call and lets a caller defer the route', async () => {
  const calls: unknown[] = [], screens: string[] = [];
  const view = { status: 'setup', kind: 'solo', options: {} } as View;
  const router = createRouter(async (name, args, retain) => { calls.push([name, args, retain]); return view; }, screen => { screens.push(screen); }, () => {});
  expect(await router.start('solo', { colour: 'white' }, { route: false })).toBe(view);
  expect(screens).toEqual([]);
  await router.start('friend', { colour: 'black' }); await router.start('random', { colour: 'white' });
  const command_id = expect.stringMatching(/^[0-9a-f]{32}$/);
  expect(calls).toEqual([
    ['kingdown_create', { kind: 'solo', colour: 'white', command_id }, true],
    ['kingdown_create', { kind: 'friend', colour: 'black', command_id }, true],
    ['kingdown_find', { colour: 'white', command_id }, true],
  ]);
  // Each start has its own command ID: only a resend of the same start reuses one.
  expect(new Set(calls.map(call => (call as [string, { command_id: string }])[1].command_id)).size).toBe(3);
  expect(screens).toEqual(['seat', 'seat']);
});

it('returns at once from a failed start: Retry and its continuation finish it, not the start (design §5.2)', async () => {
  const screens: string[] = [];
  const router = createRouter(async () => undefined, screen => { screens.push(screen); }, () => {});
  expect(await router.start('random')).toBeUndefined();
  expect(screens).toEqual([]);
});
