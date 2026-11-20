import { icon } from '../ui/kit.js';
import { ease, pulse, reducedMotion, sound, tween, type Effect } from './fx';
export interface Route { place: 'play' | 'guide' | 'you' | 'game' | 'person' | 'join' | 'online'; section?: string; entry?: string }
const places = ['play', 'guide', 'you'];
/** The place of an address hash: #play, #guide or #you. Any other hash, #game included, opens Play. */
export const placeOf = (hash: string): Route['place'] => { const name = hash.replace(/^#/, ''); return places.includes(name) ? name as Route['place'] : 'play'; };
export function addressRoute(hash: string): Route {
  if (hash === '#person') return { place: 'person' };
  const online = /^#online=([0-9a-f-]{36})$/i.exec(hash);
  if (online && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(online[1])) return { place: 'online', entry: online[1].toLowerCase() };
  if (hash.startsWith('#join=')) return { place: 'join', entry: hash.slice(6) };
  return { place: placeOf(hash) };
}
export const routeHash = (route: Route) => `#${route.place}${route.place === 'online' || route.place === 'join' ? '=' + (route.entry ?? '') : ''}`;
export function daylightCrown(): SVGSVGElement {
  const crown = icon('play'); crown.removeAttribute('data-icon');
  crown.setAttribute('viewBox', '0 0 40 24');
  crown.querySelector('path')!.setAttribute('d', 'M5 19 3 6.5l9.5 6.2L20 2.5l7.5 10.2L37 6.5 35 19zM6 22h28');
  return crown;
}
export function mountShell(root: HTMLElement, render: (route: Route) => void) {
  // A load, a reload or an address edit opens the place of the hash; the stored Guide section stays when it matches.
  const fromAddress = (): Route => { const read = addressRoute(location.hash), kept: Route | undefined = history.state?.shell; return kept?.place === read.place && (read.entry === undefined || kept.entry === read.entry) ? kept : read; };
  let route: Route = fromAddress();
  const guideScrollKey = 'kingdown.guide-scroll';
  const guideAddress = () => `${location.pathname}#${route.section}/${route.entry}`;
  const skip = document.createElement('a'); skip.className = 'shell-skip'; skip.href = '#app'; skip.textContent = 'Skip to content';
  skip.addEventListener('click', event => { event.preventDefault(); const page = root.querySelector<HTMLElement>(':scope > :not(.shell-departing)'), target = page?.querySelector<HTMLElement>('h1') ?? page; if (target) { if (!target.matches('[tabindex]')) target.tabIndex = -1; target.focus(); } });
  document.body.prepend(skip);
  // A layer over the place has an entry for itself and one for each view it opens.
  // While a layer Back is pending, route changes and new layers wait in `waiting`, in order, until that Back lands.
  let layer: { id: string; base: string; close(): void; back?: () => boolean; views: (() => void)[]; depth: number } | null = null;
  let entryId = 0, waiting: { key: string; runs: (() => void)[] } | null = null;
  const nav = window.navigation;
  const layerRoutes = new Map<string, { key: string; browserKey: string }>();
  let forward = false;
  nav?.addEventListener('currententrychange', event => { forward = (nav.currentEntry?.index ?? -1) > event.from.index; });
  const newKey = () => `${performance.timeOrigin}:${++entryId}`;
  const viewKey = (id: string, depth: number) => `${id}/${depth}`;
  const settled = (run: () => void) => { if (waiting) waiting.runs.push(run); else run(); };
  const replacePlace = (next: Route, url = location.href) =>
    history.replaceState({ shell: next, key: history.state?.key ?? newKey() }, '', url);
  const pushLayer = () => {
    if (layer) history.pushState({
      shell: route, key: viewKey(layer.id, layer.depth), layer: true, layerId: layer.id,
      layerDepth: layer.depth, layerBase: layer.base,
    }, '', location.href);
  };
  function finishBack() {
    const runs = waiting!.runs; waiting = null;
    while (runs.length && !waiting) runs.shift()!();
    if (runs.length) waiting!.runs.push(...runs);
  }
  function stepTo(key: string, offset: number, run?: () => void, skipClosed = false) {
    const target = nav?.currentEntry && nav.entries()[nav.currentEntry.index + offset];
    if (skipClosed && !target?.sameDocument) return false;
    const pending = waiting = { key, runs: run ? [run] : [] };
    if (target?.sameDocument) {
      // A fixed destination cannot move if the browser also goes Back.
      const traverse = () => {
        if (waiting !== pending || history.state?.key === key) return;
        const { committed, finished } = nav.traverseTo(target.key);
        void finished?.catch(() => {});
        void committed?.catch((error: DOMException) => {
          if (waiting !== pending || history.state?.key === key) return;
          if (error.name === 'AbortError' && nav.entries().some(entry => entry.key === target.key)) setTimeout(traverse, 0);
          else {
            // The destination is gone. Clear the closed entry if it is still current.
            waiting = null;
            if (!layer && history.state?.layer) {
              const next = history.state.shell;
              replacePlace(next);
              if (JSON.stringify(next) !== JSON.stringify(route)) show(next);
            }
            run?.();
          }
        });
      };
      traverse();
    } else if (offset === -1) history.back();
    else history.go(offset);
    return true;
  }
  const showLayerView = (depth: number) => {
    if (!layer) return;
    layer.depth = depth;
    if (depth) layer.views[depth - 1]();
    else layer.back?.();
  };
  let pageEffect: Effect | undefined;
  function changePage(old: HTMLElement, page: HTMLElement, direction: number) {
    pageEffect?.finish();
    if (reducedMotion()) return;
    const ghost = old.cloneNode(true) as HTMLElement;
    ghost.classList.add('shell-departing'); ghost.inert = true; ghost.setAttribute('aria-hidden', 'true');
    ghost.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    page.before(ghost);
    page.style.transform = `translateX(${direction * 14}px)`; page.style.opacity = '.64';
    pageEffect = tween(220, k => {
      ghost.style.transform = `translateX(${direction * -14 * k}px)`; ghost.style.opacity = String(1 - k);
      page.style.transform = `translateX(${direction * 14 * (1 - k)}px)`; page.style.opacity = String(.64 + .36 * k);
    }, { curve: ease.out3, done: () => { ghost.remove(); page.style.removeProperty('transform'); page.style.removeProperty('opacity'); } });
  }
  const show = (next: Route, draw = true, scroll?: number) => {
    const before = route; route = next;
    const old = root.querySelector<HTMLElement>(':scope > :not(.shell-departing)');
    if (draw) pageEffect?.finish();
    skip.hidden = next.place === 'game' || next.place === 'online';
    if (draw) {
      render(next);
      const page = root.firstElementChild as HTMLElement | null;
      if (old && page && old !== page && before.place !== 'game' && next.place !== 'game') changePage(old, page, places.indexOf(next.place) >= places.indexOf(before.place) ? 1 : -1);
      if (page && scroll !== undefined) {
        page.dataset.restore = 'true';
        if (next.place === 'guide') {
          void document.fonts.ready.then(() => requestAnimationFrame(() => {
            if (page.isConnected) window.scrollTo(0, scroll);
          }));
        } else window.scrollTo(0, scroll);
      }
      // A page that restores the view (the row that the person left) keeps its focus and its scroll.
      if (page?.dataset.restore !== 'true' && !document.querySelector('dialog[open]')) { page?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }); window.scrollTo(0, 0); }
    }
    if (draw && before.place !== next.place && places.includes(before.place) && places.includes(next.place)) { sound('pass'); pulse('light'); }
  };
  function go(next: Route, draw = true, replace = false) {
    if (waiting) { waiting.runs.push(() => go(next, draw, replace)); return; }
    if (JSON.stringify(next) === JSON.stringify(route)) {
      if (replace) history.replaceState({ ...history.state, shell: route }, '', routeHash(route));
      return;
    }
    // A route change (a late invite reply) closes an open layer; the new place takes the layer's history entry.
    const open = layer; layer = null; open?.close();
    if (open || replace) {
      replacePlace(next, routeHash(next));
      if (open?.views.length && nav?.currentEntry) layerRoutes.set(open.id, { key: history.state.key, browserKey: nav.currentEntry.key });
    } else history.pushState({ shell: next, key: newKey() }, '', routeHash(next));
    show(next, draw);
  }
  window.addEventListener('popstate', event => {
    const state = event.state;
    const movedForward = forward;
    const next = state?.shell ?? fromAddress();
    const samePlace = JSON.stringify(next) === JSON.stringify(route);
    if (layer && samePlace && state?.layerId === layer.id) {
      showLayerView(state.layerDepth);
    } else {
      // A view without its own entry uses the layer's Back action.
      if (layer && samePlace && state?.key === layer.base && !layer.depth && layer.back?.()) {
        pushLayer();
        return;
      }
      const open = layer; layer = null; open?.close();
      // Skip closed views toward the place the browser is moving to.
      if (state?.layer && !waiting) {
        const routed = layerRoutes.get(state.layerId);
        const current = nav?.currentEntry;
        if (routed && current) {
          const target = nav.entries().find(entry => entry.key === routed.browserKey);
          if (target && (movedForward || target.index < current.index) &&
              stepTo(routed.key, target.index - current.index, undefined, true)) return;
        }
        if (state.layerBase && stepTo(state.layerBase, -1 - state.layerDepth, undefined, true)) return;
        replacePlace(next);
      } else if (!state?.key) replacePlace(next);
      if (!samePlace) show(next);
    }
    if (waiting && state?.key === waiting.key) finishBack();
  });
  // An address edit fires popstate, then hashchange: the second shows nothing new.
  window.addEventListener('hashchange', () => {
    if (waiting && history.state?.layer) return;
    if (location.hash === '#game' && route.place === 'game') return;
    const next = fromAddress();
    if (JSON.stringify(next) === JSON.stringify(route)) return;
    const open = layer; layer = null; open?.close();
    replacePlace(next);
    show(next);
  });
  window.addEventListener('pagehide', () => {
    if (layer) return;
    // Chromium can discard a history update made during pagehide on reload.
    if (route.place === 'guide' && root.querySelector('.guide-page[data-view="entry"]:not(.shell-departing)')) {
      try { sessionStorage.setItem(guideScrollKey, JSON.stringify([guideAddress(), window.scrollY])); } catch { /* Storage can be blocked. */ }
    }
  });
  replacePlace(route, location.pathname + location.search + (route.place === 'play' ? '' : routeHash(route)));
  return {
    go, get route() { return route; },
    start() {
      let scroll: number | undefined;
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (route.place === 'guide' && route.entry && navigation?.type === 'reload') {
        try {
          const [address, top] = JSON.parse(sessionStorage.getItem(guideScrollKey) ?? '[]');
          if (address === guideAddress() && typeof top === 'number') scroll = top;
        } catch { /* Storage can be blocked. */ }
      }
      show(route, true, scroll);
    },
    /** Runs `run` now, or after a pending layer Back, in order with route changes. Open a layer only in `run`. */
    settled,
    /** Open a layer. Browser Back calls `close`. */
    openLayer(close: () => void, _dialog?: HTMLDialogElement, back?: () => boolean) {
      layer = { id: newKey(), base: history.state.key, close, back, views: [], depth: 0 }; pushLayer();
    },
    openLayerView(show: () => void) {
      const open = layer;
      settled(() => {
        if (!open || layer !== open) return;
        open.views.splice(open.depth, Infinity, show);
        open.depth++;
        pushLayer(); show();
      });
    },
    backLayerViews(all = false) {
      if (!layer?.depth) return false;
      if (waiting) return true;
      const distance = all ? layer.depth : 1;
      stepTo(viewKey(layer.id, layer.depth - distance), -distance);
      return true;
    },
    closeLayer,
  };
  /** The layer closed itself: its history entry goes. Resolves when the entry is gone. */
  function closeLayer(): Promise<void> {
    const open = layer;
    if (!open) return Promise.resolve();
    return new Promise(done => settled(() => {
      if (layer !== open) { done(); return; }
      layer = null;
      stepTo(open.base, -1 - open.depth, done);
    }));
  }
}
