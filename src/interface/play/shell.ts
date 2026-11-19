import { icon, navigation } from '../ui/kit.js';
import { ease, onFrame, pulse, reducedMotion, sound, Spring, tween, type Effect } from './fx';
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
  const youScroll: number | undefined = route.place === 'you' ? history.state?.youScroll : undefined;
  const guideScrollKey = 'kingdown.guide-scroll';
  const guideAddress = () => `${location.pathname}#${route.section}/${route.entry}`;
  const nav = navigation('Play', name => {
    const next = { place: name.toLowerCase() as Route['place'] };
    if (layer && next.place === route.place) { layer(); void closeLayer(); }
    else go(next);
  }, { guide: true });
  nav.querySelector('a[href="#play"] > svg')?.replaceWith(daylightCrown());
  // The bar comes first in the Tab order, after a skip link to the page (runs/launch/speed/report.md fix 11).
  const skip = document.createElement('a'); skip.className = 'shell-skip'; skip.href = '#app'; skip.textContent = 'Skip to content';
  skip.addEventListener('click', event => { event.preventDefault(); const page = root.querySelector<HTMLElement>(':scope > :not(.shell-departing)'), target = page?.querySelector<HTMLElement>('h1') ?? page; if (target) { if (!target.matches('[tabindex]')) target.tabIndex = -1; target.focus(); } });
  nav.classList.add('shell-nav'); document.body.prepend(skip, nav);
  // A layer over the place (the New game panel) has its own history entry: Back closes it.
  // While a layer Back is pending, route changes and new layers wait in `waiting`, in order, until that Back lands.
  let layer: (() => void) | null = null, waiting: (() => void)[] | null = null;
  const settled = (run: () => void) => { if (waiting) waiting.push(run); else run(); };
  let pageEffect: Effect | undefined, plateEffect: Effect | undefined;
  const plate = document.createElement('span'); plate.className = 'shell-plate'; plate.setAttribute('aria-hidden', 'true');
  nav.prepend(plate);
  function markTab(from: HTMLElement, to: HTMLElement) {
    const a = (plateEffect ? plate : from).getBoundingClientRect(), b = to.getBoundingClientRect(), bar = nav.getBoundingClientRect();
    plateEffect?.finish();
    const spring = new Spring(0, 320, 26); spring.to = 1;
    nav.dataset.moving = 'true';
    const draw = (k: number) => Object.assign(plate.style, {
      left: `${a.left - bar.left + (b.left - a.left) * k}px`,
      top: `${b.top - bar.top}px`,
      width: `${a.width + (b.width - a.width) * k}px`,
      height: `${b.height}px`,
    });
    draw(0);
    plateEffect = onFrame(dt => {
      draw(spring.step(dt));
      if (spring.still) return false;
    }, () => { delete nav.dataset.moving; plate.removeAttribute('style'); plateEffect = undefined; });
    if (reducedMotion()) plateEffect = undefined;
  }
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
    const oldTab = nav.querySelector<HTMLElement>('[aria-current]');
    const old = root.querySelector<HTMLElement>(':scope > :not(.shell-departing)');
    if (draw) pageEffect?.finish();
    skip.hidden = nav.hidden = next.place === 'game' || next.place === 'online';
    for (const link of nav.querySelectorAll('a')) {
      if (link.hash === `#${next.place}`) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    }
    const newTab = nav.querySelector<HTMLElement>('[aria-current]');
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
      if (page?.dataset.restore !== 'true') { page?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }); window.scrollTo(0, 0); }
    }
    if (oldTab && newTab && oldTab !== newTab) { sound('pass'); pulse('light'); if (!reducedMotion()) markTab(oldTab, newTab); }
    else if (!newTab) plateEffect?.finish();
  };
  function go(next: Route, draw = true) {
    // Close, then a late invite reply: the route changes after the pending Back lands.
    if (waiting) { waiting.push(() => go(next, draw)); return; }
    if (JSON.stringify(next) === JSON.stringify(route)) return;
    // A route change (a late invite reply) closes an open layer; the new place takes the layer's history entry.
    const open = layer; layer = null; open?.();
    history[open ? 'replaceState' : 'pushState']({ shell: next }, '', routeHash(next)); show(next, draw);
  }
  window.addEventListener('popstate', event => {
    if (waiting) {
      const runs = waiting; waiting = null;
      while (runs.length && !waiting) runs.shift()!();
      if (runs.length) waiting!.push(...runs); // a run started another Back: the rest waits for it
      return;
    }
    if (layer) { const close = layer; layer = null; close(); if (JSON.stringify(event.state?.shell) === JSON.stringify(route)) return; }
    // Forward to the entry of a closed layer: the place stays; the next Back leaves it.
    if (event.state?.layer && JSON.stringify(event.state.shell) === JSON.stringify(route)) { waiting = []; history.back(); return; }
    const next = event.state?.shell ?? fromAddress();
    show(next, true, next.place === 'you' ? event.state?.youScroll : undefined);
  });
  // An address edit fires popstate, then hashchange: the second shows nothing new.
  window.addEventListener('hashchange', () => {
    if (location.hash === '#game' && route.place === 'game') return;
    const next = fromAddress(); history.replaceState({ shell: next }, '', location.href);
    if (JSON.stringify(next) !== JSON.stringify(route)) show(next);
  });
  // About opens a separate document. Back can load this entry before the browser has a page to scroll.
  window.addEventListener('pagehide', () => {
    if (layer) return;
    if (route.place === 'you') history.replaceState({ shell: route, youScroll: window.scrollY }, '');
    // Chromium can discard a history update made during pagehide on reload.
    if (route.place === 'guide' && root.querySelector('.guide-page[data-view="entry"]:not(.shell-departing)')) {
      try { sessionStorage.setItem(guideScrollKey, JSON.stringify([guideAddress(), window.scrollY])); } catch { /* Storage can be blocked. */ }
    }
  });
  history.replaceState({ shell: route }, '', location.pathname + location.search + (route.place === 'play' ? '' : routeHash(route)));
  return {
    go, get route() { return route; },
    start() {
      let scroll = youScroll;
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
    /** Open a layer: one history entry. Browser Back calls `close`. */
    openLayer(close: () => void, dialog?: HTMLDialogElement) {
      if (dialog) {
        // Only controls inside the modal can take input. Move the bar back before the close animation copies the panel.
        dialog.prepend(nav);
        dialog.addEventListener('kd-before-close', () => skip.after(nav), { once: true });
      }
      layer = close; history.pushState({ shell: route, layer: true }, '', location.href);
    },
    closeLayer,
  };
  /** The layer closed itself: its history entry goes. Resolves when the entry is gone. */
  function closeLayer(): Promise<void> {
    if (!layer) return Promise.resolve();
    layer = null; return new Promise(done => { waiting = [done]; history.back(); });
  }
}
