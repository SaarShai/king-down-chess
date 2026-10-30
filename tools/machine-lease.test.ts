// Real runners use two independent repositories and one test user's home.
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { chmodSync, closeSync, existsSync, fstatSync, openSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { tempRepo } from './lib/temp-repo.mjs';

vi.setConfig({ testTimeout: 60_000 });
const repos: ReturnType<typeof tempRepo>[] = [];
const children: ChildProcess[] = [];
afterEach(async () => {
  for (const child of children.splice(0)) {
    if (child.exitCode === null && child.signalCode === null) {
      const ended = new Promise(done => child.once('exit', done));
      child.kill('SIGTERM');
      const force = setTimeout(() => { try { process.kill(-child.pid!, 'SIGKILL'); } catch { /* ended */ } }, 3000);
      await ended;
      clearTimeout(force);
    }
    try { process.kill(-child.pid!, 'SIGKILL'); } catch { /* ended */ }
  }
  while (repos.length) repos.pop()!.cleanup();
});
const tick = () => new Promise(done => setTimeout(done, 20));

function setup() {
  const copies = [tempRepo({ hooks: false }), tempRepo({ hooks: false })];
  repos.push(...copies);
  const home = join(copies[0].root, 'home');
  for (const repo of copies) {
    repo.git('remote', 'remove', 'origin');
    repo.write('node_modules/.gitignore', '*\n');
    symlinkSync(new URL('../node_modules/playwright', import.meta.url), join(repo.dir, 'node_modules/playwright'), 'dir');
    const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts;
    const pick = Object.fromEntries(['test', 'test:unlocked', 'typecheck', 'check:browser'].map(name => [name, scripts[name]]));
    repo.write('package.json', JSON.stringify({ name: 'lease-test', private: true, type: 'module', scripts: pick }));
    if (existsSync(new URL('test-unlocked.sh', import.meta.url))) repo.write('tools/test-unlocked.sh', readFileSync(new URL('test-unlocked.sh', import.meta.url), 'utf8'));
    for (const file of ['test-lock.sh', 'deploy.sh', 'check.mjs', 'lib/lock.mjs', 'lib/checks.mjs', 'lib/first-fault.mjs', 'lib/tree-status.mjs', 'lib/temp-repo.mjs']) {
      repo.write(`tools/${file}`, readFileSync(new URL(file, import.meta.url), 'utf8'));
    }
    repo.write('tools/lib/registry.mjs', `export const checks = [{ name: 'lease', script: 'tools/web-game-check.mjs', limit: 10 }];`);
    repo.write('tools/web-game-check.mjs', `import { existsSync, writeFileSync } from 'node:fs';
      writeFileSync(process.env.LEASE_STARTED, JSON.stringify({ pid: process.pid, parent: process.ppid }));
      while (process.env.LEASE_RELEASE && !existsSync(process.env.LEASE_RELEASE)) await new Promise(r => setTimeout(r, 20));`);
  }
  function run(copy: number, args: string[], extra: Record<string, string> = {}) {
    const repo = copies[copy], started = join(repo.root, 'started');
    const child = spawn(args[0], args.slice(1), { cwd: repo.dir, detached: true, env: {
      ...repo.env, HOME: home, CI: '', KINGDOWN_MACHINE_LEASED: '', KINGDOWN_TEST_LOCKED: '',
      KINGDOWN_TEST_LOCK_WAIT: '5', npm_config_update_notifier: 'false', PLUGIN_TEST_DATABASE_URL: 'postgresql://localhost/lease_test',
      TMPDIR: repo.root, LEASE_STARTED: started, ...extra,
    } });
    children.push(child);
    let stdout = '', stderr = '', ended = false;
    child.stdout!.on('data', data => { stdout += data; });
    child.stderr!.on('data', data => { stderr += data; });
    const done = new Promise<number | null>(resolve => child.once('exit', code => { ended = true; resolve(code); }));
    return { child, done, started, output: () => stdout + stderr, ended: () => ended };
  }
  async function until(check: () => boolean, task: ReturnType<typeof run>) {
    const deadline = Date.now() + 5000;
    while (!check() && !task.ended() && Date.now() < deadline) await tick();
    expect(check(), task.output()).toBe(true);
  }
  return { copies, run, until };
}

const browser = [process.execPath, 'tools/check.mjs', 'lease'];
const tests = ['bash', 'tools/test-lock.sh', process.execPath, 'tools/web-game-check.mjs'];
const deploy = ['bash', 'tools/deploy.sh', '--target', 'plugin'];

it.each([['tests', tests], ['browser checks', browser]])('%s in another repository block a deploy until they end', async (_name, command) => {
  const { copies, run, until } = setup();
  const release = join(copies[0].root, 'release');
  const heavy = run(0, command, { LEASE_RELEASE: release });
  await until(() => existsSync(heavy.started), heavy);
  const publish = run(1, deploy);
  await until(() => publish.output().includes('waiting for the machine lease'), publish);
  expect(publish.ended()).toBe(false);
  writeFileSync(release, 'release');
  expect(await heavy.done).toBe(0);
  // No remote exists. The deploy must stop at this guard after it gets the lease.
  expect(await publish.done).toBe(2);
  expect(publish.output()).toContain('add the GitHub remote origin');
});

it('a deploy reuses its lease in child commands and blocks tests and browser checks in another copy', async () => {
  const { copies, run, until } = setup();
  const repo = copies[0], release = join(repo.root, 'release');
  const bin = join(repo.dir, 'bin'), git = join(bin, 'git');
  const realGit = repo.run('sh', ['-c', 'command -v git']).stdout.trim();
  repo.write('bin/git', `#!/bin/sh
    if [ "$1 $2" = 'remote get-url' ]; then
      LEASE_RELEASE= LEASE_STARTED='${repo.root}/nested-test' bash tools/test-lock.sh '${process.execPath}' tools/web-game-check.mjs || exit 3
      LEASE_RELEASE= LEASE_STARTED='${repo.root}/nested-browser' '${process.execPath}' tools/check.mjs lease || exit 3
      '${process.execPath}' tools/web-game-check.mjs
      exit 1
    fi
    exec '${realGit}' "$@"
  `);
  chmodSync(git, 0o755);
  const publish = run(0, deploy, { PATH: `${bin}:${repo.env.PATH}`, LEASE_RELEASE: release });
  await until(() => existsSync(publish.started), publish);
  expect(existsSync(join(repo.root, 'nested-test'))).toBe(true);
  expect(existsSync(join(repo.root, 'nested-browser'))).toBe(true);
  const testRun = run(1, tests, { KINGDOWN_TEST_LOCK_WAIT: '0' });
  expect(await testRun.done).toBe(75);
  expect(existsSync(testRun.started)).toBe(false);
  const browserRun = run(1, browser);
  await until(() => browserRun.output().includes('waiting for the machine lease'), browserRun);
  expect(existsSync(browserRun.started)).toBe(false);
  writeFileSync(release, 'release');
  expect(await publish.done).toBe(2);
  expect(await browserRun.done).toBe(0);
  expect(existsSync(browserRun.started)).toBe(true);
});

it('CI keeps its current path while a local command holds the machine lease', async () => {
  const { copies, run, until } = setup();
  const release = join(copies[0].root, 'release');
  const local = run(0, tests, { LEASE_RELEASE: release });
  await until(() => existsSync(local.started), local);
  for (const command of [tests, browser, deploy]) {
    const ci = run(1, command, { CI: 'true' });
    expect(await ci.done).toBe(command === deploy ? 2 : 0);
    expect(ci.output()).not.toContain('machine lease');
  }
  writeFileSync(release, 'release');
  expect(await local.done).toBe(0);
});

it.each([['tests', tests], ['browser checks', browser]])('%s release the machine lease after a signal', async (_name, command) => {
  const { copies, run, until } = setup();
  const heavy = run(0, command, { LEASE_RELEASE: join(copies[0].root, 'never') });
  await until(() => existsSync(heavy.started), heavy);
  heavy.child.kill('SIGTERM');
  expect(await heavy.done).not.toBe(0);
  expect(await run(1, tests, { KINGDOWN_TEST_LOCK_WAIT: '0' }).done).toBe(0);
});

it('a surviving child holds the machine lease after its parent dies, then releases it on exit', async () => {
  const { run, until } = setup();
  const heavy = run(0, ['bash', 'tools/test-lock.sh', 'sh', '-c', 'sleep 60 & echo $! > "$LEASE_STARTED"; wait']);
  await until(() => existsSync(heavy.started), heavy);
  const sleeper = Number(readFileSync(heavy.started, 'utf8'));
  heavy.child.kill('SIGKILL');
  await heavy.done;
  expect(await run(1, tests, { KINGDOWN_TEST_LOCK_WAIT: '0' }).done).toBe(75);
  process.kill(sleeper, 'SIGTERM');
  // The successor waits for the kernel to close the child's descriptor.
  expect(await run(1, tests).done).toBe(0);
});

it('a real browser runner child keeps the machine lease after the inner runner is killed', async () => {
  const { copies, run, until } = setup();
  const release = join(copies[0].root, 'release');
  const heavy = run(0, browser, { LEASE_RELEASE: release });
  await until(() => existsSync(heavy.started), heavy);
  const check = JSON.parse(readFileSync(heavy.started, 'utf8'));
  try {
    process.kill(check.parent, 'SIGKILL');
    expect(await heavy.done).not.toBe(0);
    process.kill(check.pid, 0);
    expect(await run(1, tests, { KINGDOWN_TEST_LOCK_WAIT: '0' }).done).toBe(75);
    writeFileSync(release, 'release');
    expect(await run(1, tests).done).toBe(0);
  } finally {
    try { process.kill(-check.pid, 'SIGKILL'); } catch { /* ended */ }
  }
});

/** The processes from pid up to (and with) top: the chain that a SIGKILL removes, so that only the leaf lives. */
function ancestors(pid: number, top: number) {
  const chain: number[] = [];
  while (pid > 1) {
    chain.push(pid);
    if (pid === top) return chain;
    const ps = spawnSync('ps', ['-o', 'ppid=', '-p', String(pid)], { encoding: 'utf8', timeout: 5_000 });
    if (ps.error) throw ps.error;
    pid = Number(ps.stdout.trim());
  }
  throw new Error(`${top} is not an ancestor`);
}

// An ancestor can exit on its own once the one below it dies; that is the state the tests want.
function killAll(pids: number[]) {
  for (const pid of pids) try { process.kill(pid, 'SIGKILL'); } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ESRCH') throw e; }
}

it('a browser check started through npm run under a held lease runs its children', async () => {
  const { run } = setup();
  // npm is a Node process: it closes the lease descriptor, and Node reuses its number.
  const nested = run(0, ['bash', 'tools/test-lock.sh', '--machine', 'npm', 'run', '-s', 'check:browser', 'lease']);
  expect(await nested.done, nested.output()).toBe(0);
  expect(existsSync(nested.started)).toBe(true);
});

it('the npm test child keeps the machine lease after every process above it is killed', async () => {
  const { copies, run, until } = setup();
  const repo = copies[0], release = join(repo.root, 'release');
  repo.write('node_modules/.bin/tsc', '#!/bin/sh\nexit 0\n');
  repo.write('node_modules/.bin/vitest', `#!/bin/sh\nexec '${process.execPath}' tools/web-game-check.mjs\n`);
  repo.write('docs/2d-first-pieces/pass.test.mjs', '');
  for (const bin of ['tsc', 'vitest']) chmodSync(join(repo.dir, 'node_modules/.bin', bin), 0o755);
  const heavy = run(0, ['npm', 'test'], { LEASE_RELEASE: release });
  await until(() => existsSync(heavy.started), heavy);
  const check = JSON.parse(readFileSync(heavy.started, 'utf8'));
  try {
    killAll(ancestors(check.parent, heavy.child.pid!));
    await heavy.done;
    process.kill(check.pid, 0);
    expect(await run(1, tests, { KINGDOWN_TEST_LOCK_WAIT: '0' }).done).toBe(75);
    writeFileSync(release, 'release');
    expect(await run(1, tests).done).toBe(0);
  } finally {
    try { process.kill(check.pid, 'SIGKILL'); } catch { /* ended */ }
  }
});

it('the deploy test step keeps the machine lease after every process above it is killed', async () => {
  const { copies, run, until } = setup();
  const repo = copies[0], release = join(repo.root, 'release');
  // The deploy tests a fresh origin/main in its own worktree. Its stub wt makes stub tsc and vitest there.
  const vitest = `#!/bin/sh\\nexec '${process.execPath}' tools/web-game-check.mjs\\n`;
  repo.write('tools/wt.sh', `#!/bin/sh\nmkdir -p node_modules/.bin\nprintf '#!/bin/sh\\nexit 0\\n' > node_modules/.bin/tsc\nprintf "${vitest}" > node_modules/.bin/vitest\nchmod +x node_modules/.bin/*\n`);
  chmodSync(join(repo.dir, 'tools/wt.sh'), 0o755);
  repo.write('docs/2d-first-pieces/pass.test.mjs', '');
  const pkg = JSON.parse(repo.read('package.json'));
  pkg.scripts['plugin:db:init-test'] = 'true';
  repo.write('package.json', JSON.stringify(pkg));
  for (const args of [['add', '-A'], ['commit', '-q', '-m', 'deploy'], ['remote', 'add', 'origin', 'https://github.com/SaarShai/king-down-chess.git'],
    ['remote', 'set-url', '--push', 'origin', repo.remote], ['push', '-q', 'origin', 'main']]) {
    const result = repo.git(...args);
    expect(result.status, result.stderr).toBe(0);
  }
  // Only a fetch goes to the bare remote, through a command-line insteadOf rule.
  const realGit = repo.run('sh', ['-c', 'command -v git']).stdout.trim();
  repo.write('bin/git', `#!/bin/sh
    if [ "$1" = fetch ]; then exec '${realGit}' -c 'url.${repo.remote}.insteadOf=https://github.com/SaarShai/king-down-chess.git' "$@"; fi
    exec '${realGit}' "$@"
  `);
  chmodSync(join(repo.dir, 'bin/git'), 0o755);
  const publish = run(0, deploy, { PATH: `${join(repo.dir, 'bin')}:${repo.env.PATH}`, LEASE_RELEASE: release });
  await until(() => existsSync(publish.started), publish);
  const check = JSON.parse(readFileSync(publish.started, 'utf8'));
  try {
    killAll(ancestors(check.parent, publish.child.pid!));
    await publish.done;
    process.kill(check.pid, 0);
    expect(await run(1, tests, { KINGDOWN_TEST_LOCK_WAIT: '0' }).done).toBe(75);
    writeFileSync(release, 'release');
    expect(await run(1, tests).done).toBe(0);
  } finally {
    try { process.kill(check.pid, 'SIGKILL'); } catch { /* ended */ }
  }
});

it('passes the machine lease descriptor at its own number only while it is the lease file', async () => {
  const { machineLeaseStdio } = await import('./lib/lock.mjs');
  const { copies } = setup();
  const lease = openSync(join(copies[0].root, 'machine.lock'), 'a'), other = openSync(join(copies[0].root, 'other'), 'a');
  const { dev, ino } = fstatSync(lease, { bigint: true });
  vi.stubEnv('CI', '');
  vi.stubEnv('KINGDOWN_MACHINE_LEASED', '1');
  vi.stubEnv('KINGDOWN_MACHINE_LEASE_ID', `${dev}:${ino}`);
  vi.stubEnv('KINGDOWN_MACHINE_LEASE_FD', String(lease));
  try {
    const gaps = Array(lease - 3).fill('ignore');
    expect(machineLeaseStdio(['ignore', 1, 1])).toEqual(['ignore', 1, 1, ...gaps, lease]);
    // A Node or npm layer closed the lease, and the number now names another descriptor.
    vi.stubEnv('KINGDOWN_MACHINE_LEASE_FD', String(other));
    expect(machineLeaseStdio(['ignore', 1, 1])).toEqual(['ignore', 1, 1]);
    vi.stubEnv('KINGDOWN_MACHINE_LEASE_FD', '1000');
    expect(machineLeaseStdio(['ignore', 1, 1])).toEqual(['ignore', 1, 1]);
    vi.stubEnv('KINGDOWN_MACHINE_LEASE_FD', String(lease));
    vi.stubEnv('KINGDOWN_MACHINE_LEASED', '');
    expect(machineLeaseStdio(['ignore', 1, 1])).toEqual(['ignore', 1, 1]);
  } finally {
    vi.unstubAllEnvs();
    closeSync(lease);
    closeSync(other);
  }
});

it('tools/test-unlocked.sh runs the package.json typecheck commands', () => {
  const { typecheck } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts;
  const lines = readFileSync(new URL('test-unlocked.sh', import.meta.url), 'utf8').split('\n');
  const commands = typecheck.split(' && ');
  expect(commands.length).toBeGreaterThan(0);
  for (const command of commands) expect(lines, command).toContain(command);
});

it('the plugin browser wrapper passes the lease to each child check', () => {
  // A Node layer closes the lease descriptor in its children unless stdio names it (ticket 01, review of c650384d).
  const source = readFileSync(new URL('plugin-browser-check.mjs', import.meta.url), 'utf8');
  const spawns = [...source.matchAll(/\bspawn\((?:[^()]|\([^()]*\))*?stdio: ([^,]+)/g)].map((m) => m[1]);
  expect(spawns.length).toBe(2);
  for (const stdio of spawns) expect(stdio).toMatch(/^machineLeaseStdio\(/);
});
