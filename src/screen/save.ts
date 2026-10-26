import type { SkillName } from '../ai/skill';
import { Game, type Side } from '../game';
import type { Pace } from '../render/PaintedView';
import type { Color, Rules } from '../rules/engine';

/**
 * account/sync.ts splits these fields into settings and the saved game: name a new one there too. Write
 * a new setting only when it is not at its default. Then an old save keeps its JSON. If not, the first
 * save after an update counts as a settings change, and it wins over newer settings in the account.
 */
export interface Save {
  daily?: string | null; back: string; fen: string; moves: string[]; white: Side; black: Side; skill?: SkillName; coords: boolean; resigned: Color | null; rules?: Rules; sound?: boolean; queen?: boolean; pace?: Pace; link?: Color | null; threats?: boolean; labels?: true;
  /** The last plies of `moves` that are staged, not handed over (web-redesign spec §4.8); written only when more than 0. */
  staged?: number;
}
/**
 * The fields of `Save` that are settings; the rest is the saved game. account/sync.ts keeps its own copy
 * (an import from here would add a shared chunk to the build); save.test.ts holds the two lists equal.
 */
export const SETTINGS = ['skill', 'coords', 'sound', 'queen', 'pace', 'threats', 'labels'] as const satisfies readonly (keyof Save)[];

/** The autosave's localStorage key (account/sync.ts reads it there too). */
export const SAVE_KEY = 'kingdown.save';

export interface SaveRead { save: Save | null; unreadable: boolean }

/** Compare only game fields; settings and JSON key order can change without changing the game. */
export function gameJSON(s: Save | null): string {
  const game: Partial<Save> | null = s ? { ...s } : null;
  if (game) for (const k of SETTINGS) delete game[k];
  return JSON.stringify(game, (_k, v) => v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a < b ? -1 : 1)) : v);
}

/** Missing data is different from data that this page must preserve until the player replaces it. */
export function readSave(): SaveRead {
  let raw: string | null;
  try { raw = localStorage.getItem(SAVE_KEY); }
  catch { return { save: null, unreadable: false }; } // Storage can be unavailable while local practice still works.
  if (raw === null) return { save: null, unreadable: false };
  try {
    const s = JSON.parse(raw);
    savedGame(s);
    return { save: s, unreadable: false };
  } catch { return { save: null, unreadable: true }; }
}

/**
 * The settings fields of stored data whose game cannot replay (readSave's `unreadable`), or null when the data
 * is not a JSON object. The page still honours them (Animations Off, sound); it writes nothing.
 */
export function storedSettings(): Partial<Pick<Save, (typeof SETTINGS)[number]>> | null {
  try {
    const s: unknown = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
    return s && typeof s === 'object' && !Array.isArray(s) ? Object.fromEntries(SETTINGS.filter(k => k in s).map(k => [k, (s as Save)[k]])) : null;
  } catch { return null; }
}

/** Build a separate game; partial replay never replaces the live game. */
export function savedGame(value: unknown): Game {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Unreadable saved game');
  const s = value as Save;
  if (!Array.isArray(s.moves) || s.moves.some(move => typeof move !== 'string') || typeof s.back !== 'string' || typeof s.fen !== 'string') throw new Error('Unreadable saved game');
  if (s.rules !== undefined && (!s.rules || typeof s.rules !== 'object' || Array.isArray(s.rules))) throw new Error('Unreadable saved rules');
  const game = new Game(s.back || undefined, s.rules);
  if (!s.back) game.load(game.context.fromFen(s.fen));
  if (game.playLan(s.moves) !== s.moves.length) throw new Error('Incomplete saved game');
  return game;
}

/** Writes the autosave; `s` holds the settings and the game that the caller gives. */
export function writeSave(s: Save): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch { /* private mode or a full quota: play on without a save */ }
}
