import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PageHost, ReadRoute } from '../account-game/client';
import { createWebPageHost } from './page-host';

const gameId = '33333333-3333-4333-8333-333333333333';
const key = 'kingdown.account-page.user-a';
const cleanups: Array<() => void> = [];
afterEach(() => { for (const cleanup of cleanups.splice(0)) cleanup(); vi.unstubAllGlobals(); });

function transition(type: string, persisted = false): PageTransitionEvent {
  return Object.assign(new Event(type), { persisted }) as PageTransitionEvent;
}

function browser(path = '/play/', loading = false) {
  const records = new Map<string, string>(), local = new Map([['kingdown.save', 'local game'], ['kingdown.lessons', 'lesson'], ['kingdown.sync', 'sync time']]);
  const page = Object.assign(new EventTarget(), { location: new URL(path, 'https://kingdown.test'), sessionStorage: {
    getItem: vi.fn((name: string) => records.get(name) ?? null),
    setItem: vi.fn((name: string, value: string) => { records.set(name, value); }),
  }, matchMedia: vi.fn(() => ({ matches: false })), getComputedStyle: vi.fn(() => ({ paddingTop: '20px', paddingRight: '0px', paddingBottom: '12.5px', paddingLeft: '-1px' })) });
  const entries = [page.location.href]; let index = 0;
  const history = {
    pushState: vi.fn((_state: unknown, _unused: string, url: string) => {
      page.location = new URL(url, page.location); entries.splice(++index, entries.length, page.location.href);
    }),
    replaceState: vi.fn((_state: unknown, _unused: string, url: string) => { page.location = new URL(url, page.location); entries[index] = page.location.href; }),
    back() { if (index > 0) { page.location = new URL(entries[--index]); page.dispatchEvent(new Event('popstate')); } },
    forward() { if (index + 1 < entries.length) { page.location = new URL(entries[++index]); page.dispatchEvent(new Event('popstate')); } },
  };
  const probe = { style: { cssText: '' }, remove: vi.fn() };
  const doc = Object.assign(new EventTarget(), { readyState: loading ? 'loading' : 'complete', documentElement: { append: vi.fn() }, createElement: vi.fn(() => probe) });
  const localStorage = { getItem: vi.fn((name: string) => local.get(name) ?? null), setItem: vi.fn((name: string, value: string) => { local.set(name, value); }), removeItem: vi.fn(), clear: vi.fn() };
  vi.stubGlobal('window', Object.assign(page, { history }));
  vi.stubGlobal('document', doc); vi.stubGlobal('navigator', { maxTouchPoints: 0 }); vi.stubGlobal('localStorage', localStorage);
  return { page, doc, history, records, local, localStorage, probe };
}

function mount(host: PageHost, enter = vi.fn<(route: ReadRoute) => void>(), close = vi.fn<() => void>()) {
  const dispose = host.start(enter, close); cleanups.push(dispose);
  return { enter, close, dispose };
}

describe('web page host', () => {
  it('starts once when the document is ready and replaces /play without a new history entry', () => {
    const { page, doc, history, records } = browser('/play?code=private#private', true);
    const { enter } = mount(createWebPageHost('user-a'));
    expect(enter).not.toHaveBeenCalled(); expect(history.replaceState).not.toHaveBeenCalled();
    doc.dispatchEvent(new Event('DOMContentLoaded')); doc.dispatchEvent(new Event('DOMContentLoaded'));
    page.dispatchEvent(transition('pageshow'));
    expect(enter.mock.calls).toEqual([[{ screen: 'play' }]]);
    expect(history.replaceState.mock.calls).toEqual([[null, '', '/play/?code=private#private']]);
    expect(history.pushState).not.toHaveBeenCalled();
    expect(records.get(key)).toBe('{"screen":"play"}');
  });

  it.each<[string, ReadRoute]>([
    ['/play/', { screen: 'play' }], ['/play/profile', { screen: 'profile' }], ['/play/settings', { screen: 'settings' }],
    [`/g/${gameId}`, { screen: 'game', gameId }], [`/g/%33${gameId.slice(1)}`, { screen: 'game', gameId }],
  ])('uses the current route before the saved route: %s', (path, route) => {
    const { records } = browser(path); records.set(key, JSON.stringify({ screen: 'settings' }));
    const { enter } = mount(createWebPageHost('user-a'));
    expect(enter.mock.calls).toEqual([[route]]); expect(JSON.parse(records.get(key)!)).toEqual(route);
  });

  it.each<ReadRoute>([{ screen: 'play' }, { screen: 'profile' }, { screen: 'settings' }, { screen: 'game', gameId }])('restores a permitted route: %j', route => {
    const { records } = browser('/account-entry'); records.set(key, JSON.stringify(route));
    expect(mount(createWebPageHost('user-a')).enter.mock.calls).toEqual([[route]]);
  });

  it.each([
    'bad json', 'null', 'true', '[]', '"/play/profile"', '{}', '{"screen":"board"}',
    '{"screen":"profile","token":"private"}', '{"screen":"play","gameId":"other"}',
    '{"screen":"game"}', '{"screen":"game","gameId":1}', '{"screen":"game","gameId":""}',
    '{"screen":"game","gameId":"../other"}', '{"screen":"game","gameId":"https://other.test"}',
    '{"screen":"game","gameId":"id#private"}', '{"screen":"game","gameId":"id","draft":{}}',
  ])('does not restore a malformed or foreign record: %s', saved => {
    const { records } = browser('/account-entry'); records.set(key, saved);
    expect(mount(createWebPageHost('user-a')).enter.mock.calls).toEqual([[{ screen: 'play' }]]);
  });

  it('does not restore an invite, foreign path or malformed game path from the location', () => {
    const { page, records } = browser('/j#private');
    records.set(key, '{"screen":"profile"}');
    for (const path of ['/j#private', '/g/%', '/g/%2Fother', '/g/id/extra', '/play/unknown']) {
      page.location = new URL(path, page.location);
      const { enter, dispose } = mount(createWebPageHost('user-a'));
      expect(enter.mock.calls).toEqual([[{ screen: 'profile' }]]); dispose();
    }
  });

  it.each(['/j', '/account-entry'])('returns to the saved route with a matching URL after Back from %s', path => {
    const { page, history, records } = browser(path + '?code=private#private');
    records.set(key, '{"screen":"profile"}');
    const host = createWebPageHost('user-a'), { enter } = mount(host);
    expect(enter.mock.calls).toEqual([[{ screen: 'profile' }]]);
    host.navigate({ screen: 'settings' });
    expect(page.location.pathname).toBe('/play/settings');
    history.back();
    expect(enter.mock.calls).toEqual([[{ screen: 'profile' }], [{ screen: 'settings' }], [{ screen: 'profile' }]]);
    expect(page.location.href).toBe('https://kingdown.test/play/profile?code=private#private');
    expect(history.replaceState.mock.calls).toEqual([[null, '', '/play/profile?code=private#private']]);
    expect(history.pushState).toHaveBeenCalledTimes(1);
  });

  it('pushes each in-page route once and emits Back and Forward without a new push', () => {
    const { page, history, records } = browser();
    const host = createWebPageHost('user-a'), { enter } = mount(host);
    host.navigate({ screen: 'profile' }); host.navigate({ screen: 'settings' }); host.navigate({ screen: 'game', gameId });
    expect(history.pushState.mock.calls).toEqual([[null, '', '/play/profile'], [null, '', '/play/settings'], [null, '', `/g/${gameId}`]]);
    expect(page.location.pathname).toBe(`/g/${gameId}`);
    history.back(); history.back(); history.forward();
    expect(enter.mock.calls.map(([route]) => route)).toEqual([{ screen: 'play' }, { screen: 'profile' }, { screen: 'settings' }, { screen: 'game', gameId }, { screen: 'settings' }, { screen: 'profile' }, { screen: 'settings' }]);
    expect(history.pushState).toHaveBeenCalledTimes(3); expect(records.get(key)).toBe('{"screen":"settings"}');
  });

  it('emits a cached-page return once and keeps the following popstate from emitting it again', () => {
    const { page, history } = browser(`/g/${gameId}`);
    const { enter, close } = mount(createWebPageHost('user-a'));
    page.dispatchEvent(transition('pagehide', true)); page.dispatchEvent(transition('pagehide', true));
    expect(close).toHaveBeenCalledTimes(1);
    page.dispatchEvent(transition('pageshow', true)); page.dispatchEvent(transition('pageshow', true)); page.dispatchEvent(new Event('popstate'));
    expect(enter.mock.calls).toEqual([[{ screen: 'game', gameId }], [{ screen: 'game', gameId }]]);
    expect(history.pushState).not.toHaveBeenCalled();
  });

  it('keeps route records separate by user and leaves unrelated storage bytes intact', () => {
    const { records, local, localStorage } = browser('/account-entry');
    records.set('kingdown.account-page.user-b', JSON.stringify({ screen: 'game', gameId })); records.set('other-session-key', 'other bytes');
    const before = [...records], localBefore = [...local];
    const host = createWebPageHost('user-a'), { enter } = mount(host);
    expect(enter.mock.calls).toEqual([[{ screen: 'play' }]]);
    host.navigate({ screen: 'settings' });
    for (const [name, bytes] of before) expect(records.get(name)).toBe(bytes);
    expect([...local]).toEqual(localBefore);
    for (const call of Object.values(localStorage)) expect(call).not.toHaveBeenCalled();
  });

  it('keeps routes in memory when storage reads and writes fail', () => {
    const { page } = browser('/account-entry');
    page.sessionStorage.getItem.mockImplementation(() => { throw new Error('denied'); });
    page.sessionStorage.setItem.mockImplementation(() => { throw new Error('quota'); });
    const host = createWebPageHost('user-a'), { enter, dispose } = mount(host);
    expect(enter.mock.calls).toEqual([[{ screen: 'play' }]]);
    host.navigate({ screen: 'profile' }); expect(enter).toHaveBeenLastCalledWith({ screen: 'profile' });
    expect(host.save({ screen: 'settings' })).toBe(false); dispose();
    page.location = new URL('/account-entry', page.location);
    expect(mount(host).enter.mock.calls).toEqual([[{ screen: 'settings' }]]);
  });

  it('handles a denied storage getter and saves only a copy of the route fields', () => {
    const { page, records } = browser();
    const host = createWebPageHost('user-a');
    const route = { screen: 'game' as const, gameId, token: 'private', draft: 'private', receipt: 'private' };
    expect(host.save(route)).toBe(true); route.gameId = 'changed';
    expect(records.get(key)).toBe(JSON.stringify({ screen: 'game', gameId }));
    Object.defineProperty(page, 'sessionStorage', { configurable: true, get() { throw new Error('denied'); } });
    expect(() => mount(host)).not.toThrow(); expect(host.save({ screen: 'profile' })).toBe(false);
    expect(() => host.navigate({ screen: 'settings' })).not.toThrow();
  });

  it('removes its listeners on dispose and rejects late lifecycle callbacks', () => {
    const { page, doc } = browser('/play/', true);
    const windowAdd = vi.spyOn(page, 'addEventListener'), windowRemove = vi.spyOn(page, 'removeEventListener');
    const documentAdd = vi.spyOn(doc, 'addEventListener'), documentRemove = vi.spyOn(doc, 'removeEventListener');
    const { enter, close, dispose } = mount(createWebPageHost('user-a'));
    dispose(); dispose(); page.location = new URL('/play/profile', page.location);
    for (const [type, callback] of [...windowAdd.mock.calls, ...documentAdd.mock.calls]) (callback as EventListener)(transition(type, true));
    expect(enter).not.toHaveBeenCalled(); expect(close).not.toHaveBeenCalled();
    for (const [type, callback] of windowAdd.mock.calls) expect(windowRemove).toHaveBeenCalledWith(type, callback);
    for (const [type, callback] of documentAdd.mock.calls) expect(documentRemove).toHaveBeenCalledWith(type, callback);
  });

  it('closes a departing page once and removes its return listener', () => {
    const { page } = browser(); const { enter, close } = mount(createWebPageHost('user-a'));
    page.dispatchEvent(transition('pagehide')); page.dispatchEvent(transition('pagehide'));
    page.location = new URL('/play/profile', page.location);
    page.dispatchEvent(transition('pageshow', true)); page.dispatchEvent(new Event('popstate'));
    expect(close).toHaveBeenCalledTimes(1); expect(enter).toHaveBeenCalledTimes(1);
  });

  it('lets close dispose a cached flow before any late return', () => {
    const { page } = browser(); let dispose = () => {};
    const host = createWebPageHost('user-a'), close = vi.fn(() => dispose()), mounted = mount(host, undefined, close);
    dispose = mounted.dispose;
    page.dispatchEvent(transition('pagehide', true)); page.dispatchEvent(transition('pageshow', true));
    expect(close).toHaveBeenCalledTimes(1); expect(mounted.enter).toHaveBeenCalledTimes(1);
  });

  it('replaces the old subscription without letting its cleanup stop the new one', () => {
    const { page } = browser(); const host = createWebPageHost('user-a');
    const first = mount(host), second = mount(host); first.dispose();
    host.navigate({ screen: 'profile' }); page.dispatchEvent(new Event('popstate'));
    expect(first.enter.mock.calls).toEqual([[{ screen: 'play' }]]);
    expect(second.enter.mock.calls).toEqual([[{ screen: 'play' }], [{ screen: 'profile' }]]);
  });

  it.each<[number, boolean, boolean]>([[0, false, false], [1, false, true], [0, true, true]])('reads touch and safe-area values without leaving a DOM node: %s, %s', (points, coarse, touch) => {
    const { page, doc, probe } = browser(); vi.stubGlobal('navigator', { maxTouchPoints: points }); page.matchMedia.mockReturnValue({ matches: coarse });
    expect(createWebPageHost('user-a').viewport()).toEqual({ touch, safe: { top: 20, right: 0, bottom: 12.5, left: 0 } });
    expect(doc.documentElement.append).toHaveBeenCalledWith(probe); expect(probe.style.cssText).toContain('env(safe-area-inset-top, 0px)'); expect(probe.remove).toHaveBeenCalledTimes(1);
  });

  it('removes the safe-area probe if style measurement fails', () => {
    const { page, probe } = browser(); page.getComputedStyle.mockImplementation(() => { throw new Error('style failed'); });
    expect(() => createWebPageHost('user-a').viewport()).toThrow('style failed'); expect(probe.remove).toHaveBeenCalledTimes(1);
  });
});
