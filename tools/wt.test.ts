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
