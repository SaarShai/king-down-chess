/**
 * Choose a machine for RIFE in-betweens and run the retained alpha interpolation.
 *
 * This Mac is used when it has a torch environment and the retained runtime. Otherwise the M1 runs the job, but only
 * with at least 15 GiB free. A caller may pass a command seam instead (used by the tests).
 */
import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from './frames.mjs';

export const rifePy = fileURLToPath(new URL('./rife.py', import.meta.url));
export const expectedRuntimeManifest = '24a25cd7ebe8fe93c58cda992b6f432fe19c1253b90bcdf99de314fce5a063a4';
export const minM1FreeBytes = 15 * 1024 ** 3;

export function run(command, args, { cwd, timeout = 0 } = {}) {
  return new Promise((done, fail) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    const timer = timeout ? setTimeout(() => child.kill('SIGKILL'), timeout) : null;
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    child.on('error', fail);
    child.on('close', code => {
      if (timer) clearTimeout(timer);
      code === 0 ? done({ stdout, stderr }) : fail(Error(`${command} ${args.join(' ')} exited ${code}: ${stderr.trim() || stdout.trim()}`));
    });
  });
}

function sshArgs(alias) {
  return ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', alias];
}

const ssh = (alias, command, options) => run('ssh', [...sshArgs(alias), command], options);

export function localSettings() {
  return {
    python: process.env.KINGDOWN_RIFE_PYTHON ?? 'python3',
    runtime: process.env.KINGDOWN_RIFE_RUNTIME ?? join(homedir(), '.cache/kingdown/rife'),
  };
}

export function m1Settings() {
  return {
    alias: process.env.KINGDOWN_M1_SSH ?? 'M1',
    python: process.env.KINGDOWN_M1_RIFE_PYTHON ?? '~/projects/seedvr2/.venv/bin/python',
    runtime: process.env.KINGDOWN_M1_RIFE_RUNTIME ?? '~/projects/successful-workflow-queen-rife-pair-20261029/runtime',
  };
}

async function localReady() {
  const settings = localSettings();
  if (!existsSync(join(settings.runtime, 'manifest.json'))) return null;
  try {
    await run(settings.python, ['-c', 'import torch, numpy, PIL']);
    return { machine: 'this Mac', ...settings };
  } catch { return null; }
}

export async function m1FreeBytes(alias = m1Settings().alias) {
  const { stdout } = await ssh(alias, 'df -k /');
  const line = stdout.trim().split('\n').at(-1).split(/\s+/);
  const available = Number(line[3]);
  if (!Number.isFinite(available)) throw Error(`Cannot read free space on ${alias}: ${stdout.trim()}`);
  return available * 1024;
}

async function m1Ready() {
  const settings = m1Settings();
  try {
    const free = await m1FreeBytes(settings.alias);
    if (free < minM1FreeBytes) return { unavailable: `${settings.alias} has ${Math.round(free / 1024 ** 3)} GiB free; it needs 15 GiB` };
    const { stdout } = await ssh(settings.alias, `${settings.python} -c "import torch, numpy, PIL" && test -f ${settings.runtime}/manifest.json && echo ready`);
    if (!stdout.includes('ready')) return { unavailable: `${settings.alias} has no torch environment or retained runtime` };
    return { machine: settings.alias, ...settings };
  } catch (error) {
    return { unavailable: `${settings.alias} is not reachable: ${error.message.split('\n')[0]}` };
  }
}

export async function chooseMachine({ prefer = 'auto' } = {}) {
  if (prefer === 'local') {
    const local = await localReady();
    if (!local) throw Error(`No local RIFE: set KINGDOWN_RIFE_PYTHON and KINGDOWN_RIFE_RUNTIME, or use --machine auto`);
    return local;
  }
  if (prefer === 'auto') {
    const local = await localReady();
    if (local) return local;
  }
  const m1 = await m1Ready();
  if (m1.machine) return m1;
  if (prefer === 'm1') throw Error(`Cannot use the M1: ${m1.unavailable}`);
  throw Error(`No RIFE machine. This Mac has no torch runtime${localSettings().runtime ? ` at ${localSettings().runtime}` : ''}; ${m1.unavailable}. Install a local runtime or free 15 GiB on the M1.`);
}

function quote(path) {
  return `'${String(path).replaceAll("'", "'\\''")}'`;
}

/**
 * Run one interpolation plan. The plan, its inputs and outputs live in <work>/rife, with relative paths, so the same
 * folder runs on this Mac or on the M1.
 */
export async function interpolate({ work, frames, machine, inferCommand, timeout = 900000, runtime }) {
  const directory = join(work, 'rife');
  await rm(directory, { recursive: true, force: true });
  await mkdir(join(directory, 'in'), { recursive: true });
  await mkdir(join(directory, 'out'), { recursive: true });
  await cp(rifePy, join(directory, 'rife.py'));
  const inputs = new Map();
  for (const frame of frames) if (frame.input) {
    const input = `in/${String(frame.index).padStart(3, '0')}.png`;
    await cp(frame.input, join(directory, input));
    inputs.set(frame.index, input);
  }
  const pathOf = reference => typeof reference === 'string' ? reference
    : inputs.get(reference) ?? `out/${String(reference).padStart(3, '0')}.png`;
  const plan = {
    runtimeManifestSha256: expectedRuntimeManifest,
    frames: frames.filter(frame => frame.left != null && frame.right != null).map(frame => ({ index: frame.index, left: pathOf(frame.left), right: pathOf(frame.right), t: frame.t, output: `out/${String(frame.index).padStart(3, '0')}.png` })),
  };
  const planPath = join(directory, 'plan.json');
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);
  const reportPath = join(directory, 'report.json');

  if (inferCommand) {
    await run('/bin/sh', ['-c', `${inferCommand} ${quote(planPath)}`], { timeout });
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    return { machine: 'custom command', report, directory };
  }
  if (machine.alias) {
    const remote = `/private/tmp/kingdown-anim-rife-${process.pid}-${Math.random().toString(16).slice(2, 8)}`;
    const free = await m1FreeBytes(machine.alias);
    if (free < minM1FreeBytes) throw Error(`${machine.alias} now has ${Math.round(free / 1024 ** 3)} GiB free; it needs 15 GiB`);
    try {
      await ssh(machine.alias, `mkdir -p ${remote}`);
      await run('scp', ['-q', '-r', directory, `${machine.alias}:${remote}`]);
      const { stdout } = await ssh(machine.alias, `${machine.python} ${remote}/rife/rife.py --plan ${remote}/rife/plan.json --runtime ${machine.runtime}`, { timeout });
      await run('scp', ['-q', '-r', `${machine.alias}:${remote}/rife/out`, join(directory, 'out.remote')], { timeout });
      await rm(join(directory, 'out'), { recursive: true, force: true });
      await run('/bin/mv', [join(directory, 'out.remote'), join(directory, 'out')]);
      return { machine: machine.machine, report: { runtimeManifestSha256: expectedRuntimeManifest, output: stdout.trim().split('\n').at(-1) ?? '' }, directory };
    } finally {
      await ssh(machine.alias, `rm -rf ${remote}`).catch(() => {});
    }
  }
  await run(machine.python, [join(directory, 'rife.py'), '--plan', planPath, '--runtime', runtime ?? machine.runtime], { timeout });
  return { machine: machine.machine, report: { runtimeManifestSha256: expectedRuntimeManifest }, directory };
}

export async function hashFile(path) {
  return sha256(await readFile(path));
}
