import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'dashboard-'));
  for (const file of ['tools/dashboard.mjs', 'tools/lib/results-root.mjs', 'src/ai/eval.ts']) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    copyFileSync(join(import.meta.dirname, '..', file), join(root, file));
  }
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const run = (results = '') => spawnSync(process.execPath, ['tools/dashboard.mjs'], {
  cwd: root, encoding: 'utf8', timeout: 2000,
  env: { ...process.env, HOME: root, KING_DOWN_RESULTS_DIR: results },
});

describe('results dashboard', () => {
  it.each(['absent', 'empty'])('builds with an %s local spool and no card configuration', state => {
    if (state === 'empty') mkdirSync(join(root, 'sim/out'), { recursive: true });
    const result = run();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('0 runs, 0 reports, 0 experiments, 0 games binned');
    expect(readFileSync(join(root, 'docs/dashboard/index.html'), 'utf8')).toContain('no run yet');
    expect(existsSync(join(root, 'sim/out'))).toBe(state === 'empty');
  });

  it('keeps the missing-card error', () => {
    const config = join(root, '.config/king-down/results.json');
    mkdirSync(dirname(config), { recursive: true });
    writeFileSync(config, JSON.stringify({ root: join(root, 'absent'), volume: join(root, 'absent'), uuid: 'wrong' }));
    const result = run();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Connect card disk for King Down results; no local fallback');
    expect(existsSync(join(root, 'docs/dashboard'))).toBe(false);
  });

  it('keeps errors for a missing explicit root and a spool that is a file', () => {
    const missing = run(join(root, 'absent'));
    expect(missing.status).not.toBe(0);
    expect(missing.stderr).toContain('ENOENT');
    mkdirSync(join(root, 'sim'));
    writeFileSync(join(root, 'sim/out'), '');
    const file = run();
    expect(file.status).not.toBe(0);
    expect(file.stderr).toContain('ENOTDIR');
  });
});
