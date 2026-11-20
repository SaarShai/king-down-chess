import { execFileSync } from 'node:child_process';

export const workflowPath = '.github/workflows/plugin-checks.yml';
export const workflowRuns = repository => `repos/${repository}/actions/workflows/plugin-checks.yml`;
export const treeRecordName = tree => `tested-tree-${tree}`;
const sha = /^[a-f0-9]{40}$/;
const git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
export function gitTree(commit) {
  if (!sha.test(commit) && commit !== 'HEAD') return null;
  try { return git(['rev-parse', '--verify', `${commit}^{tree}`]); } catch { return null; }
}

export function greenRun(run, repository, workflow) {
  return Boolean(run && Number.isSafeInteger(run.id) && run.status === 'completed' && run.conclusion === 'success'
    && run.workflow_id === workflow.id && run.path === workflow.path && workflow.path === workflowPath
    && run.repository?.full_name === repository && run.head_repository?.full_name === repository);
}

export function greenRecord(tree, record, run, repository, workflow) {
  return Boolean(sha.test(tree) && record?.name === treeRecordName(tree) && record.expired === false
    && record.workflow_run?.id === run?.id && greenRun(run, repository, workflow));
}

const api = endpoint => JSON.parse(execFileSync('gh', ['api', endpoint], { encoding: 'utf8', timeout: 30_000, maxBuffer: 8 * 1024 * 1024 }));
export function findGreenTree(tree, repository) {
  if (!sha.test(tree)) return false;
  try {
    const endpoint = workflowRuns(repository);
    const workflow = api(endpoint);
    const { artifacts } = api(`repos/${repository}/actions/artifacts?name=${treeRecordName(tree)}&per_page=100`);
    for (const record of artifacts) {
      if (record.expired || !Number.isSafeInteger(record.workflow_run?.id)) continue;
      const run = api(`repos/${repository}/actions/runs/${record.workflow_run.id}`);
      if (greenRecord(tree, record, run, repository, workflow)) return true;
    }
    // Before tree records, a push checked out the head SHA that GitHub reports.
    const { workflow_runs: runs } = api(`${endpoint}/runs?status=success&event=push&per_page=100`);
    for (const run of runs) {
      if (!greenRun(run, repository, workflow) || run.event !== 'push' || gitTree(run.head_sha) !== tree) continue;
      const { jobs } = api(`repos/${repository}/actions/runs/${run.id}/jobs?per_page=100`);
      if (jobs.some(job => job.name === 'verify') && jobs.some(job => job.name === 'browser-default')) return true;
    }
  } catch {
    console.error('ci: GitHub tree records unavailable. Run the full checks.');
  }
  return false;
}
