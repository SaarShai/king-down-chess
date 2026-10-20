import { GameReadError, type GameClient } from '../account-game/client';
import type { InboxEntry, View } from '../match/protocol';
import { resultCode, resultText, type createQueue, type JobOptions, type Outcome, type ToolResult } from './queue';
import type { App } from '@modelcontextprotocol/ext-apps';
import { CANNOT_CONNECT, errorText, knownScreen, type Screen, type Pending } from '../account-game/types';
export const BOARD_ID_TOOLS = ['kingdown_get', 'kingdown_create', 'kingdown_join', 'kingdown_resume', 'kingdown_find', 'kingdown_accept'] as const;
/** The tools whose reply selects the page's board. */
export const SELECTION_TOOLS = ['kingdown_open', 'kingdown_create', 'kingdown_join', 'kingdown_resume', 'kingdown_find', 'kingdown_accept'];
/** The unsent turn of a board (W7): the game's short tag, the base FEN and the LANs. The full game ID never goes here. */
export type Draft = { game_tag: string; fen: string; lans: string[] };
export type PageState = { screen: Screen; handle_back?: Screen; name_for_caller?: boolean; settings_back?: Screen; queued?: Screen; sheet?: string; board_id?: string; pending?: Pending; draft?: Draft };
const SLOTS = 3;
export type WidgetHost = { widgetState?: { privateContent?: Partial<PageState> }; setWidgetState?: (state: unknown) => void };

// A saved command from PR 57's 'setup' screen is a New game step, which this build runs on Play.
const commandScreen = (name: unknown) => name === 'setup' ? 'play' : knownScreen(name);

export function createClient(app: Pick<App, 'callServerTool'>, host?: WidgetHost) {
  const saved = host?.widgetState?.privateContent, handle_back = knownScreen(saved?.handle_back), settings_back = knownScreen(saved?.settings_back), queued = knownScreen(saved?.queued);
  const pending = saved?.pending && { ...saved.pending, screen: commandScreen(saved.pending.screen), error_screen: commandScreen(saved.pending.error_screen) };
  // A saved draft is widget state from an older build: keep its three fields only, and its LANs as strings.
  const savedDraft = saved?.draft, draft = savedDraft && { game_tag: String(savedDraft.game_tag ?? ''), fen: String(savedDraft.fen ?? ''), lans: (savedDraft.lans ?? []).map(String) };
  const state: PageState = { screen: knownScreen(saved?.screen) ?? 'home', ...(handle_back && { handle_back }), ...(saved?.name_for_caller === true && { name_for_caller: true }), ...(settings_back && {settings_back}), ...(queued && {queued}), sheet: saved?.sheet, board_id: saved?.board_id, pending, ...(draft && { draft }) };
  // The server allows three calls at once for each account (MAX_ACTIVE_MCP_PER_USER, http.ts). A fourth call waits
  // here for a free slot, so no screen, poll or repeat tap gets a 429; a free slot goes to the oldest waiting call.
  let inflight = 0, sending = 0;
  const waiting: (() => void)[] = [];
  const room = (signal?: AbortSignal) => new Promise<void>((go, stop) => {
    signal?.throwIfAborted();
    const wake = () => { signal?.removeEventListener('abort', drop); go(); };
    const drop = () => { waiting.splice(waiting.indexOf(wake), 1); stop(signal!.reason); };
    waiting.push(wake); signal?.addEventListener('abort', drop, { once: true });
  });
  const free = () => { const next = waiting.shift(); if (next) next(); else sending--; };
  function save() {
    const pending = state.pending;
    const args = pending && Object.fromEntries(Object.entries(pending.args).filter(([key]) => !['game_id', 'code', 'handle'].includes(key)));
    const game_tag = pending?.game_tag ?? (typeof pending?.args.game_id === 'string' ? pending.args.game_id.slice(0, 8) : undefined);
    host?.setWidgetState?.({ modelContent: {}, privateContent: { ...state, pending: pending && { name: pending.name, args, game_tag, screen: pending.screen, ...(pending.quick && { quick: true }), ...(pending.king !== undefined && { king: pending.king }), error: pending.error, error_screen: pending.error_screen } } });
  }
  async function call(name: string, args: Record<string, unknown> = {}, options: { background?: boolean; limit?: boolean; signal?: AbortSignal } = {}): ReturnType<App['callServerTool']> {
    options.signal?.throwIfAborted();
    const sent = options.background ? Object.fromEntries(Object.entries(args).filter(([key]) => key !== 'board_id')) : state.board_id && BOARD_ID_TOOLS.some(tool => tool === name) ? { ...args, board_id: state.board_id } : args;
    let result: Awaited<ReturnType<App['callServerTool']>>;
    // Mount reads pass limit: false and keep the SDK's own limit; a slow first load is not a failed command.
    // A newer chat result aborts the calls of an older mount (signal).
    inflight++;
    try {
      if (sending < SLOTS) sending++; else await room(options.signal);
      try { options.signal?.throwIfAborted(); result = await app.callServerTool({ name, arguments: sent }, { ...(options.limit !== false && { timeout: 10_000 }), signal: options.signal }); }
      finally { free(); }
    }
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

/** Decode only private results from the current queue job. */
export function pluginGameClient(client: ReturnType<typeof createClient>, queue: ReturnType<typeof createQueue>, send: (name: string, args: Record<string, unknown>, options?: JobOptions) => Promise<Outcome>): GameClient {
  const cancelled = () => new DOMException('Read cancelled', 'AbortError');
  function decode(outcome: Outcome, signal?: AbortSignal): ToolResult {
    if (signal?.aborted || outcome.status === 'superseded') throw cancelled();
    if (outcome.status === 'failed' || outcome.status === 'refused') throw new GameReadError(outcome.code || 'UNAVAILABLE', outcome.text);
    if (outcome.result.isError) throw new GameReadError(resultCode(outcome.result) || 'UNAVAILABLE', resultText(outcome.result));
    return outcome.result;
  }
  return {
    async games(signal) {
      if (signal?.aborted || queue.closed()) throw cancelled();
      const origin = queue.mountJob();
      const job = queue.command('read', 'kingdown_games', {}, { user: false, origin, signal });
      const outcome = await queue.run(job, async () => {
        const result = await client.call('kingdown_games', {}, { ...(origin?.options.mount && { limit: false }), signal });
        return queue.current(job) ? { status: 'done', result } : { status: 'superseded' };
      });
      if (!queue.current(job)) throw cancelled();
      const result = decode(outcome, signal);
      return (result._meta?.games as InboxEntry[] | undefined) ?? [];
    },
    async game(gameId, signal) {
      if (signal?.aborted || queue.closed()) throw cancelled();
      const pending = send('kingdown_resume', { game_id: gameId }, { route: false, signal });
      const epoch = queue.epoch(), outcome = await pending;
      if (queue.closed() || queue.epoch() !== epoch) throw cancelled();
      const result = decode(outcome, signal), view = result._meta?.view as View | undefined;
      if (!view) throw new GameReadError('UNAVAILABLE', 'The game reply has no view.');
      return view;
    },
  };
}
