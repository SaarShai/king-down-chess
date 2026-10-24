// Git-hook test for prepare-commit-msg (checks-and-hooks/03, story 7). Each case drives the real
// hook through a real `git commit` in a temporary repository and reads the recorded message.
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.setConfig({ testTimeout: 60_000 }); // each case runs real git and node processes; under load one takes more than vitest's 5 s
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
  codex: { CLAUDECODE: undefined, CODEX_THREAD_ID: 'thread' },
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

  it.each([markers.codex, markers.both])('with a Codex marker, adds both required trailers once (%j)', env => {
    const message = commit(env, 'Add a');
    expect(message.split('\n').at(-1)).toBe(codex);
    expect(lines(message, 'Co-Authored-By:')).toEqual([claudeCode, codex]);
  });

  it('with no marker, adds no trailer and still removes Claude-Session lines', () => {
    const message = commit(markers.none, 'Add a', `${session}\nReviewed-by: Owner <owner@example.invalid>`);
    expect(message).toBe('Add a\n\nReviewed-by: Owner <owner@example.invalid>');
  });

  it.each([
    [claudeCode, [claudeCode, codex]],
    [codex, [codex, claudeCode]],
    [`${claudeCode}\n${codex}`, [claudeCode, codex]],
    [`Co-authored-by: Claude Code <noreply@anthropic.com>\n${codex}`, ['Co-authored-by: Claude Code <noreply@anthropic.com>', codex]],
    ['Co-Authored-By: OpenCode <noreply@opencode.ai>', ['Co-Authored-By: OpenCode <noreply@opencode.ai>', claudeCode, codex]],
  ])('adds only missing trailers to %s', (existing, expected) => {
    const message = commit(markers.both, 'Add a', `${session}\n${existing}`);
    expect(lines(message, 'Co-')).toEqual(expected);
    expect(message).not.toContain('Claude-Session');
  }, 30_000);

  it('keeps one Claude Code trailer in a Claude Code commit', () => {
    expect(lines(commit(markers.claudeCode, 'Add a', claudeCode), 'Co-Authored-By:')).toEqual([claudeCode]);
  }, 30_000);

  it('adds no trailer to an empty message, so git still refuses it', () => {
    const repo = make();
    repo.write('a.txt', 'a\n');
    repo.git('add', 'a.txt');
    const result = repo.run('git', ['commit', '-m', session], { env: markers.claudeCode });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/empty commit message/);
  });
});
