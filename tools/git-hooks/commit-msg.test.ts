// Git-hook test for commit-msg (checks-and-hooks/03, story 6). Each case drives the real hook
// through a real `git commit` in a temporary repository. The names come from the name module,
// so this file holds no model name.
import { afterEach, describe, expect, it } from 'vitest';
import { MODEL_NAMES } from '../lib/model-names.mjs';
import { tempRepo } from '../lib/temp-repo.mjs';

const repos: { cleanup(): void }[] = [];
const make = () => { const repo = tempRepo(); repos.push(repo); return repo; };
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

// No marker, so prepare-commit-msg adds no trailer.
const noMarker = { CLAUDECODE: undefined, CODEX_THREAD_ID: undefined };
const stage = (repo: ReturnType<typeof tempRepo>, text = 'a\n') => { repo.write('a.txt', text); repo.git('add', 'a.txt'); };
const commit = (repo: ReturnType<typeof tempRepo>, ...args: string[]) => repo.run('git', ['commit', ...args], { env: noMarker });
const name = MODEL_NAMES[0];
const capital = name[0].toUpperCase() + name.slice(1);

describe('commit-msg', () => {
  it('story 6: a message with a model name exits non-zero, and the output holds the word and the fix', () => {
    const repo = make();
    stage(repo);
    const result = commit(repo, '-m', 'Add a', '-m', `Co-Authored-By: Claude ${capital} 5.5 <noreply@anthropic.com>`);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(`"${capital} 5.5"`);
    expect(result.stderr).toContain('line 3');
    expect(result.stderr).toContain('Co-Authored-By: Claude Code <noreply@anthropic.com>');
    expect(result.stderr).toContain('git commit -F');
    expect(repo.git('rev-parse', '--verify', '-q', 'HEAD').status).not.toBe(0);
  });

  it('refuses each name of the module in the subject', () => {
    // One repository; the launcher runs as git runs it, with the message file as its argument.
    const repo = make();
    for (const each of MODEL_NAMES) {
      repo.write('message.txt', `Tune the search with ${each.toUpperCase()}\n`);
      const result = repo.run('.githooks/commit-msg', ['message.txt']);
      expect(result.status, each).not.toBe(0);
      expect(result.stderr).toContain(`line 1: "${each.toUpperCase()}"`);
    }
  });

  it('passes a clean message', () => {
    const repo = make();
    stage(repo);
    const result = commit(repo, '-m', 'Add a', '-m', 'Co-Authored-By: Codex <noreply@openai.com>');
    expect(result.status, result.stderr).toBe(0);
  });

  it('reads no comment line and no diff below the scissors line', () => {
    const repo = make();
    stage(repo, `the ${name} entry stays in the data\n`);
    // -v puts the staged diff below the scissors line; the editor keeps the file as it is.
    const result = repo.run('git', ['commit', '-v', '-e', '-m', 'Add a'], { env: { ...noMarker, GIT_EDITOR: 'true' } });
    expect(result.status, result.stderr).toBe(0);
    expect(repo.git('log', '-1', '--format=%B').stdout.trim()).toBe('Add a');
  });
});
