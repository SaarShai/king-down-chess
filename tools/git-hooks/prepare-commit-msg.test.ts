// Git-hook test for prepare-commit-msg (checks-and-hooks/03, story 7). Each case drives the real
// hook through a real `git commit` in a temporary repository and reads the recorded message.
import { afterEach, describe, expect, it } from 'vitest';
import { tempRepo } from '../lib/temp-repo.mjs';

const repos: { cleanup(): void }[] = [];
const make = () => { const repo = tempRepo(); repos.push(repo); return repo; };
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

const claudeCode = 'Co-Authored-By: Claude Code <noreply@anthropic.com>';
const codex = 'Co-Authored-By: Codex <noreply@openai.com>';
// The Claude Code marker is CLAUDECODE; the Codex marker is CODEX_THREAD_ID (read in a Codex shell).
const markers = {
  none: { CLAUDECODE: undefined, CODEX_THREAD_ID: undefined },
  claudeCode: { CLAUDECODE: '1', CODEX_THREAD_ID: undefined },
  both: { CLAUDECODE: '1', CODEX_THREAD_ID: 'thread' },
};

/** Commits one new file with the given message parts and gives the recorded message. */
const commit = (env: Record<string, string | undefined>, ...parts: string[]) => {
  const repo = make();
  repo.write('a.txt', 'a\n');
  repo.git('add', 'a.txt');
  const result = repo.run('git', ['commit', ...parts.flatMap(p => ['-m', p])], { env });
  expect(result.status, result.stderr).toBe(0);
  return repo.git('log', '-1', '--format=%B').stdout.trimEnd();
};
const lines = (message: string, start: string) => message.split('\n').filter(line => line.startsWith(start));
const session = 'Claude-Session: https://claude.ai/code/session_0123';

describe('prepare-commit-msg', () => {
  it('story 7: with the Claude Code marker, the commit ends with one Claude Code trailer and no Claude-Session line', () => {
    const message = commit(markers.claudeCode, 'Add a', `Body.\n\n${session}`);
    expect(message.split('\n').at(-1)).toBe(claudeCode);
    expect(lines(message, 'Co-Authored-By:')).toEqual([claudeCode]);
    expect(message).not.toContain('Claude-Session');
    expect(message.startsWith('Add a\n\nBody.\n')).toBe(true);
  });

  it('with both markers, the commit ends with one Codex trailer', () => {
    const message = commit(markers.both, 'Add a');
    expect(message.split('\n').at(-1)).toBe(codex);
    expect(lines(message, 'Co-Authored-By:')).toEqual([codex]);
  });

  it('with no marker, adds no trailer and still removes Claude-Session lines', () => {
    const message = commit(markers.none, 'Add a', `${session}\nReviewed-by: Owner <owner@example.invalid>`);
    expect(message).toBe('Add a\n\nReviewed-by: Owner <owner@example.invalid>');
  });

  it('keeps exactly one trailer when the message already has a Co-Authored-By trailer', () => {
    for (const env of [markers.claudeCode, markers.both]) {
      const message = commit(env, 'Add a', `${session}\n${claudeCode}`);
      expect(lines(message, 'Co-Authored-By:')).toEqual([claudeCode]);
      expect(message).not.toContain('Claude-Session');
    }
    const lower = commit(markers.claudeCode, 'Add a', 'Co-authored-by: Codex <noreply@openai.com>');
    expect(lines(lower, 'Co-')).toEqual(['Co-authored-by: Codex <noreply@openai.com>']);
  }, 30_000); // three real commits with all hooks; a busy machine needs more than 5 s

  it('adds no trailer to an empty message, so git still refuses it', () => {
    const repo = make();
    repo.write('a.txt', 'a\n');
    repo.git('add', 'a.txt');
    const result = repo.run('git', ['commit', '-m', session], { env: markers.claudeCode });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/empty commit message/);
  });
});
