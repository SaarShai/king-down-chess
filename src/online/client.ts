/**
 * The website's client of /api (no UI): typed calls, command retries with the same command_id, and a poll that
 * keeps one game's view by the rules of report part 03, section 4.3. It imports types only, so the website
 * bundle gets no zod and no server code.
 */
import type { AccountNotices, MyProfile, NotifyKind, ReportCategory, Settings } from '../account/profile';
import type { Action, CreateOptions, DraftInput, DraftPreview, ErrorCode, InboxEntry, Preset, Reply, View, JoinPreview, HistoryEntry, PlayerRecord } from '../match/protocol';
import type { PlayerSettings } from '../plugin/settings';
import type { Icon } from '../account/profile';
import type { InviteLink } from '../api/http';
import { CachePolicyUnavailable, withPrivateCachePolicy } from './cache-policy';

export type { InviteLink };
/** One other player: a handle, a game you share with them, or a user ID. */
export type Target = { handle: string } | { game_id: string } | { user_id: string };
export type Report = Target & { target: 'player' | 'handle' | 'message'; category: ReportCategory; intimate_image?: boolean; note?: string; preset?: Preset };
export class OnlineError extends Error {
  constructor(readonly code: ErrorCode, readonly status: number, message: string) { super(message); this.name = 'OnlineError'; }
}
export interface ClientOptions {
  /** The session's access token (Supabase `getSession()`); null when signed out. */
  token: () => Promise<string | null>;
  /** '' on kingdown.dev itself. */
  origin?: string;
  fetch?: typeof fetch;
  /** Tries for one command; each one after the first waits 0.5 s, 1 s, 2 s ... */
  tries?: number;
  wait?: (ms: number) => Promise<void>;
}
/** A network fault, a busy instance or a server fault: the same command can go again. */
const retryable = (error: unknown) => !(error instanceof OnlineError) || error.status >= 500;

export function onlineClient({ token, origin = '', fetch: send = (...args) => fetch(...args), tries = 4, wait = ms => new Promise(done => setTimeout(done, ms)) }: ClientOptions) {
  async function call<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    const bearer = await token();
    signal?.throwIfAborted();
    if (!bearer) throw new OnlineError('UNAUTHENTICATED', 401, 'Sign in to play online');
    const response = await withPrivateCachePolicy(() => {
      signal?.throwIfAborted();
      return send(origin + path, { method, ...(signal && { signal }), cache: 'no-store', headers: { Authorization: `Bearer ${bearer}`, ...(body !== undefined && { 'Content-Type': 'application/json' }) }, ...(body !== undefined && { body: JSON.stringify(body) }) });
    }).catch(error => {
      if (error instanceof CachePolicyUnavailable) throw new OnlineError('UNAVAILABLE', 503, error.message);
      throw error;
    });
    if (response.status === 204) return undefined as T;
    const value = await response.json().catch(() => null);
    signal?.throwIfAborted();
    if (!response.ok) throw new OnlineError(value?.code ?? 'UNAVAILABLE', response.status, value?.message ?? `Request failed (${response.status})`);
    return value as T;
  }
  return {
    /** A friend game comes with its invitation. */
    create: (options: CreateOptions, command_id: string = crypto.randomUUID()) => call<{ view: View; invite?: InviteLink }>('POST', '/api/games', { ...options, ...(command_id && { command_id }) }),
    preview: (key: { token: string } | { code: string }) => call<JoinPreview>('POST', '/api/invites/preview', key),
    settings: (changes?: Partial<PlayerSettings>) => call<{ settings: PlayerSettings; me: { handle: string | null; icon: Icon | null } }>(changes && Object.keys(changes).length ? 'PATCH' : 'GET', '/api/me/settings', changes && Object.keys(changes).length ? changes : undefined),
    handle: (input: { handle: string; icon?: Icon; check?: boolean }) => call<{ me: { handle: string | null; icon: Icon | null }; available?: boolean }>('POST', '/api/me/handle', input),
    record: (cursor: { before?: string; blocks_after?: string; notices_before?: string } = {}) => call<{ handle: string | null; icon: Icon | null; record: PlayerRecord; blocks: { user_id: string; handle: string | null }[]; history: HistoryEntry[]; next_before: string | null; next_blocks_after: string | null } & AccountNotices>('GET', '/api/me/record' + (Object.keys(cursor).length ? '?' + new URLSearchParams(cursor) : '')),
    lobby: () => call<{ games: InboxEntry[]; server_now: string }>('GET', '/api/lobby'),
    find: (input: Record<string, unknown>) => call<View>('POST', '/api/games/find', input),
    accept: (gameId: string) => call<View>('POST', `/api/games/${encodeURIComponent(gameId)}/accept`, {}),
    cancel: (gameId: string) => call<View>('POST', `/api/games/${encodeURIComponent(gameId)}/cancel`, {}),
    block: (input: { game_id?: string; user_id?: string; blocked?: boolean }) => call<{ blocked: boolean; view?: View }>('POST', '/api/blocks', input),
    /** The full view (with the rules), or the commands after `since`. */
    game: (gameId: string, since?: number, signal?: AbortSignal) => call<View>('GET', `/api/games/${encodeURIComponent(gameId)}${since === undefined ? '' : `?since=${since}`}`, undefined, signal),
    previewDraft: (gameId: string, input: DraftInput, signal?: AbortSignal) => call<DraftPreview>('POST', `/api/games/${encodeURIComponent(gameId)}/preview`, input, signal),
    /** Records activity only when the caller asks for it. */
    seen: (gameId: string) => call<void>('POST', `/api/games/${encodeURIComponent(gameId)}/seen`),
    /** One command; a lost reply sends it again with the same command_id, and the server applies it once. */
    async command(gameId: string, expected_revision: number, action: Action, command_id: string = crypto.randomUUID()): Promise<Extract<Reply, { type: 'ack' }>> {
      for (let attempt = 1; ; attempt++) {
        try { return await call('POST', `/api/games/${encodeURIComponent(gameId)}/commands`, { command_id, expected_revision, action }); }
        catch (error) { if (attempt >= tries || !retryable(error)) throw error; await wait(250 * 2 ** attempt); }
      }
    },
    /** A new invitation; the old one ends. */
    invite: (gameId: string) => call<InviteLink>('POST', `/api/games/${encodeURIComponent(gameId)}/invite`),
    redeem: (key: { token: string } | { code: string }) => call<View>('POST', '/api/invites/redeem', key),
    /** Your active games: your turn first, then the nearest deadline. */
    games: (signal?: AbortSignal) => call<InboxEntry[]>('GET', '/api/me/games', undefined, signal),
    profile: () => call<MyProfile>('GET', '/api/me/profile'),
    updateProfile: (changes: Partial<Settings>) => call<MyProfile>('PATCH', '/api/me/profile', changes),
    setHandle: async (handle: string) => (await call<{ me: Pick<MyProfile, 'handle' | 'icon'> }>('POST', '/api/me/handle', { handle })).me,
    requestDeletion: () => call<MyProfile>('POST', '/api/me/deletion'),
    cancelDeletion: () => call<MyProfile>('DELETE', '/api/me/deletion'),
    notifications: () => call<Record<NotifyKind, { email: boolean; push: boolean }>>('GET', '/api/me/notifications'),
    setNotifications: (changes: Partial<Record<NotifyKind, { email?: boolean; push?: boolean }>>) => call<Record<NotifyKind, { email: boolean; push: boolean }>>('PUT', '/api/me/notifications', changes),
    relations: () => call<{ kind: 'follow' | 'block'; user_id: string; handle: string | null; created_at: string }[]>('GET', '/api/relations'),
    relate: (kind: 'follow' | 'block', target: Target) => call<void>('POST', '/api/relations', { kind, ...target }),
    unrelate: (kind: 'follow' | 'block', target: Target) => call<void>('DELETE', '/api/relations', { kind, ...target }),
    report: (report: Report) => call<{ id: number; created_at: string }>('POST', '/api/reports', report),
  };
}
export type OnlineClient = ReturnType<typeof onlineClient>;

/**
 * The view rules (report part 03, section 4.3): a view that is not newer is dropped; a newer view replaces the local
 * one and adds its commands to the log; a view whose commands do not reach back to the local revision has a gap.
 * A full read keeps its rules; a later read without rules keeps the local ones.
 */
export function merge(local: View | undefined, next: View): View | 'drop' | 'gap' {
  if (!local) return next;
  if (next.revision <= local.revision) return 'drop';
  const first = next.last_commands[0]?.seq ?? next.revision + 1;
  if (first > local.revision + 1) return 'gap';
  return { ...next, rules: next.rules ?? local.rules, last_commands: [...local.last_commands.filter(c => c.seq < first), ...next.last_commands].slice(-50) };
}

/**
 * Keeps one game's view fresh by polling (Realtime pings come in phase 2): every 2 s while a live game waits for the
 * opponent, else every 30 s; never while the page is hidden; at once when the page comes back or the network returns.
 * A gap of 1 to 50 revisions is filled with `since`; a larger one reloads the full view. Stops when the game ends.
 */
export function watch(api: OnlineClient, gameId: string, onView: (view: View) => void, { live = 2000, daily = 30_000 } = {}) {
  let local: View | undefined, timer: ReturnType<typeof setTimeout> | undefined, stopped = false, running: Promise<void> | undefined;
  const take = (view: View): boolean => {
    const merged = merge(local, view);
    if (merged === 'drop' || merged === 'gap') return merged === 'drop';
    local = merged; onView(merged); return true;
  };
  async function read(): Promise<void> {
    if (take(await api.game(gameId, local?.revision))) return;
    // A gap: the server had more than 50 commands since our revision. Start again from a full view.
    local = undefined; take(await api.game(gameId));
  }
  function schedule(): void {
    clearTimeout(timer);
    if (stopped || local && local.status !== 'waiting' && local.status !== 'playing') return;
    timer = setTimeout(() => { void refresh(); }, local?.speed === 'live' && local.action === 'waiting' ? live : daily);
  }
  /** Reads now (one read at a time); errors wait for the next turn of the poll. */
  function refresh(): Promise<void> {
    if (stopped) return Promise.resolve();
    if (typeof document !== 'undefined' && document.hidden) { schedule(); return Promise.resolve(); }
    running ??= read().catch(() => {}).finally(() => { running = undefined; schedule(); });
    return running;
  }
  const back = () => { if (typeof document === 'undefined' || !document.hidden) void refresh(); };
  // visibilitychange comes to the document; pageshow (from the back/forward cache) and online come to the window.
  const on = (add: boolean) => {
    if (typeof document !== 'undefined') document[add ? 'addEventListener' : 'removeEventListener']('visibilitychange', back);
    if (typeof window !== 'undefined') for (const name of ['pageshow', 'online']) window[add ? 'addEventListener' : 'removeEventListener'](name, back);
  };
  on(true); void refresh();
  return {
    refresh,
    /** A command's reply goes through the same rules; a gap reads again. */
    accept(view: View): void { if (!take(view)) void refresh(); },
    get view() { return local; },
    stop(): void { stopped = true; clearTimeout(timer); on(false); },
  };
}
