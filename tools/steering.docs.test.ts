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
// Rules of steering-cut/02 (each lesson under one dated heading):
//   - no `##` heading occurs two times in LESSONS.md;
//   - no lesson bullet sits above the first `##` heading;
//   - each `##` heading holds a date in the form YYYY-MM-DD;
//   - no LESSONS.md heading holds a model name.
// Rules of steering-cut/03 (LESSONS.md is the section Always and an index; six topic files hold the lessons):
//   - LESSONS.md is under 30,000 bytes;
//   - LESSONS.md holds the section Always, then the section Index, and no other `##` section;
//   - the Index entries equal the `##` headings of the six topic files, with no repeat, and each entry
//     links to the file that holds it;
//   - no name from the model-name module occurs in LESSONS.md;
//   - the lessons folder holds the six topic files, and each holds its lessons under one dated heading.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findModelNames, MODEL_NAMES } from './lib/model-names.mjs';

const root = join(import.meta.dirname, '..');

/** One broken rule: the file, the section (a heading or a setting) and where (a size, a count or a line). */
type Fault = { file: string; section: string; where: string; what: string };
const show = (f: Fault) => `${f.file} § ${f.section} (${f.where}): ${f.what}`;

/** The six topic files of the lessons folder (steering-cut/03). Each holds the lessons of one topic. */
const TOPIC_FILES = ['engine-and-tests', 'runs', 'jev', 'art-and-motion', 'browser-checks-and-ui', 'agents-and-tools']
  .map(name => `docs/lessons/${name}.md`);

/** The tracker files: git merges them with the union driver. */
const TRACKERS = ['TASKS.md', 'LESSONS.md', ...TOPIC_FILES, 'docs/QUEUE.md'];
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

/** The `##` headings of a markdown text, with their lines. Fenced code is left out. */
const sectionHeadings = (text: string) =>
  markdownLines(text).filter(l => /^##\s/.test(l.text)).map(l => ({ line: l.line, heading: l.section }));

/**
 * Faults of a lessons file (steering-cut/02): a `##` heading that occurs two times, a lesson
 * bullet (a line that starts with "- ") above the first `##` heading, a `##` heading with no date in
 * the form YYYY-MM-DD, and a heading of any level that holds a name from the model-name module.
 */
function lessonFaults(text: string, file = 'LESSONS.md'): Fault[] {
  const headings = sectionHeadings(text);
  const at = new Map<string, number[]>();
  for (const { line, heading } of headings) at.set(heading, [...(at.get(heading) ?? []), line]);
  const repeats: Fault[] = [...at].filter(([, lines]) => lines.length > 1).map(([heading, lines]) => ({
    file, section: heading, where: `count ${lines.length}, lines ${lines.join(', ')}`,
    what: 'a `##` heading must not occur two times',
  }));
  const first = headings[0]?.line ?? Infinity;
  const loose = markdownLines(text).filter(l => l.line < first && /^- /.test(l.text));
  const unheaded: Fault[] = loose.length ? [{
    file, section: loose[0].section, where: `count ${loose.length}, lines ${loose.map(l => l.line).join(', ')}`,
    what: 'a lesson bullet must not sit above the first `##` heading',
  }] : [];
  const undated: Fault[] = headings.filter(h => !/(?<!\d)\d{4}-\d{2}-\d{2}(?!\d)/.test(h.heading)).map(h => ({
    file, section: h.heading, where: `line ${h.line}`, what: 'a `##` heading must hold a date in the form YYYY-MM-DD',
  }));
  const named: Fault[] = markdownLines(text).filter(l => /^#{1,6}\s/.test(l.text)).flatMap(l =>
    findModelNames(l.text).map(({ word }) => ({
      file, section: l.section, where: `line ${l.line}`, what: `a heading must not hold the model name "${word}"`,
    })));
  return [...repeats, ...unheaded, ...undated, ...named];
}

describe('lesson headings', () => {
  // The model name comes from the module, so this file holds no model name.
  const model = MODEL_NAMES[0][0].toUpperCase() + MODEL_NAMES[0].slice(1);
  const fixture = [
    '# Lessons', 'Intro text.', '',
    '- A lesson with no heading. (2026-10-04)',
    '- Another one.', '',
    `## 2026-09-13 \u2014 rate limit killed 8 parallel ${model} agents`, '- text',
    '## Clay facing \u2014 2026-09-22', '- text', '',
    '## A heading with no date', '- text',
    '## Clay facing \u2014 2026-09-22', '- text',
    '```', '## 2026-09-13 \u2014 in fenced code, not a heading', '```',
  ].join('\n');

  it('names each heading that occurs two times, with its lines', () => {
    expect(lessonFaults(fixture, 'fixture.md').filter(f => f.what.includes('two times')).map(show)).toEqual([
      'fixture.md \u00a7 Clay facing \u2014 2026-09-22 (count 2, lines 9, 14): a `##` heading must not occur two times',
    ]);
  });

  it('names the lesson bullets above the first `##` heading, with their lines', () => {
    expect(lessonFaults(fixture, 'fixture.md').filter(f => f.what.includes('above')).map(show)).toEqual([
      'fixture.md \u00a7 Lessons (count 2, lines 4, 5): a lesson bullet must not sit above the first `##` heading',
    ]);
  });

  it('names each `##` heading with no date in the form YYYY-MM-DD', () => {
    expect(lessonFaults(fixture, 'fixture.md').filter(f => f.what.includes('date')).map(show)).toEqual([
      'fixture.md \u00a7 A heading with no date (line 12): a `##` heading must hold a date in the form YYYY-MM-DD',
    ]);
    expect(lessonFaults('## Lesson (2026-9-14)\n## Lesson of 14.09.2026', 'fixture.md').map(f => f.where)).toEqual(['line 1', 'line 2']);
  });

  it('names each heading that holds a model name, and not a model name in the lesson text', () => {
    expect(lessonFaults(fixture, 'fixture.md').filter(f => f.what.includes('model name')).map(show)).toEqual([
      `fixture.md \u00a7 2026-09-13 \u2014 rate limit killed 8 parallel ${model} agents (line 7): a heading must not hold the model name "${model}"`,
    ]);
    expect(lessonFaults(`## 2026-09-13 \u2014 rate limit\n- Keep no more than ~6 ${model} agents.`, 'fixture.md')).toEqual([]);
  });

  it('each topic file holds its lessons under one dated heading with no model name in a heading', () => {
    expect(TOPIC_FILES.flatMap(file => existsSync(join(root, file)) ? lessonFaults(read(file), file) : []).map(show)).toEqual([]);
  });
});

/** LESSONS.md stays small: an agent reads it whole at the start of each session. */
const LESSONS_LIMIT = 30_000;

/** An Index entry: a list item that is one link, `- [heading](file)`. */
const INDEX_ENTRY = /^\s*- \[(.*)\]\(([^)\s]+)\)\s*$/;

/**
 * Faults of LESSONS.md (steering-cut/03): the size, the `##` sections (Always, then Index, no other),
 * a model name in any line, and the Index entries against the `##` headings of the topic files. An
 * entry must name a topic-file heading one time and link to the file that holds that heading.
 */
function lessonsIndexFaults(text: string, topics: { file: string; text: string }[], file = 'LESSONS.md'): Fault[] {
  const size = Buffer.byteLength(text, 'utf8');
  const tooBig: Fault[] = size < LESSONS_LIMIT ? [] : [{
    file, section: '(file)', where: `size ${size} bytes`, what: `LESSONS.md must be under ${LESSONS_LIMIT} bytes`,
  }];
  const headings = sectionHeadings(text);
  const names = headings.map(h => h.heading);
  const order: Fault[] = names.slice(0, 2).join('|') === 'Always|Index' ? [] : [{
    file, section: '(top)', where: `count ${Math.min(names.filter(n => n === 'Always' || n === 'Index').length, 2)} of 2`,
    what: `the first \`##\` sections must be Always, then Index; found ${names.slice(0, 2).map(n => `"${n}"`).join(', ') || 'none'}`,
  }];
  const others = headings.filter(h => h.heading !== 'Always' && h.heading !== 'Index');
  const extra: Fault[] = others.length ? [{
    file, section: others[0].heading, where: `count ${others.length}, first line ${others[0].line}`,
    what: 'LESSONS.md must hold no `##` section but Always and Index',
  }] : [];
  const named: Fault[] = findModelNames(text).map(({ word, line }) => ({
    file, section: markdownLines(text).find(l => l.line === line)?.section ?? '(fenced code)', where: `line ${line}`,
    what: `LESSONS.md must not hold the model name "${word}"`,
  }));
  // Each topic-file heading, with the files that hold it.
  const holders = new Map<string, string[]>();
  for (const topic of topics)
    for (const { heading } of sectionHeadings(topic.text)) holders.set(heading, [...(holders.get(heading) ?? []), topic.file]);
  // The lines of the `##` section Index, down to the next `##` heading; `###` groups stay inside it.
  const indexStart = headings.find(h => h.heading === 'Index')?.line ?? Infinity;
  const indexEnd = headings.find(h => h.line > indexStart)?.line ?? Infinity;
  const entries = markdownLines(text).filter(l => l.line > indexStart && l.line < indexEnd && INDEX_ENTRY.test(l.text)).map(l => {
    const [, heading, target] = INDEX_ENTRY.exec(l.text)!;
    return { line: l.line, heading, target: target.replace(/#.*$/, '') };
  });
  const seen = new Map<string, number[]>();
  for (const e of entries) seen.set(e.heading, [...(seen.get(e.heading) ?? []), e.line]);
  const index: Fault[] = [
    ...[...holders].filter(([, files]) => files.length > 1).map(([heading, files]) => ({
      file: files.join(', '), section: heading, where: `count ${files.length}`,
      what: 'a lesson heading must occur in one topic file only',
    })),
    ...[...seen].filter(([, lines]) => lines.length > 1).map(([heading, lines]) => ({
      file, section: 'Index', where: `count ${lines.length}, lines ${lines.join(', ')}`,
      what: `the entry "${heading}" must occur one time`,
    })),
    ...entries.flatMap(e => {
      const files = holders.get(e.heading);
      if (!files) return [{ file, section: 'Index', where: `line ${e.line}`, what: `the entry "${e.heading}" names no topic-file heading` }];
      if (files.includes(e.target)) return [];
      return [{ file, section: 'Index', where: `line ${e.line}`, what: `the entry "${e.heading}" links to ${e.target}, not to ${files.join(', ')}` }];
    }),
    ...[...holders].filter(([heading]) => !seen.has(heading)).map(([heading, files]) => ({
      file, section: 'Index', where: `count 0`, what: `the heading "${heading}" of ${files.join(', ')} has no entry`,
    })),
  ];
  return [...tooBig, ...order, ...extra, ...named, ...index];
}

describe('LESSONS.md index', () => {
  const model = MODEL_NAMES[0][0].toUpperCase() + MODEL_NAMES[0].slice(1);
  const topics = [
    { file: 'docs/lessons/a.md', text: '# A\n\n## 2026-01-01 \u2014 x\n- text\n\n## 2026-01-02 \u2014 y\n- text' },
    { file: 'docs/lessons/b.md', text: '# B\n\n## 2026-01-03 \u2014 z\n- text\n## 2026-01-01 \u2014 x\n- text' },
  ];
  const good = [
    '# Lessons', '', '## Always', '- Never print a process environment.', '',
    '## Index', '', '### A', '- [2026-01-01 \u2014 x](docs/lessons/a.md)', '- [2026-01-02 \u2014 y](docs/lessons/a.md#2026-01-02)',
    '### B', '- [2026-01-03 \u2014 z](docs/lessons/b.md)',
  ];

  it('names the size of a LESSONS.md of 30,000 bytes or more', () => {
    const big = [...good, '', 'x'.repeat(LESSONS_LIMIT)].join('\n');
    expect(lessonsIndexFaults(big, topics.slice(0, 1), 'fixture.md').filter(f => f.what.includes('bytes')).map(show)).toEqual([
      `fixture.md \u00a7 (file) (size ${Buffer.byteLength(big)} bytes): LESSONS.md must be under 30000 bytes`,
    ]);
  });

  it('names the sections when Always and Index are out of order or another `##` section exists', () => {
    const swapped = ['# Lessons', '## Index', '## Always', '## 2026-01-04 \u2014 a lesson', '- text'].join('\n');
    expect(lessonsIndexFaults(swapped, [], 'fixture.md').map(show)).toEqual([
      'fixture.md \u00a7 (top) (count 2 of 2): the first `##` sections must be Always, then Index; found "Index", "Always"',
      'fixture.md \u00a7 2026-01-04 \u2014 a lesson (count 1, first line 4): LESSONS.md must hold no `##` section but Always and Index',
    ]);
  });

  it('names each model name in LESSONS.md, in the text and in a heading', () => {
    const named = ['# Lessons', '## Always', `- Keep no more than ~6 ${model} agents.`, '## Index'].join('\n');
    expect(lessonsIndexFaults(named, [], 'fixture.md').map(show)).toEqual([
      `fixture.md \u00a7 Always (line 3): LESSONS.md must not hold the model name "${model}"`,
    ]);
  });

  it('names a repeated entry, a wrong link, an entry with no heading, a missing heading and a heading in two files', () => {
    const index = [
      '# Lessons', '## Always', '## Index',
      '- [2026-01-01 \u2014 x](docs/lessons/a.md)', '- [2026-01-01 \u2014 x](docs/lessons/a.md)',
      '- [2026-01-03 \u2014 z](docs/lessons/a.md)', '- [2026-01-05 \u2014 w](docs/lessons/b.md)',
    ].join('\n');
    expect(lessonsIndexFaults(index, topics, 'fixture.md').map(show)).toEqual([
      'docs/lessons/a.md, docs/lessons/b.md \u00a7 2026-01-01 \u2014 x (count 2): a lesson heading must occur in one topic file only',
      'fixture.md \u00a7 Index (count 2, lines 4, 5): the entry "2026-01-01 \u2014 x" must occur one time',
      'fixture.md \u00a7 Index (line 6): the entry "2026-01-03 \u2014 z" links to docs/lessons/a.md, not to docs/lessons/b.md',
      'fixture.md \u00a7 Index (line 7): the entry "2026-01-05 \u2014 w" names no topic-file heading',
      'fixture.md \u00a7 Index (count 0): the heading "2026-01-02 \u2014 y" of docs/lessons/a.md has no entry',
    ]);
    expect(lessonsIndexFaults(good.join('\n'), [topics[0], { file: 'docs/lessons/b.md', text: '## 2026-01-03 \u2014 z' }], 'fixture.md')).toEqual([]);
  });

  it('the lessons folder holds the six topic files', () => {
    const folder = join(root, 'docs/lessons');
    const found = existsSync(folder) ? readdirSync(folder).filter(name => name.endsWith('.md')).sort().map(name => `docs/lessons/${name}`) : [];
    expect(found).toEqual([...TOPIC_FILES].sort());
  });

  it('LESSONS.md is small, holds Always then Index, no model name, and indexes each topic-file heading', () => {
    const topicTexts = TOPIC_FILES.filter(file => existsSync(join(root, file))).map(file => ({ file, text: read(file) }));
    expect(lessonsIndexFaults(read('LESSONS.md'), topicTexts).map(show)).toEqual([]);
  });
});
