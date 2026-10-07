// Worktree script test (dev-environment/01). Each case runs the real tools/wt.sh in a temporary
// repository: the real .gitignore, a lock file, a fake package folder and a stub `npm` on PATH.
// The stub writes its arguments to a log. For `ci` it deletes each entry of node_modules, as
// real `npm ci` does, also through a link, and then writes its own package folder.
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { tempRepo } from './lib/temp-repo.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const script = join(repoRoot, 'tools', 'wt.sh');
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
