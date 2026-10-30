import type { ReadRoute } from '../account-game/client';

export type AccountEntryRoute = ReadRoute | { screen: 'new-friend' } | { screen: 'join'; key: string | null };

const GAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function inviteKey(value: string): string | null {
  if (/^[A-Za-z0-9_-]{43}$/.test(value)) return value;
  const code = value.toUpperCase().replace(/[\s-]/g, '');
  return /^[A-HJKMNP-Z2-9]{6}$/.test(code) ? code : null;
}

/** Read only the path and a checked invite fragment. The caller checks the origin. */
export function parseAccountRoute(url: URL): AccountEntryRoute | undefined {
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || /[%\\]/.test(url.pathname)) return;
  const path = url.pathname;
  if (/^\/play\/friend\/?$/.test(path)) return { screen: 'new-friend' };
  if (path === '/play' || path === '/play/') return { screen: 'play' };
  const screen = /^\/play\/(profile|settings)\/?$/.exec(path)?.[1] as 'profile' | 'settings' | undefined;
  if (screen) return { screen };
  if (path.startsWith('/play/')) return { screen: 'play' };
  const id = /^\/g\/([^/]+)\/?$/.exec(path)?.[1];
  if (id !== undefined) return GAME.test(id) ? { screen: 'game', gameId: id.toLowerCase() } : undefined;
  if (/^\/j\/?$/.test(path)) {
    try { return { screen: 'join', key: inviteKey(decodeURIComponent(url.hash.slice(1))) }; }
    catch { return { screen: 'join', key: null }; }
  }
}

/** Rebuild a route. No query or unchecked fragment reaches the destination. */
export function accountPath(route: AccountEntryRoute): string {
  switch (route.screen) {
    case 'new-friend': return '/play/friend';
    case 'play': return '/play/';
    case 'profile': return '/play/profile';
    case 'settings': return '/play/settings';
    case 'game':
      if (!GAME.test(route.gameId)) throw new TypeError('Invalid game route');
      return `/g/${route.gameId.toLowerCase()}`;
    case 'join': {
      const key = route.key === null ? null : inviteKey(route.key);
      return key ? `/j#${key}` : '/j';
    }
  }
}
