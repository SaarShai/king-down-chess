// Doc lints for the public tree (secrets-and-public-gates/11).
//
// Link lint: no tracked file holds a path into the two transcript folders (`docs/claude-recovery/`,
// `docs/cursor-recovery/`), with or without the `docs/` prefix. A path that names a commit, in git's
// `<id>:<path>` form, is a pinned reference: it passes when `git cat-file -e <id>:<path>` accepts it.
// The kept records hold the paths as data and are not read.
// Ignore lint: git tracks no file that the ignore rules match, and `.gitignore` keeps the transcript
// folders and the Workshop figure batches out of the tree.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { tempRepo } from './lib/temp-repo.mjs';

const root = join(import.meta.dirname, '..');

/** Files that keep the transcript paths as data: records, specs, the ignore rules and the gate rule with its test. */
const KEPT = [
  /^\.gitignore$/,
  /^docs\/takeover\/baseline\.json$/,
  /(^|\/)original-TASKS\.md\.txt$/,
  /^docs\/specs\//,
  /^tools\/gate\//,
  /^tools\/gate\.test\.ts$/,
  /^tools\/public-tree\.docs\.test\.ts$/,
];
const PINNED = /\b([0-9a-f]{7,40}):(docs\/(?:claude|cursor)-recovery\/[^\s`'"<>()[\]:]*)/g;
// A `-` or a word letter before the folder name is another name, such as `/tmp/king-down-claude-recovery-…`.
const BARE = /(?<![\w-])(?:docs\/)?(?:claude|cursor)-recovery\/[^\s`'"<>()[\]]*/g;

type Fault = { path: string; line: number; link: string };

/** Each bare path into a transcript folder in one file, with its line. A kept record gives none. */
function transcriptLinks(path: string, text: string): Fault[] {
  if (KEPT.some(kept => kept.test(path))) return [];
  return text.split('\n').flatMap((line, i) =>
    [...line.replace(PINNED, '').matchAll(BARE)].map(match => ({ path, line: i + 1, link: match[0] })));
}

/** Each pinned reference (`<id>:<path>`) in one file. */
function pinnedLinks(text: string): string[] {
  return [...text.matchAll(PINNED)].map(match => `${match[1]}:${match[2].replace(/[/.,;]+$/, '')}`);
}

const git = (cwd: string, ...args: string[]) => {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 << 20 });
  if (result.error) throw result.error;
  return result;
};
/** Tracked text files of the tree that name a transcript folder. */
const mentions = () => {
  const result = git(root, 'grep', '-lI', '-e', 'claude-recovery/', '-e', 'cursor-recovery/');
  expect(result.status, result.stderr).toBeLessThan(2); // 1 means no file
  return result.stdout.split('\n').filter(Boolean);
};
/** Tracked files that the ignore rules match. */
const ignoredTracked = (cwd: string) => {
  const result = git(cwd, 'ls-files', '-ci', '--exclude-standard');
  expect(result.status, result.stderr).toBe(0);
  return result.stdout.split('\n').filter(Boolean);
};

describe('link lint: no path into the transcript folders', () => {
  it('finds a path with and without the docs/ prefix in a fixture file', () => {
    const text = [
      'See [the record](../cursor-recovery/2026-09-24-0213b442/EXECUTED.md).',
      'Evidence: `docs/claude-recovery/review/TASK-LEDGER.md`.',
      'A [link](</Users/za/Documents/king down chess/docs/claude-recovery/README.md>).',
    ].join('\n');
    expect(transcriptLinks('docs/fixture.md', text)).toEqual([
      { path: 'docs/fixture.md', line: 1, link: 'cursor-recovery/2026-09-24-0213b442/EXECUTED.md' },
      { path: 'docs/fixture.md', line: 2, link: 'docs/claude-recovery/review/TASK-LEDGER.md' },
      { path: 'docs/fixture.md', line: 3, link: 'docs/claude-recovery/README.md' },
    ]);
  });

  it('passes a pinned path, another name that ends in -recovery and a kept record', () => {
    const pinned = 'Evidence: `dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/EXECUTED.md`.';
    expect(transcriptLinks('docs/fixture.md', pinned)).toEqual([]);
    expect(pinnedLinks(pinned)).toEqual(['dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/EXECUTED.md']);
    expect(transcriptLinks('docs/fixture.md', '"log": "/tmp/king-down-claude-recovery-2026-09-29/checks/qa.mjs.log"')).toEqual([]);
    expect(transcriptLinks('docs/fixture.md', 'in docs/research/m1-results/conditions-context-recovery/')).toEqual([]);
    const bare = '`docs/claude-recovery/review/TASK-LEDGER.md`';
    for (const kept of ['docs/takeover/baseline.json', 'docs/research/m1-results/conditions-context-recovery/original-TASKS.md.txt', 'docs/specs/secrets-and-public-gates/spec.md'])
      expect(transcriptLinks(kept, bare)).toEqual([]);
  });

  it('finds no bare path in a tracked file outside the kept records', () => {
    const faults = mentions().flatMap(path => transcriptLinks(path, readFileSync(join(root, path), 'utf8')));
    expect(faults.map(f => `${f.path}:${f.line}: ${f.link}`)).toEqual([]);
  });

  it('each pinned path names a commit that holds it', () => {
    const refs = [...new Set(mentions().flatMap(path => pinnedLinks(readFileSync(join(root, path), 'utf8'))))];
    const result = spawnSync('git', ['cat-file', '--batch-check'], { cwd: root, input: refs.join('\n') + '\n', encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.split('\n').filter(line => line.endsWith(' missing'))).toEqual([]);
  });

  it('the transcript folders hold no tracked file', () => {
    expect(git(root, 'ls-files', 'docs/claude-recovery', 'docs/cursor-recovery').stdout).toBe('');
  });
});

describe('ignore lint: no tracked file matches the ignore rules', () => {
  const repos: ReturnType<typeof tempRepo>[] = [];
  afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

  it('names a tracked file that the ignore rules match, in a fixture repository', () => {
    const repo = tempRepo({ hooks: false });
    repos.push(repo);
    repo.write('data/policy.bin', 'x');
    expect(repo.git('add', 'data/policy.bin').status).toBe(0);
    repo.write('.gitignore', '/data/policy.bin\n');
    expect(ignoredTracked(repo.dir)).toEqual(['data/policy.bin']);
  });

  it('finds no such file in the tree', () => {
    expect(ignoredTracked(root)).toEqual([]);
  });

  it('.gitignore keeps out the transcript folders and the Workshop figure batches, not the figure samples', () => {
    const rules = readFileSync(join(root, '.gitignore'), 'utf8').split('\n').filter(line => line && !line.startsWith('#'));
    for (const want of ['claude-recovery', 'cursor-recovery', 'figure-batch-*', 'figure-final-run', 'figure-swarms', 'figures-*'])
      expect(rules.some(rule => rule.includes(want)), want).toBe(true);
    const ignored = (path: string) => git(root, 'check-ignore', '-q', '--no-index', path).status === 0;
    for (const path of [
      'docs/claude-recovery/a.md', 'docs/cursor-recovery/b/c.md', 'sim/nnue/policy.bin',
      'docs/visual-design/workshop/figure-batch-02/a.png', 'docs/visual-design/workshop/figure-final-run/a.png',
      'docs/visual-design/workshop/figure-swarms/a.png', 'docs/visual-design/workshop/figures-machines-elements/a.png',
    ]) expect(ignored(path), path).toBe(true);
    expect(ignored('docs/visual-design/workshop/figure-samples-2026-10-06/a.png')).toBe(false);
  });
});
