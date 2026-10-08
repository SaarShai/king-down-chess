// Working-tree snapshots for the browser-check runner's changed-file guard (checks-and-hooks/06).
//   treeStatus(dir)              Map of each path in `git status` (untracked files included, ignored files not)
//                                to its status code and a hash of its content.
//   changedPaths(before, after)  The sorted paths whose entry is not the same in the two snapshots.
// A file that was dirty before and did not change is not a difference. A dirty file that goes back
// to its committed text is a difference, because it leaves the status.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, lstatSync, openSync, readlinkSync, readSync } from 'node:fs';
import { join } from 'node:path';

/** The sha-256 of a file, read in parts, so that a big file needs little memory. */
function fileHash(path) {
  const hash = createHash('sha256');
  const buffer = Buffer.alloc(1 << 20);
  const fd = openSync(path, 'r');
  try {
    for (let n; (n = readSync(fd, buffer, 0, buffer.length, null)) > 0;) hash.update(buffer.subarray(0, n));
  } finally {
    closeSync(fd);
  }
  return hash.digest('hex');
}

function contentHash(path) {
  let stat;
  try { stat = lstatSync(path); } catch { return 'missing'; }
  if (stat.isSymbolicLink()) return `link:${readlinkSync(path)}`;
  if (stat.isFile()) return fileHash(path);
  return 'folder';
}

/** @param {string} dir a folder in the work tree; paths are relative to the top of the work tree */
export function treeStatus(dir) {
  // No GIT_ variable from the caller: inside a git hook, they would point git at another index.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  const run = args => {
    const r = spawnSync('git', args, { cwd: dir, env, encoding: 'utf8', maxBuffer: 1 << 28 });
    if (r.status !== 0) throw new Error(`treeStatus: git ${args.join(' ')} failed: ${r.stderr}`);
    return r.stdout;
  };
  const top = run(['rev-parse', '--show-toplevel']).trim();
  const fields = run(['status', '--porcelain=v1', '-z', '--untracked-files=all']).split('\0');
  const status = new Map();
  for (let i = 0; i < fields.length; i++) {
    if (!fields[i]) continue;
    const code = fields[i].slice(0, 2);
    const paths = [fields[i].slice(3)];
    if (code[0] === 'R' || code[0] === 'C') paths.push(fields[++i]); // the source path of a rename or a copy
    for (const path of paths) status.set(path, `${code} ${contentHash(join(top, path))}`);
  }
  return status;
}

/** @param {Map<string, string>} before @param {Map<string, string>} after */
export function changedPaths(before, after) {
  return [...new Set([...before.keys(), ...after.keys()])].filter(p => before.get(p) !== after.get(p)).sort();
}
