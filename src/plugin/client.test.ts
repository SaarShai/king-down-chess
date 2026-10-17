import { describe, expect, it, vi } from 'vitest';
import { createClient, BOARD_ID_TOOLS, type WidgetHost } from './client';

describe('app client', () => {
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
  it('reads a saved screen name that this build does not have as no screen', () => {
    // PR 57 widget state: its New game screen was 'setup'.
    const pending = { name: 'kingdown_create', args: { kind: 'solo', command_id: 'once' }, screen: 'setup', error: 'The reply was lost.', error_screen: 'setup' };
    const saved = { privateContent: { screen: 'setup', settings_back: 'setup', queued: 'setup', board_id: 'b1', pending } } as unknown as NonNullable<WidgetHost['widgetState']>;
    const client = createClient({ callServerTool: async () => ({ content: [] }) }, { widgetState: saved });
    expect(client.state).toStrictEqual({ screen: 'home', sheet: undefined, board_id: 'b1', pending: { ...pending, screen: undefined, error_screen: undefined } });
    expect(createClient({ callServerTool: async () => ({ content: [] }) }, { widgetState: { privateContent: { screen: 'seat', settings_back: 'board', queued: 'end' } } }).state).toMatchObject({ screen: 'seat', settings_back: 'board', queued: 'end' });
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
