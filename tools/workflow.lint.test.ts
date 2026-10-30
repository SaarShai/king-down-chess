// One CI workflow runs the suite on each PR and on pushes to main.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checks } from './lib/registry.mjs';

describe('.github/workflows/plugin-checks.yml', () => {
  const workflow = readFileSync(join(import.meta.dirname, '..', '.github', 'workflows', 'plugin-checks.yml'), 'utf8');
  const job = (name: string) => workflow.split(`\n  ${name}:\n`)[1]?.split(/\n  [\w-]+:\n/)[0] ?? '';
  // The WebKit tests (two jobs) and the WebKit journeys (one job) run with the same install, sampler and diagnostics.
  // The board job runs one file to a runner, so its artifact names end with the file.
  const webkitJobs = [['browser-webkit', 'webkit', ''], ['browser-webkit-board', 'webkit-board', '-${{ matrix.file }}'], ['browser-webkit-ui', 'webkit-ui', '']] as const;

  it('runs once per PR update and keeps the Node 24 database suite', () => {
    const triggers = workflow.split('\non:\n')[1].split('\npermissions:')[0];
    expect(triggers).toBe('  pull_request:\n  push:\n    # staging/first-game too: the staging deploy needs CI on the exact commit it publishes.\n    branches: [main, staging/first-game]\n  workflow_dispatch:\n');
    const verify = job('verify');
    expect(verify).toContain('node-version: 24');
    expect(verify).toContain('image: postgres:17');
    expect(verify).toContain('PLUGIN_TEST_DATABASE_URL:');
    expect(verify).toContain('- run: npm run plugin:db:init-test');
    expect(verify).toContain("- run: npm test\n        env:\n          KINGDOWN_TEST_SKIP: 'tools/plugin-board{,-input,-drafts}.test.ts'\n");
    expect([...workflow.split('\njobs:\n')[1].matchAll(/^  ([\w-]+):$/gm)].map(m => m[1])).toEqual(['verify', 'browser-board', 'browser', 'browser-web', 'browser-webkit', 'browser-webkit-board', 'browser-webkit-ui']);
  });

  it('keeps the release and sample instructions in line with the CI and push gates', () => {
    const read = (path: string) => readFileSync(join(import.meta.dirname, '..', path), 'utf8');
    const release = read('docs/specs/web-adaptation/release-route.md');
    expect(release).toContain('Keep `plugin-checks.yml` for PRs and pushes to `main` and `staging/first-game`. Open a PR to start branch checks.');
    expect(release).toContain('The pre-push hook runs only the repo gate.');
    const sample = read('docs/specs/chatgpt-mvp/sample/candidates/rollers/README.md');
    expect(sample).toContain('CI and the deploy run `npm test`.');
    expect(sample).toContain('The repository push hook runs only the repo gate.');
    expect(read('tools/lib/checks.mjs')).not.toContain('pre-push');
  });

  it('removes the slow Azure mirror and limits downloads in all seven browser install steps', () => {
    const directory = join(import.meta.dirname, '..', '.github', 'workflows');
    const removeMirror = "sudo sed -i '/azure\\.archive\\.ubuntu\\.com/d' /etc/apt/apt-mirrors.txt";
    let installs = 0;
    for (const file of readdirSync(directory).filter(name => /\.ya?ml$/.test(name))) {
      const source = readFileSync(join(directory, file), 'utf8');
      for (const step of source.split(/^      - /m).filter(step => /\bplaywright install\b/.test(step))) {
        installs++;
        expect(step).toContain(removeMirror);
        expect(step).toContain('timeout-minutes: 10');
        expect(step).toContain('echo \'Acquire::http::Timeout "30"; Acquire::https::Timeout "30"; Acquire::Retries "2";\' | sudo tee /etc/apt/apt.conf.d/99-ci-downloads');
        expect(step.indexOf(removeMirror)).toBeLessThan(step.indexOf('npx playwright install'));
        expect(step.indexOf('sudo tee')).toBeLessThan(step.indexOf('npx playwright install'));
      }
    }
    expect(installs).toBe(7);
  });

  it.each(webkitJobs)('runs WebKit in the separate job %s with its own install and the time limit for its scaled steps', name => {
    const webkit = job(name);
    // The UI job also installs the character runtime for offline play.
    expect(webkit).toContain(`timeout-minutes: ${name === 'browser-webkit-ui' ? 60 : 45}`);
    expect(webkit).toContain('PLAYABLE_BROWSER: webkit');
    expect(webkit).toContain("PLAYABLE_CPU_CANVAS: '1'");
    expect(webkit).toContain('npx playwright install --with-deps webkit');
    expect(webkit).not.toContain('needs:');
    expect(job('browser')).toContain('npx playwright install --with-deps chromium');
    expect(job('browser')).not.toContain('webkit');
    for (const other of ['verify', 'browser-board', 'browser', 'browser-web']) expect(job(other)).not.toContain('PLAYABLE_CPU_CANVAS');
  });

  it('runs the Chromium board files that verify leaves out, one file to a runner', () => {
    // Side by side in verify, the three board files starved each other and every other test file (ticket 77, round 9).
    const board = job('browser-board');
    expect(board).toContain('timeout-minutes: 30');
    expect(board).toContain('      matrix:\n        file: [board, board-input, board-drafts]\n');
    expect(board).toContain('npx playwright install --with-deps chromium');
    expect(board).toContain('- run: npm test\n        env:\n          KINGDOWN_TEST_FILE: tools/plugin-${{ matrix.file }}.test.ts\n');
    expect(board).not.toContain('webkit');
  });

  it('gives the full test job 30 minutes and the Chromium checks their CI step limits', () => {
    // CI runs the steps with limits times 2 (tools/lib/checks.mjs STEP); the full npm test takes about 15 minutes there.
    expect(job('verify')).toContain('timeout-minutes: 30');
    const browser = job('browser'), names = browser.match(/- run: npm run check:browser (.+)\n/)![1].split(' ');
    const seconds = names.reduce((sum, name) => sum + checks.find(check => check.name === name)!.limit * 2, 0);
    // Allow the 10-minute install limit and four minutes for the other setup steps.
    expect(seconds / 60 + 10 + 4).toBeLessThan(Number(browser.match(/^    timeout-minutes: (\d+)$/m)![1]));
  });

  it('runs the web journeys on Chromium in their own job beside the plugin checks', () => {
    // With the plugin checks (about 20 minutes on CI) in one job, they passed its 30 minutes (run 39337731602).
    const web = job('browser-web');
    expect(web).toContain('timeout-minutes: 30');
    expect(web).toContain('npx playwright install --with-deps chromium');
    expect(web).toContain('- run: npm run check:browser home account new-game menu-extra');
    expect(web).toContain('- run: npm run check:browser web-online');
    expect(web).toContain('name: web-check-logs');
    expect(job('browser')).not.toContain('web-online');
  });

  it('runs the board, phone-size and widget checks, plugin-ui and the web journey on WebKit', () => {
    const webkit = job('browser-webkit'), board = job('browser-webkit-board'), ui = job('browser-webkit-ui');
    expect(webkit).toContain('- run: npm test');
    expect(webkit).toContain("KINGDOWN_TEST_FILE: 'tools/plugin-{board,ios-size,preview-size}.test.ts'");
    expect(webkit).toContain('name: webkit-check-logs');
    expect(board).toContain('- run: npm test');
    // One board file to a runner: side by side on one runner, the two files starved each other's WebKit page (ticket 77).
    expect(board).toContain('      matrix:\n        file: [input, drafts]\n');
    expect(board).toContain('KINGDOWN_TEST_FILE: tools/plugin-board-${{ matrix.file }}.test.ts');
    expect(board).toContain('name: webkit-board-check-logs-${{ matrix.file }}');
    expect(ui).toContain('- run: npm run check:browser plugin-ui');
    expect(ui).toContain('- run: npm run check:browser web-online');
    expect(ui).toContain('name: webkit-ui-check-logs');
  });

  it.each(webkitJobs)('starts the five-second WebKit sampler in %s after install and before the first check', name => {
    const webkit = job(name);
    const start = webkit.indexOf('      - name: Start WebKit sampler\n');
    const install = webkit.indexOf('npx playwright install --with-deps webkit');
    expect(install).toBeGreaterThan(0);
    expect(start).toBeGreaterThan(install);
    expect(start).toBeLessThan(webkit.search(/- run: npm (test|run check:browser)/));
    const sampler = webkit.slice(start).split(/\n      - /)[0];
    expect(sampler).toContain('mkdir -p /tmp/kingdown-check-runs');
    expect(sampler).toMatch(/\n          nproc\n          free -m\n/);
    expect(sampler).toContain('nohup bash tools/ci/webkit-sampler.sh /tmp/kingdown-check-runs/webkit-sampler.log >/dev/null 2>&1 &');
  });

  it.each(webkitJobs)('saves kernel output in %s on failure or cancellation before the WebKit log upload', (name, prefix, suffix) => {
    const webkit = job(name);
    const capture = webkit.split('      - name: Save kernel log\n')[1]?.split(/\n      - /)[0] ?? '';
    expect(capture).toContain('if: failure() || cancelled()');
    expect(capture).toContain('run: sudo dmesg -T | tail -n 400 > /tmp/kingdown-check-runs/dmesg.txt || true');
    expect(webkit.indexOf('- name: Save kernel log')).toBeLessThan(webkit.indexOf(`name: ${prefix}-check-logs${suffix}\n`));
  });

  it.each(webkitJobs)('uploads the WebKit sampler log of %s on every result for seven days', (name, prefix, suffix) => {
    const upload = job(name).split(/\n      - /).find(step => step.includes(`name: ${prefix}-sampler${suffix}\n`)) ?? '';
    expect(upload).toContain('if: always()');
    expect(upload).toContain('uses: actions/upload-artifact@v4');
    expect(upload).toContain('path: /tmp/kingdown-check-runs/webkit-sampler.log');
    expect(upload).toContain('retention-days: 7');
  });

  it.each(webkitJobs)('keeps time under the job limit of %s for the WebKit diagnostics after a hung step', name => {
    const webkit = job(name), limit = Number(webkit.match(/^    timeout-minutes: (\d+)$/m)![1]);
    const steps = [...webkit.matchAll(/^        timeout-minutes: (\d+)$/gm)].map(m => Number(m[1]));
    expect(steps).toHaveLength(name === 'browser-webkit-ui' ? 3 : 2);
    // Count the install limit too; allow four minutes for the other setup steps.
    expect(steps.reduce((sum, minutes) => sum + minutes, 0) + 4).toBeLessThan(limit);
  });

  it('writes the WebKit browser output to the plugin-ui log, so a crash names its reason', () => {
    expect(job('browser-webkit-ui')).toMatch(/- run: npm run check:browser plugin-ui\n\s+env:\n(\s+#.*\n)*\s+DEBUG: pw:browser\n/);
  });
});
