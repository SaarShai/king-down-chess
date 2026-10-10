// Locks for the browser-check runner (checks-and-hooks/06; after-redesign/01).
// Every lock is one file, made with exclusive create (`wx`), that holds { pid, cwd, since, token }.
//   runLockPath(dir)          <git directory of the worktree>/check-run.lock: one run at a time in a worktree,
//                             because its dist/ is shared. The main checkout's git directory is the common
//                             directory, so this name differs from the exclusive lock below.
//   exclusivePath(dir)        <git common directory>/check-browser.lock, shared by all worktrees. An exclusive
//                             check holds it with every slot; while it has a live holder, no normal taker
//                             starts, so an exclusive check never starves. Old runners take only this file.
//   slotPaths(dir, n)         <git common directory>/check-slot-<i>.lock for i in 0..n-1: the machine slots.
//   takeLock(path, options)   Takes one file and resolves to release(). When a live process holds it, it calls
//                             onWait(line) once and tries again every pollMs ms. A holder whose process is
//                             gone, or a file that cannot be read for staleMs, is taken over through an
//                             atomic rename, so two takers never both remove a new owner's file.
//   takeSlot(dir, n, options) Takes one free slot (while no exclusive holder is live) and resolves to release().
//   takeAllSlots(dir, n, options)
//                             Takes the exclusive lock, then every slot in order; release() frees them all.
//   release()                 Removes the file only while it still holds this lease's token. Synchronous, so
//                             that a process 'exit' handler can call it.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync, realpathSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

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

/** The holder that the lock file names; null when the file is gone; { pid: 0 } when it cannot be read. */
function holder(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch (e) { return e.code === 'ENOENT' ? null : { pid: 0 }; }
}

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

/** A holder that no process serves: its process is gone, or its file cannot be read for staleMs. */
function stale(path, other, staleMs) {
  if (Number.isInteger(other.pid) && other.pid > 0) return !alive(other.pid);
  try { return Date.now() - statSync(path).mtimeMs > staleMs; } catch { return false; }
}

/** Removes a stale lock: the rename is atomic, so only one taker removes it. */
function takeOver(path) {
  const gone = `${path}.${process.pid}.${randomBytes(3).toString('hex')}.stale`;
  try { renameSync(path, gone); unlinkSync(gone); } catch {}
}

/**
 * @param {string} path
 * @param {{ onWait?: (line: string) => void, pollMs?: number, staleMs?: number, what?: string }} [options]
 * @returns {Promise<() => void>}
 */
export async function takeLock(path, { onWait = line => console.log(line), pollMs = 1000, staleMs = 10000, what = 'the lock' } = {}) {
  const token = randomBytes(8).toString('hex');
  const mine = JSON.stringify({ pid: process.pid, cwd: process.cwd(), since: new Date().toISOString(), token });
  let waited = false;
  for (;;) {
    try {
      writeFileSync(path, mine, { flag: 'wx' });
      return () => { if (holder(path)?.token === token) try { unlinkSync(path); } catch {} };
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
    }
    const other = holder(path);
    if (other && stale(path, other, staleMs)) { takeOver(path); continue; }
    if (other && !waited) {
      waited = true;
      onWait(`check: another run holds ${what} (pid ${other.pid}, ${other.cwd ?? 'unknown folder'}); waiting for it to end`);
    }
    await new Promise(r => setTimeout(r, pollMs));
  }
}

/** True while a live process holds the exclusive lock (a pending or running exclusive check). */
function exclusiveHeld(path, staleMs) {
  const other = holder(path);
  if (!other) return false;
  if (stale(path, other, staleMs)) { takeOver(path); return false; }
  return other;
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
  const mine = JSON.stringify({ pid: process.pid, cwd: process.cwd(), since: new Date().toISOString(), token });
  let waited = false;
  for (;;) {
    const pending = exclusiveHeld(exclusive, staleMs);
    if (!pending) {
      for (const path of slots) {
        try {
          writeFileSync(path, mine, { flag: 'wx' });
          return () => { if (holder(path)?.token === token) try { unlinkSync(path); } catch {} };
        } catch (e) {
          if (e.code !== 'EEXIST') throw e;
          const other = holder(path);
          if (other && stale(path, other, staleMs)) takeOver(path);
        }
      }
    }
    if (!waited) {
      waited = true;
      const holders = pending ? [pending] : slots.map(holder).filter(Boolean);
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
