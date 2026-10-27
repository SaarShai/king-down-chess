import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DEFAULT_OPTIONS } from '../../match/setup';
import type { JoinPreview, View } from '../../match/protocol';

const runtime = vi.hoisted(() => ({
  motionResult: vi.fn(), closed: false, call: vi.fn(), send: vi.fn(), clientCall: vi.fn(), showNewGame: vi.fn(), navigate: vi.fn(), renderRows: vi.fn(), routeView: vi.fn(),
  client: { state: { screen: 'wait', sheet: undefined as string | undefined, pending: undefined }, save: vi.fn() },
  memory: { view: undefined as View | undefined, games: [] as any[], settings: undefined as any, me: undefined,
    code: '', preview: undefined as JoinPreview | undefined, joinError: undefined },
  board: { ready: vi.fn(), setRules: vi.fn(), sync: vi.fn(), flip: vi.fn(), setPreview: vi.fn(), screenOf: () => ({ x: 0, y: 0 }), onSquareClick: () => {}, onDragSelect: () => {}, onSquareHover: () => {} },
}));
vi.mock('../../account-game/runtime', () => ({
  call: runtime.call, send: runtime.send, client: { ...runtime.client, call: runtime.clientCall }, memory: runtime.memory,
  queue: { closed: () => runtime.closed, current: () => !runtime.closed },
  navigate: runtime.navigate, renderGameRows: runtime.renderRows, routeView: runtime.routeView,
  gameActionsBlocked: () => false, pollUpdate() {}, start: vi.fn(), showNewGame: runtime.showNewGame, actions() {},
  store: { page: () => ({ screen: runtime.client.state.screen, connected: true, mounting: false, writing: false }) },
}));
vi.mock('../../ui/motion', () => ({ UiMotion: class { cancel() {} dispose() {} }, revealResult: runtime.motionResult }));
vi.mock('../../account-game/art', () => ({ art: (path: string) => path }));
vi.mock('../board-view', () => ({ board: runtime.board, highlight() {} }));
vi.mock('./board', () => ({ boardGame: () => runtime.memory.view, closeBoardSheet() {}, sendBoardCommand() {}, skipBoardCeremony() {} }));
vi.mock('./board-actions', () => ({ playerBlockButton: () => [] }));

const listeners = new Map<string, Set<EventListener>>();
const observers: { disconnect: ReturnType<typeof vi.fn> }[] = [];
const nodes = new Map<string, any>();
let removed = false;
function node(): any {
  return { dataset: {}, style: {}, innerHTML: '', textContent: '', disabled: false, hidden: false, open: false,
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} }, getAttribute: () => null,
    setAttribute() {}, removeAttribute() {}, addEventListener() {}, removeEventListener() {}, append() {}, prepend() {}, replaceChildren() {}, replaceWith() {}, remove() {}, insertBefore() {},
    show() { this.open = true; }, close() { this.open = false; }, focus: vi.fn(),
    querySelector: () => node(), querySelectorAll: () => [], getBoundingClientRect: () => ({ left: 0, top: 0, width: 960 }),
    firstElementChild: { style: {} }, childElementCount: 1,
  };
}
function lookup(id: string) {
  if (removed) throw new Error('Account DOM was removed');
  if (!nodes.has(id)) nodes.set(id, node());
  return nodes.get(id);
}
beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers(); vi.clearAllMocks();
  runtime.send.mockReset().mockImplementation(async (name: string, args: Record<string, unknown>) => ({ status: 'done', result: await runtime.clientCall(name, args) }));
  runtime.closed = false; runtime.client.state.screen = 'wait'; runtime.client.state.sheet = undefined;
  runtime.memory.view = undefined; runtime.memory.games = []; runtime.memory.settings = undefined;
  runtime.memory.code = ''; runtime.memory.preview = undefined; runtime.memory.joinError = undefined;
  runtime.board.ready.mockReturnValue(new Promise(() => {}));
  listeners.clear(); observers.length = 0; nodes.clear(); removed = false;
  lookup('friend-new').textContent = 'Make a new code';
  const add = (name: string, fn: EventListener, options?: AddEventListenerOptions) => {
    const bucket = listeners.get(name) ?? new Set(); bucket.add(fn); listeners.set(name, bucket);
    options?.signal?.addEventListener('abort', () => bucket.delete(fn), { once: true });
  };
  const remove = (name: string, fn: EventListener) => listeners.get(name)?.delete(fn);
  vi.stubGlobal('addEventListener', add); vi.stubGlobal('parent', {});
  vi.stubGlobal('document', { getElementById: lookup, createElement: node, querySelectorAll: () => [],
    querySelector: (selector: string) => selector.startsWith('#seat-screen') ? null : lookup(selector),
    addEventListener: add, removeEventListener: remove, activeElement: null, body: node() });
  vi.stubGlobal('MutationObserver', class { disconnect = vi.fn(); constructor() { observers.push(this); } observe() {} });
  vi.stubGlobal('ResizeObserver', class { disconnect = vi.fn(); constructor() { observers.push(this); } observe() {} });
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => setTimeout(fn, 16));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('stops registered screen work once and removes the shared page listeners', async () => {
  const { onStop, stopAll } = await import('./friend'), stop = vi.fn();
  onStop(stop); expect(listeners.get('pagehide')?.size).toBe(1); expect(listeners.get('message')?.size).toBe(1);
  stopAll(); stopAll();
  expect(stop).toHaveBeenCalledOnce(); expect(listeners.get('pagehide')?.size).toBe(0); expect(listeners.get('message')?.size).toBe(0);
});

it.each(['', 'ABC234'])('joins a preview with code "%s" through its available key', async code => {
  const { joinScreen } = await import('./join'), invite_id = 'a'.repeat(64);
  runtime.client.state.screen = 'join'; runtime.memory.code = code;
  runtime.memory.preview = { code, invite_id, options: null, colour: 'black', kind: 'friend', creator: { handle: 'rowan', icon: null }, expires_at: 'soon' };
  runtime.send.mockResolvedValueOnce({ status: 'done', result: { content: [] }, view: { game_id: 'joined' } });
  joinScreen();
  expect(lookup('join-confirm').hidden).toBe(false);
  lookup('join-confirm').onclick(); await vi.advanceTimersByTimeAsync(0);
  expect(runtime.send).toHaveBeenCalledExactlyOnceWith('kingdown_join', code ? { code } : { invite_id });
  expect(runtime.routeView).toHaveBeenCalledWith({ game_id: 'joined' });
  expect(runtime.memory.preview).toBeUndefined();
});

it('stops the wait clock and observer before the account DOM is removed', async () => {
  const wait = await import('./wait'), { stopAll } = await import('./friend');
  runtime.memory.view = { game_id: 'waiting', kind: 'random', status: 'waiting', created_at: new Date().toISOString(), server_now: new Date().toISOString() } as View;
  wait.waitScreen(); expect(vi.getTimerCount()).toBe(1); expect(wait.waitPoll()).toBeDefined();
  runtime.closed = true; stopAll(); removed = true;
  expect(observers[0].disconnect).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
  await vi.advanceTimersByTimeAsync(2000);
  expect(() => wait.waitScreen()).not.toThrow(); expect(() => wait.waitSync()).not.toThrow(); expect(wait.waitPoll()).toBeUndefined();
});

it.each(['friend', 'solo'])('ignores a %s end poll that returns after close and DOM removal', async kind => {
  const end = await import('./end'), { stopAll } = await import('./friend');
  runtime.client.state.screen = 'end';
  runtime.memory.view = { game_id: 'ended', revision: 4, kind, status: 'finished', opponent: { deleted: false } } as View;
  let release!: () => void; runtime.call.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; }));
  const reading = end.endPoll()!.read();
  runtime.closed = true; stopAll(); removed = true; release();
  await expect(reading).resolves.toBeUndefined();
  expect(() => end.updateEnd()).not.toThrow(); expect(() => end.endScreen()).not.toThrow(); expect(end.endPoll()).toBeUndefined();
});

it('opens the same accepted rematch after a newer selection cancels its first opening', async () => {
  const end = await import('./end');
  runtime.client.state.screen = 'end';
  runtime.memory.view = { game_id: 'ended', status: 'finished', kind: 'solo', rematch_game_id: 'next', rules: {} } as View;
  runtime.call.mockResolvedValue(undefined);
  runtime.send.mockResolvedValue({ status: 'superseded' });
  end.updateEnd(); await vi.advanceTimersByTimeAsync(0);
  expect(runtime.routeView).not.toHaveBeenCalled();
  end.updateEnd(); await vi.advanceTimersByTimeAsync(0);
  const selections = [...runtime.call.mock.calls, ...runtime.send.mock.calls].filter(([name]) => name === 'kingdown_resume');
  expect(selections.map(([, args]) => args)).toEqual([{ game_id: 'next' }, { game_id: 'next' }]);
});

it.each(['failed', 'refused', 'done'])('does not repeat a rematch opening after %s', async status => {
  const end = await import('./end');
  runtime.client.state.screen = 'end';
  runtime.memory.view = { game_id: 'ended', status: 'finished', kind: 'solo', rematch_game_id: 'next', rules: {} } as View;
  const next = { game_id: 'next', status: 'playing' } as View;
  runtime.call.mockResolvedValue(status === 'done' ? next : undefined);
  runtime.send.mockResolvedValue({ status, result: { content: [] }, ...(status === 'done' && { view: next }) });
  end.updateEnd(); await vi.advanceTimersByTimeAsync(0);
  end.updateEnd(); await vi.advanceTimersByTimeAsync(0);
  const selections = [...runtime.call.mock.calls, ...runtime.send.mock.calls].filter(([name]) => name === 'kingdown_resume');
  expect(selections).toHaveLength(1);
  expect(runtime.routeView).toHaveBeenCalledTimes(status === 'done' ? 1 : 0);
});

it('releases the seat observer and pending artwork callback before DOM removal', async () => {
  const seat = await import('./seat'), { stopAll } = await import('./friend');
  runtime.client.state.screen = 'seat';
  runtime.memory.view = { game_id: 'seat', status: 'setup', seat: 0, draw: 'RNBQKBNR', options: { ...DEFAULT_OPTIONS, arrangement: false }, ready: [false, false], choices: [{ order: 'RNBQKBNR', king: null }, null] } as View;
  let loaded!: () => void; runtime.board.ready.mockReturnValueOnce(new Promise<void>(resolve => { loaded = resolve; }));
  lookup('board').parentElement = lookup('game-table');
  seat.seatScreen(); expect(runtime.board.ready).toHaveBeenCalledOnce();
  runtime.closed = true; stopAll(); removed = true; loaded();
  await vi.advanceTimersByTimeAsync(20);
  expect(observers[0].disconnect).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
  expect(() => seat.seatScreen()).not.toThrow();
});

it('closes the setup king sheet and releases its document listener on stop', async () => {
  const setup = await import('./setup'), { stopAll } = await import('./friend');
  const picking = setup.kingSheet({ ...DEFAULT_OPTIONS, kingPowers: true }, { king: 'Spirit', power: 'Mercy' });
  expect(listeners.get('keydown')?.size).toBe(1);
  const saves = runtime.client.save.mock.calls.length;
  runtime.closed = true; stopAll(); removed = true;
  await expect(picking).resolves.toEqual({ king: 'Spirit', power: 'Mercy' });
  expect(runtime.client.state.sheet).toBe('king');
  expect(runtime.client.save).toHaveBeenCalledTimes(saves);
  expect(listeners.get('keydown')?.size).toBe(0);
});


it.each([false, true])('ignores a pending friend invite after stop (failure: %s)', async failed => {
  const friend = await import('./friend');
  runtime.client.state.screen = 'friend';
  runtime.memory.view = { game_id: 'friend', kind: 'friend', status: 'waiting' } as View;
  let resolve!: (value: unknown) => void, reject!: (error: Error) => void;
  runtime.clientCall.mockReturnValueOnce(new Promise((yes, no) => { resolve = yes; reject = no; }));
  friend.friendScreen(); lookup('friend-new').onclick(); expect(runtime.clientCall).toHaveBeenCalledOnce();
  runtime.closed = true; friend.stopAll(); removed = true;
  if (failed) reject(new Error('Invite failed')); else resolve({ content: [], structuredContent: { code: 'ABC123' } });
  await vi.advanceTimersByTimeAsync(0);
  expect(runtime.renderRows).not.toHaveBeenCalled();
});

it('offers New game for an expired friend code without renewal', async () => {
  const friend = await import('./friend'), { friendInvites } = await import('../invite');
  runtime.client.state.screen = 'friend';
  runtime.memory.view = { game_id: 'friend', kind: 'friend', status: 'waiting' } as View;
  friendInvites.set('friend', { code: 'ABC234', expires_at: new Date(Date.now() - 1).toISOString() });
  friend.friendScreen();
  expect(lookup('friend-code').hidden).toBe(true);
  expect(lookup('friend-actions').hidden).toBe(true);
  expect(lookup('friend-new').hidden).toBe(false);
  expect(lookup('friend-new').textContent).toBe('New game');
  lookup('friend-new').onclick();
  expect(runtime.showNewGame).toHaveBeenCalledOnce();
  expect(lookup('friend-help').textContent).toContain('expired');
  expect(runtime.clientCall).not.toHaveBeenCalled();
  expect(runtime.send).not.toHaveBeenCalled();
  friend.stopAll();
});

it.each([{ left: false, replaced: false }, { left: true, replaced: false }, { left: false, replaced: true }])('expires a friend code without navigation (left: $left, replaced: $replaced)', async ({ left, replaced }) => {
  const friend = await import('./friend'), { friendInvites } = await import('../invite');
  runtime.client.state.screen = 'friend';
  runtime.memory.view = { game_id: 'friend', kind: 'friend', status: 'waiting' } as View;
  friendInvites.set('friend', { code: 'ABC234', replaced, expires_at: new Date(Date.now() + 1000).toISOString() });
  friend.friendScreen(); friend.friendScreen();
  expect(lookup('friend-actions').hidden).toBe(replaced);
  if (left) { runtime.client.state.screen = 'play'; lookup('friend-help').textContent = 'Untouched'; }
  await vi.advanceTimersByTimeAsync(1000);
  expect(runtime.clientCall).not.toHaveBeenCalled();
  expect(runtime.renderRows).toHaveBeenCalledOnce();
  if (left) expect(lookup('friend-help').textContent).toBe('Untouched');
  else { expect(lookup('friend-actions').hidden).toBe(true); expect(lookup('friend-new').hidden).toBe(false); expect(lookup('friend-new').textContent).toBe('New game'); }
  expect(vi.getTimerCount()).toBe(0);
});

it.each([false, true])('offers New game when code renewal is unavailable (cached: %s)', async cached => {
  const friend = await import('./friend'), { friendInvites } = await import('../invite');
  runtime.client.state.screen = 'friend';
  runtime.memory.view = { game_id: 'friend', kind: 'friend', status: 'waiting' } as View;
  if (cached) friendInvites.set('friend', { code: 'ABC234', replaced: true, expires_at: new Date(Date.now() + 7000).toISOString() });
  runtime.send.mockResolvedValue({ status: 'refused', code: 'INVITE_UNAVAILABLE', text: 'This invitation is not available.' });
  friend.friendScreen();
  expect(lookup('friend-new').textContent).toBe('Make a new code');
  lookup('friend-new').onclick(); await vi.advanceTimersByTimeAsync(0);
  expect(lookup('friend-new').textContent).toBe('New game');
  expect(lookup('friend-help').textContent).toContain('expired');
  expect(lookup('friend-code').hidden).toBe(true); expect(lookup('friend-actions').hidden).toBe(true);
  lookup('friend-new').onclick();
  expect(runtime.showNewGame).toHaveBeenCalledOnce(); expect(runtime.send).toHaveBeenCalledOnce();
  friend.friendScreen();
  expect(lookup('friend-new').textContent).toBe('New game');
});

it('clears the invite expiry timer before the account DOM is removed', async () => {
  const friend = await import('./friend'), { friendInvites } = await import('../invite');
  runtime.client.state.screen = 'friend';
  runtime.memory.view = { game_id: 'friend', kind: 'friend', status: 'waiting' } as View;
  friendInvites.set('friend', { code: 'ABC234', expires_at: new Date(Date.now() + 1000).toISOString() });
  friend.friendScreen(); expect(vi.getTimerCount()).toBe(1);
  runtime.closed = true; friend.stopAll(); removed = true;
  expect(vi.getTimerCount()).toBe(0);
  await vi.advanceTimersByTimeAsync(1000);
  expect(runtime.renderRows).not.toHaveBeenCalled();
});


it('explains a replaced code and keeps renewal explicit', async () => {
  const friend = await import('./friend'), { friendInvites, syncFriendInvites } = await import('../invite');
  runtime.client.state.screen = 'friend';
  runtime.memory.view = { game_id: 'friend', kind: 'friend', status: 'waiting' } as View;
  friendInvites.set('friend', { code: 'ABC234', invite_id: 'old', expires_at: new Date(Date.now() + 7000).toISOString() });
  syncFriendInvites([{ game_id: 'friend', invite_id: 'new' }]);
  friend.friendScreen();
  expect(lookup('friend-code').hidden).toBe(true); expect(lookup('friend-actions').hidden).toBe(true);
  expect(lookup('friend-new').hidden).toBe(false); expect(lookup('friend-help').textContent).toContain('replaced');
  expect(runtime.clientCall).not.toHaveBeenCalled();
  friend.stopAll();
});

it('keeps a live result through the board unlock, plays it once and cancels it on navigation', async () => {
  const end = await import('./end');
  document.querySelector = ((selector: string) => selector.includes('[open]') ? null : lookup(selector)) as typeof document.querySelector;
  const result = (game_id: string) => ({ game_id, revision: 4, kind: 'solo', status: 'finished', seat: 0, turn: 1, result: { reason: 'checkmate', winner: 0 }, rules: {} }) as View;
  runtime.client.state.screen = 'end'; runtime.memory.view = result('old');
  end.endScreen(false); await vi.advanceTimersByTimeAsync(20);
  lookup('over').classList.contains = () => true;
  runtime.client.state.screen = 'board'; runtime.memory.view = result('live');
  end.endSync({screen:'board', connected:true, mounting:false, writing:true});
  end.guardEndTaps('live'); lookup('reload').disabled = true;
  end.endSync({screen:'board', connected:true, mounting:false, writing:false});
  runtime.client.state.screen = 'end';
  end.endScreen(false); await vi.advanceTimersByTimeAsync(20);
  expect(runtime.motionResult).toHaveBeenCalledTimes(1);
  expect(runtime.motionResult.mock.calls[0][2]).toBe('victory');
  end.endScreen(false); await vi.advanceTimersByTimeAsync(20);
  expect(runtime.motionResult).toHaveBeenCalledTimes(1);
  end.guardEndTaps('live');
  runtime.client.state.screen = 'profile'; end.endSync({screen:'profile', connected:true, mounting:false, writing:false});
  runtime.client.state.screen = 'end'; end.endScreen(false); await vi.advanceTimersByTimeAsync(20);
  expect(runtime.motionResult).toHaveBeenCalledTimes(1);
});
