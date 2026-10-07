// changedFiles(): the paths that differ between two commits, for the pre-push rule on main.
// A rename gives both paths (the old path and the new path), so that a move out of a protected
// folder counts as a change of that folder. Git quotes no path, because the list is NUL-separated.
import { spawnSync } from 'node:child_process';

/**
 * @param {string} from the first commit (the remote head)
 * @param {string} to the second commit (the pushed commit)
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv }} [options]
 * @returns {string[]} the paths, relative to the top folder of the work tree
 */
export function changedFiles(from, to, { cwd, env } = {}) {
  const result = spawnSync('git', ['diff', '--name-only', '--no-renames', '-z', from, to, '--'], { cwd, env, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`changedFiles: git diff failed: ${result.stderr.trim()}`);
  return result.stdout.split('\0').filter(Boolean);
}
