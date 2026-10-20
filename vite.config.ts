import { defineConfig, type Plugin } from 'vitest/config';
import { createHash } from 'node:crypto';
import { cpSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { OutputBundle } from 'rolldown';

const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

/** Code a player may never need: the Supabase client (only for an account). */
const onDemand = /\/src\/account\/client\.ts$/;

/** Select the local graph and the public art, fonts and icons that it uses. */
export function offlineCacheFiles(bundle: OutputBundle, root: string, files: string[]) {
  const local = new Set(['src/main.ts', 'src/entry.ts', 'index.html'].map(file => resolve(root, file).replaceAll('\\', '/')));
  const graph = new Set<string>();
  const visit = (name: string) => {
    if (graph.has(name) || name.endsWith('.map')) return;
    const file = bundle[name];
    if (!file) throw new Error(`Missing offline graph file: ${name}`);
    if (file.type === 'chunk' && onDemand.test(file.facadeModuleId?.replaceAll('\\', '/') ?? '')) return;
    graph.add(name);
    if (file.type === 'chunk') for (const next of [...file.imports, ...file.dynamicImports]) visit(next);
    for (const next of [...(file.viteMetadata?.importedCss ?? []), ...(file.viteMetadata?.importedAssets ?? [])]) visit(next);
  };
  for (const file of Object.values(bundle)) {
    if (file.type === 'chunk' && local.has(file.facadeModuleId?.replaceAll('\\', '/') ?? '')) visit(file.fileName);
  }
  const emitted = new Set(files);
  for (const file of graph) {
    if (!emitted.has(file) || !/^assets\/(?:[\w-]+\/)*[\w-]+\.(?:js|css|wasm|webp|png|svg|woff2)$/.test(file)) throw new Error(`Invalid offline graph file: ${file}`);
  }
  const publicFiles = files.filter(file => graph.has(file) || /^(?:ui\/[\w/-]+\.(?:webp|png|svg)|fonts\/[\w-]+\.woff2|icons\/[\w-]+\.png|manifest\.webmanifest)$/.test(file)).sort();
  return { allowlist: ['./', 'index.html', ...publicFiles], precache: ['./', ...publicFiles] };
}

/** Copy public files and set the exact offline lists and content version. */
function offlineBuild(): Plugin {
  let publicDir = '', outDir = '', root = '';
  return {
    name: 'king-down-offline',
    apply: 'build',
    configResolved(config) { publicDir = config.publicDir; root = config.root; outDir = resolve(root, config.build.outDir); },
    transformIndexHtml() {
      // Only once the board is drawn (main.ts exposes `view` for the tools), so caching for offline
      // never competes with a first visit's downloads; it gives up waiting after 60 s.
      return [{ tag: 'script', injectTo: 'head', children: `if ('serviceWorker' in navigator) addEventListener('load', async () => {
  for (let t = 0; !window.view && t < 300; t++) await new Promise(r => setTimeout(r, 200));
  await Promise.race([window.view?.ready(), new Promise(r => setTimeout(r, 60000))]);
  navigator.serviceWorker.register('./sw.js').catch(() => {});
});` }];
    },
    writeBundle(_options, bundle) {
      cpSync(publicDir, outDir, { recursive: true });
      const files = walk(outDir).map(path => relative(outDir, path).split(sep).join('/')).filter(f => f !== 'sw.js' && !f.startsWith('.well-known/')).sort();
      const template = readFileSync(join(publicDir, 'sw.js'), 'utf8');
      const hash = createHash('sha256').update(template); // a change to the worker itself is a new version too
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      const { allowlist, precache } = offlineCacheFiles(bundle, root, files);
      if (!precache.every(file => allowlist.includes(file))) throw new Error('Offline file is not public');
      let sw = template;
      for (const [marker, value] of [["const VERSION = 'dev';", `const VERSION = '${hash.digest('hex').slice(0, 12)}';`], ['const ALLOWLIST = [];', `const ALLOWLIST = ${JSON.stringify(allowlist)};`], ['const PRECACHE = [];', `const PRECACHE = ${JSON.stringify(precache)};`]]) {
        if (sw.split(marker).length !== 2) throw new Error(`sw.js template marker missing or repeated: ${marker}`);
        sw = sw.replace(marker, value);
        if (sw.includes(marker)) throw new Error(`sw.js template marker remains: ${marker}`);
      }
      writeFileSync(join(outDir, 'sw.js'), sw);
    },
  };
}

export default defineConfig({
  // Relative URLs: the same build works at a site root, on a sub-path such as GitHub Pages'
  // /king-down-chess/, and in `vite preview`.
  base: './',
  // Both servers listen on 127.0.0.1, the address that the checks call; a `--host` flag overrides it.
  server: { host: '127.0.0.1', port: +(process.env.PORT || 5173), strictPort: true },
  preview: { host: '127.0.0.1' },
  worker: { format: 'es' },
  build: { copyPublicDir: false },
  plugins: [offlineBuild()],
  // Vitest collects the source, tools and Claude hook tests. docs/2d-first-pieces uses node:test (npm test).
  test: { environment: 'node', env: { KINGDOWN_INTERNAL_SECRET: 'kingdown-test-internal-secret-not-for-live-use' }, include: process.env.KINGDOWN_TEST_FILE ? [process.env.KINGDOWN_TEST_FILE] : ['src/**/*.test.ts', 'tools/**/*.test.ts', '.claude/hooks/**/*.test.ts'] },
});
