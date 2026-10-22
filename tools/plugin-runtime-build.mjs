/** A source-free Node 20+ match runtime, using the existing Vite bundler. */
import { build } from 'vite';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, sep } from 'node:path';

/** The worker bundle holds this stamp while the build hashes it; the hash then takes its place (G2). */
export const ENGINE_STAMP = 'sha256:KINGDOWN_ENGINE_STAMP';
/** The engine archive: each released worker bundle as `<hex>.mjs`, with a fixture save `<hex>.save.json`. */
export const ENGINES = fileURLToPath(new URL('../engines/', import.meta.url));

function checkFixture(hex, source) {
  const save = JSON.parse(source);
  if (save?.schema !== 'kingdown-local-match/1' || save.engine !== `sha256:${hex}`) throw new Error(`Invalid engine fixture: ${hex}`);
}

/** Check the save pair before a runtime copies an archive. */
export async function checkEnginePair(dir, hex, worker) {
  const bundle = await readFile(resolve(dir, `${hex}.mjs`));
  checkFixture(hex, await readFile(resolve(dir, `${hex}.save.json`), 'utf8'));
  if (worker && !bundle.equals(worker)) throw new Error('The compiled worker differs from its engine archive');
  return bundle;
}

/** Publish only on request. Exact existing pairs are safe to repeat; no existing file is overwritten. */
export async function publishEnginePair(dir, hex, worker, fixture) {
  checkFixture(hex, fixture);
  const text = worker.toString(), stamp = `sha256:${hex}`;
  if (text.split(stamp).length !== 2 || createHash('sha256').update(text.replace(stamp, ENGINE_STAMP)).digest('hex') !== hex) throw new Error('The engine worker does not match its fingerprint');
  const bundle = resolve(dir, `${hex}.mjs`), save = resolve(dir, `${hex}.save.json`), source = fixture.trimEnd() + '\n';
  if (existsSync(bundle) || existsSync(save)) {
    await checkEnginePair(dir, hex, worker);
    if (await readFile(save, 'utf8') !== source) throw new Error('The engine fixture differs from its archive');
    return;
  }
  await mkdir(dir, { recursive: true });
  await writeFile(bundle, worker, { flag: 'wx' });
  try { await writeFile(save, source, { flag: 'wx' }); }
  catch (error) { await rm(bundle); throw error; }
}

/** The page and server use the same compiled worker identity; no archive is written here. */
export async function buildWorker() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const result = await build({
    configFile: false, root, publicDir: false, logLevel: 'warn',
    define: { __KINGDOWN_COMPILED__: 'true', __KINGDOWN_ENGINE__: JSON.stringify(ENGINE_STAMP) },
    build: {
      ssr: true, target: 'node20', write: false, minify: true,
      lib: { entry: resolve(root, 'src/match/worker.ts'), formats: ['es'], fileName: () => 'worker.mjs' },
      rollupOptions: { external: /^node:/, output: { entryFileNames: 'worker.mjs' } },
    },
  });
  const output = Array.isArray(result) ? result[0].output : result.output;
  if (output.filter(file => file.type === 'chunk').length !== 1) throw new Error('The enforcement worker must be one self-contained bundle');
  const text = output.find(file => file.type === 'chunk' && file.fileName === 'worker.mjs')?.code;
  if (!text || text.split(ENGINE_STAMP).length !== 2) throw new Error('The worker bundle must hold the engine stamp exactly once');
  const hex = createHash('sha256').update(text).digest('hex');
  return { hex, engine: `sha256:${hex}`, source: text.replace(ENGINE_STAMP, `sha256:${hex}`) };
}

/** Search is a runtime dependency, not part of the immutable enforcement fingerprint. */
export async function buildSearchWorker() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const result = await build({
    configFile: false, root, publicDir: false, logLevel: 'warn',
    build: {
      ssr: true, target: 'node20', write: false, minify: true,
      lib: { entry: resolve(root, 'src/match/search-worker.ts'), formats: ['es'], fileName: () => 'search-worker.mjs' },
      rollupOptions: { external: /^node:/, output: { entryFileNames: 'search-worker.mjs' } },
    },
  });
  const output = Array.isArray(result) ? result[0].output : result.output;
  if (output.filter(file => file.type === 'chunk').length !== 1) throw new Error('The search worker must be one self-contained bundle');
  const source = output.find(file => file.type === 'chunk' && file.fileName === 'search-worker.mjs')?.code;
  if (!source) throw new Error('The search worker bundle is missing');
  return source;
}

export async function buildRuntime(outDir = resolve('plugin-dist'), { publish = false, archiveDir = ENGINES } = {}) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const output = resolve(outDir) + sep, archive = resolve(archiveDir) + sep;
  if (output.startsWith(archive) || archive.startsWith(output)) throw new Error('Runtime output must not overlap the engine archive');
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await build({
    configFile: false, root, publicDir: false, logLevel: 'warn',
    define: { __KINGDOWN_COMPILED__: 'true' },
    build: {
      ssr: true, target: 'node20', outDir, emptyOutDir: false, minify: true,
      lib: { entry: resolve(root, 'src/match/index.ts'), formats: ['es'], fileName: () => 'index.mjs' },
      rollupOptions: { external: /^node:/, output: { entryFileNames: 'index.mjs' } },
    },
  });
  const { hex, source } = await buildWorker(), worker = resolve(outDir, 'worker.mjs');
  await writeFile(worker, source);
  await writeFile(resolve(outDir, 'search-worker.mjs'), await buildSearchWorker());
  if (publish) {
    const { createMatch } = await import(pathToFileURL(resolve(outDir, 'index.mjs')).href);
    const match = await createMatch();
    let save;
    try {
      for (const id of ['fixture-1', 'fixture-2']) { const { revision, legal } = await match.snapshot(); await match.apply({ id, expectedRevision: revision, lan: legal[0] }); }
      save = await match.exportSave();
    } finally { await match.close(); }
    await publishEnginePair(archiveDir, hex, await readFile(worker), save);
    console.log(`Engine archive ${hex}: commit engines/${hex}.mjs and engines/${hex}.save.json`);
  }
  try { await checkEnginePair(archiveDir, hex, await readFile(worker)); }
  catch (error) {
    if (error.code === 'ENOENT') throw new Error(`Engine ${hex} needs its archive pair. Run npm run plugin:archive:runtime, then commit both files.`, { cause: error });
    throw error;
  }
  await mkdir(resolve(outDir, 'engines'));
  for (const file of await readdir(archiveDir)) if (file.endsWith('.mjs')) {
    await checkEnginePair(archiveDir, file.slice(0, -4));
    await cp(resolve(archiveDir, file), resolve(outDir, 'engines', file));
  }
  await writeFile(resolve(outDir, 'package.json'), JSON.stringify({ private: true, type: 'module', engines: { node: '>=20' } }) + '\n');
  return outDir;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), publish = args[0] === '--publish';
  if (publish) args.shift();
  if (args.length > 1 || args[0]?.startsWith('-')) throw new Error('Usage: node tools/plugin-runtime-build.mjs [--publish] [output folder]');
  console.log(await buildRuntime(args[0] && resolve(args[0]), { publish }));
}
