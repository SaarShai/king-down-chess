// The session hook, tested at its seam: hook JSON on stdin to the exact command in the settings.
// A temporary main checkout holds the trackers; a linked worktree holds older copies of them.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, readFileSync, readlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { tempRepo } from '../../tools/lib/temp-repo.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const settings = JSON.parse(readFileSync(join(root, '.claude/settings.json'), 'utf8'));
/** The command of the SessionStart entry with this matcher that starts the session hook. */
const command = (matcher: string): string =>
  (settings.hooks?.SessionStart ?? [])
    .filter((e: { matcher?: string }) => e.matcher === matcher)
    .flatMap((e: { hooks: { command: string }[] }) => e.hooks.map(h => h.command))
    .find((c: string) => c.includes('session-facts.mjs')) ?? 'exit 9';

const LIMIT = 9500;
const header = '| id | where | games | state |\n|---|---|---|---|';
const tasks = (open: string) => `# Tasks\n\n## Open items\n- ${open}\n\n## Old section\n- old-item-line\n`;
const queue = (rows: string) =>
  `# Simulation queue\n\n## Ran 2026-10-01\n\n${header}\n| ran-a | M1 | 10 | queued-old-section |\n\n` +
  `## Running and queued, 2026-10-06\n\nSome text.\n\n${header}\n${rows}\nDecides: text.\n\n## Dropped\n\n${header}\n| drop-a | M1 | 10 | queued-dropped |\n`;

type Repo = ReturnType<typeof tempRepo>;
const repos: Repo[] = [];
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });

/** A main checkout with the given trackers, and a linked worktree whose tracker copies differ. */
function setup(main: { tasks?: string; queue?: string }) {
  const repo = tempRepo({ hooks: false });
  repos.push(repo);
  repo.write('TASKS.md', tasks('worktree-open-item'));
  repo.write('docs/QUEUE.md', queue('| wt-run | M1 | 10 | running |'));
  repo.write('package-lock.json', '{ "lock": 1 }\n');
  cpSync(join(root, 'tools/wt.sh'), join(repo.dir, 'tools/wt.sh'));
  repo.git('add', '-A');
  repo.git('commit', '-q', '-m', 'start');
  const worktree = join(repo.root, 'wt');
  repo.git('worktree', 'add', '-q', '-b', 'side', worktree);
  // The main checkout's trackers are newer than the worktree's (uncommitted, as on main).
  repo.remove('TASKS.md');
  repo.remove('docs/QUEUE.md');
  if (main.tasks !== undefined) repo.write('TASKS.md', main.tasks);
  if (main.queue !== undefined) repo.write('docs/QUEUE.md', main.queue);
  /** Runs the hook command of `matcher` with hook JSON from the worktree on stdin. */
  const hook = (source: string, cwd = worktree) => {
    const input = JSON.stringify({ session_id: 'test', hook_event_name: 'SessionStart', source, cwd });
    const run = spawnSync('/bin/sh', ['-c', command(source)], {
      cwd, input, encoding: 'utf8', env: { ...repo.env, CLAUDE_PROJECT_DIR: root },
    });
    return { status: run.status, stdout: run.stdout, stderr: run.stderr };
  };
  return { repo, worktree, hook };
}

describe('session hook, source compact', () => {
  it('gives the main checkout\'s open items and its live queue rows, and no done row', () => {
    const { hook } = setup({
      tasks: tasks('main-open-item'),
      queue: queue('| main-done | Kaggle | 10 | done: +1 pawn |\n| main-new | M1 | 20 | running: shard 3 |\n| main-queued | M1 | 30 | queued |'),
    });
    const result = hook('compact');
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('- main-open-item');
    expect(result.stdout).toContain('## Running and queued, 2026-10-06');
    expect(result.stdout).toContain(header);
    expect(result.stdout).toContain('| main-new | M1 | 20 | running: shard 3 |');
    expect(result.stdout).toContain('| main-queued | M1 | 30 | queued |');
    expect(result.stdout).not.toContain('main-done');
    expect(result.stdout).not.toContain('worktree-open-item');
    expect(result.stdout).not.toContain('wt-run');
    expect(result.stdout).not.toContain('old-item-line');
    expect(result.stdout).not.toContain('queued-old-section');
    expect(result.stdout).not.toContain('queued-dropped');
    expect(result.stdout).not.toContain('Decides');
  });

  it('stops a long queue at a row boundary under 9,500 characters, and the last line names the file', () => {
    const rows = Array.from({ length: 300 }, (_, i) => `| run-${i} | M1, a long place name for the row | ${i} | running |`);
    const { repo, hook } = setup({ tasks: tasks('main-open-item'), queue: queue(rows.join('\n')) });
    const result = hook('compact');
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.length).toBeLessThan(LIMIT);
    const lines = result.stdout.trimEnd().split('\n');
    const last = lines.pop()!;
    expect(last).toContain(join(repo.dir, 'docs/QUEUE.md'));
    expect(last).not.toContain('|');
    // Each line before the file line is a whole row of the fixture.
    const shown = lines.filter(line => line.startsWith('| run-'));
    expect(shown.length).toBeGreaterThan(50);
    expect(shown).toEqual(rows.slice(0, shown.length));
  });

  it('gives one fact line that names a missing file, and exit 0', () => {
    const { repo, hook } = setup({ queue: queue('| main-new | M1 | 20 | running |') });
    const result = hook('compact');
    expect(result.status, result.stderr).toBe(0);
    const named = result.stdout.split('\n').filter(line => line.includes('TASKS.md'));
    expect(named).toEqual([`Fact: ${join(repo.dir, 'TASKS.md')} is missing.`]);
    expect(result.stdout).toContain('| main-new | M1 | 20 | running |');
  });
});

describe('session hook, source startup', () => {
  it('links node_modules in a worktree with no packages, then prints nothing when they are present', () => {
    const { repo, worktree, hook } = setup({ tasks: tasks('main-open-item'), queue: queue('') });
    repo.write('node_modules/alpha/index.js', '');
    const first = hook('startup');
    expect(first.status, first.stderr).toBe(0);
    expect(lstatSync(join(worktree, 'node_modules')).isSymbolicLink()).toBe(true);
    expect(readlinkSync(join(worktree, 'node_modules'))).toBe(join(repo.dir, 'node_modules'));
    expect(first.stdout).toContain(`${worktree}\tside\tlinked`);
    const second = hook('startup');
    expect(second.status, second.stderr).toBe(0);
    expect(second.stdout).toBe('');
  });

  it('prints nothing in the main checkout and makes no link there', () => {
    const { repo, hook } = setup({ tasks: tasks('main-open-item'), queue: queue('') });
    const result = hook('startup', repo.dir);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe('');
    expect(existsSync(join(repo.dir, 'node_modules'))).toBe(false);
  });
});

describe('the real docs/QUEUE.md', () => {
  it('has exactly one heading that starts with "Running", and its table has a state column', () => {
    const lines = readFileSync(join(root, 'docs/QUEUE.md'), 'utf8').split('\n');
    const running = lines.flatMap((line, i) => (/^#+\s+Running/.test(line) ? [i] : []));
    expect(running).toHaveLength(1);
    const table = lines.slice(running[0] + 1).find(line => line.startsWith('|') || /^#/.test(line)) ?? '';
    expect(table.split('|').map(cell => cell.trim())).toContain('state');
  });
});
