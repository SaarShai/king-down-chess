import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'vite';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { buildRuntime, buildWorker, checkEnginePair, ENGINE_STAMP, publishEnginePair } from './plugin-runtime-build.mjs';

vi.mock('vite', () => ({ build: vi.fn() }));

const dirs: string[] = [], hex = 'a'.repeat(64), bundle = Buffer.from('worker bytes');
const workerSource = `export const engine = '${ENGINE_STAMP}';\n`;
const currentHex = createHash('sha256').update(workerSource).digest('hex');
const currentWorker = Buffer.from(workerSource.replace(ENGINE_STAMP, `sha256:${currentHex}`));
const currentSave = JSON.stringify({ schema: 'kingdown-local-match/1', engine: `sha256:${currentHex}` });
const fixtureRuntime = `export async function createMatch() { return {
  snapshot: async () => ({ revision: 0, legal: ['e2-e4'] }), apply: async () => {}, close: async () => {},
  exportSave: async () => ${JSON.stringify(currentSave)}
}; }`;
beforeEach(() => {
  vi.mocked(build).mockImplementation(async config => {
    const entry = (config!.build!.lib as { entry: string }).entry.split('/').at(-1)!.replace('.ts', '.mjs');
    if (config!.build!.write === false) return { output: [{ type: 'chunk', fileName: entry, code: workerSource }] } as never;
    await writeFile(join(config!.build!.outDir!, entry), entry === 'worker.mjs' ? workerSource : fixtureRuntime);
    return {} as never;
  });
});

it('gives page builds the exact runtime worker fingerprint without writing files', async () => {
  expect(await buildWorker()).toEqual({ hex: currentHex, engine: `sha256:${currentHex}`, source: currentWorker.toString() });
  expect(vi.mocked(build).mock.lastCall?.[0]).toMatchObject({ configFile: false, build: { write: false, ssr: true, target: 'node20' } });
});
afterEach(async () => { await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });
async function directory() {
  const dir = await mkdtemp(join(tmpdir(), 'engine-pair-')); dirs.push(dir);
  return dir;
}
async function pair(save?: string) {
  const dir = await directory();
  await writeFile(join(dir, `${hex}.mjs`), bundle);
  if (save !== undefined) await writeFile(join(dir, `${hex}.save.json`), save);
  return dir;
}
const snapshot = async (dir: string) => Promise.all((await readdir(dir)).sort().map(async file => ({ file, bytes: await readFile(join(dir, file)), modified: (await stat(join(dir, file))).mtimeMs })));
async function ageFiles(dir: string) {
  for (const file of await readdir(dir)) await utimes(join(dir, file), new Date(1000), new Date(1000));
}

it('refuses a split enforcement bundle rather than hashing only its entry', async () => {
  vi.mocked(build).mockResolvedValueOnce({ output: [
    { type: 'chunk', fileName: 'worker.mjs', code: workerSource },
    { type: 'chunk', fileName: 'dependency.mjs', code: 'export const value = 1;' },
  ] } as never);
  await expect(buildWorker()).rejects.toThrow('one self-contained bundle');
});

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

it.each([false, true])('ordinary builds refuse a missing current pair without changing the archive (worker present: %s)', async workerPresent => {
  const archiveDir = await pair(JSON.stringify({ schema: 'kingdown-local-match/1', engine: `sha256:${hex}` }));
  if (workerPresent) await writeFile(join(archiveDir, `${currentHex}.mjs`), currentWorker);
  await ageFiles(archiveDir);
  const before = await snapshot(archiveDir);
  await expect(buildRuntime(join(await directory(), 'runtime'), { archiveDir })).rejects.toThrow('npm run plugin:archive:runtime');
  expect(await snapshot(archiveDir)).toEqual(before);
});

it.each(['same', 'parent', 'child'])('refuses an output folder that overlaps the archive (%s) before removing files', async location => {
  const root = await directory(), archiveDir = join(root, 'engines');
  await mkdir(archiveDir);
  await writeFile(join(archiveDir, `${hex}.mjs`), bundle);
  const before = await snapshot(archiveDir), output = location === 'same' ? archiveDir : location === 'parent' ? root : join(archiveDir, 'runtime');
  await expect(buildRuntime(output, { archiveDir })).rejects.toThrow('must not overlap');
  expect(await snapshot(archiveDir)).toEqual(before);
});

it('ordinary builds verify and copy supported workers without writing any source archive file', async () => {
  const archiveDir = await pair(JSON.stringify({ schema: 'kingdown-local-match/1', engine: `sha256:${hex}` }));
  await publishEnginePair(archiveDir, currentHex, currentWorker, currentSave);
  await ageFiles(archiveDir);
  const before = await snapshot(archiveDir), output = join(await directory(), 'runtime');
  expect(await buildRuntime(output, { archiveDir })).toBe(output);
  expect(await snapshot(archiveDir)).toEqual(before);
  expect((await readdir(join(output, 'engines'))).sort()).toEqual([`${hex}.mjs`, `${currentHex}.mjs`].sort());
  expect(await readFile(join(output, 'worker.mjs'))).toEqual(currentWorker);
  expect(await readFile(join(output, 'search-worker.mjs'), 'utf8')).toBe(workerSource);
  for (const file of await readdir(join(output, 'engines'))) expect(await readFile(join(output, 'engines', file))).toEqual(await readFile(join(archiveDir, file)));
});

it('explicit publication creates the pair and repeats an exact pair without writing', async () => {
  const dir = await directory();
  await buildRuntime(join(await directory(), 'runtime'), { archiveDir: dir, publish: true });
  expect(await checkEnginePair(dir, currentHex, currentWorker)).toEqual(currentWorker);
  expect(await readFile(join(dir, `${currentHex}.save.json`), 'utf8')).toBe(currentSave + '\n');
  await ageFiles(dir);
  const before = await snapshot(dir);
  await publishEnginePair(dir, currentHex, currentWorker, currentSave);
  expect(await snapshot(dir)).toEqual(before);
});

it.each(['worker only', 'save only', 'changed worker', 'changed save', 'malformed save'])('publication refuses an existing %s without changing it', async state => {
  const dir = await directory();
  if (state !== 'save only') await writeFile(join(dir, `${currentHex}.mjs`), state === 'changed worker' ? 'changed' : currentWorker);
  if (state !== 'worker only') await writeFile(join(dir, `${currentHex}.save.json`), state === 'malformed save' ? '{' : state === 'changed save' ? currentSave.replace('}', ',"changed":true}') + '\n' : currentSave + '\n');
  await ageFiles(dir);
  const before = await snapshot(dir);
  await expect(publishEnginePair(dir, currentHex, currentWorker, currentSave)).rejects.toThrow();
  expect(await snapshot(dir)).toEqual(before);
});

it.each([
  [Buffer.from('changed worker'), currentSave],
  [currentWorker, currentSave.replace(currentHex, hex)],
] as const)('publication refuses inconsistent inputs before writing (%s)', async (worker, save) => {
  const dir = await directory();
  await expect(publishEnginePair(dir, currentHex, worker, save)).rejects.toThrow();
  expect(await readdir(dir)).toEqual([]);
});
