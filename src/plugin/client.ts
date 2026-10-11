import type { App } from '@modelcontextprotocol/ext-apps';
export type Screen = 'home' | 'play' | 'games' | 'profile' | 'settings' | 'handle' | 'board';
export type Pending = { name: string; args: Record<string, unknown> };
export type BoardSettings = { symbols_only: boolean; show_threats: boolean };
export type PageState = { screen: Screen; sheet?: string; board_id?: string; pending?: Pending };
export type WidgetHost = { widgetState?: { privateContent?: Partial<PageState> }; setWidgetState?: (state: unknown) => void };

export function createClient(app: Pick<App, 'callServerTool'>, host?: WidgetHost) {
  const saved = host?.widgetState?.privateContent;
  const state: PageState = { screen: saved?.screen ?? 'home', sheet: saved?.sheet, board_id: saved?.board_id, pending: saved?.pending };
  const settings: BoardSettings = { symbols_only: false, show_threats: false };
  function save() { host?.setWidgetState?.({ modelContent: {}, privateContent: state }); }
  async function call(name: string, args: Record<string, unknown> = {}): ReturnType<App['callServerTool']> {
    // Ticket 10 replaces this local settings store with the account tool.
    if (name === 'kingdown_settings') {
      for (const key of ['symbols_only', 'show_threats'] as const) if (typeof args[key] === 'boolean') settings[key] = args[key];
      return { content: [], _meta: { settings } };
    }
    const result = await app.callServerTool({ name, arguments: state.board_id && ['kingdown_get', 'kingdown_create', 'kingdown_join', 'kingdown_resume'].includes(name) ? { ...args, board_id: state.board_id } : args });
    const value = result.structuredContent;
    if (['kingdown_open', 'kingdown_create', 'kingdown_join', 'kingdown_resume', 'kingdown_find', 'kingdown_accept'].includes(name) && value && typeof value === 'object' && 'board_id' in value && typeof value.board_id === 'string') state.board_id = value.board_id;
    return result;
  }
  return { state, settings, save, call };
}
