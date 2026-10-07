// The tool gate, tested at its seam: hook JSON on stdin to the exact command in the settings.
import { spawn, spawnSync } from 'node:child_process';
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
function runGate(stdin: string, command = gateCommand) {
  const run = spawnSync('/bin/sh', ['-c', command], {
    input: stdin, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  });
  const out = run.stdout.trim() ? JSON.parse(run.stdout).hookSpecificOutput : undefined;
  return { status: run.status, stdout: run.stdout, stderr: run.stderr, out };
}

/** The same as runGate, but it does not block, so rows can run in parallel. */
function runGateAsync(stdin: string, command = gateCommand): Promise<{ status: number | null; stderr: string; out: any }> {
  return new Promise((resolve, reject) => {
    const child = spawn('/bin/sh', ['-c', command], { env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });
    child.on('error', reject);
    child.on('close', status => resolve({ status, stderr, out: stdout.trim() ? JSON.parse(stdout).hookSpecificOutput : undefined }));
    child.stdin.end(stdin);
  });
}

const bash = (command: unknown, cwd = root, mode = 'default') => JSON.stringify({
  session_id: 'test', cwd, permission_mode: mode, hook_event_name: 'PreToolUse',
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
  ['ps -o pid=,command=', PROC_SAFE],
  ['ps -o pid=,command= -p 123,456', PROC_SAFE],
  ['ps -A -o pid=,command= -p 123', PROC_SAFE],
  ['ps -p 123 -p 456 -o command=', PROC_SAFE],
  ['ps -eo pid=,command= -p 123', PROC_SAFE],
  ['ps -o pid=,command= -p 123 ax', PROC_SAFE],
  ['ps axo pid,command -p 123', PROC_SAFE],
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
  it('quotes the secret path in its hint, so a path with spaces pastes as one word', () => {
    expect(verdict(`cat ${secretFile}`).out?.permissionDecisionReason).toMatch(/`test -s "[^"`]*fake_token"`/);
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

// [command, a word that the reason names]
const askRows: [string, string][] = [
  ['vercel', 'vercel'],
  ['vercel deploy --prod', 'vercel'],
  ['/usr/local/bin/vercel env pull', 'vercel'],
  ['npx vercel deploy', 'vercel'],
  ['npx -y vercel@39.1.0 deploy --prod', 'vercel'],
  ['npx --yes --package vercel vercel ls', 'vercel'],
  ['bunx vercel deploy', 'vercel'],
  ['bunx --bun vercel deploy', 'vercel'],
  ['pnpm dlx vercel deploy', 'vercel'],
  ['pnpm --silent dlx vercel deploy', 'vercel'],
  ['pnpm dlx --silent vercel deploy', 'vercel'],
  ['psql "$DATABASE_URL" -c "select 1"', 'psql'],
  ['PGPASSWORD=x psql -h db.example.supabase.co', 'psql'],
  ['supabase db push', 'supabase'],
  ['npx supabase db reset', 'supabase'],
  ['tools/deploy.sh --publish', '--publish'],
  ['./tools/deploy.sh --publish', '--publish'],
  ['bash tools/deploy.sh --publish', '--publish'],
  ['curl -X POST https://api.porkbun.com/api/json/v3/dns/retrieve/kingdown.dev', 'Porkbun'],
  ['curl https://porkbun.com/api/json/v3/ping', 'Porkbun'],
  ['gh workflow run pages.yml', 'gh workflow run'],
  ['gh workflow run deploy --ref main', 'gh workflow run'],
  ['git commit --no-verify -m "x"', 'git hooks'],
  ['git push --no-verify origin x', 'git hooks'],
  ['git commit -n -m "x"', 'git hooks'],
  ['git commit -nm "x"', 'git hooks'],
  ['git -C /repo commit -am "x" -n', 'git hooks'],
  ['git config core.hooksPath /dev/null', 'core.hooksPath'],
  ['git config --unset core.hooksPath', 'core.hooksPath'],
  ['git config set core.hooksPath .x', 'core.hooksPath'],
  ['git config --global core.hooksPath ~/hooks', 'core.hooksPath'],
  ['git -c core.hooksPath=/dev/null commit -m "x"', 'core.hooksPath'],
  ['GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null git commit -m x', 'core.hooksPath'],
];

// Each ask form inside ssh, sh -c, bash -lc, a pipe, &&, $(...) and wrappers.
const nestedAskRows: [string, string][] = [
  ["ssh m1 'vercel deploy'", 'vercel'],
  ["sh -c 'psql -c \"drop table x\"'", 'psql'],
  ['bash -lc "supabase db push"', 'supabase'],
  ['echo y | vercel deploy --prod', 'vercel'],
  ['npm test && git push --no-verify', 'git hooks'],
  ['sudo -u deploy tools/deploy.sh --publish', '--publish'],
  ['time gh workflow run pages.yml', 'gh workflow run'],
  ['env FOO=1 npx vercel deploy', 'vercel'],
  ['X=$(curl -s https://api.porkbun.com/api/json/v3/ping)', 'Porkbun'],
  ["ssh m1 'git -C /repo commit -n -m x'", 'git hooks'],
  ['nohup git config core.hooksPath /tmp/none &', 'core.hooksPath'],
];

describe('tool gate asks before production actions and hook bypasses', () => {
  it.each([...askRows, ...nestedAskRows])('asks for %s', (command, action) => {
    const { out } = verdict(command);
    expect(out?.hookEventName).toBe('PreToolUse');
    expect(out?.permissionDecision).toBe('ask');
    expect(out?.permissionDecisionReason).toContain(action);
  });
});

const NO_PROMPT_MODES = ['bypassPermissions', 'dontAsk'];
const PROMPT_MODES = ['default', 'acceptEdits', 'plan', 'auto'];

describe('tool gate turns an ask into a deny where no prompt shows', () => {
  it.each([...askRows, ...nestedAskRows])('%s: deny in bypassPermissions and dontAsk, ask in the other modes', async (command, action) => {
    const runs = await Promise.all([...NO_PROMPT_MODES, ...PROMPT_MODES].map(mode => runGateAsync(bash(command, root, mode))));
    runs.forEach((run, k) => {
      expect(run.status).toBe(0);
      expect(run.stderr).toBe('');
      expect(run.out?.permissionDecisionReason).toContain(action);
      if (k < NO_PROMPT_MODES.length) {
        expect(run.out?.permissionDecision).toBe('deny');
        expect(run.out?.permissionDecisionReason).toContain('ask the owner in chat');
      } else {
        expect(run.out?.permissionDecision).toBe('ask');
      }
    });
  });
  it.each(["printenv", "ssh m1 'ps aux'", 'vercel deploy && printenv', `cat ${secretFile}`])('%s stays deny in every mode', async command => {
    const runs = await Promise.all([...NO_PROMPT_MODES, ...PROMPT_MODES].map(mode => runGateAsync(bash(command, root, mode))));
    for (const run of runs) {
      expect(run.status).toBe(0);
      expect(run.out?.permissionDecision).toBe('deny');
      expect(run.out?.permissionDecisionReason).not.toContain('ask the owner in chat');
    }
  });
  it('gives deny for a fault in bypassPermissions mode', async () => {
    const run = await runGateAsync(JSON.stringify({ cwd: root, tool_name: 'Bash', permission_mode: 'bypassPermissions' }));
    expect(run.out?.permissionDecision).toBe('deny');
    expect(run.out?.permissionDecisionReason).toMatch(/no tool_input.*ask the owner in chat/);
  });
});

const passRows = [
  'grep vercel AGENTS.md', 'echo supabase', 'git commit -m "x"', 'git config user.name', 'tools/deploy.sh',
  'git config core.hooksPath', 'git config --get core.hooksPath', 'git commit -m "-n"', 'git commit -mn',
  'git push -n origin x', 'cat vercel.json', 'echo porkbun.com', 'gh workflow list', 'npm run build',
  'grep printenv notes.md', 'echo env', 'set -euo pipefail', 'export PATH=/x:$PATH', 'ps -o pid,stat',
  'ps -o pid,stat,etime -p 123', 'ps -o pid=,command= -p 123', 'ps -p 123 -o pid=,command=', 'ps -o pid=,command= -p123', 'pgrep -x node', 'pgrep -f kaggle-tournament', 'cat README.md', 'git log',
  `ls ${join(tmp, '.secrets')}`, `test -s ${secretFile}`, 'echo printenv | wc -c', 'declare -x FOO=1',
  'node tools/kaggle-tournament.mjs status',
  "git commit -m \"$(cat <<'EOF'\nThe env (it's set) is fine.\nenv\nprintenv\nEOF\n)\"",
];

describe('tool gate passes other commands', () => {
  it.each(passRows)('passes %s', command => {
    expect(verdict(command).stdout).toBe('');
  });
  it('passes the process lookup that AGENTS.md prescribes, so the rule and the hook agree', () => {
    const form = /`(ps -o [^`]*-p <pid>)`/.exec(readFileSync(join(root, 'AGENTS.md'), 'utf8'))?.[1];
    expect(form).toBeTruthy();
    expect(verdict(form!.replace('<pid>', '123')).stdout).toBe('');
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
  it.each([
    'Bash(vercel *)', 'Bash(npx vercel *)', 'Bash(bunx vercel *)', 'Bash(pnpm dlx vercel *)',
    'Bash(psql *)', 'Bash(supabase *)', 'Bash(gh workflow run *)',
  ])('permissions.ask holds %s', rule => {
    expect(settings.permissions?.ask).toContain(rule);
  });
});

// ---------------------------------------------------------------- browser sites

const PANE_PREFIXES = ['mcp__Claude_Browser__', 'mcp__remote-devices__Claude_Browser__'];
const CHROME = 'mcp__claude-in-chrome__';
// Tools that take one URL. The Chrome new-tab tool opens an empty tab today; the gate reads a url if it has one.
const URL_TOOLS = [...PANE_PREFIXES.flatMap(p => [`${p}navigate`, `${p}preview_start`]), `${CHROME}navigate`, `${CHROME}tabs_create_mcp`];
const BATCH_TOOLS = [...PANE_PREFIXES.map(p => `${p}browser_batch`), `${CHROME}browser_batch`];
const BROWSER_TOOLS = [...URL_TOOLS, ...BATCH_TOOLS];
const browserEntries = (settings.hooks?.PreToolUse ?? []).filter((e: { matcher?: string }) => e.matcher !== 'Bash');
const browserCommand: string = browserEntries[0]?.hooks?.[0]?.command ?? '';

const toolCall = (tool: string, toolInput: unknown, mode = 'default') => JSON.stringify({
  session_id: 'test', cwd: root, permission_mode: mode, hook_event_name: 'PreToolUse',
  tool_name: tool, tool_input: toolInput,
});
// A batch with the URL in one navigate step among other steps.
const batchOf = (url: string) => ({
  actions: [
    { name: 'computer', input: { action: 'screenshot' } },
    { name: 'navigate', input: { url, tabId: 1 } },
    { name: 'find', input: { query: 'Sign in' } },
  ],
});
/** The input that sends `url` through `tool`. */
const inputFor = (tool: string, url: unknown) => (tool.endsWith('browser_batch') ? batchOf(url as string) : { url });
/** Runs `url` through each browser tool in parallel, in one mode. */
const eachTool = (url: unknown, mode = 'default') =>
  Promise.all(BROWSER_TOOLS.map(tool => runGateAsync(toolCall(tool, inputFor(tool, url), mode), browserCommand)));

describe('browser gate settings', () => {
  it('runs one browser PreToolUse entry with the tool gate, and its matcher lists each browser tool by exact name', () => {
    expect(browserEntries).toHaveLength(1);
    expect(browserEntries[0].hooks).toHaveLength(1);
    expect(browserCommand).toBe('"$CLAUDE_PROJECT_DIR"/.claude/hooks/tool-gate.mjs');
    // Only letters, digits, "_", "-" and "|": Claude Code reads the matcher as a list of exact names, not a regex.
    expect(browserEntries[0].matcher).toMatch(/^[A-Za-z0-9_|-]+$/);
  });
  it.each(BROWSER_TOOLS)('the matcher holds %s', tool => {
    expect(browserEntries[0].matcher.split('|')).toContain(tool);
  });
});

// [url, the host that the reason names]
const siteRows: [string, string][] = [
  ['https://kingdown.dev/', 'kingdown.dev'],
  ['https://www.kingdown.dev/play', 'www.kingdown.dev'],
  ['kingdown.dev', 'kingdown.dev'],
  ['HTTPS://WWW.KingDown.DEV./', 'www.kingdown.dev'],
  ['https://kingdown.vercel.app/', 'kingdown.vercel.app'],
  ['https://kingdown-git-x.vercel.app/', 'kingdown-git-x.vercel.app'],
  ['https://a.kingdown-chess.vercel.app/', 'a.kingdown-chess.vercel.app'],
  ['https://vercel.com/dashboard', 'vercel.com'],
  ['https://x.vercel.com:443/team', 'x.vercel.com'],
  ['https://supabase.com/dashboard/project/abc', 'supabase.com'],
  ['https://app.supabase.com/', 'app.supabase.com'],
  ['https://abc.supabase.co/rest/v1/', 'abc.supabase.co'],
  ['https://porkbun.com/account/domainsSpeedy', 'porkbun.com'],
  ['https://www.porkbun.com/', 'www.porkbun.com'],
  ['https://someone@app.supabase.com/', 'app.supabase.com'],
  ['view-source:https://kingdown.dev/', 'kingdown.dev'],
];

describe('browser gate asks before a production or dashboard site', () => {
  it.each(siteRows)('asks for %s in each browser tool', async (url, host) => {
    const runs = await eachTool(url);
    runs.forEach((run, k) => {
      expect(run.status, BROWSER_TOOLS[k]).toBe(0);
      expect(run.stderr).toBe('');
      expect(run.out?.hookEventName).toBe('PreToolUse');
      expect(run.out?.permissionDecision, BROWSER_TOOLS[k]).toBe('ask');
      expect(run.out?.permissionDecisionReason).toContain(host);
    });
  });
  it.each(siteRows)('%s: deny in bypassPermissions and dontAsk, ask in the other modes', async (url, host) => {
    for (const mode of [...NO_PROMPT_MODES, ...PROMPT_MODES]) {
      const runs = await eachTool(url, mode);
      runs.forEach((run, k) => {
        expect(run.status).toBe(0);
        expect(run.out?.permissionDecisionReason).toContain(host);
        if (NO_PROMPT_MODES.includes(mode)) {
          expect(run.out?.permissionDecision, `${BROWSER_TOOLS[k]} ${mode}`).toBe('deny');
          expect(run.out?.permissionDecisionReason).toContain('ask the owner in chat');
        } else {
          expect(run.out?.permissionDecision, `${BROWSER_TOOLS[k]} ${mode}`).toBe('ask');
        }
      });
    }
  });
  it.each(BATCH_TOOLS)('%s asks when one step of many opens a production site', async tool => {
    const actions = [
      { name: 'navigate', input: { url: 'http://127.0.0.1:5189/' } },
      { name: 'computer', input: { action: 'screenshot' } },
      { name: 'navigate', input: { url: 'https://vercel.com/' } },
      { name: 'navigate', input: { url: 'https://example.com/' } },
    ];
    const run = await runGateAsync(toolCall(tool, { actions }), browserCommand);
    expect(run.out?.permissionDecision).toBe('ask');
    expect(run.out?.permissionDecisionReason).toContain('vercel.com');
  });
  it.each(BATCH_TOOLS)('%s reads a batch whose actions list comes as JSON text', async tool => {
    const run = await runGateAsync(toolCall(tool, { actions: JSON.stringify(batchOf('https://kingdown.dev/').actions) }), browserCommand);
    expect(run.out?.permissionDecision).toBe('ask');
  });
});

const sitePassRows = [
  'http://127.0.0.1:5189/', 'http://localhost:5173/', 'https://example.com/?q=kingdown.dev',
  'https://notkingdown.dev/', 'https://vercel.com.example.org/', 'https://notkingdown.vercel.app/',
  'https://vercel.app/', 'https://myvercel.com/', 'https://supabase.com.example.org/', 'http://[::1]:5173/',
  'https://www.google.com/search?q=vercel.com+supabase.co', 'about:blank', 'back', 'forward', 'localhost:5173',
];

describe('browser gate passes other sites', () => {
  it.each(sitePassRows)('passes %s in each browser tool', async url => {
    const runs = await eachTool(url);
    runs.forEach((run, k) => {
      expect(run.status).toBe(0);
      expect(run.stderr).toBe('');
      expect(run.out, BROWSER_TOOLS[k]).toBeUndefined();
    });
  });
  it.each(BATCH_TOOLS)('%s passes a batch with no production step', async tool => {
    const actions = [
      { name: 'navigate', input: { url: 'http://127.0.0.1:5189/' } },
      { name: 'find', input: { query: 'vercel.com' } },
      { name: 'computer', input: { action: 'type', text: 'https://kingdown.dev' } },
    ];
    const run = await runGateAsync(toolCall(tool, { actions }), browserCommand);
    expect(run.out).toBeUndefined();
  });
  it('passes preview_start by launch name, and an empty new tab', async () => {
    const runs = await Promise.all([
      ...PANE_PREFIXES.map(p => runGateAsync(toolCall(`${p}preview_start`, { name: 'vite' }), browserCommand)),
      runGateAsync(toolCall(`${CHROME}tabs_create_mcp`, {}), browserCommand),
    ]);
    for (const run of runs) expect(run.out).toBeUndefined();
  });
});

describe('browser gate asks on a URL it cannot read', () => {
  it.each(['https://exa mple.com/', 'http://[::1', 'https://', ''])('asks for %j in each browser tool, and denies it in bypassPermissions', async url => {
    for (const [mode, decision] of [['default', 'ask'], ['bypassPermissions', 'deny']]) {
      const runs = await eachTool(url, mode);
      runs.forEach((run, k) => {
        expect(run.status).toBe(0);
        expect(run.out?.permissionDecision, `${BROWSER_TOOLS[k]} ${mode}`).toBe(decision);
        expect(run.out?.permissionDecisionReason).toMatch(/Tool gate fault/);
      });
    }
  });
  it.each([[42], [null], [['https://kingdown.dev']]])('asks for the url value %j', async url => {
    const runs = await eachTool(url);
    for (const run of runs) expect(run.out?.permissionDecision).toBe('ask');
  });
  it.each(BATCH_TOOLS)('%s asks when the batch has no actions list', async tool => {
    const run = await runGateAsync(toolCall(tool, { actions: 'navigate to kingdown.dev' }), browserCommand);
    expect(run.out?.permissionDecision).toBe('ask');
  });
});
