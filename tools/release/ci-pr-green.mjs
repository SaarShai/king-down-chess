// Use the PR check rule without the exact-build requirement for production.
import { execFileSync } from 'node:child_process';
import { ciPasses, repo } from '../merge-on-green.mjs';
import { hasGreenPrRun } from './pr-workflow.mjs';

class Retry extends Error {}
function gh(...args) {
  try {
    return JSON.parse(execFileSync('gh', ['api', ...args], { encoding: 'utf8', timeout: 60_000 }));
  } catch (error) {
    throw new Retry(error.message.split('\n')[0]);
  }
}

const [head, ...extra] = process.argv.slice(2);
try {
  if (extra.length || !/^[0-9a-f]{40}$/.test(head ?? '')) throw new Error('supply a full PR head SHA');
  const commit = `repos/${repo}/commits/${head}`;
  const pages = gh('--paginate', '--slurp', `${commit}/check-runs?per_page=100`);
  const ready = ciPasses(pages, head);
  const status = gh(`${commit}/status`);
  if (status?.sha !== head || !Number.isSafeInteger(status.total_count) || status.total_count < 0 ||
      !['success', 'pending', 'failure'].includes(status.state)) throw new Error('invalid CI commit status');
  if (status.state === 'failure') throw new Error('CI commit status does not pass');
  const passed = ready && (status.total_count === 0 || status.state === 'success') && hasGreenPrRun(gh, repo, head, pages);
  console.log(`ci-pr-green: ${passed ? 'pass' : 'pending'} at ${head}`);
  process.exitCode = passed ? 0 : 1;
} catch (error) {
  console.error(`ci-pr-green: ${error.message}`);
  process.exitCode = error instanceof Retry || error.message.startsWith('CI check-runs are incomplete') ? 3 : 2;
}
