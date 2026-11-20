// Keep the workflow, sharding tool and release gate on the same contract.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const workflow = read('.github/workflows/plugin-checks.yml');
const job = (name: string) => workflow.split(`\n  ${name}:\n`)[1]?.split(/\n  [\w-]+:\n/)[0] ?? '';

describe('plugin-checks workflow', () => {
  it('starts a run on every PR, on main and staging pushes, and on dispatch', () => {
    const triggers = workflow.split('\non:\n')[1].split('\npermissions:')[0];
    expect(triggers).toContain('  pull_request:\n');
    expect(triggers).toContain('    branches: [main, staging/first-game]');
    expect(triggers).toContain('  workflow_dispatch:\n    inputs:\n      base:');
    expect(triggers).not.toMatch(/paths(?:-ignore)?:/);
    expect(job('reuse')).toContain('CI_BASE: ${{ github.event.pull_request.base.sha || github.event.before || inputs.base }}');
    expect(job('reuse')).toContain('run: node tools/ci-plan.mjs workflow');
  });

  it('checks types and docs on the short path and requires the plan results to record a tree', () => {
    const verify = job('verify');
    expect(verify).toContain('npm run typecheck');
    expect(verify).toContain("if: needs.reuse.outputs.verify_tests != ''\n        run: npm test");
    expect(verify).toContain('KINGDOWN_TEST_FILE: ${{ needs.reuse.outputs.verify_tests }}');
    expect(verify).toContain("if: needs.reuse.outputs.mode != 'full'\n        run: npm run test:docs");
    expect(job('checks')).toContain("if: contains(fromJSON('[\"full\",\"selected\"]'), needs.reuse.outputs.mode)");
    expect(job('record-tree')).toContain('needs: [reuse, verify, checks]');
    expect(job('record-tree')).toContain("needs.verify.result == 'success' && needs.checks.result == 'success'");
    expect(job('record-tree')).toContain('sparse-checkout: tools');
    expect(job('record-tree')).toContain('node tools/ci-plan.mjs record');
    expect(job('record-tree')).toContain('name: tested-tree-${{ steps.tree.outputs.hash }}');
  });

  it('runs the shard plan and keeps the deploy browser gate', () => {
    const shard = job('checks');
    expect(shard).toContain('matrix: ${{ fromJSON(needs.reuse.outputs.matrix) }}');
    expect(shard).toContain("fetch-depth: ${{ matrix.python && '0' || '1' }}");
    expect(job('verify')).toContain("fetch-depth: ${{ needs.reuse.outputs.mode == 'full' && '1' || '0' }}");
    expect(shard).toContain('KINGDOWN_TEST_FILE: ${{ matrix.tests }}');
    expect(shard).toContain('KINGDOWN_CI_BROWSER_CHECKS: ${{ matrix.checks }}');
    expect(shard).toContain('KINGDOWN_PLUGIN_UI_PART: ${{ matrix.part }}');
    const browser = '      - run: npm run check:browser -- --no-gpu';
    expect(shard).toContain(browser + '\n');
    expect(read('tools/deploy.sh')).toContain(`grep -qx '${browser}' .github/workflows/plugin-checks.yml`);
    for (const name of ['verify', 'checks']) {
      expect(job(name)).toContain('node-version: 24');
      expect(job(name)).toContain('image: postgres:17');
      expect(job(name)).toContain('PLUGIN_TEST_DATABASE_URL:');
      expect(job(name)).toContain('npm run plugin:db:init-test');
    }
  });

  it('keeps WebKit diagnostics and the Ubuntu install guard', () => {
    const shard = job('checks');
    expect(shard).toContain("PLAYABLE_CPU_CANVAS: ${{ (matrix.browser == 'webkit' || matrix.name == 'browser-ui (http)') && '1' || '' }}");
    expect(shard).toContain("DEBUG: ${{ matrix.browser == 'webkit' && 'pw:browser' || '' }}");
    expect(shard).toContain("archive.ubuntu.com/ubuntu/\\tpriority:2");
    expect(shard).toContain('Acquire::http::Timeout "30"; Acquire::https::Timeout "30"; Acquire::Retries "2";');
    expect(shard).toContain('npx playwright install --with-deps "$PLAYABLE_BROWSER"\n        timeout-minutes: 10');
    expect(shard.indexOf('name: Save kernel log')).toBeLessThan(shard.indexOf('uses: actions/upload-artifact@v4'));
    expect(shard).toContain("if: matrix.browser == 'webkit' && (failure() || cancelled())\n        name: Save kernel log");
    expect(shard).toContain('nohup bash tools/ci/webkit-sampler.sh /tmp/kingdown-check-runs/webkit-sampler.log');
    expect(shard).toContain("if: always() && (matrix.browser == 'webkit' || matrix.checks != '')");
    expect(shard).toContain('retention-days: 7');
  });

  it('keeps the release and sample instructions in line with the CI and push gates', () => {
    const release = read('docs/specs/web-adaptation/release-route.md');
    expect(release).toContain('Keep `plugin-checks.yml` for PRs and pushes to `main` and `staging/first-game`. Open a PR to start branch checks.');
    expect(release).toContain('The pre-push hook runs only the repo gate.');
    const sample = read('docs/specs/chatgpt-mvp/sample/candidates/rollers/README.md');
    expect(sample).toContain('CI and the deploy run `npm test`.');
    expect(sample).toContain('The repository push hook runs only the repo gate.');
    expect(read('tools/lib/checks.mjs')).not.toContain('pre-push');
  });
});
