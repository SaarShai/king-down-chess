import { sourceErrorForms } from './tools/lib/error-forms.mjs';
import { isCharacterRuntimePublic } from './tools/lib/character-runtime-public.mjs';
import { pluginSymbols } from './tools/lib/plugin-symbols.mjs';
import { buildWorker } from './tools/plugin-runtime-build.mjs';
import { configDefaults, defineConfig, type Plugin } from 'vitest/config';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { OutputBundle } from 'rolldown';

const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

/** Code a player may never need: the Supabase client (only for an account). */
const onDemand = /\/src\/(?:account\/client|online\/entry)\.ts$/;

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
  // Optional clips load only with motion; the offline board can use the plain figures.
  const publicFiles = files.filter(file => !/^assets\/(?:tap|slam)-[\w-]+\.webp$/.test(file)
    && (graph.has(file) || /^(?:ui\/[\w/-]+\.(?:webp|png|svg)|fonts\/[\w-]+\.woff2|icons\/[\w-]+\.png|manifest\.webmanifest)$/.test(file))).sort();
  return { allowlist: ['./', 'index.html', ...publicFiles], precache: ['./', ...publicFiles] };
}

/** Copy public files and set the exact offline lists and content version. */
function offlineBuild(): Plugin {
  let publicDir = '', outDir = '', root = '';
  return {
    name: 'king-down-offline',
    apply: 'build',
    configResolved(config) { publicDir = config.publicDir; root = config.root; outDir = resolve(root, config.build.outDir); },
    transformIndexHtml: { order: 'post', handler() {
      // Start the offline cache after the board is ready.
      return [{ tag: 'script', injectTo: 'head', children: `if (location.pathname === '/' && 'serviceWorker' in navigator) addEventListener('load', async () => {
  for (let t = 0; !window.view && t < 300; t++) await new Promise(r => setTimeout(r, 200));
  await Promise.race([window.view?.ready(), new Promise(r => setTimeout(r, 60000))]);
  navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
});` }];
    } },
    writeBundle(_options, bundle) {
      cpSync(publicDir, outDir, { recursive: true, filter: path => {
        const file = relative(publicDir, path).split(sep).join('/');
        if (file.startsWith('character-runtime/effects/') && /(?:^|\/)provenance(?:\/|$)/.test(file)) return false;
        return !file.startsWith('character-runtime/') || statSync(path).isDirectory() || isCharacterRuntimePublic(file);
      } });
      // The beam is the only effect that reads metadata at runtime.
      const effects = join(outDir, 'character-runtime/effects');
      if (existsSync(effects)) for (const path of walk(effects).filter(path => path.endsWith('/effect.json'))) {
        const meta = JSON.parse(readFileSync(path, 'utf8'));
        if (meta.id === 'maester-beam' && meta.sprite && meta.shaftSourceRect && meta.flare?.sprite && meta.flare?.anchor) writeFileSync(path, JSON.stringify({ sprite: meta.sprite, shaftSourceRect: meta.shaftSourceRect, flare: { sprite: meta.flare.sprite, anchor: meta.flare.anchor } }) + '\n');
        else if (Object.keys(meta).length === 0 || ['archer-golden-arrow-flight-v1', 'queen-thorns-directional-v1'].includes(meta.id)) writeFileSync(path, '{}\n');
        else throw new Error(`Unknown character effect metadata: ${path}`);
      }
      const files = walk(outDir).map(path => relative(outDir, path).split(sep).join('/')).filter(f => f !== 'sw.js' && !f.startsWith('.well-known/')).sort();
      for (const file of files.filter(file => file.startsWith('character-runtime/'))) {
        const contents = readFileSync(join(outDir, file));
        if (contents.includes('/Users/') || /\.codex|generated_images|"(?:prompt|provider|sourcePath|originalPath)"\s*:/.test(contents.toString('utf8'))) throw new Error(`Private character runtime data: ${file}`);
      }
      const template = readFileSync(join(publicDir, 'sw.js'), 'utf8');
      const hash = createHash('sha256').update(template); // a change to the worker itself is a new version too
      for (const f of files.filter(file => !file.startsWith('character-runtime/'))) hash.update(f).update(readFileSync(join(outDir, f)));
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

/** Imported table rules must reach both the playing board and the setup board. */
export function sharedSeatSelectors() {
  return { postcssPlugin: 'shared-seat-selectors', Rule(rule: { selector: string }) {
    rule.selector = rule.selector.replace(/#(game-table|strip-me|strip-them|context-line|context-text|moves-line|last-move|table-bar)\b(?!,\[data-seat-id=)/g, ':is(#$1,[data-seat-id="$1"])');
  } };
}

export default defineConfig({
  // Account routes share the site root; their assets must not resolve below /play/ or /g/.
  base: '/',
  define: { __KINGDOWN_CHARACTER_RUNTIME__: JSON.stringify(existsSync(new URL('./public/character-runtime/manifest.json', import.meta.url))), __KINGDOWN_ERROR_FORMS__: JSON.stringify(sourceErrorForms()), __KINGDOWN_BUILD__: JSON.stringify(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()) },
  // Both servers listen on 127.0.0.1, the address that the checks call; a `--host` flag overrides it.
  server: { host: '127.0.0.1', port: +(process.env.PORT || 5173), strictPort: true },
  preview: { host: '127.0.0.1' },
  worker: { format: 'es' },
  build: { copyPublicDir: false },
  css: { postcss: { plugins: [sharedSeatSelectors()] } },
  plugins: [pluginSymbols(), offlineBuild(), { name: 'account-engine-identity', apply: 'build', async config() {
    return { define: { __KINGDOWN_PAGE_ENGINE__: JSON.stringify((await buildWorker()).engine) } };
  } }],
  // Vitest collects the source, tools and Claude hook tests. docs/2d-first-pieces uses node:test (npm test).
  // Browser and engine checks share CPU; excess workers cause false timeouts. CI leaves out (KINGDOWN_TEST_SKIP) the
  // files that it runs in a job of their own.
  test: { maxWorkers: 4, environment: 'node', env: { KINGDOWN_INTERNAL_SECRET: 'kingdown-test-internal-secret-not-for-live-use' }, globalSetup: ['tools/test-lock-guard.ts'],
    // `npm run test:docs` (KINGDOWN_TEST_DOCS) runs the doc lints only, so the mark cannot open the other tests.
    include: process.env.KINGDOWN_TEST_DOCS ? ['src', 'tools', '.claude/hooks'].map(dir => `${dir}/**/*.docs.test.ts`)
      : process.env.KINGDOWN_TEST_FILE ? [process.env.KINGDOWN_TEST_FILE] : ['src/**/*.test.ts', 'tools/**/*.test.ts', '.claude/hooks/**/*.test.ts'],
    exclude: [...configDefaults.exclude, ...(process.env.KINGDOWN_TEST_SKIP ? [process.env.KINGDOWN_TEST_SKIP] : [])], ...(process.env.KINGDOWN_TEST_NAME && { testNamePattern: new RegExp(process.env.KINGDOWN_TEST_NAME) }) },
});
