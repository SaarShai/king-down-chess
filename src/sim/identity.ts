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
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_RULES } from '../rules/rules';
import { RunSpec, adjudication, usePairs } from './spec';

/** The code that decides how a stored game plays back. A `weights.ts` retrain changes this on purpose. */
const SRC_ROOTS = ['src/rules', 'src/ai', 'src/sim'];

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...filesUnder(p));
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

export function sourceId(root = '.'): string {
  const h = createHash('sha1');
  for (const dir of SRC_ROOTS) {
    for (const f of filesUnder(join(root, dir))) {
      h.update(f.slice(root.length)); // relative path, so the hash does not depend on where the repo sits
      h.update('\0');
      h.update(readFileSync(f));
      h.update('\0');
    }
  }
  return h.digest('hex').slice(0, 12);
}

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
  const parts = {
    seed: spec.seed,
    ai: spec.ai,
    backRanks: spec.backRanks ?? null,
    asymmetric: spec.asymmetric ?? null,
    commonSeeds: !!spec.commonSeeds,
    rules: { ...DEFAULT_RULES, ...spec.rules },
    baseRules: spec.baseRules ?? null,
    values: spec.values ?? null,
    baseValues: spec.baseValues ?? null,
    evalParams: pinnedEval(spec),
    multiPv: !!spec.multiPv,
    openingRandomPlies: spec.openingRandomPlies ?? 0,
    maxPlies: spec.maxPlies ?? 300,
    pairs: usePairs(spec),
    adjudicate: adjudication(spec),
  };
  return createHash('sha1').update(JSON.stringify(parts)).digest('hex').slice(0, 12);
}
