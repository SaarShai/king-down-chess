// Workflow lint (checks-and-hooks/04, story 16): a merge on GitHub runs no local hook, so one
// workflow runs `npm test` on each pull request into main. The pre-push hook tests each push, so
// the workflow has no push trigger.
// The repository has no YAML parser, so the lint reads the file as lines. It reads only the shape
// that test.yml uses: top-level keys at column 0, and steps as `- ` items under `steps:`.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const text = readFileSync(join(import.meta.dirname, '..', '.github', 'workflows', 'test.yml'), 'utf8');
const lines = text.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

/** The lines under a top-level key, up to the next top-level key. */
const block = (key: string) => {
  const start = lines.findIndex(line => line === `${key}:` || line.startsWith(`${key}: `));
  expect(start, `test.yml has no top-level "${key}"`).toBeGreaterThanOrEqual(0);
  const end = lines.findIndex((line, i) => i > start && /^\S/.test(line));
  return lines.slice(start, end === -1 ? undefined : end);
};
/** The steps of the one job, each as its lines. */
const steps = () => {
  const start = lines.findIndex(line => /^\s+steps:\s*$/.test(line));
  expect(start, 'test.yml has no steps').toBeGreaterThanOrEqual(0);
  const indent = lines[start + 1].search(/\S/);
  const result: string[][] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.search(/\S/) < indent) break;
    if (line.search(/\S/) === indent && line.trim().startsWith('- ')) result.push([]);
    result.at(-1)!.push(line.trim());
  }
  return result;
};

describe('.github/workflows/test.yml', () => {
  it('runs on pull requests into main only, with no push trigger', () => {
    const on = block('on').map(line => line.trim());
    expect(on).toEqual(['on:', 'pull_request:', 'branches: [main]']);
  });

  it('uses Node 22', () => {
    expect(steps().find(step => step.some(line => line.includes('actions/setup-node')))).toContain('node-version: 22');
  });

  it('installs with npm ci and no browser download', () => {
    const install = steps().find(step => step.some(line => /run: npm ci\b/.test(line)));
    expect(install, 'no `npm ci` step').toBeDefined();
    expect(install).toContain("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1'");
  });

  it('installs Chromium for the browser tests before npm test', () => {
    const at = (pattern: RegExp) => steps().findIndex(step => step.some(line => pattern.test(line)));
    expect(at(/run: npx playwright install --with-deps chromium$/), 'no Chromium install step').toBeGreaterThan(at(/run: npm ci\b/));
    expect(at(/run: npx playwright install/)).toBeLessThan(at(/run: npm test$/));
  });

  it('runs npm test as its last step', () => {
    expect(steps().at(-1)).toContain('- run: npm test');
  });
});

describe('.github/workflows/plugin-checks.yml', () => {
  const workflow = readFileSync(join(import.meta.dirname, '..', '.github', 'workflows', 'plugin-checks.yml'), 'utf8');
  const job = (name: string) => workflow.split(`\n  ${name}:\n`)[1]?.split(/\n  [\w-]+:\n/)[0] ?? '';

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

  it('writes the WebKit browser output to the plugin-ui log, so a crash names its reason', () => {
    expect(job('browser-webkit')).toMatch(/- run: npm run check:browser plugin-ui\n\s+env:\n(\s+#.*\n)*\s+DEBUG: pw:browser\n/);
  });
});
