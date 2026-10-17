import type { App } from '@modelcontextprotocol/ext-apps';
import type { KingChoice } from '../rules/rules';
export const SCREENS = ['home', 'play', 'friend', 'join', 'wait', 'lobby', 'seat', 'board', 'end', 'profile', 'collection', 'settings', 'handle'] as const;
export type Screen = typeof SCREENS[number];
export const BOARD_ID_TOOLS = ['kingdown_get', 'kingdown_create', 'kingdown_join', 'kingdown_resume', 'kingdown_find', 'kingdown_accept'] as const;
/** The tools whose reply selects the page's board. */
export const SELECTION_TOOLS = ['kingdown_open', 'kingdown_create', 'kingdown_join', 'kingdown_resume', 'kingdown_find', 'kingdown_accept'];
export type Pending = { name: string; args: Record<string, unknown>; game_tag?: string; screen?: Screen; quick?: boolean; king?: KingChoice | null; error?: string; error_screen?: Screen };
export type BoardSettings = { symbols_only: boolean; show_threats: boolean };
/** The unsent turn of a board (W7): the game's short tag, the base FEN and the LANs. The full game ID never goes here. */
export type Draft = { game_tag: string; fen: string; lans: string[] };
export type PageState = { screen: Screen; settings_back?: Screen; queued?: Screen; sheet?: string; board_id?: string; pending?: Pending; draft?: Draft };
// Every failed connection and time-out shows this one sentence.
export const CANNOT_CONNECT = 'Cannot connect. Check your connection, then try again.';
// An Error shows its message only; String(error) would add its name ("Error: …").
export const errorText = (error: unknown) => error instanceof Error ? error.message : String(error);
export type WidgetHost = { widgetState?: { privateContent?: Partial<PageState> }; setWidgetState?: (state: unknown) => void };

// Widget state from an older build can name a screen that this build does not have (PR 57 'setup'). It reads as no screen.
export const knownScreen = (name: unknown) => SCREENS.find(screen => screen === name);

export function createClient(app: Pick<App, 'callServerTool'>, host?: WidgetHost) {
  const saved = host?.widgetState?.privateContent, settings_back = knownScreen(saved?.settings_back), queued = knownScreen(saved?.queued);
  const pending = saved?.pending && { ...saved.pending, screen: knownScreen(saved.pending.screen), error_screen: knownScreen(saved.pending.error_screen) };
  // A saved draft is widget state from an older build: keep its three fields only, and its LANs as strings.
  const savedDraft = saved?.draft, draft = savedDraft && { game_tag: String(savedDraft.game_tag ?? ''), fen: String(savedDraft.fen ?? ''), lans: (savedDraft.lans ?? []).map(String) };
  const state: PageState = { screen: knownScreen(saved?.screen) ?? 'home', ...(settings_back && {settings_back}), ...(queued && {queued}), sheet: saved?.sheet, board_id: saved?.board_id, pending, ...(draft && { draft }) };
  let inflight = 0;
  function save() {
    const pending = state.pending;
    const args = pending && Object.fromEntries(Object.entries(pending.args).filter(([key]) => !['game_id', 'code', 'handle'].includes(key)));
    const game_tag = pending?.game_tag ?? (typeof pending?.args.game_id === 'string' ? pending.args.game_id.slice(0, 8) : undefined);
    host?.setWidgetState?.({ modelContent: {}, privateContent: { ...state, pending: pending && { name: pending.name, args, game_tag, screen: pending.screen, ...(pending.quick && { quick: true }), ...(pending.king !== undefined && { king: pending.king }), error: pending.error, error_screen: pending.error_screen } } });
  }
  async function call(name: string, args: Record<string, unknown> = {}, options: { background?: boolean; limit?: boolean; signal?: AbortSignal } = {}): ReturnType<App['callServerTool']> {
    const sent = options.background ? Object.fromEntries(Object.entries(args).filter(([key]) => key !== 'board_id')) : state.board_id && BOARD_ID_TOOLS.some(tool => tool === name) ? { ...args, board_id: state.board_id } : args;
    let result: Awaited<ReturnType<App['callServerTool']>>;
    // Mount reads pass limit: false and keep the SDK's own limit; a slow first load is not a failed command.
    // A newer chat result aborts the calls of an older mount (signal).
    inflight++;
    try { result = await app.callServerTool({ name, arguments: sent }, { ...(options.limit !== false && { timeout: 10_000 }), signal: options.signal }); }
    catch (error) {
      if (!/failed to fetch|networkerror|load failed|network request failed|timed out/i.test(errorText(error))) throw error;
      console.error('King Down connection failed', error);
      throw new Error(CANNOT_CONNECT, { cause: error });
    }
    finally { inflight--; }
    // The transport is only the transport: the queue selects the page's board for a current selection reply (design §2).
    return result;
  }
  return { state, save, call, get inflight() { return inflight; } };
}
