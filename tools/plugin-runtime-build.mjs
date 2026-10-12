/** A source-free Node 20+ match runtime, using the existing Vite bundler. */
import { build } from 'vite';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

/** The worker bundle holds this stamp while the build hashes it; the hash then takes its place (G2). */
export const ENGINE_STAMP = 'sha256:KINGDOWN_ENGINE_STAMP';
/** The engine archive: each released worker bundle as `<hex>.mjs`, with a fixture save `<hex>.save.json`. */
export const ENGINES = fileURLToPath(new URL('../engines/', import.meta.url));

export async function buildRuntime(outDir = resolve('plugin-dist')) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  for (const entry of ['index', 'worker']) {
    await build({
      configFile: false, root, publicDir: false, logLevel: 'warn',
      define: { __KINGDOWN_COMPILED__: 'true', __KINGDOWN_ENGINE__: JSON.stringify(ENGINE_STAMP) },
      build: {
        ssr: true, target: 'node20', outDir, emptyOutDir: false, minify: true,
        lib: { entry: resolve(root, `src/match/${entry}.ts`), formats: ['es'], fileName: () => `${entry}.mjs` },
        rollupOptions: { external: /^node:/, output: { entryFileNames: `${entry}.mjs` } },
      },
    });
  }
  const worker = resolve(outDir, 'worker.mjs'), text = await readFile(worker, 'utf8');
  if (text.split(ENGINE_STAMP).length !== 2) throw new Error('The worker bundle must hold the engine stamp exactly once');
  const hex = createHash('sha256').update(text).digest('hex');
  await writeFile(worker, text.replace(ENGINE_STAMP, `sha256:${hex}`));
  // ponytail: every build archives a new engine in the repository; delete the bundles that you do not release.
  if (!existsSync(resolve(ENGINES, `${hex}.mjs`))) {
    const { createMatch } = await import(pathToFileURL(resolve(outDir, 'index.mjs')).href);
    const match = await createMatch();
    let save;
    try {
      for (const id of ['fixture-1', 'fixture-2']) { const { revision, legal } = await match.snapshot(); await match.apply({ id, expectedRevision: revision, lan: legal[0] }); }
      save = await match.exportSave();
    } finally { await match.close(); }
    await mkdir(ENGINES, { recursive: true });
    await writeFile(resolve(ENGINES, `${hex}.save.json`), save + '\n');
    await cp(worker, resolve(ENGINES, `${hex}.mjs`));
    console.log(`New engine ${hex}: commit engines/${hex}.mjs and engines/${hex}.save.json`);
  }
  await mkdir(resolve(outDir, 'engines'));
  for (const file of await readdir(ENGINES)) if (file.endsWith('.mjs')) await cp(resolve(ENGINES, file), resolve(outDir, 'engines', file));
  await writeFile(resolve(outDir, 'package.json'), JSON.stringify({ private: true, type: 'module', engines: { node: '>=20' } }) + '\n');
  return outDir;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(await buildRuntime(process.argv[2] && resolve(process.argv[2])));
