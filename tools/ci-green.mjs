#!/usr/bin/env node
// Usage: node tools/ci-green.mjs <full sha>
// Exit 0: every CI check suite on that commit is complete and passes (the merge-on-green rule, reuse shape included).
// Exit 1: a suite still runs, or the commit has no check yet. Exit 2: a check failed, or GitHub did not answer.
import { execFileSync } from 'node:child_process';
import { ciPasses, repo } from './merge-on-green.mjs';

const [head, ...extra] = process.argv.slice(2);
try {
  if (extra.length > 0 || !/^[0-9a-f]{40}$/.test(head ?? '')) throw new Error('usage: node tools/ci-green.mjs <full sha>');
  const pages = JSON.parse(execFileSync('gh', ['api', '--paginate', '--slurp', `repos/${repo}/commits/${head}/check-runs?per_page=100`],
    { encoding: 'utf8', timeout: 60_000 }));
  const ready = ciPasses(pages, head);
  console.log(`ci-green: ${ready ? 'pass' : 'pending'} at ${head}`);
  process.exitCode = ready ? 0 : 1;
} catch (error) {
  console.error(`ci-green: ${error.message}`);
  process.exitCode = 2;
}
