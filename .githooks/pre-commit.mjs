// pre-commit: runs the type check, then the repo gate in `staged` mode. Any failure refuses the commit.
// Git starts the hook in the top folder of the work tree.
// The type check starts without git's GIT_ variables, so that a git command in it uses its own
// repository. The gate keeps them, because it reads the staged change (GIT_INDEX_FILE).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

/** Runs `npm run --silent <script> [-- args]` and gives its exit code. Output goes to the terminal. */
const npm = (script, args, env) => {
  const result = spawnSync('npm', ['run', '--silent', script, ...(args.length ? ['--', ...args] : [])], { stdio: 'inherit', env });
  if (result.error) console.error(`pre-commit: cannot start npm: ${result.error.message}`);
  return result.status ?? 1;
};
const refuse = message => { console.error(`pre-commit: ${message}`); process.exit(1); };
const scripts = () => { try { return JSON.parse(readFileSync('package.json', 'utf8')).scripts ?? {}; } catch { return {}; } };

if (!existsSync('node_modules')) {
  refuse(`this worktree has no node_modules, so the type check cannot run.
  Link or install the packages with the worktree script, then commit again:
    tools/wt.sh add "${process.cwd()}"`);
}
const noGit = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
if (npm('typecheck', [], noGit) !== 0) refuse('the type check failed. Fix the faults above, then commit again.');
if (!scripts().gate) refuse('the repo gate is missing: package.json has no `gate` script. Merge the branch that adds it, then commit again.');
const gate = npm('gate', ['staged'], process.env);
if (gate !== 0) refuse(`the repo gate refused the commit (exit ${gate}). Its reason is above.`);
