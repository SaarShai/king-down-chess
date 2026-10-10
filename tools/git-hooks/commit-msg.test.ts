// Git-hook test for commit-msg (checks-and-hooks/03, story 6; checks-and-hooks/10, story 8).
// Each case drives the real hook through a real `git commit` in a temporary repository. The names
// come from the name module, so this file holds no model name.
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.setConfig({ testTimeout: 60_000 }); // each case runs real git and node processes; under load one takes more than vitest's 5 s
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

// A registered check (the runner's registry names it) with five assertion lines.
const check = 'tools/verify-workshop.mjs';
const steps = [
  "import assert from 'node:assert/strict';",
  'const p = await open();',
  'assert.equal(await p.locator(".ws-board").count(), 2);',
  'assert.ok(await p.isVisible(".ws-card"));',
  'await p.click(".ws-try");',
  'assert.equal(await p.textContent(".ws-gauge"), "about 1 pawn");',
  'await noOverlap(p, ".ws-board");',
  'assertNoErrors();',
];
/** A repository whose first commit holds the check with all its steps. */
const withCheck = () => {
  const repo = make();
  repo.write(check, steps.join('\n') + '\n');
  repo.git('add', check);
  expect(commit(repo, '-m', 'Add the check').status).toBe(0);
  return repo;
};
/** Stages the check with the given steps. */
const stageCheck = (repo: ReturnType<typeof tempRepo>, lines: string[]) => { repo.write(check, lines.join('\n') + '\n'); repo.git('add', check); };
const trailers = (n: number) => Array.from({ length: n }, (_, i) => `Removed-check: ${check}: step ${i + 1}, the new card covers it`).join('\n');
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

// Each case makes two real commits with all hooks; a busy machine needs more than 5 s.
describe('commit-msg: removed assertions need Removed-check trailers', () => {
  const removed = [steps[2], steps[5], steps[6]];
  const kept = steps.filter(step => !removed.includes(step));

  it('story 8: three removed assertion lines with two trailers exit non-zero, and the output shows the count 3 and the three lines', () => {
    const repo = withCheck();
    stageCheck(repo, kept);
    const result = commit(repo, '-m', 'Cut the check', '-m', trailers(2));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('removes 3 assertion lines');
    expect(result.stderr).toContain('has 2 Removed-check: trailers');
    for (const line of removed) expect(result.stderr).toContain(line);
    expect(result.stderr).toContain('Removed-check: <file>: <what the line checked>, <why it goes>');
    expect(result.stderr).toContain('git commit -F');
    expect(repo.git('log', '-1', '--format=%s').stdout.trim()).toBe('Add the check');
  });

  it('passes the same commit with three trailers', () => {
    const repo = withCheck();
    stageCheck(repo, kept);
    const result = commit(repo, '-m', 'Cut the check', '-m', trailers(3));
    expect(result.status, result.stderr).toBe(0);
    expect(repo.git('log', '-1', '--format=%s').stdout.trim()).toBe('Cut the check');
  });

  it('passes a commit that only moves an assertion, with no trailer', () => {
    const repo = withCheck();
    stageCheck(repo, [steps[0], steps[1], steps[4], `  ${steps[2]}`, steps[3], ...steps.slice(5)]);
    const result = commit(repo, '-m', 'Click first, then count the boards');
    expect(result.status, result.stderr).toBe(0);
  });

  it('counts a probe file that a check runs (tools/ux-defects/d<N>-<slug>.mjs) as a registered check', () => {
    const repo = make();
    const probe = 'tools/ux-defects/d1-resign-side.mjs';
    repo.write(probe, steps.join('\n') + '\n');
    repo.git('add', probe);
    expect(commit(repo, '-m', 'Add the probe').status).toBe(0);
    repo.write(probe, kept.join('\n') + '\n');
    repo.git('add', probe);
    const refused = commit(repo, '-m', 'Cut the probe');
    expect(refused.status).not.toBe(0);
    expect(refused.stderr).toContain('removes 3 assertion lines');
    expect(refused.stderr).toContain(`${probe}:3: ${steps[2]}`);
    expect(commit(repo, '-m', 'Cut the probe', '-m', trailers(3)).status).toBe(0);
  });

  it('refuses for both reasons in one run', () => {
    const repo = withCheck();
    stageCheck(repo, kept);
    const result = commit(repo, '-m', `Cut the check for ${name}`);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(`"${name}"`);
    expect(result.stderr).toContain('removes 3 assertion lines');
  });

  it('passes a merge of a branch that removed assertions with its trailers, with no trailer on the merge', () => {
    const repo = withCheck();
    repo.git('switch', '-q', '-c', 'side');
    stageCheck(repo, kept);
    expect(commit(repo, '-m', 'Cut the check', '-m', trailers(3)).status).toBe(0);
    repo.git('switch', '-q', 'main');
    repo.write('b.txt', 'b\n');
    repo.git('add', 'b.txt');
    expect(commit(repo, '-m', 'Add b').status).toBe(0);
    const result = repo.run('git', ['merge', '--no-ff', '-m', 'Merge side', 'side'], { env: noMarker });
    expect(result.status, result.stderr).toBe(0);
    expect(repo.git('log', '-1', '--format=%s').stdout.trim()).toBe('Merge side');
  });

  it('refuses a merge that removes an assertion line that both parents hold', () => {
    const repo = withCheck();
    repo.git('switch', '-q', '-c', 'side');
    repo.write('b.txt', 'b\n');
    repo.git('add', 'b.txt');
    expect(commit(repo, '-m', 'Add b').status).toBe(0);
    repo.git('switch', '-q', 'main');
    repo.write('c.txt', 'c\n');
    repo.git('add', 'c.txt');
    expect(commit(repo, '-m', 'Add c').status).toBe(0);
    expect(repo.run('git', ['merge', '--no-ff', '--no-commit', 'side'], { env: noMarker }).status).toBe(0);
    stageCheck(repo, steps.filter(step => step !== steps[3]));
    const result = commit(repo, '-m', 'Merge side');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('removes 1 assertion line');
    expect(result.stderr).toContain(steps[3]);
  });
});
