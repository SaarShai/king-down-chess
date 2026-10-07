/** A source-free Node 20+ match runtime, using the existing Vite bundler. */
import { build } from 'vite';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export async function buildRuntime(outDir = resolve('plugin-dist')) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  for (const entry of ['index', 'worker']) {
    await build({
      configFile: false, root, publicDir: false, logLevel: 'warn',
      define: { __KINGDOWN_COMPILED__: 'true' },
      build: {
        ssr: true, target: 'node20', outDir, emptyOutDir: false, minify: true,
        lib: { entry: resolve(root, `src/match/${entry}.ts`), formats: ['es'], fileName: () => `${entry}.mjs` },
        rollupOptions: { external: /^node:/, output: { entryFileNames: `${entry}.mjs` } },
      },
    });
  }
  await writeFile(resolve(outDir, 'package.json'), JSON.stringify({ private: true, type: 'module', engines: { node: '>=20' } }) + '\n');
  return outDir;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(await buildRuntime(process.argv[2] && resolve(process.argv[2])));
