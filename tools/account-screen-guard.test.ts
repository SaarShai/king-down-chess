import { describe, expect, it } from 'vitest';
import { accountPath, parseAccountRoute, type AccountEntryRoute } from '../src/online/routes';

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
