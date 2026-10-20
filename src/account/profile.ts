/**
 * The online profile's fields and rules, shared by the website (no UI yet) and the server
 * (src/online/accounts.ts, src/online/safety.ts). Plain values only, so the website bundle gets no zod.
 */

/** Preset icons from the game's art (no photos, no uploads): the key and its picture under public/. */
export const ICONS = {
  flame: 'ui/kings/flame.webp', frost: 'ui/kings/frost.webp', mud: 'ui/kings/mud.webp',
  shadow: 'ui/kings/shadow.webp', spirit: 'ui/kings/spirit.webp', stratus: 'ui/kings/stratus.webp',
  archer: 'ui/pieces/archer-w.webp', beast: 'ui/pieces/beast-w.webp', bishop: 'ui/pieces/bishop-w.webp',
  guard: 'ui/pieces/guard-w.webp', knight: 'ui/pieces/knight-w.webp', maester: 'ui/pieces/maester-w.webp',
  ogre: 'ui/pieces/ogre-w.webp', paladin: 'ui/pieces/paladin-w.webp', pawn: 'ui/pieces/pawn-w.webp',
  queen: 'ui/pieces/queen-w.webp', rook: 'ui/pieces/rook-w.webp',
} as const;
export type Icon = keyof typeof ICONS;

/** Who can challenge me; who sees that I am online (part 01, section 5.6). Defaults: signed-in, mutual. */
export const CHALLENGE_FROM = ['nobody', 'follows', 'signed-in', 'everyone'] as const;
export const ONLINE_VISIBLE_TO = ['everyone', 'mutual', 'nobody'] as const;
export interface Settings {
  icon: Icon | null;
  challenge_from: typeof CHALLENGE_FROM[number];
  online_visible_to: typeof ONLINE_VISIBLE_TO[number];
  /** Hides the opponent's preset messages from me. */
  quiet_mode: boolean;
  accepting_games: boolean;
  on_leaderboards: boolean;
}
/** The signed-in player's own profile. `can_rename_at` is null when a rename is open now. */
export interface MyProfile extends Settings {
  user_id: string;
  handle: string | null;
  can_rename_at: string | null;
  /** A deletion that waits for its 7-day grace; a sign-in cancels it. */
  deletion: { requested_at: string; run_after: string } | null;
}

/** The alerts a player can choose by event and channel (part 01, section 4.6). */
export const NOTIFY_DEFAULTS = {
  turn: { email: true, push: false },
  reminder: { email: true, push: false },
  game_finished: { email: false, push: false },
} as const;
export type NotifyKind = keyof typeof NOTIFY_DEFAULTS;
export type NotifyPrefs = Record<NotifyKind, { email: boolean; push: boolean }>;

/** The seven report reasons (part 01, section 8.2). Child safety comes first in the owner's queue,
 * and it has the "intimate image shared without consent" choice (48-hour take-down). */
export const REPORT_CATEGORIES = ['computer_help', 'rating_manipulation', 'leaving_or_stalling', 'offensive_handle',
  'harassment', 'child_safety_or_illegal', 'other'] as const;
export type ReportCategory = typeof REPORT_CATEGORIES[number];

export const RENAME_DAYS = 90;
const FORMAT = /^[a-z][a-z0-9_-]{1,18}[a-z0-9]$/;
// ponytail: a short list on purpose; the owner's rename is the backstop. It misses misspellings and
// other languages. Staff names go in reserved_handles with reason 'blocked', not here.
const STEMS = /admin|moderator|kingdown|fuck|cunt|nigg|fagg|retard|rapist|nazi|hitler|porn|whore|tranny|kike/;
const PARTS = new Set(['mod', 'mods', 'staff', 'support', 'official', 'system', 'fag', 'slut', 'rape', 'spic', 'chink']);
const TITLES = new Set(['gm', 'im', 'fm', 'cm', 'nm', 'lm', 'wgm', 'wim', 'wfm', 'wcm']);
const LEET: Record<string, string> = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't' };

/** Why a handle is not allowed, or null. The server checks this too, and that a handle is free. */
export function handleProblem(handle: string): string | null {
  if (!FORMAT.test(handle)) return 'Use 3 to 20 characters: a to z, 0 to 9, _ and -. Start with a letter and end with a letter or a digit.';
  const parts = handle.split(/[-_]/);
  if (TITLES.has(parts[0]) || TITLES.has(parts.at(-1)!)) return 'A handle cannot look like a chess title.';
  const plain = handle.replace(/[-_]/g, '').replace(/[013457]/g, c => LEET[c]);
  if (STEMS.test(plain) || parts.some(part => PARTS.has(part.replace(/[013457]/g, c => LEET[c])))) return 'This handle is not available.';
  return null;
}

/** A player's own dated moderation or appeal notice; no report evidence or other account IDs. */
export type AccountNotice = { id: string; created_at: string; action_id: number } & (
  { kind: 'moderation'; action: 'warning' | 'rename' | 'hide' | 'suspension'; text: string; ends_at: string | null }
  | { kind: 'appeal'; status: 'upheld' | 'reversed'; text: string }
);
export type AccountNotices = { notices: AccountNotice[]; next_notices_before: string | null };
