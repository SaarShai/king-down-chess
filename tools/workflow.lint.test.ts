// One CI workflow runs the suite on each PR and on pushes to main.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('.github/workflows/plugin-checks.yml', () => {
  const workflow = readFileSync(join(import.meta.dirname, '..', '.github', 'workflows', 'plugin-checks.yml'), 'utf8');
  const job = (name: string) => workflow.split(`\n  ${name}:\n`)[1]?.split(/\n  [\w-]+:\n/)[0] ?? '';
  // The WebKit tests and the WebKit journeys run in two jobs with the same install, sampler and diagnostics.
  const webkitJobs = [['browser-webkit', 'webkit'], ['browser-webkit-ui', 'webkit-ui']] as const;

  it('runs once per PR update and keeps the Node 24 database suite', () => {
    const triggers = workflow.split('\non:\n')[1].split('\npermissions:')[0];
    expect(triggers).toBe('  pull_request:\n  push:\n    branches: [main]\n  workflow_dispatch:\n');
    const verify = job('verify');
    expect(verify).toContain('node-version: 24');
    expect(verify).toContain('image: postgres:17');
    expect(verify).toContain('PLUGIN_TEST_DATABASE_URL:');
    expect(verify).toContain('- run: npm run plugin:db:init-test');
    expect(verify).toContain('- run: npm test');
    expect([...workflow.split('\njobs:\n')[1].matchAll(/^  ([\w-]+):$/gm)].map(m => m[1])).toEqual(['verify', 'browser', 'browser-web', 'browser-webkit', 'browser-webkit-ui', 'browser-firefox']);
  });

  it('keeps the release and sample instructions in line with the CI and push gates', () => {
    const read = (path: string) => readFileSync(join(import.meta.dirname, '..', path), 'utf8');
    const release = read('docs/specs/web-adaptation/release-route.md');
    expect(release).toContain('Keep `plugin-checks.yml` for PRs and pushes to `main`. Open a PR to start branch checks.');
    expect(release).toContain('The pre-push hook runs only the repo gate.');
    const sample = read('docs/specs/chatgpt-mvp/sample/candidates/rollers/README.md');
    expect(sample).toContain('CI and the deploy run `npm test`.');
    expect(sample).toContain('The repository push hook runs only the repo gate.');
    expect(read('tools/lib/checks.mjs')).not.toContain('pre-push');
  });

  it.each(webkitJobs)('runs WebKit in the separate job %s with its own install and the time limit for its scaled steps', name => {
    const webkit = job(name);
    // The WebKit steps run with limits times 3 (tools/lib/checks.mjs STEP), so the job has 45 minutes.
    expect(webkit).toContain('timeout-minutes: 45');
    expect(webkit).toContain('PLAYABLE_BROWSER: webkit');
    expect(webkit).toContain('npx playwright install --with-deps webkit');
    expect(webkit).not.toContain('needs:');
    expect(job('browser')).toContain('npx playwright install --with-deps chromium');
    expect(job('browser')).not.toContain('webkit');
  });

  it('gives the full test job and the Chromium checks 30 minutes for their CI step limits', () => {
    // CI runs the steps with limits times 2 (tools/lib/checks.mjs STEP); the full npm test takes about 15 minutes there.
    expect(job('verify')).toContain('timeout-minutes: 30');
    expect(job('browser')).toContain('timeout-minutes: 30');
  });

  it('runs the web journeys on Chromium in their own job beside the plugin checks', () => {
    // With the plugin checks (about 20 minutes on CI) in one job, they passed its 30 minutes (run 39337731602).
    const web = job('browser-web');
    expect(web).toContain('timeout-minutes: 30');
    expect(web).toContain('npx playwright install --with-deps chromium');
    expect(web).toContain('- run: npm run check:browser home account link-game lessons lesson-return workshop workshop-cast');
    expect(web).toContain('- run: npm run check:browser web-online');
    expect(web).toContain('name: web-check-logs');
    expect(job('browser')).not.toContain('web-online');
  });

  it('runs the board, phone-size and widget checks, plugin-ui and the web journey on WebKit', () => {
    const webkit = job('browser-webkit'), ui = job('browser-webkit-ui');
    expect(webkit).toContain('- run: npm test');
    expect(webkit).toContain("KINGDOWN_TEST_FILE: 'tools/plugin-{board,ios-size,preview-size}.test.ts'");
    expect(webkit).toContain('name: webkit-check-logs');
    expect(ui).toContain('- run: npm run check:browser plugin-ui');
    expect(ui).toContain('- run: npm run check:browser web-online');
    expect(ui).toContain('name: webkit-ui-check-logs');
  });

  it.each(webkitJobs)('starts the five-second WebKit sampler in %s after install and before the first check', name => {
    const webkit = job(name);
    const start = webkit.indexOf('      - name: Start WebKit sampler\n');
    expect(start).toBeGreaterThan(webkit.indexOf('- run: npx playwright install --with-deps webkit'));
    expect(start).toBeLessThan(webkit.search(/- run: npm (test|run check:browser)/));
    const sampler = webkit.slice(start).split(/\n      - /)[0];
    expect(sampler).toContain('mkdir -p /tmp/kingdown-check-runs');
    expect(sampler).toMatch(/\n          nproc\n          free -m\n/);
    expect(sampler).toContain('nohup bash tools/ci/webkit-sampler.sh /tmp/kingdown-check-runs/webkit-sampler.log >/dev/null 2>&1 &');
  });

  it.each(webkitJobs)('saves kernel output in %s on failure or cancellation before the WebKit log upload', (name, prefix) => {
    const webkit = job(name);
    const capture = webkit.split('      - name: Save kernel log\n')[1]?.split(/\n      - /)[0] ?? '';
    expect(capture).toContain('if: failure() || cancelled()');
    expect(capture).toContain('run: sudo dmesg -T | tail -n 400 > /tmp/kingdown-check-runs/dmesg.txt || true');
    expect(webkit.indexOf('- name: Save kernel log')).toBeLessThan(webkit.indexOf(`name: ${prefix}-check-logs`));
  });

  it.each(webkitJobs)('uploads the WebKit sampler log of %s on every result for seven days', (name, prefix) => {
    const upload = job(name).split(/\n      - /).find(step => step.includes(`name: ${prefix}-sampler\n`)) ?? '';
    expect(upload).toContain('if: always()');
    expect(upload).toContain('uses: actions/upload-artifact@v4');
    expect(upload).toContain('path: /tmp/kingdown-check-runs/webkit-sampler.log');
    expect(upload).toContain('retention-days: 7');
  });

  it.each(webkitJobs)('keeps time under the job limit of %s for the WebKit diagnostics after a hung step', name => {
    const webkit = job(name), limit = Number(webkit.match(/^    timeout-minutes: (\d+)$/m)![1]);
    const steps = [...webkit.matchAll(/^        timeout-minutes: (\d+)$/gm)].map(m => Number(m[1]));
    expect(steps).toHaveLength(name === 'browser-webkit' ? 1 : 2);
    // Every step limit in turn after the setup, which took 10 minutes with a slow package mirror (run 39908178007).
    expect(steps.reduce((sum, minutes) => sum + minutes, 0) + 10).toBeLessThan(limit);
  });

  it('writes the WebKit browser output to the plugin-ui log, so a crash names its reason', () => {
    expect(job('browser-webkit-ui')).toMatch(/- run: npm run check:browser plugin-ui\n\s+env:\n(\s+#.*\n)*\s+DEBUG: pw:browser\n/);
  });
});
