// Change guards for a new browser check (change rehearsals of 2026-11-25, kind "new browser check").
// A check that CI must run is in a job of tools/ci-shards.mjs, and each tools/verify-*.mjs has a registry entry.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { checkShards } from './ci-shards.mjs';
import { checks } from './lib/registry.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

it('puts each browser check that CI selects in a CI job', () => {
  const jobs = checkShards();
  const inJob = new Set(jobs.flatMap(job => job.checks));
  const known = [...new Set(checks.filter(check => check.ci && inJob.has(check.name)).map(check => check.ci))].sort();
  // The same filter as checkShards: no GPU, and a default check or a named check with a ci group.
  const missed = checks.filter(check => !check.gpu && (!check.byName || check.ci) && !inJob.has(check.name))
    .map(check => `tools/lib/registry.mjs: check "${check.name}" has ci "${check.ci}", and tools/ci-shards.mjs `
      + `puts it in no CI job; use one of ${known.join(', ')}`);
  expect(missed).toEqual([]);
});

// A tools/verify-*.mjs file that is not a browser check, or that waits for a ticket. Each one has a reason.
const exempt: Record<string, string> = {
  'verify-claims.mjs': 'a Jev claim check (AGENTS.md), not a browser check',
  'verify-next-panel.mjs': 'the S1 panel proof never had an entry; ticket guard-history-01 registers or removes it',
};

it('gives each tools/verify-*.mjs browser check a registry entry', () => {
  const scripts = new Set(checks.map(check => check.script));
  // All folders of tools/: a check script is verify.mjs or verify-<name>.mjs (tools/card-motion/verify.mjs).
  const files = readdirSync(join(root, 'tools'), { recursive: true, encoding: 'utf8' })
    .filter(file => /(?:^|\/)verify(?:-[^/]*)?\.mjs$/.test(file) && !file.includes('node_modules'));
  const missing = files.filter(file => !scripts.has(`tools/${file}`) && !(file in exempt))
    .map(file => `tools/${file} is a browser check with no entry in tools/lib/registry.mjs; add { name, script, limit } `
      + 'there, or add it to the exempt list in tools/registry-ci.test.ts with a reason');
  expect(missing).toEqual([]);
  const stale = Object.keys(exempt).filter(file => !files.includes(file) || scripts.has(`tools/${file}`))
    .map(file => `tools/registry-ci.test.ts: remove "${file}" from the exempt list; it is gone or registered`);
  expect(stale).toEqual([]);
});

it('finds the script of each registry entry', () => {
  const missing = checks.filter(check => !existsSync(join(root, check.script)))
    .map(check => `tools/lib/registry.mjs: check "${check.name}" has script "${check.script}", and that file does not exist; `
      + 'correct the path, add the script, or remove the entry');
  expect(missing).toEqual([]);
});

// The named checks that CI does not run: each one runs only on a machine (by hand, or by tools/deploy.sh). A named
// check with no ci group and no ciStep must be in this list, so that "local only" is a choice, not an omission.
const localOnly: Record<string, string> = Object.fromEntries([
  ...['owner-playtest-r5', 'owner-playtest-r4', 'owner-playtest-r2', 'owner-playtest-round2-b', 'owner-playtest-b']
    .map(name => [name, 'an owner playtest round, run on request']),
  ...['next-arrange', 'account-discovery', 'staging-login', 'plugin-ui-http-staging', 'web-game-staging',
    'desktop-performance', 'shared-mechanics', 'recovery-consumers']
    .map(name => [name, 'needs a local or staging stack, a staging build or a production site']),
  ['production-comparison', 'compares two built artifacts whose paths you set (KINGDOWN_COMPARISON_*_DIST)'],
  ['cache-registration', 'serves its own worker fixture on loopback; a lane runs it by hand'],
  ...['painted-leaps', 'movement-runtime', 'king-capture-facing', 'stratus-idle-exit', 'stratus-registration',
    'character-runtime', 'layout-title', 'layout-zoom', 'w6-parts', 'search-worker', 'king-labels']
    .map(name => [name, 'a focused check that a lane runs by hand']),
  ...['ui-review-samples', 'effects-animation', 'effects-concepts', 'effects-comparisons', 'card-art', 'card-crops',
    'card-art-wide', 'card-motion', 'wide-card-motion', 'effects-game', 'motion-concepts', 'effects-states']
    .map(name => [name, 'makes review pictures for a design spec']),
  ...['gui-board-preview', 'gui-board-a8', 'gui-board-a14', 'gui-board-a15', 'gui-board-a18', 'gui-board-y3']
    .map(name => [name, 'makes GUI preview pictures']),
  ['workshop', 'the workshop is parked (docs/PARKED.md)'],
  ...['selftest-dirty', 'selftest-fail', 'selftest-hang', 'selftest-hold'].map(name => [name, 'a planned fault of the runner self-test']),
]);

it('makes each named check without a CI group local only by choice', () => {
  const missed = checks.filter(check => check.byName && !check.ci && !check.ciStep && !(check.name in localOnly))
    .map(check => `tools/lib/registry.mjs: check "${check.name}" has byName and no ci group; give it a ci group (CI runs it), `
      + `or add "${check.name}" to localOnly in tools/registry-ci.test.ts with the reason (local only)`);
  expect(missed).toEqual([]);
  const stale = Object.keys(localOnly).filter(name => {
    const check = checks.find(entry => entry.name === name);
    return !check || !check.byName || check.ci || check.ciStep;
  }).map(name => `tools/registry-ci.test.ts: remove "${name}" from localOnly; it is gone, a default check, or in CI`);
  expect(stale).toEqual([]);
});
