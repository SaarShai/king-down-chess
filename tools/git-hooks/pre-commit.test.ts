// Git-hook test for pre-commit, `prepare` and the tempRepo() harness (checks-and-hooks/02).
// Each case drives the real hook through a real `git commit` in a temporary repository.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { tempRepo } from '../lib/temp-repo.mjs';

const repos: { cleanup(): void }[] = [];
const make = (options?: { hooks?: boolean }) => { const repo = tempRepo(options); repos.push(repo); return repo; };
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

describe('tempRepo()', () => {
  it('makes a work tree with a bare remote, the tracked hooks and core.hooksPath', () => {
    const repo = make();
    expect(repo.git('rev-parse', '--show-toplevel').stdout.trim()).toBe(repo.dir);
    expect(repo.git('rev-parse', '--is-bare-repository').stdout.trim()).toBe('false');
    expect(repo.git('remote', 'get-url', 'origin').stdout.trim()).toBe(repo.remote);
    expect(repo.git('--git-dir', repo.remote, 'rev-parse', '--is-bare-repository').stdout.trim()).toBe('true');
    expect(repo.git('config', 'core.hooksPath').stdout.trim()).toBe('.githooks');
    expect(repo.exists('.githooks/pre-commit')).toBe(true);
    expect(repo.git('status', '--porcelain').stdout).toBe('');
  });

  it('keeps the caller GIT_ variables from git, and the global and system configs are empty', () => {
    const leak = { GIT_DIR: '/nowhere', GIT_INDEX_FILE: '/nowhere/index', GIT_WORK_TREE: '/nowhere', GIT_AUTHOR_NAME: 'Leak' };
    const saved = { ...process.env };
    Object.assign(process.env, leak);
    try {
      const repo = make();
      // Only the two config-isolation variables of the harness; none of the caller's.
      expect(Object.keys(repo.env).filter(k => k.startsWith('GIT_')).sort()).toEqual(['GIT_CONFIG_GLOBAL', 'GIT_CONFIG_NOSYSTEM']);
      expect(repo.git('config', '--global', '--list').stdout).toBe('');
      expect(repo.git('config', '--system', '--list').stdout).toBe('');
      const scopes = repo.git('config', '--list', '--show-scope').stdout.trim().split('\n').map(line => line.split('\t')[0]);
      expect(new Set(scopes)).toEqual(new Set(['local']));
      repo.write('a.txt', 'a\n');
      repo.git('add', 'a.txt');
      const commit = repo.git('commit', '-q', '-m', 'a');
      expect(commit.status, commit.stderr).toBe(0);
      expect(repo.git('log', '-1', '--format=%an <%ae>').stdout.trim()).toBe('Temp Repo <temp-repo@example.invalid>');
    } finally {
      for (const k of Object.keys(leak)) delete process.env[k];
      Object.assign(process.env, saved);
    }
  });

  it('with hooks off, sets no hooks path, and a commit with a type error passes', () => {
    const repo = make({ hooks: false });
    expect(repo.git('config', 'core.hooksPath').status).not.toBe(0);
    expect(repo.exists('.githooks')).toBe(false);
    repo.write('bad.ts', "export const n: number = 'text';\n");
    repo.git('add', 'bad.ts');
    const commit = repo.git('commit', '-q', '-m', 'type error');
    expect(commit.status, commit.stderr).toBe(0);
  });
});

const fault = "src/bad.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.\n";
type Call = { name: string; args: string[]; stdin: string; git: string[] };
const calls = (repo: ReturnType<typeof tempRepo>): Call[] =>
  repo.exists('.fixture/calls.jsonl') ? repo.read('.fixture/calls.jsonl').trim().split('\n').map(line => JSON.parse(line)) : [];
const commit = (repo: ReturnType<typeof tempRepo>, name = 'a.txt') => {
  repo.write(name, `${name}\n`);
  repo.git('add', name);
  return repo.git('commit', '-m', `add ${name}`);
};

describe('pre-commit', () => {
  it('story 1: a type error refuses the commit and the output holds the compiler fault', () => {
    const repo = make();
    repo.write('.fixture/typecheck.fail', fault);
    const result = commit(repo);
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain(fault.trim());
    expect(repo.git('rev-parse', '--verify', '-q', 'HEAD').status).not.toBe(0);
  });

  it('a clean commit passes after the type check and the gate', () => {
    const repo = make();
    const result = commit(repo);
    expect(result.status, result.stderr).toBe(0);
    expect(calls(repo).map(c => c.name)).toEqual(['typecheck', 'gate']);
  });

  it('story 9: a gate that exits 1 refuses the commit, and its stderr shows', () => {
    const repo = make();
    repo.write('.fixture/gate.fail', 'gate: size: big.bin is over 2 MB\n');
    const result = commit(repo);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('gate: size: big.bin is over 2 MB');
    expect(result.stderr).toContain('repo gate refused');
  });

  it('story 9: a package with no gate script refuses and says that the gate is missing', () => {
    const repo = make();
    const pkg = JSON.parse(repo.read('package.json'));
    delete pkg.scripts.gate;
    repo.write('package.json', JSON.stringify(pkg));
    const result = commit(repo);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/gate is missing/);
    expect(calls(repo).map(c => c.name)).toEqual(['typecheck']);
  });

  it('the gate gets `staged` and the GIT_ variables that git set; the type check gets no GIT_ variable', () => {
    const repo = make();
    expect(commit(repo).status).toBe(0);
    const [typecheck, gate] = calls(repo);
    expect(typecheck.git).toEqual([]);
    expect(gate.args).toEqual(['staged']);
    expect(gate.stdin).toBe('');
    // Git sets GIT_INDEX_FILE for the pre-commit hook; the harness sets the two config variables.
    expect(gate.git).toEqual(expect.arrayContaining(['GIT_INDEX_FILE', 'GIT_CONFIG_GLOBAL', 'GIT_CONFIG_NOSYSTEM']));
  });

  it('story 5: with no node_modules, pre-commit refuses and names the worktree script and its add command', () => {
    const repo = make();
    repo.remove('node_modules');
    const result = commit(repo);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('tools/wt.sh add');
    expect(calls(repo)).toEqual([]);
  });
});

describe('prepare (story 2)', () => {
  const realPackage = readFileSync(join(import.meta.dirname, '..', '..', 'package.json'), 'utf8');
  // An origin with the real package file, the hook folder and the paths of the Kaggle sparse checkout.
  const origin = () => {
    const repo = make({ hooks: false });
    repo.write('package.json', realPackage);
    repo.write('package-lock.json', '{}\n');
    repo.write('tsconfig.json', '{}\n');
    repo.write('src/a.ts', 'export {};\n');
    repo.write('sim/probes/a.txt', 'a\n');
    repo.write('.githooks/pre-commit', '#!/bin/sh\n');
    repo.write('tools/a.mjs', '\n');
    repo.git('add', '-A');
    expect(repo.git('commit', '-q', '-m', 'seed').status).toBe(0);
    expect(repo.git('push', '-q', 'origin', 'main').status).toBe(0);
    return repo;
  };

  it('in a clone, sets core.hooksPath to the relative hook folder', () => {
    const repo = origin();
    const clone = join(repo.root, 'clone');
    expect(repo.git('clone', '-q', repo.remote, clone).status).toBe(0);
    const prepare = repo.run('npm', ['run', '--silent', 'prepare'], { cwd: clone });
    expect(prepare.status, prepare.stderr).toBe(0);
    expect(repo.run('git', ['config', 'core.hooksPath'], { cwd: clone }).stdout.trim()).toBe('.githooks');
  });

  it('in a sparse checkout with only the Kaggle paths, exits 0', () => {
    const repo = origin();
    // The steps of tools/kaggle-tournament.mjs: sparse paths, a shallow fetch, a detached checkout.
    const sparse = join(repo.root, 'sparse');
    const inSparse = (...args: string[]) => repo.run('git', ['-C', sparse, ...args], { cwd: repo.root });
    expect(repo.run('git', ['init', '-q', sparse], { cwd: repo.root }).status).toBe(0);
    inSparse('remote', 'add', 'origin', `file://${repo.remote}`);
    inSparse('config', 'core.sparseCheckout', 'true');
    writeFileSync(join(sparse, '.git', 'info', 'sparse-checkout'), '/package.json\n/package-lock.json\n/tsconfig.json\n/src/\n/sim/probes/\n');
    expect(inSparse('fetch', '-q', '--depth', '1', 'origin', 'main').status).toBe(0);
    expect(inSparse('checkout', '-q', 'FETCH_HEAD').status).toBe(0);
    expect(repo.run('ls', ['-A'], { cwd: sparse }).stdout.split('\n').filter(Boolean).sort()).toEqual(['.git', 'package-lock.json', 'package.json', 'sim', 'src', 'tsconfig.json']);
    const prepare = repo.run('npm', ['run', '--silent', 'prepare'], { cwd: sparse });
    expect(prepare.status, prepare.stderr).toBe(0);
  });

  it('outside a git repository, exits 0', () => {
    const repo = make({ hooks: false });
    const folder = join(repo.root, 'no-repo');
    mkdirSync(folder);
    writeFileSync(join(folder, 'package.json'), realPackage);
    const prepare = repo.run('npm', ['run', '--silent', 'prepare'], { cwd: folder, env: { GIT_CEILING_DIRECTORIES: repo.root } });
    expect(prepare.status, prepare.stderr).toBe(0);
  });
});

describe('gate interface', () => {
  const gatePath = join(import.meta.dirname, '..', 'gate.mjs');

  it('exits 0 with nothing staged and for a push of a branch deletion, and its header states the interface', () => {
    const repo = make({ hooks: false });
    expect(repo.run('node', [gatePath, 'staged']).status).toBe(0);
    const deletion = `(delete) ${'0'.repeat(40)} refs/heads/a ${'0'.repeat(40)}\n`;
    expect(repo.run('node', [gatePath, 'push', 'origin', repo.remote], { input: deletion }).status).toBe(0);
    const header = readFileSync(gatePath, 'utf8');
    for (const words of ['npm run gate -- staged', 'npm run gate -- push <remote> <url>', 'GIT_INDEX_FILE', 'Exit codes: 0 passes', 'stderr'])
      expect(header).toContain(words);
  });

  it('lets a commit through the real pre-commit hook', () => {
    const repo = make();
    const pkg = JSON.parse(repo.read('package.json'));
    pkg.scripts.gate = `node "${gatePath}"`;
    repo.write('package.json', JSON.stringify(pkg));
    const result = commit(repo);
    expect(result.status, result.stderr).toBe(0);
  });
});
