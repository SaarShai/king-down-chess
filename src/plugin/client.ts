import type { App } from '@modelcontextprotocol/ext-apps';
export const SCREENS = ['home', 'play', 'friend', 'join', 'wait', 'lobby', 'seat', 'board', 'end', 'profile', 'collection', 'settings', 'handle'] as const;
export type Screen = typeof SCREENS[number];
export const BOARD_ID_TOOLS = ['kingdown_get', 'kingdown_create', 'kingdown_join', 'kingdown_resume', 'kingdown_find', 'kingdown_accept'] as const;
/** The tools whose reply selects the page's board. */
export const SELECTION_TOOLS = ['kingdown_open', 'kingdown_create', 'kingdown_join', 'kingdown_resume', 'kingdown_find', 'kingdown_accept'];
export type Pending = { name: string; args: Record<string, unknown>; game_tag?: string; started_at?: number; screen?: Screen; quick?: boolean; error?: string; error_screen?: Screen };
export type BoardSettings = { symbols_only: boolean; show_threats: boolean };
export type PageState = { screen: Screen; settings_back?: Screen; queued?: Screen; sheet?: string; board_id?: string; pending?: Pending };
// Every failed connection and time-out shows this one sentence.
export const CANNOT_CONNECT = 'Cannot connect. Check your connection, then try again.';
// An Error shows its message only; String(error) would add its name ("Error: …").
export const errorText = (error: unknown) => error instanceof Error ? error.message : String(error);
export type WidgetHost = { widgetState?: { privateContent?: Partial<PageState> }; setWidgetState?: (state: unknown) => void };

export function createClient(app: Pick<App, 'callServerTool'>, host?: WidgetHost) {
  const saved = host?.widgetState?.privateContent;
  const state: PageState = { screen: saved?.screen ?? 'home', ...(saved?.settings_back && {settings_back:saved.settings_back}), ...(saved?.queued && {queued:saved.queued}), sheet: saved?.sheet, board_id: saved?.board_id, pending: saved?.pending };
  function save() {
    const pending = state.pending;
    const args = pending && Object.fromEntries(Object.entries(pending.args).filter(([key]) => !['game_id', 'code', 'handle'].includes(key)));
    const game_tag = pending?.game_tag ?? (typeof pending?.args.game_id === 'string' ? pending.args.game_id.slice(0, 8) : undefined);
    host?.setWidgetState?.({ modelContent: {}, privateContent: { ...state, pending: pending && { name: pending.name, args, game_tag, started_at: pending.started_at, screen: pending.screen, ...(pending.quick && { quick: true }), error: pending.error, error_screen: pending.error_screen } } });
  }
  async function call(name: string, args: Record<string, unknown> = {}, options: { background?: boolean; limit?: boolean; signal?: AbortSignal } = {}): ReturnType<App['callServerTool']> {
    const before = state.board_id;
    const sent = options.background ? Object.fromEntries(Object.entries(args).filter(([key]) => key !== 'board_id')) : state.board_id && BOARD_ID_TOOLS.some(tool => tool === name) ? { ...args, board_id: state.board_id } : args;
    let result: Awaited<ReturnType<App['callServerTool']>>;
    // Mount reads pass limit: false and keep the SDK's own limit; a slow first load is not a failed command.
    // A newer chat result aborts the calls of an older mount (signal).
    try { result = await app.callServerTool({ name, arguments: sent }, { ...(options.limit !== false && { timeout: 10_000 }), signal: options.signal }); }
    catch (error) {
      if (!/failed to fetch|networkerror|load failed|network request failed|timed out/i.test(errorText(error))) throw error;
      console.error('King Down connection failed', error);
      throw new Error(CANNOT_CONNECT, { cause: error });
    }
    const board = result._meta?.board_id;
    // A newer chat result or selection that changed the board while the call ran wins over this reply.
    if (!options.background && SELECTION_TOOLS.includes(name) && typeof board === 'string' && state.board_id === before) state.board_id = board;
    return result;
  }
  return { state, save, call };
}
