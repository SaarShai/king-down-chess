import { describe, expect, it } from 'vitest';
import { createClient, type WidgetHost } from './client';

describe('app client', () => {
  it('restores the screen and pending command without putting the command in model context', () => {
    const pending = { name: 'kingdown_move', args: { game_id: 'g1', lan: 'e2-e4', command_id: 'once' } };
    const saved = { privateContent: { screen: 'settings' as const, sheet: 'king', game_id: 'g1', board_id: 'b1', pending } };
    let widgetState: unknown;
    const client = createClient({ callServerTool: async () => ({ content: [] }) }, { widgetState: saved, setWidgetState: state => { widgetState = state; } });
    expect(client.state).toMatchObject({ screen: 'settings', sheet: 'king', game_id: 'g1', board_id: 'b1', pending });
    client.save();
    expect(widgetState).toMatchObject({ modelContent: { game_id: 'g1' }, privateContent: { pending } });
    expect((widgetState as { modelContent: object }).modelContent).not.toHaveProperty('pending');
  });
  it('keeps board settings for a remount until the settings tool is ready', async () => {
    let widgetState: unknown;
    const client = createClient({ callServerTool: async () => { throw new Error('No settings server in Part 1'); } }, { setWidgetState: value => { widgetState = value; } });
    const result = await client.call('kingdown_settings', { symbols_only: true, show_threats: true });
    expect(result._meta?.settings).toEqual({ symbols_only: true, show_threats: true });
    const mounted = createClient({ callServerTool: async () => ({ content: [] }) }, { widgetState: widgetState as WidgetHost['widgetState'] });
    expect((await mounted.call('kingdown_settings'))._meta?.settings).toEqual({ symbols_only: true, show_threats: true });
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
