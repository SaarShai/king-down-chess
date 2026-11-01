import { spawnSync } from 'node:child_process';
import { symlinkSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { runInNewContext } from 'node:vm';
import { join, resolve } from 'node:path';
import type { OutputAsset, OutputBundle, OutputChunk } from 'rolldown';
import { build } from 'vite';
import { expect, it } from 'vitest';
import { offlineCacheFiles } from '../vite.config';
import { isCharacterRuntimePublic } from './lib/character-runtime-public.mjs';
import { privateRuntimeData, validateManifest, validateRuntimeImage } from './lib/character-runtime-guard.mjs';

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

it('F7: the offline install does not fetch optional clip sheets', () => {
  const { bundle, files } = fixture();
  const clips = ['assets/tap-Abcd1234.webp', 'assets/slam-Efgh5678.webp'];
  for (const name of [...clips, 'assets/knight-Abcd1234.webp']) {
    bundle[name] = asset(name); files.push(name);
    (bundle['assets/main.js'] as OutputChunk).viteMetadata!.importedAssets.add(name);
  }
  const { allowlist, precache } = offlineCacheFiles(bundle, root, files);
  for (const file of clips) {
    expect(precache).not.toContain(file);
    expect(allowlist).not.toContain(file);
  }
  expect(precache).toContain('assets/knight-Abcd1234.webp');
});

it('keeps optional runtime files and provenance out of the worker', () => {
  const { bundle, files } = fixture();
  const runtime = ['character-runtime/manifest.json', `character-runtime/assets/${'a'.repeat(64)}.webp`,
    `character-runtime/effects/${'b'.repeat(64)}/effect.mjs`, `character-runtime/effects/${'b'.repeat(64)}/effect.json`,
    `character-runtime/effects/${'b'.repeat(64)}/assets/image.png`];
  const effect = `character-runtime/effects/${'b'.repeat(64)}`;
  const excluded = ['character-runtime/assets.json', 'character-runtime/assets/private.json', `${effect}/provenance/source.json`, `${effect}/provenance/source.mjs`, `${effect}/sources.json`];
  files.push(...runtime, ...excluded);
  const { allowlist, precache } = offlineCacheFiles(bundle, root, files);
  for (const file of runtime) { expect(isCharacterRuntimePublic(file)).toBe(true); expect(allowlist).not.toContain(file); expect(precache).not.toContain(file); }
  for (const file of excluded) { expect(isCharacterRuntimePublic(file)).toBe(false); expect(allowlist).not.toContain(file); expect(precache).not.toContain(file); }
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
  write('index.html', '<!doctype html><html><head><script type="module" src="/src/entry.ts"></script></head><body><svg><symbol id="piece"><path d="M0 0h1v1z"/></symbol><use href="#piece"/></svg><img src="/ui/pawn.webp"/><a href="/privacy.html">Privacy</a></body></html>');
  write('play.html', '<script type="module" src="/src/private.ts"></script>');
  write('src/entry.ts', "await import('./main');");
  write('src/main.ts', "import './local.css'; import './shared'; new Worker(new URL('./ai/worker.ts', import.meta.url), { type: 'module' }); window.publicArt = import.meta.env.BASE_URL + 'ui/pawn.webp'; window.openWorkshop = () => import('./workshop'); window.signIn = () => import('./account/client');");
  write('src/local.css', '@font-face { font-family: Local; src: url(./font.woff2); } body { background-image: url(./art.svg); }');
  write('src/font.woff2', 'font bytes'); write('src/art.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>');
  write('src/knight/tap.webp', 'optional knight clip'); write('src/rook/slam.webp', 'optional rook clip');
  write('src/shared.ts', 'console.log(new URL("./knight/tap.webp", import.meta.url), new URL("./rook/slam.webp", import.meta.url));');
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


it('publishes only runtime effect metadata and omits provenance', async () => {
  const { dir, write } = site();
  const effect = `character-runtime/effects/${'b'.repeat(64)}`;
  write(`public/${effect}/effect.json`, JSON.stringify({id:'maester-beam',sprite:'assets/beam.png', shaftSourceRect:[1,2,3,4], sourcePath:'/Users/private', flare:{sprite:'assets/flare.png', anchor:[2,3], prompt:'private', provider:'private'}}));
  write(`public/${effect}/provenance/source.json`, '{"prompt":"private"}');
  write(`public/${effect}/provenance/source.mjs`, 'private');
  write(`public/${effect}/sources.json`, 'private');
  write('public/character-runtime/assets.json', 'private');
  write('public/character-runtime/assets/private.json', 'private');
  try {
    await compile(dir);
    const output = join(dir, 'dist', effect);
    expect(JSON.parse(readFileSync(join(output, 'effect.json'), 'utf8'))).toEqual({sprite:'assets/beam.png', shaftSourceRect:[1,2,3,4], flare:{sprite:'assets/flare.png', anchor:[2,3]}});
    expect(readdirSync(output)).toEqual(['effect.json']);
    const runtime = join(dir, 'dist/character-runtime');
    for (const file of readdirSync(runtime, { recursive: true, withFileTypes: true }).filter(entry => entry.isFile())) {
      const path = join(file.parentPath, file.name).slice(join(dir, 'dist').length + 1).replaceAll('\\', '/');
      expect(isCharacterRuntimePublic(path), path).toBe(true);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

it.each(['/home/private', '/private/tmp/a', '/var/folders/a', 'file:///tmp/a', '{"localPath":"x"}', '{"sourceImagePath":"x"}', '{"sourceFramePath":"x"}', '{"reviewNotes":"x"}', '{"reviewer":"x"}', '/Users/private', '{"prompt":"private"}', '{"provider":"private"}', '.codex', 'generated_images', '{"sourcePath":"private"}', '{"originalPath":"private"}'])('fails a build if published runtime data contains %s', async privateData => {
  const { dir, write } = site();
  write(`public/character-runtime/effects/${'b'.repeat(64)}/effect.mjs`, privateData);
  try { await expect(compile(dir)).rejects.toThrow('Private character runtime data'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

it('rejects unknown manifest fields, metadata chunks and invalid beam field types', async () => {
  const manifest = JSON.parse(readFileSync(resolve('public/character-runtime/manifest.json'), 'utf8'));
  validateManifest(manifest);
  manifest.banks[0].frames[0].generator = { model: 'private' };
  expect(() => validateManifest(manifest)).toThrow('Unknown character manifest metadata');
  const png = Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'), Buffer.from('000000006361425800000000','hex')]);
  expect(() => validateRuntimeImage(png, 'bad.png')).toThrow('PNG chunk');
  const webp = Buffer.concat([Buffer.from('524946460c00000057454250','hex'), Buffer.from('4558494600000000','hex')]);
  expect(() => validateRuntimeImage(webp, 'bad.webp')).toThrow('WebP chunk');
  expect(privateRuntimeData(Buffer.from('/home/private'))).toBe(true);
  expect(privateRuntimeData(Buffer.from('{\"path\":\"C:\\\\private\\\\file\"}'), true)).toBe(true);
  expect(privateRuntimeData(Buffer.from('export const f=(x,a)=>x?a:/re/.test(x);'))).toBe(false);
  const iccp = Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'), Buffer.from('0000000969434350','hex'), Buffer.from('/Users/za'), Buffer.alloc(4)]);
  expect(privateRuntimeData(iccp)).toBe(true);
  expect(() => validateRuntimeImage(iccp, 'bad.png')).toThrow('PNG chunk');
  const { dir, write } = site();
  write(`public/character-runtime/effects/${'b'.repeat(64)}/effect.json`, JSON.stringify({id:'maester-beam', sprite:'a', shaftSourceRect:'x', flare:{sprite:'b',anchor:[1,2]}}));
  try { await expect(compile(dir)).rejects.toThrow('Unknown character effect metadata'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

it('rejects a binary path in an iCCP chunk and accepts a JavaScript regex', async () => {
 const {dir,write}=site(), effect=`public/character-runtime/effects/${'b'.repeat(64)}`;
 try {
  write(`${effect}/effect.mjs`, 'export const f=(x,a)=>x?a:/re/.test(x);');
  await expect(compile(dir)).resolves.toBeDefined();
  const iccp=Buffer.concat([Buffer.from('89504e470d0a1a0a0000000969434350','hex'),Buffer.from('/Users/za'),Buffer.alloc(4)]);
  write(`${effect}/assets/a.png`, '');writeFileSync(join(dir,`${effect}/assets/a.png`),iccp);
  await expect(compile(dir)).rejects.toThrow('Private character runtime data');
 } finally {rmSync(dir,{recursive:true,force:true});}
});

it('rejects unknown nested manifest fields in a build', async () => {
  const { dir, write } = site();
  write('public/character-runtime/manifest.json', JSON.stringify({schemaVersion:1,effects:{},banks:[{beatTimes:{},effectAnchors:[],frames:[{url:'x',generator:{model:'private'}}]}]}));
  try { await expect(compile(dir)).rejects.toThrow('Unknown character manifest metadata'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

it.each([
  {id:'maester-beam',sprite:7,shaftSourceRect:[1,2,3,4],flare:{sprite:'b',anchor:[1,2]}},
  {id:'maester-beam',sprite:'a',shaftSourceRect:[1,2,3,'4'],flare:{sprite:'b',anchor:[1,2]}},
  {id:'maester-beam',sprite:'a',shaftSourceRect:[1,2,3,4],flare:{sprite:9,anchor:[1,2]}},
  {id:'maester-beam',sprite:'a',shaftSourceRect:[1,2,3,4],flare:{sprite:'b',anchor:[1,'2']}},
  [],
])('rejects an invalid beam field in a build', async meta => {
  const { dir, write } = site();
  write(`public/character-runtime/effects/${'b'.repeat(64)}/effect.json`, JSON.stringify(meta));
  try { await expect(compile(dir)).rejects.toThrow('Unknown character effect metadata'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

it.each([
  ['bad.png', '89504e470d0a1a0a000000006361425800000000'],
  ...['PLTE','tRNS','gAMA','sRGB'].map(name => [`bad-${name}.png`, `89504e470d0a1a0a00000000${Buffer.from(name).toString('hex')}00000000`]),
  ['bad.webp', '524946460c000000574542504558494600000000'],
])('rejects metadata in a published %s', async (file, hex) => {
  const { dir, write } = site(); const path=`public/character-runtime/effects/${'b'.repeat(64)}/assets/${file}`;
  write(path, ''); writeFileSync(join(dir,path), Buffer.from(hex,'hex'));
  try { await expect(compile(dir)).rejects.toThrow(/Invalid runtime .* chunk/); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

it('rejects unknown non-empty effect metadata', async () => {
  const { dir, write } = site();
  write(`public/character-runtime/effects/${'b'.repeat(64)}/effect.json`, JSON.stringify({ id: 'new-effect', sprite: 'image.png' }));
  try { await expect(compile(dir)).rejects.toThrow('Unknown character effect metadata'); }
  finally { rmSync(dir, { recursive: true, force: true }); }
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
    for (const file of [named('tap', 'webp'), named('slam', 'webp')]) {
      expect(file).not.toContain('undefined'); expect(allowlist).not.toContain(file); expect(precache).not.toContain(file);
    }
    expect(worker).toMatch(/const VERSION = '[a-f0-9]{12}';/);
    expect(worker).toContain("const POLICY = 'public-build-v1';");
    expect(worker).not.toContain("const VERSION = 'dev';");
    expect(worker).not.toContain('const ALLOWLIST = [];'); expect(worker).not.toContain('const PRECACHE = [];');
    const html = readFileSync(join(output, 'index.html'), 'utf8');
    expect(html).not.toContain('kingdown-error-assets');
    const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]).filter(url => !url.startsWith('#'));
    expect(urls.some(url => url.startsWith('/assets/'))).toBe(true);
    expect(urls).toContain('/ui/pawn.webp');
    for (const path of ['/play/', '/g/game-id']) {
      for (const url of urls) expect(new URL(url, `https://kingdown.test${path}`).pathname, url).toBe(url);
    }
    expect(html).toContain('href="#piece"');
    expect(html).not.toContain('<base');
    expect(html).toContain("register('/sw.js', { scope: '/', updateViaCache: 'none' })");
    const startup = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).find(source => source.includes('serviceWorker'))!;
    for (const pathname of ['/', '/play/', '/g/game-id', '/j']) {
      const events: string[] = [];
      runInNewContext(startup, { window: {}, location: { pathname }, navigator: { serviceWorker: {} }, addEventListener: (name: string) => events.push(name) });
      expect(events).toEqual(pathname === '/' ? ['load'] : []);
    }
    expect(readFileSync(join(output, named('main')), 'utf8')).toContain('/ui/pawn.webp');
    expect(readFileSync(join(output, named('main', 'css')), 'utf8')).toMatch(/url\(["']?\/assets\//);

  } finally { rmSync(dir, { recursive: true, force: true }); }
});

it('does not change the offline cache version when only optional runtime art changes', async () => {
  const { dir, write } = site();
  try {
    write('public/character-runtime/manifest.json', '{"schemaVersion":1,"effects":{},"banks":[]}');
    await compile(dir);
    const worker = join(dir, 'dist/sw.js'), before = readFileSync(worker, 'utf8');
    write('public/character-runtime/manifest.json', '{"schemaVersion":2,"effects":{},"banks":[]}');
    await compile(dir);
    expect(readFileSync(worker, 'utf8')).toBe(before);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

it('changes the cache version when only the worker implementation changes', async () => {
  const { dir, write } = site();
  try {
    await compile(dir);
    const output = join(dir, 'dist/sw.js'), before = readFileSync(output, 'utf8');
    write('public/sw.js', readFileSync(join(dir, 'public/sw.js'), 'utf8') + '\n/* Worker-only update. */\n');
    await compile(dir);
    const after = readFileSync(output, 'utf8');
    expect(/const VERSION = '([^']+)'/.exec(after)![1]).not.toBe(/const VERSION = '([^']+)'/.exec(before)![1]);
    expect(lists(after)).toEqual(lists(before));
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

it('vercel check rejects an unknown runtime manifest key', () => {
 const dir=mkdtempSync(join(tmpdir(),'kingdown-vercel-manifest-'));
 try {
  mkdirSync(join(dir,'functions/mcp.func'),{recursive:true});mkdirSync(join(dir,'static/character-runtime'),{recursive:true});
  symlinkSync('mcp.func',join(dir,'functions/internal.func'));
  writeFileSync(join(dir,'functions/mcp.func/.vc-config.json'),JSON.stringify({handler:'server.mjs'}));
  writeFileSync(join(dir,'config.json'),JSON.stringify({version:3,routes:[{src:'^/api(?:/.*)?$',dest:'/mcp'}]}));
  writeFileSync(join(dir,'static/character-runtime/manifest.json'),JSON.stringify({schemaVersion:1,effects:{},banks:[],unexpected:'x'}));
  const result=spawnSync(process.execPath,[resolve('tools/vercel-check.mjs'),dir],{encoding:'utf8',env:{...process.env,PLUGIN_TEST_DATABASE_URL:'postgresql://127.0.0.1:55432/fixture_test'}});
  expect(result.status).toBe(1);expect(result.stderr).toContain('Unknown character manifest metadata');
 } finally {rmSync(dir,{recursive:true,force:true});}
});

it('vercel check scans runtime image bytes for metadata', () => {
 const dir=mkdtempSync(join(tmpdir(),'kingdown-vercel-image-'));
 try {
  mkdirSync(join(dir,'functions/mcp.func'),{recursive:true});const assets=join(dir,'static/character-runtime/effects', 'b'.repeat(64),'assets');mkdirSync(assets,{recursive:true});
  symlinkSync('mcp.func',join(dir,'functions/internal.func'));
  writeFileSync(join(dir,'functions/mcp.func/.vc-config.json'),JSON.stringify({handler:'server.mjs'}));
  writeFileSync(join(dir,'config.json'),JSON.stringify({version:3,routes:[{src:'^/api(?:/.*)?$',dest:'/mcp'}]}));
  writeFileSync(join(assets,'image.png'),Buffer.from('89504e470d0a1a0a000000006361425800000000','hex'));
  const result=spawnSync(process.execPath,[resolve('tools/vercel-check.mjs'),dir],{encoding:'utf8',env:{...process.env,PLUGIN_TEST_DATABASE_URL:'postgresql://127.0.0.1:55432/fixture_test'}});
  expect(result.status).toBe(1);expect(result.stderr).toContain('Invalid runtime PNG chunk');
 } finally {rmSync(dir,{recursive:true,force:true});}
});
