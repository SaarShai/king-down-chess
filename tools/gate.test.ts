// Repo gate test (secrets-and-public-gates/04): the size rule in `staged` mode.
// Each commit case drives the real pre-commit hook through `git commit` in a temporary repository,
// with the package `gate` script pointed at the real gate.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { tempRepo } from './lib/temp-repo.mjs';

const gatePath = join(import.meta.dirname, 'gate.mjs');
const big = 3 * 1024 * 1024;
type Repo = ReturnType<typeof tempRepo>;

const repos: Repo[] = [];
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });
/** A temporary repository whose pre-commit hook starts the real gate. */
const make = () => {
  const repo = tempRepo();
  repos.push(repo);
  const pkg = JSON.parse(repo.read('package.json'));
  pkg.scripts.gate = `node "${gatePath}"`;
  repo.write('package.json', JSON.stringify(pkg));
  return repo;
};
const commit = (repo: Repo, message: string, ...paths: string[]) => {
  repo.git('add', ...paths);
  return repo.git('commit', '-q', '-m', message);
};
const lines = (text: string, word: string) => text.split('\n').filter(line => line.includes(word));

describe('size rule through the real pre-commit hook', () => {
  it('refuses a commit that adds a 3 MB file, with one line that names the rule and the path', () => {
    const repo = make();
    repo.write('media/big.bin', 'x'.repeat(big));
    const result = commit(repo, 'add big', 'media/big.bin');
    expect(result.status).not.toBe(0);
    expect(repo.git('rev-parse', '--verify', '-q', 'HEAD').status).not.toBe(0);
    const faults = lines(result.stderr, 'gate: size:');
    expect(faults).toHaveLength(1);
    expect(faults[0]).toContain('media/big.bin');
    expect(faults[0]).toContain('index');
  });
});

describe('size allowlist', () => {
  it('lets the same commit pass when the allowlist holds the path and a reason', () => {
    const repo = make();
    repo.write('tools/gate/size-allowlist.txt', '# comment\n\nmedia/big.bin  a test video, approved\n');
    repo.write('media/big.bin', 'x'.repeat(big));
    const result = commit(repo, 'add big', 'media/big.bin', 'tools/gate/size-allowlist.txt');
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
  });
});

describe('gate faults give exit 2 and one fault line', () => {
  const gate = (repo: Repo, ...args: string[]) => repo.run('node', [gatePath, ...args]);
  const oneFault = (result: { status: number | null, stdout: string, stderr: string }) => {
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    expect(result.stderr.trim().split('\n')).toHaveLength(1);
    expect(result.stderr).toMatch(/^gate: fault: /);
  };

  it('an allowlist line with no reason', () => {
    const repo = make();
    repo.write('tools/gate/size-allowlist.txt', 'media/ok.bin a reason\nmedia/big.bin\n');
    const result = gate(repo, 'staged');
    oneFault(result);
    expect(result.stderr).toContain('line 2');
    expect(result.stderr).toContain('media/big.bin');
  });

  it('an unknown mode, and no mode', () => {
    const repo = make();
    oneFault(gate(repo, 'sideways'));
    expect(gate(repo, 'sideways').stderr).toContain('unknown mode "sideways"');
    oneFault(gate(repo));
  });

  it('a corrupt input: the index names an object that git does not have', () => {
    const repo = make();
    const ghost = 'deadbeef'.repeat(5);
    expect(repo.git('update-index', '--add', '--info-only', '--cacheinfo', `100644,${ghost},ghost.bin`).status).toBe(0);
    const result = gate(repo, 'staged');
    oneFault(result);
    expect(result.stderr).toContain('gate: fault: index: ghost.bin: ');
  });

  it('exit 0 gives no output', () => {
    const repo = make();
    repo.write('a.txt', 'a\n');
    repo.git('add', 'a.txt');
    expect(gate(repo, 'staged')).toEqual({ status: 0, stdout: '', stderr: '' });
  });
});

describe('the gate reads only added and changed files', () => {
  /** Commits a large file past the hooks, as a file that is already on origin. */
  const withBigFile = () => {
    const repo = make();
    repo.write('media/big.bin', 'x'.repeat(big));
    repo.git('add', 'media/big.bin');
    expect(repo.git('commit', '-q', '--no-verify', '-m', 'old big file').status).toBe(0);
    return repo;
  };

  it('passes a commit that changes only a small file while a large file stays in the tree', () => {
    const repo = withBigFile();
    repo.write('notes.txt', 'small\n');
    const result = commit(repo, 'small change', 'notes.txt');
    expect(result.status, result.stderr).toBe(0);
    expect(repo.git('ls-files', 'media/big.bin').stdout.trim()).toBe('media/big.bin');
  });

  it('refuses a commit that changes a large file that is not on the allowlist', () => {
    const repo = withBigFile();
    repo.write('media/big.bin', 'y'.repeat(big));
    const result = commit(repo, 'change big', 'media/big.bin');
    expect(result.status).not.toBe(0);
    expect(lines(result.stderr, 'gate: size: index: media/big.bin: ')).toHaveLength(1);
  });
});

describe('the size allowlist of this repository', () => {
  const root = join(import.meta.dirname, '..');
  const text = readFileSync(join(root, 'tools/gate/size-allowlist.txt'), 'utf8');
  const entries = text.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'))
    .map(line => { const [path, ...reason] = line.split(/\s+/); return { path, reason: reason.join(' ') }; });

  it('holds the two Workshop motion videos and the five figure samples, each with a reason', () => {
    expect(entries.map(e => e.path).sort()).toEqual([
      'docs/visual-design/workshop/figure-samples-2026-10-06/fast-minimal.png',
      'docs/visual-design/workshop/figure-samples-2026-10-06/mixed-archer-face.png',
      'docs/visual-design/workshop/figure-samples-2026-10-06/mixed-minimal.png',
      'docs/visual-design/workshop/figure-samples-2026-10-06/mixed.png',
      'docs/visual-design/workshop/figure-samples-2026-10-06/strong-minimal.png',
      'docs/visual-design/workshop/motion-desktop.webm',
      'docs/visual-design/workshop/motion-phone.webm',
    ]);
    for (const entry of entries) expect(entry.reason, entry.path).not.toBe('');
  });

  it('has no stale line: each listed path exists in the tree and is over 2,000,000 bytes', () => {
    for (const { path } of entries) {
      expect(existsSync(join(root, path)), `${path} is not in the tree`).toBe(true);
      expect(statSync(join(root, path)).size, path).toBeGreaterThan(2_000_000);
    }
  });
});
