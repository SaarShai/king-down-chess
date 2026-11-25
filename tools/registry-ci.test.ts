// Change guards for a new browser check (change rehearsals of 2026-11-25, kind "new browser check").
// A check that CI must run is in a job of tools/ci-shards.mjs, and each tools/verify-*.mjs has a registry entry.
import { readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { checkShards } from './ci-shards.mjs';
import { checks } from './lib/registry.mjs';

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
  const files = readdirSync('tools').filter(file => /^verify-.*\.mjs$/.test(file));
  const missing = files.filter(file => !scripts.has(`tools/${file}`) && !(file in exempt))
    .map(file => `tools/${file} is a browser check with no entry in tools/lib/registry.mjs; add { name, script, limit } `
      + 'there, or add it to the exempt list in tools/registry-ci.test.ts with a reason');
  expect(missing).toEqual([]);
  const stale = Object.keys(exempt).filter(file => !files.includes(file) || scripts.has(`tools/${file}`))
    .map(file => `tools/registry-ci.test.ts: remove "${file}" from the exempt list; it is gone or registered`);
  expect(stale).toEqual([]);
});
