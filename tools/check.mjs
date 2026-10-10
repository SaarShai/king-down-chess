// npm run check:browser [name ...]: builds the app, serves the build and runs the named browser checks
// one at a time in this run (checks-and-hooks/06; after-redesign/01 for the slots and the run folders).
// `npm run check:browser -- --help` prints the names and the settings. The checks are in tools/lib/registry.mjs.
// Exit codes: 0 all passed, 1 a check or the build failed, 2 a usage fault (unknown name, output root inside
// the checkout), 130/143/129 on SIGINT/SIGTERM/SIGHUP.
import { spawn, spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, isInside, outRoot } from './lib/checks.mjs';
import { firstFault as faultLine } from './lib/first-fault.mjs';
import { SLOTS, releaseAll, runLockPath, takeAllSlots, takeLock, takeSlot } from './lib/lock.mjs';
import { checks } from './lib/registry.mjs';
import { changedPaths, treeStatus } from './lib/tree-status.mjs';

const root = realpathSync(join(dirname(fileURLToPath(import.meta.url)), '..'));
const say = line => console.log(line);

function usage() {
  const rows = checks.map(c => `  ${c.name.padEnd(16)} ${String(c.limit).padStart(4)} s  ${c.script}${c.channel ? `  (channel ${c.channel})` : ''}${c.byName ? '  (by name only)' : ''}${c.exclusive ? '  (exclusive)' : ''}`);
  return `Usage: npm run check:browser [name ...]

Builds the app, serves the build with Vite's preview on 127.0.0.1 at a free port, and runs the named
checks one at a time. With no name, it runs all checks that are not "by name only".

Checks (name, time limit, script):
${rows.join('\n')}

Each check gets three settings:
  PLAYABLE_URL      the address of the preview server
  PLAYABLE_OUT      <run folder>/<name>
  PLAYABLE_BROWSER  your PLAYABLE_BROWSER if set, else the check's channel, else chromium when
                    CLAUDE_CODE_REMOTE is "true", else chrome

Output: one new folder for each run under ${outRoot}, printed at the start, with run.json and one
log per check (<run folder>/<name>.log). The system removes old folders after three days.
One run at a time in a worktree: a second run there waits for the run lock in the worktree's git directory.
${SLOTS} checks at a time on this machine (SLOTS in tools/lib/lock.mjs): a run takes a slot in git's common
directory for its build and for each check, and prints one line when it waits. An exclusive check takes
every slot, and a run that waits for it goes before new normal checks.
Do not edit or commit in the worktree during a run: a check that finds the checkout changed fails.`;
}

// 1. Names: an unknown name stops the run before the build.
const args = process.argv.slice(2);
if (args.some(a => a === '-h' || a === '--help')) { say(usage()); process.exit(0); }
const unknown = args.filter(a => !checks.some(c => c.name === a));
if (unknown.length) {
  console.error(`check: unknown name: ${unknown.join(', ')}. Known names: ${checks.map(c => c.name).join(', ')}\n\n${usage()}`);
  process.exit(2);
}
const selected = args.length ? [...new Set(args)].map(a => checks.find(c => c.name === a)) : checks.filter(c => !c.byName);

// 2. The output root: never inside the checkout.
if (isInside(root, outRoot)) {
  console.error(`check: the output root ${outRoot} is inside the checkout ${root}; set TMPDIR to a folder outside it`);
  process.exit(2);
}

// 3. The locks, and a clean stop on every exit: the child, the record of a check in progress, every lease.
let current = null; // the running child process
let active = null; // the record entry of the check in progress
const killGroup = (child, signal) => { try { process.kill(-child.pid, signal); } catch {} };
process.on('exit', () => {
  if (current) killGroup(current, 'SIGKILL');
  if (active && !active.end) {
    Object.assign(active, { end: new Date().toISOString(), ok: false, fault: interrupted ? `stopped by ${interrupted.signal}` : 'the runner exited' });
    writeRecord();
  }
  releaseAll();
});
// A signal stops the running child; the run then ends with the signal's exit code and no report line.
let interrupted = null;
const exitIfInterrupted = () => { if (interrupted) process.exit(interrupted.code); };
for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
  process.on(signal, () => {
    if (interrupted) return;
    interrupted = { signal, code };
    say(`check: ${signal}: stopping`);
    if (current) stop(current); else process.exit(code);
  });
}
await takeLock(runLockPath(root), { what: 'this worktree\'s run lock' });

// 4. The run folder and its record.
mkdirSync(outRoot, { recursive: true });
const runDir = mkdtempSync(join(outRoot, `${basename(root)}-`));
say(`check: output folder ${runDir}`);
const gitEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
const head = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, env: gitEnv, encoding: 'utf8' }).stdout?.trim() ?? '';
const record = { pid: process.pid, worktree: root, head, node: process.version, slots: SLOTS, started: new Date().toISOString(), checks: selected.map(c => c.name), results: [] };
function writeRecord() { writeFileSync(join(runDir, 'run.json'), `${JSON.stringify(record, null, 2)}\n`); }
writeRecord();

/** Stops a child and all its processes: SIGTERM, then SIGKILL after 3 s. */
function stop(child) {
  return new Promise(resolve => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve();
    const timer = setTimeout(() => killGroup(child, 'SIGKILL'), 3000);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
    killGroup(child, 'SIGTERM');
  });
}

/** Runs a command in its own process group, with a log file and a time limit (seconds). */
function run(command, commandArgs, { log, limit, extraEnv = {} }) {
  return new Promise(resolve => {
    const fd = openSync(log, 'w');
    const start = Date.now();
    const child = spawn(command, commandArgs, { cwd: root, env: { ...process.env, ...extraEnv }, stdio: ['ignore', fd, fd], detached: true });
    current = child;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; stop(child); }, limit * 1000);
    const done = (code, error) => {
      clearTimeout(timer);
      closeSync(fd);
      current = null;
      resolve({ code, timedOut, error, limit, seconds: (Date.now() - start) / 1000 });
    };
    child.once('error', error => done(null, error));
    child.once('exit', code => done(code, null));
  });
}

/** Takes a machine slot for one step (the build, or a check: all slots for an exclusive one), runs it, frees the slot. */
async function inSlot(exclusive, step) {
  const release = exclusive ? await takeAllSlots(root, SLOTS) : await takeSlot(root, SLOTS);
  exitIfInterrupted();
  try { return await step(); } finally { release(); }
}

/** The first fault line of a log (tools/lib/first-fault.mjs), cut to 200 characters. */
function firstFault(log, result) {
  if (result.timedOut) return `timed out at the ${result.limit} s limit`;
  if (result.error) return result.error.message;
  const line = faultLine(existsSync(log) ? readFileSync(log, 'utf8') : '') ?? `exit code ${result.code}`;
  return line.length > 200 ? `${line.slice(0, 197)}...` : line;
}

const report = (ok, name, seconds, fault, log) =>
  say(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(16)} ${seconds.toFixed(1).padStart(6)} s  ${fault ? `${fault}  ` : ''}${log}`);

// 5. Build in a slot, then serve the build on 127.0.0.1 at a free port.
const buildLog = join(runDir, 'build.log');
const build = await inSlot(false, () => run('npm', ['run', '--silent', 'build'], { log: buildLog, limit: 600 }));
exitIfInterrupted();
if (build.code !== 0) {
  report(false, 'build', build.seconds, firstFault(buildLog, build), buildLog);
  process.exit(1);
}
const { preview } = await import('vite');
const server = await preview({ root, logLevel: 'silent', preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false } });
const url = server.resolvedUrls.local[0];
say(`check: serving the build at ${url}`);

// 6. The checks, one at a time, each in a slot; each one must leave the checkout as it found it.
let failed = 0;
for (const c of selected) {
  const log = join(runDir, `${c.name}.log`);
  const entry = { name: c.name, start: null, end: null, ok: null, seconds: null, fault: null, log };
  record.results.push(entry);
  const { result, changed } = await inSlot(Boolean(c.exclusive), async () => {
    entry.start = new Date().toISOString();
    active = entry;
    writeRecord();
    const before = treeStatus(root);
    const result = await run(process.execPath, [c.script, ...(c.args ?? [])], {
      log, limit: c.limit,
      extraEnv: { PLAYABLE_URL: url, PLAYABLE_OUT: join(runDir, c.name), PLAYABLE_BROWSER: process.env.PLAYABLE_BROWSER || c.channel || env('PLAYABLE_BROWSER') },
    });
    exitIfInterrupted();
    return { result, changed: changedPaths(before, treeStatus(root)) };
  });
  const ok = result.code === 0 && !result.timedOut && !changed.length;
  const faults = [];
  if (result.code !== 0 || result.timedOut) faults.push(firstFault(log, result));
  if (changed.length) faults.push(`changed in the checkout: ${changed.join(', ')}`);
  Object.assign(entry, { end: new Date().toISOString(), ok, seconds: result.seconds, fault: faults.join('; ') || null });
  active = null;
  writeRecord();
  report(ok, c.name, result.seconds, faults.join('; '), log);
  if (!ok) failed++;
}
await server.close();
say(failed ? `check: ${failed} of ${selected.length} failed` : `check: all ${selected.length} passed`);
process.exit(failed ? 1 : 0);
