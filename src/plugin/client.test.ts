import { describe, expect, it } from 'vitest';
import { createClient, BOARD_ID_TOOLS, type WidgetHost } from './client';

describe('app client', () => {
  it('restores the screen and pending command without putting the command in model context', () => {
    const pending = { name: 'kingdown_move', args: { game_id: 'g1', lan: 'e2-e4', command_id: 'once' } };
    const saved = { privateContent: { screen: 'settings' as const, sheet: 'king', game_id: 'g1', board_id: 'b1', pending } };
    let widgetState: unknown;
    const client = createClient({ callServerTool: async () => ({ content: [] }) }, { widgetState: saved, setWidgetState: state => { widgetState = state; } });
    expect(client.state).toEqual({ screen: 'settings', sheet: 'king', board_id: 'b1', pending });
    client.save();
    expect(widgetState).toEqual({ modelContent: {}, privateContent: { screen: 'settings', sheet: 'king', board_id: 'b1', pending } });
    expect((widgetState as { modelContent: object }).modelContent).not.toHaveProperty('pending');
  });
  it('keeps board settings in page memory until the settings tool is ready', async () => {
    let widgetState: unknown;
    const client = createClient({ callServerTool: async () => { throw new Error('No settings server in Part 1'); } }, { setWidgetState: value => { widgetState = value; } });
    const result = await client.call('kingdown_settings', { symbols_only: true, show_threats: true });
    expect(result._meta?.settings).toEqual({ symbols_only: true, show_threats: true });
    const mounted = createClient({ callServerTool: async () => ({ content: [] }) }, { widgetState: widgetState as WidgetHost['widgetState'] });
    expect((await mounted.call('kingdown_settings'))._meta?.settings).toEqual({ symbols_only: false, show_threats: false });
    expect(widgetState).toBeUndefined();
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
