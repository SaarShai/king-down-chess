// Unit test for changedFiles() (checks-and-hooks/04): the list that the pre-push hook checks
// against the protected paths of main.
import { afterEach, describe, expect, it } from 'vitest';
import { changedFiles } from './changed-files.mjs';
import { tempRepo } from './temp-repo.mjs';

const repos: { cleanup(): void }[] = [];
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

describe('changedFiles()', () => {
  it('lists additions, edits, deletions and both sides of a rename between two commits', () => {
    const repo = tempRepo({ hooks: false });
    repos.push(repo);
    const commit = (message: string) => {
      repo.git('add', '-A');
      expect(repo.git('commit', '-q', '-m', message).status).toBe(0);
      return repo.git('rev-parse', 'HEAD').stdout.trim();
    };
    repo.write('edit.txt', 'one\n');
    repo.write('gone.txt', 'gone\n');
    repo.write('docs/old name.md', 'a long text that stays the same, so that git sees a rename\n'.repeat(5));
    repo.write('same.txt', 'same\n');
    const from = commit('seed');
    repo.write('edit.txt', 'two\n');
    repo.remove('gone.txt');
    repo.write('src/new name.md', repo.read('docs/old name.md'));
    repo.remove('docs/old name.md');
    repo.write('public/added.txt', 'new\n');
    const to = commit('change');
    // The rename is a real rename for git, so the test does not pass by a delete and an add alone.
    expect(repo.git('diff', '--name-status', '-M', from, to).stdout).toMatch(/^R\d+\tdocs\/old name.md\tsrc\/new name.md$/m);

    expect(changedFiles(from, to, { cwd: repo.dir, env: repo.env }).sort()).toEqual(
      ['docs/old name.md', 'edit.txt', 'gone.txt', 'public/added.txt', 'src/new name.md']);
  });
});
