import type { AccountGameHost, GameTransport } from '../account-game/host';
import type { PageState, WidgetHost } from '../plugin/client';
import type { ToolResult } from '../plugin/queue';
import type { Action, CreateOptions, DraftInput, RatingPolicy, View } from '../match/protocol';
import type { Icon } from '../account/profile';
import type { PlayerSettings } from '../plugin/settings';
import { OnlineError, type OnlineClient } from './client';
import { createWebPageHost } from './page-host';
import { friendInvites } from '../plugin/invite';
import { accountPath, parseAccountRoute, type AccountEntryRoute } from './routes';
import { READ_TOOLS } from '../account-game/types';

const text = (value = ''): ToolResult['content'] => [{ type: 'text', text: value }];
const result = (_meta: Record<string, unknown> = {}, structuredContent?: unknown): ToolResult => ({ content: text(), _meta, ...(structuredContent !== undefined ? { structuredContent } : {}) });
const gameResult = (view: View): ToolResult => result({ view, board_id: view.game_id });
const inviteKey = (key: string): { token: string } | { code: string } => key.length === 43 ? { token: key } : { code: key };

type Receipt = { name: string; args: Record<string, unknown> };
const GAME_SCREENS: string[] = ['board', 'seat', 'friend', 'wait', 'end'];
/** The receipt is durable before the send. A network fault or timeout retains the exact ID, game, revision and payload. */
export function createWebTransport(api: OnlineClient, userId: string, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
  const key = `kingdown.account-command.${userId}`;
  function pending(): Receipt | undefined {
    const raw = storage.getItem(key);
    if (!raw) return;
    const receipt = JSON.parse(raw) as Receipt;
    if (!receipt || typeof receipt.name !== 'string' || !receipt.args || typeof receipt.args.command_id !== 'string') throw new Error('The saved command cannot be read.');
    return receipt;
  }
  const clear = (receipt: string, signal?: AbortSignal) => navigator.locks.request(key, { signal }, async () => {
    if (storage.getItem(key) === receipt) storage.removeItem(key);
  });
  const send: GameTransport = async (name, args, options) => {
    options.signal?.throwIfAborted();
    const game = String(args.game_id ?? args.board_id ?? '');
    const action = commandAction(name, args);
    const durable = !!action || name === 'kingdown_create' || name === 'kingdown_find';
    const receipt = durable ? JSON.stringify({ name, args }) : '';
    if (durable) {
      if (typeof args.command_id !== 'string') throw new Error('The game command has no request ID.');
      // Record writes and clears share one account lock across tabs; requests run outside it.
      await navigator.locks.request(key, { signal: options.signal }, async () => {
        options.signal?.throwIfAborted();
        const previous = pending();
        if (previous && JSON.stringify(previous) !== receipt) throw new Error('Retry the saved command before you start another command.');
        storage.setItem(key, receipt);
      });
      options.signal?.throwIfAborted();
    }
    try {
      let reply: ToolResult;
      if (action) reply = gameResult((await api.command(game, Number(args.expected_revision), action, String(args.command_id), options.signal)).view);
      else switch (name) {
        case 'kingdown_get': case 'kingdown_resume': case 'kingdown_open':
          reply = game ? gameResult(await api.game(game, typeof args.since_revision === 'number' ? args.since_revision : undefined, options.signal)) : result({}, { screen: 'play' }); break;
        case 'kingdown_create': {
          const { command_id, board_id: _, ...input } = args;
          const created = await api.create(input as CreateOptions, String(command_id), options.signal);
          if (created.invite) friendInvites.set(created.view.game_id, created.invite);
          reply = gameResult(created.view); break;
        }
        case 'kingdown_preview': { const { game_id: _, ...input } = args; reply = result({ draft: await api.previewDraft(game, input as DraftInput, options.signal) }); break; }
        case 'kingdown_games': reply = result({ games: await api.games(options.signal) }); break;
        case 'kingdown_settings': reply = result(await api.settings(args as Partial<PlayerSettings>, options.signal)); break;
        case 'kingdown_handle': { const value = await api.handle(args as { handle: string; icon?: Icon; check?: boolean }, options.signal); reply = result({ me: value.me }, args.check ? { available: value.available } : undefined); break; }
        case 'kingdown_profile': reply = result(await api.record(args as { before?: string; blocks_after?: string; notices_before?: string }, options.signal)); break;
        case 'kingdown_join': {
          const key = typeof args.invite_id === 'string' ? { invite_id: args.invite_id } : inviteKey(String(args.code));
          reply = args.preview ? result({ preview: await api.preview(key, options.signal) }, { screen: 'join' }) : gameResult(await api.redeem(key, options.signal)); break;
        }
        case 'kingdown_invite': reply = result({}, await api.invite(game, options.signal)); break;
        case 'kingdown_seen': await api.seen(game, options.signal); reply = result(); break;
        case 'kingdown_lobby': reply = result({ lobby: await api.lobby(options.signal) }); break;
        case 'kingdown_find': { const { board_id: _, ...input } = args; reply = gameResult(await api.find(input, options.signal)); break; }
        case 'kingdown_accept': reply = gameResult(await api.accept(game, args.rating_policy as RatingPolicy | undefined, options.signal)); break;
        case 'kingdown_cancel': reply = gameResult(await api.cancel(game, options.signal)); break;
        case 'kingdown_block': { const value = await api.block(args, options.signal); reply = value.view ? gameResult(value.view) : result(); reply._meta = { ...reply._meta, blocked: value.blocked }; reply.content = text(value.blocked ? 'Player blocked. Your current game continues.' : 'Player unblocked. Follows stay off.'); break; }
        case 'kingdown_report': reply = result(await api.report(args as Parameters<OnlineClient['report']>[0], options.signal)); break;
        default: throw new Error(`The game request is not supported: ${name}`);
      }
      options.signal?.throwIfAborted();
      if (durable) await clear(receipt, options.signal);
      return reply;
    } catch (error) {
      options.signal?.throwIfAborted();
      if (!(error instanceof OnlineError) || error.status >= 500) throw error;
      if (durable) await clear(receipt, options.signal);
      return { isError: true, content: text(error.message), _meta: { code: error.code } };
    }
  };
  const call: GameTransport = async (name, args, options) => {
    options.signal?.throwIfAborted();
    if (options.timeout === undefined && !options.signal) return send(name, args, options);
    // A deadline gets one controller that follows the caller's signal: Safari before 17.4 has no AbortSignal.any.
    const control = options.timeout === undefined ? undefined : new AbortController();
    const signal = control ? control.signal : options.signal!, follow = () => control!.abort(options.signal!.reason);
    if (control) options.signal?.addEventListener('abort', follow, { once: true });
    let abort!: () => void;
    const stopped = new Promise<never>((_resolve, reject) => { abort = () => reject(signal.reason); signal.addEventListener('abort', abort, { once: true }); });
    const timer = control && setTimeout(() => control.abort(new Error('Request timed out')), options.timeout);
    // The deadline also ends token, cache-proof and retry waits; late replies keep the receipt.
    try { return await Promise.race([send(name, args, { ...options, signal }), stopped]); }
    finally { clearTimeout(timer); signal.removeEventListener('abort', abort); options.signal?.removeEventListener('abort', follow); }
  };
  return { call, pending };
}

function commandAction(name: string, args: Record<string, unknown>): Action | undefined {
  switch (name) {
    case 'kingdown_move': return { type: 'turn', actions: (args.actions ?? [args.lan]) as string[] };
    case 'kingdown_choose': return { type: 'choose', choice: { king: args.king, order: args.order }, ready: args.ready } as Action;
    case 'kingdown_computer': return { type: 'computer' };
    case 'kingdown_draw': return { type: 'draw', choice: args.choice } as Action;
    case 'kingdown_rematch': return { type: 'rematch', choice: args.choice } as Action;
    case 'kingdown_resign': return { type: 'resign' };
    case 'kingdown_abort': return { type: 'abort' };
    case 'kingdown_claim': return { type: 'claim', reason: 'timeout' };
    case 'kingdown_say': return { type: 'say', preset: args.preset } as Action;
  }
}

export function createBrowserRuntime(api: OnlineClient, userId: string): AccountGameHost {
  const page = createWebPageHost(userId), key = `kingdown.account-game.${userId}`;
  const transport = createWebTransport(api, userId, window.localStorage);
  let saved: Partial<PageState> | undefined;
  try { saved = JSON.parse(window.localStorage.getItem(key) ?? 'null') ?? undefined; } catch { /* A bad page record does not change a saved command. */ }
  const entry = parseAccountRoute(new URL(window.location.href));
  if (entry) saved = { ...saved, screen: entry.screen === 'game' ? 'board' : entry.screen === 'new-friend' ? 'play' : entry.screen, board_id: entry.screen === 'game' ? entry.gameId : undefined };
  const receipt = transport.pending();
  // A saved read is not a command. Builds before ticket 97 saved the result-details read; it holds the account
  // lock, and on /play/ its retry finds no game, so Start stays off. Resume and open are reads too (the transport's
  // read case). Durable commands keep their receipts.
  if (saved?.pending && [...READ_TOOLS, 'kingdown_resume', 'kingdown_open'].includes(saved.pending.name)) saved = { ...saved, pending: undefined };
  if (receipt) {
    const previous = saved?.pending?.name === receipt.name && saved.pending.args.command_id === receipt.args.command_id ? saved.pending : undefined;
    const screen = previous?.screen ?? (receipt.name === 'kingdown_create' || receipt.name === 'kingdown_find' ? 'play' : 'board');
    const board_id = String(receipt.args.game_id ?? receipt.args.board_id ?? saved?.board_id ?? '') || undefined;
    // Recover the original command without replacing a different game selected by its URL.
    const selection = entry?.screen === 'game' && entry.gameId !== board_id && ['kingdown_move', 'kingdown_computer'].includes(receipt.name) ? { screen: 'board' as const, board_id: entry.gameId } : { screen, board_id };
    saved = { ...saved, ...selection,
      pending: { ...previous, ...receipt, screen, error: undefined, error_screen: undefined } };
    // Recovery shows the receipt's game in place of the entry: the address names it, as a reload of its page does.
    if (selection.board_id && GAME_SCREENS.includes(selection.screen) && !(entry?.screen === 'game' && entry.gameId === selection.board_id)) {
      try { window.history.replaceState(null, '', accountPath({ screen: 'game', gameId: selection.board_id })); } catch { /* An unreadable saved game ID keeps the entry address. */ }
    }
  }
  const stateHost: WidgetHost = {
    accountId: userId, pendingScope: 'account', widgetState: { privateContent: saved },
    savePage(state) { window.localStorage.setItem(key, JSON.stringify(state)); },
  };
  let stopped = false, started = false, routeGeneration = 0;
  const publish = async (route: AccountEntryRoute, generation: number) => {
    const current = () => !stopped && generation === routeGeneration;
    if (!current()) return;
    try {
      if (route.screen === 'join') {
        const preview = route.key ? await api.preview(inviteKey(route.key)) : undefined;
        if (current()) host.onResult?.(result({ ...(preview && { preview }) }, { screen: 'join' }));
      } else if (route.screen === 'new-friend') host.onResult?.(result({}, { screen: 'play', new_friend: true }));
      else if (route.screen === 'game') host.onResult?.(result({ board_id: route.gameId }, { screen: 'board', game_id: route.gameId }));
      else host.onResult?.(result({}, { screen: route.screen }));
    } catch (error) {
      if (current()) host.onResult?.({ isError: true, content: text(error instanceof Error ? error.message : String(error)), _meta: { code: error instanceof OnlineError ? error.code : 'UNAVAILABLE' } });
    }
  };
  const fromLocation = () => {
    const generation = ++routeGeneration, route = parseAccountRoute(new URL(window.location.href));
    if (route) void publish(route, generation);
  };
  const close = () => { stopped = true; window.removeEventListener('popstate', fromLocation); host.onClose?.(); };
  const host: AccountGameHost = {
    call: transport.call, stateHost, dispose: close,
    async connect() { window.addEventListener('popstate', fromLocation); window.addEventListener('pagehide', event => { if (!event.persisted) close(); }); queueMicrotask(() => { fromLocation(); started = true; }); },
    getHostContext: () => ({ displayMode: 'fullscreen', availableDisplayModes: ['fullscreen'], deviceCapabilities: { touch: page.viewport().touch }, safeAreaInsets: page.viewport().safe, theme: 'light' }),
    requestDisplayMode: async () => ({ mode: 'fullscreen' }),
    async openLink({ url }) { window.location.assign(url); return {}; },
    route(screen, gameId) {
      if (!started) return;
      const gameScreen = GAME_SCREENS.includes(screen);
      // Fullscreen startup restores the screen before the first authoritative game view arrives.
      if (gameScreen && !gameId) return;
      routeGeneration++;
      const route: AccountEntryRoute = gameScreen && gameId ? { screen: 'game', gameId } : screen === 'join' ? { screen: 'join', key: null } : { screen: screen === 'profile' || screen === 'settings' ? screen : 'play' };
      const path = accountPath(route);
      if (window.location.pathname + window.location.hash !== path) window.history.pushState(null, '', path);
      if (route.screen !== 'join') page.save(route);
    },
  };
  return host;
}
