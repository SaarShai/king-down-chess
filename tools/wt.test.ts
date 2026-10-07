// Worktree script test (dev-environment/01, 03). Each case runs the real tools/wt.sh in a temporary
// repository: the real .gitignore, a lock file, a fake package folder and a stub `npm` on PATH.
// The stub writes its arguments to a log. For `ci` it deletes each entry of node_modules, as
// real `npm ci` does, also through a link, and then writes its own package folder.
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { tempRepo } from './lib/temp-repo.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const script = join(repoRoot, 'tools', 'wt.sh');
const vitest = join(repoRoot, 'node_modules', '.bin', 'vitest');
const packages = ['alpha', 'beta', '.bin'];

type Repo = ReturnType<typeof tempRepo>;
const repos: Repo[] = [];
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

/** A main checkout with the real ignore file, a committed lock file and a fake package folder. */
function setup() {
  const repo = tempRepo({ hooks: false });
  repos.push(repo);
  cpSync(join(repoRoot, '.gitignore'), join(repo.dir, '.gitignore'));
  repo.write('package-lock.json', '{ "lock": 1 }\n');
  for (const name of packages) mkdirSync(join(repo.dir, 'node_modules', name), { recursive: true });
  repo.git('add', '.gitignore', 'package-lock.json');
  repo.git('commit', '-q', '-m', 'start');
  const bin = join(repo.root, 'bin');
  const log = join(repo.root, 'npm.log');
  mkdirSync(bin);
  writeFileSync(join(bin, 'npm'), [
    '#!/bin/sh',
    `echo "$*" >> "${log}"`,
    'if [ "$1" = ci ]; then',
    '  if [ -d node_modules ]; then for e in node_modules/* node_modules/.[!.]*; do [ -e "$e" ] && rm -rf "$e"; done; fi',
    '  mkdir -p node_modules && touch node_modules/installed',
    'fi',
    '',
  ].join('\n'));
  chmodSync(join(bin, 'npm'), 0o755);
  const env = { PATH: `${bin}:${repo.env.PATH}` };
  /** Runs the worktree script; `cwd` defaults to the main checkout. */
  const wt = (args: string[], cwd = repo.dir) => repo.run(script, args, { cwd, env });
  const npmCalls = () => (existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : []);
  const mainPackages = () => readdirSync(join(repo.dir, 'node_modules')).sort();
  const worktrees = join(repo.dir, '.claude', 'worktrees');
  return { repo, wt, npmCalls, mainPackages, worktrees };
}

const isLink = (path: string) => lstatSync(path).isSymbolicLink();

describe('wt add <branch>', () => {
  it('makes a worktree on a new branch from main, links the packages, and git status stays empty', () => {
    const { repo, wt, npmCalls, worktrees } = setup();
    const result = wt(['add', 'feature/one']);
    expect(result.status, result.stderr).toBe(0);
    const path = join(worktrees, 'one');
    expect(result.stdout).toBe(`${path}\tfeature/one\tlinked\n`);
    expect(isLink(join(path, 'node_modules'))).toBe(true);
    expect(readlinkSync(join(path, 'node_modules'))).toBe(join(repo.dir, 'node_modules'));
    expect(repo.run('git', ['branch', '--show-current'], { cwd: path }).stdout.trim()).toBe('feature/one');
    expect(repo.run('git', ['status', '--porcelain'], { cwd: path }).stdout).toBe('');
    expect(repo.git('status', '--porcelain').stdout).toBe('');
    expect(npmCalls()).toEqual([]);
  });
});

describe('wt add with a changed lock file', () => {
  it('installs with npm ci on a branch whose lock file differs, and the main package folder keeps every entry', () => {
    const { repo, wt, npmCalls, mainPackages, worktrees } = setup();
    const before = mainPackages();
    repo.git('switch', '-q', '-c', 'deps');
    repo.write('package-lock.json', '{ "lock": 2 }\n');
    repo.git('commit', '-q', '-am', 'new dependency');
    repo.git('switch', '-q', 'main');
    const result = wt(['add', 'deps']);
    expect(result.status, result.stderr).toBe(0);
    const path = join(worktrees, 'deps');
    expect(result.stdout).toBe(`${path}\tdeps\tinstalled\n`);
    expect(npmCalls()).toEqual(['ci']);
    expect(isLink(join(path, 'node_modules'))).toBe(false);
    expect(existsSync(join(path, 'node_modules', 'installed'))).toBe(true);
    expect(mainPackages()).toEqual(before);
  });

  it('removes the link before npm ci when the lock file of a linked worktree changes', () => {
    const { repo, wt, npmCalls, mainPackages, worktrees } = setup();
    const before = mainPackages();
    expect(wt(['add', 'feature/two']).stdout).toContain('\tlinked\n');
    const path = join(worktrees, 'two');
    writeFileSync(join(path, 'package-lock.json'), '{ "lock": 3 }\n');
    const result = wt(['add', path]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe(`${path}\tfeature/two\tinstalled\n`);
    expect(npmCalls()).toEqual(['ci']);
    expect(isLink(join(path, 'node_modules'))).toBe(false);
    expect(mainPackages()).toEqual(before);
    expect(repo.git('status', '--porcelain').stdout).toBe('');
  });
});

describe('wt add <path>', () => {
  it('sets up the packages of an existing worktree and of a detached worktree', () => {
    const { repo, wt, npmCalls } = setup();
    const plain = join(repo.root, 'plain');
    const detached = join(repo.root, 'detached');
    repo.git('worktree', 'add', '-q', '-b', 'plain', plain);
    repo.git('worktree', 'add', '-q', '--detach', detached);
    const first = wt(['add', plain]);
    expect(first.status, first.stderr).toBe(0);
    expect(first.stdout).toBe(`${plain}\tplain\tlinked\n`);
    const second = wt(['add', detached]);
    expect(second.status, second.stderr).toBe(0);
    expect(second.stdout).toBe(`${detached}\t(detached)\tlinked\n`);
    for (const path of [plain, detached]) {
      expect(isLink(join(path, 'node_modules'))).toBe(true);
      expect(repo.run('git', ['status', '--porcelain'], { cwd: path }).stdout).toBe('');
    }
    expect(npmCalls()).toEqual([]);
  });

  it('uses an existing branch, starts a new one from <start>, and finds the main checkout from a worktree', () => {
    const { repo, wt, worktrees } = setup();
    repo.git('branch', 'old');
    repo.write('a.txt', 'a\n');
    repo.git('add', 'a.txt');
    repo.git('commit', '-q', '-m', 'a');
    const old = wt(['add', 'old']);
    expect(old.status, old.stderr).toBe(0);
    const oldPath = join(worktrees, 'old');
    expect(existsSync(join(oldPath, 'a.txt'))).toBe(false);
    // From inside a worktree: the new one goes to the main checkout's folder and links its packages.
    const started = wt(['add', 'team/new', 'old'], oldPath);
    expect(started.status, started.stderr).toBe(0);
    const newPath = join(worktrees, 'new');
    expect(started.stdout).toBe(`${newPath}\tteam/new\tlinked\n`);
    expect(readlinkSync(join(newPath, 'node_modules'))).toBe(join(repo.dir, 'node_modules'));
    expect(repo.git('rev-parse', 'team/new').stdout).toBe(repo.git('rev-parse', 'old').stdout);
  });
});

describe('wt prune', () => {
  const guards = ['current', 'locked', 'changed', 'ignored', 'unmerged', 'recent'] as const;

  /**
   * One worktree per prune guard and one safe worktree, each made by `wt add` (so each has a
   * package link), plus one worktree whose folder is gone. The index and HEAD of each worktree
   * but `recent` are two days old.
   */
  function pruneSetup() {
    const s = setup();
    const { repo, wt, worktrees } = s;
    repo.write('readme.txt', 'one\n');
    repo.git('add', 'readme.txt');
    repo.git('commit', '-q', '-m', 'readme');
    const path: Record<string, string> = {};
    for (const name of [...guards, 'safe', 'gone']) {
      const result = wt(['add', `prune/${name}`]);
      expect(result.status, result.stderr).toBe(0);
      path[name] = join(worktrees, name);
    }
    repo.git('worktree', 'lock', path.locked);
    writeFileSync(join(path.changed, 'readme.txt'), 'two\n');
    mkdirSync(join(path.ignored, 'sim', 'out'), { recursive: true });
    writeFileSync(join(path.ignored, 'sim', 'out', 'run.jsonl'), '{}\n');
    writeFileSync(join(path.unmerged, 'readme.txt'), 'three\n');
    expect(repo.run('git', ['commit', '-q', '-am', 'not on main'], { cwd: path.unmerged }).status).toBe(0);
    // The ignored files that prune allows.
    mkdirSync(join(path.safe, 'dist'));
    writeFileSync(join(path.safe, 'dist', 'index.html'), '<p>\n');
    writeFileSync(join(path.safe, '.DS_Store'), '');
    rmSync(path.gone, { recursive: true, force: true });
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000);
    for (const name of [...guards, 'safe']) {
      if (name === 'recent') continue;
      const gitDir = join(repo.dir, '.git', 'worktrees', name);
      for (const file of ['index', 'HEAD']) utimesSync(join(gitDir, file), twoDaysAgo, twoDaysAgo);
    }
    const prune = (args: string[] = []) => wt(['prune', ...args], path.current);
    /** Each output line as path -> [verdict, reason]. */
    const verdicts = (stdout: string) =>
      Object.fromEntries(stdout.trim().split('\n').map(line => { const [p, verdict, reason] = line.split('\t'); return [p, [verdict, reason]]; }));
    const listed = () => repo.git('worktree', 'list', '--porcelain').stdout;
    const branches = () => repo.git('branch', '--list').stdout.replace(/^[*+ ] /gm, '').split('\n').sort();
    return { ...s, path, prune, verdicts, listed, branches };
  }

  it('lists each worktree with a verdict and the reason, prunes the gone one, and removes nothing', () => {
    const { repo, path, prune, verdicts, listed } = pruneSetup();
    expect(listed()).toContain(path.gone);
    const result = prune();
    expect(result.status, result.stderr).toBe(0);
    const v = verdicts(result.stdout);
    expect(Object.keys(v).sort()).toEqual([repo.dir, ...guards.map(n => path[n]), path.safe].sort());
    expect(v[repo.dir]).toEqual(['keep', 'main checkout']);
    expect(v[path.current]).toEqual(['keep', 'current worktree']);
    expect(v[path.locked]).toEqual(['keep', 'locked']);
    expect(v[path.changed]).toEqual(['keep', 'changes: readme.txt']);
    expect(v[path.ignored]).toEqual(['keep', 'ignored file: sim/out/run.jsonl']);
    expect(v[path.unmerged]).toEqual(['keep', 'commits not on main']);
    expect(v[path.recent]).toEqual(['keep', 'index or HEAD changed in the last 24 hours']);
    expect(v[path.safe][0]).toBe('safe');
    // git worktree prune forgot the gone worktree; nothing else changed.
    expect(listed()).not.toContain(path.gone);
    for (const name of [...guards, 'safe']) expect(existsSync(path[name]), name).toBe(true);
    // A second dry run gives the same verdicts: the first one wrote no index.
    expect(verdicts(prune().stdout)).toEqual(v);
  });

  it('with --apply removes only the safe worktree and its link, and keeps every branch and the main packages', () => {
    const { repo, path, prune, verdicts, listed, branches, mainPackages } = pruneSetup();
    const branchesBefore = branches();
    const packagesBefore = mainPackages();
    const result = prune(['--apply']);
    expect(result.status, result.stderr).toBe(0);
    const v = verdicts(result.stdout);
    expect(v[path.safe][0]).toBe('removed');
    for (const name of guards) expect(v[path[name]][0], name).toBe('keep');
    expect(existsSync(path.safe)).toBe(false);
    expect(listed()).not.toContain(path.safe);
    for (const name of guards) {
      expect(existsSync(path[name]), name).toBe(true);
      expect(listed()).toContain(path[name]);
    }
    expect(branches()).toEqual(branchesBefore);
    expect(branches()).toContain('prune/safe');
    expect(mainPackages()).toEqual(packagesBefore);
    expect(repo.git('status', '--porcelain').stdout).toBe('');
  });
});

describe('installation guard', () => {
  /** Runs tools/install-guard.test.ts against `checkout` in a separate vitest. */
  const guard = (repo: Repo, checkout: string) =>
    repo.run(vitest, ['run', 'tools/install-guard.test.ts'], { cwd: repoRoot, env: { INSTALL_GUARD_CHECKOUT: checkout } });

  it('fails in a linked worktree with a changed lock file and names wt add <path>', { timeout: 60_000 }, () => {
    const { repo, wt, worktrees } = setup();
    wt(['add', 'feature/three']);
    const path = join(worktrees, 'three');
    writeFileSync(join(path, 'package-lock.json'), '{ "lock": 4 }\n');
    const result = guard(repo, path);
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain(`wt add ${path}`);
  });

  it('passes in the main checkout and in a linked worktree with an equal lock file', { timeout: 60_000 }, () => {
    const { repo, wt, worktrees } = setup();
    wt(['add', 'feature/four']);
    for (const checkout of [repo.dir, join(worktrees, 'four')]) {
      const result = guard(repo, checkout);
      expect(result.status, result.stdout + result.stderr).toBe(0);
    }
  });
});
