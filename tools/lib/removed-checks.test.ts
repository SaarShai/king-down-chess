// Unit test for the assertion counter (checks-and-hooks/10). The counter reads a unified diff
// (git diff -U0) and gives the assertion lines that the diff removes from the registered checks.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as shared from './checks.mjs';
import { checks, probeFiles } from './registry.mjs';
import { assertionNames, registeredChecks, removedAssertions } from './removed-checks.mjs';

const check = 'tools/verify-workshop.mjs';
const other = 'tools/verify-powers.mjs';

/** One file section of a -U0 diff: each hunk is [old start, removed lines, added lines]. */
const file = (path: string, ...hunks: [number, string[], string[]][]) => [
  `diff --git a/${path} b/${path}`,
  `--- a/${path}`,
  `+++ b/${path}`,
  ...hunks.flatMap(([start, removed, added]) => [
    `@@ -${start},${removed.length} +${start},${added.length} @@`,
    ...removed.map(line => `-${line}`),
    ...added.map(line => `+${line}`),
  ]),
].join('\n');
const count = (...files: string[]) => removedAssertions(files.join('\n') + '\n', { paths: [check, other] });

describe('removedAssertions', () => {
  it('counts removed assert, expect and shared-assertion calls, with file, line and text', () => {
    const found = count(file(check, [10, [
      '  assert.equal(await p.locator(".ws-board").count(), 2);',
      '  assert(ok, "the board renders");',
      '  expect(cells).toHaveLength(64);',
      '  await noOverlap(p, ".ws-board");',
      '  assertNoErrors();',
    ], []]));
    expect(found).toEqual([
      { file: check, line: 10, text: 'assert.equal(await p.locator(".ws-board").count(), 2);' },
      { file: check, line: 11, text: 'assert(ok, "the board renders");' },
      { file: check, line: 12, text: 'expect(cells).toHaveLength(64);' },
      { file: check, line: 13, text: 'await noOverlap(p, ".ws-board");' },
      { file: check, line: 14, text: 'assertNoErrors();' },
    ]);
  });

  it('does not count a removed comment or a removed line with no assertion call', () => {
    expect(count(file(check, [3, [
      '  // assert.equal(a, b);',
      '  /* expect(a).toBe(b); */',
      '   * await noOverlap(p, ".x");',
      '  await p.click(".ws-board");',
      '  const asserted = expectation(a);',
      '  console.log("assert(a)");',
      '  await p.click(".x"); // assert.ok(done)',
      '',
    ], []]))).toEqual([]);
  });

  it('does not count a line that the same diff adds again, in the same file or in another file', () => {
    const moved = '  assert.equal(a, 1);';
    expect(count(file(check, [5, [moved], []], [40, [], [`    ${moved.trim()}`]]))).toEqual([]);
    expect(count(file(check, [5, [moved], []]), file('tools/lib/workshop-steps.mjs', [1, [], [moved]]))).toEqual([]);
    // One added copy frees one removed copy only.
    expect(count(file(check, [5, [moved, moved], [moved]]))).toHaveLength(1);
  });

  it('does not count files outside the registry', () => {
    expect(count(file('tools/new-game-ui.mjs', [1, ['  assert.equal(a, 1);', '  expect(b).toBe(2);'], []]))).toEqual([]);
  });

  it('counts the probe files that ux-defects runs, and not its other files', () => {
    const probe = 'tools/ux-defects/d10-enemy-card.mjs';
    expect(count(file(probe, [21, ["    assert.equal(await text('#move-help'), '');"], []])))
      .toEqual([{ file: probe, line: 21, text: "assert.equal(await text('#move-help'), '');" }]);
    for (const path of ['tools/ux-defects/open.mjs', 'tools/ux-defects/notes.md', 'tools/ux-defects/sub/d1-x.mjs']) {
      expect(count(file(path, [1, ['assert.ok(x);'], []])), path).toEqual([]);
    }
  });

  it('counts the removed lines of a deleted check', () => {
    const diff = [`diff --git a/${other} b/${other}`, 'deleted file mode 100644', `--- a/${other}`, '+++ /dev/null',
      '@@ -1,2 +0,0 @@', "-import assert from 'node:assert/strict';", '-assert.ok(true);'].join('\n');
    expect(count(diff)).toEqual([{ file: other, line: 2, text: 'assert.ok(true);' }]);
  });

  it('reads a removed line that starts with dashes as a removed line, not as a file header', () => {
    expect(count(file(check, [7, ['-- assert.ok(x)', '--- expect(y)'], []]))).toHaveLength(2);
  });
});

describe('the counter reads its lists from the runner and the shared module', () => {
  it('takes the registered check paths from the runner registry', () => {
    expect(registeredChecks()).toEqual([...new Set(checks.map(c => c.script))]);
  });

  it('takes the probe files from the registry pattern that the ux-defects runner uses', () => {
    const probes = readdirSync(join(__dirname, '..', 'ux-defects')).map(name => `tools/ux-defects/${name}`).filter(path => probeFiles.test(path));
    expect(probes).toContain('tools/ux-defects/d10-enemy-card.mjs');
    expect(probes).not.toContain('tools/ux-defects/open.mjs');
    expect(readFileSync(join(__dirname, '..', 'verify-ux-defects.mjs'), 'utf8')).toContain('probeFiles.test(');
  });

  it('takes the assertion names from the exports of the shared check module', () => {
    const names = assertionNames();
    for (const name of names) expect(typeof (shared as Record<string, unknown>)[name], name).toBe('function');
    expect(names).toEqual(expect.arrayContaining(['assertNoErrors', 'noSidewaysScroll', 'insideViewport', 'noOverlap', 'textNotCut', 'minTarget', 'noRunningAnimations', 'imageIs']));
    for (const helper of ['env', 'launch', 'trapErrors', 'shot', 'tempRepo', 'outRoot']) expect(names).not.toContain(helper);
  });

  it('finds a new shared assertion with no change to the counter', () => {
    const source = 'export async function fitsCard(page, selector) {}\nexport function helper(page, name) {}\nexport function assertQuiet() {}\n';
    expect(assertionNames(source)).toEqual(['fitsCard', 'assertQuiet']);
  });
});
