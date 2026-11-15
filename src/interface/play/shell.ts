import { navigation } from '../ui/kit.js';
import { ms, tabChange, travelMarker } from './motion';
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
export function mountShell(root: HTMLElement, render: (route: Route) => void) {
  // A load, a reload or an address edit opens the place of the hash; the stored Guide section stays when it matches.
  const fromAddress = (): Route => { const read = addressRoute(location.hash), kept: Route | undefined = history.state?.shell; return kept?.place === read.place && (read.entry === undefined || kept.entry === read.entry) ? kept : read; };
  let route: Route = fromAddress();
  const nav = navigation('Play', name => go({ place: name.toLowerCase() as Route['place'] }), { guide: true });
  // The bar comes first in the Tab order, after a skip link to the page (runs/launch/speed/report.md fix 11).
  const skip = document.createElement('a'); skip.className = 'shell-skip'; skip.href = '#app'; skip.textContent = 'Skip to content';
  skip.addEventListener('click', event => { event.preventDefault(); const page = root.querySelector<HTMLElement>(':scope > :not(.shell-departing)'), target = page?.querySelector<HTMLElement>('h1') ?? page; if (target) { if (!target.matches('[tabindex]')) target.tabIndex = -1; target.focus(); } });
  nav.classList.add('shell-nav'); document.body.prepend(skip, nav);
  // A layer over the place (the New game panel) has its own history entry: Back closes it.
  let layer: (() => void) | null = null, closing: (() => void) | null = null;
  let moving: ReturnType<typeof setTimeout> | undefined;
  const show = (next: Route, draw = true) => {
    const before = route; route = next;
    const oldTab = nav.querySelector<HTMLElement>('[aria-current]');
    const old = root.querySelector<HTMLElement>(':scope > :not(.shell-departing)');
    if (draw && old && before.place !== 'game' && next.place !== 'game') for (const animation of old.getAnimations()) { animation.commitStyles(); animation.cancel(); }
    skip.hidden = nav.hidden = next.place === 'game' || next.place === 'online';
    for (const link of nav.querySelectorAll('a')) {
      if (link.hash === `#${next.place}`) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    }
    const newTab = nav.querySelector<HTMLElement>('[aria-current]');
    if (draw) {
      render(next);
      const page = root.firstElementChild as HTMLElement | null;
      if (old && page && old !== page && before.place !== 'game' && next.place !== 'game') tabChange(old, page, places.indexOf(next.place) >= places.indexOf(before.place) ? 1 : -1);
      // A page that restores the view (the row that the person left) keeps its focus and its scroll.
      if (page?.dataset.restore !== 'true') { page?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }); window.scrollTo(0, 0); }
    }
    if (oldTab && newTab && oldTab !== newTab) { travelMarker(oldTab, newTab, true); nav.dataset.moving = 'true'; clearTimeout(moving); moving = setTimeout(() => delete nav.dataset.moving, ms('--dur-tab-marker')); }
  };
  function go(next: Route, draw = true) {
    if (JSON.stringify(next) === JSON.stringify(route)) return;
    // A route change (a late invite reply) closes an open layer; the new place takes the layer's history entry.
    const open = layer; layer = null; open?.();
    history[open ? 'replaceState' : 'pushState']({ shell: next }, '', routeHash(next)); show(next, draw);
  }
  window.addEventListener('popstate', event => {
    if (closing) { const done = closing; closing = null; done(); return; }
    if (layer) { const close = layer; layer = null; close(); if (JSON.stringify(event.state?.shell) === JSON.stringify(route)) return; }
    // Forward to the entry of a closed layer: the place stays; the next Back leaves it.
    if (event.state?.layer && JSON.stringify(event.state.shell) === JSON.stringify(route)) { closing = () => {}; history.back(); return; }
    show(event.state?.shell ?? fromAddress());
  });
  // An address edit fires popstate, then hashchange: the second shows nothing new.
  window.addEventListener('hashchange', () => {
    if (location.hash === '#game' && route.place === 'game') return;
    const next = fromAddress(); history.replaceState({ shell: next }, '', location.href);
    if (JSON.stringify(next) !== JSON.stringify(route)) show(next);
  });
  history.replaceState({ shell: route }, '', location.pathname + location.search + (route.place === 'play' ? '' : routeHash(route)));
  return {
    go, start: () => show(route), get route() { return route; },
    /** Open a layer: one history entry. Browser Back calls `close`. */
    openLayer(close: () => void) { layer = close; history.pushState({ shell: route, layer: true }, '', location.href); },
    /** The layer closed itself: its history entry goes. Resolves when the entry is gone. */
    closeLayer(): Promise<void> {
      if (!layer) return Promise.resolve();
      layer = null; return new Promise(done => { closing = done; history.back(); });
    },
  };
}
