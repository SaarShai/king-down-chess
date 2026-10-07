// Settings test (dev-environment/05). It reads the project settings, the launch file, the npm config,
// the Vite config and the ignore file as Claude Code, the desktop app, npm, Vite and git read them.
// It holds each key, entry, host and ignore line of the dev-environment spec, so that a later edit
// cannot remove one in silence.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vite from '../vite.config';

const root = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const settings = JSON.parse(read('.claude/settings.json'));

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
