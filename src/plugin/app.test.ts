import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { View } from '../match/protocol';
import { createRouter } from './router';

const transport = vi.hoisted(() => ({ call: vi.fn(), instance: undefined as any, target: undefined as any, draw: vi.fn(), mode: 'fullscreen' }));
vi.mock('@modelcontextprotocol/ext-apps', () => ({ App: class {
  constructor() { transport.instance = this; }
  connect = async () => {};
  getHostContext = () => ({ displayMode: transport.mode });
  callServerTool = transport.call;
  sendSizeChanged = async () => {};
} }));
vi.mock('./art', () => ({ art: (path: string) => path }));
vi.mock('./games-list', () => ({ gamesList() {}, gameTitle: () => 'Game', waitingLine: () => 'Waiting' }));
vi.mock('../account/profile', () => ({ ICONS: {}, handleProblem: () => undefined }));
vi.mock('./board-view', () => ({ setSettings: async () => {} }));
vi.mock('../render/sfx', () => ({ setSound: () => {}, snd: {} }));
vi.mock('./poll', () => ({ runPoll: (target: unknown) => { transport.target = target; return { update() {}, stop() {} }; } }));
vi.mock('./screens/board', () => ({ boardScreen: () => transport.draw, rollbackBoardMove: async () => {} }));
vi.mock('./screens/join', () => ({ joinScreen() {}, joinSync() {} }));
vi.mock('./screens/wait', () => ({ finishHandoff() {}, waitPoll() {}, waitScreen() {}, waitSync() {} }));
vi.mock('./screens/lobby', () => ({ lobbyPoll() {}, lobbyScreen() {}, lobbySync() {} }));
vi.mock('./screens/seat', () => ({ finishSeat() {}, seatScreen() {}, seatSync() {} }));
vi.mock('./screens/end', () => ({ endPoll() {}, endSync() {}, endScreen() {} }));
vi.mock('./screens/profile', () => ({ profileScreen() {} }));
vi.mock('./screens/collection', () => ({ collectionScreen() {} }));

// The app uses the real client, queue, router and notice store. These nodes replace only the display.
function node() {
  return { dataset: {}, style: { setProperty() {} }, textContent: '', innerHTML: '', value: '', disabled: false, hidden: false,
    querySelectorAll: () => [], querySelector: () => node(), closest: () => node(),
    setAttribute() {}, removeAttribute() {}, replaceChildren() {}, append() {}, matches: () => false, hasAttribute: () => false };
}
beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers();
  const nodes = new Map<string, ReturnType<typeof node>>();
  vi.stubGlobal('document', { body: node(), documentElement: node(), querySelectorAll: () => [], createElement: node, createTextNode: (text: string) => text,
    getElementById: (id: string) => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); } });
  vi.stubGlobal('window', { openai: { setWidgetState() {} } });
  vi.stubGlobal('navigator', {});
  vi.stubGlobal('localStorage', { getItem: () => null });
  vi.stubGlobal('addEventListener', vi.fn());
  transport.mode = 'fullscreen'; transport.draw.mockClear();
  transport.call.mockReset().mockResolvedValue({ content: [], _meta: { games: [] } });
});

const game = { game_id: 'game-a000', revision: 1, status: 'playing', kind: 'friend' } as View;
const settings = { symbols_only: false, show_threats: false, show_online: false, last_setup: null };
const receipt = () => ({ name: 'kingdown_move', args: { command_id: 'lost', expected_revision: 1, actions: ['e2-e4'] }, game_tag: 'game-a00', screen: 'board' as const, error: 'Lost reply' });
async function mounted() {
  const app = await import('./app');
  app.memory.settings = settings; app.memory.me = { handle: 'player', icon: 'spirit' };
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'home' }, _meta: { board_id: 'board-a' } });
  await vi.advanceTimersByTimeAsync(0);
  return app;
}

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
  expect((await import('./state')).messageLine(app.store.page()).action).toBe('retry');
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

it.each(['teardown', 'profile', 'other game'])('sends no Seen after a held poll leaves its target by %s', async change => {
  const app = await mounted(); app.routeView(game);
  let release!: (value: unknown) => void;
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_get'
    ? new Promise(resolve => { release = resolve; }) : { content: [], _meta: { games: [] } });
  const poll = transport.target().read(); await vi.advanceTimersByTimeAsync(0);
  if (change === 'teardown') await transport.instance.onteardown();
  else if (change === 'profile') app.navigate('profile');
  else app.routeView({ ...game, game_id: 'game-b000' });
  release({ content: [], _meta: { view: { ...game, revision: 2 } } }); await poll; await vi.advanceTimersByTimeAsync(0);
  expect(transport.call.mock.calls.filter(([input]) => input.name === 'kingdown_seen')).toEqual([]);
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

it('uses the saved king when the inline mount resends Create', async () => {
  transport.mode = 'inline';
  const pending = { name: 'kingdown_create', args: { kind: 'solo', command_id: 'once' }, screen: 'play', quick: true };
  (window as any).openai.widgetState = { privateContent: { screen: 'home', queued: 'play', pending } };
  const { readSetup } = await import('./screens/setup-model');
  const saved = readSetup(null); saved.options = { ...saved.options, cards: false, kingPowers: true, arrangement: false }; saved.king = { king: 'Flame', power: 'Haste' };
  const created = { ...game, kind: 'solo', status: 'setup', seat: 0, draw: 'RNBQKBNR', options: saved.options };
  transport.call.mockImplementation(async ({ name }) => ({ content: [], _meta: name === 'kingdown_settings'
    ? { settings: { ...settings, last_setup: saved }, me: { handle: 'player', icon: 'spirit' } }
    : name === 'kingdown_create' ? { view: created }
    : name === 'kingdown_choose' ? { view: { ...created, status: 'playing', revision: 2, rules: {} } } : { games: [] } }));
  const app = await import('./app');
  transport.instance.ontoolresult({ content: [], structuredContent: { screen: 'home' }, _meta: { board_id: 'board-a' } });
  await vi.advanceTimersByTimeAsync(0);
  expect(transport.call.mock.calls.find(([input]) => input.name === 'kingdown_choose')?.[0].arguments.king).toEqual(saved.king);
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

it('scopes a refused Retry to the game ID restored after a remount', async () => {
  (window as any).openai.widgetState = { privateContent: { screen: 'board', pending: { name: 'kingdown_move', args: { command_id: 'saved', expected_revision: 0 }, game_tag: 'game-a00', screen: 'board', error: 'Lost reply' } } };
  const app = await import('./app');
  app.routeView({ game_id: 'game-a000', status: 'playing' } as View);
  transport.call.mockImplementation(async ({ name }) => name === 'kingdown_move'
    ? { content: [{ type: 'text', text: 'The game changed' }], isError: true, _meta: { code: 'STALE_REVISION' } }
    : { content: [] });
  await app.send('kingdown_move', app.client.state.pending!.args, { retry: true, retain: true });
  expect(app.store.refusal()).toMatchObject({ game: 'game-a000', code: 'STALE_REVISION' });
  const { messageLine } = await import('./state');
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
