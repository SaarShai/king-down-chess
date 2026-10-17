import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { View } from '../match/protocol';
import { createRouter } from './router';

const transport = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('@modelcontextprotocol/ext-apps', () => ({ App: class {
  connect = async () => {};
  getHostContext = () => ({ displayMode: 'fullscreen' });
  callServerTool = transport.call;
  sendSizeChanged = async () => {};
} }));
vi.mock('./art', () => ({ art: (path: string) => path }));
vi.mock('../account/profile', () => ({ ICONS: {}, handleProblem: () => undefined }));
vi.mock('./board-view', () => ({ setSettings: async () => {} }));
vi.mock('../render/sfx', () => ({ setSound: () => {}, snd: {} }));
vi.mock('./poll', () => ({ runPoll: () => ({ update() {}, stop() {} }) }));
vi.mock('./screens/board', () => ({ boardScreen: () => () => {}, rollbackBoardMove: async () => {} }));
vi.mock('./screens/setup', () => ({ finishStart: async () => {}, draftFromGame() {}, playNow() {}, quickStart: () => false, setupBusy: () => false, setupStarting: () => false, setupScreen() {}, setupSync() {} }));
vi.mock('./screens/friend', () => ({ friendScreen() {} }));
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
    setAttribute() {}, removeAttribute() {}, replaceChildren() {}, matches: () => false, hasAttribute: () => false };
}
beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers();
  const nodes = new Map<string, ReturnType<typeof node>>();
  vi.stubGlobal('document', { body: node(), documentElement: node(), querySelectorAll: () => [],
    getElementById: (id: string) => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); } });
  vi.stubGlobal('window', { openai: { setWidgetState() {} } });
  vi.stubGlobal('navigator', {});
  vi.stubGlobal('localStorage', { getItem: () => null });
  transport.call.mockReset().mockResolvedValue({ content: [], _meta: { games: [] } });
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
