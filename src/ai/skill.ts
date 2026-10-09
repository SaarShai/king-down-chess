import { SearchOptions } from './search';

export type SkillName = 'beginner' | 'casual' | 'club' | 'strong';

export interface SkillPlan extends SearchOptions {
  /** Chance to ignore the search and play a random legal move. */
  blunder: number;
}

/** Strong's thinking time. Club, Casual and Beginner cap it lower, so each level is a different opponent. */
const STRONG_MS = 2500;

/**
 * Weaker opponents search, then waste the result.
 * A depth cap plays a good shallow move and then hangs a piece (docs/research/ai-players.md §5).
 * Beginner and Casual keep a wide score band all game, plus a small chance of a random legal move.
 * `thinkMs` is for the tools and the simulator only: a shorter time, under the same caps.
 */
export function skillPlan(skill: SkillName, ply: number, thinkMs = STRONG_MS): SkillPlan {
  const opening = ply < 6;
  if (skill === 'strong') return { timeMs: thinkMs, temperature: opening ? 15 : 0, blunder: 0 };
  if (skill === 'club') return { timeMs: Math.min(thinkMs, 800), temperature: opening ? 15 : 0, blunder: 0 };
  if (skill === 'casual') return { timeMs: Math.min(thinkMs, 800), temperature: 80, blunder: 0.04 };
  return { timeMs: Math.min(thinkMs, 700), temperature: 200, blunder: 0.1 };
}
