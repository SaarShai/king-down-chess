import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { InboxEntry, View } from '../match/protocol';
import { GameReadError, type GameClient, type PageHost, type ReadRoute } from './client';
import { acceptedView, createHall, createHallMemory } from './hall';
import { createStore, type Page } from './state';
import { createWebPageHost } from '../online/page-host';

const rows = vi.hoisted(() => vi.fn());
vi.mock('./games-list', () => ({ gamesList: rows }));
const cleanups: (() => void)[] = [];
afterEach(() => { for (const stop of cleanups.splice(0)) stop(); vi.unstubAllGlobals(); rows.mockClear(); });
function node() {
  return Object.assign(new EventTarget(), { id: '', className: '', dataset: {}, innerHTML: '', textContent: '', hidden: false,
    append: vi.fn(), replaceChildren: vi.fn(), setAttribute() {}, querySelector: () => node(), onclick: null });
}
beforeEach(() => {
  const nodes = new Map<string, ReturnType<typeof node>>();
  vi.stubGlobal('document', { body: node(), querySelector: () => null, querySelectorAll: () => [], createElement: node, createTextNode: (text: string) => text,
    getElementById: (id: string) => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); } });
  vi.stubGlobal('window', new EventTarget());
});
const entries = (count: number) => Array.from({ length: count }, (_, i) => ({ game_id: `game-${i}`, action: i ? 'waiting' : 'ready' })) as InboxEntry[];
function mount(client: GameClient = { games: vi.fn(async () => []), game: vi.fn() }, webHost?: PageHost) {
  const page: Page = { screen: 'play', connected: true, mounting: false, writing: false };
  let enter!: (route: ReadRoute) => void, close!: () => void;
  const stop = vi.fn(), host: PageHost = { start: (onRoute, onClose) => { enter = onRoute; close = onClose; return stop; }, navigate: vi.fn(route => enter(route)), save: vi.fn(() => true), viewport: vi.fn() };
  const store = createStore({ page: () => page, call: vi.fn() }), memory = createHallMemory(), onView = vi.fn();
  const hall = createHall(memory, client, webHost ?? host, store, onView); cleanups.push(hall.dispose);
  return { ...hall, enter: (route: ReadRoute) => enter(route), close: () => close(), stop, memory, store, page, onView, host };
}
const settle = () => new Promise<void>(resolve => queueMicrotask(resolve));

it.each(['play', 'game'] as const)('resumes the real web host after a cached %s page returns', async screen => {
  Object.assign(window, { location: new URL(screen === 'play' ? 'https://kingdown.test/play/' : 'https://kingdown.test/g/game-0'), sessionStorage: { setItem: vi.fn() } });
  Object.assign(document, { readyState: 'complete', removeEventListener: vi.fn() });
  const games = vi.fn<GameClient['games']>().mockResolvedValue(entries(1));
  const view = { game_id: 'game-0', revision: 1 } as View;
  const game = vi.fn<GameClient['game']>().mockResolvedValue(view);
  const h = mount({ games, game }, createWebPageHost('user-a')); await settle();
  if (screen === 'play') expect(h.memory.games).toHaveLength(1); else expect(h.onView).toHaveBeenCalledWith(view);
  const read = screen === 'play' ? games : game;
  let release!: (value: any) => void;
  if (screen === 'play') games.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  else game.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  const hide = () => window.dispatchEvent(Object.assign(new Event('pagehide'), { persisted: true }));
  const show = () => window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
  hide(); expect(h.memory.games).toEqual([]); expect(h.memory.dirty).toBe(true);
  show(); expect(read).toHaveBeenCalledTimes(2);
  const signal = screen === 'play' ? games.mock.calls[1][0] : game.mock.calls[1][1];
  hide(); expect(signal?.aborted).toBe(true);
  release(screen === 'play' ? entries(3) : { ...view, revision: 9 }); await settle();
  expect(h.memory.games).toEqual([]); expect(h.onView).toHaveBeenCalledTimes(screen === 'play' ? 0 : 1);
  show(); await settle(); expect(read).toHaveBeenCalledTimes(3);
  if (screen === 'play') expect(h.memory.games).toHaveLength(1); else expect(h.onView).toHaveBeenCalledTimes(2);
  h.dispose(); hide(); show(); expect(read).toHaveBeenCalledTimes(3);
});

it.each([0, 1, 30])('renders one shared memory with %s games in server order', async count => {
  let release!: (entries: InboxEntry[]) => void;
  const h = mount({ games: () => new Promise(resolve => { release = resolve; }), game: vi.fn() });
  const read = h.refresh(); expect(document.getElementById('games-status')!.textContent).toBe('Loading games…');
  const games = entries(count); release(games); expect(await read).toBe(true);
  expect(h.memory.games).toBe(games); expect(h.memory.dirty).toBe(false);
  expect(document.getElementById('games-empty')!.hidden).toBe(count > 0);
  expect(document.getElementById('games-status')!.textContent).toBe('');
  expect(rows.mock.calls.at(-1)![1]).toBe(games);
  expect(document.getElementById('new-game')!.innerHTML).not.toMatch(/games-start|hall-play|setup-start/);
});
it.each(['success', 'error'] as const)('keeps the newer list after an older %s', async result => {
  let resolve!: (games: InboxEntry[]) => void, reject!: (error: Error) => void;
  const games = vi.fn().mockImplementationOnce(() => new Promise((yes, no) => { resolve = yes; reject = no; })).mockResolvedValue(entries(2));
  const h = mount({ games, game: vi.fn() }); const older = h.refresh(); expect(await h.refresh()).toBe(true);
  if (result === 'success') resolve(entries(1)); else reject(new Error('Old failure'));
  expect(await older).toBe(false); expect(h.memory.games).toHaveLength(2); expect(h.store.page().notice).toBeUndefined();
});
it.each(['route', 'signal', 'dispose', 'accept'] as const)('does not accept a held list after %s', async stop => {
  let release!: (games: InboxEntry[]) => void;
  const games = vi.fn((_signal?: AbortSignal) => new Promise<InboxEntry[]>(resolve => { release = resolve; }));
  const h = mount({ games, game: vi.fn() }), abort = new AbortController(), read = h.refresh(abort.signal);
  if (stop === 'route') h.enter({ screen: 'profile' });
  else if (stop === 'signal') abort.abort();
  else if (stop === 'dispose') h.dispose();
  else h.acceptGames(entries(2));
  release(entries(1)); expect(await read).toBe(false);
  expect(h.memory.games).toHaveLength(stop === 'accept' ? 2 : 0);
  expect(games.mock.calls[0][0]?.aborted).toBe(true);
});
it.each(['route', 'dispose', 'close'] as const)('does not show an old selected game or its error after %s', async stop => {
  for (const fails of [false, true]) {
    let resolve!: (view: View) => void, reject!: (error: Error) => void;
    const h = mount({ games: vi.fn(), game: () => new Promise((yes, no) => { resolve = yes; reject = no; }) });
    h.enter({ screen: 'game', gameId: 'game-0' });
    if (stop === 'route') h.enter({ screen: 'profile' }); else if (stop === 'close') h.close(); else h.dispose();
    if (fails) reject(new Error('Old error')); else resolve({ game_id: 'game-0', revision: 1 } as View);
    await settle(); expect(h.onView).not.toHaveBeenCalled(); expect(h.store.page().notice).toBeUndefined();
  }
});
it.each(['NOT_FOUND', 'FORBIDDEN', 'UNAVAILABLE'])('keeps Retry and navigation usable after %s', async code => {
  const game = vi.fn().mockRejectedValueOnce(new GameReadError(code, 'Read failed')).mockResolvedValue({ game_id: 'game-0', revision: 1 });
  const h = mount({ games: vi.fn(), game }); h.enter({ screen: 'game', gameId: 'game-0' }); await settle();
  expect(h.store.page().notice).toMatchObject({ kind: 'read', text: 'Read failed' });
  document.getElementById('retry')!.dispatchEvent(new Event('click')); await settle();
  expect(game).toHaveBeenCalledTimes(2); expect(h.onView).toHaveBeenCalledTimes(1); expect(h.store.page().notice).toBeUndefined();
  h.host.navigate({ screen: 'profile' }); expect(h.host.save).toHaveBeenLastCalledWith({ screen: 'profile' });
});
it('does not replace a refusal or settle a pending receipt after a good list read', async () => {
  const h = mount(); h.page.pending = { name: 'kingdown_move', args: { command_id: 'same' }, error: 'Lost' };
  h.store.dispatch({ type: 'refusal', text: 'Refused', code: 'INVALID_MOVE' }); const pending = h.page.pending;
  await h.refresh(); expect(h.store.page().notice).toMatchObject({ kind: 'refusal', code: 'INVALID_MOVE' }); expect(h.page.pending).toBe(pending);
  h.store.dispatch({ type: 'failed-read', text: 'Old read' }); await h.refresh(); expect(h.store.page().notice).toBeUndefined();
});
it('treats an aborted read as silent and clears only the hall on dispose', async () => {
  const h = mount({ games: vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError')), game: vi.fn() });
  await h.refresh(); expect(h.store.page().notice).toBeUndefined();
  h.acceptGames(entries(1)); h.page.pending = { name: 'kingdown_move', args: { command_id: 'same' } };
  const pending = h.page.pending; h.dispose(); h.dispose();
  h.acceptGames(entries(2)); h.enter({ screen: 'game', gameId: 'late' });
  expect(h.memory.games).toEqual([]); expect(h.page.pending).toBe(pending); expect(h.stop).toHaveBeenCalledTimes(1);
  expect(h.onView).not.toHaveBeenCalled(); expect(await h.refresh()).toBe(false);
});
it('keeps full equal-revision display fields and only the same game rules', () => {
  const before = { game_id: 'one', revision: 3, rules: { kings: [] }, server_now: 'old' } as unknown as View;
  const next = { game_id: 'one', revision: 3, server_now: 'new', rematch_allowed: true } as View;
  expect(acceptedView(before, { ...next, revision: 2 })).toBeUndefined();
  expect(acceptedView(before, next)).toEqual({ ...next, rules: before.rules });
  const other = { ...next, game_id: 'two' }; expect(acceptedView(before, other)).toBe(other);
  const full = { ...next, rules: {} } as View; expect(acceptedView(before, full)).toBe(full);
});
it('rejects a lower revision or a foreign selected view', async () => {
  const game = vi.fn().mockResolvedValueOnce({ game_id: 'game-0', revision: 1 }).mockResolvedValueOnce({ game_id: 'foreign', revision: 3 });
  const h = mount({ games: vi.fn(), game }); h.page.view = { game_id: 'game-0', revision: 2 } as View;
  h.enter({ screen: 'game', gameId: 'game-0' }); await settle(); expect(h.onView).not.toHaveBeenCalled();
  h.enter({ screen: 'game', gameId: 'game-0' }); await settle(); expect(h.onView).not.toHaveBeenCalled();
  expect(h.store.page().notice?.text).toContain('does not match');
});
it('keeps a command refusal when a list read fails', async () => {
  const h = mount({ games: vi.fn().mockRejectedValue(new Error('List failed')), game: vi.fn() });
  h.store.dispatch({ type: 'refusal', code: 'INVALID_MOVE', text: 'Move refused' });
  expect(await h.refresh()).toBe(false); expect(h.store.page().notice).toMatchObject({ kind: 'refusal', code: 'INVALID_MOVE' });
  expect(document.getElementById('games-status')!.textContent).toBe('List failed');
});
it('removes navigation, Retry and pointer listeners and stops detached row callbacks', () => {
  const add = vi.spyOn(window, 'addEventListener'), remove = vi.spyOn(window, 'removeEventListener'), create = vi.spyOn(document, 'createElement');
  const h = mount(); h.acceptGames(entries(1)); const open = rows.mock.calls.at(-1)![2];
  const buttons = create.mock.results.map(result => result.value).filter(el => el.className === 'menu-row');
  const navigate = buttons[0].onclick; h.dispose(); open('late'); navigate();
  expect(h.host.navigate).not.toHaveBeenCalled(); expect(buttons.every(button => button.onclick === null)).toBe(true);
  for (const args of add.mock.calls) expect(remove).toHaveBeenCalledWith(...args);
  vi.restoreAllMocks();
});

it('focuses a trusted account button before its click handler and removes the listener on dispose', () => {
  const add = vi.spyOn(window, 'addEventListener'), remove = vi.spyOn(window, 'removeEventListener');
  const h = mount();
  const registrations = add.mock.calls.filter(([name]) => name === 'click');
  expect(registrations).toHaveLength(1); expect(registrations[0][2]).toBe(true);
  const focus = registrations[0][1] as (event: unknown) => void;
  const button = { focus: vi.fn() }, outside = { focus: vi.fn() };
  Object.assign(document.getElementById('app-root')!, { contains: (el: unknown) => el === button });
  const target = { closest: vi.fn(() => button) };
  focus({ isTrusted: false, target }); expect(button.focus).not.toHaveBeenCalled();
  focus({ isTrusted: true, target: { closest: () => outside } }); expect(outside.focus).not.toHaveBeenCalled();
  focus({ isTrusted: true, target }); expect(target.closest).toHaveBeenCalledWith('button');
  expect(button.focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
  Object.assign(document, { activeElement: button }); focus({ isTrusted: true, target });
  expect(button.focus).toHaveBeenCalledTimes(1);
  h.dispose(); h.dispose();
  expect(remove.mock.calls.filter(([name]) => name === 'click')).toEqual(registrations);
  Object.assign(document, { activeElement: null }); focus({ isTrusted: true, target });
  expect(button.focus).toHaveBeenCalledTimes(1);
  const next = mount();
  const nextFocus = add.mock.calls.filter(([name]) => name === 'click').at(-1)![1] as (event: unknown) => void;
  nextFocus({ isTrusted: true, target }); expect(button.focus).toHaveBeenCalledTimes(2);
  next.dispose(); vi.restoreAllMocks();
});

it('reveals the full input label on focus and stops after dispose', () => {
  const add = vi.spyOn(window, 'addEventListener'), remove = vi.spyOn(window, 'removeEventListener');
  const h = mount(), registration = add.mock.calls.find(([name]) => name === 'focusin');
  expect(registration).toBeDefined();
  const reveal = registration![1] as (event: unknown) => void;
  const label = { scrollIntoView: vi.fn() }, outside = { scrollIntoView: vi.fn() };
  Object.assign(document.getElementById('app-root')!, { contains: (el: unknown) => el === label });
  const target = { closest: vi.fn(() => label), scrollIntoView: vi.fn() };
  reveal({ target }); expect(target.closest).toHaveBeenCalledWith('label');
  expect(label.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'nearest', inline: 'nearest' });
  expect(target.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'nearest', inline: 'nearest' });
  expect(label.scrollIntoView.mock.invocationCallOrder[0]).toBeLessThan(target.scrollIntoView.mock.invocationCallOrder[0]);
  reveal({ target: { closest: () => outside } }); expect(outside.scrollIntoView).not.toHaveBeenCalled();
  reveal({ target: null });
  const input = { closest: () => null, scrollIntoView: vi.fn() };
  Object.assign(document.getElementById('app-root')!, { contains: (el: unknown) => el === input });
  reveal({ target: input }); expect(input.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'nearest', inline: 'nearest' });
  h.dispose(); expect(remove).toHaveBeenCalledWith(...registration!);
  reveal({ target: input }); expect(input.scrollIntoView).toHaveBeenCalledTimes(1);
  expect(label.scrollIntoView).toHaveBeenCalledTimes(1);
  vi.restoreAllMocks();
});

it('keeps a focused button in view without moving its label', () => {
  const add = vi.spyOn(window, 'addEventListener'), h = mount();
  const reveal = add.mock.calls.find(([name]) => name === 'focusin')![1] as (event: unknown) => void;
  const label = { scrollIntoView: vi.fn() };
  const button = { tagName: 'BUTTON', closest: () => label, scrollIntoView: vi.fn() };
  Object.assign(document.getElementById('app-root')!, { contains: () => true });
  reveal({ target: button });
  expect(button.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'nearest', inline: 'nearest' });
  expect(label.scrollIntoView).not.toHaveBeenCalled();
  h.dispose(); vi.restoreAllMocks();
});
