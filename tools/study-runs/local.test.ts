import { afterEach, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
  expect(mainCheckout(process.cwd())).toContain('king down chess');
  const root = mkdtempSync(join(tmpdir(), 'study-no-build-')); roots.push(root);
  expect(() => startStudio(root, 4174)).toThrow();
  expect(() => startStudio(root, 80)).toThrow('local port');
});
