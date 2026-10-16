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

  it('runs WebKit in a separate job with its own install and the current time limit', () => {
    const webkit = job('browser-webkit');
    expect(webkit).toContain('timeout-minutes: 15');
    expect(webkit).toContain('PLAYABLE_BROWSER: webkit');
    expect(webkit).toContain('npx playwright install --with-deps webkit');
    expect(webkit).not.toContain('needs:');
    expect(job('browser')).toContain('npx playwright install --with-deps chromium');
    expect(job('browser')).not.toContain('webkit');
  });

  it('runs the board, phone-size and widget checks on WebKit', () => {
    const webkit = job('browser-webkit');
    expect(webkit).toContain('- run: npm test');
    expect(webkit).toContain("KINGDOWN_TEST_FILE: 'tools/plugin-{board,ios-size}.test.ts'");
    expect(webkit).toContain('- run: npm run check:browser plugin-ui');
    expect(webkit).toContain('name: webkit-check-logs');
  });
});
