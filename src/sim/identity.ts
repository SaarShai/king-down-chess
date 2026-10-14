import { specKeyParts } from './stamp-plan';
/**
 * Immutable identity for a simulation run (docs/TAKEOVER-PLAN.md §2).
 *
 * `sourceId` hashes the code that actually plays a game, so a resume cannot mix two engines.
 * `specKey` hashes everything else that decides which games a spec plays: resolved rules, pool and
 * arrangements, seed, search and evaluation settings, and the *contents* of any `evalParams` files.
 * The run id is deliberately not in it, and neither is `games`: `buildJobs` is a prefix, so
 * extending a run to more games replays the same first N jobs and stays resumable. Everything else
 * must match or `checkResume` refuses the file.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { RunSpec } from './spec-plan';

export { sourceId } from './source-id';

/** `evalParams` by content, not by path: a file rewritten in place must block a resume. */
function pinnedEval(spec: RunSpec): { white: unknown; black: unknown } | null {
  if (!spec.evalParams) return null;
  const one = (p?: string): { path: string; sha256: string } | null => (p
    ? { path: p, sha256: createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 16) }
    : null);
  return { white: one(spec.evalParams.white), black: one(spec.evalParams.black) };
}

/** Everything but the id and the game count, with defaults resolved. */
export function specKey(spec: RunSpec): string {
  const parts = specKeyParts(spec, pinnedEval(spec));
  return createHash('sha1').update(JSON.stringify(parts)).digest('hex').slice(0, 12);
}
