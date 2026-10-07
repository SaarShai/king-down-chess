// One lock for the browser-check runner across all worktrees (checks-and-hooks/06).
//   lockPath(dir)             <git common directory>/check-browser.lock; all worktrees of a repository share it.
//   takeLock(path, options)   Makes the lock file with exclusive create and resolves to release().
//                             When another live process holds the lock, it calls onWait(line) once and tries
//                             again every pollMs ms. It takes the lock of a process that no longer exists.
//   release()                 Removes the lock file only when it still holds this process's id. It is
//                             synchronous, so that a process 'exit' handler can call it.
import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** @param {string} dir a folder in a work tree */
export function lockPath(dir) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  const r = spawnSync('git', ['rev-parse', '--git-common-dir'], { cwd: dir, env, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`lockPath: ${dir} is not in a git work tree: ${r.stderr}`);
  return join(realpathSync(resolve(dir, r.stdout.trim())), 'check-browser.lock');
}

/** The holder that the lock file names, or null when the file is gone or cannot be read. */
function holder(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch (e) { return e.code === 'ENOENT' ? null : { pid: 0 }; }
}

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

/**
 * @param {string} path
 * @param {{ onWait?: (line: string) => void, pollMs?: number }} [options]
 * @returns {Promise<() => void>}
 */
export async function takeLock(path, { onWait = line => console.log(line), pollMs = 1000 } = {}) {
  const mine = JSON.stringify({ pid: process.pid, cwd: process.cwd(), since: new Date().toISOString() });
  let waited = false;
  for (;;) {
    try {
      writeFileSync(path, mine, { flag: 'wx' });
      return () => { if (holder(path)?.pid === process.pid) unlinkSync(path); };
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
    }
    const other = holder(path);
    if (other && Number.isInteger(other.pid) && other.pid > 0 && !alive(other.pid)) {
      // A dead process's lock: remove it, but only when it still names that process.
      if (holder(path)?.pid === other.pid) try { unlinkSync(path); } catch {}
      continue;
    }
    if (other && !waited) {
      waited = true;
      onWait(`check: another run holds the lock (pid ${other.pid}, ${other.cwd ?? 'unknown folder'}); waiting for it to end`);
    }
    await new Promise(r => setTimeout(r, pollMs));
  }
}
