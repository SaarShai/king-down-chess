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
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
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

/** The cells of a table row. */
const cells = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(cell => cell.trim());

/**
 * Faults of QUEUE.md: in each table under a heading that starts with "Running", no run id occurs two times.
 * The id column is the column named "id", else the first column. A cell with ids split by commas counts each id.
 */
function queueFaults(text: string, file = 'docs/QUEUE.md'): Fault[] {
  const lines = markdownLines(text);
  const tables: (typeof lines)[] = [];
  lines.forEach((l, i) => {
    if (!/^Running/.test(l.section) || !l.text.trim().startsWith('|')) return;
    const previous = lines[i - 1];
    if (previous?.text.trim().startsWith('|') && previous.section === l.section) tables.at(-1)!.push(l);
    else tables.push([l]);
  });
  return tables.flatMap(([header, , ...rows]) => {
    const column = Math.max(0, cells(header.text).findIndex(cell => cell.toLowerCase() === 'id'));
    const seen = new Map<string, number[]>();
    for (const row of rows)
      for (const id of (cells(row.text)[column] ?? '').split(',').map(id => id.replaceAll('`', '').trim()).filter(Boolean))
        seen.set(id, [...(seen.get(id) ?? []), row.line]);
    return [...seen].filter(([, at]) => at.length > 1).map(([id, at]) => ({
      file, section: header.section, where: `count ${at.length}, lines ${at.join(', ')}`,
      what: `run id "${id}" occurs ${at.length} times in one table`,
    }));
  });
}

describe('QUEUE.md run tables', () => {
  it('names the section, the line and the count of a run id that occurs two times in one table', () => {
    const fixture = [
      '## Ran 2026-10-05', '| id | state |', '|---|---|', '| k18 | done |', '| k18 | done |',
      '## Running and queued, 2026-10-06', 'Text.', '',
      '| id | where | state |', '|---|---|---|',
      '| deal-d2 | Kaggle | running |',
      '| pv-A, `pa-d4` | M1 | done |',
      '| pa-d4 | M1 | queued |',
      '| deal-d2 | M1 | queued |',
      '', '| id | state |', '|---|---|', '| pv-A | other table |',
      '## Dropped', '| id | state |', '|---|---|', '| deal-d2 | x |',
    ].join('\n');
    expect(queueFaults(fixture, 'fixture.md').map(show)).toEqual([
      'fixture.md § Running and queued, 2026-10-06 (count 2, lines 11, 14): run id "deal-d2" occurs 2 times in one table',
      'fixture.md § Running and queued, 2026-10-06 (count 2, lines 12, 13): run id "pa-d4" occurs 2 times in one table',
    ]);
  });

  it('no run id occurs two times in a live run table of QUEUE.md', () => {
    expect(queueFaults(read('docs/QUEUE.md')).map(show)).toEqual([]);
  });
});

/**
 * The live files: the steering files that exist outside the tasks archive. These are AGENTS.md,
 * COMPUTE.md, HOSTING.md, TASKS.md, LESSONS.md, the topic files in the lessons folder, the handoffs,
 * QUEUE.md, issue-tracker.md and domain.md. A file that a later ticket makes joins when it exists.
 */
function liveFiles(): string[] {
  const inFolder = (folder: string, pattern: RegExp) =>
    existsSync(join(root, folder)) ? readdirSync(join(root, folder)).filter(name => pattern.test(name)).sort().map(name => `${folder}/${name}`) : [];
  return [
    'AGENTS.md', 'docs/COMPUTE.md', 'docs/HOSTING.md', 'TASKS.md', 'LESSONS.md',
    ...inFolder('docs/lessons', /\.md$/),
    'HANDOFF.md', ...inFolder('docs', /^HANDOFF-.*\.md$/),
    'docs/QUEUE.md', 'docs/agents/issue-tracker.md', 'docs/agents/domain.md',
  ].filter(file => existsSync(join(root, file)));
}

/** A markdown link: `[text](target)` or `[text](<target>)`, with an optional title. */
const LINK = /\[[^\]]*\]\((?:<([^>]+)>|([^)\s]+))(?:\s+"[^"]*")?\)/g;

/**
 * Faults of the relative links in one file: each link that names no file or folder. A link with a scheme,
 * an anchor only or an absolute path is not relative. Fenced code and code spans are left out.
 */
function linkFaults(file: string, text: string): Fault[] {
  return markdownLines(text).flatMap(({ line, section, text: content }) =>
    [...content.replace(/`[^`]*`/g, '').matchAll(LINK)].flatMap(match => {
      const target = match[1] ?? match[2];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#') || target.startsWith('/')) return [];
      const path = decodeURI(target.replace(/[#?].*$/, ''));
      if (existsSync(join(root, dirname(file), path))) return [];
      return [{ file, section, where: `line ${line}`, what: `relative link "${target}" names no file` }];
    }));
}

describe('live files', () => {
  it('are the steering files outside the tasks archive that exist', () => {
    const files = liveFiles();
    for (const want of ['AGENTS.md', 'TASKS.md', 'LESSONS.md', 'docs/QUEUE.md', 'docs/agents/issue-tracker.md', 'docs/agents/domain.md', 'docs/HANDOFF-retro.md'])
      expect(files, want).toContain(want);
    expect(files.filter(file => file.startsWith('docs/tasks-archive/'))).toEqual([]);
  });
});

describe('relative links', () => {
  it('names the file, the section and the line of a link to a file that does not exist', () => {
    const fixture = [
      '# Fixture', 'See [the matrix](docs/MATRIX.md#d1) and [the web](https://example.com) and [here](#top).',
      '## Notes', 'A [lost file](docs/no-such-file.md) and [a folder](<docs/agents/>).',
      '```', '[in code](docs/also-missing.md)', '```', 'In a span: `[x](docs/missing-in-span.md)`.',
    ].join('\n');
    expect(linkFaults('AGENTS.md', fixture).map(show)).toEqual([
      'AGENTS.md § Notes (line 4): relative link "docs/no-such-file.md" names no file',
    ]);
  });

  it('resolves a link from the folder of its file', () => {
    expect(linkFaults('docs/agents/fixture.md', '[ok](../MATRIX.md) [bad](MATRIX.md)').map(show)).toEqual([
      'docs/agents/fixture.md § (top) (line 1): relative link "MATRIX.md" names no file',
    ]);
  });

  it('no live file holds a broken relative link', () => {
    expect(liveFiles().flatMap(file => linkFaults(file, read(file))).map(show)).toEqual([]);
  });
});
