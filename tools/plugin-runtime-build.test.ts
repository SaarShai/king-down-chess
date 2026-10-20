import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { checkEnginePair } from './plugin-runtime-build.mjs';

const dirs: string[] = [], hex = 'a'.repeat(64), bundle = Buffer.from('worker bytes');
afterEach(async () => { await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });
async function pair(save?: string) {
  const dir = await mkdtemp(join(tmpdir(), 'engine-pair-')); dirs.push(dir);
  await writeFile(join(dir, `${hex}.mjs`), bundle);
  if (save !== undefined) await writeFile(join(dir, `${hex}.save.json`), save);
  return dir;
}

it('accepts the exact archive/save pair and matching compiled worker', async () => {
  const dir = await pair(JSON.stringify({ schema: 'kingdown-local-match/1', engine: `sha256:${hex}` }));
  expect(await checkEnginePair(dir, hex, bundle)).toEqual(bundle);
});
it('refuses an archive without its save', async () => {
  await expect(checkEnginePair(await pair(), hex)).rejects.toThrow('ENOENT');
});
it.each(['{', 'null', '{"schema":"wrong"}', JSON.stringify({ schema: 'kingdown-local-match/1', engine: `sha256:${'b'.repeat(64)}` })])('refuses a malformed or wrong-stamp save (%s)', async save => {
  await expect(checkEnginePair(await pair(save), hex)).rejects.toThrow();
});
it('refuses current worker bytes that differ from the archive', async () => {
  const dir = await pair(JSON.stringify({ schema: 'kingdown-local-match/1', engine: `sha256:${hex}` }));
  await expect(checkEnginePair(dir, hex, Buffer.from('other worker bytes'))).rejects.toThrow('compiled worker differs');
});
