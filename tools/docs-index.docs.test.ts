// Docs index lint (docs-index/01). docs/INDEX.md gives one line for each top-level entry of docs/, so that
// an agent finds the right doc in one read. Each fault names the file, the section and a line or a count.
//
// Rules:
//   - each top-level entry of docs/ (a file or a folder that git tracks or would track) has a line with a
//     link to it; the index itself is not an entry;
//   - each relative link in the index names a file or a folder that exists;
//   - the index holds no model name.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findModelNames } from './lib/model-names.mjs';

const root = join(import.meta.dirname, '..');
const INDEX = 'docs/INDEX.md';

/** One broken rule: the file, the section (a heading) and where (a line or a count). */
type Fault = { file: string; section: string; where: string; what: string };
const show = (f: Fault) => `${f.file} § ${f.section} (${f.where}): ${f.what}`;

/** A markdown link: `[text](target)` or `[text](<target>)`, with an optional title. */
const LINK = /\[[^\]]*\]\((?:<([^>]+)>|([^)\s]+))(?:\s+"[^"]*")?\)/g;

/** Each relative link of a markdown text, with its line and section. Fenced code and code spans are left out. */
function relativeLinks(text: string): { line: number; section: string; target: string; path: string }[] {
  const out: { line: number; section: string; target: string; path: string }[] = [];
  let section = '(top)';
  let fenced = false;
  text.split('\n').forEach((content, i) => {
    if (/^\s*(```|~~~)/.test(content)) { fenced = !fenced; return; }
    if (fenced) return;
    const heading = /^#{1,6}\s+(.*)$/.exec(content);
    if (heading) section = heading[1].trim();
    for (const match of content.replace(/`[^`]*`/g, '').matchAll(LINK)) {
      const target = match[1] ?? match[2];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#') || target.startsWith('/')) continue;
      const path = decodeURI(target.replace(/[#?].*$/, '')).replace(/^\.\//, '').replace(/\/$/, '');
      out.push({ line: i + 1, section, target, path });
    }
  });
  return out;
}

/**
 * Faults of the index: an entry with no line, and a link that names no file. `exists` takes a path from
 * the docs folder; `entries` are the names of the top-level entries of the docs folder.
 */
function indexFaults(text: string, entries: string[], exists: (path: string) => boolean, file = INDEX): Fault[] {
  const links = relativeLinks(text);
  const linked = new Set(links.map(link => link.path));
  const missing = entries.filter(entry => !linked.has(entry));
  return [
    ...missing.map(entry => ({
      file, section: '(entries)', where: `${missing.length} of ${entries.length} entries`,
      what: `the entry "${entry}" has no line; add "- [${entry}](${entry}): <the question it answers>" under its topic`,
    })),
    ...links.filter(link => !exists(link.path)).map(link => ({
      file, section: link.section, where: `line ${link.line}`, what: `the link "${link.target}" names no file`,
    })),
  ];
}

/** The top-level entries of docs/ that git tracks or would track (ignored files are left out), without the index. */
function docsEntries(): string[] {
  const result = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', 'docs'], { cwd: root, encoding: 'utf8' });
  if (result.error) throw result.error;
  expect(result.status, result.stderr).toBe(0);
  const names = result.stdout.split('\0').filter(Boolean).map(path => path.split('/')[1]);
  return [...new Set(names)].filter(name => name !== 'INDEX.md' && !name.startsWith('.')).sort();
}

describe('docs index', () => {
  const fixture = [
    '# Docs index', 'Open work is in [TASKS.md](../TASKS.md).',
    '## Rules', '- [RULES.md](RULES.md): What are the rules? See [the web](https://example.com) and [here](#rules).',
    '## Specs', '- [specs/](specs/): What is planned? Start at [a lost spec](specs/no-such/spec.md).',
    '```', '- [in code](NO-SUCH.md)', '```', 'In a span: `[x](ALSO-NO.md)`.',
  ].join('\n');
  const present = new Set(['../TASKS.md', 'RULES.md', 'specs', 'QUEUE.md']);
  const exists = (path: string) => present.has(path);

  it('passes when each entry has a line and each link names a file', () => {
    expect(indexFaults(fixture.replace('specs/no-such/spec.md', 'QUEUE.md'), ['RULES.md', 'specs'], exists)).toEqual([]);
  });

  it('names an entry that has no line', () => {
    expect(indexFaults(fixture.replace('specs/no-such/spec.md', 'QUEUE.md'), ['QUEUE.md', 'RULES.md', 'specs', 'safety'], exists).map(show)).toEqual([
      'docs/INDEX.md § (entries) (1 of 4 entries): the entry "safety" has no line; add "- [safety](safety): <the question it answers>" under its topic',
    ]);
  });

  it('names the section and the line of a link that names no file', () => {
    expect(indexFaults(fixture, ['RULES.md', 'specs'], exists).map(show)).toEqual([
      'docs/INDEX.md § Specs (line 6): the link "specs/no-such/spec.md" names no file',
    ]);
  });

  it('docs/INDEX.md has a line for each top-level entry of docs/, and each of its links names a file', () => {
    const entries = docsEntries();
    expect(entries).toContain('RULES.md');
    expect(entries).toContain('specs');
    expect(indexFaults(readFileSync(join(root, INDEX), 'utf8'), entries, path => existsSync(join(root, 'docs', path))).map(show)).toEqual([]);
  });

  it('docs/INDEX.md holds no model name', () => {
    expect(findModelNames(readFileSync(join(root, INDEX), 'utf8'))).toEqual([]);
  });
});
