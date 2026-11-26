import { describe, expect, it } from 'vitest';
import { accountPath, parseAccountRoute, type AccountEntryRoute } from '../src/online/routes';
import { signInPath } from '../src/online/sign-in';

// Each screen of AccountEntryRoute must have one or more samples of that screen, or this does not compile.
type Samples = { [S in AccountEntryRoute['screen']]: [AccountEntryRoute & { screen: S }, ...(AccountEntryRoute & { screen: S })[]] };
const id = 'd137864c-e174-4f38-9277-6bdd0a4289dc';
const samples: Samples = {
  play: [{ screen: 'play' }], profile: [{ screen: 'profile' }], settings: [{ screen: 'settings' }], 'new-friend': [{ screen: 'new-friend' }],
  game: [{ screen: 'game', gameId: id }], join: [{ screen: 'join', key: null }, { screen: 'join', key: 'ABC234' }],
};

describe('account screen routes', () => {
  it('reads each account path back to its own route', () => {
    // Without a case in parseAccountRoute, a new /play/<screen> path reads as { screen: 'play' } and the screen never opens.
    for (const route of Object.values(samples).flat()) {
      const path = accountPath(route);
      expect(parseAccountRoute(new URL(path, 'https://kingdown.test')), `src/online/routes.ts parseAccountRoute: add a case for ${path}`).toEqual(route);
    }
  });
});

// The /next.html address that signInPath (src/online/sign-in.ts) gives each screen. A new AccountEntryRoute screen
// gives TS2741 here: add its row, and a case in signInPath if '#play' is not its address.
type NextPaths = { [S in AccountEntryRoute['screen']]: (route: AccountEntryRoute & { screen: S }) => string };
const nextPaths: NextPaths = {
  play: () => '/next.html#play', profile: () => '/next.html#play', settings: () => '/next.html#play', 'new-friend': () => '/next.html#person',
  game: route => `/next.html#online=${route.gameId}`, join: route => `/next.html#join=${route.key ?? ''}`,
};

describe('account screen sign-in return', () => {
  it('gives each account screen its /next.html address', () => {
    for (const [screen, routes] of Object.entries(samples)) for (const route of routes) {
      const want = (nextPaths[screen as AccountEntryRoute['screen']] as (route: AccountEntryRoute) => string)(route);
      expect(signInPath(route, '/next.html'), `signInPath (src/online/sign-in.ts) gives ${screen} another address than nextPaths in tools/account-screen-guard.test.ts: correct signInPath, or change the row in nextPaths if the new address is intended`).toBe(want);
    }
  });
});
