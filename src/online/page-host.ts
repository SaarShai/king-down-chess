import type { PageHost, PageViewport, ReadRoute } from '../account-game/client';

function readRoute(value: unknown): ReadRoute | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const route = value as Record<string, unknown>, keys = Object.keys(route);
  if (route.screen === 'game') {
    if (keys.length === 2 && typeof route.gameId === 'string' && /^[\w-]+$/.test(route.gameId)) return { screen: 'game', gameId: route.gameId };
  } else if (keys.length === 1 && (route.screen === 'play' || route.screen === 'profile' || route.screen === 'settings')) return { screen: route.screen };
}

function locationRoute(): ReadRoute | undefined {
  const path = window.location.pathname;
  if (path === '/play' || path === '/play/') return { screen: 'play' };
  if (path === '/play/profile') return { screen: 'profile' };
  if (path === '/play/settings') return { screen: 'settings' };
  const game = /^\/g\/([^/]+)$/.exec(path);
  if (game) {
    try { return readRoute({ screen: 'game', gameId: decodeURIComponent(game[1]) }); } catch { return; }
  }
}

const routePath = (route: ReadRoute): string => route.screen === 'game' ? `/g/${encodeURIComponent(route.gameId)}` : route.screen === 'play' ? '/play/' : `/play/${route.screen}`;

export function createWebPageHost(userId: string): PageHost {
  const key = `kingdown.account-page.${userId}`;
  let current: ReadRoute | undefined, emit: ((route: ReadRoute) => void) | undefined, stop = () => {};
  function save(route: ReadRoute): boolean {
    current = route.screen === 'game' ? { screen: 'game', gameId: route.gameId } : { screen: route.screen };
    try { window.sessionStorage.setItem(key, JSON.stringify(current)); return true; } catch { return false; }
  }
  function restored(): ReadRoute | undefined {
    try { return readRoute(JSON.parse(window.sessionStorage.getItem(key) ?? 'null')); } catch { return; }
  }
  return {
    start(enter, close) {
      stop();
      let active = true, ready = false, hidden = false;
      const take = (route: ReadRoute) => {
        if (!active || !ready || hidden) return;
        save(route); enter({ ...route });
      };
      const fromLocation = () => {
        const route = locationRoute();
        if (route && routePath(route) !== (current && routePath(current))) take(route);
      };
      const show = (event: PageTransitionEvent) => {
        if (!event.persisted || !active || !ready || !hidden) return;
        hidden = false; take(locationRoute() ?? current ?? { screen: 'play' });
      };
      const hide = (event: PageTransitionEvent) => {
        if (!active || hidden) return;
        hidden = true;
        // A cached page keeps its return listener until the caller stops it.
        if (!event.persisted) cleanup();
        close();
      };
      const begin = () => {
        if (!active || ready) return;
        ready = true;
        const pathRoute = locationRoute(), route = pathRoute ?? current ?? restored() ?? { screen: 'play' };
        if (!pathRoute || window.location.pathname === '/play') window.history.replaceState(null, '', routePath(route) + window.location.search + window.location.hash);
        take(route);
      };
      const cleanup = () => {
        active = false;
        document.removeEventListener('DOMContentLoaded', begin);
        window.removeEventListener('popstate', fromLocation);
        window.removeEventListener('pageshow', show);
        window.removeEventListener('pagehide', hide);
        if (emit === take) emit = undefined;
      };
      stop = cleanup; emit = take;
      window.addEventListener('popstate', fromLocation);
      window.addEventListener('pageshow', show);
      window.addEventListener('pagehide', hide);
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', begin, { once: true });
      else begin();
      return cleanup;
    },
    navigate(route) {
      window.history.pushState(null, '', routePath(route));
      if (emit) emit(route); else save(route);
    },
    save,
    viewport(): PageViewport {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)';
      document.documentElement.append(probe);
      try {
        const style = window.getComputedStyle(probe), inset = (value: string) => Math.max(0, parseFloat(value) || 0);
        return { touch: navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches, safe: { top: inset(style.paddingTop), right: inset(style.paddingRight), bottom: inset(style.paddingBottom), left: inset(style.paddingLeft) } };
      } finally { probe.remove(); }
    },
  };
}
