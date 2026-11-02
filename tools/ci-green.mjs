#!/usr/bin/env node
// Usage: node tools/ci-green.mjs <full sha>
// Exit 0: every CI check suite on that commit is complete and passes (the merge-on-green rule, reuse shape included).
// Exit 1: a suite still runs, or the commit has no check yet. Exit 2: a check failed, or the commit status is failure.
// Exit 3: GitHub did not answer, or the pages were not whole (try again).
import { execFileSync } from 'node:child_process';
import { ciPasses, repo } from './merge-on-green.mjs';

class Retry extends Error { constructor(cause) { super(`try again: ${cause.message.split('\n')[0]}`); } }
const [head, ...extra] = process.argv.slice(2);
try {
  if (extra.length > 0 || !/^[0-9a-f]{40}$/.test(head ?? '')) throw new Error('usage: node tools/ci-green.mjs <full sha>');
  const gh = args => { try { return JSON.parse(execFileSync('gh', args, { encoding: 'utf8', timeout: 60_000 })); } catch (error) { throw new Retry(error); } };
  const pages = gh(['api', '--paginate', '--slurp', `repos/${repo}/commits/${head}/check-runs?per_page=100`]);
  let ready;
  try { ready = ciPasses(pages, head); } catch (error) { throw error.message.includes('incomplete') ? new Retry(error) : error; }
  // As in mergeOnGreen: the combined commit status (other apps) must not be failure, and must be success when it exists.
  const status = gh(['api', `repos/${repo}/commits/${head}/status`]);
  if (status?.sha !== head || !['success', 'pending', 'failure'].includes(status.state)) throw new Error('invalid CI commit status');
  if (status.state === 'failure') throw new Error('CI commit status does not pass');
  ready &&= status.total_count === 0 || status.state === 'success';
  console.log(`ci-green: ${ready ? 'pass' : 'pending'} at ${head}`);
  process.exitCode = ready ? 0 : 1;
} catch (error) {
  console.error(`ci-green: ${error.message}`);
  process.exitCode = error instanceof Retry ? 3 : 2;
}
