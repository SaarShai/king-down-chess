/** The one game protocol for the website API and the ChatGPT tools (report part 03, section 4.3).
 * Browser code imports the types only (`import type`), so zod stays out of the website bundle. */
import { z } from 'zod';
import type { PublicMatchRules } from './index';
import type { Status } from '../rules/engine';
import { choiceSchema, optionsSchema } from './setup-schema';
import type { Choice, Options } from './setup';
import type { CardName, KingChoice, KingName, PowerName } from '../rules/rules';
import type { SkillName } from '../ai/skill';
import type { Icon } from '../account/profile';
import type { Badge } from './badges';
import type { Rating } from '../online/glicko2';

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
  speed: z.enum(['daily', 'live']).optional(),      // default: daily for games against people, live for solo games
  days_per_move: z.union([z.literal(1), z.literal(3), z.literal(7)]).optional(), // Daily only; default 3
  colour: z.enum(['white', 'black', 'random']).optional(), // default White
  // The engine worker validates the content; this only bounds the shape.
  setup: z.strictObject({ backRank: z.string().max(8).optional(), fen: z.string().max(4096).optional(), preset: z.enum(['current', '2017', '2021']).optional(), kings: z.string().max(100).optional() }).optional(),
}).refine(input => !(input.days_per_move && (input.speed ?? (input.kind === 'solo' ? 'live' : 'daily')) !== 'daily' || input.kind === 'solo' && input.speed === 'daily' || input.options && input.setup))
  .refine(input => input.kind === 'solo' || !!input.options && !input.setup && input.speed !== 'live');
export type Action = z.infer<typeof actionSchema>;
export type Command = z.infer<typeof commandSchema>;
export type CreateOptions = Omit<z.infer<typeof createSchema>, 'options'> & { options?: Options };

export type ErrorCode = 'INVALID_INPUT' | 'NOT_FOUND' | 'FORBIDDEN' | 'WAITING' | 'NOT_ALLOWED' | 'STALE_REVISION' | 'INVALID_MOVE' | 'WRONG_TURN'
  | 'MATCH_TERMINAL' | 'MATCH_LIMIT' | 'MATCH_INCOMPATIBLE' | 'MATCH_REMOVED' | 'COMMAND_CONFLICT' | 'INVITE_UNAVAILABLE' | 'UNAVAILABLE' | 'HANDLE_TAKEN'
  | 'RATE_LIMITED' | 'UNAUTHENTICATED' | 'HANDLE_NEEDED';
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
export interface Opponent { handle: string | null; icon: Icon | null; rating?: { rating: number; provisional: boolean }; computer: boolean; deleted: boolean; last_seen_ms: number | null }

/** One seat's public view, never the full save. Full reads include rules and move history. */
export interface View {
  game_id: string;
  revision: number;
  created_at: string;
  abort_open: boolean;
  outcome?: GameOutcome;
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
  /** Public move history on a full read, from the game's initial position. */
  history?: { initial_fen: string; actions: string[] };
  /** Null while the seat is open. */
  opponent: Opponent | null;
  draw_offer: Seat | null;
  rematch_allowed?: boolean;
  rematch_offer?: Seat | null;
  rematch_game_id?: string | null;
  options?: Options;
  draw?: string;
  deal?: CardName[];
  level?: SkillName;
  /** Your choice; the other choice is null until both seats are ready. */
  choices?: [Choice | null, Choice | null];
  ready?: [boolean, boolean];
  setup_deadline_at?: string | null;
  /** The public king choices and dealt hands once the engine starts. */
  kings?: readonly [KingChoice | null, KingChoice | null];
  hands?: readonly [readonly CardName[], readonly CardName[]];
  result?: { winner: Seat | null; reason: EndReason };
  deadline_at: string | null;
  server_now: string;
  /** The game's fixed rules; only on a full read (no `since`), never in a command reply. */
  rules?: PublicMatchRules;
}
/** One line of "Your games": your turn first, then the nearest deadline. */
export interface GameOutcome { rating_before: number | null; rating: number | null; provisional: boolean; badges: PlayerRecord['badges'] }
export interface InboxEntry { options: Options | null; move: number | null; created_at: string; open_until: string | null; level: SkillName; game_id: string; kind: 'solo' | 'friend' | 'random'; speed: 'daily' | 'live'; status: 'waiting' | 'setup' | 'playing'; seat: Seat; action: SeatAction; turn: Seat; revision: number; deadline_at: string | null; opponent: Opponent | null; updated_at: string }
/** The link token (43 characters) and the short code (6 characters) open the same seat. */
export interface Invite { token: string; code: string; expires_at: string }
export interface JoinPreview { code: string; options: Options | null; colour: 'white' | 'black'; kind: 'friend' | 'random' | 'solo'; creator: { handle: string | null; icon: Icon | null }; expires_at: string }
export interface LobbyEntry { game_id: string; options: Options | null; colour: 'white' | 'black'; creator: { handle: string; icon: Icon | null }; created_at: string }
export interface Lobby { games: LobbyEntry[]; active_count?: number }

export interface GameFeatures { fairy: boolean; arrangement: boolean; classic: boolean; cards: boolean; powers: boolean; king: KingName; power: PowerName | null }
export interface HistoryEntry {
 game_id: string; finished_at: string; kind: 'solo' | 'friend' | 'random'; colour: 'white' | 'black'; result: 'won' | 'drawn' | 'lost'; reason: EndReason;
 opponent: { handle: string | null; icon: string | null; computer: boolean; deleted: boolean; level: SkillName | null }; features: GameFeatures;
}
export interface HistoryPage { games: HistoryEntry[]; next_before: string | null }
export interface PlayerRecord {
 totals: { played: number; won: number; drawn: number; lost: number };
 rating: Rating & { provisional: boolean };
 badges: { badge: Badge; earned_at: string }[];
}
