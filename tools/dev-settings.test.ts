// Settings test (dev-environment/05). It reads the project settings, the launch file, the npm config,
// the Vite config and the ignore file as Claude Code, the desktop app, npm, Vite and git read them.
// It holds each key, entry, host and ignore line of the dev-environment spec, so that a later edit
// cannot remove one in silence.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vite from '../vite.config';

const root = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const settings = JSON.parse(read('.claude/settings.json'));
const launch = JSON.parse(read('.claude/launch.json'));
type Entry = { name: string; runtimeExecutable: string; runtimeArgs?: string[]; port?: number };
const entries: Entry[] = launch.configurations ?? [];
/** The lines of a config file, trimmed, with no blank line and no comment. */
const lines = (path: string) => existsSync(join(root, path))
  ? read(path).split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith(';'))
  : [];

describe('project settings', () => {
  it('each worktree links the main checkout packages', () => {
    expect(settings.worktree?.symlinkDirectories).toEqual(['node_modules']);
  });

  it('commits end with the neutral trailer, with no PR text and no session link', () => {
    // The object form: the value false makes versions before 2.1.281 skip the whole file.
    expect(settings.attribution).toEqual({
      commit: 'Co-Authored-By: Claude Code <noreply@anthropic.com>',
      pr: '',
      sessionUrl: false,
    });
  });
});

describe('session hook', () => {
  /** The SessionStart commands with this matcher. */
  const commands = (matcher: string): string[] => (settings.hooks?.SessionStart ?? [])
    .filter((e: { matcher?: string }) => e.matcher === matcher)
    .flatMap((e: { hooks: { command: string }[] }) => e.hooks.map(h => h.command));
  const hook = '"$CLAUDE_PROJECT_DIR"/.claude/hooks/session-facts.mjs';

  it('runs at startup and after a compaction', () => {
    expect(commands('startup')).toContain(hook);
    expect(commands('compact')).toContain(hook);
  });

  it('is an executable script', () => {
    expect(statSync(join(root, '.claude/hooks/session-facts.mjs')).mode & 0o111).not.toBe(0);
  });
});

describe('launch file', () => {
  it('one worktree entry serves the worktree that the target file names', () => {
    expect(entries.find(e => e.name === 'worktree'))
      .toEqual({ name: 'worktree', runtimeExecutable: 'bash', runtimeArgs: ['tools/wt.sh', 'serve'], port: 5177 });
  });

  it('keeps dev, playable, painted-2d and previews, and has no workshop entry', () => {
    const names = entries.map(e => e.name);
    for (const kept of ['dev', 'playable', 'painted-2d', 'previews']) expect(names).toContain(kept);
    expect(names).not.toContain('workshop');
  });

  it('holds no absolute path', () => {
    // 4830dee put a worktree path into this file; such an entry serves one folder on one Mac only.
    const strings = (v: unknown): string[] =>
      typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];
    expect(strings(entries).filter(v => /^(\/|~|[A-Za-z]:[\\/])/.test(v))).toEqual([]);
  });
});

describe('Vite', () => {
  // A check calls 127.0.0.1; a server on `localhost` can listen on ::1 only. A `--host` flag still wins.
  it('the dev server and the preview server listen on 127.0.0.1', () => {
    expect(vite.server?.host).toBe('127.0.0.1');
    expect(vite.preview?.host).toBe('127.0.0.1');
  });

  it('the dev server keeps its port rule', () => {
    expect(vite.server?.strictPort).toBe(true);
    expect(vite.server?.port).toBe(+(process.env.PORT || 5173));
  });
});

describe('npm', () => {
  // With no person to answer the prompt, `npx` stops on a missing package. A `--yes` flag still wins.
  it('npx installs no missing package from the registry', () => {
    expect(lines('.npmrc')).toContain('yes=false');
  });
});

describe('git', () => {
  it('ignores the package link, the target file and the previews folder', () => {
    // `/node_modules` with no slash at the end matches a folder and a link.
    const ignored = lines('.gitignore');
    for (const line of ['/node_modules', '/.claude/preview-target', '/sim/out/previews/']) expect(ignored).toContain(line);
  });
});

describe('packages', () => {
  it('no worktree-include file copies the packages into each worktree', () => {
    expect(existsSync(join(root, '.worktreeinclude'))).toBe(false);
  });

  it('the installation guard is in npm test', () => {
    expect(existsSync(join(root, 'tools/install-guard.test.ts'))).toBe(true);
  });
});
