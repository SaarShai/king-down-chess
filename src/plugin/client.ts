import type { App } from '@modelcontextprotocol/ext-apps';
export const SCREENS = ['home', 'play', 'setup', 'friend', 'join', 'wait', 'lobby', 'seat', 'board', 'end', 'profile', 'collection', 'settings', 'handle'] as const;
export type Screen = typeof SCREENS[number];
export const BOARD_ID_TOOLS = ['kingdown_get', 'kingdown_create', 'kingdown_join', 'kingdown_resume', 'kingdown_find', 'kingdown_accept'] as const;
export type Pending = { name: string; args: Record<string, unknown>; game_tag?: string; started_at?: number; screen?: Screen; error?: string; error_screen?: Screen };
export type BoardSettings = { symbols_only: boolean; show_threats: boolean };
export type PageState = { screen: Screen; settings_back?: Screen; sheet?: string; board_id?: string; pending?: Pending };
export type WidgetHost = { widgetState?: { privateContent?: Partial<PageState> }; setWidgetState?: (state: unknown) => void };

export function createClient(app: Pick<App, 'callServerTool'>, host?: WidgetHost) {
  const saved = host?.widgetState?.privateContent;
  const state: PageState = { screen: saved?.screen ?? 'home', ...(saved?.settings_back && {settings_back:saved.settings_back}), sheet: saved?.sheet, board_id: saved?.board_id, pending: saved?.pending };
  function save() {
    const pending = state.pending;
    const args = pending && Object.fromEntries(Object.entries(pending.args).filter(([key]) => !['game_id', 'code', 'handle'].includes(key)));
    const game_tag = pending?.game_tag ?? (typeof pending?.args.game_id === 'string' ? pending.args.game_id.slice(0, 8) : undefined);
    host?.setWidgetState?.({ modelContent: {}, privateContent: { ...state, pending: pending && { name: pending.name, args, game_tag, started_at: pending.started_at, screen: pending.screen, error: pending.error, error_screen: pending.error_screen } } });
  }
  async function call(name: string, args: Record<string, unknown> = {}, options: { background?: boolean } = {}): ReturnType<App['callServerTool']> {
    const sent = options.background ? Object.fromEntries(Object.entries(args).filter(([key]) => key !== 'board_id')) : state.board_id && BOARD_ID_TOOLS.some(tool => tool === name) ? { ...args, board_id: state.board_id } : args;
    const result = await app.callServerTool({ name, arguments: sent });
    const value = result.structuredContent;
    if (!options.background && ['kingdown_open', 'kingdown_create', 'kingdown_join', 'kingdown_resume', 'kingdown_find', 'kingdown_accept'].includes(name) && value && typeof value === 'object' && 'board_id' in value && typeof value.board_id === 'string') state.board_id = value.board_id;
    return result;
  }
  return { state, save, call };
}
