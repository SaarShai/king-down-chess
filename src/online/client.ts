/**
 * The website's client of /api (no UI): typed calls and command retries with the same command_id. The shared
 * poll (src/plugin/poll.ts) keeps a game's view fresh. It imports types only, so the website bundle gets no zod
 * and no server code.
 */
import type { AccountNotices, MyProfile, NotifyKind, ReportCategory, Settings } from '../account/profile';
import type { Action, CreateOptions, DraftInput, DraftPreview, ErrorCode, InboxEntry, Lobby, Preset, RatingPolicy, Reply, View, JoinPreview, HistoryEntry, PlayerRecord } from '../match/protocol';
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

export function onlineClient({ token, origin = '', fetch: send = (input, init) => fetch(input, init), tries = 4, wait = ms => new Promise(done => setTimeout(done, ms)) }: ClientOptions) {
  async function call<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    signal?.throwIfAborted();
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
    create: (options: CreateOptions, command_id: string = crypto.randomUUID(), signal?: AbortSignal) => call<{ view: View; invite?: InviteLink }>('POST', '/api/games', { ...options, ...(command_id && { command_id }) }, signal),
    preview: (key: { token: string } | { code: string } | { invite_id: string }, signal?: AbortSignal) => call<JoinPreview>('POST', '/api/invites/preview', key, signal),
    settings: (changes?: Partial<PlayerSettings>, signal?: AbortSignal) => call<{ settings: PlayerSettings; me: { handle: string | null; icon: Icon | null } }>(changes && Object.keys(changes).length ? 'PATCH' : 'GET', '/api/me/settings', changes && Object.keys(changes).length ? changes : undefined, signal),
    handle: (input: { handle: string; icon?: Icon; check?: boolean }, signal?: AbortSignal) => call<{ me: { handle: string | null; icon: Icon | null }; available?: boolean }>('POST', '/api/me/handle', input, signal),
    record: (cursor: { before?: string; blocks_after?: string; notices_before?: string } = {}, signal?: AbortSignal) => call<{ handle: string | null; icon: Icon | null; record: PlayerRecord; blocks: { user_id: string; handle: string | null }[]; history: HistoryEntry[]; next_before: string | null; next_blocks_after: string | null } & AccountNotices>('GET', '/api/me/record' + (Object.keys(cursor).length ? '?' + new URLSearchParams(cursor) : ''), undefined, signal),
    lobby: (signal?: AbortSignal) => call<Lobby & { server_now: string }>('GET', '/api/lobby', undefined, signal),
    find: (input: Record<string, unknown>, signal?: AbortSignal) => call<View>('POST', '/api/games/find', input, signal),
    accept: (gameId: string, rating_policy?: RatingPolicy, signal?: AbortSignal) => call<View>('POST', `/api/games/${encodeURIComponent(gameId)}/accept`, { ...(rating_policy && { rating_policy }) }, signal),
    cancel: (gameId: string, signal?: AbortSignal) => call<View>('POST', `/api/games/${encodeURIComponent(gameId)}/cancel`, {}, signal),
    block: (input: { game_id?: string; user_id?: string; blocked?: boolean }, signal?: AbortSignal) => call<{ blocked: boolean; view?: View }>('POST', '/api/blocks', input, signal),
    /** The full view (with the rules), or the commands after `since`. */
    game: (gameId: string, since?: number, signal?: AbortSignal) => call<View>('GET', `/api/games/${encodeURIComponent(gameId)}${since === undefined ? '' : `?since=${since}`}`, undefined, signal),
    previewDraft: (gameId: string, input: DraftInput, signal?: AbortSignal) => call<DraftPreview>('POST', `/api/games/${encodeURIComponent(gameId)}/preview`, input, signal),
    /** Records activity only when the caller asks for it. */
    seen: (gameId: string, signal?: AbortSignal) => call<void>('POST', `/api/games/${encodeURIComponent(gameId)}/seen`, undefined, signal),
    /** One command; a lost reply sends it again with the same command_id, and the server applies it once. */
    async command(gameId: string, expected_revision: number, action: Action, command_id: string = crypto.randomUUID(), signal?: AbortSignal): Promise<Extract<Reply, { type: 'ack' }>> {
      for (let attempt = 1; ; attempt++) {
        try { return await call('POST', `/api/games/${encodeURIComponent(gameId)}/commands`, { command_id, expected_revision, action }, signal); }
        catch (error) { signal?.throwIfAborted(); if (attempt >= tries || !retryable(error)) throw error; await wait(250 * 2 ** attempt); }
      }
    },
    /** A new invitation; the old one ends. */
    invite: (gameId: string, signal?: AbortSignal) => call<InviteLink>('POST', `/api/games/${encodeURIComponent(gameId)}/invite`, undefined, signal),
    redeem: (key: { token: string } | { code: string } | { invite_id: string }, signal?: AbortSignal) => call<View>('POST', '/api/invites/redeem', key, signal),
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
    report: (report: Report, signal?: AbortSignal) => call<{ id: number; created_at: string }>('POST', '/api/reports', report, signal),
  };
}
export type OnlineClient = ReturnType<typeof onlineClient>;

