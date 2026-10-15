import { describe, expect, it, vi } from 'vitest';
import { createClient, BOARD_ID_TOOLS } from './client';

describe('app client', () => {
  it('limits server requests to 10 seconds', async () => {
    const callServerTool = vi.fn(async () => ({ content: [] }));
    await createClient({ callServerTool }).call('kingdown_move', { command_id: 'once' });
    expect(callServerTool).toHaveBeenCalledWith({ name: 'kingdown_move', arguments: { command_id: 'once' } }, { timeout: 10_000 });
  });
  it.each([
    ['kingdown_settings', { last_setup: {} }, 'Start game'],
    ['kingdown_create', {}, 'Start game'],
    ['kingdown_find', {}, 'Start game'],
    ['kingdown_join', { preview: true }, 'Join'],
    ['kingdown_join', {}, 'Join'],
  ])('maps a connection failure for %s and keeps its diagnostic', async (name, args, action) => {
    const error = new Error('ProtocolError: Failed to fetch');
    const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const client = createClient({ callServerTool: async () => { throw error; } });
      await expect(client.call(name as string, args as Record<string, unknown>)).rejects.toThrow(`Cannot connect. Check your connection, then select ${action} again.`);
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
  it('keeps the new board binding when an old read returns after opening a game', async () => {
    let release!: (value: { content: []; structuredContent: { board_id: string } }) => void;
    const client = createClient({ callServerTool: async ({ name }) => name === 'kingdown_get' ? new Promise(resolve => { release = resolve; }) : { content: [], structuredContent: { board_id: 'new' } } });
    client.state.board_id = 'old';
    const read = client.call('kingdown_get', { game_id: 'old-game' });
    await client.call('kingdown_open', { screen: 'board', game_id: 'new-game' });
    release({ content: [], structuredContent: { board_id: 'old' } });
    await read;
    expect(client.state.board_id).toBe('new');
  });
});

it('binds foreground tools and leaves background reads outside the board', async () => {
  const requests: unknown[] = [];
  const client = createClient({ callServerTool: async request => { requests.push(request); return { content: [], structuredContent: { board_id: 'reply' }, _meta: { view: { game_id: 'other' } } }; } });
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
