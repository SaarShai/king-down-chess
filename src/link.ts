/**
 * The Archer a game link plays (docs/RULES.md Decision 19). A link names it in `&archer=`, so a game
 * opens under the Archer it began with. A link without it was made before 2026-10-05, under
 * `ARCHER_BEFORE_OVER2`; a `?rules=` preset sets its own Archer, and the link then names none.
 */
import { ARCHER_BEFORE_OVER2, parseRule, type Rules } from './rules/rules';

/** The `archer` value for a link of a game played under `rules`, or null when a preset decides it. */
export const archerParam = (rules: Rules, preset: boolean): string | null => (preset ? null : rules.archerShots);

/** The rules a link's `archer` adds; throws on a value that is not an Archer reading. */
export function linkArcher(params: URLSearchParams, preset: boolean): Partial<Rules> {
  return preset ? {} : parseRule(`archerShots=${params.get('archer') ?? ARCHER_BEFORE_OVER2}`);
}
