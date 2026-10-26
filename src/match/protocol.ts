/** The one game protocol for the website API and the ChatGPT tools (report part 03, section 4.3).
 * Browser code imports the types only (`import type`), so zod stays out of the website bundle. */
import { z } from 'zod';
import type { PublicMatchRules } from './index';
import type { Move, Status } from '../rules/engine';
import { choiceSchema, optionsSchema } from './setup-schema';
import { RANKED_OPTIONS, switches } from './setup';
import type { Choice, Options, SetupAdmission } from './setup';
import type { CardName, KingChoice, KingName, PowerName } from '../rules/rules';
import type { SkillName } from '../ai/skill';
import type { Icon } from '../account/profile';
import type { Badge } from './badges';
import type { Rating } from '../online/glicko2';

export type Seat = 0 | 1;
export type RatingPolicy = 'legacy' | 'casual' | 'ranked-v1';
export type CreationMode = 'casual' | 'ranked';
export const MAX_REVISION = 1100;
/** The most actions in one turn command. */
export const TURN_ACTIONS = 4;
export type Surface = 'web' | 'chatgpt';
/** Fixed phrases only: a preset never carries free text, a number or a link (part 01, section 8.2). */
export const PRESETS = ['hello', 'good_luck', 'good_game', 'well_played', 'thanks'] as const;
export type Preset = typeof PRESETS[number];

const text = (max: number) => z.string().min(1).max(max).regex(/^[^\u0000-\u001f\u007f]+$/);
/** A private, uncommitted prefix of the current seat's turn. */
export const draftSchema = z.strictObject({ expected_revision: z.number().int().min(0).max(MAX_REVISION), engine_fingerprint: z.string().regex(/^sha256:[a-f0-9]{64}$/), actions: z.array(text(120)).max(TURN_ACTIONS) });
export type DraftInput = z.infer<typeof draftSchema>;
export interface DraftPosition { fen: string; status: Status; turn: Seat; in_check: boolean; moves: { lan: string; move: Move }[] }
export interface DraftPreview { game_id: string; revision: number; engine_fingerprint: string; actions: string[]; positions: DraftPosition[] }
export const actionSchema = z.discriminatedUnion('type', [
  // One or more actions of the mover, applied in order, all or nothing (a Daily website turn is one command).
  z.strictObject({ type: z.literal('turn'), actions: z.array(text(120)).min(1).max(TURN_ACTIONS) }),
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
  recipient_id: z.uuid().optional(), recipient_handle: z.string().min(1).max(40).optional(), open_link: z.literal(true).optional(),
  mode: z.enum(['casual', 'ranked']).optional(),
  options: optionsSchema.optional(),
  level: z.enum(['beginner', 'casual', 'club', 'strong']).optional(),
  colour: z.enum(['white', 'black', 'random']).optional(), // default White
  // The engine worker validates the content; this only bounds the shape.
  setup: z.strictObject({ backRank: z.string().max(8).optional(), fen: z.string().max(4096).optional(), preset: z.enum(['current', '2017', '2021']).optional(), kings: z.string().max(100).optional() }).optional(),
}).refine(input => [input.recipient_id, input.recipient_handle, input.open_link].filter(v => v !== undefined).length <= 1)
  .refine(input => input.kind === 'friend' || !input.recipient_id && !input.recipient_handle && !input.open_link)
  .refine(input => !(input.options && input.setup))
  .refine(input => input.kind === 'solo' || (!!input.options || input.mode === 'ranked') && !input.setup)
  .refine(input => input.mode !== 'ranked' || input.kind === 'random' && !input.setup && !input.level && (input.colour === undefined || input.colour === 'random')
    && (!input.options || switches(input.options) === switches(RANKED_OPTIONS) && input.options.pool.length === RANKED_OPTIONS.pool.length && input.options.pool.every(kind => RANKED_OPTIONS.pool.includes(kind))
      && input.options.cardPool.length === RANKED_OPTIONS.cardPool.length && input.options.cardPool.every(card => RANKED_OPTIONS.cardPool.includes(card))));
export type Action = z.infer<typeof actionSchema>;
export type Command = z.infer<typeof commandSchema>;
export type CreateOptions = Omit<z.infer<typeof createSchema>, 'options'> & { options?: Options };

export type ErrorCode = 'INVALID_INPUT' | 'NOT_FOUND' | 'FORBIDDEN' | 'WAITING' | 'NOT_ALLOWED' | 'STALE_REVISION' | 'INVALID_MOVE' | 'WRONG_TURN'
  | 'MATCH_TERMINAL' | 'MATCH_LIMIT' | 'MATCH_INCOMPATIBLE' | 'MATCH_REMOVED' | 'COMMAND_CONFLICT' | 'INVITE_UNAVAILABLE' | 'UNAVAILABLE' | 'HANDLE_TAKEN'
  | 'FRIEND_GAME_LIMIT' | 'FRIEND_INVITE_LIMIT' | 'OPEN_INVITE_LIMIT' | 'RATE_LIMITED' | 'UNAUTHENTICATED' | 'HANDLE_NEEDED' | 'RANKED_UNAVAILABLE' | 'BOARD_EXPIRED';
export type Reply = { type: 'ack'; command_id: string; revision: number; view: View } | { type: 'reject'; command_id: string; code: ErrorCode; message: string };

export type GameStatus = 'waiting' | 'setup' | 'playing' | 'finished' | 'aborted';
export type EndReason = Exclude<Status, 'playing'> | 'history' | 'resignation' | 'agreement' | 'timeout' | 'abort' | 'no_start';
/** Who must act: ready (your turn), waiting, or done (the game ended). Every list, badge and alert reads it. */
export type SeatAction = 'waiting' | 'ready' | 'done';
/** What one revision did. `actions` are the moves (LAN) that a turn or the computer played. A join and an
 * expired deadline are events with no command. `hidden` is the opponent's preset when a block or the
 * viewer's quiet mode hides it; it keeps its revision, so the list has no gap. */
export type LoggedAction = Action | { type: 'computer'; actions: string[] } | { type: 'join' } | { type: 'expire' } | { type: 'decline' } | { type: 'hidden' };
export interface LoggedCommand { seq: number; seat: Seat | null; action: LoggedAction; at: string }
/** `deleted`: the account was deleted; show "Deleted player". `last_seen_ms`: time since the seat's last command,
 * null unless the opponent's "who sees that I am online" setting lets you see it (and no block). The setting does not
 * hide the time of each move in a shared game (`last_commands[].at`, `deadline_at`): the safety page says so. */
export interface Opponent { handle: string | null; icon: Icon | null; rating?: { rating: number; provisional: boolean }; computer: boolean; deleted: boolean; last_seen_ms: number | null }

/** One seat's public view, never the full save. Full reads include rules and move history. */
export interface View {
  /** Only a successful first send carries the raw share code. Reads and retries carry metadata. */
  invite?: Invite;
  invitation?: InvitationRow;
  game_id: string;
  rating_policy: RatingPolicy;
  revision: number;
  /** The game's fixed engine implementation, including unfinished drawn setup. */
  engine_fingerprint?: string | null;
  created_at: string;
  abort_open: boolean;
  outcome?: GameOutcome;
  seat: Seat;
  kind: 'solo' | 'friend' | 'random';
  speed: 'daily' | 'live';
  days_per_move: 1 | 3 | 7 | null; // TURN_DAYS in a new game against a person; an older game keeps 1 or 7
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
  setup_admission?: SetupAdmission;
  ready?: [boolean, boolean];
  setup_deadline_at?: string | null;
  /** The public king choices and dealt hands once the engine starts. */
  kings?: readonly [KingChoice | null, KingChoice | null];
  hands?: readonly [readonly CardName[], readonly CardName[]];
  result?: { winner: Seat | null; reason: EndReason };
  deadline_at: string | null;
  server_now: string;
  /** Current invitation identity, never a redeemable token. Present only for a waiting friend game. */
  invite_id?: string | null;
  /** The game's fixed rules; only on a full read (no `since`), never in a command reply. */
  rules?: PublicMatchRules;
}
/** One line of "Your games": your turn first, then the nearest deadline. */
export interface GameOutcome { rating_before: number | null; rating: number | null; provisional: boolean; badges: PlayerRecord['badges'] }
export interface InboxEntry { invite_id?: string | null; rating_policy: RatingPolicy; options: Options | null; move: number | null; created_at: string; open_until: string | null; level: SkillName; game_id: string; kind: 'solo' | 'friend' | 'random'; speed: 'daily' | 'live'; status: 'waiting' | 'setup' | 'playing'; seat: Seat; action: SeatAction; turn: Seat; revision: number; deadline_at: string | null; opponent: Opponent | null; updated_at: string }
/** The link token (43 characters) and the short code (6 characters) open the same seat. */
export type InvitationState = 'open' | 'accepted' | 'declined' | 'cancelled' | 'expired';
export interface InvitationRow { invite_id: string; game_id: string; direction: 'incoming' | 'outgoing'; recipient_id: string | null; player: { user_id: string; handle: string | null; icon: Icon | null } | null; options: Options | null; expires_at: string; state: InvitationState }
export interface InvitationPage { invitations: InvitationRow[]; next_before: string | null }
export interface Friend { user_id: string; handle: string; icon: Icon | null; source: 'recent' | 'follow' }
export interface FriendsPage { friends: Friend[]; next_after: string | null }
export interface LimitDetails { count: number; handle?: string | null }
export interface Invite { token: string; code: string; expires_at: string; invite_id: string; recipient_id?: string | null }
export const inviteSchema = z.strictObject({ recipient_id: z.uuid().optional(), recipient_handle: z.string().min(1).max(40).optional(), open_link: z.literal(true).optional(), rotate: z.boolean().optional() }).refine(v => [v.recipient_id, v.recipient_handle, v.open_link].filter(x => x !== undefined).length <= 1);
export const friendsSchema = z.strictObject({ handle: z.string().min(1).max(40).optional(), after: z.uuid().optional(), limit: z.coerce.number().int().min(1).max(50).default(20) });
export const invitationsSchema = z.strictObject({ before: z.string().max(120).optional(), limit: z.coerce.number().int().min(1).max(50).default(20) });
export interface JoinPreview { code: string; options: Options | null; colour: 'white' | 'black'; kind: 'friend' | 'random' | 'solo'; creator: { handle: string | null; icon: Icon | null }; expires_at: string; recipient_id?: string | null; recipient_handle?: string | null; invite_id?: string }
export interface LobbyEntry { rating_policy: RatingPolicy; game_id: string; options: Options | null; colour: 'white' | 'black'; creator: { handle: string; icon: Icon | null }; created_at: string }
export interface Lobby { games: LobbyEntry[]; active_count?: number }

export interface GameFeatures { fairy: boolean; arrangement: boolean; classic: boolean; cards: boolean; powers: boolean; king: KingName; power: PowerName | null }
export interface HistoryEntry {
 rating_policy: RatingPolicy; game_id: string; finished_at: string; kind: 'solo' | 'friend' | 'random'; colour: 'white' | 'black'; result: 'won' | 'drawn' | 'lost'; reason: EndReason;
 opponent: { handle: string | null; icon: string | null; computer: boolean; deleted: boolean; level: SkillName | null }; features: GameFeatures;
}
export interface HistoryPage { games: HistoryEntry[]; next_before: string | null }
export interface PlayerRecord {
 totals: { played: number; won: number; drawn: number; lost: number };
 rating: Rating & { provisional: boolean };
 badges: { badge: Badge; earned_at: string }[];
}
