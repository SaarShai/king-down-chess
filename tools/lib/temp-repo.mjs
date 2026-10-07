// tempRepo(): a temporary git repository for tests of hooks and git scripts.
//
// It makes, in one new system temp folder (`root`):
//   - `work/`: the work tree (`dir`), branch main, a local identity, remote `origin`;
//   - `remote.git`: a bare repository (`remote`), branch main;
//   - `gitconfig`: an empty file that git uses as the global config.
// With hooks on (the default), it copies the tracked `.githooks/` folder, the modules that the hooks
// import (`hookModules`: the model-name module for commit-msg, the changed-files module for pre-push)
// and the fixture package (`tools/git-hooks/fixtures/package/`: `typecheck`, `test` and `gate`
// scripts) into the work tree, makes an empty `node_modules/`, and sets `core.hooksPath` to
// `.githooks`. These files are in `.git/info/exclude`, so `git status` is clean and `git add -A`
// does not stage them (use `git add -f`).
// With `{ hooks: false }`, it copies nothing and sets no hooks path.
//
// Git gets no GIT_ variable from the caller (a test that runs inside a git hook would else
// point git at the outer repository). The harness sets only GIT_CONFIG_GLOBAL (the empty file)
// and GIT_CONFIG_NOSYSTEM, because only these make the global and system configs empty: Apple's
// git reads a system file with a credential helper, also when /etc/gitconfig is absent.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const hooksFolder = join(repoRoot, '.githooks');
const fixturePackage = join(repoRoot, 'tools', 'git-hooks', 'fixtures', 'package');
// The modules outside `.githooks/` that a hook imports, as paths in the repository.
const hookModules = ['tools/lib/model-names.mjs', 'tools/lib/changed-files.mjs'];
const excluded = ['/.githooks/', '/node_modules/', '/package.json', '/fixture.mjs', '/.fixture/', ...hookModules.map(path => `/${path}`)];

/**
 * @param {{ hooks?: boolean }} [options]
 */
export function tempRepo({ hooks = true } = {}) {
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'temp-repo-'));
  const dir = join(root, 'work');
  const remote = join(root, 'remote.git');
  const globalConfig = join(root, 'gitconfig');
  writeFileSync(globalConfig, '');

  /** @type {Record<string, string>} */
  const env = {};
  for (const [key, value] of Object.entries(process.env)) if (value !== undefined && !key.startsWith('GIT_')) env[key] = value;
  env.GIT_CONFIG_GLOBAL = globalConfig;
  env.GIT_CONFIG_NOSYSTEM = '1';

  /**
   * Runs a command with the harness environment; it never throws on a non-zero exit.
   * @param {string} command
   * @param {string[]} args
   * @param {{ cwd?: string, env?: Record<string, string | undefined>, input?: string }} [options]
   */
  const run = (command, args, options = {}) => {
    const result = spawnSync(command, args, { cwd: options.cwd ?? dir, env: { ...env, ...options.env }, input: options.input, encoding: 'utf8' });
    if (result.error) throw result.error;
    return { status: result.status, stdout: result.stdout, stderr: result.stderr };
  };
  /** @param {string[]} args */
  const git = (...args) => run('git', args);
  const must = (/** @type {ReturnType<typeof run>} */ result) => {
    if (result.status !== 0) throw new Error(`tempRepo: git failed: ${result.stderr}`);
    return result;
  };

  must(run('git', ['init', '-q', '--bare', '-b', 'main', remote], { cwd: root }));
  must(run('git', ['init', '-q', '-b', 'main', dir], { cwd: root }));
  must(git('config', 'user.name', 'Temp Repo'));
  must(git('config', 'user.email', 'temp-repo@example.invalid'));
  must(git('remote', 'add', 'origin', remote));
  if (hooks) {
    cpSync(hooksFolder, join(dir, '.githooks'), { recursive: true });
    cpSync(fixturePackage, dir, { recursive: true });
    for (const path of hookModules) cpSync(join(repoRoot, path), join(dir, path));
    mkdirSync(join(dir, 'node_modules'));
    writeFileSync(join(dir, '.git', 'info', 'exclude'), excluded.join('\n') + '\n', { flag: 'a' });
    must(git('config', 'core.hooksPath', '.githooks'));
  }

  return {
    root, dir, remote, env, run, git,
    /** @param {string} path relative to the work tree */
    exists: path => existsSync(join(dir, path)),
    /** @param {string} path relative to the work tree */
    read: path => readFileSync(join(dir, path), 'utf8'),
    /** @param {string} path relative to the work tree @param {string} text */
    write: (path, text) => { mkdirSync(dirname(join(dir, path)), { recursive: true }); writeFileSync(join(dir, path), text); },
    /** @param {string} path relative to the work tree */
    remove: path => rmSync(join(dir, path), { recursive: true, force: true }),
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}
