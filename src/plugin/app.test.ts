import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { View } from '../match/protocol';
import { createRouter } from './router';

const transport = vi.hoisted(() => ({ call: vi.fn(), connect: vi.fn(), instance: undefined as any, target: undefined as any, draw: vi.fn(), disposeBoard: vi.fn(), rows: vi.fn(), mode: 'fullscreen' }));
vi.mock('@modelcontextprotocol/ext-apps', () => ({ App: class {
  constructor() { transport.instance = this; }
  connect = transport.connect;
  getHostContext = () => ({ displayMode: transport.mode });
  callServerTool = transport.call;
  sendSizeChanged = async () => {};
} }));
vi.mock('../account-game/art', () => ({ art: (path: string) => path }));
vi.mock('../account-game/games-list', () => ({ gamesList: transport.rows, gameTitle: () => 'Game', waitingLine: () => 'Waiting' }));
vi.mock('../account/profile', () => ({ ICONS: {}, handleProblem: () => undefined }));
vi.mock('./board-view', () => ({ setSettings: async () => {},  }));
vi.mock('../render/sfx', () => ({ setSound: () => {}, snd: {} }));
vi.mock('./poll', async importOriginal => ({ ...await importOriginal<typeof import('./poll')>(), runPoll: (target: unknown) => { transport.target = target; return { update() {}, stop() {} }; } }));
vi.mock('./screens/board', () => ({ boardScreen: () => Object.assign(transport.draw, { dispose: transport.disposeBoard }), rollbackBoardMove: async () => {} }));
vi.mock('./screens/join', () => ({ joinScreen() {}, joinSync() {} }));
vi.mock('./screens/lobby', () => ({ lobbyPoll() {}, lobbyScreen() {}, lobbySync() {} }));
vi.mock('./screens/seat', () => ({ finishSeat() {}, seatScreen() {}, seatSync() {} }));
vi.mock('./screens/end', () => ({ endPoll() {}, endSync() {}, endScreen() {} }));
vi.mock('./screens/profile', () => ({ profileScreen() {} }));
vi.mock('./screens/collection', () => ({ collectionScreen() {} }));
afterEach(() => { vi.unstubAllEnvs(); });

// The app uses the real client, queue, router and notice store. These nodes replace only the display.
function node() {
  return { dataset: {}, style: { setProperty() {} }, textContent: '', innerHTML: '', value: '', disabled: false, hidden: false, open: false,
    showModal() { this.open = true; }, close() { this.open = false; },
    querySelectorAll: () => [], querySelector: () => node(), closest: () => node(),
    addEventListener() {}, removeEventListener() {}, setCustomValidity() {}, setAttribute() {}, removeAttribute() {}, replaceChildren() {}, append() {}, matches: () => false, hasAttribute: () => false };
}
beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers();
  const nodes = new Map<string, ReturnType<typeof node>>();
  vi.stubGlobal('document', { body: node(), documentElement: node(), querySelector: () => null, querySelectorAll: () => [], createElement: node, createTextNode: (text: string) => text,
    getElementById: (id: string) => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); } });
  vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn(), openai: { setWidgetState() {} } });
  vi.stubGlobal('navigator', {});
  vi.stubGlobal('localStorage', { getItem: () => null });
  vi.stubGlobal('addEventListener', vi.fn());
  vi.stubGlobal('MutationObserver', class { observe() {} disconnect() {} });
  transport.mode = 'fullscreen'; transport.draw.mockClear(); transport.disposeBoard.mockClear(); transport.rows.mockClear();
  transport.target = undefined; transport.connect.mockReset().mockResolvedValue(undefined);
  transport.call.mockReset().mockResolvedValue({ content: [], _meta: { games: [] } });
});

const game = { game_id: 'game-a000', revision: 1, status: 'playing', kind: 'friend' } as View;
const settings = { symbols_only: false, show_threats: false, show_online: false, online_visible_to: 'nobody' as const, last_setup: null };
const receipt = () => ({ name: 'kingdown_move', args: { command_id: 'lost', expected_revision: 1, actions: ['e2-e4'] }, game_tag: 'game-a00', screen: 'board' as const, error: 'Lost reply' });
it.each(['resolve', 'reject'])('does not restart a closed board when connect later settles: %s', async outcome => {
  let resolve!: () => void, reject!: (error: Error) => void;
  transport.connect.mockReturnValue(new Promise<void>((yes, no) => { resolve = yes; reject = no; }));
  const app = await import('./app');
  await transport.instance.onteardown();
  if (outcome === 'resolve') resolve(); else reject(new Error('Late connection failure'));
  await vi.advanceTimersByTimeAsync(0);
  expect(transport.disposeBoard).toHaveBeenCalledOnce();
  expect(transport.target).toBeUndefined();
  expect(app.store.page().connected).toBe(false);
  expect(app.store.page().notice).toBeUndefined();
});
it('keeps SDK initialization rejection retryable when the SDK closes its transport', async () => {
  transport.connect.mockImplementation(async () => { await Promise.resolve(); transport.instance.onclose(); throw new Error('Rejected initialize'); });
  const app = await import('./app');
  await vi.advanceTimersByTimeAsync(0);
  expect(app.queue.closed()).toBe(false);
  expect(app.store.page().notice).toMatchObject({ kind: 'connect', text: 'Could not connect to the game: Rejected initialize' });
  expect(transport.disposeBoard).not.toHaveBeenCalled();
});
async function mounted() {
  const app = await import('./app');
  app.memory.settings = settings; app.memory.me = { handle: 'player', icon: 'spirit' };
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'home' }, _meta: { board_id: 'board-a' } });
  await vi.advanceTimersByTimeAsync(0);
  return app;
}

it.each(['normal', 'fast', 'off'])('A8: ignores the removed device animation choice %s', async pace => {
  vi.stubGlobal('localStorage', { getItem: () => pace });
  await mounted();
  const control = document.getElementById('animations') as HTMLSelectElement;
  expect(control.value).toBe('');
  expect(control.onchange).toBeUndefined();
});

const press = (id: string) => { const button = document.getElementById(id)!; return Reflect.apply(button.onclick!, button, [{}]); };

it.each(['home', 'play'])('enables Play after a chat result opens %s and settings arrive', async screen => {
  let release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_settings'
    ? new Promise(resolve => { release = resolve; }) : { content: [], _meta: { games: [] } });
  const app = await import('./app');
  transport.instance.ontoolresult({ content: [], structuredContent: { screen }, _meta: { board_id: 'board-a' } });
  await vi.advanceTimersByTimeAsync(0);
  for (const id of ['home-play', 'hall-play', 'setup-start']) expect((document.getElementById(id) as HTMLButtonElement).disabled).toBe(true);
  release({ content: [], _meta: { settings, me: { handle: 'player', icon: 'spirit' } } });
  await vi.advanceTimersByTimeAsync(0);
  expect(app.queue.mounting()).toBe(false);
  for (const id of ['home-play', 'hall-play', 'setup-start']) expect((document.getElementById(id) as HTMLButtonElement).disabled).toBe(false);
});

it('opens Settings from the Profile row and keeps the hall handlers', async () => {
  const settingsRow = Object.assign(node(), { dataset: { nav: 'settings' }, onclick: null as (() => void) | null });
  const hallRow = Object.assign(node(), { dataset: { nav: 'profile' }, onclick: vi.fn() });
  const hallClick = hallRow.onclick;
  vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) =>
    (selector === '[data-nav]' ? [settingsRow, hallRow] : []) as any);
  const app = await mounted(); app.navigate('profile');
  expect(settingsRow.onclick).toBeTypeOf('function'); settingsRow.onclick!();
  expect(app.client.state.screen).toBe('settings'); expect(hallRow.onclick).toBe(hallClick);
});

it.each([false, true])('scrolls from a result to New game after the list is ready (held: %s)', async held => {
  const app = await mounted(); app.navigate('end');
  const body = { scrollTop: 200, getBoundingClientRect: () => ({ top: 0 }) };
  const heading = document.getElementById('new-game-head')!;
  Object.assign(heading, { closest: () => body, getBoundingClientRect: () => ({ top: 800 - body.scrollTop }) });
  vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) =>
    (selector === '[data-screen="play"] .new-game-body' ? [body] : []) as any);
  let release!: (result: unknown) => void;
  if (held) {
    app.memory.dirty = true;
    transport.call.mockImplementation(async ({ name }) => name === 'kingdown_games' ? new Promise(resolve => { release = resolve; }) : { content: [], _meta: { settings } });
  }
  app.showNewGame();
  if (held) {
    expect(body.scrollTop).toBe(0); await vi.advanceTimersByTimeAsync(0);
    release({ content: [], _meta: { games: [] } });
  }
  await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.screen).toBe('play'); expect(body.scrollTop).toBe(800);
});

it('keeps the full-read marker absent from a compact end reply after caching rules', async () => {
  const app = await mounted();
  const full = { ...game, fen: '7k/8/8/8/8/8/P7/K7 w - - 0 1', rules: {} } as View;
  app.routeView(full);
  const ended = { ...game, revision: 2, status: 'finished', fen: full.fen, result: { winner: 1, reason: 'resignation' } } as View;
  transport.call.mockResolvedValue({ content: [], _meta: { view: ended } });
  await app.call('kingdown_resign', { game_id: game.game_id }, { route: true });
  expect(app.client.state.screen).toBe('end');
  expect(app.memory.view).not.toHaveProperty('rules');
  expect(transport.draw).toHaveBeenLastCalledWith(ended, false);
});

it('keeps a Resume service code through the real send and read adapter', async () => {
  const app = await mounted(), { pluginGameClient } = await import('./client');
  const reads = pluginGameClient(app.client, app.queue, app.send);
  transport.call.mockResolvedValue({ isError: true, content: [{ type: 'text', text: 'Read failed' }], _meta: { code: 'INTERNAL_ERROR' } });
  await expect(reads.game(game.game_id)).rejects.toMatchObject({ code: 'INTERNAL_ERROR', message: 'Read failed' });
  expect(transport.call.mock.calls.at(-1)![0].name).toBe('kingdown_resume');
});

it.each(['onclose', 'onteardown'])('disposes the hall on plugin %s', async stop => {
  const app = await mounted(); app.memory.games = [game as any]; app.renderGameRows();
  const focus = vi.mocked(window.addEventListener).mock.calls.filter(([name]) => name === 'click');
  expect(focus).toHaveLength(1);
  const reveal = vi.mocked(window.addEventListener).mock.calls.filter(([name]) => name === 'focusin');
  expect(reveal).toHaveLength(1);
  const open = transport.rows.mock.calls.at(-1)![2];
  await transport.instance[stop]();
  expect(app.memory.games).toEqual([]); expect(app.memory.dirty).toBe(true);
  expect(window.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function), true);
  expect(window.removeEventListener).toHaveBeenCalledWith(...focus[0]);
  expect(window.removeEventListener).toHaveBeenCalledWith(...reveal[0]);
  transport.call.mockClear(); open(game.game_id); await vi.advanceTimersByTimeAsync(0);
  expect(transport.call).not.toHaveBeenCalled();
});

async function waitingGame() {
  const options = (await import('./screens/setup-model')).readSetup(null).options;
  return { ...game, kind: 'random', status: 'waiting', seat: 0, created_at: new Date().toISOString(), server_now: new Date().toISOString(),
    options: { ...options, arrangement: true, kingPowers: false, cards: false } } as View;
}

it.each([false, true])('keeps the Cancel origin while Games waits (new chat: %s)', async changed => {
  const app = await mounted(), waiting = await waitingGame(); app.routeView(waiting);
  let games!: (value: unknown) => void, hold = true;
  transport.call.mockImplementation(async ({ name }) => {
    if (name === 'kingdown_games' && hold) { hold = false; return new Promise(resolve => { games = resolve; }); }
    return { content: [], _meta: name === 'kingdown_cancel' ? { view: { ...waiting, status: 'aborted' } } : { games: [] } };
  });
  const cancelled = press('wait-cancel'); await vi.advanceTimersByTimeAsync(0); expect(games).toBeTypeOf('function');
  if (changed) {
    transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'profile' }, _meta: { board_id: 'profile-board' } });
    await vi.advanceTimersByTimeAsync(0);
  }
  const before = app.client.state.screen;
  games({ content: [], _meta: { games: [] } }); await cancelled; await vi.advanceTimersByTimeAsync(0);
  expect(before).toBe(changed ? 'profile' : 'wait');
  expect(app.client.state.screen).toBe(changed ? 'profile' : 'lobby');
  expect(app.client.state.board_id).toBe(changed ? 'profile-board' : 'board-a');
});

it.each(['wait', 'play'] as const)('keeps one computer Create and finishes its Retry from %s', async screen => {
  const app = await mounted(), waiting = await waitingGame(); app.routeView(waiting);
  const solo = { ...waiting, game_id: 'solo-a000', kind: 'solo', status: 'setup', draw: 'RNBQKBNR' } as View;
  let creates = 0;
  transport.call.mockImplementation(async ({ name, arguments: args }) => {
    if (name === 'kingdown_create' && ++creates === 1) return { isError: true, content: [{ type: 'text', text: 'Lost Create reply' }] };
    const view = name === 'kingdown_create' ? solo : name === 'kingdown_choose' || name === 'kingdown_get' && !args.game_id ? { ...solo, status: 'playing', revision: 2, rules: {} } : undefined;
    return { content: [], _meta: { ...(view && { view }), games: [] } };
  });
  press('wait-computer'); await vi.advanceTimersByTimeAsync(0);
  const pending = app.client.state.pending;
  expect(pending?.name).toBe('kingdown_create'); expect(pending?.error).toBe('Lost Create reply');
  expect((document.getElementById('wait-computer') as HTMLButtonElement).disabled).toBe(true);
  expect((await import('../account-game/state')).messageLine(app.store.page()).action).toBe('retry');
  press('wait-computer'); await vi.advanceTimersByTimeAsync(0);
  expect(creates).toBe(1); expect(app.client.state.pending).toBe(pending);
  app.navigate(screen); press('retry'); await vi.advanceTimersByTimeAsync(0);
  const calls = transport.call.mock.calls.map(([input]) => input);
  expect(calls.filter(input => input.name === 'kingdown_create').map(input => input.arguments.command_id)).toEqual([pending!.args.command_id, pending!.args.command_id]);
  expect(calls.find(input => input.name === 'kingdown_choose')?.arguments).toMatchObject({ game_id: solo.game_id, ready: true });
  expect(calls.filter(input => input.name === 'kingdown_get' && !input.arguments.game_id)).toHaveLength(1);
  expect(app.client.state.screen).toBe('board'); expect(app.client.state.pending).toBeUndefined();
});

it.each(['kingdown_choose', 'kingdown_get'])('makes no second computer game while the handoff %s needs Retry', async lost => {
  const app = await mounted(), waiting = await waitingGame(); app.routeView(waiting);
  const solo = { ...waiting, game_id: 'solo-a000', kind: 'solo', status: 'setup', draw: 'RNBQKBNR', rules: {} } as View;
  transport.call.mockImplementation(async ({ name, arguments: args }) => {
    if (name === lost && args.game_id !== waiting.game_id) return { isError: true, content: [{ type: 'text', text: 'Lost reply' }] };
    const view = name === 'kingdown_create' ? solo : name === 'kingdown_choose' ? { ...solo, status: 'playing', revision: 2 } : undefined;
    return { content: [], _meta: { ...(view && { view }), games: [] } };
  });
  press('wait-computer'); await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.screen).toBe('wait'); expect(app.memory.view?.game_id).toBe(solo.game_id);
  expect((await import('../account-game/state')).messageLine(app.store.page()).action).not.toBe('none');
  expect((document.getElementById('wait-computer') as HTMLButtonElement).disabled).toBe(true);
  press('wait-computer'); await vi.advanceTimersByTimeAsync(0);
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_create')).toHaveLength(1);
});

it.each(['waiting', 'setup', 'error'])('drops an old wait %s reply after a new waiting game mounts', async reply => {
  const app = await mounted(), first = await waitingGame(); app.routeView(first);
  const solo = { ...first, game_id: 'solo-a000', kind: 'solo', status: 'playing', rules: {} } as View;
  const newer = { ...first, game_id: 'game-c000' };
  let selected: View = solo, release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name, arguments: args }) => {
    if (name === 'kingdown_get' && args.game_id === first.game_id) return new Promise(resolve => { release = resolve; });
    return { content: [], _meta: name === 'kingdown_create' || name === 'kingdown_get' ? { view: selected } : { games: [] } };
  });
  press('wait-computer'); await vi.advanceTimersByTimeAsync(0);
  expect(release).toBeTypeOf('function'); expect(app.client.state.screen).toBe('board');
  selected = newer;
  transport.instance.ontoolresult({ content: [], structuredContent: { game_id: newer.game_id }, _meta: { board_id: 'board-c' } });
  await vi.advanceTimersByTimeAsync(0);
  expect(app.memory.view?.game_id).toBe(newer.game_id); expect(app.client.state.screen).toBe('wait');
  const before = document.getElementById('wait-status')!.textContent;
  release(reply === 'error' ? { isError: true, content: [{ type: 'text', text: 'Old wait error' }] }
    : { content: [], _meta: { view: { ...first, status: reply } } });
  await vi.advanceTimersByTimeAsync(0);
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_resume')).toHaveLength(0);
  expect(app.memory.view?.game_id).toBe(newer.game_id); expect(app.client.state.screen).toBe('wait');
  expect(document.getElementById('wait-status')!.textContent).toBe(before);
});

it.each(['onclose', 'onteardown'])('stops a delayed name check on %s', async stop => {
  const app = await mounted(); app.navigate('handle');
  const input = document.getElementById('handle')! as HTMLInputElement; input.value = 'newname'; Reflect.apply(input.oninput!, input, [{}]);
  await transport.instance[stop](); await vi.advanceTimersByTimeAsync(251);
  expect(transport.call.mock.calls.filter(([call]) => call.name === 'kingdown_handle')).toHaveLength(0);
});

it('keeps a recovered watch until its first read ends', async () => {
  const waiting = await waitingGame(), now = Date.now();
  const human = { ...waiting, status: 'setup', created_at: new Date(now - 2000).toISOString(), updated_at: new Date(now).toISOString() };
  const solo = { ...waiting, game_id: 'solo-a000', kind: 'solo', status: 'playing', created_at: new Date(now - 1000).toISOString(), rules: {} };
  (window as any).openai.widgetState = { privateContent: { screen: 'board', board_id: 'solo-board' } };
  let release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name, arguments: args }) => {
    if (name === 'kingdown_get' && args.game_id === human.game_id) return new Promise(resolve => { release = resolve; });
    return { content: [], _meta: name === 'kingdown_get' ? { view: solo } : name === 'kingdown_settings'
      ? { settings, me: { handle: 'player', icon: 'spirit' } } : { games: [solo, human] } };
  });
  const app = await import('./app');
  transport.instance.ontoolresult({ content: [], structuredContent: { game_id: solo.game_id }, _meta: { board_id: 'solo-board' } });
  await vi.advanceTimersByTimeAsync(0); expect(release).toBeTypeOf('function');
  app.store.sync();
  release({ content: [], _meta: { view: human } }); await vi.advanceTimersByTimeAsync(0);
  expect((document.getElementById('over') as HTMLDialogElement).open).toBe(true);
  expect(app.memory.view?.game_id).toBe(solo.game_id); expect(app.client.state.screen).toBe('board');
});

it.each(['profile', 'board', 'unchanged'])('keeps the Switch now origin while Abort waits (new chat: %s)', async screen => {
  const waiting = await waitingGame(), now = Date.now();
  const human = { ...waiting, status: 'playing', created_at: new Date(now - 2000).toISOString(), updated_at: new Date(now).toISOString() } as View;
  const solo = { ...waiting, game_id: 'solo-a000', kind: 'solo', status: 'playing', created_at: new Date(now - 1000).toISOString(), rules: {} } as View;
  const newer = { ...solo, game_id: 'game-c000' };
  (window as any).openai.widgetState = { privateContent: { screen: 'board', board_id: 'solo-board' } };
  let abort!: (value: unknown) => void, selected = solo;
  transport.call.mockImplementation(async ({ name, arguments: args }) => {
    if (name === 'kingdown_abort') return new Promise(resolve => { abort = resolve; });
    return { content: [], _meta: name === 'kingdown_get' ? { view: args.game_id === human.game_id ? human : selected }
      : name === 'kingdown_resume' ? { view: human, board_id: 'human-board' }
      : name === 'kingdown_settings' ? { settings, me: { handle: 'player', icon: 'spirit' } } : { games: [solo, human] } };
  });
  const app = await import('./app');
  transport.instance.ontoolresult({ content: [], structuredContent: { game_id: solo.game_id }, _meta: { board_id: 'solo-board' } });
  await vi.advanceTimersByTimeAsync(0);
  expect((document.getElementById('over') as HTMLDialogElement).open).toBe(true);
  press('found-switch'); await vi.advanceTimersByTimeAsync(0); expect(abort).toBeTypeOf('function');
  if (screen !== 'unchanged') {
    selected = newer;
    transport.instance.ontoolresult({ content: [], structuredContent: screen === 'profile' ? { screen } : { game_id: newer.game_id }, _meta: { board_id: 'new-board' } });
    await vi.advanceTimersByTimeAsync(0); expect(app.client.state.screen).toBe(screen);
  }
  abort({ content: [], _meta: { view: { ...solo, status: 'aborted' } } }); await vi.advanceTimersByTimeAsync(0);
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_resume')).toHaveLength(screen === 'unchanged' ? 1 : 0);
  expect(app.client.state.screen).toBe(screen === 'unchanged' ? 'board' : screen);
  expect(app.client.state.board_id).toBe(screen === 'unchanged' ? 'human-board' : 'new-board');
  expect(app.memory.view?.game_id).toBe(screen === 'unchanged' ? human.game_id : screen === 'board' ? newer.game_id : undefined);
});

it.each([false, true])('keeps the wait read origin through Resume (new chat: %s)', async changed => {
  const app = await mounted(), waiting = await waitingGame(); app.routeView(waiting);
  const solo = { ...waiting, game_id: 'solo-a000', kind: 'solo', status: 'playing', rules: {} } as View;
  const joined = { ...waiting, status: 'playing', rules: {} } as View, newer = { ...waiting, game_id: 'game-c000' };
  let selected: View = solo, join!: (value: unknown) => void, resume!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name, arguments: args }) => {
    if (name === 'kingdown_get' && args.game_id === waiting.game_id) return new Promise(resolve => { join = resolve; });
    if (name === 'kingdown_resume') return new Promise(resolve => { resume = resolve; });
    return { content: [], _meta: name === 'kingdown_create' || name === 'kingdown_get' ? { view: selected } : { games: [] } };
  });
  press('wait-computer'); await vi.advanceTimersByTimeAsync(0); app.navigate('wait');
  const epoch = app.queue.epoch();
  join({ content: [], _meta: { view: joined } }); await vi.advanceTimersByTimeAsync(0);
  expect(resume).toBeTypeOf('function'); expect(app.queue.epoch()).toBe(epoch);
  if (changed) {
    selected = newer;
    transport.instance.ontoolresult({ content: [], structuredContent: { game_id: newer.game_id }, _meta: { board_id: 'board-c' } });
    await vi.advanceTimersByTimeAsync(0);
  }
  resume({ content: [], _meta: { view: joined } }); await vi.advanceTimersByTimeAsync(0);
  expect(app.memory.view?.game_id).toBe(changed ? newer.game_id : joined.game_id);
  expect(app.client.state.screen).toBe(changed ? 'wait' : 'board');
});

it.each(['onclose', 'onteardown', 'queue.close'])('drops a name check success after %s', async stop => {
  const app = await mounted(); app.navigate('handle');
  let release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_handle' ? new Promise(resolve => { release = resolve; }) : { content: [] });
  const input = document.getElementById('handle')! as HTMLInputElement; input.value = 'newname'; Reflect.apply(input.oninput!, input, [{}]);
  await vi.advanceTimersByTimeAsync(251); expect(release).toBeTypeOf('function');
  if (stop === 'queue.close') app.queue.close(); else await transport.instance[stop]();
  const free = document.getElementById('handle-free')!, error = document.getElementById('handle-check-error')!;
  release({ content: [], structuredContent: { available: true } }); await vi.advanceTimersByTimeAsync(0);
  expect(free.hidden).toBe(true); expect(error.textContent).toBe('');
});

it('runs one name check at a time and then only the newest name', async () => {
  const app = await mounted(); app.navigate('handle');
  const replies: ((value: unknown) => void)[] = [];
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_handle' ? new Promise(resolve => { replies.push(resolve); }) : { content: [] });
  const checks = () => transport.call.mock.calls.filter(([call]) => call.name === 'kingdown_handle').map(([call]) => call.arguments.handle);
  const input = document.getElementById('handle')! as HTMLInputElement;
  // The server allows three calls at once for each account; slow checks must leave a slot for Save (http.ts).
  for (const handle of ['name1', 'name2', 'name3', 'name4']) { input.value = handle; Reflect.apply(input.oninput!, input, [{}]); await vi.advanceTimersByTimeAsync(251); }
  expect(checks()).toEqual(['name1']);
  replies[0]({ content: [], structuredContent: { available: true } }); await vi.advanceTimersByTimeAsync(0);
  expect(checks()).toEqual(['name1', 'name4']);
  expect(document.getElementById('handle-free')!.hidden).toBe(true);
  replies[1]({ content: [], structuredContent: { available: true } }); await vi.advanceTimersByTimeAsync(0);
  expect(document.getElementById('handle-free')!.hidden).toBe(false);
});

it.each(['onclose', 'onteardown'])('drops a name check failure after %s', async stop => {
  const app = await mounted(); app.navigate('handle');
  let reject!: (reason: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_handle' ? new Promise((_, fail) => { reject = fail; }) : { content: [] });
  const input = document.getElementById('handle')! as HTMLInputElement; input.value = 'newname'; Reflect.apply(input.oninput!, input, [{}]);
  await vi.advanceTimersByTimeAsync(251); await transport.instance[stop](); reject(new Error('Old name error'));
  await vi.advanceTimersByTimeAsync(0);
  expect(document.getElementById('handle-free')!.hidden).toBe(true);
  expect(document.getElementById('handle-check-error')!.textContent).toBe('');
});

it.each(['kingdown_choose', 'kingdown_get'])('keeps Profile when the first start waits on %s', async held => {
  const app = await mounted(), setup = await import('./screens/setup');
  const { readSetup } = await import('./screens/setup-model');
  const saved = readSetup(null); saved.options = { ...saved.options, cards: false, kingPowers: true }; saved.king = { king: 'Flame', power: 'Haste' };
  app.memory.settings!.last_setup = { ...saved, options: { ...saved.options, pool: [...saved.options.pool], cardPool: [...saved.options.cardPool] } };
  const created = { ...game, kind: 'solo', status: 'setup', seat: 0, draw: 'RNBQKBNR', options: { ...saved.options, arrangement: false } } as View;
  let release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => {
    if (name === held) return new Promise(resolve => { release = resolve; });
    if (name === 'kingdown_create') return { content: [], _meta: { view: created } };
    if (name === 'kingdown_choose') return { content: [], _meta: { view: { ...created, status: 'playing', revision: 2, fen: 'position before the rules read' } } };
    return { content: [], _meta: { games: [] } };
  });
  setup.playNow(); await vi.advanceTimersByTimeAsync(0);
  expect(release).toBeTypeOf('function');
  const epoch = app.queue.epoch();
  expect(app.client.state.pending?.name).toBe(held);
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'profile' }, _meta: { board_id: 'board-profile' } });
  await vi.advanceTimersByTimeAsync(0);
  expect(app.queue.epoch()).toBe(epoch + 1);
  release({ content: [], _meta: { view: { ...created, status: 'playing', revision: 3, rules: {} } } });
  await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.screen).toBe('profile');
  expect(app.memory.view).toBeUndefined();
  expect(app.client.state.pending).toBeUndefined();
});

it('finishes the first Start after Choose supplies a position without rules', async () => {
  const app = await mounted(), setup = await import('./screens/setup');
  const { readSetup } = await import('./screens/setup-model');
  const saved = readSetup(null); saved.options = { ...saved.options, cards: false, kingPowers: true }; saved.king = { king: 'Flame', power: 'Haste' };
  app.memory.settings!.last_setup = { ...saved, options: { ...saved.options, pool: [...saved.options.pool], cardPool: [...saved.options.cardPool] } };
  const created = { ...game, kind: 'solo', status: 'setup', seat: 0, draw: 'RNBQKBNR', options: { ...saved.options, arrangement: false } };
  const playing = { ...created, status: 'playing', revision: 2, fen: 'position before the rules read' };
  transport.call.mockImplementation(async ({ name }) => ({ content: [], _meta: name === 'kingdown_create' ? { view: created }
    : name === 'kingdown_choose' ? { view: playing }
    : name === 'kingdown_get' ? { view: { ...playing, rules: {} } } : { games: [] } }));
  setup.playNow(); await vi.advanceTimersByTimeAsync(0);
  expect(transport.call.mock.calls.filter(([input]) => ['kingdown_create', 'kingdown_choose', 'kingdown_get'].includes(input.name)).map(([input]) => input.name)).toEqual(['kingdown_create', 'kingdown_choose', 'kingdown_get']);
  expect(app.client.state.screen).toBe('board'); expect(app.client.state.pending).toBeUndefined();
});

it.each([false, true])('keeps Profile when the first Settings save ends (error: %s)', async failed => {
  const app = await mounted(), setup = await import('./screens/setup');
  setup.draftFromGame({ ...game, seat: 0, options: (await import('./screens/setup-model')).readSetup(null).options });
  app.navigate('play');
  let release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_settings'
    ? new Promise(resolve => { release = resolve; }) : { content: [], _meta: { games: [] } });
  const button = document.getElementById('setup-start')!;
  Reflect.apply(button.onclick!, button, [{}]); await vi.advanceTimersByTimeAsync(0);
  expect(release).toBeTypeOf('function');
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'profile' }, _meta: { board_id: 'profile-board' } });
  await vi.advanceTimersByTimeAsync(0);
  release({ content: [{ type: 'text', text: 'Old save error' }], isError: failed, _meta: { settings } });
  await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.screen).toBe('profile');
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_create')).toHaveLength(0);
  expect((await import('../account-game/state')).messageLine(app.store.page()).text).toBe('');
});

it('keeps Home when an older automatic Choose fails', async () => {
  const app = await mounted(), setup = await import('./screens/setup');
  const saved = (await import('./screens/setup-model')).readSetup(null);
  saved.options = { ...saved.options, cards: false, kingPowers: true, arrangement: false };
  saved.king = { king: 'Flame', power: 'Haste' }; app.memory.settings = { ...settings, last_setup: { ...saved, options: { ...saved.options, pool: [...saved.options.pool], cardPool: [...saved.options.cardPool] } } };
  let release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_choose'
    ? new Promise(resolve => { release = resolve; })
    : { content: [], _meta: name === 'kingdown_create' ? { view: { ...game, kind: 'solo', status: 'setup', seat: 0, draw: 'RNBQKBNR', options: saved.options } } : { games: [] } });
  setup.playNow(); await vi.advanceTimersByTimeAsync(0);
  const pending = app.client.state.pending;
  expect(pending?.name).toBe('kingdown_choose');
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'home' }, _meta: { board_id: 'home-board' } });
  await vi.advanceTimersByTimeAsync(0);
  release({ content: [{ type: 'text', text: 'Old Choose error' }], isError: true, _meta: { code: 'INTERNAL_ERROR' } });
  await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.screen).toBe('home'); expect(app.client.state.pending).toBe(pending);
  expect(pending?.error).toBe('Old Choose error');
  expect((await import('../account-game/state')).messageLine(app.store.page()).text).toBe('');
  app.navigate('play'); expect((await import('../account-game/state')).messageLine(app.store.page()).action).toBe('retry');
});

it.each(['failed', 'superseded'])('keeps the quick start flag off a later move after a %s Play now', async end => {
  const app = await mounted(), setup = await import('./screens/setup'), { isStartStep, messageLine } = await import('../account-game/state');
  let release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => {
    if (name === 'kingdown_create') return end === 'failed' ? { content: [{ type: 'text', text: 'Lost Create reply' }], isError: true } : new Promise(resolve => { release = resolve; });
    if (name === 'kingdown_move') throw new Error('Lost move reply');
    return { content: [], _meta: { games: [] } };
  });
  setup.playNow(); await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.pending).toMatchObject({ name: 'kingdown_create', quick: true });
  if (end === 'superseded') {
    // A newer chat result detaches the Create; its late success clears its own state.pending.
    transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'home' }, _meta: { board_id: 'board-b' } });
    await vi.advanceTimersByTimeAsync(0);
    release({ content: [], _meta: { view: { ...game, game_id: 'solo-a000', kind: 'solo', status: 'setup', seat: 0 } } }); await vi.advanceTimersByTimeAsync(0);
    expect(app.client.state.pending).toBeUndefined();
  }
  app.routeView(game);
  await app.send('kingdown_move', { game_id: game.game_id, command_id: 'move', expected_revision: 1, actions: ['e2-e4'] }, { retain: true });
  const pending = app.client.state.pending!;
  expect(pending).toMatchObject({ name: 'kingdown_move', screen: 'board', error: 'Lost move reply' });
  expect(pending.quick).toBeUndefined(); expect(isStartStep(pending)).toBe(false);
  app.navigate('play'); expect(messageLine(app.store.page()).text).toBe('');
});

it.each(['kingdown_choose', 'kingdown_get'])('keeps a failed start %s on Play after the player opens Settings', async failed => {
  const app = await mounted(), setup = await import('./screens/setup'), { locks, messageLine } = await import('../account-game/state');
  const saved = (await import('./screens/setup-model')).readSetup(null);
  saved.options = { ...saved.options, cards: false, kingPowers: true, arrangement: false }; saved.king = { king: 'Flame', power: 'Haste' };
  app.memory.settings = { ...settings, last_setup: { ...saved, options: { ...saved.options, pool: [...saved.options.pool], cardPool: [...saved.options.cardPool] } } };
  const created = { ...game, kind: 'solo', status: 'setup', seat: 0, draw: 'RNBQKBNR', options: saved.options };
  const playing = { ...created, status: 'playing', revision: 2, fen: 'position before the rules read' };
  let release!: (value: unknown) => void, sends = 0;
  transport.call.mockImplementation(async ({ name }) => {
    if (name === 'kingdown_create') return new Promise(resolve => { release = resolve; });
    if (name === failed && ++sends === 1) throw new Error('Lost step reply');
    return { content: [], _meta: name === 'kingdown_choose' ? { view: playing } : name === 'kingdown_get' ? { view: { ...playing, rules: {} } } : { games: [] } };
  });
  app.navigate('play'); setup.playNow(); await vi.advanceTimersByTimeAsync(0);
  // The Create waits past 5 s, so Settings is free, and the player opens it.
  app.navigate('settings');
  release({ content: [], _meta: { view: created } }); await vi.advanceTimersByTimeAsync(0);
  const pending = app.client.state.pending!;
  expect(pending).toMatchObject({ name: failed, screen: 'play', quick: true, error: 'Lost step reply' });
  expect(locks(app.store.page()).start).toBe(true);
  app.navigate('play'); expect(messageLine(app.store.page())).toMatchObject({ text: 'Lost step reply', action: 'retry' });
  await app.send(pending.name, pending.args, { retain: true, retry: true });
  expect(app.client.state.screen).toBe('board'); expect(app.client.state.pending).toBeUndefined();
});

it('keeps a newer list after navigation in the same epoch', async () => {
  const app = await mounted(); app.routeView(game);
  let release!: (value: unknown) => void, lists = 0;
  const newer = [{ game_id: 'game-b000', action: 'ready' }];
  transport.call.mockImplementation(async ({ name }) => {
    if (name === 'kingdown_games' && ++lists === 1) return new Promise(resolve => { release = resolve; });
    return { content: [], _meta: name === 'kingdown_move' ? { view: { ...game, revision: 2 } } : { games: newer } };
  });
  await app.send('kingdown_move', { game_id: game.game_id, command_id: 'move', actions: ['e2-e4'] }, { retain: true });
  expect(release).toBeTypeOf('function'); const epoch = app.queue.epoch();
  app.navigate('play'); await vi.advanceTimersByTimeAsync(0);
  expect(app.queue.epoch()).toBe(epoch); expect(app.memory.games).toEqual(newer);
  const draws = transport.draw.mock.calls.length;
  release({ content: [], _meta: { games: [] } }); await vi.advanceTimersByTimeAsync(0);
  expect(app.memory.games).toEqual(newer);
  expect(document.getElementById('home-line')!.textContent).toBe('Your move in 1 game.');
  expect(transport.draw).toHaveBeenCalledTimes(draws);
});

it.each([false, true])('retries Casual Play now with its saved king when another setup draft exists (saved Ranked: %s)', async ranked => {
  vi.stubEnv('VITE_KINGDOWN_STAGE', 'staging'); // Ranked is offered only in staging (ticket 67).
  const app = await mounted(), setup = await import('./screens/setup');
  const { readSetup, withMode } = await import('./screens/setup-model');
  let saved = readSetup(null);
  saved.options = { ...saved.options, cards: false, kingPowers: true, arrangement: false }; saved.king = { king: 'Flame', power: 'Haste' };
  if (ranked) saved = withMode({ ...saved, kind: 'random', king: { king: 'Mud', power: 'March' } }, 'ranked');
  app.memory.settings = { ...settings, last_setup: { ...saved, options: { ...saved.options, pool: [...saved.options.pool], cardPool: [...saved.options.cardPool] } } };
  const created = { ...game, kind: 'solo', status: 'setup', seat: 0, draw: 'RNBQKBNR', options: saved.options } as View;
  setup.draftFromGame({ ...created, kings: [{ king: 'Frost', power: 'Freeze' }, null] } as View);
  let creates = 0;
  transport.call.mockImplementation(async ({ name }) => {
    if (name === 'kingdown_create' && ++creates === 1) throw new Error('Lost Create reply');
    return { content: [], _meta: name === 'kingdown_create' ? { view: created }
      : name === 'kingdown_choose' ? { view: { ...created, status: 'playing', revision: 2, rules: {} } } : { games: [] } };
  });
  setup.playNow(); await vi.advanceTimersByTimeAsync(0);
  const pending = app.client.state.pending!; expect(pending.error).toBe('Lost Create reply');
  await app.send(pending.name, pending.args, { retain: true, retry: true });
  const inputs = transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_create').map(([input]) => input.arguments);
  expect(inputs).toHaveLength(2); expect(inputs[1]).toEqual(inputs[0]);
  expect(inputs[0]).toMatchObject({ kind: 'solo', mode: 'casual' });
  expect(transport.call.mock.calls.find(([input]) => input.name === 'kingdown_choose')?.[0].arguments.king).toEqual(saved.king);
  expect(app.client.state.screen).toBe('board'); expect(app.client.state.pending).toBeUndefined();
});

it('keeps Profile when the friend Cancel reply arrives late', async () => {
  const app = await mounted();
  app.memory.games = [{ game_id: game.game_id }] as any;
  app.routeView({ ...game, status: 'waiting' });
  let release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_abort'
    ? new Promise(resolve => { release = resolve; }) : { content: [], _meta: { games: [] } });
  const button = document.getElementById('friend-cancel')!;
  const cancelled = Reflect.apply(button.onclick!, button, [{}]);
  await vi.advanceTimersByTimeAsync(0);
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'profile' }, _meta: { board_id: 'board-profile' } });
  await vi.advanceTimersByTimeAsync(0);
  release({ content: [], _meta: { view: { ...game, status: 'aborted', revision: 2 } } });
  await cancelled;
  expect(app.client.state.screen).toBe('profile');
  expect(app.client.state.pending).toBeUndefined();
});

it('goes to Play when a retried friend Cancel succeeds', async () => {
  const app = await mounted();
  app.memory.games = [{ game_id: game.game_id }] as any;
  app.routeView({ ...game, status: 'waiting' });
  expect(app.client.state.screen).toBe('friend');
  let aborts = 0;
  transport.call.mockImplementation(async ({ name }) => {
    if (name === 'kingdown_abort' && ++aborts === 1) throw new Error('Lost Cancel reply');
    return { content: [], _meta: name === 'kingdown_abort' ? { view: { ...game, status: 'aborted', revision: 2 } } : { games: [] } };
  });
  const button = document.getElementById('friend-cancel')!;
  await Reflect.apply(button.onclick!, button, [{}]); await vi.advanceTimersByTimeAsync(0);
  const pending = app.client.state.pending!; expect(pending).toMatchObject({ name: 'kingdown_abort', screen: 'friend', error: 'Lost Cancel reply' });
  await app.send(pending.name, pending.args, { retain: true, retry: true });
  expect(aborts).toBe(2);
  expect(app.client.state.screen).toBe('play'); expect(app.client.state.pending).toBeUndefined();
});

it('starts Play now with the same lock as its button when another game has a lost command', async () => {
  const app = await mounted(), setup = await import('./screens/setup');
  app.client.state.pending = receipt(); app.actions();
  expect((document.getElementById('home-play') as HTMLButtonElement).disabled).toBe(false);
  transport.call.mockClear(); setup.playNow(); await vi.advanceTimersByTimeAsync(0);
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_create')).toHaveLength(1);
  expect(app.client.state.pending).toBeUndefined();
});

it.each(['foreground', 'remount'])('keeps another game receipt after a refused %s read', async path => {
  const app = await mounted(), pending = receipt();
  app.routeView({ ...game, game_id: 'game-b000' }); app.client.state.pending = pending;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_get'
    ? { content: [{ type: 'text', text: 'This game was removed' }], isError: true, _meta: { code: 'MATCH_REMOVED' } }
    : { content: [], _meta: { games: [] } });
  if (path === 'foreground') await app.send('kingdown_get', {});
  else { transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'board', game_id: 'game-b000' }, _meta: { board_id: 'board-b' } }); await vi.advanceTimersByTimeAsync(0); }
  expect(app.client.state.pending).toBe(pending);
  app.routeView(game);
  expect((await import('../account-game/state')).messageLine(app.store.page()).action).toBe('retry');
});

const EXPIRED = 'This board expired. Start, resume or join a game.';
const expired = { content: [{ type: 'text', text: EXPIRED }], isError: true, _meta: { code: 'BOARD_EXPIRED' } };
const calls = (name: string) => transport.call.mock.calls.filter(([input]) => input.name === name).map(([input]) => input.arguments);
it.each(['foreground', 'poll'])('opens the shown game on a new board when its record expired, and keeps the receipt: %s', async path => {
  const app = await mounted(), pending = receipt(), accessLost = vi.fn();
  app.routeView({ ...game, seat: 1 }); app.client.state.pending = pending;
  (await import('../account-game/host')).runtimeHost().onAccessLost = accessLost;
  transport.call.mockImplementation(async ({ name, arguments: args }) => name === 'kingdown_get' && args.board_id === 'board-a' ? expired
    : { content: [], _meta: name === 'kingdown_open' ? { board_id: 'board-b', view: { ...game, seat: 1, revision: 2 }, games: [] } : { games: [] } });
  if (path === 'poll') await transport.target().read(); else await app.send('kingdown_get', {});
  expect(calls('kingdown_open')).toEqual([{ game_id: 'game-a000' }]);
  expect(app.client.state.board_id).toBe('board-b'); expect(app.client.state.pending).toBe(pending);
  expect(app.queue.closed()).toBe(false); expect(accessLost).not.toHaveBeenCalled(); expect(app.memory.view?.revision).toBe(2);
  transport.call.mockClear(); await app.send('kingdown_get', {});
  expect(calls('kingdown_get').map(args => args.board_id)).toEqual(['board-b']); expect(calls('kingdown_open')).toEqual([]);
});

it('keeps the page and its receipt when an expired board shows no game', async () => {
  const app = await mounted(), pending = receipt(); app.client.state.pending = pending;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_get' ? expired : { content: [], _meta: { games: [] } });
  await app.send('kingdown_get', {});
  expect(transport.call.mock.calls.some(([input]) => input.name === 'kingdown_open')).toBe(false);
  expect(app.queue.closed()).toBe(false); expect(app.client.state.pending).toBe(pending); expect(app.client.state.board_id).toBe('board-a');
  expect(app.store.page().notice).toMatchObject({ kind: 'read', text: EXPIRED });
});

// A Daily game: the player opens the chat again days later, and the old chat result names the board that the cleanup deleted.
it.each([0, 1])('opens the chat result game when a remounted board expired; another seat clears the page (seat %s)', async seat => {
  const pending = receipt();
  (window as any).openai.widgetState = { privateContent: { screen: 'board', board_id: 'board-a', pending } };
  transport.call.mockImplementation(async ({ name, arguments: args }) => name === 'kingdown_get' && args.board_id === 'board-a' ? expired
    : { content: [], _meta: name === 'kingdown_open' ? { board_id: 'board-b', view: { ...game, seat, revision: 2 }, games: [] }
      : name === 'kingdown_settings' ? { settings, me: { handle: 'player', icon: 'spirit' } } : { games: [] } });
  const app = await import('./app'), accessLost = vi.fn();
  (await import('../account-game/host')).runtimeHost().onAccessLost = accessLost;
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'board', game_id: game.game_id }, _meta: { board_id: 'board-a', view: { ...game, seat: 0 } } });
  await vi.advanceTimersByTimeAsync(0);
  expect(calls('kingdown_open')).toEqual([{ game_id: game.game_id }]);
  if (seat === 0) {
    expect(app.client.state.board_id).toBe('board-b'); expect(app.client.state.pending).toEqual(pending);
    expect(app.memory.view?.revision).toBe(2); expect(app.store.page().notice).toBeUndefined();
    expect(app.queue.closed()).toBe(false); expect(accessLost).not.toHaveBeenCalled();
  } else {
    expect(app.queue.closed()).toBe(true); expect(app.client.state).toEqual({ screen: 'home' }); expect(accessLost).toHaveBeenCalledOnce();
  }
});

it.each(['foreground', 'poll', 'expired board', 'expired board, other seat'])('clears private state when a reconnected account refuses the current board: %s', async path => {
  const app = await mounted(); app.routeView({ ...game, seat: 0 }); app.client.state.pending = receipt();
  const accessLost = vi.fn(() => { expect(app.queue.closed()).toBe(true); expect(app.memory.view).toBeUndefined(); });
  (await import('../account-game/host')).runtimeHost().onAccessLost = accessLost;
  app.client.state.draft = { game_tag: 'game-a00', fen: 'private-position', lans: ['e2-e4'], scope: { account: 'board-a', game: game.game_id, revision: 1, rules: '{}', engine: 'engine' } };
  const saved = vi.spyOn((window as any).openai, 'setWidgetState');
  const refusal = { content: [{ type: 'text', text: 'Board unavailable for this account' }], isError: true, _meta: { code: 'FORBIDDEN' } };
  // An expired board: the recovery Open of the shown game is refused (the new account has no seat), or it gives the other seat (the opponent's account).
  const opened = { content: [], _meta: { board_id: 'board-b', view: { ...game, seat: 1, revision: 2 }, games: [] } };
  transport.call.mockImplementation(async ({ name }) => path.startsWith('expired') && name === 'kingdown_get' ? expired
    : path === 'expired board, other seat' && name === 'kingdown_open' ? opened : refusal);
  if (path === 'poll') await transport.target().read(); else await app.send('kingdown_get', {});
  expect(app.queue.closed()).toBe(true); expect(app.memory.view).toBeUndefined();
  expect(app.client.state).toEqual({ screen: 'home' });
  expect(saved).toHaveBeenLastCalledWith({ modelContent: {}, privateContent: { screen: 'home', pending: undefined } });
  expect(transport.disposeBoard).toHaveBeenCalledOnce();
  expect(accessLost).toHaveBeenCalledOnce();
  transport.instance.ontoolresult({ content: [], _meta: { view: game, board_id: 'board-a' } });
  await vi.advanceTimersByTimeAsync(0); expect(app.memory.view).toBeUndefined();
});

it('keeps End when two Try again reads return in reverse order', async () => {
  const app = await mounted(); app.routeView(game);
  let release!: (value: unknown) => void, first = true;
  transport.call.mockImplementation(async ({ name }) => {
    if (name === 'kingdown_get' && first) { first = false; return new Promise(resolve => { release = resolve; }); }
    return { content: [], _meta: name === 'kingdown_get' ? { view: { ...game, revision: 2, status: 'finished' } } : { games: [] } };
  });
  const old = app.call('kingdown_get', {}, false, false, true); await vi.advanceTimersByTimeAsync(0);
  await app.call('kingdown_get', {}, false, false, true);
  expect(app.client.state.screen).toBe('end');
  release({ content: [], _meta: { view: game } }); await old; await vi.advanceTimersByTimeAsync(0);
  expect(app.memory.view?.revision).toBe(2); expect(app.client.state.screen).toBe('end');
  app.routeView(game);
  expect(app.client.state.screen).toBe('end');
});

it.each([false, true])('keeps the SDK limit for mount Get and list reads (board: %s)', async board => {
  await mounted(); transport.call.mockClear();
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: board ? 'board' : 'home', ...(board && { game_id: game.game_id }) }, _meta: { board_id: 'board-a' } });
  await vi.advanceTimersByTimeAsync(0);
  const reads = transport.call.mock.calls.filter(([input]) => ['kingdown_get', 'kingdown_games'].includes(input.name));
  expect(reads.map(([input]) => input.name)).toEqual(board ? ['kingdown_get', 'kingdown_games'] : ['kingdown_games']);
  for (const [, options] of reads) expect(options).not.toHaveProperty('timeout');
});

it.each(['teardown', 'profile', 'other game'].flatMap(change => ['friend', 'solo'].map(kind => ({ change, kind }))))('ignores a held $kind poll after $change', async ({ change, kind }) => {
  const app = await mounted(); app.routeView({ ...game, kind } as View);
  let release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_get'
    ? new Promise(resolve => { release = resolve; }) : { content: [], _meta: { games: [] } });
  const poll = transport.target().read(); await vi.advanceTimersByTimeAsync(0);
  if (change === 'teardown') await transport.instance.onteardown();
  else if (change === 'profile') app.navigate('profile');
  else app.routeView({ ...game, game_id: 'game-b000' });
  release({ content: [], _meta: { view: { ...game, revision: 2 } } }); await poll; await vi.advanceTimersByTimeAsync(0);
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_seen')).toEqual([]);
  if (change === 'teardown') {
    expect(transport.disposeBoard).toHaveBeenCalledOnce();
    expect(app.memory.view).toBeUndefined();
  }
});

it('reads the solo board and its waiting human game in one poll without presence writes', async () => {
  const app = await mounted(), waiting = await waitingGame();
  let solo = { ...waiting, game_id: 'solo-a000', kind: 'solo', status: 'playing', rules: {} } as View;
  app.memory.games = [waiting as any, solo as any];
  transport.call.mockImplementation(async ({ name, arguments: args }) => ({ content: [], _meta: name === 'kingdown_games'
    ? { games: [waiting, solo] } : { view: args.game_id === waiting.game_id ? waiting : solo } }));
  await app.send('kingdown_resume', { game_id: solo.game_id }); await vi.advanceTimersByTimeAsync(0);
  transport.call.mockClear();
  solo = { ...solo, revision: 2 };
  await transport.target().read(); await vi.advanceTimersByTimeAsync(0);
  expect(app.memory.view?.game_id).toBe(solo.game_id);
  expect(app.memory.view?.revision).toBe(2);
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_get').map(([input]) => input.arguments.game_id)).toEqual([undefined, waiting.game_id]);
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_seen')).toHaveLength(0);
});

it.each(['chat result', 'teardown'])('drops a move list reply after a newer %s', async change => {
  const app = await mounted(); app.routeView(game);
  let release!: (value: unknown) => void, first = true;
  const newer = [{ game_id: 'game-b000', action: 'ready' }];
  transport.call.mockImplementation(async ({ name }) => {
    if (name === 'kingdown_move') return { content: [], _meta: { view: { ...game, revision: 2 } } };
    if (name === 'kingdown_games' && first) { first = false; return new Promise(resolve => { release = resolve; }); }
    return { content: [], _meta: { games: newer } };
  });
  await app.send('kingdown_move', { game_id: game.game_id, command_id: 'move', expected_revision: 1, actions: ['e2-e4'] }, { retain: true });
  expect(release).toBeTypeOf('function');
  if (change === 'teardown') await transport.instance.onteardown();
  else { transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'home' }, _meta: { board_id: 'board-b', games: newer } }); await vi.advanceTimersByTimeAsync(0); }
  const before = app.memory.games, draws = transport.draw.mock.calls.length;
  release({ content: [], _meta: { games: [{ game_id: game.game_id, action: 'waiting' }] } }); await vi.advanceTimersByTimeAsync(0);
  expect(app.memory.games).toBe(before); expect(transport.draw).toHaveBeenCalledTimes(draws);
});

it.each([false, true])('uses the start king when the inline mount resends Create (saved command: %s)', async withKing => {
  transport.mode = 'inline';
  const king = { king: 'Flame', power: 'Haste' } as const;
  const pending = { name: 'kingdown_create', args: { kind: 'solo', command_id: 'once' }, screen: 'play', quick: true, ...(withKing && { king }) };
  (window as any).openai.widgetState = { privateContent: { screen: 'home', queued: 'play', pending } };
  const { readSetup } = await import('./screens/setup-model');
  const saved = readSetup(null); saved.options = { ...saved.options, cards: false, kingPowers: true, arrangement: false }; saved.king = withKing ? { king: 'Frost', power: 'Freeze' } : king;
  const created = { ...game, kind: 'solo', status: 'setup', seat: 0, draw: 'RNBQKBNR', options: saved.options };
  transport.call.mockImplementation(async ({ name }) => ({ content: [], _meta: name === 'kingdown_settings'
    ? { settings: { ...settings, last_setup: saved }, me: { handle: 'player', icon: 'spirit' } }
    : name === 'kingdown_create' ? { view: created }
    : name === 'kingdown_choose' ? { view: { ...created, status: 'playing', revision: 2, rules: {} } } : { games: [] } }));
  const app = await import('./app');
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'home' }, _meta: { board_id: 'board-a' } });
  await vi.advanceTimersByTimeAsync(0);
  expect(transport.call.mock.calls.find(([input]) => input.name === 'kingdown_choose')?.[0].arguments.king).toEqual(king);
  expect(app.client.state.pending).toBeUndefined();
});

it('keeps the saved command and makes no widget write when Create replies after teardown', async () => {
  const app = await mounted(), save = vi.fn(); (window as any).openai.setWidgetState = save;
  let release!: (value: unknown) => void;
  transport.call.mockReturnValueOnce(new Promise(resolve => { release = resolve; }));
  const sent = app.send('kingdown_create', { kind: 'solo', command_id: 'once' }, { retain: true }); await vi.advanceTimersByTimeAsync(0);
  const pending = app.client.state.pending;
  await transport.instance.onteardown(); await sent;
  const before = save.mock.calls.length;
  release({ content: [], _meta: { view: { ...game, kind: 'solo' } } }); await vi.advanceTimersByTimeAsync(0);
  expect(save).toHaveBeenCalledTimes(before); expect(app.client.state.pending).toBe(pending);
});

it('keeps the inline start for Retry when the first Settings read fails', async () => {
  transport.mode = 'inline';
  const pending = { name: 'kingdown_create', args: { kind: 'solo', command_id: 'once' }, screen: 'play', quick: true };
  (window as any).openai.widgetState = { privateContent: { screen: 'home', queued: 'play', pending } };
  const saved = (await import('./screens/setup-model')).readSetup(null);
  saved.options = { ...saved.options, cards: false, kingPowers: true, arrangement: false }; saved.king = { king: 'Flame', power: 'Haste' };
  const created = { ...game, kind: 'solo', status: 'setup', seat: 0, draw: 'RNBQKBNR', options: saved.options };
  let failed = true;
  transport.call.mockImplementation(async ({ name }) => {
    if (name === 'kingdown_settings' && failed) return { content: [{ type: 'text', text: 'Settings unavailable' }], isError: true };
    return { content: [], _meta: name === 'kingdown_settings' ? { settings: { ...settings, last_setup: saved }, me: { handle: 'player', icon: 'spirit' } }
      : name === 'kingdown_create' ? { view: created }
      : name === 'kingdown_choose' ? { view: { ...created, status: 'playing', revision: 2, rules: {} } } : { games: [] } };
  });
  const app = await import('./app');
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'home' }, _meta: { board_id: 'board-a' } });
  await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.pending).toMatchObject({ name: 'kingdown_create', args: { command_id: 'once' }, error: 'Settings unavailable' });
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_create')).toHaveLength(0);
  await app.send(pending.name, app.client.state.pending!.args, { retry: true, retain: true });
  expect(app.client.state.pending?.error).toBe('Settings unavailable');
  failed = false;
  await app.send(pending.name, app.client.state.pending!.args, { retry: true, retain: true });
  expect(transport.call.mock.calls.find(([input]) => input.name === 'kingdown_create')?.[0].arguments.command_id).toBe('once');
  expect(transport.call.mock.calls.find(([input]) => input.name === 'kingdown_choose')?.[0].arguments.king).toEqual(saved.king);
  expect(app.client.state.pending).toBeUndefined(); expect(app.memory.view?.status).toBe('playing');
});
it('offers Try again when the first Settings read fails with no start to retry, and clears it when a later mount reads them', async () => {
  // A refused read (429 while an older frame's calls still run) left Play off with no way out but a new chat result.
  let failed = true;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_settings' && failed
    ? { content: [{ type: 'text', text: 'Too many active requests for your account.' }], isError: true }
    : { content: [], _meta: name === 'kingdown_settings' ? { settings, me: { handle: 'player', icon: 'spirit' } } : { games: [] } });
  const app = await import('./app'), { messageLine } = await import('../account-game/state');
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'home' }, _meta: { board_id: 'board-a' } });
  await vi.advanceTimersByTimeAsync(0);
  expect(app.memory.settings).toBeUndefined();
  expect(messageLine(app.store.page())).toMatchObject({ text: 'Too many active requests for your account.', action: 'connect' });
  failed = false;
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'home' }, _meta: { board_id: 'board-b' } });
  await vi.advanceTimersByTimeAsync(0);
  expect(app.memory.settings).toEqual(settings);
  expect(messageLine(app.store.page()).text).toBe('');
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

it('settles a retained start failure while its command stays available for Retry', async () => {
  const app = await import('./app');
  app.navigate('play');
  transport.call.mockImplementation(async ({ name }) => {
    if (name === 'kingdown_create') throw new Error('Lost start reply');
    return { content: [], _meta: { games: [] } };
  });
  // The fourth input is the S4 app's pending callback. The S5 router removes that wait.
  const router = Reflect.apply(createRouter, undefined, [app.call, app.navigate, () => {}, () => !!app.client.state.pending]) as ReturnType<typeof createRouter>;
  let settled = false;
  const start = router.start('solo').then(value => { settled = true; return value; });
  await vi.advanceTimersByTimeAsync(0);
  expect(settled).toBe(true);
  expect(await start).toBeUndefined();
  expect(app.client.state.pending).toMatchObject({ name: 'kingdown_create', error: 'Lost start reply', screen: 'play' });
  expect(app.store.page().pending).toBe(app.client.state.pending);
});

it.each(['kingdown_move', 'kingdown_choose'])('keeps a restored %s when its game ID cannot be resolved', async name => {
  const pending = { name, args: { command_id: 'saved', expected_revision: 0 }, game_tag: 'game-a00', screen: 'play', quick: true, error: 'Lost reply' };
  (window as any).openai.widgetState = { privateContent: { screen: 'play', pending } };
  const app = await import('./app');
  app.routeView({ game_id: 'game-b000', status: 'setup', options: {} } as View);
  const result = await app.send(name, app.client.state.pending!.args, { retry: true, retain: true });
  expect(result.status).toBe('failed');
  expect(transport.call.mock.calls.filter(([input]) => input.name === name)).toEqual([]);
  expect(app.client.state.pending).toMatchObject({ name, game_tag: 'game-a00', error: 'Cannot connect. Check your connection, then try again.' });
});

it('keeps a refused Join out of the page notice', async () => {
  const app = await mounted();
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_join'
    ? { content: [{ type: 'text', text: 'Invitation unavailable' }], isError: true, _meta: { code: 'INVITE_UNAVAILABLE' } }
    : { content: [], _meta: { games: [] } });
  app.navigate('join');
  // Join shows its own sentence from the refusal code, so the outcome keeps the code.
  expect(await app.send('kingdown_join', { code: 'ABC123' })).toMatchObject({ status: 'refused', code: 'INVITE_UNAVAILABLE' });
  expect(app.store.refusal()).toBeUndefined();
  const { messageLine } = await import('../account-game/state');
  expect(messageLine(app.store.page()).text).toBe('');
  app.navigate('play');
  expect(messageLine(app.store.page()).text).toBe('');
});

it('aborts the calls of a mount that a newer chat result supersedes', async () => {
  await mounted();
  const signals: (AbortSignal | undefined)[] = [];
  transport.call.mockImplementation(({ name }, options) => {
    if (name !== 'kingdown_open') return Promise.resolve({ content: [], _meta: { games: [] } });
    signals.push(options?.signal); return new Promise(() => {});
  });
  transport.instance.ontoolresult({ content: [], structuredContent: { game_id: 'game-b000' } });
  await vi.advanceTimersByTimeAsync(0);
  expect(signals).toHaveLength(1);
  expect(signals[0]?.aborted).toBe(false);
  // The server allows three calls at once for each account, so a stale mount must not keep its slot.
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'home' }, _meta: { board_id: 'board-c' } });
  await vi.advanceTimersByTimeAsync(0);
  expect(signals[0]?.aborted).toBe(true);
});

it('clears a board refusal when the player then blocks the opponent', async () => {
  const app = await mounted();
  app.routeView(game);
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_draw'
    ? { content: [{ type: 'text', text: 'You cannot offer a draw now' }], isError: true, _meta: { code: 'NOT_ALLOWED' } }
    : { content: [], _meta: { view: { ...game, revision: 2 } } });
  await app.send('kingdown_draw', { game_id: game.game_id, command_id: 'draw', expected_revision: 1 }, { retain: true });
  expect(app.store.refusal()).toMatchObject({ code: 'NOT_ALLOWED' });
  // Block is a user write without retain; it starts a new command, so the old refusal goes.
  await app.call('kingdown_block', { game_id: game.game_id, blocked: true });
  expect(app.store.refusal()).toBeUndefined();
});

it('clears a failed Block error when the player blocks again and it works', async () => {
  const app = await mounted(), { messageLine } = await import('../account-game/state');
  app.routeView(game);
  let failed = true;
  transport.call.mockImplementation(async ({ name }) => {
    if (name === 'kingdown_block' && failed) throw new Error('Failed to fetch');
    return { content: [], _meta: { view: { ...game, revision: 2 } } };
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await app.call('kingdown_block', { game_id: game.game_id, blocked: true });
  expect(messageLine(app.store.page()).text).toBe('Cannot connect. Check your connection, then try again.');
  failed = false;
  await app.call('kingdown_block', { game_id: game.game_id, blocked: true });
  expect(messageLine(app.store.page()).text).toBe('');
});

it('scopes a refused Retry to the game ID restored after a remount', async () => {
  (window as any).openai.widgetState = { privateContent: { screen: 'board', pending: { name: 'kingdown_move', args: { command_id: 'saved', expected_revision: 0 }, game_tag: 'game-a00', screen: 'board', error: 'Lost reply' } } };
  const app = await import('./app');
  app.routeView({ game_id: 'game-a000', status: 'playing' } as View);
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_move'
    ? { content: [{ type: 'text', text: 'The game changed' }], isError: true, _meta: { code: 'STALE_REVISION' } }
    : { content: [] });
  await app.send('kingdown_move', app.client.state.pending!.args, { retry: true, retain: true });
  expect(app.store.refusal()).toMatchObject({ game: 'game-a000', code: 'STALE_REVISION' });
  const { messageLine } = await import('../account-game/state');
  expect(messageLine(app.store.page()).text).toBe('The game changed');
  app.navigate('settings');
  expect(messageLine(app.store.page()).text).toBe('');
  app.routeView({ game_id: 'game-b000', status: 'playing' } as View);
  expect(messageLine(app.store.page()).text).toBe('');
  expect(transport.call.mock.calls.find(([input]) => input.name === 'kingdown_move')?.[0].arguments.game_id).toBe('game-a000');
});

it('keeps a newer game after a held Choose returns to an older start job', async () => {
  const app = await import('./app');
  const origin = app.queue.command('write', 'kingdown_create', {});
  let release!: (result: unknown) => void;
  transport.call.mockReturnValueOnce(new Promise(resolve => { release = resolve; }));
  const choose = app.call('kingdown_choose', { game_id: 'game-a000' }, { origin, retain: true, route: false });
  await vi.advanceTimersByTimeAsync(0);
  app.queue.chatResult();
  app.routeView({ game_id: 'game-b000', status: 'playing', revision: 1 } as View);
  release({ content: [], _meta: { view: { game_id: 'game-a000', status: 'setup', revision: 1 } } });
  expect(await choose).toBeUndefined();
  expect(app.memory.view?.game_id).toBe('game-b000');
  expect(app.client.state.screen).toBe('board');
  expect(app.client.state.pending).toBeUndefined();
});

it('review: keeps a failed Settings save off the screen opened after Back', async () => {
  const app = await mounted(); app.routeView(game); app.navigate('settings');
  Object.assign(document, { addEventListener() {}, removeEventListener() {} });
  let reject!: (error: Error) => void;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_settings'
    ? new Promise((_resolve, fail) => { reject = fail; }) : { content: [], _meta: { games: [] } });
  const input = document.getElementById('symbols-only')!;
  Reflect.apply(input.onchange!, input, [{}]); await vi.advanceTimersByTimeAsync(0);
  expect(reject).toBeTypeOf('function');
  expect(app.queue.writing()).toBe(true);
  app.navigate('board');
  reject(new Error('Setting save failed')); await vi.advanceTimersByTimeAsync(0);
  expect((await import('../account-game/state')).messageLine(app.store.page()).text).toBe('');
});

it.each([false, true])('review: ignores a Settings save reply after teardown (error: %s)', async failed => {
  const app = await mounted(); app.navigate('settings');
  Object.assign(document, { addEventListener() {}, removeEventListener() {} });
  let release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_settings'
    ? new Promise(resolve => { release = resolve; }) : { content: [], _meta: { games: [] } });
  const input = document.getElementById('symbols-only')!;
  Reflect.apply(input.onchange!, input, [{}]); await vi.advanceTimersByTimeAsync(0);
  const before = app.memory.settings;
  await transport.instance.onteardown();
  release(failed ? { content: [{ type: 'text', text: 'Setting save failed' }], isError: true }
    : { content: [], _meta: { settings: { ...settings, symbols_only: true } } });
  await vi.advanceTimersByTimeAsync(0);
  expect(app.memory.settings).toBe(before);
  expect((await import('../account-game/state')).messageLine(app.store.page()).text).toBe('');
});

it('clears a failed empty Play read when Try again reads no game', async () => {
  const app = await mounted(); app.navigate('play');
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_get'
    ? { isError: true, content: [{ type: 'text', text: 'Read failed' }] } : { content: [], _meta: { games: [] } });
  await app.call('kingdown_get', {});
  expect((await import('../account-game/state')).messageLine(app.store.page()).action).toBe('try-again');
  transport.call.mockResolvedValue({ content: [], _meta: { games: [] } });
  await app.call('kingdown_get', {});
  expect((await import('../account-game/state')).messageLine(app.store.page())).toMatchObject({ text: '', action: 'none' });
});

it.each(['kingdown_settings', 'kingdown_create'])('keeps Start and exits fixed after teardown while %s waits', async held => {
  const app = await mounted(), setup = await import('./screens/setup'); app.navigate('play');
  const exit = { disabled: true, dataset: {} as Record<string, string>, addEventListener() {}, removeEventListener() {} };
  Object.assign(document, { querySelectorAll: (selector: string) => selector === '#page-back, [data-screen="play"] [data-nav]' ? [exit] : [] });
  let release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => name === held ? new Promise(resolve => { release = resolve; })
    : { content: [], _meta: { settings, games: [] } });
  if (held === 'kingdown_settings') {
    setup.setupScreen();
    const button = document.getElementById('setup-start')!; Reflect.apply(button.onclick!, button, [{}]);
  } else setup.playNow();
  await vi.advanceTimersByTimeAsync(held === 'kingdown_create' ? 5001 : 0);
  expect(release).toBeTypeOf('function');
  const button = document.getElementById('setup-start')!, before = { text: button.textContent, disabled: exit.disabled, dataset: { ...exit.dataset } };
  await transport.instance.onteardown(); await vi.advanceTimersByTimeAsync(5001);
  expect({ text: button.textContent, disabled: exit.disabled, dataset: exit.dataset }).toEqual(before);
  const calls = transport.call.mock.calls.length;
  release({ content: [], _meta: { settings, games: [] } }); await vi.advanceTimersByTimeAsync(0);
  expect(transport.call).toHaveBeenCalledTimes(calls);
  expect({ text: button.textContent, disabled: exit.disabled, dataset: exit.dataset }).toEqual(before);
});

it('review: an old Handle success keeps Profile and does not resend the waiting start', async () => {
  const app = await mounted();
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_create'
    ? { content: [{ type: 'text', text: 'Choose a name' }], isError: true, _meta: { code: 'HANDLE_NEEDED' } }
    : { content: [], _meta: { games: [] } });
  await app.send('kingdown_create', { kind: 'friend', command_id: 'waiting-start' }, { retain: true });
  expect(app.client.state.screen).toBe('handle');
  const pending = app.client.state.pending!;
  expect(pending).toMatchObject({ name: 'kingdown_create', args: { command_id: 'waiting-start' }, error: 'Choose a name' });
  let release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_handle'
    ? new Promise(resolve => { release = resolve; })
    : name === 'kingdown_create' ? { content: [], _meta: { view: { ...game, kind: 'friend', status: 'waiting' } } }
    : { content: [], _meta: { games: [] } });
  const saved = app.call('kingdown_handle', { handle: 'newname', icon: 'spirit' });
  await vi.advanceTimersByTimeAsync(0);
  expect(release).toBeTypeOf('function');
  const creates = transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_create').length;
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'profile' }, _meta: { board_id: 'profile-board' } });
  await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.screen).toBe('profile');
  release({ content: [], _meta: { me: { handle: 'newname', icon: 'spirit' } } });
  await saved; await vi.advanceTimersByTimeAsync(0);
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_create')).toHaveLength(creates);
  expect(app.client.state.screen).toBe('profile');
  expect(app.client.state.pending).toBe(pending);
  expect(app.client.state.pending).toMatchObject({ name: 'kingdown_create', args: { command_id: 'waiting-start' }, error: 'Choose a name' });
  expect(app.memory.me?.handle).toBe('newname');
});

it('keeps a failed start-settings save off the page opened with Back', async () => {
  const app = await mounted(), setup = await import('./screens/setup'); app.navigate('play');
  let leave!: () => void, release!: (value: unknown) => void;
  const exit = { disabled: true, dataset: {}, addEventListener: (_: string, listener: () => void) => { leave = listener; }, removeEventListener() {} };
  Object.assign(document, { querySelectorAll: (selector: string) => selector === '#page-back, [data-screen="play"] [data-nav]' ? [exit] : [] });
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_settings' ? new Promise(resolve => { release = resolve; }) : { content: [], _meta: { games: [] } });
  setup.setupScreen(); const start = document.getElementById('setup-start')!; Reflect.apply(start.onclick!, start, [{}]);
  await vi.advanceTimersByTimeAsync(5001); expect(exit.disabled).toBe(false);
  leave(); app.navigate('profile');
  release({ isError: true, content: [{ type: 'text', text: 'Start settings save failed' }] }); await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.screen).toBe('profile');
  expect((await import('../account-game/state')).messageLine(app.store.page()).text).toBe('');
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_create')).toHaveLength(0);
});

it.each(['casual', 'ranked'] as const)('review: a failed %s Find from Open games keeps its mode, error and Retry there and locks a second Find', async mode => {
  vi.stubEnv('VITE_KINGDOWN_STAGE', 'staging'); // Ranked is offered only in staging (ticket 67).
  const app = await mounted(), { locks, messageLine } = await import('../account-game/state'); app.navigate('lobby');
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_find'
    ? { content: [{ type: 'text', text: 'Lost Find reply' }], isError: true } : { content: [], _meta: { games: [] } });
  await app.start('random', { mode, colour: 'white' }); await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.pending).toMatchObject({ name: 'kingdown_find', args: { mode }, screen: 'lobby', error: 'Lost Find reply' });
  expect(messageLine(app.store.page())).toEqual({ text: 'Lost Find reply', action: 'retry', status: false });
  expect(locks(app.store.page()).retry).toBe(true);
  expect((document.getElementById('find-opponent') as HTMLButtonElement).disabled).toBe(true);
  // Retry sends the same command ID, so the server gives back the first game.
  press('retry'); await vi.advanceTimersByTimeAsync(0);
  const ids = transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_find').map(([input]) => input.arguments.command_id);
  expect(ids).toHaveLength(2); expect(ids[1]).toBe(ids[0]);
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_find').map(([input]) => input.arguments.mode)).toEqual([mode, mode]);
});

it.each(['casual', 'ranked'] as const)('restores a pending %s Find in the lobby over the opposite saved mode without opening Play', async mode => {
  vi.stubEnv('VITE_KINGDOWN_STAGE', 'staging'); // Ranked is offered only in staging (ticket 67).
  const { readSetup } = await import('./screens/setup-model'), { DEFAULT_OPTIONS, RANKED_OPTIONS } = await import('../match/setup');
  const saved = readSetup({ kind: 'random', mode: mode === 'ranked' ? 'casual' : 'ranked', options: DEFAULT_OPTIONS, colour: 'white' });
  const options = mode === 'ranked' ? RANKED_OPTIONS : { ...DEFAULT_OPTIONS, arrangement: false, kingPowers: true };
  const colour = mode === 'ranked' ? 'random' : 'black';
  (window as any).openai.widgetState = { privateContent: { screen: 'lobby', pending: { name: 'kingdown_find', screen: 'lobby', args: { mode, options, colour, command_id: 'lost-find' }, error: 'Lost Find reply' } } };
  transport.call.mockImplementation(async ({ name }) => ({ content: [], _meta: name === 'kingdown_settings' ? { settings: { ...settings, last_setup: saved }, me: { handle: 'player', icon: 'spirit' } } : { games: [] } }));
  const app = await import('./app');
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'home' }, _meta: { board_id: 'board-a' } });
  await vi.advanceTimersByTimeAsync(0);
  const setup = await import('./screens/setup');
  expect(setup.currentSetup()).toMatchObject({ kind: 'random', mode, options, colour });
  expect(app.client.state.screen).toBe('lobby');
});

it('review: a name saved for a lobby Accept goes back to Open games and does not resend an old failed start', async () => {
  const app = await mounted(); app.navigate('play');
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_create' ? { content: [{ type: 'text', text: 'Lost Create reply' }], isError: true }
    : name === 'kingdown_accept' ? { content: [{ type: 'text', text: 'Choose a name' }], isError: true, _meta: { code: 'HANDLE_NEEDED' } }
    : { content: [], _meta: { games: [] } });
  await app.start('solo', { colour: 'white' }); await vi.advanceTimersByTimeAsync(0);
  const pending = app.client.state.pending!;
  expect(pending).toMatchObject({ name: 'kingdown_create', screen: 'play', error: 'Lost Create reply' });
  app.navigate('lobby');
  await app.send('kingdown_accept', { game_id: 'open-a000' });
  expect(app.client.state.screen).toBe('handle'); expect(app.store.page().handle_back).toBe('lobby');
  const creates = transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_create').length;
  transport.call.mockResolvedValue({ content: [], _meta: { me: { handle: 'newname', icon: 'spirit' } } });
  await app.call('kingdown_handle', { handle: 'newname', icon: 'spirit' }); await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.screen).toBe('lobby');
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_create')).toHaveLength(creates);
  expect(app.client.state.pending).toBe(pending); expect(pending.error).toBe('Lost Create reply');
});

it.each(['lobby', 'join'] as const)('keeps the name return after a remount without resending an old start from %s', async screen => {
  let saved: any; (window as any).openai.setWidgetState = (value: any) => { saved = value; };
  const first = await mounted(); first.navigate('play');
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_create' ? { content: [{ type: 'text', text: 'Lost Create reply' }], isError: true }
    : ['kingdown_accept', 'kingdown_join'].includes(name) ? { content: [{ type: 'text', text: 'Choose a name' }], isError: true, _meta: { code: 'HANDLE_NEEDED' } }
    : { content: [], _meta: { games: [] } });
  await first.start('solo', { colour: 'white' }); await vi.advanceTimersByTimeAsync(0);
  const pending = structuredClone(first.client.state.pending!);
  expect(pending).toMatchObject({ name: 'kingdown_create', screen: 'play', error: 'Lost Create reply', error_screen: 'play' });
  first.navigate(screen);
  if (screen === 'join') first.memory.code = 'ABC123';
  await first.send(screen === 'lobby' ? 'kingdown_accept' : 'kingdown_join', screen === 'lobby' ? { game_id: 'open-a000' } : { code: first.memory.code });
  expect(first.client.state.screen).toBe('handle'); expect(first.store.page().handle_back).toBe(screen);
  const restored = structuredClone(saved);
  expect(JSON.stringify(restored)).not.toContain('ABC123');
  first.queue.close(); vi.resetModules(); (window as any).openai.widgetState = restored;
  const app = await mounted();
  expect(app.client.state.screen).toBe('handle');
  transport.call.mockReset().mockResolvedValue({ content: [], _meta: { me: { handle: 'newname', icon: 'spirit' } } });
  await app.call('kingdown_handle', { handle: 'newname', icon: 'spirit' }); await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.screen).toBe(screen);
  expect(transport.call.mock.calls.filter(([input]) => ['kingdown_create', 'kingdown_join', 'kingdown_accept'].includes(input.name))).toHaveLength(0);
  expect(app.client.state.pending).toEqual(pending);
  expect(app.memory.code).toBe('');
});

it('keeps the Join return through a collapse while its reply asks for a name', async () => {
  const app = await mounted(); app.navigate('join');
  let release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_join' ? new Promise(resolve => { release = resolve; }) : { content: [], _meta: { games: [] } });
  const sent = app.send('kingdown_join', { code: 'ABC123' }); await vi.advanceTimersByTimeAsync(0);
  transport.mode = 'inline'; transport.instance.onhostcontextchanged(); await vi.advanceTimersByTimeAsync(0);
  release({ content: [{ type: 'text', text: 'Choose a name' }], isError: true, _meta: { code: 'HANDLE_NEEDED' } }); await sent;
  expect(app.client.state.queued).toBe('handle');
  transport.mode = 'fullscreen'; transport.instance.onhostcontextchanged(); await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.screen).toBe('handle'); expect(app.store.page().handle_back).toBe('join');
  transport.call.mockResolvedValue({ content: [], _meta: { me: { handle: 'newname', icon: 'spirit' } } });
  await app.call('kingdown_handle', { handle: 'newname', icon: 'spirit' }); await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.screen).toBe('join');
});

it('sends the start that needed a name again when Save succeeds, also after a remount', async () => {
  let saved: any; (window as any).openai.setWidgetState = (value: any) => { saved = value; };
  const first = await mounted(); first.navigate('play');
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_create' ? { content: [{ type: 'text', text: 'Choose a name' }], isError: true, _meta: { code: 'HANDLE_NEEDED' } } : { content: [], _meta: { games: [] } });
  await first.start('friend', { colour: 'white' }); await vi.advanceTimersByTimeAsync(0);
  expect(first.client.state.screen).toBe('handle'); expect(first.store.page().handle_back).toBe('play');
  const id = first.client.state.pending!.args.command_id;
  // The remount reads the saved widget state.
  vi.resetModules(); (window as any).openai.widgetState = { privateContent: saved.privateContent };
  const app = await mounted();
  expect(app.client.state.screen).toBe('handle'); expect(app.store.page().handle_back).toBe('play');
  transport.call.mockReset().mockImplementation(async ({ name }) => ({ content: [], _meta: name === 'kingdown_handle' ? { me: { handle: 'newname', icon: 'spirit' } } : name === 'kingdown_create' ? { view: { ...game, kind: 'friend', status: 'waiting' } } : { games: [] } }));
  await app.call('kingdown_handle', { handle: 'newname', icon: 'spirit' }); await vi.advanceTimersByTimeAsync(0);
  const resent = transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_create');
  expect(resent).toHaveLength(1); expect(resent[0][0].arguments.command_id).toBe(id);
});

it('selects a shared hall row through Resume and keeps its board pointer', async () => {
  const app = await mounted(); app.navigate('play');
  transport.call.mockImplementation(async ({ name }) => ({ content: [], _meta: name === 'kingdown_resume' ? { board_id: 'selected-board', view: game } : { games: [] } }));
  const open = transport.rows.mock.calls.at(-1)![2]; open(game.game_id);
  await vi.advanceTimersByTimeAsync(0);
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_resume').map(([input]) => input.arguments)).toEqual([{ game_id: game.game_id, board_id: 'board-a' }]);
  expect(app.client.state.board_id).toBe('selected-board'); expect(app.memory.view).toMatchObject(game); expect(app.client.state.screen).toBe('board');
});
it.each(['success', 'error'] as const)('keeps a new mount after a shared hall selection returns an old %s', async result => {
  const app = await mounted(); app.navigate('play'); let release!: (result: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_resume' ? new Promise(resolve => { release = resolve; }) : { content: [], _meta: { games: [] } });
  transport.rows.mock.calls.at(-1)![2](game.game_id); await vi.advanceTimersByTimeAsync(0);
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'profile' }, _meta: { board_id: 'new-board', games: [] } });
  await vi.advanceTimersByTimeAsync(0);
  release(result === 'success' ? { content: [], _meta: { board_id: 'old-board', view: game } } : { isError: true, content: [{ type: 'text', text: 'Old error' }] });
  await vi.advanceTimersByTimeAsync(0);
  expect(app.client.state.screen).toBe('profile'); expect(app.client.state.board_id).toBe('new-board');
  expect(app.store.page().notice).toBeUndefined(); expect(app.memory.view).toBeUndefined();
});
it.each(['valid', 'expired', 'absent'] as const)('keeps the friend row decoration for a %s invite', async kind => {
  const app = await mounted(), { friendInvites } = await import('./invite');
  const line = { prepend: vi.fn() }, button = { dataset: { gameId: game.game_id }, parentElement: null, querySelector: () => line, replaceWith: vi.fn() };
  const made: any[] = [];
  vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) => (selector === '#games-list [data-game-id]' ? [button] : []) as any);
  vi.spyOn(document, 'createElement').mockImplementation(() => {
    const el = { ...node(), append: vi.fn(), setAttribute: vi.fn() }; made.push(el); return el as any;
  });
  if (kind !== 'absent') friendInvites.set(game.game_id, { code: 'K7QX2M', expires_at: new Date(Date.now() + (kind === 'valid' ? 60_000 : -1)).toISOString() });
  app.memory.games = [{ ...game, status: 'waiting', kind: 'friend' } as any]; app.renderGameRows();
  expect(button.replaceWith).toHaveBeenCalledTimes(kind === 'valid' ? 1 : 0);
  if (kind === 'valid') {
    expect(line.prepend).toHaveBeenCalledWith('K7QX2M · ');
    const share = made.find(el => el.textContent === 'Share'); expect(share.setAttribute).toHaveBeenCalledWith('aria-label', 'Share game K7QX2M');
    const send = vi.fn(async () => {}); vi.stubGlobal('navigator', { share: send }); share.onclick(); await vi.advanceTimersByTimeAsync(0);
    expect(send).toHaveBeenCalledExactlyOnceWith({ text: 'Join King Down game K7QX2M. Rules: Standard pieces.' });
  }
  vi.restoreAllMocks(); friendInvites.clear();
});
it('keeps shared hall selection behind a write in the plugin lane', async () => {
  const app = await mounted(); app.navigate('play'); let release!: (result: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_settings' ? new Promise(resolve => { release = resolve; })
    : { content: [], _meta: name === 'kingdown_resume' ? { view: game, board_id: 'selected-board' } : { games: [] } });
  const write = app.send('kingdown_settings', { show_threats: true }); await vi.advanceTimersByTimeAsync(0);
  transport.rows.mock.calls.at(-1)![2](game.game_id); await vi.advanceTimersByTimeAsync(0);
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_resume')).toHaveLength(0);
  release({ content: [], _meta: { settings } }); await write; await vi.advanceTimersByTimeAsync(0);
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_resume')).toHaveLength(1);
  expect(app.client.state.board_id).toBe('selected-board'); expect(app.client.state.screen).toBe('board');
});


it.each(['engine-a', 'engine-b', undefined, null])('refreshes a same-revision seat projection with engine identity %s', async engine_fingerprint => {
  const app = await mounted();
  const base = { ...game, engine_fingerprint: 'engine-a', rules: {}, fen: '' } as View;
  transport.call.mockImplementation(async ({ name }) => ({ content: [], _meta: name === 'kingdown_get' ? { view: base } : { games: [] } }));
  await app.call('kingdown_get', {}, false);
  app.routeView(base);
  transport.draw.mockClear();
  const next = { ...base, engine_fingerprint };
  transport.call.mockImplementation(async ({ name }) => ({ content: [], _meta: name === 'kingdown_get' ? { view: next } : { games: [] } }));
  await app.call('kingdown_get', {}, false, true);
  expect(app.memory.view?.engine_fingerprint).toBe(engine_fingerprint);
  expect(transport.draw.mock.calls.at(-1)?.[0]).toEqual(next);
});

// Privacy settings do not increment the game revision. A delta read may omit every old command.
it.each([{ last_commands: [] }, { last_commands: [{ seq: 1, seat: 1, at: '2026-10-20T00:00:00Z', action: { type: 'hidden' } }] }])('replaces cached private commands on an equal-revision poll: %j', async ({ last_commands }) => {
  const app = await mounted();
  const base = { ...game, engine_fingerprint: 'engine-a', rules: {}, fen: '', last_commands: [{ seq: 1, seat: 1, at: '2026-10-20T00:00:00Z', action: { type: 'say', preset: 'hello' } }] } as unknown as View;
  transport.call.mockResolvedValue({ content: [], _meta: { view: base } });
  await app.call('kingdown_get', {}, false);
  const next = { ...base, last_commands } as View;
  transport.call.mockResolvedValue({ content: [], _meta: { view: next } });
  await app.call('kingdown_get', {}, false, true);
  expect(app.memory.view?.last_commands).toEqual(last_commands);
  expect(transport.draw.mock.calls.at(-1)?.[0].last_commands).toEqual(last_commands);
  expect(JSON.stringify(app.memory.view)).not.toContain('hello');
});


it('updates a waiting friend screen when a same-revision poll reports a replaced invite', async () => {
  const app = await mounted(), { friendInvites } = await import('./invite');
  const waiting = { ...game, status: 'waiting', invite_id: 'old' } as View;
  friendInvites.set(game.game_id, { code: 'ABC234', invite_id: 'old', expires_at: new Date(Date.now() + 60_000).toISOString() });
  transport.call.mockResolvedValue({ content: [], _meta: { view: waiting } });
  await app.send('kingdown_resume', { game_id: game.game_id });
  expect(document.getElementById('friend-actions')!.hidden).toBe(false);
  document.getElementById('friend-copy-status')!.textContent = 'Copied';
  await transport.target().read();
  expect(document.getElementById('friend-copy-status')!.textContent).toBe('Copied');
  transport.call.mockResolvedValue({ content: [], _meta: { view: { ...waiting, invite_id: 'new' } } });
  await transport.target().read();
  expect(app.memory.view?.revision).toBe(game.revision);
  expect(document.getElementById('friend-actions')!.hidden).toBe(true);
  expect(document.getElementById('friend-help')!.textContent).toContain('replaced');
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_invite')).toHaveLength(0);
});

it('invalidates a cached code when the accepted Menu list reports a replacement', async () => {
  const app = await mounted(), { friendInvites } = await import('./invite');
  const saved = { code: 'ABC234', invite_id: 'old', expires_at: new Date(Date.now() + 60_000).toISOString() };
  friendInvites.set(game.game_id, saved);
  transport.call.mockResolvedValue({ content: [], _meta: { games: [{ ...game, status: 'waiting', invite_id: 'new' }] } });
  app.memory.dirty = true; app.navigate('play'); await vi.advanceTimersByTimeAsync(0);
  expect(saved).toHaveProperty('replaced', true);
});

it('ignores a pre-renewal read that returns after a new invite succeeds', async () => {
  const app = await mounted(), { friendInvites } = await import('./invite');
  const waiting = { ...game, status: 'waiting', invite_id: 'old' } as View;
  app.memory.games = [waiting as any];
  transport.call.mockResolvedValue({ content: [], _meta: { view: waiting } });
  await app.send('kingdown_resume', { game_id: game.game_id });
  let release!: (value: unknown) => void;
  const fresh = { code: 'NEW234', invite_id: 'new', expires_at: new Date(Date.now() + 60_000).toISOString() };
  transport.call.mockImplementation(({ name }) => name === 'kingdown_get' ? new Promise(resolve => { release = resolve; }) : Promise.resolve({ content: [], structuredContent: fresh }));
  const read = transport.target().read(); await vi.advanceTimersByTimeAsync(0);
  document.getElementById('friend-new')!.onclick!({} as any); await vi.advanceTimersByTimeAsync(0);
  release({ content: [], _meta: { view: waiting } }); await read;
  expect(friendInvites.get(game.game_id)).toEqual(fresh);
  expect(document.getElementById('friend-actions')!.hidden).toBe(false);
});
