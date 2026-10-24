// Lint for model names in the docs (AGENTS.md, Commits and branches): no Markdown file of the tree
// holds a name from the model-name module, outside the exempt files. A fault names the file, the line
// and the word. The tree is each tracked or new Markdown file that the ignore rules do not match.
// The exempt files keep model names as data; each entry gives its reason.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findModelNames, MODEL_NAMES } from './lib/model-names.mjs';

const root = join(import.meta.dirname, '..');

/** The files that may hold a model name. */
const EXEMPT: { path: RegExp; why: string }[] = [
  { path: /^docs\/tasks-archive\//, why: 'the tasks archive: old records' },
  { path: /^docs\/DELEGATION\.md$/, why: 'which model does which work, with the tested model IDs' },
  { path: /^docs\/LOCAL-AI-MACBOOK\.md$/, why: 'the M1 model inventory and the commands that name each model' },
  { path: /^docs\/research\/(m1-|direct-campaign-2026-09-22\.md$)/, why: 'the records of the 2026-09-21 and 2026-09-22 model trials' },
  { path: /^docs\/research\/chatgpt-plugin-feasibility-2026-10-07\.md$/, why: 'cites the earlier ChatGPT plugin project by its folder name' },
  { path: /^docs\/research\/chatgpt-chess-market\.md$/, why: 'cites an outside repository by its name and address' },
];

/** Each model name in one file, as `file:line: "word"`. An exempt file gives none. */
function modelNameFaults(file: string, text: string): string[] {
  if (EXEMPT.some(entry => entry.path.test(file))) return [];
  return findModelNames(text).map(find => `${file}:${find.line}: "${find.word}"`);
}

/** The Markdown files of the tree, tracked or new, that exist on disk. */
const markdownFiles = () => {
  const result = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', '*.md'], { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 });
  if (result.error) throw result.error;
  expect(result.status, result.stderr).toBe(0);
  return [...new Set(result.stdout.split('\0').filter(Boolean))].filter(file => existsSync(join(root, file)));
};

describe('model names in the docs', () => {
  // The model name comes from the module, so this file holds no model name.
  const model = MODEL_NAMES[0];

  it('names the file, the line and the word of each find', () => {
    const text = ['# Review', '', `An independent review (${model} 5.5) found two faults.`, `${model.toUpperCase()} again.`].join('\n');
    expect(modelNameFaults('docs/specs/x/issues/01-x.md', text)).toEqual([
      `docs/specs/x/issues/01-x.md:3: "${model} 5.5"`,
      `docs/specs/x/issues/01-x.md:4: "${model.toUpperCase()}"`,
    ]);
  });

  it('passes an exempt file and a text with no model name', () => {
    expect(modelNameFaults('docs/tasks-archive/2026-09.md', `A ${model} agent.`)).toEqual([]);
    expect(modelNameFaults('docs/specs/x/issues/01-x.md', 'An independent review by Codex and Claude Code.')).toEqual([]);
  });

  it('each exempt entry matches a file of the tree', () => {
    const files = markdownFiles();
    expect(EXEMPT.filter(entry => !files.some(file => entry.path.test(file))).map(entry => entry.why)).toEqual([]);
  });

  it('no Markdown file outside the exempt files holds a model name', () => {
    expect(markdownFiles().flatMap(file => modelNameFaults(file, readFileSync(join(root, file), 'utf8')))).toEqual([]);
  });
});
