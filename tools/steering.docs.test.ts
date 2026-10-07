// Steering lint (steering-cut/01). It reads the steering files as an agent reads them: the rules that
// AGENTS.md, the trackers and the handoffs give each session. Each fault names the file, the section and
// a number (a size, a count or a line), so that the agent can find and fix it without a second search.
//
// Rules in this ticket:
//   - git's union merge driver applies to the tracker files and not to MATRIX.md (a union merge copies
//     table rows two times);
//   - MATRIX.md holds the D.1 row, the D.2 row and the Workshop heading one time each (a guard);
//   - no run id occurs two times in a table under a QUEUE.md heading that starts with "Running";
//   - no live file holds a relative link to a file that does not exist.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');

/** One broken rule: the file, the section (a heading or a setting) and where (a size, a count or a line). */
type Fault = { file: string; section: string; where: string; what: string };
const show = (f: Fault) => `${f.file} § ${f.section} (${f.where}): ${f.what}`;

/** The tracker files: git merges them with the union driver. A probe path stands for the topic files. */
const TRACKERS = ['TASKS.md', 'LESSONS.md', 'docs/lessons/topic.md', 'docs/QUEUE.md'];
const MATRIX = 'docs/MATRIX.md';

/** The merge attribute of each path, from `git check-attr merge`. */
function mergeAttributes(cwd: string, paths: string[]): Map<string, string> {
  const result = spawnSync('git', ['check-attr', 'merge', '--', ...paths], { cwd, encoding: 'utf8' });
  if (result.error) throw result.error;
  expect(result.status, result.stderr).toBe(0);
  return new Map(result.stdout.split('\n').filter(Boolean).map(line => {
    const [path, , value] = line.split(': ');
    return [path, value];
  }));
}

/** Faults of the merge drivers: each tracker file gets `union`, MATRIX.md gets none. */
function mergeFaults(cwd: string): Fault[] {
  const want = new Map([...TRACKERS.map(path => [path, 'union'] as const), [MATRIX, 'unspecified'] as const]);
  const got = mergeAttributes(cwd, [...want.keys()]);
  const wrong = [...want].filter(([path, value]) => got.get(path) !== value);
  return wrong.map(([path, value]) => ({
    file: path, section: '.gitattributes merge', where: `${wrong.length} of ${want.size} files`,
    what: `merge is "${got.get(path)}", want "${value}"`,
  }));
}

describe('merge drivers', () => {
  it('git gives the union driver to the tracker files and no driver to MATRIX.md', () => {
    expect(mergeFaults(root).map(show)).toEqual([]);
  });
});

const read = (path: string) => readFileSync(join(root, path), 'utf8');

/** Each line of a markdown text with its line number and the heading of its section. Fenced code is left out. */
function markdownLines(text: string): { line: number; section: string; text: string }[] {
  const out: { line: number; section: string; text: string }[] = [];
  let section = '(top)';
  let fenced = false;
  text.split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; return; }
    if (fenced) return;
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading) section = heading[1].trim();
    out.push({ line: i + 1, section, text: line });
  });
  return out;
}

/** The MATRIX.md lines that must occur one time each: a table row by its first cell, or a heading. */
const MATRIX_ONCE = [
  { name: 'the D.1 row "Material behind (own side)"', test: (line: string) => /^\|\s*Material behind \(own side\)\s*\|/.test(line) },
  { name: 'the D.2 row "Any piece"', test: (line: string) => /^\|\s*Any piece\s*\|/.test(line) },
  { name: 'the Workshop heading', test: (line: string) => /^#{1,6}\s+Workshop\b/.test(line) },
];

/** Faults of MATRIX.md: each guarded row or heading occurs one time, in its section. */
function matrixFaults(text: string, file = MATRIX): Fault[] {
  const lines = markdownLines(text);
  return MATRIX_ONCE.flatMap(({ name, test }) => {
    const hits = lines.filter(l => test(l.text));
    if (hits.length === 1) return [];
    return [{
      file, section: [...new Set(hits.map(h => h.section))].join(', ') || '(none)',
      where: `count ${hits.length}${hits.length ? `, lines ${hits.map(h => h.line).join(', ')}` : ''}`,
      what: `${name} must occur one time`,
    }];
  });
}

describe('MATRIX.md guard', () => {
  const fixture = [
    '### D.1 Conditions (triggers)', '| Material behind (own side) | own side | x | — |',
    '### D.2 Shackled', '| Any piece | off until move N | turn N | idea |',
    '## Workshop (build 1a)', 'text',
  ];

  it('names the row, the section and the lines when a union merge copies a row', () => {
    const merged = [...fixture.slice(0, 2), fixture[1], ...fixture.slice(2)].join('\n');
    expect(matrixFaults(merged, 'fixture.md').map(show)).toEqual([
      'fixture.md § D.1 Conditions (triggers) (count 2, lines 2, 3): the D.1 row "Material behind (own side)" must occur one time',
    ]);
    expect(matrixFaults(fixture.slice(0, 4).join('\n'), 'fixture.md').map(show)).toEqual([
      'fixture.md § (none) (count 0): the Workshop heading must occur one time',
    ]);
    expect(matrixFaults(fixture.join('\n'), 'fixture.md')).toEqual([]);
  });

  it('MATRIX.md holds the D.1 row, the D.2 row and the Workshop heading one time each', () => {
    expect(matrixFaults(read(MATRIX)).map(show)).toEqual([]);
  });
});
