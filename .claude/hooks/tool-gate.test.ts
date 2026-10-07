// The tool gate, tested at its seam: hook JSON on stdin to the exact command in the settings.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../..', import.meta.url));
const settings = JSON.parse(readFileSync(join(root, '.claude/settings.json'), 'utf8'));
const gateEntries = (settings.hooks?.PreToolUse ?? []).filter((e: { matcher?: string }) => e.matcher === 'Bash');
const gateCommand: string = gateEntries[0]?.hooks?.[0]?.command ?? '';

// Fake secret files and node_modules shapes in a temporary folder. No real secret value.
const tmp = mkdtempSync(join(tmpdir(), 'tool-gate-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));
const secretFile = join(tmp, '.secrets', 'fake_token');
const typesafeKey = join(tmp, '.config', 'typesafe', 'key');
for (const file of [secretFile, typesafeKey]) {
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, 'fake-value\n');
}
const linked = join(tmp, 'linked'), real = join(tmp, 'real'), none = join(tmp, 'none');
mkdirSync(join(tmp, 'shared-node-modules'));
for (const dir of [linked, real, none]) mkdirSync(dir);
symlinkSync(join(tmp, 'shared-node-modules'), join(linked, 'node_modules'));
mkdirSync(join(real, 'node_modules'));

/** Runs the hook command from the settings with `stdin` as its input. */
function runGate(stdin: string) {
  const run = spawnSync('/bin/sh', ['-c', gateCommand], {
    input: stdin, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  });
  const out = run.stdout.trim() ? JSON.parse(run.stdout).hookSpecificOutput : undefined;
  return { status: run.status, stdout: run.stdout, stderr: run.stderr, out };
}

const bash = (command: unknown, cwd = root) => JSON.stringify({
  session_id: 'test', cwd, permission_mode: 'default', hook_event_name: 'PreToolUse',
  tool_name: 'Bash', tool_input: { command },
});

describe('tool gate settings', () => {
  it('runs one Bash PreToolUse gate through $CLAUDE_PROJECT_DIR, and the gate file is executable', () => {
    expect(gateEntries).toHaveLength(1);
    expect(gateEntries[0].hooks).toHaveLength(1);
    expect(gateCommand).toBe('"$CLAUDE_PROJECT_DIR"/.claude/hooks/tool-gate.mjs');
    expect(statSync(join(root, '.claude/hooks/tool-gate.mjs')).mode & 0o111).toBe(0o111);
  });
});

// [command, safe form that the reason names]
const ENV_SAFE = 'echo "${VAR:+set}"';
const PROC_SAFE = 'pgrep -x <name>';
const FILE_SAFE = 'test -s';
const denyRows: [string, string][] = [
  ['printenv', ENV_SAFE],
  ['printenv TYPESAFE_API_KEY', ENV_SAFE],
  ['/usr/bin/printenv', ENV_SAFE],
  ['env', ENV_SAFE],
  ['env -0', ENV_SAFE],
  ['export', ENV_SAFE],
  ['export -p', ENV_SAFE],
  ['set', ENV_SAFE],
  ['declare -x', ENV_SAFE],
  ['declare -p', ENV_SAFE],
  ['typeset -x', ENV_SAFE],
  ['pgrep -l node', PROC_SAFE],
  ['pgrep -fl kaggle', PROC_SAFE],
  ['pgrep -lf kaggle', PROC_SAFE],
  ['pgrep -a node', PROC_SAFE],
  ['ps aux', PROC_SAFE],
  ['ps -ef', PROC_SAFE],
  ['ps eww', PROC_SAFE],
  ['ps -o command', PROC_SAFE],
  ['ps -o pid,args', PROC_SAFE],
  ['ps -p 123', PROC_SAFE],
  ['cat /proc/123/environ', PROC_SAFE],
  ["tr '\\0' '\\n' < /proc/self/environ", PROC_SAFE],
  [`cat ${secretFile}`, FILE_SAFE],
  [`head -c 20 ${secretFile}`, FILE_SAFE],
  [`less ${secretFile}`, FILE_SAFE],
  [`tail ${secretFile}`, FILE_SAFE],
  [`grep token ${secretFile}`, FILE_SAFE],
  [`jq . < ${secretFile}`, FILE_SAFE],
  [`cat ${typesafeKey}`, FILE_SAFE],
  ['cat ~/.config/typesafe/key', FILE_SAFE],
  ['cat .secrets/oauth.json', FILE_SAFE],
];

// Each printer inside ssh, sh -c, bash -lc, a pipe, &&, ;, $(...), sudo, npx, env VAR=x and time.
const nestedRows: [string, string][] = [
  ["ssh m1 'printenv'", ENV_SAFE],
  ['ssh -p 22 m1.local pgrep -fl node', PROC_SAFE],
  ["ssh m1 'cd /x && ps aux | grep node'", PROC_SAFE],
  ["sh -c 'env'", ENV_SAFE],
  ['bash -lc "pgrep -l node"', PROC_SAFE],
  ['bash -lc "ssh m1 \'printenv\'"', ENV_SAFE],
  ['ps aux | grep node', PROC_SAFE],
  ['echo start && printenv', ENV_SAFE],
  ['cd /tmp; env', ENV_SAFE],
  ['echo "$(printenv HOME)"', ENV_SAFE],
  ['X=$(pgrep -fl node) || true', PROC_SAFE],
  ['echo `ps -ef`', PROC_SAFE],
  ['sudo printenv', ENV_SAFE],
  ['sudo -u root ps aux', PROC_SAFE],
  ['npx printenv', ENV_SAFE],
  ['env FOO=1 printenv', ENV_SAFE],
  ['env FOO=1', ENV_SAFE],
  ['FOO=1 env', ENV_SAFE],
  ['time ps aux', PROC_SAFE],
  ['time -p env', ENV_SAFE],
  ['nohup pgrep -a node &', PROC_SAFE],
  [`sudo cat ${secretFile} | head`, FILE_SAFE],
  ['if true; then set; fi', ENV_SAFE],
];

const verdict = (command: string, cwd = root) => {
  const run = runGate(bash(command, cwd));
  expect(run.status).toBe(0);
  expect(run.stderr).toBe('');
  return run;
};

describe('tool gate denies secret printers', () => {
  it.each([...denyRows, ...nestedRows])('denies %s', (command, safeForm) => {
    const { out } = verdict(command);
    expect(out?.hookEventName).toBe('PreToolUse');
    expect(out?.permissionDecision).toBe('deny');
    expect(out?.permissionDecisionReason).toContain(safeForm);
  });
});

describe('tool gate guards a linked node_modules', () => {
  it.each(['npm ci', 'npm install', 'npm i', 'npm install vitest', 'npm --silent ci', 'cd x && npm ci'])('denies %s with a linked node_modules', command => {
    const { out } = verdict(command, linked);
    expect(out?.permissionDecision).toBe('deny');
    expect(out?.permissionDecisionReason).toContain('wt add <path>');
  });
  it.each(['npm ci', 'npm install', 'npm i'])('passes %s with a real node_modules folder or none', command => {
    expect(verdict(command, real).stdout).toBe('');
    expect(verdict(command, none).stdout).toBe('');
  });
  it('passes other npm commands with a linked node_modules', () => {
    expect(verdict('npm test', linked).stdout).toBe('');
  });
});

const passRows = [
  'grep printenv notes.md', 'echo env', 'set -euo pipefail', 'export PATH=/x:$PATH', 'ps -o pid,stat',
  'ps -o pid,stat,etime -p 123', 'pgrep -x node', 'pgrep -f kaggle-tournament', 'cat README.md', 'git log',
  `ls ${join(tmp, '.secrets')}`, `test -s ${secretFile}`, 'echo printenv | wc -c', 'declare -x FOO=1',
  'node tools/kaggle-tournament.mjs status',
  "git commit -m \"$(cat <<'EOF'\nThe env (it's set) is fine.\nenv\nprintenv\nEOF\n)\"",
];

describe('tool gate passes other commands', () => {
  it.each(passRows)('passes %s', command => {
    expect(verdict(command).stdout).toBe('');
  });
  it('passes a tool other than Bash', () => {
    const run = runGate(JSON.stringify({ cwd: root, tool_name: 'Read', tool_input: { file_path: '/x' } }));
    expect(run.status).toBe(0);
    expect(run.stdout).toBe('');
  });
});

describe('tool gate asks on a fault or bad input', () => {
  const ask = (stdin: string, fault: RegExp) => {
    const run = runGate(stdin);
    expect(run.status).toBe(0);
    expect(run.out?.permissionDecision).toBe('ask');
    expect(run.out?.permissionDecisionReason).toMatch(fault);
  };
  it('asks on bad JSON', () => ask('{"tool_name": "Bash", ', /not JSON/));
  it('asks on a missing tool_input', () => ask(JSON.stringify({ cwd: root, tool_name: 'Bash' }), /no tool_input/));
  it('asks when the decision function throws', () => ask(bash(42), /command is number/));
  it('asks on a command it cannot split', () => ask(bash("echo 'open"), /unclosed single quote/));
});

describe('tool gate permission rules', () => {
  it.each([
    'Bash(printenv *)', 'Bash(pgrep -l *)', 'Bash(pgrep -fl *)', 'Bash(ps aux *)',
    'Read(//**/.secrets/**)', 'Read(~/.config/typesafe/key)',
  ])('permissions.deny holds %s', rule => {
    expect(settings.permissions?.deny).toContain(rule);
  });
});
