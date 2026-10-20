import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { OutputAsset, OutputBundle, OutputChunk } from 'rolldown';
import { build } from 'vite';
import { expect, it } from 'vitest';
import { offlineCacheFiles } from '../vite.config';

const root = resolve('/local-site');
const chunk = (name: string, facade: string | null, imports: string[] = [], dynamicImports: string[] = [], css: string[] = [], assets: string[] = []) => ({
  type: 'chunk', fileName: name, facadeModuleId: facade, imports, dynamicImports,
  viteMetadata: { importedCss: new Set(css), importedAssets: new Set(assets) },
}) as OutputChunk;
const asset = (name: string, assets: string[] = []) => ({
  type: 'asset', fileName: name, source: '', viteMetadata: { importedCss: new Set(), importedAssets: new Set(assets) },
}) as OutputAsset;

function fixture() {
  const output = [
    chunk('assets/root.js', join(root, 'index.html'), [], ['assets/main.js', 'assets/web-entry.js']),
    chunk('assets/main.js', join(root, 'src/main.ts'), ['assets/shared.js'], ['assets/workshop.js', 'assets/client.js'], ['assets/main.css'], ['assets/worker.js']),
    chunk('assets/shared.js', null, ['assets/main.js']),
    chunk('assets/workshop.js', join(root, 'src/workshop/ground.ts'), [], ['assets/lesson.js']),
    chunk('assets/lesson.js', join(root, 'src/screen/lesson.ts')),
    chunk('assets/play.js', join(root, 'play.html'), ['assets/shared.js'], ['assets/account.js']),
    chunk('assets/account.js', join(root, 'src/online/account.ts'), [], [], ['assets/account.css'], ['assets/account.webp']),
    chunk('assets/client.js', join(root, 'src/account/client.ts'), ['assets/vendor.js']),
    chunk('assets/vendor.js', null),
    chunk('assets/web-entry.js', join(root, 'src/online/entry.ts'), ['assets/private-runtime.js']),
    chunk('assets/private-runtime.js', join(root, 'src/account-game/runtime.ts')),
    asset('assets/worker.js'), asset('assets/main.css', ['assets/font.woff2', 'assets/local.webp']),
    asset('assets/font.woff2'), asset('assets/local.webp'), asset('assets/main.js.map'),
    asset('assets/account.css'), asset('assets/account.webp'), asset('play.html'), asset('.vite/manifest.json'),
  ];
  const bundle = Object.fromEntries(output.map(file => [file.fileName, file])) as OutputBundle;
  const files = [...Object.keys(bundle), 'index.html', 'sw.js', 'manifest.webmanifest',
    'ui/pawn.webp', 'ui/icons/pawn.svg', 'fonts/cinzel.woff2', 'icons/icon-192.png',
    'privacy.html', 'terms.html', 'support.html', 'delete-data.html',
    'ui/consent.mjs', 'ui/private.html', 'fonts/license.txt', 'icons/account.json',
    '.well-known/openai-apps-challenge', '.well-known/oauth-protected-resource', 'consent.mjs', 'auth/callback.html'];
  return { bundle, files };
}

it('selects the local loader, static and dynamic graph, AI worker, CSS and assets', () => {
  const { bundle, files } = fixture();
  const { allowlist, precache } = offlineCacheFiles(bundle, root, files);
  expect(precache).toEqual(['./', ...[
    'assets/root.js', 'assets/main.js', 'assets/shared.js', 'assets/workshop.js', 'assets/lesson.js',
    'assets/worker.js', 'assets/main.css', 'assets/font.woff2', 'assets/local.webp',
    'ui/pawn.webp', 'ui/icons/pawn.svg', 'fonts/cinzel.woff2', 'icons/icon-192.png', 'manifest.webmanifest',
  ].sort()]);
  expect(allowlist).toEqual(['./', 'index.html', ...precache.slice(1)]);
  expect(precache.every(file => allowlist.includes(file))).toBe(true);
});

it('excludes other entries, account-only output, maps, metadata, auth and legal files', () => {
  const { bundle, files } = fixture();
  const { allowlist, precache } = offlineCacheFiles(bundle, root, files);
  const excluded = files.filter(file => !allowlist.includes(file));
  expect(excluded).toEqual(expect.arrayContaining([
    'assets/web-entry.js', 'assets/private-runtime.js', 'assets/play.js', 'assets/account.js', 'assets/account.css', 'assets/account.webp', 'assets/client.js', 'assets/vendor.js',
    'assets/main.js.map', 'play.html', 'sw.js', '.vite/manifest.json', 'consent.mjs', 'auth/callback.html',
    'privacy.html', 'terms.html', 'support.html', 'delete-data.html', 'ui/consent.mjs', 'ui/private.html', 'fonts/license.txt', 'icons/account.json',
    '.well-known/openai-apps-challenge', '.well-known/oauth-protected-resource',
  ]));
  expect(precache).not.toContain('index.html');
});

it('does not select an account entry just because it has the same chunk name', () => {
  const { bundle, files } = fixture();
  (bundle['assets/main.js'] as OutputChunk).facadeModuleId = '/other/src/main.ts';
  (bundle['assets/root.js'] as OutputChunk).facadeModuleId = join(root, 'account/index.html');
  expect(offlineCacheFiles(bundle, root, files).precache.filter(file => file.startsWith('assets/'))).toEqual([]);
});

it('fails when a required graph file is absent from the bundle or written tree', () => {
  const { bundle, files } = fixture();
  expect(() => offlineCacheFiles(bundle, root, files.filter(file => file !== 'assets/worker.js'))).toThrow('Invalid offline graph file: assets/worker.js');
  delete bundle['assets/worker.js'];
  expect(() => offlineCacheFiles(bundle, root, files)).toThrow('Missing offline graph file: assets/worker.js');
});

it('rejects a non-public graph file rather than adding private HTML to the list', () => {
  const { bundle, files } = fixture();
  (bundle['assets/main.js'] as OutputChunk).viteMetadata!.importedAssets.add('play.html');
  expect(() => offlineCacheFiles(bundle, root, files)).toThrow('Invalid offline graph file: play.html');
});

function site() {
  const dir = mkdtempSync(join(tmpdir(), 'kingdown-offline-build-'));
  const write = (file: string, value: string) => {
    mkdirSync(resolve(dir, file, '..'), { recursive: true });
    writeFileSync(join(dir, file), value);
  };
  mkdirSync(join(dir, 'public'));
  cpSync(resolve('public/sw.js'), join(dir, 'public/sw.js'), { recursive: true });
  write('public/ui/pawn.webp', 'public art');
  write('index.html', '<!doctype html><html><head><script type="module" src="/src/entry.ts"></script></head><body><svg><symbol id="piece"><path d="M0 0h1v1z"/></symbol><use href="#piece"/></svg><img src="./ui/pawn.webp"/><a href="/privacy.html">Privacy</a></body></html>');
  write('play.html', '<script type="module" src="/src/private.ts"></script>');
  write('src/entry.ts', "await import('./main');");
  write('src/main.ts', "import './local.css'; import './shared'; new Worker(new URL('./ai/worker.ts', import.meta.url), { type: 'module' }); window.publicArt = import.meta.env.BASE_URL + 'ui/pawn.webp'; window.openWorkshop = () => import('./workshop'); window.signIn = () => import('./account/client');");
  write('src/local.css', '@font-face { font-family: Local; src: url(./font.woff2); } body { background-image: url(./art.svg); }');
  write('src/font.woff2', 'font bytes'); write('src/art.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>');
  write('src/shared.ts', 'console.log("shared local code");');
  write('src/ai/worker.ts', 'self.onmessage = () => self.postMessage("AI ready");');
  write('src/workshop.ts', 'export const design = "local design";');
  write('src/account/client.ts', 'export const token = "account only";');
  write('src/private.ts', 'import "./shared"; console.log("private page");');
  return { dir, write };
}

const compile = (root: string) => build({
  configFile: resolve('vite.config.ts'), root, envFile: false, logLevel: 'silent',
  build: { assetsInlineLimit: 0, rollupOptions: { input: { index: join(root, 'index.html'), play: join(root, 'play.html') } } },
});
const lists = (worker: string) => ({
  allowlist: JSON.parse(/const ALLOWLIST = (\[.*\]);/.exec(worker)![1]) as string[],
  precache: JSON.parse(/const PRECACHE = (\[.*\]);/.exec(worker)![1]) as string[],
});

it('uses real build metadata for the worker, loader, lazy code, CSS and emitted assets', async () => {
  const { dir } = site();
  try {
    await compile(dir);
    const output = join(dir, 'dist'), worker = readFileSync(join(output, 'sw.js'), 'utf8');
    const { allowlist, precache } = lists(worker);
    const assets = readdirSync(join(output, 'assets'));
    const named = (prefix: string, extension = 'js') => `assets/${assets.find(file => file.startsWith(prefix + '-') && file.endsWith('.' + extension))!}`;
    for (const file of [named('index'), named('main'), named('worker'), named('workshop'), named('main', 'css'), named('font', 'woff2'), named('art', 'svg')]) {
      expect(file).not.toContain('undefined'); expect(precache).toContain(file);
      expect(readFileSync(join(output, file)).length).toBeGreaterThan(0);
    }
    expect(allowlist).not.toContain('play.html');
    expect(allowlist).not.toContain(named('play'));
    expect(allowlist).not.toContain(named('client'));
    expect(worker).toMatch(/const VERSION = '[a-f0-9]{12}';/);
    expect(worker).toContain("const POLICY = 'public-build-v1';");
    expect(worker).not.toContain("const VERSION = 'dev';");
    expect(worker).not.toContain('const ALLOWLIST = [];'); expect(worker).not.toContain('const PRECACHE = [];');
    const html = readFileSync(join(output, 'index.html'), 'utf8');
    const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]).filter(url => !url.startsWith('#'));
    expect(urls.some(url => url.startsWith('/assets/'))).toBe(true);
    expect(urls).toContain('/ui/pawn.webp');
    for (const path of ['/play/', '/g/game-id']) {
      for (const url of urls) expect(new URL(url, `https://kingdown.test${path}`).pathname, url).toBe(url);
    }
    expect(html).toContain('href="#piece"');
    expect(html).not.toContain('<base');
    expect(html).toContain("register('/sw.js')");
    expect(readFileSync(join(output, named('main')), 'utf8')).toContain('/ui/pawn.webp');
    expect(readFileSync(join(output, named('main', 'css')), 'utf8')).toMatch(/url\(["']?\/assets\//);

  } finally { rmSync(dir, { recursive: true, force: true }); }
});

it.each(["const VERSION = 'dev';", 'const ALLOWLIST = [];', 'const PRECACHE = [];'])('fails a build if the worker marker is absent or repeated: %s', async marker => {
  const { dir, write } = site();
  const original = readFileSync(resolve('public/sw.js'), 'utf8');
  try {
    for (const source of [original.replace(marker, ''), original + '\n' + marker]) {
      write('public/sw.js', source);
      await expect(compile(dir)).rejects.toThrow('sw.js template marker missing or repeated');
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
