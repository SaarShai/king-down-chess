import { describe, expect, it, vi } from 'vitest';
import { createClient, BOARD_ID_TOOLS, type WidgetHost } from './client';

describe('app client', () => {
  it.each([null, { king: 'Flame', power: 'Haste' } as const])('keeps the start king through a widget save and remount: %s', king => {
    const host: WidgetHost = { setWidgetState: state => { host.widgetState = state as NonNullable<WidgetHost['widgetState']>; } };
    const client = createClient({ callServerTool: async () => ({ content: [] }) }, host);
    client.state.pending = { name: 'kingdown_create', args: { kind: 'solo', command_id: 'once' }, king };
    client.save();
    expect(createClient({ callServerTool: async () => ({ content: [] }) }, host).state.pending?.king).toEqual(king);
  });
  it('limits commands to 10 seconds, leaves mount reads to the SDK limit and passes a mount\'s abort signal', async () => {
    const callServerTool = vi.fn(async () => ({ content: [] }));
    const client = createClient({ callServerTool }), { signal } = new AbortController();
    await client.call('kingdown_move', { command_id: 'once' });
    await client.call('kingdown_settings', {}, { limit: false });
    await client.call('kingdown_open', {}, { limit: false, signal });
    expect(callServerTool.mock.calls).toEqual([[{ name: 'kingdown_move', arguments: { command_id: 'once' } }, { timeout: 10_000 }], [{ name: 'kingdown_settings', arguments: {} }, {}], [{ name: 'kingdown_open', arguments: {} }, { signal }]]);
  });
  it.each([
    ['kingdown_settings', { last_setup: {} }, 'ProtocolError: Failed to fetch'],
    ['kingdown_find', {}, 'TypeError: NetworkError when attempting to fetch resource.'],
    ['kingdown_join', { preview: true }, 'Load failed'],
    ['kingdown_move', { command_id: 'once' }, 'MCP error -32001: Request timed out'],
    ['kingdown_accept', { game_id: 'g' }, 'Failed to fetch'],
    ['kingdown_get', {}, 'McpError: MCP error -32001: Request timed out'],
  ])('maps a connection failure for %s to one sentence and keeps its diagnostic', async (name, args, message) => {
    const error = new Error(message);
    const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const client = createClient({ callServerTool: async () => { throw error; } });
      // The exact words: toThrow with a missing or empty sentence would pass any error.
      await expect(client.call(name as string, args as Record<string, unknown>)).rejects.toThrow(new Error('Cannot connect. Check your connection, then try again.'));
      expect(diagnostic).toHaveBeenCalledWith('King Down connection failed', error);
    } finally { diagnostic.mockRestore(); }
  });
  it('keeps other tool errors intact', async () => {
    const error = new Error('The game is not available.');
    const client = createClient({ callServerTool: async () => { throw error; } });
    await expect(client.call('kingdown_join')).rejects.toBe(error);
  });
  it('restores the screen and pending command without putting the command in model context', () => {
    const pending = { name: 'kingdown_move', args: { game_id: 'aabbccdd-1122-4455-8899-aabbccddeeff', lan: 'e2-e4', command_id: 'once' } };
    const saved = { privateContent: { screen: 'settings' as const, sheet: 'king', game_id: 'aabbccdd-1122-4455-8899-aabbccddeeff', board_id: 'b1', pending } };
    let widgetState: unknown;
    const client = createClient({ callServerTool: async () => ({ content: [] }) }, { widgetState: saved, setWidgetState: state => { widgetState = state; } });
    expect(client.state).toEqual({ screen: 'settings', sheet: 'king', board_id: 'b1', pending });
    client.save();
    expect(widgetState).toEqual({ modelContent: {}, privateContent: { screen: 'settings', sheet: 'king', board_id: 'b1', pending: { name: 'kingdown_move', args: { lan: 'e2-e4', command_id: 'once' }, game_tag: 'aabbccdd' } } });
    expect((widgetState as { modelContent: object }).modelContent).not.toHaveProperty('pending');
  });
  it('counts the transport calls that have not returned', async () => {
    const releases: Array<(value: { content: [] }) => void> = [];
    const client = createClient({ callServerTool: async () => new Promise(resolve => { releases.push(resolve); }) });
    expect(client.inflight).toBe(0);
    const first = client.call('kingdown_get', {}), second = client.call('kingdown_open', {});
    expect(client.inflight).toBe(2);
    releases[0]({ content: [] }); await first;
    expect(client.inflight).toBe(1);
    releases[1]({ content: [] }); await second;
    expect(client.inflight).toBe(0);
    // A failed call also leaves the count: the caller must not wait forever.
    const failing = createClient({ callServerTool: async () => { throw new Error('The game is not available.'); } });
    await expect(failing.call('kingdown_get', {})).rejects.toThrow('The game is not available.');
    expect(failing.inflight).toBe(0);
  });
  it('sends at most three calls at once, the oldest waiting call next, and drops a waiting call that its mount aborts', async () => {
    // The server refuses a fourth call of one account (http.ts): a reopened Lobby or Profile, a poll or a repeated tap waits here.
    const sent: string[] = [], releases: Array<(value: { content: [] }) => void> = [];
    const client = createClient({ callServerTool: async ({ name }) => new Promise(resolve => { sent.push(name); releases.push(resolve); }) });
    const mount = new AbortController();
    const [first, , third, aborted, last] = ['kingdown_lobby', 'kingdown_games', 'kingdown_lobby', 'kingdown_games', 'kingdown_profile']
      .map((name, index) => client.call(name, {}, index === 3 ? { signal: mount.signal } : {}));
    await Promise.resolve();
    expect(sent).toEqual(['kingdown_lobby', 'kingdown_games', 'kingdown_lobby']);
    expect(client.inflight).toBe(5);
    mount.abort();
    await expect(aborted).rejects.toMatchObject({ name: 'AbortError' });
    releases[2]({ content: [] }); await third;
    expect(sent).toEqual(['kingdown_lobby', 'kingdown_games', 'kingdown_lobby', 'kingdown_profile']);
    releases[0]({ content: [] }); await first;
    const late = client.call('kingdown_get');
    await Promise.resolve();
    expect(sent).toHaveLength(5);
    for (const release of releases.slice(1)) release({ content: [] });
    await Promise.all([last, late]);
    expect(client.inflight).toBe(0);
  });
  it('reads a saved screen name that this build does not have as no screen, and a saved setup command as Play', () => {
    // PR 57 widget state: its New game screen was 'setup'.
    const pending = { name: 'kingdown_create', args: { kind: 'solo', command_id: 'once' }, screen: 'setup', error: 'The reply was lost.', error_screen: 'setup' };
    const saved = { privateContent: { screen: 'setup', settings_back: 'setup', queued: 'setup', board_id: 'b1', pending } } as unknown as NonNullable<WidgetHost['widgetState']>;
    const client = createClient({ callServerTool: async () => ({ content: [] }) }, { widgetState: saved });
    expect(client.state).toStrictEqual({ screen: 'home', sheet: undefined, board_id: 'b1', pending: { ...pending, screen: 'play', error_screen: 'play' } });
    expect(createClient({ callServerTool: async () => ({ content: [] }) }, { widgetState: { privateContent: { screen: 'seat', settings_back: 'board', queued: 'end' } } }).state).toMatchObject({ screen: 'seat', settings_back: 'board', queued: 'end' });
  });
  it('reads a saved Collection page as Profile, because the Collection is parked', () => {
    const pending = { name: 'kingdown_get', args: {}, screen: 'collection', error_screen: 'collection' };
    const saved = { privateContent: { screen: 'collection', handle_back: 'collection', settings_back: 'collection', queued: 'collection', pending } } as unknown as NonNullable<WidgetHost['widgetState']>;
    const client = createClient({ callServerTool: async () => ({ content: [] }) }, { widgetState: saved });
    expect(client.state).toMatchObject({ screen: 'profile', handle_back: 'profile', settings_back: 'profile', queued: 'profile', pending: { screen: 'profile', error_screen: 'profile' } });
  });
  it('reads and writes settings through the account tool without saving them in widget state', async () => {
    const requests: unknown[] = [];
    const settings = { symbols_only: true, show_threats: true, last_setup: null };
    const me = { handle: 'stone_saar', icon: 'knight' };
    const client = createClient({ callServerTool: async request => { requests.push(request); return { content: [], _meta: { settings, me } }; } });
    expect((await client.call('kingdown_settings'))._meta).toEqual({ settings, me });
    await client.call('kingdown_settings', { symbols_only: false });
    expect(requests).toEqual([{ name: 'kingdown_settings', arguments: {} }, { name: 'kingdown_settings', arguments: { symbols_only: false } }]);
    expect(client.state).not.toHaveProperty('settings');
  });
  it('keeps the Play now marker when a pending start mounts again', () => {
    let widgetState: any;
    const app = { callServerTool: async () => ({ content: [] }) };
    const pending = { name: 'kingdown_create', args: { kind: 'solo', level: 'beginner', command_id: 'once' }, screen: 'play' as const, quick: true };
    const client = createClient(app, { widgetState: { privateContent: { screen: 'play', pending } }, setWidgetState: state => { widgetState = state; } });
    client.save();
    expect(createClient(app, { widgetState }).state.pending).toEqual(pending);
    expect(widgetState.modelContent).toEqual({});
  });
});

it('binds foreground tools and leaves background reads outside the board', async () => {
  const requests: unknown[] = [];
  const client = createClient({ callServerTool: async request => { requests.push(request); return { content: [], _meta: { board_id: 'reply', view: { game_id: 'other' } } }; } });
  client.state.board_id = 'board';
  client.state.pending = { name: 'kingdown_create', args: { kind: 'solo' } };
  await client.call('kingdown_get', { game_id: 'other', board_id: 'unwanted' }, { background: true });
  expect(requests).toEqual([{ name: 'kingdown_get', arguments: { game_id: 'other' } }]);
  expect(client.state).toMatchObject({ board_id: 'board', pending: { name: 'kingdown_create' } });
  expect(BOARD_ID_TOOLS).toEqual(['kingdown_get', 'kingdown_create', 'kingdown_join', 'kingdown_resume', 'kingdown_find', 'kingdown_accept']);
  for (const name of BOARD_ID_TOOLS) { client.state.board_id = 'board'; await client.call(name, { game_id: 'game' }); expect(requests.at(-1)).toEqual({ name, arguments: { game_id: 'game', board_id: 'board' } }); }
  client.state.board_id = 'board'; await client.call('kingdown_rematch', { game_id: 'old' });
  expect(requests.at(-1)).toEqual({ name: 'kingdown_rematch', arguments: { game_id: 'old' } });
  expect(client.state.board_id).toBe('board');
});

it('saves only a short game tag and safe pending args while page memory keeps the full call', () => {
  let widgetState: any;
  const game_id = 'aabbccdd-1122-4455-8899-aabbccddeeff';
  const client = createClient({ callServerTool: async () => ({ content: [] }) }, { setWidgetState: state => { widgetState = state; } });
  const pending = { name: 'kingdown_join', args: { game_id, code: 'K7QX2M', handle: 'private_name', command_id: 'once', expected_revision: 3 } };
  Object.assign(pending, { game_id });
  client.state.board_id = '11223344-5566-4788-99aa-bbccddeeff00'; client.state.pending = pending;
  client.save();
  expect(widgetState.privateContent.pending).toEqual({ name: 'kingdown_join', game_tag: 'aabbccdd', args: { command_id: 'once', expected_revision: 3 } });
  expect(client.state.pending).toBe(pending);
  expect(client.state.pending.args).toEqual(pending.args);
  const modelState = JSON.stringify({ ...widgetState, privateContent: { ...widgetState.privateContent, board_id: undefined } });
  expect(modelState).not.toMatch(/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/i);
  expect(modelState).not.toContain('K7QX2M'); expect(modelState).not.toContain('private_name');
});

it('keeps the complete draft scope private and apart from the pending command', () => {
  let widgetState: any;
  const game_id = 'aabbccdd-1122-4455-8899-aabbccddeeff', board_id = '11223344-5566-4788-99aa-bbccddeeff00';
  const client = createClient({ callServerTool: async () => ({ content: [] }) }, { setWidgetState: state => { widgetState = state; } });
  client.state.board_id = board_id;
  client.state.draft = { game_tag: game_id.slice(0, 8), fen: '7k/8/8/8/8/8/P7/K7 w - - 0 1', lans: ['a2-a4'], scope: { account: board_id, game: game_id, revision: 7, rules: '{}', engine: 'engine-a' } };
  client.state.pending = { name: 'kingdown_move', args: { game_id, command_id: 'once', actions: ['a2-a4'] } };
  client.save();
  expect(widgetState.privateContent.draft).toEqual(client.state.draft);
  expect(widgetState.privateContent.draft.scope).toEqual({ account: board_id, game: game_id, revision: 7, rules: '{}', engine: 'engine-a' });
  expect(widgetState.modelContent).toEqual({});
  // The draft comes back at start, and it stays apart from the pending command.
  const restored = createClient({ callServerTool: async () => ({ content: [] }) }, { widgetState });
  expect(restored.state.draft).toEqual(client.state.draft);
  expect(restored.state.pending).toEqual({ name: 'kingdown_move', args: { command_id: 'once', actions: ['a2-a4'] }, game_tag: 'aabbccdd' });
  // An older draft cannot prove its account, full game, revision or rules.
  const older = createClient({ callServerTool: async () => ({ content: [] }) }, { widgetState: { privateContent: { screen: 'board', draft: { game_tag: 'aa', fen: 'f', lans: [1, 2] } } } as any });
  expect(older.state.draft).toBeUndefined();
});

it('reads complete private games and views through the typed adapter', async () => {
  const { pluginGameClient } = await import('./client'), { createQueue } = await import('./queue');
  const games = [{ game_id: 'full-id', options: { cards: true }, created_at: 'now' }];
  const view = { game_id: 'full-id', revision: 4, rules: { kings: [] }, opponent: { handle: 'friend' }, server_now: 'now' };
  const callServerTool = vi.fn(async () => ({ content: [], structuredContent: { games: ['short'] }, _meta: { games } }));
  const send = vi.fn(async () => ({ status: 'done' as const, result: { content: [], structuredContent: { game: 'short' }, _meta: { view } } }));
  const client = pluginGameClient(createClient({ callServerTool }), createQueue(), send), { signal } = new AbortController();
  expect(await client.games(signal)).toBe(games); expect(await client.game('full-id', signal)).toBe(view);
  expect(callServerTool).toHaveBeenCalledExactlyOnceWith({ name: 'kingdown_games', arguments: {} }, { timeout: 10_000, signal });
  expect(send).toHaveBeenCalledExactlyOnceWith('kingdown_resume', { game_id: 'full-id' }, { route: false, signal });
});
it('keeps the mount timeout rule and rejects an old list after a new epoch', async () => {
  const { pluginGameClient } = await import('./client'), { createQueue } = await import('./queue');
  let release!: (value: { content: [] }) => void;
  const callServerTool = vi.fn(async () => new Promise<{ content: [] }>(resolve => { release = resolve; }));
  const queue = createQueue(), mount = queue.chatResult(true), { signal } = new AbortController();
  const read = pluginGameClient(createClient({ callServerTool }), queue, vi.fn()).games(signal);
  expect(callServerTool).toHaveBeenCalledExactlyOnceWith({ name: 'kingdown_games', arguments: {} }, { signal });
  queue.chatResult();
  await expect(read).rejects.toMatchObject({ name: 'AbortError' });
  expect(queue.current(mount)).toBe(false); release({ content: [] });
});
it.each(['games', 'game'] as const)('keeps service errors, transport errors and aborts in %s', async method => {
  const { pluginGameClient } = await import('./client'), { createQueue } = await import('./queue');
  const callServerTool = vi.fn().mockResolvedValue({ isError: true, content: [{ type: 'text', text: 'No game' }], _meta: { code: 'NOT_FOUND' } });
  const send = vi.fn().mockResolvedValue({ status: 'failed', code: 'NOT_FOUND', text: 'No game' });
  const client = pluginGameClient(createClient({ callServerTool }), createQueue(), send), abort = new AbortController();
  const read = () => method === 'games' ? client.games(abort.signal) : client.game('full-id', abort.signal);
  await expect(read()).rejects.toMatchObject({ name: 'GameReadError', code: 'NOT_FOUND', message: 'No game' });
  callServerTool.mockRejectedValue(new Error('Transport lost')); send.mockResolvedValue({ status: 'failed', text: 'Transport lost' });
  await expect(read()).rejects.toMatchObject({ code: 'UNAVAILABLE', message: 'Transport lost' });
  abort.abort(); await expect(read()).rejects.toMatchObject({ name: 'AbortError' });
  expect(callServerTool).toHaveBeenCalledTimes(method === 'games' ? 2 : 0); expect(send).toHaveBeenCalledTimes(method === 'game' ? 2 : 0);
});

it('does not send a call with an already aborted signal', async () => {
  const callServerTool = vi.fn(), client = createClient({ callServerTool }), abort = new AbortController();
  abort.abort(); await expect(client.call('kingdown_resume', {}, { signal: abort.signal })).rejects.toMatchObject({ name: 'AbortError' });
  expect(callServerTool).not.toHaveBeenCalled(); expect(client.inflight).toBe(0);
});

it('drops a private draft before saving a newly selected board ownership scope', () => {
  let widgetState: any;
  const client = createClient({ callServerTool: async () => ({ content: [] }) }, { setWidgetState: state => { widgetState = state; } });
  client.state.board_id = 'old-board';
  client.state.draft = { game_tag: 'aabbccdd', fen: 'f', lans: ['a2-a4'], scope: { account: 'old-board', game: 'aabbccdd-1122-4455-8899-aabbccddeeff', revision: 7, rules: '{}', engine: 'engine-a' } };
  client.save();
  expect(widgetState.privateContent.draft).toEqual(client.state.draft);
  client.state.board_id = 'new-board';
  client.save();
  expect(widgetState.privateContent.draft).toBeUndefined();
  expect(client.state.draft).toBeUndefined();
});

it('keeps browser drafts scoped to the signed-in account when its board binding changes', () => {
  let saved: any;
  const client = createClient({ callServerTool: async () => ({ content: [] }) }, { accountId: 'signed-in-account', savePage: state => { saved = structuredClone(state); } });
  client.state.board_id = 'old-board';
  const draft = { game_tag: 'aabbccdd', fen: 'f', lans: ['a2-a4'], scope: { account: 'signed-in-account', game: 'aabbccdd-1122-4455-8899-aabbccddeeff', revision: 7, rules: '{}', engine: 'engine-a' } };
  client.state.draft = draft;
  client.state.board_id = 'new-board';
  client.save();
  expect(saved.draft).toEqual(draft);
});

it('does not persist an unscoped draft after a board binding changes', () => {
  let widgetState: any;
  const client = createClient({ callServerTool: async () => ({ content: [] }) }, { setWidgetState: state => { widgetState = state; } });
  client.state.board_id = 'old-board';
  client.state.draft = { game_tag: 'aabbccdd', fen: 'old-fen', lans: ['a2-a4'] };
  client.state.board_id = 'new-board';
  client.save();
  expect(widgetState.privateContent.draft).toBeUndefined();
  expect(client.state.draft).toBeUndefined();
});

it.each([undefined, '', 7])('discards an older scoped draft with no engine implementation on hydrate and save: %s', engine => {
  const draft = { game_tag: 'aabbccdd', fen: 'old-fen', lans: ['a2-a4'], scope: { account: 'account-a', game: 'aabbccdd-game', revision: 7, rules: '{}', engine } };
  let saved: any;
  const host: WidgetHost = { accountId: 'account-a', widgetState: { privateContent: { screen: 'board', draft } } as any, savePage: state => { saved = structuredClone(state); } };
  const client = createClient({ callServerTool: async () => ({ content: [] }) }, host);
  expect(client.state.draft).toBeUndefined();
  client.save();
  expect(saved.draft).toBeUndefined();
  client.state.draft = draft as any;
  client.save();
  expect(client.state.draft).toBeUndefined();
  expect(saved.draft).toBeUndefined();
});
