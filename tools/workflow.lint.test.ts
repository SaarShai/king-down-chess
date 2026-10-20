// One CI workflow runs the suite on each PR and on pushes to main.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('.github/workflows/plugin-checks.yml', () => {
  const workflow = readFileSync(join(import.meta.dirname, '..', '.github', 'workflows', 'plugin-checks.yml'), 'utf8');
  const job = (name: string) => workflow.split(`\n  ${name}:\n`)[1]?.split(/\n  [\w-]+:\n/)[0] ?? '';

  it('runs once per PR update and keeps the Node 24 database suite', () => {
    const triggers = workflow.split('\non:\n')[1].split('\npermissions:')[0];
    expect(triggers).toBe('  pull_request:\n  push:\n    branches: [main]\n  workflow_dispatch:\n');
    const verify = job('verify');
    expect(verify).toContain('node-version: 24');
    expect(verify).toContain('image: postgres:17');
    expect(verify).toContain('PLUGIN_TEST_DATABASE_URL:');
    expect(verify).toContain('- run: npm run plugin:db:init-test');
    expect(verify).toContain('- run: npm test');
    expect([...workflow.split('\njobs:\n')[1].matchAll(/^  ([\w-]+):$/gm)].map(m => m[1])).toEqual(['verify', 'browser', 'browser-webkit', 'browser-firefox']);
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

  it('runs WebKit in a separate job with its own install and the time limit for its scaled steps', () => {
    const webkit = job('browser-webkit');
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

  it('runs the board, phone-size and widget checks on WebKit', () => {
    const webkit = job('browser-webkit');
    expect(webkit).toContain('- run: npm test');
    expect(webkit).toContain("KINGDOWN_TEST_FILE: 'tools/plugin-{board,ios-size,preview-size}.test.ts'");
    expect(webkit).toContain('- run: npm run check:browser plugin-ui');
    expect(webkit).toContain('name: webkit-check-logs');
  });

  it('starts the five-second WebKit sampler after install and before npm test', () => {
    const webkit = job('browser-webkit');
    const start = webkit.indexOf('      - name: Start WebKit sampler\n');
    expect(start).toBeGreaterThan(webkit.indexOf('- run: npx playwright install --with-deps webkit'));
    expect(start).toBeLessThan(webkit.indexOf('- run: npm test'));
    const sampler = webkit.slice(start).split(/\n      - /)[0];
    expect(sampler).toContain('mkdir -p /tmp/kingdown-check-runs');
    expect(sampler).toMatch(/\n          nproc\n          free -m\n/);
    expect(sampler).toContain('nohup bash tools/ci/webkit-sampler.sh /tmp/kingdown-check-runs/webkit-sampler.log >/dev/null 2>&1 &');
  });

  it('saves kernel output on failure or cancellation before the WebKit log upload', () => {
    const webkit = job('browser-webkit');
    const capture = webkit.split('      - name: Save kernel log\n')[1]?.split(/\n      - /)[0] ?? '';
    expect(capture).toContain('if: failure() || cancelled()');
    expect(capture).toContain('run: sudo dmesg -T | tail -n 400 > /tmp/kingdown-check-runs/dmesg.txt || true');
    expect(webkit.indexOf('- name: Save kernel log')).toBeLessThan(webkit.indexOf('name: webkit-check-logs'));
  });

  it('uploads the WebKit sampler log on every result for seven days', () => {
    const upload = job('browser-webkit').split(/\n      - /).find(step => step.includes('name: webkit-sampler\n')) ?? '';
    expect(upload).toContain('if: always()');
    expect(upload).toContain('uses: actions/upload-artifact@v4');
    expect(upload).toContain('path: /tmp/kingdown-check-runs/webkit-sampler.log');
    expect(upload).toContain('retention-days: 7');
  });

  it('keeps time under the job limit for the WebKit diagnostics after a hung step', () => {
    const webkit = job('browser-webkit'), limit = Number(webkit.match(/^    timeout-minutes: (\d+)$/m)![1]);
    const steps = [...webkit.matchAll(/^        timeout-minutes: (\d+)$/gm)].map(m => Number(m[1]));
    expect(steps).toHaveLength(3);
    // npm test, plugin-ui and web-online in turn; the setup before them takes about 2 minutes.
    expect(Math.max(steps[0], steps[1] + 15) + 2).toBeLessThan(limit);
  });

  it('writes the WebKit browser output to the plugin-ui log, so a crash names its reason', () => {
    expect(job('browser-webkit')).toMatch(/- run: npm run check:browser plugin-ui\n\s+env:\n(\s+#.*\n)*\s+DEBUG: pw:browser\n/);
  });
});
