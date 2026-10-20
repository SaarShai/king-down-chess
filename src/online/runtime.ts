import type { AccountGameHost, GameTransport } from '../account-game/host';
import type { PageState, WidgetHost } from '../plugin/client';
import type { ToolResult } from '../plugin/queue';
import type { Action, CreateOptions, View } from '../match/protocol';
import type { Icon } from '../account/profile';
import type { PlayerSettings } from '../plugin/settings';
import { OnlineError, type OnlineClient } from './client';
import { createWebPageHost } from './page-host';
import { friendInvites } from '../plugin/invite';
import { accountPath, parseAccountRoute, type AccountEntryRoute } from './routes';

const text = (value = ''): ToolResult['content'] => [{ type: 'text', text: value }];
const result = (_meta: Record<string, unknown> = {}, structuredContent?: unknown): ToolResult => ({ content: text(), _meta, ...(structuredContent !== undefined ? { structuredContent } : {}) });
const gameResult = (view: View): ToolResult => result({ view, board_id: view.game_id });
const inviteKey = (key: string): { token: string } | { code: string } => key.length === 43 ? { token: key } : { code: key };

type Receipt = { name: string; args: Record<string, unknown> };
/** The receipt is durable before the send. A network fault retains the exact ID, game, revision and payload. */
export function createWebTransport(api: OnlineClient, userId: string, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
  const key = `kingdown.account-command.${userId}`;
  function pending(): Receipt | undefined {
    const raw = storage.getItem(key);
    if (!raw) return;
    const receipt = JSON.parse(raw) as Receipt;
    if (!receipt || typeof receipt.name !== 'string' || !receipt.args || typeof receipt.args.command_id !== 'string') throw new Error('The saved command cannot be read.');
    return receipt;
  }
  const call: GameTransport = async (name, args, options) => {
    options.signal?.throwIfAborted();
    const game = String(args.game_id ?? args.board_id ?? '');
    const action = commandAction(name, args);
    const durable = !!action || name === 'kingdown_create' || name === 'kingdown_find';
    if (durable) {
      if (typeof args.command_id !== 'string') throw new Error('The game command has no request ID.');
      const previous = pending();
      if (previous && JSON.stringify(previous) !== JSON.stringify({ name, args })) throw new Error('Retry the saved command before you start another command.');
      storage.setItem(key, JSON.stringify({ name, args }));
    }
    try {
      let reply: ToolResult;
      if (action) reply = gameResult((await api.command(game, Number(args.expected_revision), action, String(args.command_id))).view);
      else switch (name) {
        case 'kingdown_get': case 'kingdown_resume': case 'kingdown_open':
          reply = game ? gameResult(await api.game(game, typeof args.since_revision === 'number' ? args.since_revision : undefined, options.signal)) : result({}, { screen: 'play' }); break;
        case 'kingdown_create': {
          const { command_id, board_id: _, ...input } = args;
          const created = await api.create(input as CreateOptions, String(command_id));
          if (created.invite) friendInvites.set(created.view.game_id, created.invite);
          reply = gameResult(created.view); break;
        }
        case 'kingdown_games': reply = result({ games: await api.games(options.signal) }); break;
        case 'kingdown_settings': reply = result(await api.settings(args as Partial<PlayerSettings>)); break;
        case 'kingdown_handle': { const value = await api.handle(args as { handle: string; icon?: Icon; check?: boolean }); reply = result({ me: value.me }, args.check ? { available: value.available } : undefined); break; }
        case 'kingdown_profile': reply = result(await api.record(args as { before?: string; blocks_after?: string })); break;
        case 'kingdown_join': reply = args.preview ? result({ preview: await api.preview(inviteKey(String(args.code))) }, { screen: 'join' }) : gameResult(await api.redeem(inviteKey(String(args.code)))); break;
        case 'kingdown_invite': reply = result({}, await api.invite(game)); break;
        case 'kingdown_seen': await api.seen(game); reply = result(); break;
        case 'kingdown_lobby': reply = result({ lobby: await api.lobby() }); break;
        case 'kingdown_find': { const { board_id: _, ...input } = args; reply = gameResult(await api.find(input)); break; }
        case 'kingdown_accept': reply = gameResult(await api.accept(game)); break;
        case 'kingdown_cancel': reply = gameResult(await api.cancel(game)); break;
        case 'kingdown_block': { const value = await api.block(args); reply = value.view ? gameResult(value.view) : result(); reply._meta = { ...reply._meta, blocked: value.blocked }; reply.content = text(value.blocked ? 'Player blocked. Your current game continues.' : 'Player unblocked. Follows stay off.'); break; }
        case 'kingdown_report': reply = result(await api.report(args as Parameters<OnlineClient['report']>[0])); break;
        default: throw new Error(`The game request is not supported: ${name}`);
      }
      if (durable) storage.removeItem(key);
      options.signal?.throwIfAborted();
      return reply;
    } catch (error) {
      if (!(error instanceof OnlineError) || error.status >= 500) throw error;
      if (durable) storage.removeItem(key);
      return { isError: true, content: text(error.message), _meta: { code: error.code } };
    }
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
  if (entry) saved = { ...saved, screen: entry.screen === 'game' ? 'board' : entry.screen, board_id: entry.screen === 'game' ? entry.gameId : undefined };
  const receipt = transport.pending();
  if (receipt) saved = { ...saved, screen: saved?.pending?.screen ?? (receipt.name === 'kingdown_create' || receipt.name === 'kingdown_find' ? 'play' : 'board'), board_id: String(receipt.args.game_id ?? receipt.args.board_id ?? saved?.board_id ?? '') || undefined, pending: { ...receipt, screen: saved?.pending?.screen ?? (receipt.name === 'kingdown_create' || receipt.name === 'kingdown_find' ? 'play' : 'board') } };
  const stateHost: WidgetHost = {
    accountId: userId, widgetState: { privateContent: saved },
    savePage(state) { window.localStorage.setItem(key, JSON.stringify(state)); },
  };
  let stopped = false, started = false;
  const publish = async (route: AccountEntryRoute) => {
    if (stopped) return;
    try {
      if (route.screen === 'join') {
        const preview = route.key ? await api.preview(inviteKey(route.key)) : undefined;
        if (!stopped) host.onResult?.(result({ ...(preview && { preview }) }, { screen: 'join' }));
      } else if (route.screen === 'game') host.onResult?.(result({ board_id: route.gameId }, { screen: 'board', game_id: route.gameId }));
      else host.onResult?.(result({}, { screen: route.screen }));
    } catch (error) {
      if (!stopped) host.onResult?.({ isError: true, content: text(error instanceof Error ? error.message : String(error)), _meta: { code: error instanceof OnlineError ? error.code : 'UNAVAILABLE' } });
    }
  };
  const fromLocation = () => { const route = parseAccountRoute(new URL(window.location.href)); if (route) void publish(route); };
  const close = () => { stopped = true; window.removeEventListener('popstate', fromLocation); host.onClose?.(); };
  const host: AccountGameHost = {
    call: transport.call, stateHost, dispose: close,
    async connect() { window.addEventListener('popstate', fromLocation); window.addEventListener('pagehide', event => { if (!event.persisted) close(); }); queueMicrotask(() => { fromLocation(); started = true; }); },
    getHostContext: () => ({ displayMode: 'fullscreen', availableDisplayModes: ['fullscreen'], deviceCapabilities: { touch: page.viewport().touch }, safeAreaInsets: page.viewport().safe, theme: 'light' }),
    requestDisplayMode: async () => ({ mode: 'fullscreen' }),
    route(screen, gameId) {
      if (!started) return;
      const route: AccountEntryRoute = ['board', 'seat', 'friend', 'wait', 'end'].includes(screen) && gameId ? { screen: 'game', gameId } : screen === 'join' ? { screen: 'join', key: null } : { screen: screen === 'profile' || screen === 'settings' ? screen : 'play' };
      const path = accountPath(route);
      if (window.location.pathname + window.location.hash !== path) window.history.pushState(null, '', path);
      if (route.screen !== 'join') page.save(route);
    },
  };
  return host;
}
