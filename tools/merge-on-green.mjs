#!/usr/bin/env node
// Usage: node tools/merge-on-green.mjs <pr> <full head sha> <review.json>
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { setTimeout } from 'node:timers/promises';

const repo = 'SaarShai/king-down-chess';
const fullSha = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const require = (condition, reason) => { if (!condition) throw new Error(reason); };
const github = args => execFileSync('gh', args, { encoding: 'utf8', timeout: 60_000 });

function reviewRecord(file, pr, head) {
  let record;
  try { record = JSON.parse(readFileSync(file, 'utf8')); }
  catch { throw new Error('cannot read the review record as JSON'); }
  require(record?.pr === pr && record.head === head && fullSha(record.base), 'review record PR, head, or base differs');
  require(Array.isArray(record.reviews) && record.reviews.length > 0, 'record every requested review');
  const ids = new Set();
  for (const review of record.reviews) {
    require(review && text(review.id) && !ids.has(review.id), 'review IDs must be present and unique');
    ids.add(review.id);
    require(fullSha(review.head) && fullSha(review.base), `review ${review.id}: full head and base are required`);
    require(review.result === 'complete', `review ${review.id}: result is not complete`);
    require(Array.isArray(review.openFindings) && review.openFindings.length === 0, `review ${review.id}: open findings or missing finding list`);
    if (review.head !== head || review.base !== record.base) {
      const reconcile = review.reconcile;
      require(reconcile?.head === head && reconcile.base === record.base && reconcile.result === 'pass' && text(reconcile.note),
        `review ${review.id}: record a reconcile for the current head and base`);
    }
  }
  return record;
}

/** Check all requested reviews and all CI check-runs before a merge of this exact head. */
export async function mergeOnGreen(pr, head, file, { gh = github, pause = setTimeout } = {}) {
  require(Number.isSafeInteger(pr) && pr > 0 && fullSha(head) && text(file),
    'usage: node tools/merge-on-green.mjs <pr> <full head sha> <review.json>');
  for (let attempt = 0; attempt < 240; attempt++) {
    const record = reviewRecord(file, pr, head);
    const current = JSON.parse(gh(['pr', 'view', String(pr), '--repo', repo,
      '--json', 'number,state,headRefOid,baseRefOid']));
    require(current.number === pr && current.state === 'OPEN' && current.headRefOid === head && current.baseRefOid === record.base,
      'PR is not open at the recorded head and base');
    const pages = JSON.parse(gh(['api', '--paginate', '--slurp',
      `repos/${repo}/commits/${head}/check-runs?per_page=100`]));
    require(Array.isArray(pages) && pages.length > 0 && pages.every(page => Array.isArray(page.check_runs)), 'invalid CI check-runs');
    const checks = pages.flatMap(page => page.check_runs);
    require(pages.every(page => page.total_count === checks.length), 'CI check-runs are incomplete; run the helper again');
    require(checks.every(check => check.head_sha === head), 'CI check head differs');
    require(checks.every(check => ['queued', 'in_progress', 'completed', 'waiting', 'requested', 'pending'].includes(check.status)), 'invalid CI check status');
    require(checks.every(check => check.status !== 'completed' || check.conclusion === 'success'), 'CI check does not pass');
    if (checks.length >= 11 && checks.every(check => check.status === 'completed')) {
      // A review can start or report a finding while the CI request runs.
      const latest = reviewRecord(file, pr, head);
      require(latest.base === current.baseRefOid, 'review record base changes before merge');
      return gh(['pr', 'merge', String(pr), '--repo', repo, '--merge', '--match-head-commit', head]);
    }
    if (attempt < 239) await pause(60_000);
  }
  throw new Error('CI does not pass within four hours');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [pr, head, file, ...extra] = process.argv.slice(2);
  try {
    require(extra.length === 0 && /^[1-9][0-9]*$/.test(pr ?? ''), 'supply a PR, full head sha, and review record');
    console.log(await mergeOnGreen(Number(pr), head, file));
  } catch (error) {
    console.error(`merge-on-green: ${error.message}`);
    process.exitCode = 1;
  }
}
