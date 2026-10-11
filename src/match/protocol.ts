/** The one game protocol for the website API and the ChatGPT tools (report part 03, section 4.3).
 * Browser code imports the types only (`import type`), so zod stays out of the website bundle. */
import { z } from 'zod';
import type { PublicMatchRules } from './index';
import type { Status } from '../rules/engine';
import { choiceSchema, optionsSchema } from './setup-schema';
import type { Options } from './setup';

export type Seat = 0 | 1;
export const MAX_REVISION = 1100;
export type Surface = 'web' | 'chatgpt';
/** Fixed phrases only: a preset never carries free text, a number or a link (part 01, section 8.2). */
export const PRESETS = ['hello', 'good_luck', 'good_game', 'well_played', 'thanks'] as const;
export type Preset = typeof PRESETS[number];

const text = (max: number) => z.string().min(1).max(max).regex(/^[^\u0000-\u001f\u007f]+$/);
export const actionSchema = z.discriminatedUnion('type', [
  // One or more actions of the mover, applied in order, all or nothing (a Daily website turn is one command).
  z.strictObject({ type: z.literal('turn'), actions: z.array(text(120)).min(1).max(4) }),
  // Solo games: the computer plays its turn when the player asks.
  z.strictObject({ type: z.literal('computer') }),
  z.strictObject({ type: z.literal('choose'), choice: choiceSchema, ready: z.boolean() }),
  z.strictObject({ type: z.literal('rematch'), choice: z.enum(['offer', 'accept', 'decline']) }),
  z.strictObject({ type: z.literal('resign') }),
  z.strictObject({ type: z.literal('abort') }),
  z.strictObject({ type: z.literal('draw'), choice: z.enum(['offer', 'accept', 'decline']) }),
  z.strictObject({ type: z.literal('claim'), reason: z.literal('timeout') }),
  z.strictObject({ type: z.literal('say'), preset: z.enum(PRESETS) }),
]);
/** `command_id` is the client's ID (a UUID); a retry sends the same ID and gets the same result. */
export const commandSchema = z.strictObject({ command_id: text(200), expected_revision: z.number().int().min(0).max(MAX_REVISION), action: actionSchema });
export const createSchema = z.strictObject({
  kind: z.enum(['solo', 'friend', 'random']),
  options: optionsSchema.optional(),
  level: z.enum(['beginner', 'casual', 'club', 'strong']).optional(),
  speed: z.enum(['daily', 'live']).optional(),      // default: daily for friend games, live for solo games
  days_per_move: z.union([z.literal(1), z.literal(3), z.literal(7)]).optional(), // Daily only; default 3
  colour: z.enum(['white', 'black', 'random']).optional(), // default White
  // The engine worker validates the content; this only bounds the shape.
  setup: z.strictObject({ backRank: z.string().max(8).optional(), fen: z.string().max(4096).optional(), preset: z.enum(['current', '2017', '2021']).optional(), kings: z.string().max(100).optional() }).optional(),
});
export type Action = z.infer<typeof actionSchema>;
export type Command = z.infer<typeof commandSchema>;
export type CreateOptions = Omit<z.infer<typeof createSchema>, 'options'> & { options?: Options };

export type ErrorCode = 'INVALID_INPUT' | 'NOT_FOUND' | 'FORBIDDEN' | 'WAITING' | 'NOT_ALLOWED' | 'STALE_REVISION' | 'INVALID_MOVE' | 'WRONG_TURN'
  | 'MATCH_TERMINAL' | 'MATCH_LIMIT' | 'MATCH_INCOMPATIBLE' | 'MATCH_REMOVED' | 'COMMAND_CONFLICT' | 'INVITE_UNAVAILABLE' | 'UNAVAILABLE' | 'HANDLE_TAKEN'
  | 'RATE_LIMITED' | 'UNAUTHENTICATED';
export type Reply = { type: 'ack'; command_id: string; revision: number; view: View } | { type: 'reject'; command_id: string; code: ErrorCode; message: string };

export type GameStatus = 'waiting' | 'setup' | 'playing' | 'finished' | 'aborted';
export type EndReason = Exclude<Status, 'playing'> | 'resignation' | 'agreement' | 'timeout' | 'abort' | 'no_start';
/** Who must act: ready (your turn), waiting, or done (the game ended). Every list, badge and alert reads it. */
export type SeatAction = 'waiting' | 'ready' | 'done';
/** What one revision did. `actions` are the moves (LAN) that a turn or the computer played. A join and an
 * expired deadline are events with no command. `hidden` is the opponent's preset when a block or the
 * viewer's quiet mode hides it; it keeps its revision, so the list has no gap. */
export type LoggedAction = Action | { type: 'computer'; actions: string[] } | { type: 'join' } | { type: 'expire' } | { type: 'hidden' };
export interface LoggedCommand { seq: number; seat: Seat | null; action: LoggedAction; at: string }
/** `deleted`: the account was deleted; show "Deleted player". `last_seen_ms`: time since the seat's last command,
 * null unless the opponent's "who sees that I am online" setting lets you see it (and no block). The setting does not
 * hide the time of each move in a shared game (`last_commands[].at`, `deadline_at`): the safety page says so. */
export interface Opponent { handle: string | null; computer: boolean; deleted: boolean; last_seen_ms: number | null }

/** One seat's view: small (under about 3 KB) and never the full save. */
export interface View {
  game_id: string;
  revision: number;
  seat: Seat;
  kind: 'solo' | 'friend' | 'random';
  speed: 'daily' | 'live';
  days_per_move: 1 | 3 | 7 | null;
  status: GameStatus;
  turn: Seat;
  action: SeatAction;
  fen: string;
  in_check: boolean;
  /** Your legal moves (LAN); empty when you cannot move. Boards draw only this list. */
  legal: string[];
  /** The commands after `since` (at most 50), or the last 10. */
  last_commands: LoggedCommand[];
  /** Null while the seat is open. */
  opponent: Opponent | null;
  draw_offer: Seat | null;
  rematch_offer?: Seat | null;
  rematch_game_id?: string | null;
  result?: { winner: Seat | null; reason: EndReason };
  deadline_at: string | null;
  server_now: string;
  /** The game's fixed rules; only on a full read (no `since`), never in a command reply. */
  rules?: PublicMatchRules;
}
/** One line of "Your games": your turn first, then the nearest deadline. */
export interface InboxEntry { game_id: string; kind: 'solo' | 'friend' | 'random'; speed: 'daily' | 'live'; status: 'waiting' | 'setup' | 'playing'; seat: Seat; action: SeatAction; turn: Seat; revision: number; deadline_at: string | null; opponent: Opponent | null; updated_at: string }
/** The link token (43 characters) and the short code (6 characters) open the same seat. */
export interface Invite { token: string; code: string; expires_at: string }
