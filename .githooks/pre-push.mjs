// pre-push: runs `npm test`, then the repo gate in `push` mode. Any failure refuses the push.
// Git starts the hook in the top folder of the work tree, with the arguments <remote> <url>, and
// writes one line for each ref on stdin: <local ref> <local object name> <remote ref> <remote object name>.
// The test starts without git's GIT_ variables, so that a git command in it uses its own repository.
// The gate keeps them, and gets git's stdin lines.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { changedFiles } from '../tools/lib/changed-files.mjs';

const [remote = '', url = ''] = process.argv.slice(2);
const stdin = readFileSync(0, 'utf8');

/** Runs `npm run --silent <script> [-- args]` and gives its exit code. Output goes to the terminal. */
const npm = (script, args, env, input) => {
  const result = spawnSync('npm', ['run', '--silent', script, ...(args.length ? ['--', ...args] : [])],
    { stdio: [input === undefined ? 'ignore' : 'pipe', 'inherit', 'inherit'], input, env });
  if (result.error) console.error(`pre-push: cannot start npm: ${result.error.message}`);
  return result.status ?? 1;
};
/** Runs git and gives its trimmed stdout, or null when git exits non-zero. */
const git = (...args) => {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
};
const refuse = message => { console.error(`pre-push: ${message}`); process.exit(1); };
const scripts = () => { try { return JSON.parse(readFileSync('package.json', 'utf8')).scripts ?? {}; } catch { return {}; } };

const zero = /^0+$/;
// A deletion sends no commit, so it needs no test.
const updates = stdin.split('\n').filter(Boolean).map(line => {
  const [localRef, localSha, remoteRef, remoteSha] = line.split(' ');
  return { localRef, localSha, remoteRef, remoteSha };
}).filter(update => !zero.test(update.localSha));
if (updates.length === 0) process.exit(0);

// The test runs on the work tree, so the result describes the pushed commit only when that
// commit is HEAD and no tracked file differs from HEAD.
const head = git('rev-parse', 'HEAD');
for (const { localRef, localSha } of updates) {
  if (git('rev-parse', '--verify', '-q', `${localSha}^{commit}`) === head) continue;
  const branch = localRef.startsWith('refs/heads/') ? localRef.slice('refs/heads/'.length) : null;
  refuse(`${localRef} is not HEAD, so npm test cannot run on the commit that goes out.
  Check it out and push it alone:
    ${branch ? `git switch ${branch}` : `git switch --detach ${localRef}`}
    git push ${remote} ${branch ?? localRef}`);
}
const dirty = git('diff', '--name-only', 'HEAD', '--');
if (dirty) {
  refuse(`these tracked files differ from HEAD, so npm test would not run on the commit that goes out:
${dirty.split('\n').map(line => `    ${line}`).join('\n')}
  Commit or stash them, then push again.`);
}

// Decision 10: a direct push to main may change docs and trackers, but no file under a protected
// path. Such a change goes through a branch and a pull request.
const protectedPaths = ['src/', 'public/', 'index.html', 'package.json', 'package-lock.json', 'supabase/',
  '.githooks/', '.claude/', 'tools/'];
const isProtected = path => protectedPaths.some(p => p.endsWith('/') ? path.startsWith(p) : path === p);
for (const { localSha, remoteRef, remoteSha } of updates) {
  if (remoteRef !== 'refs/heads/main') continue;
  if (zero.test(remoteSha) || git('cat-file', '-e', `${remoteSha}^{commit}`) === null) {
    refuse(`fetch first: the head of main on ${remote} is not known here, so this hook cannot list the files
  that the push changes. Fetch, merge or rebase, then push again:
    git fetch ${remote}
  If ${remote} has no main yet, push its first commit with --no-verify.`);
  }
  const hits = changedFiles(remoteSha, localSha).filter(isProtected);
  if (hits.length) {
    refuse(`a direct push to main may not change these protected files (decision 10):
${hits.map(path => `    ${path}`).join('\n')}
  Push a branch and open a pull request into main:
    git switch -c <branch>
    git push -u ${remote} <branch>`);
  }
}

const noGit = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
if (npm('test', [], noGit) !== 0) refuse('npm test failed. Fix the faults above, commit, then push again.');
if (!scripts().gate) refuse('the repo gate is missing: package.json has no `gate` script. Merge the branch that adds it, then push again.');
const gate = npm('gate', ['push', remote, url], process.env, stdin);
if (gate !== 0) refuse(`the repo gate refused the push (exit ${gate}). Its reason is above.`);
