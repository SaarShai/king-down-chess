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

  it('runs npm test as its last step', () => {
    expect(steps().at(-1)).toContain('- run: npm test');
  });
});
