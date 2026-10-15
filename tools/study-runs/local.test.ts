import { afterEach, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { staticFile, startStudio } from '../study-studio';
import { mainCheckout, studioStorage } from './local';
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); vi.unstubAllEnvs(); });
it('serves only ordinary build files within the static root', () => {
  const root = mkdtempSync(join(tmpdir(), 'study-static-')); roots.push(root);
  const dist = join(root, 'dist'); mkdirSync(dist); writeFileSync(join(dist, 'index.html'), 'page');
  writeFileSync(join(root, 'secret'), 'private'); symlinkSync(join(root, 'secret'), join(dist, 'escape'));
  expect(staticFile(dist, '/')).toBe(realpathSync(join(dist, 'index.html')));
  expect(staticFile(dist, '/escape')).toBeNull();
  expect(staticFile(dist, '/%2e%2e%2fsecret')).toBeNull();
  expect(staticFile(dist, '/.secrets/key')).toBeNull();
  expect(staticFile(dist, '/%00')).toBeNull();
});
it('rejects a results override before starting storage or transports', async () => {
  vi.stubEnv('KING_DOWN_RESULTS_DIR', '/tmp/not-the-card');
  await expect(studioStorage(process.cwd())).rejects.toThrow('results override');
});
it('derives main from Git and fails startup before listening without a build', () => {
  const root = mkdtempSync(join(tmpdir(), 'study-no-build-')); roots.push(root);
  const main = join(root, 'arbitrary-checkout'), worktree = join(root, 'feature');
  mkdirSync(join(main, 'tools/lib'), { recursive: true });
  writeFileSync(join(main, 'tools/lib/results-root.mjs'), 'export const resultsRoot = () => null;');
  const git = (...args: string[]) => execFileSync('git', ['-c', 'core.hooksPath=/dev/null', ...args], { cwd: main, stdio: 'pipe' });
  git('init'); git('add', '.');
  git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Fixture');
  git('worktree', 'add', '--detach', worktree);
  expect(mainCheckout(main)).toBe(realpathSync(main));
  expect(mainCheckout(worktree)).toBe(realpathSync(main));
  expect(() => startStudio(root, 4174)).toThrow();
  expect(() => startStudio(root, 80)).toThrow('local port');
});
