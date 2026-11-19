import { sourceErrorForms } from './tools/lib/error-forms.mjs';
import { isCharacterRuntimePublic, isCharacterRuntimeStartup } from './tools/lib/character-runtime-public.mjs';
import { privateRuntimeData, validateManifest, validateRuntimeImage } from './tools/lib/character-runtime-guard.mjs';
import { splitManifest, writeRuntimeParts } from './tools/lib/character-runtime-split.mjs';
import { pluginSymbols } from './tools/lib/plugin-symbols.mjs';
import { buildWorker } from './tools/plugin-runtime-build.mjs';
import { launchSource, soloLaunch } from './tools/solo-launch.mjs';
import { configDefaults, defineConfig, type Plugin } from 'vitest/config';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { OutputBundle } from 'rolldown';

const launch = soloLaunch();

const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

/** Code a player may never need: the Supabase client (only for an account). */
const onDemand = /\/src\/(?:account\/client|online\/entry)\.ts$/;

/** Select the local graph and the public art, fonts and icons that it uses. */
export function offlineCacheFiles(bundle: OutputBundle, root: string, files: string[], solo = false) {
  const local = new Set(['src/main.ts', 'src/entry.ts', 'index.html'].map(file => resolve(root, file).replaceAll('\\', '/')));
  if (solo) for (const file of ['next.html', 'src/interface/entry.ts', 'src/interface/launch-entry.ts']) local.add(resolve(root, file).replaceAll('\\', '/'));
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
    && (graph.has(file) || solo && ['interface/stone-refined-light.webp', 'browser-support.js'].includes(file) || isCharacterRuntimeStartup(file) || /^(?:audio\/armour\/[\w-]+\.wav|ui\/[\w/-]+\.(?:webp|png|svg)|fonts\/[\w-]+\.woff2|icons\/[\w-]+\.png|manifest\.webmanifest)$/.test(file))).sort();
  return { allowlist: ['./', 'index.html', ...solo ? ['next.html'] : [], ...publicFiles], precache: ['./', ...solo ? ['index.html', 'next.html'] : [], ...publicFiles] };
}

/** Copy public files and set the exact offline lists and content version. */
function offlineBuild(): Plugin {
  let publicDir = '', outDir = '', root = '';
  return {
    name: 'king-down-offline',
    apply: 'build',
    configResolved(config) { publicDir = config.publicDir; root = config.root; outDir = resolve(root, config.build.outDir); },
    transformIndexHtml: { order: 'post', handler(_html, context) {
      if (launch && context.path === '/next.html') return [{ tag: 'link', attrs: { rel: 'manifest', href: '/manifest.webmanifest' }, injectTo: 'head' }]; 
      // Start the offline cache after the board is ready.
      return [{ tag: 'script', injectTo: 'head', children: `if (${launch ? "['/', '/index.html'].includes(location.pathname)" : "location.pathname === '/'"} && 'serviceWorker' in navigator) addEventListener('load', async () => {
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
      if (launch) for (const file of ['privacy.html', 'terms.html', 'support.html', 'delete-data.html', 'browser-support.js']) cpSync(join(root, 'tools/solo-launch', file), join(outDir, file));
      // The beam is the only effect that reads metadata at runtime.
      const effects = join(outDir, 'character-runtime/effects');
      if (existsSync(effects)) for (const path of walk(effects).filter(path => path.endsWith('/effect.json'))) {
        const meta = JSON.parse(readFileSync(path, 'utf8'));
        if (!meta || typeof meta !== 'object' || Array.isArray(meta)) throw new Error(`Unknown character effect metadata: ${path}`);
        if (meta.id === 'maester-beam' && typeof meta.sprite === 'string' && Array.isArray(meta.shaftSourceRect) && meta.shaftSourceRect.length === 4 && meta.shaftSourceRect.every(Number.isFinite) && typeof meta.flare?.sprite === 'string' && Array.isArray(meta.flare.anchor) && meta.flare.anchor.length === 2 && meta.flare.anchor.every(Number.isFinite)) writeFileSync(path, JSON.stringify({ sprite: meta.sprite, shaftSourceRect: meta.shaftSourceRect, flare: { sprite: meta.flare.sprite, anchor: meta.flare.anchor } }) + '\n');
        else if (Object.keys(meta).length === 0 || ['archer-golden-arrow-flight-v1', 'queen-thorns-directional-v1'].includes(meta.id)) writeFileSync(path, '{}\n');
        else throw new Error(`Unknown character effect metadata: ${path}`);
      }
      // The game loads the index and the parts of its figures, not the whole manifest (tools/lib/character-runtime-split.mjs).
      const manifest = join(outDir, 'character-runtime/manifest.json');
      if (existsSync(manifest)) writeRuntimeParts(join(outDir, 'character-runtime'), validateManifest(JSON.parse(readFileSync(manifest, 'utf8'))));
      if (launch) {
        writeFileSync(join(outDir, 'solo-launch.json'), JSON.stringify({ soloLaunch: true }) + '\n');
        const manifest = JSON.parse(readFileSync(join(outDir, 'manifest.webmanifest'), 'utf8'));
        Object.assign(manifest, { name: 'King Down', description: 'Chess with new pieces, king powers and cards. Play on this device, or play a person online.', background_color: '#f5f0e4', theme_color: '#f5f0e4' });
        writeFileSync(join(outDir, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');
      }
      const files = walk(outDir).map(path => relative(outDir, path).split(sep).join('/')).filter(f => f !== 'sw.js' && !f.startsWith('.well-known/')).sort();
      for (const file of files.filter(file => file.startsWith('character-runtime/'))) {
        const contents = readFileSync(join(outDir, file));
        if (privateRuntimeData(contents, file.endsWith('.json'))) throw new Error(`Private character runtime data: ${file}`);
        if (file === 'character-runtime/manifest.json') writeFileSync(join(outDir, file), JSON.stringify(validateManifest(JSON.parse(contents.toString('utf8')))) + '\n');
        validateRuntimeImage(contents, file);
      }
      const template = readFileSync(launch ? join(root, 'tools/solo-launch/sw.js') : join(publicDir, 'sw.js'), 'utf8');
      const hash = createHash('sha256').update(template); // a change to the worker itself is a new version too
      for (const f of files.filter(file => !file.startsWith('character-runtime/') || isCharacterRuntimeStartup(file) || file === 'character-runtime/manifest.json')) hash.update(f).update(readFileSync(join(outDir, f)));
      const { allowlist, precache } = offlineCacheFiles(bundle, root, files, launch);
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

/** The dev server answers the runtime's index and parts from public/character-runtime/manifest.json, as the build writes them. */
function characterRuntimeParts(): Plugin {
  let cached: { mtime: number, index: string, files: Record<string, string> } | null = null;
  return {
    name: 'character-runtime-parts',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = /^\/character-runtime\/(index\.json|parts\/[^/?]+\.json)(?:\?|$)/.exec(req.url ?? '')?.[1];
        const source = join(server.config.publicDir, 'character-runtime/manifest.json');
        if (!path || !existsSync(source)) return next();
        const mtime = statSync(source).mtimeMs;
        if (cached?.mtime !== mtime) cached = { mtime, ...splitManifest(validateManifest(JSON.parse(readFileSync(source, 'utf8')))) };
        const { index, files } = cached!, body = path === 'index.json' ? index : files[path];
        if (body === undefined) return next();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(body);
      });
    },
  };
}

/** Imported table rules must reach both the playing board and the setup board. */
export function sharedSeatSelectors() {
  return { postcssPlugin: 'shared-seat-selectors', Rule(rule: { selector: string }) {
    rule.selector = rule.selector.replace(/#(game-table|strip-me|strip-them|context-line|context-text|moves-line|last-move|table-bar)\b(?!,\[data-seat-id=)/g, ':is(#$1,[data-seat-id="$1"])');
  } };
}

export default defineConfig(({ command }) => {
  if (command === 'build' && process.env.KINGDOWN_LOCAL_ONLINE === '1') throw new Error('Local online stack refuses builds');
  const localOnline = command === 'serve' && process.env.KINGDOWN_LOCAL_ONLINE === '1' && !launch;
  if (localOnline) {
    if (process.env.NODE_ENV === 'production' || process.env.KINGDOWN_STAGE || process.env.VITE_KINGDOWN_STAGE) throw new Error('Local online stack refuses production or staging mode');
    const urls = [new URL(process.env.VITE_SUPABASE_URL ?? ''), new URL(process.env.KINGDOWN_LOCAL_API_ORIGIN ?? '')];
    if (urls.some(url => url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash)) {
      throw new Error('Local online stack requires bare loopback HTTP origins for VITE_SUPABASE_URL and KINGDOWN_LOCAL_API_ORIGIN');
    }
  }
  return {
  // Account routes share the site root; their assets must not resolve below /play/ or /g/.
  base: '/',
  define: { __KINGDOWN_SOLO_LAUNCH__: JSON.stringify(launch), __KINGDOWN_CHARACTER_RUNTIME__: JSON.stringify(existsSync(new URL('./public/character-runtime/manifest.json', import.meta.url))), __KINGDOWN_ERROR_FORMS__: JSON.stringify(sourceErrorForms().filter(parts => launch || ![
      'Solo games run on this device.', 'The computer plays on this device.', 'This game cannot open on this device.',
      'This game needs the online page.', 'This game version cannot open on this device. Your online game stays saved.', 'Your online game stays saved.',
    ].includes(parts.join('')))), __KINGDOWN_BUILD__: JSON.stringify(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()),
    __KINGDOWN_LOCAL_ONLINE__: JSON.stringify(localOnline) },
  // Both servers listen on 127.0.0.1, the address that the checks call; a `--host` flag overrides it.
  server: { host: '127.0.0.1', port: +(process.env.PORT || 5173), strictPort: true, ...(localOnline && { proxy: { '/api': { target: process.env.KINGDOWN_LOCAL_API_ORIGIN!, changeOrigin: false } } }) },
  preview: { host: '127.0.0.1', ...(localOnline && { proxy: { '/api': { target: process.env.KINGDOWN_LOCAL_API_ORIGIN!, changeOrigin: false } } }) },
  worker: { format: 'es' },
  // Vite 8's default target, pinned: the iOS app floor (IPHONEOS_DEPLOYMENT_TARGET 16.4) depends on it. Raise both together.
  // The old screens, the new interface and the isolated painted moments demo.
  build: { copyPublicDir: false, target: ['chrome111', 'edge111', 'firefox114', 'safari16.4', 'ios16.4'],
    rollupOptions: { output: { manualChunks(id) {
      // These shared state helpers load together on home. Keep the board and search as lazy imports.
      if (/\/src\/(?:turn|screen\/save|account\/(?:local|sync)|ai\/skill)\.ts$/.test(id)) return 'local-state';
    } }, input: { index: fileURLToPath(new URL('./index.html', import.meta.url)), next: fileURLToPath(new URL('./next.html', import.meta.url)), moments: fileURLToPath(new URL('./moments.html', import.meta.url)), ...(process.env.KINGDOWN_TEST_PAGES === '1' ? { people: fileURLToPath(new URL('./people.html', import.meta.url)) } : {}) } } },
  css: { postcss: { plugins: [sharedSeatSelectors()] } },
  plugins: [{ name: 'interface-home-preload', apply: 'build', transformIndexHtml: { order: 'post', handler(_html, context) {
    if (context.path !== '/next.html' || !context.bundle) return;
    const main = Object.values(context.bundle).find(file => file.type === 'chunk' && file.facadeModuleId?.endsWith('/src/interface/play/main.ts'));
    if (!main) throw new Error('The interface home chunk is missing');
    const files = new Set<string>();
    const visit = (name: string) => {
      if (files.has(name)) return;
      files.add(name); const file = context.bundle![name];
      if (file?.type === 'chunk') for (const next of [...file.imports, ...(file.viteMetadata?.importedCss ?? [])]) visit(next);
    };
    visit(main.fileName);
    const platform = Object.values(context.bundle).find(file => file.type === 'chunk' && file.facadeModuleId?.endsWith('/src/interface/platform.ts'));
    if (platform) visit(platform.fileName);
    return [...files].map(name => ({ tag: 'link', attrs: name.endsWith('.css')
      ? { rel: 'preload', as: 'style', crossorigin: '', href: '/' + name }
      : { rel: 'modulepreload', crossorigin: '', href: '/' + name }, injectTo: 'head' as const }));
  } } }, { name: 'solo-launch-source', apply: 'build', enforce: 'pre', transform(code, id) { return launchSource(code, id, launch); }, transformIndexHtml: { order: 'pre', handler(html, context) { return launch && context.path === '/next.html' ? readFileSync(join(fileURLToPath(new URL('.', import.meta.url)), 'tools/solo-launch/next.html'), 'utf8').replace('/src/interface/entry.ts', '/src/interface/launch-entry.ts') : html; } } }, { name: 'solo-launch-preview', configurePreviewServer(server) {
    if (!existsSync(resolve(server.config.root, server.config.build.outDir, 'solo-launch.json'))) return;
    server.middlewares.use((req, res, next) => {
      const path = new URL(req.url ?? '/', 'http://localhost').pathname;
      if (/^\/(?:play(?:\/.*)?|g\/[^/]+\/?|j\/?)$/.test(path)) { req.url = '/index.html'; return next(); }
      if (path === '/') { req.url = '/next.html'; return next(); }
      if (!existsSync(resolve(server.config.root, server.config.build.outDir, '.' + path))) {
        res.statusCode = 404; res.setHeader('Content-Type', 'text/html');
        res.end(readFileSync(resolve(server.config.root, server.config.build.outDir, 'next.html'))); return;
      }
      next();
    });
  } }, pluginSymbols(), offlineBuild(), characterRuntimeParts(), { name: 'account-engine-identity', ...(localOnline ? {} : { apply: 'build' as const }), async config() {
    return { define: { __KINGDOWN_PAGE_ENGINE__: JSON.stringify((await buildWorker()).engine) } };
  } }],
  // Vitest collects the source, tools and Claude hook tests. Painted .mjs tests use node:test (npm test).
  // Browser and engine checks share CPU; excess workers cause false timeouts. CI leaves out (KINGDOWN_TEST_SKIP) the
  // files that it runs in a job of their own.
  test: { maxWorkers: 4, passWithNoTests: process.env.KINGDOWN_TEST_FILE?.includes('.mjs') ?? false, environment: 'node', env: { KINGDOWN_INTERNAL_SECRET: 'kingdown-test-internal-secret-not-for-live-use' }, globalSetup: ['tools/test-lock-guard.ts'],
    // `npm run test:docs` (KINGDOWN_TEST_DOCS) runs the doc lints only, so the mark cannot open the other tests.
    include: process.env.KINGDOWN_TEST_DOCS ? ['src', 'tools', '.claude/hooks'].map(dir => `${dir}/**/*.docs.test.ts`)
      : process.env.KINGDOWN_TEST_FILE ? [process.env.KINGDOWN_TEST_FILE] : ['src/**/*.test.ts', 'tools/**/*.test.ts', '.claude/hooks/**/*.test.ts'],
    exclude: [...configDefaults.exclude, '**/*.test.mjs', ...(process.env.KINGDOWN_TEST_SKIP ? [process.env.KINGDOWN_TEST_SKIP] : [])], ...(process.env.KINGDOWN_TEST_NAME && { testNamePattern: new RegExp(process.env.KINGDOWN_TEST_NAME) }) },
  };
});
