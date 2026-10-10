// Locks for the browser-check runner (checks-and-hooks/06; after-redesign/01).
// Every lock is one file, made with exclusive create (`wx`), that holds { pid, cwd, since, token }.
//   SLOTS                     The machine slots: how many checks (or builds) run at once on this machine, in every
//                             run. One shared constant, so that an exclusive check takes the same slots that the
//                             normal checks take. It changes by a commit after the measurement in the spec, §3.4.
//   runLockPath(dir)          <git directory of the worktree>/check-run.lock: one run at a time in a worktree,
//                             because its dist/ is shared. The main checkout's git directory is the common
//                             directory, so this name differs from the exclusive lock below.
//   exclusivePath(dir)        <git common directory>/check-browser.lock, shared by all worktrees. An exclusive
//                             check holds it with every slot; while it has a live holder, no normal taker
//                             starts, so an exclusive check never starves. Old runners take only this file.
//   slotPaths(dir, n)         <git common directory>/check-slot-<i>.lock for i in 0..n-1.
//   takeLock(path, options)   Takes one file and resolves to release(). When a live process holds it, it calls
//                             onWait(line) once and tries again every pollMs ms. A holder whose process is gone,
//                             or a file that cannot be read for staleMs, is stale and is taken over (takeOver).
//   takeSlot(dir, n, options) Takes one free slot (while no exclusive holder is live) and resolves to release().
//                             Never call it while this process holds a slot: a wait with a slot can deadlock.
//   takeAllSlots(dir, n, options)
//                             Takes the exclusive lock, then every slot in order; release() frees them all. It
//                             waits for a slot while it holds the others. That is safe: normal holders never
//                             wait, and new normal takers wait on the exclusive lock, not on a slot.
//   takeOver(path, seen)      Removes a stale lock file whose text is `seen`. The rename is atomic, so only one
//                             taker moves the file; a moved file with another text is a live lease, which goes
//                             back to its path. Exported for its test.
//   release()                 Removes the file only while it still holds this lease's token. Synchronous, so
//                             that a process 'exit' handler can call it.
//   releaseAll()              Releases every lease that this process still holds, for an exit handler.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { linkSync, readFileSync, realpathSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const SLOTS = 2;

function gitDir(dir, flag) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  const r = spawnSync('git', ['rev-parse', flag], { cwd: dir, env, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`lock: ${dir} is not in a git work tree: ${r.stderr}`);
  return realpathSync(resolve(dir, r.stdout.trim()));
}

/** @param {string} dir a folder in a work tree */
export const runLockPath = dir => join(gitDir(dir, '--git-dir'), 'check-run.lock');
/** @param {string} dir a folder in a work tree */
export const exclusivePath = dir => join(gitDir(dir, '--git-common-dir'), 'check-browser.lock');
/** @param {string} dir a folder in a work tree @param {number} n */
export const slotPaths = (dir, n) => { const common = gitDir(dir, '--git-common-dir'); return Array.from({ length: n }, (_, i) => join(common, `check-slot-${i}.lock`)); };

/** The lock file as inspected: its text and the holder it names ({ pid: 0 } when the text is not a lease); null when the file is gone. */
function inspect(path) {
  let text;
  try { text = readFileSync(path, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; text = null; }
  let data = { pid: 0 };
  try { data = { pid: 0, ...JSON.parse(text) }; } catch {}
  return { text, data };
}

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

/** A holder that no process serves: its process is gone, or its file cannot be read for staleMs. */
function stale(path, seen, staleMs) {
  if (Number.isInteger(seen.data.pid) && seen.data.pid > 0) return !alive(seen.data.pid);
  try { return Date.now() - statSync(path).mtimeMs > staleMs; } catch { return false; }
}

/** @param {string} path @param {string | null} seen the text of the stale file, as inspected */
export function takeOver(path, seen) {
  const gone = `${path}.${process.pid}.${randomBytes(3).toString('hex')}.stale`;
  try { renameSync(path, gone); } catch { return; } // another taker moved it first, or it is gone
  let text = null;
  try { text = readFileSync(gone, 'utf8'); } catch {}
  if (text !== seen) {
    // A live lease replaced the stale file before the rename: put it back. link() refuses when a newer lease took the path.
    try { linkSync(gone, path); } catch { console.error(`lock: ${path}: a live lease was lost in a takeover race`); }
  }
  try { unlinkSync(gone); } catch {}
}

/** Every lease this process holds: path to token. */
const held = new Map();

/** The lease file is written; returns its release(). */
function lease(path, token) {
  held.set(path, token);
  return () => {
    if (held.get(path) === token) held.delete(path);
    if (inspect(path)?.data.token === token) try { unlinkSync(path); } catch {}
  };
}

export function releaseAll() {
  for (const [path, token] of [...held].reverse()) lease(path, token)();
}

const newLease = token => JSON.stringify({ pid: process.pid, cwd: process.cwd(), since: new Date().toISOString(), token });

/** Writes the lease file; false when a file is there. */
function create(path, text) {
  try { writeFileSync(path, text, { flag: 'wx' }); return true; } catch (e) { if (e.code !== 'EEXIST') throw e; return false; }
}

/**
 * @param {string} path
 * @param {{ onWait?: (line: string) => void, pollMs?: number, staleMs?: number, what?: string }} [options]
 * @returns {Promise<() => void>}
 */
export async function takeLock(path, { onWait = line => console.log(line), pollMs = 1000, staleMs = 10000, what = 'the lock' } = {}) {
  const token = randomBytes(8).toString('hex');
  const mine = newLease(token);
  let waited = false;
  for (;;) {
    if (create(path, mine)) return lease(path, token);
    const seen = inspect(path);
    if (seen && stale(path, seen, staleMs)) { takeOver(path, seen.text); continue; }
    if (seen && !waited) {
      waited = true;
      onWait(`check: another run holds ${what} (pid ${seen.data.pid}, ${seen.data.cwd ?? 'unknown folder'}); waiting for it to end`);
    }
    await new Promise(r => setTimeout(r, pollMs));
  }
}

/** The holder of the exclusive lock while a live process has it (a pending or running exclusive check), else false. */
function exclusiveHeld(path, staleMs) {
  const seen = inspect(path);
  if (!seen) return false;
  if (stale(path, seen, staleMs)) { takeOver(path, seen.text); return false; }
  return seen.data;
}

/**
 * One free slot, when no exclusive check is pending or running. Never call it while this process holds a slot.
 * @param {string} dir @param {number} n
 * @param {{ onWait?: (line: string) => void, pollMs?: number, staleMs?: number }} [options]
 * @returns {Promise<() => void>}
 */
export async function takeSlot(dir, n, { onWait = line => console.log(line), pollMs = 1000, staleMs = 10000 } = {}) {
  const exclusive = exclusivePath(dir), slots = slotPaths(dir, n);
  const token = randomBytes(8).toString('hex');
  const mine = newLease(token);
  let waited = false;
  for (;;) {
    const pending = exclusiveHeld(exclusive, staleMs);
    if (!pending) {
      for (const path of slots) {
        if (create(path, mine)) return lease(path, token);
        const seen = inspect(path);
        if (seen && stale(path, seen, staleMs)) takeOver(path, seen.text);
      }
    }
    if (!waited) {
      waited = true;
      const holders = pending ? [pending] : slots.map(inspect).filter(Boolean).map(s => s.data);
      onWait(`check: ${pending ? 'an exclusive check waits or runs' : `all ${n} slots are taken`} (${holders.map(h => `pid ${h.pid}, ${h.cwd ?? 'unknown folder'}`).join('; ')}); waiting for a slot`);
    }
    await new Promise(r => setTimeout(r, pollMs));
  }
}

/**
 * The exclusive lock, then every slot in order. Normal takers wait from the moment the exclusive lock is held.
 * @param {string} dir @param {number} n
 * @param {{ onWait?: (line: string) => void, pollMs?: number, staleMs?: number }} [options]
 * @returns {Promise<() => void>}
 */
export async function takeAllSlots(dir, n, options = {}) {
  const releases = [await takeLock(exclusivePath(dir), { ...options, what: 'the exclusive lock' })];
  for (const path of slotPaths(dir, n)) releases.push(await takeLock(path, { ...options, what: 'a slot' }));
  return () => { for (const release of releases.reverse()) release(); };
}
