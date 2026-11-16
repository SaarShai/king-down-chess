/**
 * The adapter of the people controller to the existing server and protocol (docs/specs/people-controller). It uses the
 * website's REST client (`src/online/client.ts`) unchanged and gives one fault kind for each server answer that the
 * controller must treat in a different way. No DOM.
 */
import { OnlineError, type OnlineClient } from '../../online/client';
import type { Action, DraftInput, DraftPreview, ErrorCode, JoinPreview, View } from '../../match/protocol';

/** A reply from an account action that no longer owns the page. */
export class ObsoleteAction extends Error { constructor() { super('The account changes.'); } }

/** An invite link key (`/j#<token>`). Game codes are parked (docs/PARKED.md), so a short code is not a key. */
export type InviteKey = { token: string };
/** The server calls of the controller. */
export interface PeopleServer {
  /** The full view (rules and history), or the commands after `since`. */
  game(gameId: string, since?: number, signal?: AbortSignal): Promise<View>;
  /** One command; the client sends a lost reply again with the same `command_id`. */
  command(gameId: string, expected: number, action: Action, commandId: string, signal?: AbortSignal): Promise<View>;
  /** The server check of a draft turn: only when the page engine is not the game's engine (M3). */
  draft(gameId: string, input: DraftInput, signal?: AbortSignal): Promise<DraftPreview>;
  preview(key: InviteKey, signal?: AbortSignal): Promise<JoinPreview>;
  join(key: InviteKey, signal?: AbortSignal): Promise<View>;
  /** Records activity, so the opponent's poll gets faster. */
  seen(gameId: string, signal?: AbortSignal): Promise<void>;
}

export function peopleServer(api: Pick<OnlineClient, 'game' | 'command' | 'previewDraft' | 'preview' | 'redeem' | 'seen'>): PeopleServer {
  return {
    game: (gameId, since, signal) => api.game(gameId, since, signal),
    command: async (gameId, expected, action, commandId, signal) => (await api.command(gameId, expected, action, commandId, signal)).view,
    draft: (gameId, input, signal) => api.previewDraft(gameId, input, signal),
    preview: (key, signal) => api.preview(key, signal),
    join: (key, signal) => api.redeem(key, signal),
    seen: (gameId, signal) => api.seen(gameId, signal),
  };
}

/** The invite key of a link fragment: the 43-character token only. */
export function inviteKey(fragment: string): InviteKey | undefined {
  let value = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  try { value = decodeURIComponent(value); } catch { return; }
  return /^[A-Za-z0-9_-]{43}$/.test(value) ? { token: value } : undefined;
}

/**
 * What a failed call means for the controller.
 * - `unknown`: no answer (a network fault, a server fault): a command may already be applied.
 * - `offline`: no answer and the device is offline.
 * - `auth`: the sign-in ended (401).
 * - `stale`: the game changed (`STALE_REVISION`, `WRONG_TURN`).
 * - `illegal`: the turn is not legal now (`INVALID_MOVE`).
 * - `ended`: the game ended (`MATCH_TERMINAL`).
 * - `gone`: the game is not there (`MATCH_REMOVED`, `NOT_FOUND`).
 * - `account`: the game is for another account (`FORBIDDEN` on a read).
 * - `down`: the service does not answer now (`UNAVAILABLE`, 503).
 * - `refused`: any other refusal; `code` and `message` say why.
 */
export type FaultKind = 'unknown' | 'offline' | 'auth' | 'stale' | 'illegal' | 'ended' | 'gone' | 'account' | 'down' | 'refused';
export interface Fault { kind: FaultKind; code?: ErrorCode; message: string }

const KINDS: Partial<Record<ErrorCode, FaultKind>> = {
  UNAUTHENTICATED: 'auth', STALE_REVISION: 'stale', WRONG_TURN: 'stale', INVALID_MOVE: 'illegal', MATCH_TERMINAL: 'ended',
  MATCH_REMOVED: 'gone', NOT_FOUND: 'gone', UNAVAILABLE: 'down',
};

/** `read`: the call was a read, so `FORBIDDEN` means "another account". */
export function faultOf(error: unknown, online = true, read = false): Fault {
  if (error instanceof OnlineError) {
    if (error.status === 401) return { kind: 'auth', code: error.code, message: error.message };
    if (error.code === 'FORBIDDEN' && read) return { kind: 'account', code: error.code, message: error.message };
    const kind = KINDS[error.code] ?? (error.status >= 500 ? 'unknown' : 'refused');
    return { kind, code: error.code, message: error.message };
  }
  const message = error instanceof Error ? error.message : String(error);
  return { kind: online ? 'unknown' : 'offline', message };
}

/** The server answered, so a command with this fault cannot apply later: its receipt can go. */
export const settled = (fault: Fault) => !['unknown', 'offline', 'auth', 'down'].includes(fault.kind);
