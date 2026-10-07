// npm run check:browser [name ...]: builds the app, serves the build and runs the named browser checks
// one at a time (checks-and-hooks/06). `npm run check:browser -- --help` prints the names and the settings.
// The checks are in tools/lib/registry.mjs. Exit codes: 0 all passed, 1 a check or the build failed,
// 2 a usage fault (unknown name, output root inside the checkout), 130 interrupted.
import { spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, outRoot } from './lib/checks.mjs';
import { lockPath, takeLock } from './lib/lock.mjs';
import { checks } from './lib/registry.mjs';
import { changedPaths, treeStatus } from './lib/tree-status.mjs';

const root = realpathSync(join(dirname(fileURLToPath(import.meta.url)), '..'));
const say = line => console.log(line);

function usage() {
  const rows = checks.map(c => `  ${c.name.padEnd(16)} ${String(c.limit).padStart(4)} s  ${c.script}${c.channel ? `  (channel ${c.channel})` : ''}${c.byName ? '  (by name only)' : ''}`);
  return `Usage: npm run check:browser [name ...]

Builds the app, serves the build with Vite's preview on 127.0.0.1 at a free port, and runs the named
checks one at a time. With no name, it runs all checks that are not "by name only".

Checks (name, time limit, script):
${rows.join('\n')}

Each check gets three settings:
  PLAYABLE_URL      the address of the preview server
  PLAYABLE_OUT      <output root>/<name>
  PLAYABLE_BROWSER  your PLAYABLE_BROWSER if set, else the check's channel, else chromium when
                    CLAUDE_CODE_REMOTE is "true", else chrome

Output root: ${outRoot} (emptied at the start; one log per check: <output root>/<name>.log).
One run at a time in all worktrees: a second run waits for the lock in git's common directory.`;
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
say(`check: output root ${outRoot}`);
const real = path => { try { return realpathSync(path); } catch { return join(real(dirname(path)), basename(path)); } };
const fromRoot = relative(root, real(outRoot));
if (!fromRoot || (!fromRoot.startsWith('..') && !isAbsolute(fromRoot))) {
  console.error(`check: the output root ${outRoot} is inside the checkout ${root}; set TMPDIR to a folder outside it`);
  process.exit(2);
}

// 3. The lock, and a clean stop on every exit.
let current = null; // the running child process
let release = () => {};
const killGroup = (child, signal) => { try { process.kill(-child.pid, signal); } catch {} };
process.on('exit', () => {
  if (current) killGroup(current, 'SIGKILL');
  release();
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
release = await takeLock(lockPath(root));
rmSync(outRoot, { recursive: true, force: true });
mkdirSync(outRoot, { recursive: true });

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

/** The first fault line of a log: a line with FAIL, Error, failed, Timeout or "timed out", else its last line. */
function firstFault(log, result) {
  if (result.timedOut) return `timed out at the ${result.limit} s limit`;
  if (result.error) return result.error.message;
  const lines = (existsSync(log) ? readFileSync(log, 'utf8') : '').split('\n').map(l => l.trim()).filter(Boolean);
  const line = lines.find(l => /\bFAIL\b|Error\b|\bfailed\b|\bTimeout\b|\btimed out\b/.test(l)) ?? lines.at(-1) ?? `exit code ${result.code}`;
  return line.length > 200 ? `${line.slice(0, 197)}...` : line;
}

const report = (ok, name, seconds, fault, log) =>
  say(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(16)} ${seconds.toFixed(1).padStart(6)} s  ${fault ? `${fault}  ` : ''}${log}`);

// 4. Build, then serve the build on 127.0.0.1 at a free port.
const buildLog = join(outRoot, 'build.log');
const build = await run('npm', ['run', '--silent', 'build'], { log: buildLog, limit: 600 });
exitIfInterrupted();
if (build.code !== 0) {
  report(false, 'build', build.seconds, firstFault(buildLog, build), buildLog);
  process.exit(1);
}
const { preview } = await import('vite');
const server = await preview({ root, logLevel: 'silent', preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false } });
const url = server.resolvedUrls.local[0];
say(`check: serving the build at ${url}`);

// 5. The checks, one at a time; each one must leave the checkout as it found it.
let failed = 0;
for (const c of selected) {
  const log = join(outRoot, `${c.name}.log`);
  const before = treeStatus(root);
  const result = await run(process.execPath, [c.script, ...(c.args ?? [])], {
    log, limit: c.limit,
    extraEnv: { PLAYABLE_URL: url, PLAYABLE_OUT: join(outRoot, c.name), PLAYABLE_BROWSER: process.env.PLAYABLE_BROWSER || c.channel || env('PLAYABLE_BROWSER') },
  });
  exitIfInterrupted();
  const changed = changedPaths(before, treeStatus(root));
  const ok = result.code === 0 && !result.timedOut && !changed.length;
  const faults = [];
  if (result.code !== 0 || result.timedOut) faults.push(firstFault(log, result));
  if (changed.length) faults.push(`changed in the checkout: ${changed.join(', ')}`);
  report(ok, c.name, result.seconds, faults.join('; '), log);
  if (!ok) failed++;
}
await server.close();
say(failed ? `check: ${failed} of ${selected.length} failed` : `check: all ${selected.length} passed`);
process.exit(failed ? 1 : 0);
