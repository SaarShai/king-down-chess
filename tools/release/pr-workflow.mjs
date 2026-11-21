import { greenRun, workflowPath, workflowRuns } from '../ci-green-tree.mjs';

export function hasGreenPrRun(read, repo, head, pages) {
  const { workflow_runs: runs } = read(`${workflowRuns(repo)}/runs?head_sha=${head}&per_page=100`);
  const suites = new Set(pages.flatMap(page => page.check_runs.map(check => check.check_suite?.id)));
  return runs.some(run => run.head_sha === head && run.event === 'pull_request'
    && greenRun(run, repo, { id: run.workflow_id, path: workflowPath })
    && Number.isSafeInteger(run.check_suite_id) && suites.has(run.check_suite_id));
}
