import type { SkillName } from '../ai/skill';
import type { Side } from '../game';
import type { Pace } from '../render/PaintedView';
import type { Color, Rules } from '../rules/engine';

/**
 * account/sync.ts splits these fields into settings and the saved game: name a new one there too. Write
 * a new setting only when it is not at its default. Then an old save keeps its JSON. If not, the first
 * save after an update counts as a settings change, and it wins over newer settings in the account.
 */
export interface Save { daily?: string | null; back: string; fen: string; moves: string[]; white: Side; black: Side; skill?: SkillName; coords: boolean; resigned: Color | null; rules?: Rules; sound?: boolean; queen?: boolean; pace?: Pace; link?: Color | null; threats?: boolean; labels?: true }
/**
 * The fields of `Save` that are settings; the rest is the saved game. account/sync.ts keeps its own copy
 * (an import from here would add a shared chunk to the build); save.test.ts holds the two lists equal.
 */
export const SETTINGS = ['skill', 'coords', 'sound', 'queen', 'pace', 'threats', 'labels'] as const satisfies readonly (keyof Save)[];

/** The autosave's localStorage key (account/sync.ts reads it there too). */
export const SAVE_KEY = 'kingdown.save';

/** The autosave, or null: none, one it cannot parse, or one with no move list. */
export function readSave(): Save | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const s = raw ? (JSON.parse(raw) as Save) : null;
    return s && Array.isArray(s.moves) ? s : null;
  } catch { return null; }
}

/** Writes the autosave; `s` holds the settings and the game that the caller gives. */
export function writeSave(s: Save): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch { /* private mode or a full quota: play on without a save */ }
}
