// The assertion counter for the commit-msg hook (checks-and-hooks/10, story 8): it finds the
// assertion lines that a change removes from the registered browser checks.
//
// An assertion line is a line that calls `assert` (also `assert.equal` and the like), `expect`
// or a shared assertion. The counter does not read comments and the text in quotes, so a comment
// line (it starts with //, /* or *) and a call in a string are not assertion lines.
// A removed line counts only when the change does not add the same line again, in any file:
// the counter compares lines without the indent, and one added copy frees one removed copy.
// So a moved line does not count; a changed line counts.
//
// The lists are not copies:
//   - the check paths are the scripts of the runner's registry (registry.mjs);
//   - the shared assertions are the exports of the shared check module (checks.mjs) whose name
//     starts with "assert", or whose parameters start with (page, selector). The counter reads
//     the export lines of the module's text, so it needs no browser package.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checks } from './registry.mjs';

const sharedModule = join(dirname(fileURLToPath(import.meta.url)), 'checks.mjs');

/** The script paths of the runner's registry, each one time, from the checkout root. */
export const registeredChecks = () => [...new Set(checks.map(c => c.script))];

/**
 * The names of the shared assertions, in the order of the module text.
 * @param {string} [source] the text of the shared check module
 * @returns {string[]}
 */
export function assertionNames(source = readFileSync(sharedModule, 'utf8')) {
  return [...source.matchAll(/^export\s+(?:async\s+)?function\s+([\w$]+)\s*\(([^)]*)\)/gm)]
    .filter(([, name, params]) => name.startsWith('assert') || /^\s*page\s*,\s*selector\b/.test(params))
    .map(([, name]) => name);
}

/** The text without the text in quotes and without a comment at the end of the line. */
const code = (/** @type {string} */ text) => text.replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '""').replace(/\/\/.*$/, '');

const escape = (/** @type {string} */ name) => name.replace(/\$/g, '\\$');

/**
 * The assertion lines that a diff removes from the given paths.
 * @param {string} diff a unified diff with `a/` and `b/` prefixes, such as `git diff -U0`
 * @param {{ paths?: string[], names?: string[] }} [options] the check paths, the shared assertion names
 * @returns {{ file: string, line: number, text: string }[]} each counted line: path, old line number, text without the indent
 */
export function removedAssertions(diff, { paths = registeredChecks(), names = assertionNames() } = {}) {
  const call = new RegExp(`(?<![\\w$])(?:assert(?:\\.[\\w$]+)*|expect|${names.map(escape).join('|')})\\s*\\(`);
  const registered = new Set(paths);
  /** @type {{ file: string, line: number, text: string }[]} */
  const removed = [];
  /** @type {Map<string, number>} each added line without the indent, and how many times */
  const added = new Map();

  let file = '';
  let line = 0;
  let toRemove = 0;
  let toAdd = 0;
  for (const raw of diff.split('\n')) {
    if (toRemove > 0 && raw.startsWith('-')) {
      toRemove--;
      const text = raw.slice(1).trim();
      if (registered.has(file) && !/^(?:\/\/|\/\*|\*)/.test(text) && call.test(code(text))) removed.push({ file, line, text });
      line++;
    } else if (toAdd > 0 && raw.startsWith('+')) {
      toAdd--;
      const text = raw.slice(1).trim();
      added.set(text, (added.get(text) ?? 0) + 1);
    } else if (raw.startsWith('--- ')) {
      // The old path; a new file has /dev/null. Git ends a path that holds a space with a tab.
      file = raw.slice(4).replace(/\t$/, '').replace(/^a\//, '');
    } else {
      const hunk = raw.match(/^@@ -(\d+)(?:,(\d+))? \+\d+(?:,(\d+))? @@/);
      if (hunk) [line, toRemove, toAdd] = [Number(hunk[1]), Number(hunk[2] ?? 1), Number(hunk[3] ?? 1)];
    }
  }
  return removed.filter(({ text }) => {
    const copies = added.get(text) ?? 0;
    if (copies) added.set(text, copies - 1);
    return !copies;
  });
}

/**
 * The assertion lines that the staged change removes from the registered checks.
 * Git starts the commit-msg hook in the top folder of the work tree, with GIT_INDEX_FILE set
 * when the commit uses its own index (such as `git commit -a`), so the default env is right there.
 * In a merge, a line counts only when the merge removes it from each parent: the merged commits
 * named their own removals, and a merge that drops a line that both sides hold must name it.
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv }} [options]
 */
export function stagedRemovedAssertions({ cwd, env } = {}) {
  const git = (/** @type {string[]} */ ...args) => {
    const result = spawnSync('git', args, { cwd, env, encoding: 'utf8', maxBuffer: 1 << 30 });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`removed-checks: git ${args[0]} failed: ${result.stderr.trim()}`);
    return result.stdout;
  };
  const diff = (/** @type {string[]} */ ...args) => git('-c', 'core.quotePath=false', 'diff', '--cached', '--no-color', '--no-ext-diff', '--no-textconv', '--no-renames', ...args);
  const paths = registeredChecks();
  const changed = diff('--name-only', '-z').split('\0');
  if (!paths.some(path => changed.includes(path))) return [];
  /** @param {string[]} parent no item: HEAD (also before the first commit); one item: that commit */
  const removedFrom = (...parent) => removedAssertions(diff('-U0', '--src-prefix=a/', '--dst-prefix=b/', ...parent), { paths });

  const mergeHead = resolve(cwd ?? '.', git('rev-parse', '--git-path', 'MERGE_HEAD').trim());
  const others = existsSync(mergeHead) ? readFileSync(mergeHead, 'utf8').split('\n').filter(Boolean) : [];
  let removed = removedFrom();
  for (const parent of others) {
    const also = removedFrom(parent).map(r => `${r.file}\n${r.text}`);
    removed = removed.filter(r => {
      const i = also.indexOf(`${r.file}\n${r.text}`);
      if (i >= 0) also.splice(i, 1);
      return i >= 0;
    });
  }
  return removed;
}
