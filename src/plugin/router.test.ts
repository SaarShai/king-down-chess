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

it('starts each kind as a pending call and lets a caller defer the route', async () => {
  const calls: unknown[] = [], screens: string[] = [];
  const view = { status: 'setup', kind: 'solo', options: {} } as View;
  const router = createRouter(async (name, args, retain) => { calls.push([name, args, retain]); return view; }, screen => { screens.push(screen); }, () => {});
  expect(await router.start('solo', { colour: 'white' }, { route: false })).toBe(view);
  expect(screens).toEqual([]);
  await router.start('friend', { colour: 'black' }); await router.start('random', { colour: 'white' });
  expect(calls).toEqual([
    ['kingdown_create', { kind: 'solo', colour: 'white' }, true],
    ['kingdown_create', { kind: 'friend', colour: 'black' }, true],
    ['kingdown_find', { colour: 'white' }, true],
  ]);
  expect(screens).toEqual(['seat', 'seat']);
});

it('can cancel a pending start when the page closes', async () => {
  const router = createRouter(async () => undefined, () => {}, () => {}, () => true);
  const cancelled = router.start('random'); await Promise.resolve();
  router.finishStart(); expect(await cancelled).toBeUndefined();
});
