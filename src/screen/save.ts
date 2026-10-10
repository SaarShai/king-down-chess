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
