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
  let layer: { id: string; close(): void; back?: () => boolean; views: (() => void)[]; depth: number } | null = null;
  let layerId = 0, waiting: (() => void)[] | null = null;
  const settled = (run: () => void) => { if (waiting) waiting.push(run); else run(); };
  const pushLayer = () => {
    if (layer) history.pushState({ shell: route, layer: true, layerId: layer.id, layerDepth: layer.depth }, '', location.href);
  };
  const stepBack = (distance: number) => distance === 1 ? history.back() : history.go(-distance);
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
    if (waiting) { waiting.push(() => go(next, draw, replace)); return; }
    if (JSON.stringify(next) === JSON.stringify(route)) {
      if (replace) history.replaceState({ ...history.state, shell: route }, '', routeHash(route));
      return;
    }
    if (layer?.depth) {
      const open = layer;
      void closeLayer(); open.close();
      settled(() => go(next, draw, replace));
      return;
    }
    // A route change (a late invite reply) closes an open layer; the new place takes the layer's history entry.
    const open = layer; layer = null; open?.close();
    history[open || replace ? 'replaceState' : 'pushState']({ shell: next }, '', routeHash(next)); show(next, draw);
  }
  window.addEventListener('popstate', event => {
    if (waiting) {
      const runs = waiting; waiting = null;
      while (runs.length && !waiting) runs.shift()!();
      if (runs.length) waiting!.push(...runs); // a run started another Back: the rest waits for it
      return;
    }
    const next = event.state?.shell ?? fromAddress();
    const samePlace = JSON.stringify(next) === JSON.stringify(route);
    if (layer) {
      if (samePlace && event.state?.layerId === layer.id) {
        showLayerView(event.state.layerDepth);
        return;
      }
      // A view without its own entry uses the layer's Back action.
      if (samePlace && !layer.depth && layer.back?.()) { pushLayer(); return; }
      const open = layer; layer = null; open.close();
      if (samePlace) return;
    }
    // Forward to the entry of a closed layer: the place stays; the next Back leaves it.
    if (event.state?.layer && samePlace) { waiting = []; stepBack(1 + (event.state.layerDepth ?? 0)); return; }
    if (!event.state?.shell) history.replaceState({ shell: next }, '', location.href);
    if (!samePlace) show(next);
  });
  // An address edit fires popstate, then hashchange: the second shows nothing new.
  window.addEventListener('hashchange', () => {
    if (location.hash === '#game' && route.place === 'game') return;
    const next = fromAddress();
    if (JSON.stringify(next) === JSON.stringify(route)) return;
    const open = layer; layer = null; open?.close();
    history.replaceState({ shell: next }, '', location.href);
    show(next);
  });
  window.addEventListener('pagehide', () => {
    if (layer) return;
    // Chromium can discard a history update made during pagehide on reload.
    if (route.place === 'guide' && root.querySelector('.guide-page[data-view="entry"]:not(.shell-departing)')) {
      try { sessionStorage.setItem(guideScrollKey, JSON.stringify([guideAddress(), window.scrollY])); } catch { /* Storage can be blocked. */ }
    }
  });
  history.replaceState({ shell: route }, '', location.pathname + location.search + (route.place === 'play' ? '' : routeHash(route)));
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
      layer = { id: `${performance.timeOrigin}:${++layerId}`, close, back, views: [], depth: 0 }; pushLayer();
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
      waiting = [];
      showLayerView(layer.depth - distance);
      stepBack(distance);
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
      waiting = [done]; stepBack(1 + open.depth);
    }));
  }
}
